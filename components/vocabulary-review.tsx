"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import type { BoyaTerm } from "@/lib/boya-study";
import type { VocabularyStudyMode } from "@/lib/vocabulary-study";
import {
  buildCharacterBank,
  buildVocabularyChoices,
  getHanziCharacters,
  normalizeHanziAnswer,
  selectVocabularyExercise,
  type VocabularyExerciseType,
} from "@/lib/vocabulary-exercises";
import {
  previewVocabularyReview,
  type RecallRating,
  type VocabularyReviewProgress,
} from "@/lib/spaced-repetition";

type AnswerResult = {
  correct: boolean;
  rating: RecallRating;
  selectedId?: string;
};

const exerciseCopy: Record<VocabularyExerciseType, { label: string; instruction: string; icon: "review" | "language" | "headphones" | "text-size" }> = {
  "meaning-choice": { label: "Chọn nghĩa", instruction: "Chọn nghĩa tiếng Việt đúng", icon: "review" },
  "hanzi-choice": { label: "Chọn chữ Hán", instruction: "Chọn từ tiếng Trung phù hợp", icon: "language" },
  "listening-choice": { label: "Nghe và chọn", instruction: "Nghe từ rồi chọn nghĩa đúng", icon: "headphones" },
  "hanzi-input": { label: "Điền chữ", instruction: "Hoàn thành từ tiếng Trung", icon: "text-size" },
};

function speakChinese(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

export function VocabularyDeck({
  terms,
  initialQueue,
  mode,
  progress,
  onRecordAnswer,
  onExit,
}: {
  terms: BoyaTerm[];
  initialQueue: string[];
  mode: VocabularyStudyMode;
  progress: VocabularyReviewProgress;
  onRecordAnswer: (id: string, rating: RecallRating, now: Date) => void;
  onExit: () => void;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const sessionSize = initialQueue.length;
  const [introducedId, setIntroducedId] = useState<string | null>(null);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [inputMode, setInputMode] = useState<"bank" | "keyboard">("bank");
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const resetAnswer = useCallback(() => {
    setAnswerResult(null);
    setTypedAnswer("");
    setSelectedTiles([]);
    setUsedHint(false);
  }, []);

  const termsById = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);
  const currentTerm = termsById.get(queue[0] ?? "");
  const currentRecord = currentTerm ? progress[currentTerm.id] : undefined;
  const introducing = mode === "learn" && Boolean(currentTerm) && !currentRecord && introducedId !== currentTerm?.id;
  const exerciseType = currentTerm && currentRecord ? selectVocabularyExercise(currentTerm, currentRecord) : "meaning-choice";
  const reviewedCount = Math.max(0, sessionSize - queue.length);
  const choiceOptions = useMemo(() => currentTerm && exerciseType !== "hanzi-input"
    ? buildVocabularyChoices(terms, currentTerm, exerciseType)
    : [], [currentTerm, exerciseType, terms]);
  const characterBank = useMemo(() => currentTerm ? buildCharacterBank(terms, currentTerm) : [], [currentTerm, terms]);
  const bankAnswer = selectedTiles.map((index) => characterBank[index]).join("");
  const currentInput = inputMode === "bank" ? bankAnswer : typedAnswer;
  const answerCharacters = currentTerm ? getHanziCharacters(currentTerm.hanzi) : [];

  useEffect(() => {
    if (!currentTerm) return;
    setInputMode((currentRecord?.level ?? 1) >= 3 ? "keyboard" : "bank");
    resetAnswer();
  }, [currentRecord?.level, currentTerm?.id, resetAnswer]);

  useEffect(() => {
    if (!answerResult) return;
    feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [answerResult]);

  const submitAnswer = useCallback((correct: boolean, selectedId?: string) => {
    if (answerResult || !currentTerm) return;
    const rating: RecallRating = !correct
      ? "again"
      : usedHint
        ? "hard"
        : exerciseType === "hanzi-input" && inputMode === "keyboard"
          ? "easy"
          : "good";
    setAnswerResult({ correct, rating, selectedId });
    setSessionAnswered((count) => count + 1);
    if (correct) setSessionCorrect((count) => count + 1);
  }, [answerResult, currentTerm, exerciseType, inputMode, usedHint]);

  const checkTypedAnswer = useCallback(() => {
    if (!currentTerm || !currentInput) return;
    submitAnswer(normalizeHanziAnswer(currentInput) === normalizeHanziAnswer(currentTerm.hanzi));
  }, [currentInput, currentTerm, submitAnswer]);

  const continueAfterAnswer = useCallback(() => {
    if (!answerResult || !currentTerm) return;
    const ratedAt = new Date();
    onRecordAnswer(currentTerm.id, answerResult.rating, ratedAt);
    setQueue((current) => {
      const [ratedId, ...remaining] = current;
      if (answerResult.rating !== "again" || !ratedId) return remaining;
      const repeatAfter = Math.min(4, remaining.length);
      return [...remaining.slice(0, repeatAfter), ratedId, ...remaining.slice(repeatAfter)];
    });
    resetAnswer();
    setNow(ratedAt);
  }, [answerResult, currentTerm, onRecordAnswer, resetAnswer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Escape") { onExit(); return; }
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (!currentTerm) return;
      if (introducing) {
        if (event.key === "Enter" && target.tagName !== "BUTTON") setIntroducedId(currentTerm.id);
        if (event.key.toLowerCase() === "a") speakChinese(currentTerm.hanzi);
        return;
      }
      if (event.key.toLowerCase() === "a") speakChinese(currentTerm.hanzi);
      if (answerResult && event.key === "Enter" && target.tagName !== "BUTTON" && target.tagName !== "A") continueAfterAnswer();
      if (!answerResult && exerciseType !== "hanzi-input" && ["1", "2", "3", "4"].includes(event.key)) {
        const selected = choiceOptions[Number(event.key) - 1];
        if (selected) submitAnswer(selected.id === currentTerm.id, selected.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerResult, choiceOptions, continueAfterAnswer, currentTerm, exerciseType, introducing, onExit, submitAnswer]);

  if (!currentTerm) {
    const accuracy = sessionAnswered ? Math.round(sessionCorrect / sessionAnswered * 100) : 100;
    return <div className="srs-session-finished">
      <span><Icon name="check" size={28} /></span>
      <h3>{mode === "learn" ? "Đã học xong lượt này!" : "Đã xong phiên ôn!"}</h3>
      <strong className="srs-finish-score">{accuracy}% chính xác</strong>
      <p>Dương đã hoàn thành {sessionSize} từ qua {sessionAnswered} câu hỏi. Lịch gặp lại đã được tính riêng cho từng từ.</p>
      <button className="button primary" onClick={onExit}>{mode === "learn" ? "Về bài học" : "Về ôn tập"}</button>
    </div>;
  }

  const pendingSchedule = answerResult ? previewVocabularyReview(currentRecord, answerResult.rating, now) : null;
  const currentCopy = exerciseCopy[exerciseType];

  return <div className="srs-review-session">
    <div className="srs-session-topbar">
      <button className="button ghost small" onClick={onExit}><Icon name="arrow-left" size={17} />{mode === "learn" ? "Bài học" : "Ôn tập"}</button>
      <div className="srs-session-progress"><span>{reviewedCount}/{sessionSize} từ</span><div className="linear-progress"><span style={{ width: `${sessionSize ? reviewedCount / sessionSize * 100 : 0}%` }} /></div></div>
      <span className={`srs-current-level level-${currentRecord?.level ?? 1}`}>{currentRecord ? `Mức ${currentRecord.level}` : "Từ mới"}</span>
    </div>

    {introducing ? <section className="srs-new-word" aria-labelledby="new-word-title">
      <span className="eyebrow">Làm quen với từ mới</span>
      <h2 id="new-word-title" lang="zh">{currentTerm.hanzi}</h2>
      <span className="srs-question-pinyin">{currentTerm.pinyin}</span>
      <p>{currentTerm.meaning}</p>
      {currentTerm.wordClass && <small>{currentTerm.wordClass}</small>}
      <button className="srs-audio-button compact" onClick={() => speakChinese(currentTerm.hanzi)}><Icon name="volume" size={22} />Nghe phát âm</button>
      <button className="button primary vocab-primary" onClick={() => setIntroducedId(currentTerm.id)}>Đã xem, luyện tập<Icon name="arrow-right" size={18} /></button>
    </section> : <section className={`srs-exercise-card ${answerResult ? answerResult.correct ? "is-correct" : "is-incorrect" : ""}`} aria-labelledby="srs-question-title">
      <header className="srs-exercise-head">
        <span><Icon name={currentCopy.icon} size={18} />{currentCopy.label}</span>
        <small>Còn {queue.length} từ</small>
      </header>

      <div className="srs-question">
        <p id="srs-question-title">{currentCopy.instruction}</p>
        {exerciseType === "meaning-choice" && <>
          <strong className="srs-question-hanzi" lang="zh">{currentTerm.hanzi}</strong>
          <span className="srs-question-pinyin">{currentTerm.pinyin}</span>
          <button className="srs-audio-button compact" onClick={() => speakChinese(currentTerm.hanzi)} aria-label={`Nghe phát âm ${currentTerm.hanzi}`}><Icon name="volume" size={20} />Nghe</button>
        </>}
        {exerciseType === "hanzi-choice" && <>
          <strong className="srs-question-meaning">{currentTerm.meaning}</strong>
          {usedHint ? <span className="srs-question-pinyin">Gợi ý: {currentTerm.pinyin}</span> : <button className="srs-hint-button" onClick={() => setUsedHint(true)}><Icon name="sparkle" size={16} />Gợi ý pinyin</button>}
        </>}
        {exerciseType === "listening-choice" && <button className="srs-audio-button" onClick={() => speakChinese(currentTerm.hanzi)} aria-label="Nghe từ cần chọn"><Icon name="volume" size={30} /><span>Nghe từ</span><small>Có thể nghe lại nhiều lần</small></button>}
        {exerciseType === "hanzi-input" && <>
          <strong className="srs-question-meaning">{currentTerm.meaning}</strong>
          {usedHint ? <span className="srs-question-pinyin">Gợi ý: {currentTerm.pinyin}</span> : <button className="srs-hint-button" onClick={() => setUsedHint(true)}><Icon name="sparkle" size={16} />Gợi ý pinyin</button>}
        </>}
      </div>

      {exerciseType !== "hanzi-input" ? <div className="srs-choice-grid" aria-label="Các đáp án">
        {choiceOptions.map((option, index) => {
          const isCorrectOption = answerResult && option.id === currentTerm.id;
          const isWrongSelection = answerResult && option.id === answerResult.selectedId && option.id !== currentTerm.id;
          return <button
            className={isCorrectOption ? "correct" : isWrongSelection ? "incorrect" : ""}
            key={option.id}
            onClick={() => submitAnswer(option.id === currentTerm.id, option.id)}
            disabled={Boolean(answerResult)}
          >
            <kbd>{index + 1}</kbd>
            <span lang={exerciseType === "hanzi-choice" ? "zh" : undefined}>{option.label}</span>
            {isCorrectOption && <Icon name="check" size={19} />}
            {isWrongSelection && <Icon name="x" size={19} />}
          </button>;
        })}
      </div> : <div className="srs-fill-area">
        <div className="srs-input-modes" role="group" aria-label="Cách điền đáp án">
          <button className={inputMode === "bank" ? "active" : ""} onClick={() => { setInputMode("bank"); setTypedAnswer(""); setSelectedTiles([]); }} disabled={Boolean(answerResult)}>Chọn chữ</button>
          <button className={inputMode === "keyboard" ? "active" : ""} onClick={() => { setInputMode("keyboard"); setTypedAnswer(""); setSelectedTiles([]); }} disabled={Boolean(answerResult)}>Tự gõ</button>
        </div>
        <div className="srs-answer-slots" aria-label={`Đáp án có ${answerCharacters.length} chữ`}>
          {answerCharacters.map((_, index) => <span className={getHanziCharacters(currentInput)[index] ? "is-filled" : ""} key={index}>{getHanziCharacters(currentInput)[index] ?? ""}</span>)}
        </div>
        {inputMode === "bank" ? <>
          <div className="srs-character-bank" aria-label="Ngân hàng chữ Hán">
            {characterBank.map((character, index) => <button key={`${character}-${index}`} onClick={() => setSelectedTiles((current) => current.length < answerCharacters.length ? [...current, index] : current)} disabled={Boolean(answerResult) || selectedTiles.includes(index)} lang="zh">{character}</button>)}
          </div>
          <button className="srs-clear-answer" onClick={() => setSelectedTiles((current) => current.slice(0, -1))} disabled={!selectedTiles.length || Boolean(answerResult)}><Icon name="arrow-left" size={16} />Xóa chữ cuối</button>
        </> : <label className="srs-type-input"><span className="sr-only">Gõ chữ Hán</span><input value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) checkTypedAnswer(); }} disabled={Boolean(answerResult)} lang="zh" autoComplete="off" placeholder="输入汉字…" /></label>}
        {!answerResult && <button className="button primary srs-check-button" onClick={checkTypedAnswer} disabled={!currentInput}>Kiểm tra</button>}
      </div>}

      {answerResult && <div ref={feedbackRef} className={`srs-answer-feedback ${answerResult.correct ? "correct" : "incorrect"}`} role="status" aria-live="polite">
        <span className="srs-feedback-icon"><Icon name={answerResult.correct ? "check" : "review"} size={24} /></span>
        <div className="srs-feedback-copy">
          <strong>{answerResult.correct ? "Chính xác!" : "Chưa đúng, từ này sẽ quay lại"}</strong>
          <p><b lang="zh">{currentTerm.hanzi}</b><span>{currentTerm.pinyin}</span><span>{currentTerm.meaning}</span></p>
          <small>{answerResult.correct ? `Lên mức ${pendingSchedule?.level} · ôn lại sau ${pendingSchedule?.intervalLabel}` : "Xem lại đáp án rồi thử lại sau vài câu."}</small>
        </div>
        <button className="button primary" onClick={continueAfterAnswer}>Tiếp tục<Icon name="arrow-right" size={17} /></button>
      </div>}
    </section>}

    {!introducing && <p className="srs-keyboard-tip">Phím <kbd>1–4</kbd> để chọn · <kbd>A</kbd> để nghe · <kbd>Enter</kbd> để tiếp tục</p>}
  </div>;
}
