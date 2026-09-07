export type SubjectId = "calculus" | "algebra" | "philosophy" | "digital" | "chinese";

export type Subject = {
  id: SubjectId;
  name: string;
  shortName: string;
  color: string;
};

export type StudyTask = {
  id: string;
  title: string;
  subject: SubjectId;
  dueDate: string;
  startTime?: string;
  duration: number;
  priority: "low" | "medium" | "high";
  done: boolean;
};

export type StudyNote = {
  id: string;
  title: string;
  subject: SubjectId;
  content: string;
  updatedAt: string;
  pinned: boolean;
};

export type Flashcard = {
  id: string;
  deck: SubjectId;
  front: string;
  back: string;
  hint?: string;
  dueDate: string;
  interval: number;
  repetitions: number;
};

export type ExamResult = {
  id: string;
  examId: string;
  score: number;
  total: number;
  completedAt: string;
  durationSeconds: number;
};

export type BoyaResourceStatus = "todo" | "doing" | "done";

export type PlannerState = {
  tasks: StudyTask[];
  notes: StudyNote[];
  flashcards: Flashcard[];
  examResults: ExamResult[];
  completedChineseLessons: string[];
  chineseStreak: number;
  lastChineseStudyDate?: string;
  boyaCurrentLesson: number;
  boyaResourceStatus: Record<string, BoyaResourceStatus>;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Exam = {
  id: string;
  title: string;
  subject: SubjectId;
  description: string;
  durationMinutes: number;
  questions: ExamQuestion[];
};
