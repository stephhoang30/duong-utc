"use client";

import { useCallback, useEffect, useState } from "react";
import { scheduleVocabularyReview, type RecallRating, type VocabularyReviewProgress } from "./spaced-repetition";
import { updateVocabularyStreak, type VocabularyReviewMeta } from "./vocabulary-study";

const vocabularyStorageKey = "duong-boya-srs-v1";
const vocabularyMetaStorageKey = "duong-boya-srs-meta-v1";

function readVocabularyProgress(): VocabularyReviewProgress {
  try {
    const saved = localStorage.getItem(vocabularyStorageKey);
    if (saved) return JSON.parse(saved) as VocabularyReviewProgress;
    const knownTerms = JSON.parse(localStorage.getItem("duong-boya-known-terms") ?? "[]") as string[];
    const now = new Date();
    return Object.fromEntries(knownTerms.map((id) => [id, {
      level: 2,
      dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      firstLearnedAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
      reviewCount: 1,
      lapseCount: 0,
    }]));
  } catch {
    return {};
  }
}

export function useVocabularyProgress() {
  const [progress, setProgress] = useState<VocabularyReviewProgress>({});
  const [meta, setMeta] = useState<VocabularyReviewMeta>({ streak: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(readVocabularyProgress());
    try {
      setMeta(JSON.parse(localStorage.getItem(vocabularyMetaStorageKey) ?? '{"streak":0}'));
    } catch {
      // Continue with an empty streak when storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(vocabularyStorageKey, JSON.stringify(progress));
      localStorage.setItem(vocabularyMetaStorageKey, JSON.stringify(meta));
    } catch {
      // Keep the study session usable when browser storage is unavailable.
    }
  }, [meta, progress, ready]);

  const recordAnswer = useCallback((id: string, rating: RecallRating, now: Date) => {
    setProgress((current) => ({ ...current, [id]: scheduleVocabularyReview(current[id], rating, now) }));
    setMeta((current) => updateVocabularyStreak(current, now));
  }, []);

  return { progress, meta, ready, recordAnswer };
}
