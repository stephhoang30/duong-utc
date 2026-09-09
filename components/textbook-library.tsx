"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { PdfBookReader } from "@/components/pdf-book-reader";
import {
  libraryBooks,
  librarySubjectMeta,
  librarySubjectOptions,
  type LibraryBook,
  type LibrarySubject,
} from "@/lib/library-data";

type Filter = "all" | "saved" | LibrarySubject;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function BookCard({ book, active, saved, onOpen, onSave }: { book: LibraryBook; active: boolean; saved: boolean; onOpen: () => void; onSave: () => void }) {
  const meta = librarySubjectMeta[book.subject];
  return (
    <article className={`library-book-card tone-${meta.tone} ${active ? "active" : ""}`}>
      <button className="library-book-main" onClick={onOpen} aria-pressed={active}>
        <span className="library-book-icon"><Icon name="book" size={22} /></span>
        <span className="library-book-copy">
          <small>{meta.label}</small>
          <strong>{book.title}</strong>
          <span>{book.author}</span>
        </span>
      </button>
      <button className={`library-save ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? `Bỏ lưu ${book.title}` : `Lưu ${book.title}`} aria-pressed={saved}>
        <Icon name="bookmark" size={17} />
      </button>
    </article>
  );
}

export function TextbookLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState(libraryBooks[0].id);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("duong-library-saved") ?? "[]");
      if (Array.isArray(stored)) setSavedIds(stored.filter((id): id is string => typeof id === "string"));
    } catch {
      setSavedIds([]);
    }
  }, []);

  const filteredBooks = useMemo(() => {
    const keyword = normalize(query.trim());
    return libraryBooks.filter((book) => {
      const matchesFilter = filter === "all" || (filter === "saved" ? savedIds.includes(book.id) : book.subject === filter);
      const haystack = normalize(`${book.title} ${book.author} ${librarySubjectMeta[book.subject].label} ${book.description}`);
      return matchesFilter && (!keyword || haystack.includes(keyword));
    });
  }, [filter, query, savedIds]);

  const selectedBook = filteredBooks.find((book) => book.id === selectedId) ?? filteredBooks[0] ?? libraryBooks[0];
  const selectedUrl = selectedBook.chapters?.[chapterIndex]?.url ?? selectedBook.readUrl;
  const viewerKey = `${selectedBook.id}:${selectedUrl}`;

  useEffect(() => {
    if (filteredBooks.length && !filteredBooks.some((book) => book.id === selectedId)) {
      setSelectedId(filteredBooks[0].id);
      setChapterIndex(0);
    }
  }, [filteredBooks, selectedId]);

  const openBook = (book: LibraryBook) => {
    setSelectedId(book.id);
    setChapterIndex(0);
    if (window.matchMedia("(max-width: 980px)").matches) {
      window.setTimeout(() => viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("duong-library-saved", JSON.stringify(next));
      return next;
    });
  };

  return (
    <>
      <section className="library-controls panel-lite" aria-label="Tìm và lọc giáo trình">
        <label className="library-search">
          <span className="sr-only">Tìm giáo trình</span>
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên sách, tác giả hoặc môn…" />
        </label>
        <div className="library-filters" role="tablist" aria-label="Lọc theo môn học">
          {librarySubjectOptions.map((option) => (
            <button key={option.id} role="tab" aria-selected={filter === option.id} className={filter === option.id ? "active" : ""} onClick={() => setFilter(option.id)}>
              {option.id === "saved" && <Icon name="bookmark" size={15} />}{option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="library-workspace">
        <section className="library-catalog panel" aria-label="Danh mục giáo trình">
          <div className="library-catalog-heading">
            <div><span className="eyebrow">Danh mục</span><h2>{filteredBooks.length} giáo trình</h2></div>
            <small><Icon name="check" size={13} /> Đã lưu PDF</small>
          </div>
          <div className="library-book-list">
            {filteredBooks.map((book) => <BookCard key={book.id} book={book} active={selectedBook.id === book.id} saved={savedIds.includes(book.id)} onOpen={() => openBook(book)} onSave={() => toggleSaved(book.id)} />)}
            {!filteredBooks.length && <div className="library-empty"><Icon name="search" size={28} /><strong>Không tìm thấy giáo trình</strong><span>Thử từ khóa hoặc môn học khác.</span></div>}
          </div>
        </section>

        <section ref={viewerRef} className="library-reader panel" aria-label="Khung đọc giáo trình">
          <header className="library-reader-heading">
            <div className={`library-reader-title tone-${librarySubjectMeta[selectedBook.subject].tone}`}>
              <span><Icon name="book" size={21} /></span>
              <div><small>{selectedBook.accessLabel}</small><h2>{selectedBook.title}</h2></div>
            </div>
            <div className="library-reader-actions">
              {selectedBook.chapters && <label><span className="sr-only">Chọn bài BOYA</span><select value={chapterIndex} onChange={(event) => setChapterIndex(Number(event.target.value))}>{selectedBook.chapters.map((chapter, index) => <option key={chapter.label} value={index}>{chapter.label}</option>)}</select></label>}
              <a className="button ghost small" href={selectedUrl} target="_blank" rel="noreferrer"><Icon name="external-link" size={16} />Toàn màn hình</a>
              <a className="button ghost small" href={selectedUrl} download><Icon name="download" size={16} />Tải PDF</a>
            </div>
          </header>

          <div className="library-reader-meta">
            <span>{selectedBook.author}</span><i />
            <span>{selectedBook.language}</span><i />
            <span>{librarySubjectMeta[selectedBook.subject].label}</span><i />
            <span>{selectedBook.fileLabel}</span>
          </div>
          <p className="library-reader-description">{selectedBook.description}</p>

          <PdfBookReader key={viewerKey} title={selectedBook.title} url={selectedUrl} />

          <footer className="library-source">
            <div><Icon name="check" size={17} /><span><strong>{selectedBook.sourceLabel}</strong><small>{selectedBook.license}</small></span></div>
            <a href={selectedBook.sourceUrl} target={selectedBook.sourceUrl.startsWith("/") ? undefined : "_blank"} rel={selectedBook.sourceUrl.startsWith("/") ? undefined : "noreferrer"}>Xem nguồn <Icon name="arrow-right" size={15} /></a>
          </footer>
        </section>
      </div>
    </>
  );
}
