import type { BoyaTerm } from "@/lib/boya-study";
import type { VocabularyReviewRecord } from "@/lib/spaced-repetition";

export type VocabularyExerciseType =
  | "meaning-choice"
  | "hanzi-choice"
  | "listening-choice"
  | "hanzi-input";

export type VocabularyChoice = {
  id: string;
  label: string;
};

function seedFrom(value: string) {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    seed ^= value.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function deterministicShuffle<T>(items: T[], seedText: string) {
  const result = [...items];
  let seed = seedFrom(seedText) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const target = seed % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function selectVocabularyExercise(term: BoyaTerm, record?: VocabularyReviewRecord): VocabularyExerciseType {
  const reviewCount = record?.reviewCount ?? 0;
  const level = record?.level ?? 1;
  const earlyTypes: VocabularyExerciseType[] = ["meaning-choice", "hanzi-choice", "listening-choice", "hanzi-input"];
  const recallTypes: VocabularyExerciseType[] = ["hanzi-input", "listening-choice", "hanzi-choice", "meaning-choice"];
  const types = level >= 3 ? recallTypes : earlyTypes;
  return types[seedFrom(`${term.id}-${reviewCount}`) % types.length];
}

export function buildVocabularyChoices(
  terms: BoyaTerm[],
  current: BoyaTerm,
  type: Exclude<VocabularyExerciseType, "hanzi-input">,
) {
  const useMeaning = type !== "hanzi-choice";
  const answerLabel = useMeaning ? current.meaning : current.hanzi;
  const seen = new Set([answerLabel.trim().toLocaleLowerCase("vi")]);
  const distractors = deterministicShuffle(
    terms.filter((term) => term.id !== current.id),
    `${current.id}-${type}-distractors`,
  ).filter((term) => {
    const label = (useMeaning ? term.meaning : term.hanzi).trim().toLocaleLowerCase("vi");
    if (!label || seen.has(label)) return false;
    seen.add(label);
    return true;
  }).slice(0, 3);

  return deterministicShuffle<VocabularyChoice>([
    { id: current.id, label: answerLabel },
    ...distractors.map((term) => ({ id: term.id, label: useMeaning ? term.meaning : term.hanzi })),
  ], `${current.id}-${type}-options`);
}

export function normalizeHanziAnswer(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\s，。！？、；：,.!?;:'"“”‘’（）()]/g, "")
    .trim();
}

export function getHanziCharacters(value: string) {
  return Array.from(normalizeHanziAnswer(value));
}

export function buildCharacterBank(terms: BoyaTerm[], current: BoyaTerm) {
  const answerCharacters = getHanziCharacters(current.hanzi);
  const answerSet = new Set(answerCharacters);
  const distractorCharacters = deterministicShuffle(
    terms.flatMap((term) => getHanziCharacters(term.hanzi)),
    `${current.id}-character-bank`,
  ).filter((character, index, items) => !answerSet.has(character) && items.indexOf(character) === index);

  const distractorCount = Math.max(3, Math.min(5, answerCharacters.length + 2));
  return deterministicShuffle(
    [...answerCharacters, ...distractorCharacters.slice(0, distractorCount)],
    `${current.id}-character-options`,
  );
}
