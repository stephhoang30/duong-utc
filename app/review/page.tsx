"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { BoyaReviewDeck } from "@/components/boya-review-deck";
import { EmptyState, PageHeader, PageSkeleton, SectionHeading, SubjectPill } from "@/components/ui";
import { subjects } from "@/lib/data";
import { todayKey } from "@/lib/date";
import { usePlanner } from "@/lib/planner-context";
import type { SubjectId } from "@/lib/types";

export default function ReviewPage() {
  const { state, ready, rateFlashcard, addFlashcard } = usePlanner();
  const [deck, setDeck] = useState<SubjectId | "all">("all");
  const [revealed, setRevealed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [newDeck, setNewDeck] = useState<SubjectId>("chinese");
  const today = todayKey();

  const dueCards = useMemo(
    () => state.flashcards.filter((card) => card.dueDate <= today && (deck === "all" || card.deck === deck)),
    [state.flashcards, today, deck],
  );
  const currentCard = dueCards[0];
  const learned = state.flashcards.filter((card) => card.repetitions > 0).length;

  if (!ready) return <PageSkeleton />;

  const rate = (rating: "hard" | "good" | "easy") => {
    if (!currentCard) return;
    rateFlashcard(currentCard.id, rating);
    setRevealed(false);
  };

  const submitCard = (event: FormEvent) => {
    event.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addFlashcard({ deck: newDeck, front: front.trim(), back: back.trim() });
    setFront("");
    setBack("");
    setShowForm(false);
  };

  return (
    <div className="page review-page">
      <PageHeader
        eyebrow="BOYA 1 · Ôn tập"
        title="Ôn từ vựng theo từng bài"
        description="Lật thẻ, nghe phát âm và đánh dấu những từ đã nhớ."
        sticker="review"
        stickerTone="rose"
        action={<button className="button secondary" onClick={() => setShowForm((value) => !value)}><Icon name={showForm ? "x" : "plus"} size={18} />{showForm ? "Đóng" : "Tạo thẻ"}</button>}
      />

      {showForm && (
        <form className="panel flashcard-form" onSubmit={submitCard}>
          <div><h2>Tạo flashcard mới</h2><p>Mỗi thẻ chỉ nên kiểm tra một ý để việc ôn nhanh và chính xác.</p></div>
          <label className="field"><span>Bộ thẻ</span><select value={newDeck} onChange={(event) => setNewDeck(event.target.value as SubjectId)}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="field"><span>Mặt trước · Câu hỏi</span><textarea value={front} onChange={(event) => setFront(event.target.value)} required placeholder="Ví dụ: 你好 nghĩa là gì?" /></label>
          <label className="field"><span>Mặt sau · Đáp án</span><textarea value={back} onChange={(event) => setBack(event.target.value)} required placeholder="nǐ hǎo · xin chào" /></label>
          <div className="form-actions"><button type="button" className="button ghost" onClick={() => setShowForm(false)}>Hủy</button><button type="submit" className="button primary"><Icon name="check" size={17} />Lưu thẻ</button></div>
        </form>
      )}

      <BoyaReviewDeck initialLesson={state.boyaCurrentLesson} />

      <SectionHeading icon="review" title="Thẻ ôn cá nhân" description="Các thẻ Dương tự tạo và lịch ôn ngắt quãng" />
      <section className="review-stats">
        <article><span className="metric-icon tone-rose"><Icon name="review" /></span><div><strong>{dueCards.length}</strong><span>thẻ đến hạn trong bộ đang chọn</span></div></article>
        <article><span className="metric-icon tone-jade"><Icon name="check" /></span><div><strong>{learned}</strong><span>thẻ đã từng ôn</span></div></article>
        <article><span className="metric-icon tone-blue"><Icon name="book" /></span><div><strong>{state.flashcards.length}</strong><span>thẻ trong thư viện</span></div></article>
      </section>

      <div className="review-layout">
        <aside className="panel deck-panel">
          <SectionHeading icon="book" title="Bộ thẻ" description="Chọn một môn để tập trung" />
          <button className={`deck-row ${deck === "all" ? "active" : ""}`} onClick={() => { setDeck("all"); setRevealed(false); }}><span className="deck-symbol all"><Icon name="sparkle" size={18} /></span><div><strong>Tất cả môn</strong><small>{state.flashcards.filter((card) => card.dueDate <= today).length} thẻ đến hạn</small></div><Icon name="arrow-right" size={17} /></button>
          {subjects.map((subject) => {
            const allCount = state.flashcards.filter((card) => card.deck === subject.id).length;
            const dueCount = state.flashcards.filter((card) => card.deck === subject.id && card.dueDate <= today).length;
            return (
              <button key={subject.id} className={`deck-row ${deck === subject.id ? "active" : ""}`} onClick={() => { setDeck(subject.id); setRevealed(false); }}>
                <span className={`deck-symbol tone-${subject.color}`}>{subject.shortName.slice(0, 1)}</span>
                <div><strong>{subject.name}</strong><small>{dueCount} đến hạn · {allCount} tổng</small></div>
                <Icon name="arrow-right" size={17} />
              </button>
            );
          })}
        </aside>

        <section className="panel review-session">
          <div className="review-session-head">
            <div><span className="eyebrow">Phiên ôn hôm nay</span><h2>{deck === "all" ? "Tất cả môn" : subjects.find((item) => item.id === deck)?.name}</h2></div>
            <span className="queue-count">Còn {dueCards.length} thẻ</span>
          </div>
          {currentCard ? (
            <>
              <button className={`flashcard ${revealed ? "is-revealed" : ""}`} onClick={() => setRevealed(true)} aria-label={revealed ? "Đã hiện đáp án" : "Chạm để hiện đáp án"}>
                <span className="flashcard-top"><SubjectPill subject={currentCard.deck} compact /><small>Lần ôn {currentCard.repetitions + 1}</small></span>
                <span className="flashcard-label">{revealed ? "Đáp án" : "Câu hỏi"}</span>
                <strong>{revealed ? currentCard.back : currentCard.front}</strong>
                {!revealed && currentCard.hint && <small className="flashcard-hint">Gợi ý: {currentCard.hint}</small>}
                <span className="flashcard-action">{revealed ? "Dương nhớ ở mức nào?" : "Chạm để lật thẻ"}</span>
              </button>
              {revealed ? (
                <div className="rating-grid" aria-label="Đánh giá độ nhớ">
                  <button className="rating-hard" onClick={() => rate("hard")}><strong>Khó</strong><span>Ôn lại ngày mai</span></button>
                  <button className="rating-good" onClick={() => rate("good")}><strong>Nhớ được</strong><span>Lặp lại sau 2–8 ngày</span></button>
                  <button className="rating-easy" onClick={() => rate("easy")}><strong>Rất dễ</strong><span>Giãn lịch lâu hơn</span></button>
                </div>
              ) : <p className="keyboard-tip">Đọc câu hỏi, tự trả lời thành tiếng rồi mới lật thẻ.</p>}
            </>
          ) : <EmptyState icon="sparkle" title="Bộ thẻ này đã ôn xong" description="Không còn thẻ đến hạn hôm nay. Dương có thể tạo thẻ mới hoặc chuyển sang môn khác." action={<button className="button secondary" onClick={() => setShowForm(true)}><Icon name="plus" size={17} />Tạo thẻ mới</button>} />}
        </section>
      </div>
    </div>
  );
}
