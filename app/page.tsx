"use client";

import Link from "next/link";
import { useMemo } from "react";
import { chineseLessons, exams, subjectMap } from "@/lib/data";
import { formatDate, todayKey } from "@/lib/date";
import { usePlanner } from "@/lib/planner-context";
import { Icon } from "@/components/icons";
import { EmptyState, PageSkeleton, ProgressRing, SectionHeading, SubjectPill, TaskRow } from "@/components/ui";

export default function DashboardPage() {
  const { state, ready, toggleTask } = usePlanner();
  const today = todayKey();
  const pending = useMemo(
    () => state.tasks.filter((task) => !task.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [state.tasks],
  );
  const todayTasks = pending.filter((task) => task.dueDate <= today);
  const focusTasks = (todayTasks.length ? todayTasks : pending).slice(0, 4);
  const completedTasks = state.tasks.filter((task) => task.done).length;
  const taskProgress = state.tasks.length ? Math.round((completedTasks / state.tasks.length) * 100) : 0;
  const chineseProgress = Math.round((state.completedChineseLessons.length / chineseLessons.length) * 100);
  const bestExam = state.examResults.length
    ? Math.max(...state.examResults.map((result) => Math.round((result.score / result.total) * 100)))
    : 0;
  const latestNote = [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  if (!ready) return <PageSkeleton />;

  return (
    <div className="page dashboard-page">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="eyebrow">{formatDate(today, { weekday: "long", day: "numeric", month: "long" })}</span>
          <h1>Chào buổi sáng, Dương.</h1>
          <p>Hôm nay mình chỉ cần hoàn thành những việc quan trọng nhất. Planner sẽ giữ phần còn lại gọn gàng cho Dương.</p>
          <div className="welcome-actions">
            <Link className="button primary" href="/planner"><Icon name="plus" size={18} />Lên kế hoạch hôm nay</Link>
            <Link className="button secondary" href="/chinese"><Icon name="language" size={18} />Học tiếng Trung</Link>
          </div>
        </div>
        <div className="hero-note" aria-label="Mục tiêu tuần này">
          <span className="tape" />
          <small>Mục tiêu tuần này</small>
          <strong>Giữ nhịp 4 buổi tự học</strong>
          <p>Hiểu bài trong tuần, ôn lại sau 24 giờ, không dồn việc vào Chủ Nhật.</p>
          <div className="mini-checks"><span className="done"><Icon name="check" size={14} /> Lập lịch</span><span>Ôn bài</span><span>Tiếng Trung</span></div>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Tiến độ học tập">
        <article className="metric-card">
          <span className="metric-icon tone-violet"><Icon name="target" /></span>
          <div><strong>{completedTasks}/{state.tasks.length}</strong><span>việc đã hoàn thành</span></div>
          <small>{taskProgress}% kế hoạch</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-rose"><Icon name="review" /></span>
          <div><strong>BOYA 1</strong><span>ôn tập & học từ mới</span></div>
          <Link href="/review">Mở từ vựng <Icon name="arrow-right" size={14} /></Link>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-jade"><Icon name="flame" /></span>
          <div><strong>{state.chineseStreak}</strong><span>ngày học liên tục</span></div>
          <small>{state.completedChineseLessons.length}/{chineseLessons.length} bài HSK 1</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon tone-blue"><Icon name="exam" /></span>
          <div><strong>{bestExam || "—"}{bestExam ? "%" : ""}</strong><span>điểm thi tốt nhất</span></div>
          <small>{state.examResults.length}/{exams.length} lượt đã làm</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel today-panel">
          <SectionHeading icon="calendar" title={todayTasks.length ? "Việc cần làm hôm nay" : "Việc tiếp theo"} description={todayTasks.length ? `${todayTasks.length} việc đang chờ Dương` : "Không có việc quá hạn — đây là những việc gần nhất"} link="/planner" />
          <div className="task-list compact-list">
            {focusTasks.length ? focusTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
            )) : <EmptyState icon="check" title="Hôm nay đã xong!" description="Dương có thể nghỉ ngơi hoặc ôn vài flashcard nhẹ nhàng." />}
          </div>
        </section>

        <section className="panel progress-panel">
          <SectionHeading icon="target" title="Bức tranh tuần này" description="Cân bằng giữa đại học và ngoại ngữ" />
          <div className="ring-grid">
            <ProgressRing value={taskProgress} label="Kế hoạch" color="var(--violet)" />
            <ProgressRing value={chineseProgress} label="HSK 1" color="var(--jade)" />
            <ProgressRing value={bestExam} label="Bài thi" color="var(--coral)" />
          </div>
          <div className="progress-tip"><Icon name="sparkle" size={18} /><span>Ưu tiên hoàn thành việc quan trọng trước khi thêm nhiệm vụ mới.</span></div>
        </section>

        <section className="panel note-preview-panel">
          <SectionHeading icon="notebook" title="Sổ tay gần đây" description="Ý tưởng mới nhất của Dương" link="/notes" />
          {latestNote ? (
            <Link href={`/notes?note=${latestNote.id}`} className="note-paper">
              <span className="note-paper-top"><SubjectPill subject={latestNote.subject} compact /> <small>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(latestNote.updatedAt))}</small></span>
              <strong>{latestNote.title}</strong>
              <p>{latestNote.content.replace(/[#*\-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)}…</p>
              <span className="read-more">Mở ghi chú <Icon name="arrow-right" size={15} /></span>
            </Link>
          ) : <EmptyState icon="notebook" title="Chưa có ghi chú" description="Tạo trang đầu tiên trong sổ tay học tập." />}
        </section>

        <section className="panel subject-panel">
          <SectionHeading icon="book" title="Các môn đang học" description="Chạm để mở đúng không gian học" />
          <div className="subject-shortcuts">
            {Object.values(subjectMap).map((subject) => {
              const count = state.tasks.filter((task) => task.subject === subject.id && !task.done).length;
              const href = subject.id === "chinese" ? "/chinese" : `/notes?subject=${subject.id}`;
              return (
                <Link key={subject.id} href={href} className={`subject-shortcut tone-${subject.color}`}>
                  <span>{subject.shortName.slice(0, 1)}</span>
                  <div><strong>{subject.name}</strong><small>{count} việc đang chờ</small></div>
                  <Icon name="arrow-right" size={17} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
