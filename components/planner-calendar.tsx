"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icons";
import { formatDate, todayKey } from "@/lib/date";
import { getUtcClassCode, utcCourseLabels, utcSemesterClasses, utcUndatedClasses, type UtcClassEvent } from "@/lib/utc-data";

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function CalendarClass({ event }: { event: UtcClassEvent }) {
  return <article className={`planner-calendar-event course-${event.kind}`}>
    <time><strong>{event.start}</strong><span>{event.end}</span></time>
    <div className="planner-calendar-event-body">
      <span>{event.format}</span>
      <h3>{event.title}</h3>
      <p><Icon name="location" size={14} />{event.place}</p>
      <small><strong>Lớp</strong> {getUtcClassCode(event)}</small>
    </div>
  </article>;
}

export function PlannerCalendar() {
  const today = todayKey();
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const [visibleMonth, setVisibleMonth] = useState({ year: todayYear, month: todayMonth - 1 });
  const [selectedDate, setSelectedDate] = useState(today);

  const eventsByDate = useMemo(() => {
    const result = new Map<string, UtcClassEvent[]>();
    for (const event of utcSemesterClasses) result.set(event.date, [...(result.get(event.date) ?? []), event]);
    return result;
  }, []);

  const firstWeekday = (new Date(visibleMonth.year, visibleMonth.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => index < firstWeekday || index >= firstWeekday + daysInMonth ? null : index - firstWeekday + 1);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(visibleMonth.year, visibleMonth.month, 1));
  const monthStart = dateKey(visibleMonth.year, visibleMonth.month, 1);
  const monthEnd = dateKey(visibleMonth.year, visibleMonth.month, daysInMonth);
  const undatedClasses = utcUndatedClasses.filter((item) => item.startDate <= monthEnd && item.endDate >= monthStart);

  const moveMonth = (delta: number) => {
    const next = new Date(visibleMonth.year, visibleMonth.month + delta, 1);
    const nextMonth = { year: next.getFullYear(), month: next.getMonth() };
    setVisibleMonth(nextMonth);
    const firstEvent = utcSemesterClasses.find((event) => event.date.startsWith(`${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}`));
    setSelectedDate(firstEvent?.date ?? dateKey(nextMonth.year, nextMonth.month, 1));
  };

  const goToday = () => {
    setVisibleMonth({ year: todayYear, month: todayMonth - 1 });
    setSelectedDate(today);
  };

  return <section className="planner-calendar-layout" aria-label="Thời khóa biểu theo tháng">
    <div className="panel planner-month-calendar">
      <header className="planner-calendar-heading">
        <button className="icon-button" onClick={() => moveMonth(-1)} aria-label="Tháng trước"><Icon name="arrow-left" /></button>
        <div><span className="eyebrow">Thời khóa biểu</span><h2>{monthLabel}</h2></div>
        <button className="icon-button" onClick={() => moveMonth(1)} aria-label="Tháng sau"><Icon name="arrow-right" /></button>
      </header>
      <div className="planner-calendar-scroll">
        <div className="planner-weekdays" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="planner-month-days" role="grid">
          {cells.map((day, index) => {
            if (!day) return <span className="planner-calendar-blank" key={`blank-${index}`} />;
            const key = dateKey(visibleMonth.year, visibleMonth.month, day);
            const events = eventsByDate.get(key) ?? [];
            return <button key={key} className={`${key === selectedDate ? "selected" : ""} ${key === today ? "today" : ""} ${events.length ? "has-events" : ""}`} onClick={() => setSelectedDate(key)} aria-pressed={key === selectedDate} aria-label={`${formatDate(key, { weekday: "long", day: "numeric", month: "long" })}${events.length ? `, ${events.length} buổi học` : ", không có lịch học"}`}>
              <span className="planner-day-number">{day}</span>
              <span className="planner-day-events">
                {events.map((event) => <span key={`${event.start}-${event.className}`} className={`planner-day-event course-${event.kind}`}>
                  <span className="planner-day-event-main"><time>{event.start}</time><strong>{utcCourseLabels[event.kind]}</strong></span>
                  <small title={`Lớp ${getUtcClassCode(event)}`}>{getUtcClassCode(event)}</small>
                </span>)}
              </span>
            </button>;
          })}
        </div>
      </div>
      <footer><button className="button ghost small" onClick={goToday}>Hôm nay</button><div className="calendar-legend">{(Object.keys(utcCourseLabels) as Array<keyof typeof utcCourseLabels>).map((kind) => <span key={kind} className={`course-${kind}`}><i />{utcCourseLabels[kind]}</span>)}</div></footer>
      {undatedClasses.length > 0 && <section className="planner-undated-classes" aria-label="Lớp chưa có lịch chi tiết">
        <header><div><span className="eyebrow">Cổng UTC chưa xếp ngày, giờ</span><h3>Lớp học phần trong tháng</h3></div><strong>{undatedClasses.length} lớp</strong></header>
        <p>Giữ nguyên trạng thái trên cổng đào tạo; Dương cần kiểm tra lại khi UTC cập nhật thời khóa biểu.</p>
        <div>{undatedClasses.map((item) => <article key={`${item.code}-${item.startDate}`}>
          <span>{item.format}</span><strong>{item.name}</strong><small>{item.code} · {formatDate(item.startDate, { day: "2-digit", month: "2-digit" })}–{formatDate(item.endDate, { day: "2-digit", month: "2-digit" })}</small>
        </article>)}</div>
      </section>}
    </div>

    <aside className="panel planner-day-agenda" aria-live="polite">
      <header><span className="eyebrow">Chi tiết lớp học · {selectedEvents.length} buổi</span><h2>{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</h2></header>
      <div>{selectedEvents.length ? selectedEvents.map((event) => <CalendarClass key={`${event.start}-${event.title}`} event={event} />) : <div className="planner-day-empty"><Icon name="calendar" size={27} /><strong>Không có buổi học</strong><span>Dương có thể dành ngày này cho To-do hoặc nghỉ ngơi.</span></div>}</div>
    </aside>
  </section>;
}
