"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { getBoyaLessonAudio, getBoyaLessonPdf, localChineseAssets } from "@/lib/chinese-resources";
import { loadBoyaStudyData, type BoyaLesson, type BoyaStudyData } from "@/lib/boya-study";
import {
  formatNextReview,
  isVocabularyDue,
  memoryLevels,
  previewVocabularyReview,
  scheduleVocabularyReview,
  type RecallRating,
  type VocabularyReviewProgress,
  type VocabularyReviewRecord,
} from "@/lib/spaced-repetition";

type ReviewMode = "vocabulary" | "grammar" | "listening";

const legacyVocabularyStorageKey = "duong-boya-known-terms";
const vocabularyStorageKey = "duong-boya-srs-v1";
const vocabularyMetaStorageKey = "duong-boya-srs-meta-v1";
const grammarStorageKey = "duong-boya-known-grammar";

type VocabularyReviewMeta = {
  streak: number;
  lastStudyDate?: string;
};

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

function localDayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function updateReviewStreak(meta: VocabularyReviewMeta, now = new Date()): VocabularyReviewMeta {
  const today = localDayKey(now);
  if (meta.lastStudyDate === today) return meta;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    streak: meta.lastStudyDate === localDayKey(yesterday) ? meta.streak + 1 : 1,
    lastStudyDate: today,
  };
}

function readVocabularyProgress() {
  try {
    const saved = localStorage.getItem(vocabularyStorageKey);
    if (saved) return JSON.parse(saved) as VocabularyReviewProgress;

    const knownTerms = readSavedSet(legacyVocabularyStorageKey);
    if (!knownTerms.size) return {};
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    return Object.fromEntries([...knownTerms].map((id) => [id, {
      level: 2,
      dueAt: tomorrow,
      firstLearnedAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
      reviewCount: 1,
      lapseCount: 0,
    }])) as VocabularyReviewProgress;
  } catch {
    return {};
  }
}

function readVocabularyMeta(): VocabularyReviewMeta {
  try {
    return JSON.parse(localStorage.getItem(vocabularyMetaStorageKey) ?? "{\"streak\":0}") as VocabularyReviewMeta;
  } catch {
    return { streak: 0 };
  }
}

const ratingContent: Record<RecallRating, { label: string; detail: string; icon: "review" | "clock" | "check" | "sparkle" }> = {
  again: { label: "Quên", detail: "Học lại từ đầu", icon: "review" },
  hard: { label: "Khó", detail: "Gặp lại sớm", icon: "clock" },
  good: { label: "Nhớ", detail: "Tăng một mức", icon: "check" },
  easy: { label: "Rất nhớ", detail: "Giãn lịch lâu hơn", icon: "sparkle" },
};

function VocabularyDeck({ lesson, totalTerms }: { lesson: BoyaLesson; totalTerms: number }) {
  const terms = lesson.terms;
  const [progress, setProgress] = useState<VocabularyReviewProgress>({});
  const [meta, setMeta] = useState<VocabularyReviewMeta>({ streak: 0 });
  const [storageReady, setStorageReady] = useState(false);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [sessionSize, setSessionSize] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setProgress(readVocabularyProgress());
    setMeta(readVocabularyMeta());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(vocabularyStorageKey, JSON.stringify(progress));
      localStorage.setItem(vocabularyMetaStorageKey, JSON.stringify(meta));
    } catch {
      // Keep reviews usable when browser storage is unavailable.
    }
  }, [meta, progress, storageReady]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setReviewStarted(false);
    setQueue([]);
    setSessionSize(0);
    setRevealed(false);
  }, [lesson.number]);

  const termsById = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);
  const dueTerms = useMemo(() => terms
    .filter((term) => isVocabularyDue(progress[term.id], now))
    .sort((left, right) => {
      const leftDue = progress[left.id]?.dueAt;
      const rightDue = progress[right.id]?.dueAt;
      if (leftDue && !rightDue) return -1;
      if (!leftDue && rightDue) return 1;
      return (leftDue ?? "").localeCompare(rightDue ?? "");
    }), [now, progress, terms]);
  const learnedInLesson = useMemo(() => terms.filter((term) => progress[term.id]).length, [progress, terms]);
  const learnedTotal = Object.keys(progress).length;
  const levelCounts = useMemo(() => memoryLevels.map(({ level }) => ({
    level,
    count: terms.filter((term) => (progress[term.id]?.level ?? 1) === level).length,
  })), [progress, terms]);
  const maxLevelCount = Math.max(1, ...levelCounts.map((item) => item.count));
  const nextScheduled = useMemo(() => terms
    .map((term) => progress[term.id])
    .filter((record): record is VocabularyReviewRecord => Boolean(record))
    .filter((record) => !isVocabularyDue(record, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0], [now, progress, terms]);
  const currentTerm = termsById.get(queue[0] ?? "");
  const currentRecord = currentTerm ? progress[currentTerm.id] : undefined;
  const reverseCard = Boolean(currentRecord && currentRecord.level >= 3 && currentRecord.reviewCount % 2 === 1);
  const reviewedCount = Math.max(0, sessionSize - queue.length);

  const startReview = useCallback(() => {
    const candidates = dueTerms.length
      ? dueTerms
      : [...terms].sort((left, right) => (progress[left.id]?.dueAt ?? "").localeCompare(progress[right.id]?.dueAt ?? ""));
    const nextQueue = candidates.slice(0, dueTerms.length ? 20 : 5).map((term) => term.id);
    setQueue(nextQueue);
    setSessionSize(nextQueue.length);
    setReviewStarted(true);
    setRevealed(false);
  }, [dueTerms, progress, terms]);

  const rateTerm = useCallback((rating: RecallRating) => {
    if (!currentTerm) return;
    const ratedAt = new Date();
    setProgress((current) => ({
      ...current,
      [currentTerm.id]: scheduleVocabularyReview(current[currentTerm.id], rating, ratedAt),
    }));
    setMeta((current) => updateReviewStreak(current, ratedAt));
    setQueue((current) => {
      const [ratedId, ...remaining] = current;
      if (rating !== "again" || !ratedId) return remaining;
      const repeatAfter = Math.min(4, remaining.length);
      return [...remaining.slice(0, repeatAfter), ratedId, ...remaining.slice(repeatAfter)];
    });
    setRevealed(false);
    setNow(ratedAt);
  }, [currentTerm]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName)) return;
      if (!reviewStarted || !currentTerm) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setRevealed(true);
      }
      if (event.key.toLowerCase() === "a") speakChinese(currentTerm.hanzi);
      if (event.key === "Escape") setReviewStarted(false);
      if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
        const ratings: RecallRating[] = ["again", "hard", "good", "easy"];
        rateTerm(ratings[Number(event.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentTerm, rateTerm, revealed, reviewStarted]);

  if (!terms.length) return <div className="boya-quizlet-message">Bài này chưa có từ vựng.</div>;

  if (!reviewStarted) return <div className="srs-dashboard">
    <section className="srs-overview" aria-labelledby="memory-map-title">
      <header className="srs-section-head">
        <div><span className="eyebrow">Lịch nhớ của bài {lesson.number}</span><h3 id="memory-map-title">5 mức ghi nhớ</h3></div>
        <span className="srs-lesson-progress">Đã học {learnedInLesson}/{terms.length}</span>
      </header>
      <div className="srs-level-chart" role="img" aria-label={levelCounts.map(({ level, count }) => `Mức ${level}: ${count} từ`).join(", ")}>
        {levelCounts.map(({ level, count }) => {
          const levelCopy = memoryLevels[level - 1];
          return <div className={`srs-level srs-level-${level}`} key={level}>
            <span className="srs-level-count">{count}</span>
            <div className="srs-level-track"><span style={{ height: count ? `${Math.max(9, count / maxLevelCount * 100)}%` : "0" }} /></div>
            <strong>{level}</strong>
            <small>{levelCopy.shortLabel}</small>
          </div>;
        })}
      </div>
      <p className="srs-chart-note">Từ khó xuất hiện dày hơn; từ đã nhớ tốt sẽ được giãn lịch dần.</p>
    </section>

    <aside className="srs-summary">
      <article><span className="srs-summary-icon tone-blue"><Icon name="book" size={21} /></span><div><strong>{learnedTotal}</strong><span>từ BOYA đã học</span><small>{totalTerms - Math.min(totalTerms, learnedTotal)} từ chưa mở</small></div></article>
      <article><span className="srs-summary-icon tone-coral"><Icon name="flame" size={21} /></span><div><strong>{meta.streak}</strong><span>ngày học liên tục</span><small>Một lượt ôn cũng được tính</small></div></article>
      <article className={dueTerms.length ? "is-due" : ""}><span className="srs-summary-icon tone-jade"><Icon name="timer" size={21} /></span><div><strong>{dueTerms.length ? "Bây giờ" : nextScheduled ? formatNextReview(nextScheduled.dueAt, now) : "Sẵn sàng"}</strong><span>thời điểm ôn tốt nhất</span><small>{dueTerms.length ? `${dueTerms.length} từ đang đến hạn` : "Planner sẽ giữ đúng lịch"}</small></div></article>
    </aside>

    <div className="srs-start-card">
      <div><span className="eyebrow">Phiên ngắn · tối đa 20 từ</span><h3>{dueTerms.length ? `${dueTerms.length} từ đang chờ Dương` : "Hôm nay đã ôn đúng lịch"}</h3><p>{dueTerms.length ? "Tự nhớ nghĩa trước khi lật thẻ, sau đó chọn đúng mức độ nhớ." : "Có thể nghỉ hoặc ôn sớm một lượt ngắn để củng cố."}</p></div>
      <button className="button primary srs-start-button" onClick={startReview}><Icon name="play" size={18} />{dueTerms.length ? "Ôn tập ngay" : "Ôn sớm 5 từ"}</button>
    </div>

    <div className="srs-source-note"><Icon name="layers" size={17} /><span>Lịch ôn 5 mức chạy ngay trên thiết bị. Dữ liệu từ vựng: <a href={lesson.quizletHref} target="_blank" rel="noreferrer">Quizlet BOYA · {totalTerms} từ</a>.</span></div>
  </div>;

  if (!currentTerm) return <div className="srs-session-finished">
    <span><Icon name="check" size={28} /></span>
    <h3>Đã xong phiên ôn</h3>
    <p>Dương vừa ôn {sessionSize} từ. Lịch gặp lại đã được tính riêng cho từng từ.</p>
    <button className="button primary" onClick={() => setReviewStarted(false)}>Xem lịch ghi nhớ</button>
  </div>;

  const previews = Object.fromEntries((["again", "hard", "good", "easy"] as RecallRating[]).map((rating) => [rating, previewVocabularyReview(currentRecord, rating, now)])) as Record<RecallRating, ReturnType<typeof previewVocabularyReview>>;

  return <div className="srs-review-session">
    <div className="srs-session-topbar">
      <button className="button ghost small" onClick={() => setReviewStarted(false)}><Icon name="arrow-left" size={17} />Lịch ôn</button>
      <div className="srs-session-progress"><span>{reviewedCount}/{sessionSize} từ</span><div className="linear-progress"><span style={{ width: `${sessionSize ? reviewedCount / sessionSize * 100 : 0}%` }} /></div></div>
      <span className={`srs-current-level level-${currentRecord?.level ?? 1}`}>Mức {currentRecord?.level ?? 1}</span>
    </div>

    <button className={`boya-study-card srs-study-card ${revealed ? "is-revealed" : ""}`} onClick={() => setRevealed(true)} aria-label={revealed ? "Đáp án đã hiện" : "Chạm để hiện đáp án"}>
      <span className="boya-card-counter">Còn {queue.length} từ</span>
      <span className="boya-card-side">{reverseCard ? "Nhớ chữ Hán" : "Nhớ nghĩa"}</span>
      {!revealed ? reverseCard
        ? <span className="srs-reverse-prompt"><small>Từ nào có nghĩa là</small><strong>{currentTerm.meaning}</strong></span>
        : <strong className="boya-card-hanzi">{currentTerm.hanzi}</strong>
      : <span className="boya-card-answer">
          <b className="srs-answer-hanzi">{currentTerm.hanzi}</b>
          <strong>{currentTerm.pinyin}</strong>
          <b>{currentTerm.meaning}</b>
          {currentTerm.wordClass && <small>{currentTerm.wordClass}</small>}
          <em>Đọc thành tiếng và tự nói một câu có từ này.</em>
        </span>}
      <span className="boya-card-flip"><Icon name={revealed ? "target" : "review"} size={16} />{revealed ? "Chọn mức nhớ bên dưới" : "Tự trả lời rồi chạm để xem"}</span>
    </button>

    <div className="srs-card-tools">
      <button onClick={() => speakChinese(currentTerm.hanzi)} aria-label={`Nghe phát âm ${currentTerm.hanzi}`}><Icon name="volume" size={20} />Nghe từ <kbd>A</kbd></button>
      <span>{reverseCard ? "Luyện nhớ chủ động: nghĩa → chữ" : "Luyện nhận diện: chữ → nghĩa"}</span>
    </div>

    {revealed ? <div className="srs-rating-grid" aria-label="Đánh giá mức độ nhớ">
      {(["again", "hard", "good", "easy"] as RecallRating[]).map((rating, index) => <button className={`srs-rating-${rating}`} key={rating} onClick={() => rateTerm(rating)}>
        <Icon name={ratingContent[rating].icon} size={19} />
        <span><strong>{ratingContent[rating].label}</strong><small>{ratingContent[rating].detail}</small></span>
        <b>{previews[rating].intervalLabel}</b><kbd>{index + 1}</kbd>
      </button>)}
    </div> : <p className="srs-keyboard-tip">Nhấn <kbd>Space</kbd> để lật · <kbd>A</kbd> để nghe · sau khi lật chọn <kbd>1–4</kbd></p>}
  </div>;
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
