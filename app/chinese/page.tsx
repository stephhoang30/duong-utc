"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BoyaLibrary, HskLibrary } from "@/components/chinese-resource-hub";
import { Icon } from "@/components/icons";
import { PageHeader, PageSkeleton, SectionHeading } from "@/components/ui";
import { chineseLessons, dailyChineseWords } from "@/lib/data";
import { usePlanner } from "@/lib/planner-context";

export default function ChinesePage() {
  const { state, ready, toggleChineseLesson, addFlashcard } = usePlanner();
  const [revealedWords, setRevealedWords] = useState<number[]>([]);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [view, setView] = useState<"today" | "boya" | "hsk">("boya");
  const progress = Math.round((state.completedChineseLessons.length / chineseLessons.length) * 100);
  const nextLesson = chineseLessons.find((lesson) => !state.completedChineseLessons.includes(lesson.id));

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (requestedView === "today" || requestedView === "boya" || requestedView === "hsk") setView(requestedView);
  }, []);

  if (!ready) return <PageSkeleton />;

  const toggleWord = (index: number) => {
    setRevealedWords((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
  };

  const saveWord = (word: (typeof dailyChineseWords)[number]) => {
    if (!state.flashcards.some((card) => card.front === word.hanzi)) {
      addFlashcard({ deck: "chinese", front: word.hanzi, back: `${word.pinyin} · ${word.meaning}`, hint: word.example });
    }
    setCopiedWord(word.hanzi);
    window.setTimeout(() => setCopiedWord(null), 2200);
  };

  return (
    <div className="page chinese-page">
      <PageHeader
        eyebrow="BOYA 1 · 中文学习"
        title="Học BOYA 1, ôn chắc từng bài"
        description="Bài học hằng ngày, tài liệu BOYA, bảng từ vựng–ngữ pháp và bộ đề HSK được gom lại để Dương mở đúng thứ cần học."
        sticker="language"
        stickerTone="jade"
        action={<Link className="button primary" href="/exams"><Icon name="exam" size={18} />Làm mini test</Link>}
      />

      <nav className="chinese-view-tabs panel-lite" aria-label="Khu vực học tiếng Trung">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")} aria-pressed={view === "today"}><Icon name="sparkle" size={18} />Học hôm nay</button>
        <button className={view === "boya" ? "active" : ""} onClick={() => setView("boya")} aria-pressed={view === "boya"}><Icon name="book" size={18} />Tài liệu BOYA 1</button>
        <button className={view === "hsk" ? "active" : ""} onClick={() => setView("hsk")} aria-pressed={view === "hsk"}><Icon name="exam" size={18} />Đề HSK & HSKK</button>
      </nav>

      {view === "today" && <>
      <section className="chinese-hero panel">
        <div className="hanzi-decoration" aria-hidden="true">学</div>
        <div className="chinese-hero-copy">
          <span className="eyebrow">Lộ trình hiện tại</span>
          <h2>HSK 1 · Xây nền phát âm và 150 từ cơ bản</h2>
          <p>Bài tiếp theo: <b>{nextLesson?.title ?? "Đã hoàn thành toàn bộ lộ trình"}</b></p>
          <div className="linear-progress chinese-progress"><span style={{ width: `${progress}%` }} /></div>
          <small>{state.completedChineseLessons.length}/{chineseLessons.length} bài · {progress}% hoàn thành</small>
        </div>
        <div className="streak-card"><Icon name="flame" size={24} /><strong>{state.chineseStreak}</strong><span>ngày liên tục</span></div>
      </section>

      <div className="chinese-dashboard-grid">
        <section className="panel daily-words-panel">
          <SectionHeading icon="sparkle" title="5 từ của hôm nay" description="Đọc chữ trước, tự đoán rồi mới lật nghĩa" />
          <div className="word-grid">
            {dailyChineseWords.map((word, index) => {
              const revealed = revealedWords.includes(index);
              const saved = state.flashcards.some((card) => card.front === word.hanzi);
              return (
                <article key={word.hanzi} className={`word-card ${revealed ? "is-revealed" : ""}`}>
                  <button className="word-main" onClick={() => toggleWord(index)} aria-expanded={revealed}>
                    <strong>{word.hanzi}</strong>
                    {revealed ? <><span className="pinyin">{word.pinyin}</span><span>{word.meaning}</span></> : <span>Chạm để xem nghĩa</span>}
                  </button>
                  {revealed && <div className="word-detail"><p>{word.example}</p><button onClick={() => saveWord(word)} disabled={saved && copiedWord !== word.hanzi}><Icon name={saved ? "check" : "plus"} size={15} />{copiedWord === word.hanzi ? "Đã thêm" : saved ? "Có trong bộ ôn" : "Thêm vào ôn bài"}</button></div>}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="panel tone-guide">
          <SectionHeading icon="language" title="Bốn thanh điệu" description="Cao độ đúng quan trọng hơn nói thật nhanh" />
          <div className="tone-list">
            <div><span className="tone-line tone-1">ā</span><strong>Thanh 1</strong><small>Cao và ngang</small></div>
            <div><span className="tone-line tone-2">á</span><strong>Thanh 2</strong><small>Đi lên, như hỏi</small></div>
            <div><span className="tone-line tone-3">ǎ</span><strong>Thanh 3</strong><small>Hạ rồi nâng</small></div>
            <div><span className="tone-line tone-4">à</span><strong>Thanh 4</strong><small>Rơi mạnh, dứt khoát</small></div>
          </div>
          <div className="tone-tip"><Icon name="sparkle" size={17} /><span>Tập theo cặp <b>mā – má – mǎ – mà</b>, ghi âm và nghe lại một lần.</span></div>
        </aside>
      </div>

      <section className="panel chinese-roadmap">
        <SectionHeading icon="target" title="Lộ trình HSK 1" description="Đánh dấu từng bài khi Dương đã học và tự nói được mẫu câu chính" />
        <div className="lesson-list">
          {chineseLessons.map((lesson, index) => {
            const complete = state.completedChineseLessons.includes(lesson.id);
            const isNext = nextLesson?.id === lesson.id;
            return (
              <article key={lesson.id} className={`lesson-row ${complete ? "is-complete" : ""} ${isNext ? "is-next" : ""}`}>
                <button className="lesson-check" onClick={() => toggleChineseLesson(lesson.id)} aria-label={complete ? `Đánh dấu chưa học: ${lesson.title}` : `Đánh dấu đã học: ${lesson.title}`} aria-pressed={complete}>{complete ? <Icon name="check" size={17} /> : index + 1}</button>
                <div><span>{lesson.level}{isNext && <small> Bài tiếp theo</small>}</span><h3>{lesson.title}</h3><p>{lesson.description}</p></div>
                <span className="lesson-time"><Icon name="clock" size={15} />{lesson.minutes} phút</span>
              </article>
            );
          })}
        </div>
      </section>

      <div className="chinese-bottom-grid">
        <section className="panel sentence-practice">
          <SectionHeading icon="notebook" title="Luyện đặt câu" description="Viết ba câu thật gần với cuộc sống của Dương" />
          <div className="sentence-prompt"><span>Gợi ý hôm nay</span><strong>我喜欢…</strong><p>Wǒ xǐhuan… · Tôi thích…</p></div>
          <label className="field"><span>Câu của Dương</span><textarea placeholder="Ví dụ: 我喜欢学习汉语。Wǒ xǐhuan xuéxí Hànyǔ." /></label>
          <p className="helper-text">Đọc thành tiếng ba lần, sau đó thử viết lại mà không nhìn mẫu.</p>
        </section>
        <section className="panel chinese-next-actions">
          <SectionHeading icon="review" title="Giữ nhịp hôm nay" />
          <Link href="/review" className="action-tile tone-rose"><span><Icon name="review" /></span><div><strong>Ôn flashcard tiếng Trung</strong><small>{state.flashcards.filter((card) => card.deck === "chinese").length} thẻ đang có</small></div><Icon name="arrow-right" size={17} /></Link>
          <Link href="/exams" className="action-tile tone-jade"><span><Icon name="exam" /></span><div><strong>Làm HSK 1 mini test</strong><small>6 câu · khoảng 6 phút</small></div><Icon name="arrow-right" size={17} /></Link>
          <Link href="/notes?subject=chinese" className="action-tile tone-blue"><span><Icon name="notebook" /></span><div><strong>Mở sổ tay tiếng Trung</strong><small>Ghi mẫu câu và lỗi phát âm</small></div><Icon name="arrow-right" size={17} /></Link>
        </section>
      </div>

      <div className="chinese-stamp" aria-hidden="true"><span>天天向上</span><small>Tiến bộ mỗi ngày</small></div>
      </>}

      {view === "boya" && <BoyaLibrary />}
      {view === "hsk" && <HskLibrary />}
    </div>
  );
}
