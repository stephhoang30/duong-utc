"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { getBoyaLessonAudio, getBoyaLessonPdf, localChineseAssets } from "@/lib/chinese-resources";
import { loadBoyaStudyData, shuffled, type BoyaLesson, type BoyaStudyData } from "@/lib/boya-study";

type ReviewMode = "vocabulary" | "grammar" | "listening";

const vocabularyStorageKey = "duong-boya-known-terms";
const grammarStorageKey = "duong-boya-known-grammar";

function readSavedSet(key: string) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function saveSet(key: string, values: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    // Keep the study flow usable when browser storage is unavailable.
  }
}

function speakChinese(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function VocabularyDeck({ lesson, totalTerms }: { lesson: BoyaLesson; totalTerms: number }) {
  const terms = lesson.terms;
  const [order, setOrder] = useState<number[]>(() => terms.map((_, index) => index));
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  useEffect(() => setKnownIds(readSavedSet(vocabularyStorageKey)), []);
  useEffect(() => {
    setOrder(terms.map((_, index) => index));
    setPosition(0);
    setRevealed(false);
  }, [lesson.number, terms]);

  const currentTerm = terms[order[position] ?? 0] ?? terms[0];
  const knownInLesson = useMemo(() => terms.filter((term) => knownIds.has(term.id)).length, [knownIds, terms]);

  const goTo = useCallback((nextPosition: number) => {
    if (!order.length) return;
    setPosition((nextPosition + order.length) % order.length);
    setRevealed(false);
  }, [order.length]);

  const markTerm = (known: boolean) => {
    if (!currentTerm) return;
    const next = new Set(knownIds);
    if (known) next.add(currentTerm.id);
    else next.delete(currentTerm.id);
    setKnownIds(next);
    saveSet(vocabularyStorageKey, next);
    goTo(position + 1);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") goTo(position - 1);
      if (event.key === "ArrowRight") goTo(position + 1);
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, position]);

  if (!currentTerm) return <div className="boya-quizlet-message">Bài này chưa có từ vựng.</div>;

  return <>
    <div className="boya-mastery-row">
      <div><span>Đã nhớ {knownInLesson}/{terms.length}</span><div className="linear-progress"><span style={{ width: `${terms.length ? knownInLesson / terms.length * 100 : 0}%` }} /></div></div>
      <a href={lesson.quizletHref} target="_blank" rel="noreferrer"><Icon name="external-link" size={15} />Nguồn Quizlet · {totalTerms} từ</a>
    </div>

    <button className={`boya-study-card ${revealed ? "is-revealed" : ""}`} onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Đang hiện đáp án. Chạm để xem chữ Hán" : "Đang hiện chữ Hán. Chạm để xem đáp án"}>
      <span className="boya-card-counter">{position + 1} / {terms.length}</span>
      <span className="boya-card-side">{revealed ? "Nghĩa và phát âm" : "Chữ Hán"}</span>
      {revealed ? <span className="boya-card-answer"><strong>{currentTerm.pinyin}</strong><b>{currentTerm.meaning}</b>{currentTerm.wordClass && <small>{currentTerm.wordClass}</small>}</span> : <strong className="boya-card-hanzi">{currentTerm.hanzi}</strong>}
      <span className="boya-card-flip"><Icon name="review" size={16} />Chạm để lật thẻ</span>
    </button>

    <div className="boya-card-controls" aria-label="Điều khiển bộ thẻ">
      <button onClick={() => { setOrder(shuffled(terms.map((_, index) => index))); setPosition(0); setRevealed(false); }} aria-label="Trộn thẻ"><Icon name="sparkle" size={19} /><span>Trộn</span></button>
      <button onClick={() => goTo(position - 1)} aria-label="Thẻ trước"><Icon name="arrow-left" size={21} /></button>
      <button className="speak" onClick={() => speakChinese(currentTerm.hanzi)} aria-label={`Nghe phát âm ${currentTerm.hanzi}`}><Icon name="volume" size={21} /></button>
      <button onClick={() => goTo(position + 1)} aria-label="Thẻ tiếp theo"><Icon name="arrow-right" size={21} /></button>
    </div>

    <div className="boya-memory-actions">
      <button className="needs-review" onClick={() => markTerm(false)}><Icon name="review" size={17} /><span><strong>Cần ôn lại</strong><small>Đưa từ sang lượt tiếp theo</small></span></button>
      <button className={`remembered ${knownIds.has(currentTerm.id) ? "is-known" : ""}`} onClick={() => markTerm(true)}><Icon name="check" size={17} /><span><strong>Đã nhớ</strong><small>Lưu tiến độ trên thiết bị</small></span></button>
    </div>
  </>;
}

function GrammarDeck({ lesson }: { lesson: BoyaLesson }) {
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const points = lesson.grammar;
  const current = points[position] ?? points[0];
  const currentId = `grammar-${lesson.number}-${position}`;
  const knownCount = points.filter((_, index) => knownIds.has(`grammar-${lesson.number}-${index}`)).length;

  useEffect(() => setKnownIds(readSavedSet(grammarStorageKey)), []);
  useEffect(() => { setPosition(0); setRevealed(false); }, [lesson.number]);

  const goTo = (next: number) => {
    if (!points.length) return;
    setPosition((next + points.length) % points.length);
    setRevealed(false);
  };

  const mark = (known: boolean) => {
    const next = new Set(knownIds);
    if (known) next.add(currentId);
    else next.delete(currentId);
    setKnownIds(next);
    saveSet(grammarStorageKey, next);
    goTo(position + 1);
  };

  if (!current) return <div className="boya-quizlet-message">Bài này chưa có điểm ngữ pháp.</div>;

  return <>
    <div className="boya-mastery-row">
      <div><span>Đã nhớ {knownCount}/{points.length}</span><div className="linear-progress"><span style={{ width: `${knownCount / points.length * 100}%` }} /></div></div>
      <a href={localChineseAssets.grammar} download><Icon name="download" size={15} />Bảng ngữ pháp đầy đủ</a>
    </div>
    <button className={`boya-study-card grammar-card ${revealed ? "is-revealed" : ""}`} onClick={() => setRevealed((value) => !value)} aria-label="Lật thẻ ngữ pháp">
      <span className="boya-card-counter">{position + 1} / {points.length}</span>
      <span className="boya-card-side">Ngữ pháp</span>
      {revealed
        ? <span className="boya-card-answer"><small>{lesson.title}</small><b>{current}</b><em>Tự đặt một câu có dùng cấu trúc này trước khi đánh dấu đã nhớ.</em></span>
        : <span className="grammar-recall"><Icon name="layers" size={30} /><strong>Điểm ngữ pháp số {position + 1}</strong><small>Dương thử nhắc lại quy tắc của bài trước khi lật thẻ.</small></span>}
      <span className="boya-card-flip"><Icon name="review" size={16} />Chạm để lật thẻ</span>
    </button>
    <div className="boya-card-controls" aria-label="Điều khiển thẻ ngữ pháp">
      <button onClick={() => goTo(position - 1)} aria-label="Thẻ trước"><Icon name="arrow-left" size={21} /></button>
      <button onClick={() => goTo(position + 1)} aria-label="Thẻ tiếp theo"><Icon name="arrow-right" size={21} /></button>
    </div>
    <div className="boya-memory-actions">
      <button className="needs-review" onClick={() => mark(false)}><Icon name="review" size={17} /><span><strong>Cần ôn lại</strong><small>Chưa tự đặt được câu</small></span></button>
      <button className={`remembered ${knownIds.has(currentId) ? "is-known" : ""}`} onClick={() => mark(true)}><Icon name="check" size={17} /><span><strong>Đã nhớ</strong><small>Đã hiểu và tự đặt được câu</small></span></button>
    </div>
  </>;
}

function ListeningLab({ lesson }: { lesson: BoyaLesson }) {
  const [termIndex, setTermIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const current = lesson.terms[termIndex] ?? lesson.terms[0];

  useEffect(() => { setTermIndex(0); setAnswer(""); setChecked(false); }, [lesson.number]);

  const nextTerm = () => {
    setTermIndex((index) => (index + 1) % lesson.terms.length);
    setAnswer("");
    setChecked(false);
  };
  const normalizedAnswer = answer.replace(/\s+/g, "").trim();
  const isCorrect = Boolean(checked && normalizedAnswer && normalizedAnswer === current?.hanzi.replace(/\s+/g, ""));

  if (!current) return <div className="boya-quizlet-message">Bài này chưa có dữ liệu nghe.</div>;

  return <div className="boya-listening-layout">
    <section className="boya-lesson-audio">
      <span className="boya-mode-icon"><Icon name="headphones" size={22} /></span>
      <div><span className="eyebrow">Bài khóa · {lesson.title}</span><h3>Nghe trọn bài</h3><p>Nghe một lượt không nhìn tài liệu, lượt hai ghi ý chính, lượt ba đối chiếu PDF.</p></div>
      <audio key={lesson.number} controls preload="metadata" src={getBoyaLessonAudio(lesson.number)}>Trình duyệt chưa hỗ trợ phát audio.</audio>
      <a className="button ghost small" href={getBoyaLessonAudio(lesson.number)} download><Icon name="download" size={16} />Tải MP3</a>
    </section>

    <section className="boya-dictation-card">
      <div className="boya-dictation-head"><div><span className="eyebrow">Nghe – chép từ vựng</span><h3>Từ {termIndex + 1}/{lesson.terms.length}</h3></div><button className="boya-listen-button" onClick={() => speakChinese(current.hanzi)} aria-label="Nghe từ cần chép"><Icon name="volume" size={23} />Nghe từ</button></div>
      <label className="boya-dictation-input"><span>Gõ chữ Hán nghe được</span><input value={answer} onChange={(event) => { setAnswer(event.target.value); setChecked(false); }} onKeyDown={(event) => { if (event.key === "Enter" && answer.trim()) setChecked(true); }} placeholder="输入汉字…" lang="zh" /></label>
      {checked && <div className={`boya-dictation-feedback ${isCorrect ? "correct" : "incorrect"}`} role="status"><Icon name={isCorrect ? "check" : "review"} size={19} /><div><strong>{isCorrect ? "Chính xác" : `Đáp án: ${current.hanzi}`}</strong><span>{current.pinyin} · {current.meaning}</span></div></div>}
      <div className="boya-dictation-actions"><button className="button secondary" onClick={() => setChecked(true)} disabled={!answer.trim()}>Kiểm tra</button><button className="button ghost" onClick={nextTerm}>Từ tiếp theo<Icon name="arrow-right" size={17} /></button></div>
    </section>
  </div>;
}

export function BoyaReviewDeck({ initialLesson = 1 }: { initialLesson?: number }) {
  const [data, setData] = useState<BoyaStudyData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lessonNumber, setLessonNumber] = useState(initialLesson);
  const [mode, setMode] = useState<ReviewMode>("vocabulary");

  useEffect(() => { loadBoyaStudyData().then(setData).catch(() => setLoadError(true)); }, []);
  const lesson = data?.lessons.find((item) => item.number === lessonNumber) ?? null;

  if (loadError) return <section className="panel boya-quizlet-message"><Icon name="clock" /><span>Chưa đọc được dữ liệu BOYA. Hãy tải lại trang.</span></section>;
  if (!data || !lesson) return <section className="panel boya-quizlet-message"><span className="loading-line" />Đang mở bộ học BOYA…</section>;

  return <section className="panel boya-quizlet-panel" aria-labelledby="boya-review-title">
    <header className="boya-quizlet-head">
      <div><span className="eyebrow">BOYA 1 · Học theo bài</span><h2 id="boya-review-title">{lesson.title}</h2></div>
      <label className="boya-review-lesson"><span>Chọn bài</span><select value={lessonNumber} onChange={(event) => setLessonNumber(Number(event.target.value))}>{data.lessons.map((item) => <option key={item.number} value={item.number}>{item.title} · {item.terms.length} từ</option>)}</select></label>
    </header>

    <div className="boya-study-tabs" role="tablist" aria-label="Chọn cách ôn BOYA">
      <button role="tab" aria-selected={mode === "vocabulary"} className={mode === "vocabulary" ? "active" : ""} onClick={() => setMode("vocabulary")}><Icon name="review" size={18} /><span>Từ vựng</span><small>{lesson.terms.length}</small></button>
      <button role="tab" aria-selected={mode === "grammar"} className={mode === "grammar" ? "active" : ""} onClick={() => setMode("grammar")}><Icon name="layers" size={18} /><span>Ngữ pháp</span><small>{lesson.grammar.length}</small></button>
      <button role="tab" aria-selected={mode === "listening"} className={mode === "listening" ? "active" : ""} onClick={() => setMode("listening")}><Icon name="headphones" size={18} /><span>Nghe – chép</span></button>
    </div>

    <div className="boya-lesson-resources" aria-label="Tài liệu của bài đang học">
      {lesson.number !== 21 && <a href={getBoyaLessonPdf(lesson.number)} target="_blank" rel="noreferrer"><Icon name="file" size={16} />PDF Bài {lesson.number}</a>}
      <a href={`${localChineseAssets.pdfRoot}/bai-tap-boya-1-30.pdf`} target="_blank" rel="noreferrer"><Icon name="book" size={16} />Bài tập</a>
      <a href={`${localChineseAssets.pdfRoot}/dap-an-boya-1.pdf`} target="_blank" rel="noreferrer"><Icon name="check" size={16} />Đáp án</a>
      <a href={`${localChineseAssets.pdfRoot}/vo-luyen-viet.pdf`} target="_blank" rel="noreferrer"><Icon name="notebook" size={16} />Luyện viết</a>
    </div>

    {mode === "vocabulary" && <VocabularyDeck lesson={lesson} totalTerms={data.totalTerms} />}
    {mode === "grammar" && <GrammarDeck lesson={lesson} />}
    {mode === "listening" && <ListeningLab lesson={lesson} />}
  </section>;
}
