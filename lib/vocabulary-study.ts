import type { BoyaTerm } from "./boya-study";
import { isVocabularyDue, memoryLevels, type VocabularyReviewProgress } from "./spaced-repetition";

export type VocabularyStudyMode = "review" | "learn";
export type VocabularyReviewMeta = { streak: number; lastStudyDate?: string };

export function getVocabularyOverview(terms: BoyaTerm[], progress: VocabularyReviewProgress, now = new Date()) {
  const learned = terms.filter((term) => progress[term.id]);
  const scheduled = [...learned].sort((left, right) => progress[left.id].dueAt.localeCompare(progress[right.id].dueAt));
  const due = scheduled.filter((term) => isVocabularyDue(progress[term.id], now));
  const next = scheduled.find((term) => !isVocabularyDue(progress[term.id], now));
  return {
    learned,
    due,
    nextReview: next ? progress[next.id].dueAt : undefined,
    levels: memoryLevels.map((level) => ({ ...level, count: learned.filter((term) => progress[term.id].level === level.level).length })),
  };
}

export function buildVocabularyQueue(terms: BoyaTerm[], progress: VocabularyReviewProgress, mode: VocabularyStudyMode, now = new Date()) {
  if (mode === "learn") return terms.filter((term) => !progress[term.id]).slice(0, 10).map((term) => term.id);
  const { learned, due } = getVocabularyOverview(terms, progress, now);
  const candidates = due.length ? due : [...learned].sort((left, right) => progress[left.id].dueAt.localeCompare(progress[right.id].dueAt));
  return candidates.slice(0, due.length ? 20 : 5).map((term) => term.id);
}

function localDayKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function currentVocabularyStreak(meta: VocabularyReviewMeta, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return meta.lastStudyDate === localDayKey(now) || meta.lastStudyDate === localDayKey(yesterday) ? meta.streak : 0;
}

export function updateVocabularyStreak(meta: VocabularyReviewMeta, now = new Date()): VocabularyReviewMeta {
  if (meta.lastStudyDate === localDayKey(now)) return meta;
  return { streak: currentVocabularyStreak(meta, now) + 1, lastStudyDate: localDayKey(now) };
}
