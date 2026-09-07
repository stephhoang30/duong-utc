"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { HskFileBrowser } from "./hsk-file-browser";
import { SectionHeading } from "./ui";
import { boyaResources, chineseSourceLinks, getBoyaLessonAudio, getBoyaLessonPdf, hskMilestones, hskSources, localBoyaLibrary, type BoyaResourceCategory } from "@/lib/chinese-resources";
import { usePlanner } from "@/lib/planner-context";
import type { BoyaResourceStatus } from "@/lib/types";

const filters: { value: "all" | BoyaResourceCategory; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "lesson", label: "Bài giảng" },
  { value: "practice", label: "Luyện tập" },
  { value: "vocabulary", label: "Từ vựng" },
  { value: "exam", label: "Đề thi" },
];

const statusContent: Record<BoyaResourceStatus, { label: string; helper: string; icon: "clock" | "play" | "check" }> = {
  todo: { label: "Chưa học", helper: "Chuyển sang đang học", icon: "clock" },
  doing: { label: "Đang học", helper: "Đánh dấu đã xong", icon: "play" },
  done: { label: "Đã xong", helper: "Đặt lại trạng thái", icon: "check" },
};

export function BoyaLibrary() {
  const { state, setBoyaCurrentLesson, cycleBoyaResourceStatus } = usePlanner();
  const [filter, setFilter] = useState<"all" | BoyaResourceCategory>("all");
  const visibleResources = filter === "all" ? boyaResources : boyaResources.filter((resource) => resource.category === filter);
  const doneCount = boyaResources.filter((resource) => state.boyaResourceStatus[resource.id] === "done").length;
  const doingCount = boyaResources.filter((resource) => state.boyaResourceStatus[resource.id] === "doing").length;
  const lessonProgress = Math.round(((state.boyaCurrentLesson - 1) / 30) * 100);
  const hasCurrentLesson = !localBoyaLibrary.missingLessons.includes(state.boyaCurrentLesson as 21);
  const currentLessonPdf = getBoyaLessonPdf(state.boyaCurrentLesson);
  const currentLessonAudio = getBoyaLessonAudio(state.boyaCurrentLesson);

  return (
    <>
      <section className="boya-overview panel">
        <div className="boya-overview-copy">
          <span className="eyebrow">Chương trình hiện tại</span>
          <h2>BOYA 1 · Sơ cấp</h2>
          <div className="linear-progress boya-progress" aria-label={`Tiến độ đến bài ${state.boyaCurrentLesson} trên 30`}><span style={{ width: `${lessonProgress}%` }} /></div>
          <small>Đang ở Bài {state.boyaCurrentLesson}/30 · {lessonProgress}% lộ trình</small>
        </div>
        <div className="boya-overview-controls">
          <label className="boya-lesson-select"><span>Bài hiện tại</span><select value={state.boyaCurrentLesson} onChange={(event) => setBoyaCurrentLesson(Number(event.target.value))}>{Array.from({ length: 30 }, (_, index) => <option key={index + 1} value={index + 1}>Bài {index + 1}</option>)}</select></label>
          <div className="boya-mini-stats">
            <div><strong>{doneCount}</strong><span>đã xong</span></div>
            <div><strong>{doingCount}</strong><span>đang học</span></div>
            <div><strong>{boyaResources.length - doneCount - doingCount}</strong><span>chưa học</span></div>
          </div>
        </div>
      </section>

      <section className="local-library-strip panel" aria-label="Tài liệu BOYA đã lưu trong website">
        <span className="local-library-icon"><Icon name="folder" size={23} /></span>
        <div className="local-library-copy">
          <span>Đã nhập vào website</span>
          <strong>{localBoyaLibrary.totalFiles} PDF · 31 audio · 2 bảng Excel</strong>
          <p>{localBoyaLibrary.prerequisiteCount} bài tiền đề · {localBoyaLibrary.lessonCount} bài giảng · {localBoyaLibrary.supportCount} bộ bổ trợ · không cần mở Drive</p>
        </div>
        <div className={`local-lesson-status ${hasCurrentLesson ? "available" : "missing"}`}><Icon name={hasCurrentLesson ? "check" : "search"} size={16} /><span>{hasCurrentLesson ? `Đã có PDF Bài ${state.boyaCurrentLesson}` : `Chưa thấy PDF Bài ${state.boyaCurrentLesson}`}</span></div>
        {hasCurrentLesson ? <a className="button ghost small copy-path-button" href={currentLessonPdf} target="_blank"><Icon name="file" size={16} />Mở PDF bài này</a> : <span className="classin-label copy-path-button"><Icon name="search" size={15} />Thiếu Bài 21</span>}
      </section>

      <section className="current-lesson-media panel" aria-label={`Nghe audio BOYA Bài ${state.boyaCurrentLesson}`}>
        <span className="current-media-icon"><Icon name="headphones" size={23} /></span>
        <div className="current-media-copy"><span>Nghe ngay trong planner</span><strong>Audio BOYA · Bài {state.boyaCurrentLesson}</strong><p>File MP3 đã nằm trong website, đổi bài ở hộp chọn phía trên.</p></div>
        <audio key={currentLessonAudio} controls preload="metadata" src={currentLessonAudio}>Trình duyệt của bạn chưa hỗ trợ phát audio.</audio>
        <a className="media-download" href={currentLessonAudio} download><Icon name="download" size={16} />Tải MP3</a>
      </section>

      <section className="panel boya-resource-panel">
        <SectionHeading icon="folder" title="Tủ tài liệu BOYA 1" description="Bấm trạng thái để chuyển lần lượt: Chưa học → Đang học → Đã xong" />
        <div className="resource-filters" role="tablist" aria-label="Lọc tài liệu BOYA 1">
          {filters.map((item) => <button key={item.value} role="tab" aria-selected={filter === item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}
        </div>

        <div className="boya-resource-list">
          {visibleResources.map((resource) => {
            const status = state.boyaResourceStatus[resource.id] ?? "todo";
            const statusItem = statusContent[status];
            const href = resource.id === "boya-lecture" && hasCurrentLesson ? currentLessonPdf : resource.href;
            const actionLabel = resource.id === "boya-lecture" ? `Mở PDF Bài ${state.boyaCurrentLesson}` : resource.actionLabel;
            return (
              <article className={`boya-resource-row status-${status}`} key={resource.id}>
                <span className="resource-icon"><Icon name={resource.icon} size={20} /></span>
                <div className="resource-copy">
                  <span>{resource.categoryLabel}</span>
                  <strong>{resource.title}</strong>
                  <p>{resource.description}</p>
                </div>
                <div className="resource-actions">
                  {href ? <a href={href} target={resource.download ? undefined : "_blank"} download={resource.download || undefined} aria-label={`${actionLabel ?? "Mở tài liệu"}: ${resource.title}`}><Icon name={resource.download ? "download" : "file"} size={16} />{actionLabel ?? "Mở tài liệu"}</a> : <span className="classin-label"><Icon name="folder" size={15} />Chưa có trong nguồn đã gửi</span>}
                  <button className={`resource-status status-${status}`} onClick={() => cycleBoyaResourceStatus(resource.id)} aria-label={`${resource.title}: ${statusItem.label}. ${statusItem.helper}`}><Icon name={statusItem.icon} size={15} />{statusItem.label}</button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="boya-file-browser">
          <div className="file-browser-heading"><div><span>PDF theo bài</span><strong>Mở nhanh toàn bộ bài giảng</strong></div><small>Bài 21 chưa có trong thư mục ClassIn</small></div>
          <div className="lesson-file-grid">
            {Array.from({ length: 30 }, (_, index) => index + 1).map((lesson) => localBoyaLibrary.missingLessons.includes(lesson as 21)
              ? <span key={lesson} className="missing" title="Chưa có tệp PDF">Bài {lesson}<small>Thiếu PDF</small></span>
              : <a key={lesson} className={lesson === state.boyaCurrentLesson ? "current" : ""} href={getBoyaLessonPdf(lesson)} target="_blank"><Icon name="file" size={15} />Bài {lesson}</a>)}
          </div>
          <div className="prerequisite-files">
            <span>Bài tiền đề</span>
            {[1, 2, 3].map((part) => <a key={part} href={`/resources/boya1/pdfs/prerequisite-${String(part).padStart(2, "0")}.pdf`} target="_blank"><Icon name="file" size={15} />Phần {part}</a>)}
            <a href="/resources/boya1/pdfs/net-co-ban.pdf" target="_blank"><Icon name="file" size={15} />Các nét cơ bản</a>
          </div>
        </div>
      </section>
    </>
  );
}

export function HskLibrary() {
  return (
    <>
      <section className="panel hsk-source-panel">
        <SectionHeading icon="folder" title="Tài liệu đã lưu trong web" description="Mở và tải trực tiếp, không chuyển tiếp qua Google Drive hay Google Sheets" />
        <div className="hsk-source-grid">
          {hskSources.map((source) => <a key={source.title} className={`hsk-source-card tone-${source.tone}`} href={source.href} download={source.download || undefined}>
            <span><Icon name={source.icon} size={22} /></span>
            <div><strong>{source.title}</strong><p>{source.description}</p></div>
            <Icon name={source.download ? "download" : "arrow-right"} size={17} />
          </a>)}
        </div>
      </section>

      <div className="hsk-library-grid">
        <section className="panel hsk-milestone-panel">
          <SectionHeading icon="target" title="Mốc bắt đầu luyện đề HSK" description="Mốc ước chừng theo bộ giáo trình Hán Ngữ" />
          <div className="hsk-reference-note"><Icon name="sparkle" size={18} /><p>Dương đang học <b>BOYA 1</b>. Các mốc dưới đây không phải quy đổi 1:1 từ BOYA sang HSK, chỉ dùng để tham khảo thời điểm bắt đầu luyện đề.</p></div>
          <div className="hsk-milestones">
            {hskMilestones.map((milestone, index) => <article key={milestone.level}>
              <span>{index + 2}</span>
              <div><strong>{milestone.level}</strong><b>{milestone.target}</b><p>{milestone.note}</p></div>
            </article>)}
          </div>
        </section>

        <aside className="panel hsk-howto-panel">
          <SectionHeading icon="exam" title="Cách dùng bộ đề" />
          <ol>
            <li><span>1</span><p>Chọn đúng nhóm cấp độ HSK cần luyện trong thư viện nội bộ.</p></li>
            <li><span>2</span><p>Mở PDF trước, dùng thư mục MP3 cho phần nghe.</p></li>
            <li><span>3</span><p>Nếu đề thiếu đáp án, lấy mã ở trang đầu, ví dụ <b>H10901</b>, rồi tìm “H10901 đáp án”.</p></li>
            <li><span>4</span><p>Với HSKK sơ cấp, tìm <a href={chineseSourceLinks.hskkYouTube} target="_blank" rel="noreferrer">HSKK 初级 trên YouTube</a>.</p></li>
          </ol>
          <div className="hsk-apps"><span>App luyện đề gợi ý</span><div><b>Migii HSK</b><b>HSK Online Test</b></div></div>
        </aside>
      </div>

      <HskFileBrowser />
    </>
  );
}
