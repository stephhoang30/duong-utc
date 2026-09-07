"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialState } from "./data";
import { offsetDate, todayKey } from "./date";
import type { BoyaResourceStatus, ExamResult, Flashcard, PlannerState, StudyNote, StudyTask } from "./types";

const STORAGE_KEY = "duong-study-planner-v1";

type PlannerContextValue = {
  state: PlannerState;
  ready: boolean;
  addTask: (task: Omit<StudyTask, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addNote: (note: Pick<StudyNote, "title" | "subject" | "content">) => string;
  updateNote: (id: string, patch: Partial<Pick<StudyNote, "title" | "subject" | "content" | "pinned">>) => void;
  deleteNote: (id: string) => void;
  rateFlashcard: (id: string, rating: "hard" | "good" | "easy") => void;
  addFlashcard: (card: Pick<Flashcard, "deck" | "front" | "back" | "hint">) => void;
  saveExamResult: (result: Omit<ExamResult, "id" | "completedAt">) => void;
  toggleChineseLesson: (id: string) => void;
  setBoyaCurrentLesson: (lesson: number) => void;
  cycleBoyaResourceStatus: (id: string) => void;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlannerState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      // Keep starter data when storage is unavailable or corrupted.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The app remains usable in private browsing even when persistence fails.
    }
  }, [ready, state]);

  const addTask = useCallback((task: Omit<StudyTask, "id" | "done">) => {
    setState((current) => ({
      ...current,
      tasks: [...current.tasks, { ...task, id: uid("task"), done: false }],
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  }, []);

  const addNote = useCallback((note: Pick<StudyNote, "title" | "subject" | "content">) => {
    const id = uid("note");
    setState((current) => ({
      ...current,
      notes: [{ ...note, id, updatedAt: new Date().toISOString(), pinned: false }, ...current.notes],
    }));
    return id;
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<StudyNote, "title" | "subject" | "content" | "pinned">>) => {
      setState((current) => ({
        ...current,
        notes: current.notes.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
        ),
      }));
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    setState((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
  }, []);

  const rateFlashcard = useCallback((id: string, rating: "hard" | "good" | "easy") => {
    const multiplier = rating === "hard" ? 1 : rating === "good" ? 2 : 4;
    setState((current) => ({
      ...current,
      flashcards: current.flashcards.map((card) => {
        if (card.id !== id) return card;
        const nextInterval = rating === "hard" ? 1 : Math.max(1, card.interval || 1) * multiplier;
        return {
          ...card,
          interval: nextInterval,
          repetitions: card.repetitions + 1,
          dueDate: offsetDate(todayKey(), nextInterval),
        };
      }),
    }));
  }, []);

  const addFlashcard = useCallback((card: Pick<Flashcard, "deck" | "front" | "back" | "hint">) => {
    setState((current) => ({
      ...current,
      flashcards: [
        ...current.flashcards,
        { ...card, id: uid("card"), dueDate: todayKey(), interval: 0, repetitions: 0 },
      ],
    }));
  }, []);

  const saveExamResult = useCallback((result: Omit<ExamResult, "id" | "completedAt">) => {
    setState((current) => ({
      ...current,
      examResults: [
        { ...result, id: uid("result"), completedAt: new Date().toISOString() },
        ...current.examResults,
      ],
    }));
  }, []);

  const toggleChineseLesson = useCallback((id: string) => {
    setState((current) => {
      const exists = current.completedChineseLessons.includes(id);
      const completedChineseLessons = exists
        ? current.completedChineseLessons.filter((lessonId) => lessonId !== id)
        : [...current.completedChineseLessons, id];
      const today = todayKey();
      const studiedToday = !exists;
      const yesterday = offsetDate(today, -1);
      const nextStreak = current.lastChineseStudyDate === today
        ? current.chineseStreak
        : current.lastChineseStudyDate === yesterday
          ? current.chineseStreak + 1
          : 1;
      return {
        ...current,
        completedChineseLessons,
        lastChineseStudyDate: studiedToday ? today : current.lastChineseStudyDate,
        chineseStreak: studiedToday ? nextStreak : current.chineseStreak,
      };
    });
  }, []);

  const setBoyaCurrentLesson = useCallback((lesson: number) => {
    const safeLesson = Math.max(1, Math.min(30, Math.round(lesson)));
    setState((current) => ({ ...current, boyaCurrentLesson: safeLesson }));
  }, []);

  const cycleBoyaResourceStatus = useCallback((id: string) => {
    const nextStatus: Record<BoyaResourceStatus, BoyaResourceStatus> = {
      todo: "doing",
      doing: "done",
      done: "todo",
    };
    setState((current) => {
      const currentStatus = current.boyaResourceStatus[id] ?? "todo";
      return {
        ...current,
        boyaResourceStatus: { ...current.boyaResourceStatus, [id]: nextStatus[currentStatus] },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      addTask,
      toggleTask,
      deleteTask,
      addNote,
      updateNote,
      deleteNote,
      rateFlashcard,
      addFlashcard,
      saveExamResult,
      toggleChineseLesson,
      setBoyaCurrentLesson,
      cycleBoyaResourceStatus,
    }),
    [state, ready, addTask, toggleTask, deleteTask, addNote, updateNote, deleteNote, rateFlashcard, addFlashcard, saveExamResult, toggleChineseLesson, setBoyaCurrentLesson, cycleBoyaResourceStatus],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}
