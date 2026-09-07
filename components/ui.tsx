import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { subjectMap } from "@/lib/data";
import type { StudyTask, SubjectId } from "@/lib/types";
import { Icon, type IconName } from "./icons";

type StickerTone = "blue" | "rose" | "violet" | "jade" | "gold" | "coral";

export function PageHeader({ eyebrow, title, description, action, sticker, stickerTone = "blue" }: { eyebrow: string; title: string; description: string; action?: ReactNode; sticker?: IconName; stickerTone?: StickerTone }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {(sticker || action) && <div className="page-header-side">
        {sticker && <span className={`page-sticker sticker-${stickerTone}`} aria-hidden="true"><i /><Icon name={sticker} size={30} /><b><Icon name="sparkle" size={12} /></b></span>}
        {action && <div className="page-action">{action}</div>}
      </div>}
    </header>
  );
}

export function SectionHeading({ icon, title, description, link, linkLabel }: { icon?: IconName; title: string; description?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{icon && <span className="heading-icon"><Icon name={icon} size={18} /></span>}{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && <Link className="text-link" href={link}>{linkLabel ?? "Xem tất cả"}<Icon name="arrow-right" size={16} /></Link>}
    </div>
  );
}

export function SubjectPill({ subject, compact = false }: { subject: SubjectId; compact?: boolean }) {
  const item = subjectMap[subject];
  return <span className={`subject-pill tone-${item.color} ${compact ? "compact" : ""}`}>{item.shortName}</span>;
}

export function TaskRow({ task, onToggle, onDelete }: { task: StudyTask; onToggle: () => void; onDelete?: () => void }) {
  return (
    <div className={`task-row ${task.done ? "is-done" : ""}`}>
      <button className="task-check" onClick={onToggle} aria-label={task.done ? `Đánh dấu chưa xong: ${task.title}` : `Đánh dấu đã xong: ${task.title}`} aria-pressed={task.done}>
        {task.done && <Icon name="check" size={15} />}
      </button>
      <div className="task-copy">
        <strong>{task.title}</strong>
        <div><SubjectPill subject={task.subject} compact /> <span><Icon name="clock" size={13} />{task.startTime ?? "Linh hoạt"} · {task.duration} phút</span></div>
      </div>
      <span className={`priority priority-${task.priority}`}>{task.priority === "high" ? "Quan trọng" : task.priority === "medium" ? "Vừa" : "Nhẹ"}</span>
      {onDelete && <button className="ghost-icon danger" onClick={onDelete} aria-label={`Xóa: ${task.title}`}><Icon name="trash" size={18} /></button>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: IconName; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span><Icon name={icon} size={30} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ProgressRing({ value, label, color = "var(--primary)" }: { value: number; label: string; color?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring" style={{ "--progress": safe, "--ring-color": color } as CSSProperties} role="img" aria-label={`${label}: ${safe}%`}>
      <div><strong>{safe}%</strong><span>{label}</span></div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page page-skeleton" aria-label="Đang mở planner" aria-busy="true">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-line copy" />
      <div className="skeleton-grid"><div /><div /><div /></div>
    </div>
  );
}
