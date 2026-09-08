export type MemoryLevel = 1 | 2 | 3 | 4 | 5;
export type RecallRating = "again" | "hard" | "good" | "easy";

export type VocabularyReviewRecord = {
  level: MemoryLevel;
  dueAt: string;
  lastReviewedAt: string;
  firstLearnedAt: string;
  reviewCount: number;
  lapseCount: number;
};

export type VocabularyReviewProgress = Record<string, VocabularyReviewRecord>;

export const memoryLevels: Array<{
  level: MemoryLevel;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  { level: 1, label: "Mới làm quen", shortLabel: "Mới", description: "Cần gặp lại sớm" },
  { level: 2, label: "Đang nhớ", shortLabel: "Đang nhớ", description: "Ôn lại vào ngày mai" },
  { level: 3, label: "Gần chắc", shortLabel: "Gần chắc", description: "Giãn cách vài ngày" },
  { level: 4, label: "Nhớ tốt", shortLabel: "Nhớ tốt", description: "Củng cố theo tuần" },
  { level: 5, label: "Bền vững", shortLabel: "Bền vững", description: "Nhắc lại định kỳ" },
];

const minute = 60 * 1000;
const day = 24 * 60 * minute;

const goodIntervals: Record<MemoryLevel, number> = {
  1: 10 * minute,
  2: day,
  3: 3 * day,
  4: 7 * day,
  5: 21 * day,
};

const hardIntervals: Record<MemoryLevel, number> = {
  1: 6 * 60 * minute,
  2: 12 * 60 * minute,
  3: 2 * day,
  4: 5 * day,
  5: 14 * day,
};

const easyIntervals: Record<MemoryLevel, number> = {
  1: day,
  2: 3 * day,
  3: 7 * day,
  4: 21 * day,
  5: 45 * day,
};

function clampLevel(value: number): MemoryLevel {
  return Math.max(1, Math.min(5, value)) as MemoryLevel;
}

export function scheduleVocabularyReview(
  current: VocabularyReviewRecord | undefined,
  rating: RecallRating,
  now = new Date(),
): VocabularyReviewRecord {
  const currentLevel = current?.level ?? 1;
  const nextLevel = rating === "again"
    ? 1
    : rating === "hard"
      ? clampLevel(currentLevel - 1)
      : rating === "good"
        ? clampLevel(currentLevel + 1)
        : clampLevel(currentLevel + 2);

  const interval = rating === "again"
    ? 10 * minute
    : rating === "hard"
      ? hardIntervals[nextLevel]
      : rating === "good"
        ? goodIntervals[nextLevel]
        : easyIntervals[nextLevel];

  return {
    level: nextLevel,
    dueAt: new Date(now.getTime() + interval).toISOString(),
    lastReviewedAt: now.toISOString(),
    firstLearnedAt: current?.firstLearnedAt ?? now.toISOString(),
    reviewCount: (current?.reviewCount ?? 0) + 1,
    lapseCount: (current?.lapseCount ?? 0) + (rating === "again" ? 1 : 0),
  };
}

export function previewVocabularyReview(
  current: VocabularyReviewRecord | undefined,
  rating: RecallRating,
  now = new Date(),
) {
  const scheduled = scheduleVocabularyReview(current, rating, now);
  const delta = new Date(scheduled.dueAt).getTime() - now.getTime();

  if (delta < 60 * minute) return { ...scheduled, intervalLabel: `${Math.round(delta / minute)} phút` };
  if (delta < day) return { ...scheduled, intervalLabel: `${Math.round(delta / (60 * minute))} giờ` };
  return { ...scheduled, intervalLabel: `${Math.round(delta / day)} ngày` };
}

export function isVocabularyDue(record: VocabularyReviewRecord | undefined, now = new Date()) {
  return !record || new Date(record.dueAt).getTime() <= now.getTime();
}

export function formatNextReview(dueAt: string, now = new Date()) {
  const delta = new Date(dueAt).getTime() - now.getTime();
  if (delta <= 0) return "Đến giờ ôn";
  if (delta < 60 * minute) return `Sau ${Math.max(1, Math.ceil(delta / minute))} phút`;
  if (delta < day) return `Sau ${Math.ceil(delta / (60 * minute))} giờ`;
  if (delta < 7 * day) return `Sau ${Math.ceil(delta / day)} ngày`;

  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(dueAt));
}
