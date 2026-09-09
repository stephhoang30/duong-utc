"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { VocabularyDeck } from "./vocabulary-review";
import { loadBoyaStudyData, type BoyaStudyData } from "@/lib/boya-study";
import { formatNextReview } from "@/lib/spaced-repetition";
import { buildVocabularyQueue, currentVocabularyStreak, getVocabularyOverview, type VocabularyStudyMode } from "@/lib/vocabulary-study";
import { useVocabularyProgress } from "@/lib/use-vocabulary-progress";

type StudySession = { mode: VocabularyStudyMode; queue: string[] };

export function BoyaReviewDeck({ initialLesson = 1 }: { initialLesson?: number }) {
  const [data, setData] = useState<BoyaStudyData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<VocabularyStudyMode>("review");
  const [lessonNumber, setLessonNumber] = useState<number | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { progress, meta, ready, recordAnswer } = useVocabularyProgress();

  useEffect(() => { loadBoyaStudyData().then(setData).catch(() => setLoadError(true)); }, []);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  const allTerms = useMemo(() => data?.lessons.flatMap((lesson) => lesson.terms) ?? [], [data]);
  const overview = useMemo(() => getVocabularyOverview(allTerms, progress, now), [allTerms, progress, now]);
  const lesson = data?.lessons.find((item) => item.number === lessonNumber);
  const newTerms = lesson?.terms.filter((term) => !progress[term.id]) ?? [];
  const nextLesson = data?.lessons.find((item) => item.number >= initialLesson && item.terms.some((term) => !progress[term.id]))
    ?? data?.lessons.find((item) => item.terms.some((term) => !progress[term.id]));
  const maxLevelCount = Math.max(1, ...overview.levels.map((level) => level.count));

  function switchMode(next: VocabularyStudyMode) {
    setMode(next);
    setLessonNumber(null);
    setNow(new Date());
  }

  function startSession(next: VocabularyStudyMode) {
    const queue = buildVocabularyQueue(next === "learn" ? lesson?.terms ?? [] : allTerms, progress, next);
    if (queue.length) setSession({ mode: next, queue });
  }

  function exitSession() {
    setSession(null);
    setNow(new Date());
  }

  if (loadError) return <section className="panel vocab-load-state" role="alert"><Icon name="clock" /><p>Chưa đọc được dữ liệu BOYA.</p><button className="button secondary" onClick={() => window.location.reload()}>Tải lại trang</button></section>;
  if (!data || !ready) return <section className="panel vocab-load-state" role="status"><span className="loading-line" />Đang mở bộ từ vựng…</section>;

  return <section className={`vocab-workspace ${session ? "has-session" : ""}`} aria-label="Học từ vựng BOYA">
    <header className="vocab-header">
      <div className="vocab-brand"><span><Icon name="language" size={25} /></span><div><h1>Từ vựng tiếng Trung</h1><small>BOYA 1</small></div></div>
      {!session && <nav className="vocab-tabs" aria-label="Học từ vựng">
        <button className={mode === "review" ? "active" : ""} aria-current={mode === "review" ? "page" : undefined} onClick={() => switchMode("review")}><span className="vocab-bars-icon" aria-hidden="true"><i /><i /><i /></span>Ôn tập</button>
        <button className={mode === "learn" ? "active" : ""} aria-current={mode === "learn" ? "page" : undefined} onClick={() => switchMode("learn")}><Icon name="book" size={26} />Học từ mới</button>
      </nav>}
      {session && <span className="vocab-session-label">{session.mode === "learn" ? lesson?.title : "Ôn tập tổng hợp"}</span>}
    </header>

    {session ? <div className="vocab-session-body"><VocabularyDeck terms={allTerms} initialQueue={session.queue} mode={session.mode} progress={progress} onRecordAnswer={recordAnswer} onExit={exitSession} /></div>
      : mode === "review" ? <div className="vocab-review-layout">
        <div className="vocab-review-main">
          <div className="vocab-review-heading"><span className="eyebrow">TẤT CẢ TỪ ĐÃ HỌC</span><h2>Vườn từ vựng của Dương</h2><p>Mỗi lần ôn, nhớ thêm một chút.</p></div>
          <div className="vocab-memory-chart" role="img" aria-label={`5 mức ghi nhớ. ${overview.levels.map((level) => `Mức ${level.level}, ${level.label}: ${level.count} từ`).join(". ")}`}>
            {overview.levels.map(({ level, shortLabel, count }) => <div className={`vocab-memory-column memory-${level}`} key={level}>
              <div className="vocab-bar-space"><div className="vocab-memory-bar" style={{ height: count ? `${Math.max(4, count / maxLevelCount * 100)}%` : "0%" }}><span><strong>{count}</strong> từ</span></div></div>
              <strong className="vocab-level-number">{level}</strong><small>{shortLabel}</small>
            </div>)}
          </div>
          <div className="vocab-review-action">
            {overview.learned.length === 0 ? <><h3>Bắt đầu với những từ đầu tiên</h3><p>Học từ mới để có từ vựng trong vườn ghi nhớ.</p><button className="button primary vocab-primary" onClick={() => switchMode("learn")}>Học từ mới<Icon name="arrow-right" size={19} /></button></>
              : <><h3>{overview.due.length ? <>Chuẩn bị ôn tập: <strong>{overview.due.length} từ</strong></> : "Bạn đã ôn hết từ đến hạn!"}</h3>
                {!overview.due.length && overview.nextReview && <p>Lượt ôn tiếp theo: {formatNextReview(overview.nextReview, now).toLocaleLowerCase("vi")}</p>}
                <button className="button primary vocab-primary" onClick={() => startSession("review")}><Icon name="play" size={19} />{overview.due.length ? "Ôn tập ngay" : `Ôn sớm ${Math.min(5, overview.learned.length)} từ`}</button>
                <small>{overview.due.length ? "Mỗi lượt tối đa 20 từ · Ưu tiên từ đến hạn trước" : "Hoặc thêm vài từ mới vào vườn của bạn"}</small></>}
          </div>
        </div>
        <aside className="vocab-review-aside" aria-label="Tiến độ học từ vựng">
          <article className="vocab-stat-card vocab-learned-stat"><span className="vocab-stat-decoration"><Icon name="sparkle" size={32} /></span><p>Bạn đã học được</p><strong>{overview.learned.length} <span>từ</span></strong><small>trong {allTerms.length} từ BOYA 1</small><Icon name="notebook" size={47} /></article>
          <article className="vocab-stat-card vocab-streak-stat"><p>Bạn đã học liên tục</p><div><Icon name="flame" size={41} /><strong>{currentVocabularyStreak(meta, now)}</strong></div><small>ngày streak</small></article>
          <button className="vocab-learn-link" onClick={() => switchMode("learn")}><span><Icon name="book" size={24} /></span><div><strong>Học thêm từ mới</strong><small>{data.lessons.length} bài học BOYA 1</small></div><Icon name="arrow-right" size={20} /></button>
        </aside>
      </div>
        : <div className="vocab-learn-body">
          {lesson ? <>
            <button className="button ghost vocab-back" onClick={() => setLessonNumber(null)}><Icon name="arrow-left" size={18} />Danh sách bài học</button>
            <div className="vocab-lesson-heading"><span className="eyebrow">BOYA 1 · BÀI {lesson.number}</span><h2>{lesson.title}</h2><p>{lesson.terms.length - newTerms.length}/{lesson.terms.length} từ đã học · {newTerms.length} từ mới</p></div>
            <div className="vocab-lesson-start">{newTerms.length ? <><button className="button primary vocab-primary" onClick={() => startSession("learn")}>Học {Math.min(10, newTerms.length)} từ mới<Icon name="arrow-right" size={19} /></button><small>Xem từ, nghe phát âm rồi luyện tập</small></> : <><p><Icon name="check" size={20} />Bạn đã học hết từ mới của bài này.</p><button className="button primary vocab-primary" onClick={() => switchMode("review")}>Đến ôn tập<Icon name="arrow-right" size={18} /></button></>}</div>
            <div className="vocab-word-list" aria-label="Từ vựng trong bài">{lesson.terms.map((term) => <article key={term.id}><div><strong lang="zh">{term.hanzi}</strong><span>{term.pinyin}</span></div><p>{term.meaning}</p><span className={progress[term.id] ? "is-learned" : ""}>{progress[term.id] ? <><Icon name="check" size={14} />Đã học</> : "Từ mới"}</span></article>)}</div>
          </> : <>
            <div className="vocab-course-heading"><span className="vocab-course-icon"><Icon name="book" size={30} /></span><div><span className="eyebrow">HỌC TỪ MỚI</span><h2>Danh sách bài học</h2><p>BOYA 1 · {data.lessons.length} bài · {allTerms.length} từ vựng</p></div></div>
            <div className="vocab-lesson-grid">{data.lessons.map((item) => {
              const learned = item.terms.filter((term) => progress[term.id]).length;
              const completed = learned === item.terms.length;
              const recommended = item.number === nextLesson?.number;
              return <button key={item.number} className={`vocab-lesson-card ${recommended ? "is-recommended" : ""} ${completed ? "is-complete" : ""}`} onClick={() => setLessonNumber(item.number)}>
                <span className="vocab-lesson-card-top"><span>BÀI {String(item.number).padStart(2, "0")}</span>{recommended ? <b>{learned ? "Học tiếp" : "Bắt đầu ở đây"}</b> : completed ? <Icon name="check" size={20} /> : <Icon name="book" size={20} />}</span>
                <strong>{item.title}</strong><span className="vocab-lesson-count">{item.terms.length} từ vựng</span>
                <span className="vocab-lesson-card-bottom"><span><span className="linear-progress"><span style={{ width: `${item.terms.length ? learned / item.terms.length * 100 : 0}%` }} /></span><small>{learned}/{item.terms.length} từ đã học</small></span><span className="vocab-lesson-arrow"><Icon name="arrow-right" size={20} /></span></span>
              </button>;
            })}</div>
          </>}
        </div>}
  </section>;
}
