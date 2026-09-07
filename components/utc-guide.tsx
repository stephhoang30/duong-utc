"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import {
  utcCourseLabels,
  utcGuideNavigation,
  utcSemesterClasses,
  type UtcClassEvent,
  type UtcGuideSectionId,
} from "@/lib/utc-data";

const months = [
  { year: 2026, month: 8, label: "Tháng 9" },
  { year: 2026, month: 9, label: "Tháng 10" },
  { year: 2026, month: 10, label: "Tháng 11" },
  { year: 2026, month: 11, label: "Tháng 12" },
  { year: 2027, month: 0, label: "Tháng 1/27" },
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatGuideDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function currentKeyAndTime() {
  const value = new Date();
  return `${dateKey(value.getFullYear(), value.getMonth(), value.getDate())} ${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function CalendarEvent({ event }: { event: UtcClassEvent }) {
  return (
    <article className={`utc-class-event course-${event.kind}`}>
      <div className="utc-class-time"><strong>{event.start}</strong><span>{event.end}</span></div>
      <div>
        <span className="utc-course-label">{utcCourseLabels[event.kind]}</span>
        <h3>{event.title}</h3>
        <p><Icon name="location" size={14} />{event.place}</p>
      </div>
    </article>
  );
}

function UtcCalendar() {
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(utcSemesterClasses[0].date);
  const [nowKeyTime, setNowKeyTime] = useState(`${utcSemesterClasses[0].date} 00:00`);
  useEffect(() => setNowKeyTime(currentKeyAndTime()), []);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, UtcClassEvent[]>();
    for (const event of utcSemesterClasses) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    return map;
  }, []);
  const nextEvent = utcSemesterClasses.find((event) => `${event.date} ${event.start}` >= nowKeyTime);
  const month = months[monthIndex];
  const firstWeekday = (new Date(month.year, month.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  const chooseMonth = (index: number) => {
    setMonthIndex(index);
    const config = months[index];
    const prefix = `${config.year}-${String(config.month + 1).padStart(2, "0")}`;
    const firstEvent = utcSemesterClasses.find((event) => event.date.startsWith(prefix));
    setSelectedDate(firstEvent?.date ?? dateKey(config.year, config.month, 1));
  };

  return (
    <section id="lich" className="legacy-section utc-calendar-section panel">
      <div className="sec-eyebrow">Lịch chính thức của Dương — lớp KT1 · học kỳ 1 năm 2026–2027</div>
      <h2>Toàn bộ thời khóa biểu</h2>
      <p className="lede">Đối chiếu từ cổng quản lý đào tạo UTC ngày <strong>05/09/2026</strong>, gồm mọi buổi đã có ngày, giờ và phòng từ <strong>09/09/2026 đến 05/01/2027</strong>.</p>

      <div className="utc-next-class">
        <div>
          <span>Buổi gần nhất</span>
          <strong>{nextEvent ? nextEvent.title : "Học kỳ đã kết thúc"}</strong>
          <small>{nextEvent ? `${formatGuideDate(nextEvent.date)} · ${nextEvent.start}–${nextEvent.end}` : "Không còn buổi học nào trong lịch"}</small>
        </div>
        {nextEvent && <div className={`utc-next-place course-${nextEvent.kind}`}><Icon name="location" size={17} />{nextEvent.place}</div>}
      </div>

      <div className="schedule-summary" aria-label="Tóm tắt lịch học">
        <span><b>5 tháng</b> · 09/2026–01/2027</span>
        <span><b>{utcSemesterClasses.length} buổi</b> có giờ cụ thể</span>
        <span><b>Chọn một ngày</b> để xem môn và phòng</span>
      </div>

      <div className="month-tabs" role="tablist" aria-label="Chọn tháng trong học kỳ">
        {months.map((item, index) => (
          <button key={item.label} type="button" role="tab" aria-selected={monthIndex === index} className={monthIndex === index ? "active" : ""} onClick={() => chooseMonth(index)}>{item.label}</button>
        ))}
      </div>

      <div className="utc-calendar-layout">
        <div className="utc-calendar-shell">
          <div className="utc-calendar-heading">
            <button type="button" className="icon-button" disabled={monthIndex === 0} onClick={() => chooseMonth(monthIndex - 1)} aria-label="Tháng trước"><Icon name="arrow-left" /></button>
            <div><h3>{month.label} · {month.year}</h3><p>Học kỳ 1 · Giờ Việt Nam (GMT+7)</p></div>
            <button type="button" className="icon-button" disabled={monthIndex === months.length - 1} onClick={() => chooseMonth(monthIndex + 1)} aria-label="Tháng sau"><Icon name="arrow-right" /></button>
          </div>
          {monthIndex === 2 && <div className="calendar-notice"><strong>02–29/11:</strong> Đợt Giáo dục quốc phòng – an ninh có 8 lớp thành phần nhưng chưa có ngày, giờ và địa điểm từng buổi.</div>}
          <div className="utc-calendar-weekdays" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="utc-calendar-days" role="grid" aria-label={`${month.label} năm ${month.year}`}>
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="utc-calendar-blank" />;
              const key = dateKey(month.year, month.month, day);
              const events = eventsByDate.get(key) ?? [];
              return (
                <button key={key} type="button" className={`${events.length ? "has-event" : ""} ${selectedDate === key ? "selected" : ""}`} onClick={() => setSelectedDate(key)} aria-label={`${formatGuideDate(key)}${events.length ? `, ${events.length} buổi học` : ", không có lịch"}`}>
                  <span>{day}</span>
                  <i>{events.slice(0, 3).map((event, eventIndex) => <b key={`${event.kind}-${eventIndex}`} className={`course-${event.kind}`} />)}</i>
                </button>
              );
            })}
          </div>
        </div>

        <div className="utc-calendar-detail" aria-live="polite">
          <span className="utc-detail-date">{formatGuideDate(selectedDate)}</span>
          {selectedEvents.length ? selectedEvents.map((event) => <CalendarEvent key={`${event.start}-${event.title}`} event={event} />) : <div className="utc-no-class"><Icon name="book" /><strong>Không có buổi học</strong><p>Dương có thể dùng ngày này để ôn bài hoặc nghỉ ngơi.</p></div>}
        </div>
      </div>

      <div className="calendar-legend" aria-label="Màu của các học phần">
        {(Object.keys(utcCourseLabels) as Array<keyof typeof utcCourseLabels>).map((kind) => <span key={kind} className={`course-${kind}`}><i />{utcCourseLabels[kind]}</span>)}
      </div>
      <details>
        <summary>Thông tin đợt Giáo dục quốc phòng – an ninh</summary>
        <div className="module-list" aria-label="Các lớp Giáo dục quốc phòng – an ninh">
          {["GDQP–AN 1 · N33", "GDQP–AN 1 · BT1", "GDQP–AN 2 · N33", "GDQP–AN 2 · BT1", "GDQP–AN 3 · N33", "GDQP–AN 3 · TH1", "GDQP–AN 4 · N33", "GDQP–AN 4 · TH1"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </details>
      <p className="legacy-source-note">Nguồn: Tra cứu lịch → Lịch học trên cổng quản lý đào tạo UTC, đối chiếu ngày 05/09/2026. Thông báo mới nhất của trường vẫn là căn cứ cuối cùng.</p>
    </section>
  );
}

type UtcGuideProps = {
  sectionHtml: Partial<Record<UtcGuideSectionId, string>>;
};

export function UtcGuide({ sectionHtml }: UtcGuideProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const studyInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-study-id]"));
    const readSaved = <T,>(key: string, fallback: T): T => {
      try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
    };
    const savedStudy = readSaved<string[]>("duong-utc-study-v1", []);

    studyInputs.forEach((input) => { input.checked = savedStudy.includes(input.dataset.studyId ?? ""); });

    const today = currentKeyAndTime().slice(0, 10);
    root.querySelectorAll<HTMLElement>("[data-phase-start][data-phase-end]").forEach((phase) => {
      const start = phase.dataset.phaseStart ?? "";
      const end = phase.dataset.phaseEnd ?? "";
      const status = phase.querySelector<HTMLElement>(".study-phase-status");
      phase.classList.toggle("is-current", today >= start && today <= end);
      if (status) status.textContent = today < start ? "Sắp tới" : today > end ? "Đã qua" : "Đang học";
    });

    const updateProgress = () => {
      const studyDone = studyInputs.filter((input) => input.checked).length;
      const studyText = root.querySelector<HTMLElement>("#study-progress-text");
      const studyFill = root.querySelector<HTMLElement>("#study-progress-fill");
      const studyTrack = root.querySelector<HTMLElement>("#study-progress-track");
      if (studyText) studyText.textContent = `${studyDone}/${studyInputs.length}`;
      if (studyFill) studyFill.style.width = `${studyInputs.length ? studyDone / studyInputs.length * 100 : 0}%`;
      studyTrack?.setAttribute("aria-valuenow", String(studyDone));

      const subjectIds = ["phil", "calc", "algebra"];
      subjectIds.forEach((subject) => {
        const inputs = studyInputs.filter((input) => input.dataset.studyId?.startsWith(subject));
        const done = inputs.filter((input) => input.checked).length;
        const counter = root.querySelector<HTMLElement>(`[data-subject-progress='${subject}']`);
        if (counter) counter.textContent = `${done}/${inputs.length}`;
      });
    };

    updateProgress();

    const onChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.dataset.studyId) {
        localStorage.setItem("duong-utc-study-v1", JSON.stringify(studyInputs.filter((item) => item.checked).map((item) => item.dataset.studyId)));
      }
      updateProgress();
    };

    root.addEventListener("change", onChange);
    return () => root.removeEventListener("change", onChange);
  }, []);

  return (
    <div ref={rootRef} className="page utc-guide-page legacy-content">
      <header className="legacy-hero utc-guide-hero">
        <div className="utc-guide-hero-copy">
          <span className="eyebrow">Cẩm nang năm nhất · cập nhật 07/09/2026</span>
          <h1>Cẩm nang UTC<br />của Dương</h1>
          <p className="sub">Thông tin đang dùng cho học kỳ 1 được gom theo đúng việc Dương cần tra: lịch học, cách học, ngành Kinh tế, tiếng Anh, hướng nghề và đi lại.</p>
          <div className="chips" aria-label="Thông tin học tập của Dương">
            <span className="chip"><span className="k">Mã sinh viên</span><b>261800139</b></span>
            <span className="chip"><span className="k">Khóa</span><b>K67</b></span>
            <span className="chip"><span className="k">Lớp</span><b>KT1</b></span>
            <span className="chip"><span className="k">Ngành</span><b>Kinh tế</b></span>
            <span className="chip"><span className="k">Mã tuyển sinh</span><b>GHA03</b></span>
          </div>
        </div>
        <div className="utc-guide-hero-actions" aria-label="Lối tắt học tập">
          <Link className="button primary" href="/planner"><Icon name="calendar" size={18} />Mở kế hoạch</Link>
          <Link className="button ghost" href="/library"><Icon name="book" size={18} />Mở giáo trình</Link>
        </div>
      </header>

      <nav className="guide-jump-nav" aria-label="Mục lục cẩm nang UTC">
        {utcGuideNavigation.map((item, index) => <a key={item.id} href={`#${item.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</a>)}
      </nav>

      <UtcCalendar />

      {utcGuideNavigation.slice(1).map((item) => {
        const html = sectionHtml[item.id];
        return html ? <section key={item.id} id={item.id} className={`legacy-section legacy-section-${item.id} panel`} dangerouslySetInnerHTML={{ __html: html }} /> : null;
      })}

      <footer className="legacy-sources utc-guide-sources panel">
        <div>
          <span className="sec-eyebrow">Nguồn đang dùng</span>
          <h4>Giữ lại nguồn liên quan đến học kỳ hiện tại</h4>
          <p>Các mốc tuyển sinh và checklist nhập học đã hết hạn được bỏ khỏi cẩm nang để tránh lặp và gây nhiễu.</p>
        </div>
        <ul>
          <li>Thời khóa biểu học kỳ 1 từ mục <b>Tra cứu lịch → Lịch học</b> trên cổng quản lý đào tạo UTC, đối chiếu ngày 05/09/2026.</li>
          <li><a href="https://fte.utc.edu.vn/?q=bo-mon/kinh-te-buu-chinh-vien-thong/gioi-thieu" target="_blank" rel="noreferrer">Khoa Vận tải – Kinh tế, UTC</a> cho thông tin ngành và chuyên ngành.</li>
          <li><a href="https://tuyensinh.utc.edu.vn/" target="_blank" rel="noreferrer">Cổng tuyển sinh UTC</a> và thông báo chính thức của trường cho chuẩn ngoại ngữ.</li>
          <li><a href="https://busmap.vn/" target="_blank" rel="noreferrer">BusMap</a> để kiểm tra lại tuyến, giờ chạy và điểm dừng trước khi đi.</li>
        </ul>
      </footer>
    </div>
  );
}
