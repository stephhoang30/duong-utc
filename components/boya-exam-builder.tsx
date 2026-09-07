"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { loadBoyaStudyData, shuffled, type BoyaStudyData, type BoyaTerm } from "@/lib/boya-study";

type Direction = "mixed" | "hanzi" | "meaning";
type ContentType = "vocabulary" | "grammar" | "mixed";
type Mode = "setup" | "taking" | "result";
type Question = { id: string; prompt: string; label: string; options: string[]; answer: number; explanation: string };

function createVocabularyQuestions(data: BoyaStudyData, lessonNumber: number, count: number, direction: Direction) {
  const lesson = data.lessons.find((item) => item.number === lessonNumber) ?? data.lessons[0];
  const allTerms = data.lessons.flatMap((item) => item.terms);
  return shuffled(lesson.terms).slice(0, Math.min(count, lesson.terms.length)).map((term, index) => {
    const askMeaning = direction === "hanzi" || (direction === "mixed" && index % 2 === 0);
    const correct = askMeaning ? term.meaning : term.hanzi;
    const pool = shuffled(allTerms.filter((item) => item.id !== term.id).map((item) => askMeaning ? item.meaning : item.hanzi));
    const distractors = [...new Set(pool.filter((option) => option !== correct))].slice(0, 3);
    const options = shuffled([correct, ...distractors]);
    return {
      id: `${term.id}-v-${index}`,
      prompt: askMeaning ? term.hanzi : term.meaning,
      label: askMeaning ? "Chọn nghĩa đúng" : "Chọn chữ Hán đúng",
      options,
      answer: options.indexOf(correct),
      explanation: `${term.hanzi} · ${term.pinyin} · ${term.meaning}`,
    };
  });
}

function createGrammarQuestions(data: BoyaStudyData, lessonNumber: number, count: number) {
  const allGrammar = data.lessons.flatMap((lesson) => lesson.grammar.map((point, index) => ({ point, index, lesson })));
  const candidates = allGrammar.filter((entry) => entry.lesson.number <= lessonNumber);
  return shuffled(candidates).slice(0, Math.min(count, candidates.length)).map((entry, index) => {
    const distractors = shuffled(allGrammar.filter((item) => item.lesson.number !== entry.lesson.number).map((item) => item.point));
    const options = shuffled([entry.point, ...new Set(distractors)].slice(0, 4));
    return {
      id: `grammar-${entry.lesson.number}-${entry.index}-${index}`,
      prompt: entry.lesson.title,
      label: "Chọn điểm ngữ pháp thuộc bài này",
      options,
      answer: options.indexOf(entry.point),
      explanation: `${entry.lesson.title}: ${entry.point}`,
    };
  });
}

function createQuestions(data: BoyaStudyData, lessonNumber: number, count: number, direction: Direction, contentType: ContentType) {
  if (contentType === "vocabulary") return createVocabularyQuestions(data, lessonNumber, count, direction);
  if (contentType === "grammar") return createGrammarQuestions(data, lessonNumber, count);
  const grammarCount = Math.max(1, Math.floor(count / 3));
  const vocabulary = createVocabularyQuestions(data, lessonNumber, count - grammarCount, direction);
  const grammar = createGrammarQuestions(data, lessonNumber, grammarCount);
  return shuffled([...vocabulary, ...grammar]).slice(0, count);
}

const contentLabels: Record<ContentType, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  mixed: "Từ vựng + ngữ pháp",
};

export function BoyaExamBuilder({ onComplete }: { onComplete: (result: { examId: string; score: number; total: number; durationSeconds: number }) => void }) {
  const [data, setData] = useState<BoyaStudyData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lessonNumber, setLessonNumber] = useState(1);
  const [questionCount, setQuestionCount] = useState(10);
  const [direction, setDirection] = useState<Direction>("mixed");
  const [contentType, setContentType] = useState<ContentType>("mixed");
  const [mode, setMode] = useState<Mode>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => { loadBoyaStudyData().then(setData).catch(() => setLoadError(true)); }, []);
  useEffect(() => {
    if (mode !== "taking") return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const lesson = data?.lessons.find((item) => item.number === lessonNumber) ?? null;
  const score = useMemo(() => questions.filter((question) => answers[question.id] === question.answer).length, [answers, questions]);

  const start = () => {
    if (!data) return;
    const nextQuestions = createQuestions(data, lessonNumber, questionCount, direction, contentType);
    const nextDuration = Math.max(5, Math.ceil(nextQuestions.length * 0.65)) * 60;
    setQuestions(nextQuestions);
    setAnswers({});
    setDuration(nextDuration);
    setRemaining(nextDuration);
    setMode("taking");
    document.getElementById("boya-exam")?.scrollIntoView({ behavior: "smooth" });
  };

  const finish = (forced = false) => {
    if (!questions.length) return;
    const unanswered = questions.length - Object.keys(answers).length;
    if (!forced && unanswered && !window.confirm(`Còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) return;
    onComplete({ examId: `boya-${contentType}-${lessonNumber}`, score, total: questions.length, durationSeconds: duration - remaining });
    setMode("result");
    document.getElementById("boya-exam")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (mode === "taking" && duration > 0 && remaining === 0) finish(true);
    // Submit once when the active countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, mode, duration]);

  if (loadError) return <section className="panel boya-exam-panel" id="boya-exam"><p>Chưa đọc được dữ liệu BOYA. Hãy tải lại trang.</p></section>;
  if (!data || !lesson) return <section className="panel boya-exam-panel" id="boya-exam"><p>Đang chuẩn bị đề BOYA…</p></section>;

  if (mode === "taking") {
    return <section className="boya-exam-taking" id="boya-exam">
      <header className="panel boya-exam-topbar"><button className="button ghost small" onClick={() => setMode("setup")}><Icon name="arrow-left" size={17} />Thoát</button><div><span className="eyebrow">{lesson.title}</span><h2>Kiểm tra {contentLabels[contentType].toLowerCase()}</h2></div><span className="boya-exam-timer"><Icon name="timer" size={18} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span></header>
      <div className="boya-exam-progress panel-lite"><span>{Object.keys(answers).length}/{questions.length} câu</span><div className="linear-progress"><span style={{ width: `${questions.length ? Object.keys(answers).length / questions.length * 100 : 0}%` }} /></div></div>
      <form onSubmit={(event) => { event.preventDefault(); finish(); }}>
        {questions.map((question, index) => <fieldset className="question-card panel" key={question.id}><legend><span>Câu {index + 1} · {question.label}</span>{question.prompt}</legend><div className="answer-options">{question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`} className={answers[question.id] === optionIndex ? "selected" : ""}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} /><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></label>)}</div></fieldset>)}
        <div className="exam-submit-bar panel"><strong>{Object.keys(answers).length}/{questions.length} câu đã trả lời</strong><button className="button primary" type="submit">Nộp bài<Icon name="arrow-right" size={17} /></button></div>
      </form>
    </section>;
  }

  if (mode === "result") {
    const percent = Math.round(score / questions.length * 100);
    return <section className="panel boya-exam-result" id="boya-exam"><span className={`result-badge ${percent >= 80 ? "great" : percent >= 60 ? "good" : "retry"}`}><Icon name={percent >= 60 ? "sparkle" : "review"} /></span><span className="eyebrow">{lesson.title} · {contentLabels[contentType]}</span><h2>{score}/{questions.length} câu đúng · {percent}%</h2><div className="boya-result-actions"><button className="button primary" onClick={start}><Icon name="review" size={17} />Làm lại</button><button className="button secondary" onClick={() => setMode("setup")}>Chọn bài khác</button></div><div className="boya-answer-key">{questions.map((question, index) => { const correct = answers[question.id] === question.answer; return <article className={correct ? "correct" : "incorrect"} key={question.id}><span><Icon name={correct ? "check" : "x"} size={16} />Câu {index + 1}</span><strong>{question.options[question.answer]}</strong><p>{question.explanation}</p></article>; })}</div></section>;
  }

  const availableGrammar = data.lessons.filter((item) => item.number <= lessonNumber).reduce((total, item) => total + item.grammar.length, 0);
  return <section className="panel boya-exam-panel" id="boya-exam">
    <header><span className="boya-exam-icon"><Icon name="language" /></span><div><span className="eyebrow">Tạo đề từ tài liệu BOYA 1</span><h2>Kiểm tra theo bài</h2></div></header>
    <div className="boya-exam-settings">
      <label><span>Bài học</span><select value={lessonNumber} onChange={(event) => setLessonNumber(Number(event.target.value))}>{data.lessons.map((item) => <option key={item.number} value={item.number}>{item.title} · {item.terms.length} từ</option>)}</select></label>
      <label><span>Nội dung</span><select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)}><option value="mixed">Từ vựng + ngữ pháp</option><option value="vocabulary">Chỉ từ vựng</option><option value="grammar">Chỉ ngữ pháp</option></select></label>
      <label><span>Số câu</span><select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}><option value={10}>10 câu</option><option value={15}>15 câu</option><option value={20}>20 câu</option></select></label>
      <label><span>Dạng từ vựng</span><select value={direction} disabled={contentType === "grammar"} onChange={(event) => setDirection(event.target.value as Direction)}><option value="mixed">Trộn Hán ↔ Việt</option><option value="hanzi">Hán → nghĩa Việt</option><option value="meaning">Nghĩa Việt → Hán</option></select></label>
      <button className="button primary" onClick={start}><Icon name="play" size={18} />Bắt đầu</button>
    </div>
    <div className="boya-exam-summary"><span><Icon name="book" size={17} />{lesson.terms.length} từ của bài</span><span><Icon name="layers" size={17} />{availableGrammar} điểm ngữ pháp đến Bài {lessonNumber}</span><a href={lesson.quizletHref} target="_blank" rel="noreferrer">Nguồn Quizlet<Icon name="external-link" size={15} /></a></div>
  </section>;
}
