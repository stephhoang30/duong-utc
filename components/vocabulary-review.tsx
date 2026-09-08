"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import type { BoyaLesson } from "@/lib/boya-study";
import {
  buildCharacterBank,
  buildVocabularyChoices,
  getHanziCharacters,
  normalizeHanziAnswer,
  selectVocabularyExercise,
  type VocabularyExerciseType,
} from "@/lib/vocabulary-exercises";
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

const legacyVocabularyStorageKey = "duong-boya-known-terms";
const vocabularyStorageKey = "duong-boya-srs-v1";
const vocabularyMetaStorageKey = "duong-boya-srs-meta-v1";

type VocabularyReviewMeta = {
  streak: number;
  lastStudyDate?: string;
};

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

function readSavedSet(key: string) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
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

function speakChinese(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

export function VocabularyDeck({
  lesson,
  totalTerms,
  onSessionChange,
}: {
  lesson: BoyaLesson;
  totalTerms: number;
  onSessionChange?: (active: boolean) => void;
}) {
  const terms = lesson.terms;
  const [progress, setProgress] = useState<VocabularyReviewProgress>({});
  const [meta, setMeta] = useState<VocabularyReviewMeta>({ streak: 0 });
  const [storageReady, setStorageReady] = useState(false);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [sessionSize, setSessionSize] = useState(0);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [inputMode, setInputMode] = useState<"bank" | "keyboard">("bank");
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const feedbackRef = useRef<HTMLDivElement>(null);

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

  const resetAnswer = useCallback(() => {
    setAnswerResult(null);
    setTypedAnswer("");
    setSelectedTiles([]);
    setUsedHint(false);
  }, []);

  const exitReview = useCallback(() => {
    setReviewStarted(false);
    setQueue([]);
    resetAnswer();
    onSessionChange?.(false);
  }, [onSessionChange, resetAnswer]);

  useEffect(() => {
    setReviewStarted(false);
    setQueue([]);
    setSessionSize(0);
    setSessionAnswered(0);
    setSessionCorrect(0);
    resetAnswer();
    onSessionChange?.(false);
  }, [lesson.number, onSessionChange, resetAnswer]);

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
  const exerciseType = currentTerm ? selectVocabularyExercise(currentTerm, currentRecord) : "meaning-choice";
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

  const startReview = useCallback(() => {
    const candidates = dueTerms.length
      ? dueTerms
      : [...terms].sort((left, right) => (progress[left.id]?.dueAt ?? "").localeCompare(progress[right.id]?.dueAt ?? ""));
    const nextQueue = candidates.slice(0, dueTerms.length ? 20 : 5).map((term) => term.id);
    setQueue(nextQueue);
    setSessionSize(nextQueue.length);
    setSessionAnswered(0);
    setSessionCorrect(0);
    setReviewStarted(true);
    resetAnswer();
    onSessionChange?.(true);
  }, [dueTerms, onSessionChange, progress, resetAnswer, terms]);

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
    setProgress((current) => ({
      ...current,
      [currentTerm.id]: scheduleVocabularyReview(current[currentTerm.id], answerResult.rating, ratedAt),
    }));
    setMeta((current) => updateReviewStreak(current, ratedAt));
    setQueue((current) => {
      const [ratedId, ...remaining] = current;
      if (answerResult.rating !== "again" || !ratedId) return remaining;
      const repeatAfter = Math.min(4, remaining.length);
      return [...remaining.slice(0, repeatAfter), ratedId, ...remaining.slice(repeatAfter)];
    });
    resetAnswer();
    setNow(ratedAt);
  }, [answerResult, currentTerm, resetAnswer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName)) return;
      if (!reviewStarted || !currentTerm) return;
      if (event.key === "Escape") exitReview();
      if (event.key.toLowerCase() === "a") speakChinese(currentTerm.hanzi);
      if (answerResult && event.key === "Enter") continueAfterAnswer();
      if (!answerResult && exerciseType !== "hanzi-input" && ["1", "2", "3", "4"].includes(event.key)) {
        const selected = choiceOptions[Number(event.key) - 1];
        if (selected) submitAnswer(selected.id === currentTerm.id, selected.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerResult, choiceOptions, continueAfterAnswer, currentTerm, exerciseType, exitReview, reviewStarted, submitAnswer]);

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
      <div><span className="eyebrow">Phiên ngắn · tối đa 20 từ</span><h3>{dueTerms.length ? `${dueTerms.length} từ đang chờ Dương` : "Hôm nay đã ôn đúng lịch"}</h3><p>Trộn câu chọn nghĩa, chọn chữ Hán, nghe và điền từ; planner tự chấm rồi xếp lịch ôn tiếp.</p></div>
      <button className="button primary srs-start-button" onClick={startReview}><Icon name="play" size={18} />{dueTerms.length ? "Ôn tập ngay" : "Ôn sớm 5 từ"}</button>
    </div>

    <div className="srs-source-note"><Icon name="layers" size={17} /><span>Lịch ôn 5 mức chạy ngay trên thiết bị. Dữ liệu từ vựng: <a href={lesson.quizletHref} target="_blank" rel="noreferrer">Quizlet BOYA · {totalTerms} từ</a>.</span></div>
  </div>;

  if (!currentTerm) {
    const accuracy = sessionAnswered ? Math.round(sessionCorrect / sessionAnswered * 100) : 100;
    return <div className="srs-session-finished">
      <span><Icon name="check" size={28} /></span>
      <h3>Đã xong phiên ôn</h3>
      <strong className="srs-finish-score">{accuracy}% chính xác</strong>
      <p>Dương đã hoàn thành {sessionSize} từ qua {sessionAnswered} câu hỏi. Lịch gặp lại đã được tính riêng cho từng từ.</p>
      <button className="button primary" onClick={exitReview}>Xem lịch ghi nhớ</button>
    </div>;
  }

  const pendingSchedule = answerResult ? previewVocabularyReview(currentRecord, answerResult.rating, now) : null;
  const currentCopy = exerciseCopy[exerciseType];

  return <div className="srs-review-session">
    <div className="srs-session-topbar">
      <button className="button ghost small" onClick={exitReview}><Icon name="arrow-left" size={17} />Lịch ôn</button>
      <div className="srs-session-progress"><span>{reviewedCount}/{sessionSize} từ</span><div className="linear-progress"><span style={{ width: `${sessionSize ? reviewedCount / sessionSize * 100 : 0}%` }} /></div></div>
      <span className={`srs-current-level level-${currentRecord?.level ?? 1}`}>Mức {currentRecord?.level ?? 1}</span>
    </div>

    <section className={`srs-exercise-card ${answerResult ? answerResult.correct ? "is-correct" : "is-incorrect" : ""}`} aria-labelledby="srs-question-title">
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
        </> : <label className="srs-type-input"><span className="sr-only">Gõ chữ Hán</span><input value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") checkTypedAnswer(); }} disabled={Boolean(answerResult)} lang="zh" autoComplete="off" placeholder="输入汉字…" /></label>}
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
    </section>

    <p className="srs-keyboard-tip">Phím <kbd>1–4</kbd> để chọn · <kbd>A</kbd> để nghe · <kbd>Enter</kbd> để tiếp tục</p>
  </div>;
}
