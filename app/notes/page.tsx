"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader, PageSkeleton, SubjectPill } from "@/components/ui";
import { subjects } from "@/lib/data";
import { usePlanner } from "@/lib/planner-context";
import type { SubjectId } from "@/lib/types";

function NotePreview({ content }: { content: string }) {
  return (
    <div className="note-rendered">
      {content.split("\n").map((line, index) => {
        if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
        if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
        if (line.startsWith("- ")) return <div className="rendered-list-item" key={index}><span />{line.slice(2)}</div>;
        if (/^\d+\. /.test(line)) return <div className="rendered-list-item numbered" key={index}><span>{line.match(/^\d+/)?.[0]}</span>{line.replace(/^\d+\. /, "")}</div>;
        if (!line.trim()) return <div className="rendered-space" key={index} />;
        return <p key={index}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function NotesPage() {
  const { state, ready, addNote, updateNote, deleteNote } = usePlanner();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | "all">("all");
  const [selectedId, setSelectedId] = useState(state.notes[0]?.id ?? "");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get("note");
    const subject = params.get("subject") as SubjectId | null;
    if (noteId && state.notes.some((note) => note.id === noteId)) setSelectedId(noteId);
    if (subject && subjects.some((item) => item.id === subject)) setSubjectFilter(subject);
  }, [state.notes]);

  const filteredNotes = useMemo(() => {
    const query = search.toLocaleLowerCase("vi");
    return [...state.notes]
      .filter((note) => subjectFilter === "all" || note.subject === subjectFilter)
      .filter((note) => !query || `${note.title} ${note.content}`.toLocaleLowerCase("vi").includes(query))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [state.notes, search, subjectFilter]);

  const selected = state.notes.find((note) => note.id === selectedId) ?? filteredNotes[0];

  if (!ready) return <PageSkeleton />;

  const createNote = () => {
    const id = addNote({ title: "Ghi chú chưa đặt tên", subject: subjectFilter === "all" ? "calculus" : subjectFilter, content: "# Ý chính\n\nBắt đầu ghi lại điều Dương vừa học…" });
    setSelectedId(id);
    setShowPreview(false);
  };

  const removeSelected = () => {
    if (!selected || !window.confirm(`Xóa ghi chú “${selected.title}”? Thao tác này không thể hoàn tác.`)) return;
    deleteNote(selected.id);
    setSelectedId(state.notes.find((note) => note.id !== selected.id)?.id ?? "");
  };

  return (
    <div className="page notes-page">
      <PageHeader
        eyebrow="Sổ tay học tập"
        title="Ghi lại để hiểu sâu hơn"
        description="Tách ghi chú theo môn, ghim phần quan trọng và tự động lưu từng thay đổi ngay trên thiết bị."
        sticker="notebook"
        stickerTone="violet"
        action={<button className="button primary" onClick={createNote}><Icon name="plus" size={18} />Trang mới</button>}
      />

      <div className="notes-workspace">
        <aside className="notes-sidebar panel">
          <div className="search-box"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Tìm trong sổ tay" placeholder="Tìm ghi chú…" /></div>
          <div className="filter-chips" aria-label="Lọc theo môn">
            <button className={subjectFilter === "all" ? "active" : ""} onClick={() => setSubjectFilter("all")}>Tất cả</button>
            {subjects.map((subject) => <button key={subject.id} className={subjectFilter === subject.id ? `active tone-${subject.color}` : ""} onClick={() => setSubjectFilter(subject.id)}>{subject.shortName}</button>)}
          </div>
          <div className="note-list">
            {filteredNotes.map((note) => (
              <button key={note.id} className={`note-list-item ${selected?.id === note.id ? "active" : ""}`} onClick={() => { setSelectedId(note.id); setShowPreview(false); }}>
                <span className="note-list-meta"><SubjectPill subject={note.subject} compact />{note.pinned && <Icon name="pin" size={14} />}</span>
                <strong>{note.title}</strong>
                <p>{note.content.replace(/[#*\-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 75)}</p>
                <small>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(note.updatedAt))}</small>
              </button>
            ))}
            {!filteredNotes.length && <EmptyState icon="search" title="Không tìm thấy" description="Thử từ khóa hoặc môn học khác." />}
          </div>
        </aside>

        <section className="note-editor panel">
          {selected ? (
            <>
              <header className="editor-toolbar">
                <div className="editor-title-row">
                  <input className="editor-title" aria-label="Tiêu đề ghi chú" value={selected.title} onChange={(event) => updateNote(selected.id, { title: event.target.value })} />
                  <span className="autosave"><span />Đã lưu</span>
                </div>
                <div className="editor-controls">
                  <select aria-label="Môn học" value={selected.subject} onChange={(event) => updateNote(selected.id, { subject: event.target.value as SubjectId })}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
                  <button className={`icon-button ${selected.pinned ? "is-active" : ""}`} onClick={() => updateNote(selected.id, { pinned: !selected.pinned })} aria-label={selected.pinned ? "Bỏ ghim" : "Ghim ghi chú"}><Icon name="pin" size={19} /></button>
                  <button className="icon-button danger" onClick={removeSelected} aria-label="Xóa ghi chú"><Icon name="trash" size={19} /></button>
                </div>
                <div className="editor-tabs" role="tablist" aria-label="Chế độ ghi chú"><button role="tab" aria-selected={!showPreview} className={!showPreview ? "active" : ""} onClick={() => setShowPreview(false)}>Viết</button><button role="tab" aria-selected={showPreview} className={showPreview ? "active" : ""} onClick={() => setShowPreview(true)}>Xem trước</button></div>
              </header>
              {showPreview ? <NotePreview content={selected.content} /> : (
                <textarea className="note-textarea" aria-label="Nội dung ghi chú" value={selected.content} onChange={(event) => updateNote(selected.id, { content: event.target.value })} spellCheck="true" />
              )}
              <footer className="editor-footer"><span>Dùng <code>#</code> cho tiêu đề, <code>##</code> cho đề mục và <code>-</code> cho danh sách.</span><span>{selected.content.trim().split(/\s+/).filter(Boolean).length} từ</span></footer>
            </>
          ) : <EmptyState icon="notebook" title="Sổ tay đang trống" description="Tạo một trang mới để bắt đầu ghi lại bài học." action={<button className="button primary" onClick={createNote}><Icon name="plus" size={18} />Tạo trang đầu tiên</button>} />}
        </section>
      </div>
    </div>
  );
}
