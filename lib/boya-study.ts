import { resourceUrl } from "@/lib/resource-url";

export type BoyaTerm = {
  id: string;
  hanzi: string;
  pinyin: string;
  wordClass: string;
  meaning: string;
};

export type BoyaLesson = {
  number: number;
  title: string;
  quizletHref: string;
  terms: BoyaTerm[];
  grammar: string[];
};

export type BoyaStudyData = {
  course: string;
  sourceQuizlet: string;
  sourceVocabulary: string;
  sourceGrammar: string;
  totalTerms: number;
  lessons: BoyaLesson[];
};

export const boyaStudyDataUrl = resourceUrl("/resources/boya1/study-data.json");

let cachedStudyData: Promise<BoyaStudyData> | null = null;

export function loadBoyaStudyData() {
  if (!cachedStudyData) {
    cachedStudyData = fetch(boyaStudyDataUrl).then((response) => {
      if (!response.ok) throw new Error("Không đọc được dữ liệu BOYA");
      return response.json() as Promise<BoyaStudyData>;
    });
  }
  return cachedStudyData;
}

export function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
