"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { BoyaExamBuilder } from "@/components/boya-exam-builder";
import { HskExamRoom } from "@/components/hsk-exam-room";
import { EmptyState, PageHeader, PageSkeleton, SectionHeading, SubjectPill } from "@/components/ui";
import { exams } from "@/lib/data";
import { usePlanner } from "@/lib/planner-context";

type ExamMode = "catalog" | "taking" | "result";

export default function ExamsPage() {
  const { state, ready, saveExamResult } = usePlanner();
  const [mode, setMode] = useState<ExamMode>("catalog");
  const [selectedId, setSelectedId] = useState(exams[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(exams[0].durationMinutes * 60);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const selected = exams.find((exam) => exam.id === selectedId) ?? exams[0];

  useEffect(() => {
    if (mode !== "taking") return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === "taking" && remaining === 0) finishExam(true);
    // finishExam intentionally uses the latest answers when the timer reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, mode]);

  const latestByExam = useMemo(() => {
    return Object.fromEntries(exams.map((exam) => [exam.id, state.examResults.find((item) => item.examId === exam.id)]));
  }, [state.examResults]);

  function startExam(examId: string) {
    const exam = exams.find((item) => item.id === examId) ?? exams[0];
    setSelectedId(exam.id);
    setAnswers({});
    setResult(null);
    setRemaining(exam.durationMinutes * 60);
    setMode("taking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishExam(forced = false) {
    const unanswered = selected.questions.length - Object.keys(answers).length;
    if (!forced && unanswered > 0 && !window.confirm(`Dương còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) return;
    const score = selected.questions.filter((question) => answers[question.id] === question.answer).length;
    const durationSeconds = selected.durationMinutes * 60 - remaining;
    const nextResult = { score, total: selected.questions.length };
    setResult(nextResult);
    saveExamResult({ examId: selected.id, score, total: selected.questions.length, durationSeconds });
    setMode("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready) return <PageSkeleton />;

  if (mode === "taking") {
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, "0");
    const answered = Object.keys(answers).length;
    return (
      <div className="page exam-taking-page">
        <header className="exam-topbar panel">
          <button className="button ghost small" onClick={() => { if (window.confirm("Thoát bài thi? Các câu trả lời hiện tại sẽ không được lưu.")) setMode("catalog"); }}><Icon name="arrow-left" size={17} />Thoát</button>
          <div><SubjectPill subject={selected.subject} compact /><h1>{selected.title}</h1></div>
          <div className={`exam-timer ${remaining < 60 ? "is-urgent" : ""}`} aria-live="polite"><Icon name="timer" size={19} /><strong>{minutes}:{seconds}</strong></div>
        </header>
        <div className="exam-progress panel-lite"><div><span>Tiến độ</span><strong>{answered}/{selected.questions.length} câu</strong></div><div className="linear-progress"><span style={{ width: `${(answered / selected.questions.length) * 100}%` }} /></div></div>
        <form className="exam-sheet" onSubmit={(event) => { event.preventDefault(); finishExam(); }}>
          {selected.questions.map((question, index) => (
            <fieldset className="question-card panel" key={question.id}>
              <legend><span>Câu {index + 1}</span>{question.prompt}</legend>
              <div className="answer-options">
                {question.options.map((option, optionIndex) => (
                  <label key={option} className={answers[question.id] === optionIndex ? "selected" : ""}>
                    <input type="radio" name={question.id} value={optionIndex} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />
                    <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="exam-submit-bar panel"><div><strong>{answered}/{selected.questions.length} câu đã trả lời</strong><span>Kiểm tra lại trước khi nộp.</span></div><button type="submit" className="button primary">Nộp bài<Icon name="arrow-right" size={18} /></button></div>
        </form>
      </div>
    );
  }

  if (mode === "result" && result) {
    const percent = Math.round((result.score / result.total) * 100);
    return (
      <div className="page exam-result-page">
        <section className="result-hero panel">
          <span className={`result-badge ${percent >= 80 ? "great" : percent >= 60 ? "good" : "retry"}`}><Icon name={percent >= 60 ? "sparkle" : "review"} size={28} /></span>
          <span className="eyebrow">Kết quả đã được lưu</span>
          <h1>{percent >= 80 ? "Làm rất tốt, Dương!" : percent >= 60 ? "Nền tảng khá ổn rồi." : "Mình ôn lại rồi thử thêm lần nữa nhé."}</h1>
          <p>{selected.title}</p>
          <div className="score-circle"><strong>{result.score}/{result.total}</strong><span>{percent}% chính xác</span></div>
          <div className="result-actions"><button className="button primary" onClick={() => startExam(selected.id)}><Icon name="review" size={18} />Làm lại</button><button className="button secondary" onClick={() => setMode("catalog")}>Chọn bài khác</button></div>
        </section>

        <section className="answer-review">
          <SectionHeading icon="book" title="Xem lại từng câu" description="Hiểu vì sao đúng hoặc sai quan trọng hơn con số cuối cùng" />
          {selected.questions.map((question, index) => {
            const userAnswer = answers[question.id];
            const correct = userAnswer === question.answer;
            return (
              <article className={`review-answer panel ${correct ? "correct" : "incorrect"}`} key={question.id}>
                <div className="review-answer-status"><span><Icon name={correct ? "check" : "x"} size={18} /></span><strong>Câu {index + 1} · {correct ? "Đúng" : "Chưa đúng"}</strong></div>
                <h3>{question.prompt}</h3>
                <p>Dương chọn: <b>{userAnswer === undefined ? "Chưa trả lời" : question.options[userAnswer]}</b></p>
                {!correct && <p>Đáp án đúng: <b>{question.options[question.answer]}</b></p>}
                <div className="explanation"><Icon name="sparkle" size={17} /><span>{question.explanation}</span></div>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  return (
    <div className="page exams-page">
      <PageHeader eyebrow="Phòng thi" title="Luyện BOYA & thi thử HSK" description="Tạo đề theo bài hoặc mở đề HSK đã lưu ngay trong website." sticker="exam" stickerTone="blue" />
      <BoyaExamBuilder onComplete={saveExamResult} />
      <HskExamRoom onComplete={saveExamResult} />
      <section className="exam-overview-grid">
        <article className="exam-overview-card tone-violet"><span><Icon name="exam" /></span><div><strong>{state.examResults.length}</strong><small>lượt đã hoàn thành</small></div></article>
        <article className="exam-overview-card tone-jade"><span><Icon name="target" /></span><div><strong>{state.examResults.length ? Math.round(state.examResults.reduce((sum, item) => sum + item.score / item.total * 100, 0) / state.examResults.length) : "—"}{state.examResults.length ? "%" : ""}</strong><small>điểm trung bình</small></div></article>
        <article className="exam-overview-card tone-coral"><span><Icon name="timer" /></span><div><strong>687</strong><small>từ BOYA để tạo đề</small></div></article>
      </section>
      <section>
        <SectionHeading icon="exam" title="Đề các môn khác" description="Các bài thi Dương đã có sẵn trong planner" />
        <div className="exam-catalog">
          {exams.map((exam) => {
            const previous = latestByExam[exam.id];
            return (
              <article key={exam.id} className="exam-card panel">
                <div className="exam-card-top"><SubjectPill subject={exam.subject} /><span><Icon name="clock" size={15} />{exam.durationMinutes} phút</span></div>
                <h2>{exam.title}</h2>
                <p>{exam.description}</p>
                <div className="exam-card-meta"><span>{exam.questions.length} câu trắc nghiệm</span>{previous ? <span className="previous-score">Lần gần nhất: <b>{previous.score}/{previous.total}</b></span> : <span>Chưa làm lần nào</span>}</div>
                <button className="button primary full" onClick={() => startExam(exam.id)}><Icon name="play" size={17} />Bắt đầu làm bài</button>
              </article>
            );
          })}
        </div>
      </section>
      {!state.examResults.length && <EmptyState icon="sparkle" title="Một mẹo nhỏ trước khi thi" description="Đặt điện thoại ở chế độ im lặng, chuẩn bị giấy nháp và chỉ xem lời giải sau khi đã nộp bài." />}
    </div>
  );
}
