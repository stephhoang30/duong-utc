"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { PlannerCalendar } from "@/components/planner-calendar";
import { EmptyState, PageHeader, PageSkeleton, SectionHeading, SubjectPill, TaskRow } from "@/components/ui";
import { semesterSchedule, subjects } from "@/lib/data";
import { formatDate, startOfWeek, todayKey } from "@/lib/date";
import { usePlanner } from "@/lib/planner-context";
import type { StudyTask, SubjectId } from "@/lib/types";
import { getUtcClassCode, utcSemesterClasses, utcSemesterNotice } from "@/lib/utc-data";

function toKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PlannerPage() {
  const { state, ready, addTask, toggleTask, deleteTask } = usePlanner();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<SubjectId>("calculus");
  const [dueDate, setDueDate] = useState(todayKey());
  const [startTime, setStartTime] = useState("19:30");
  const [duration, setDuration] = useState(45);
  const [priority, setPriority] = useState<StudyTask["priority"]>("medium");
  const [scheduleView, setScheduleView] = useState<"month" | "week">("month");
  const [todoFilter, setTodoFilter] = useState<"open" | "today" | "done">("open");

  const days = useMemo(() => {
    const start = startOfWeek();
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start);
      value.setDate(start.getDate() + index);
      return value;
    });
  }, [weekOffset]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), subject, dueDate, startTime, duration, priority });
    setTitle("");
    setShowForm(false);
  };

  const remove = (id: string, taskTitle: string) => {
    if (window.confirm(`Xóa việc “${taskTitle}”?`)) deleteTask(id);
  };

  const weekClassCount = utcSemesterClasses.filter((event) => event.date >= toKey(days[0]) && event.date <= toKey(days[6])).length;
  const todoTasks = state.tasks
    .filter((task) => todoFilter === "open" ? !task.done : todoFilter === "today" ? !task.done && task.dueDate === todayKey() : task.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  if (!ready) return <PageSkeleton />;

  return (
    <div className="page planner-page">
      <PageHeader
        eyebrow="Kế hoạch"
        title="Lịch học & To-do"
        description="Xem thời khóa biểu và quản lý việc cần làm riêng."
        sticker="calendar"
        stickerTone="coral"
        action={<button className="button primary" onClick={() => setShowForm((value) => !value)}><Icon name={showForm ? "x" : "plus"} size={18} />{showForm ? "Đóng" : "Thêm việc"}</button>}
      />

      {showForm && (
        <form className="panel task-form" onSubmit={submit}>
          <div className="form-heading"><div><h2>Thêm việc học mới</h2><p>Planner sẽ tự lưu ngay sau khi thêm.</p></div></div>
          <div className="form-grid">
            <label className="field span-2"><span>Tên việc</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Làm 10 bài giới hạn" required /></label>
            <label className="field"><span>Môn học</span><select value={subject} onChange={(event) => setSubject(event.target.value as SubjectId)}>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>Ngày hoàn thành</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label>
            <label className="field"><span>Giờ bắt đầu</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label className="field"><span>Thời lượng (phút)</span><input type="number" min="5" max="300" step="5" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
            <label className="field"><span>Mức ưu tiên</span><select value={priority} onChange={(event) => setPriority(event.target.value as StudyTask["priority"])}><option value="low">Nhẹ</option><option value="medium">Vừa</option><option value="high">Quan trọng</option></select></label>
          </div>
          <div className="form-actions"><button type="button" className="button ghost" onClick={() => setShowForm(false)}>Hủy</button><button className="button primary" type="submit"><Icon name="check" size={17} />Lưu vào kế hoạch</button></div>
        </form>
      )}

      <section className="panel utc-semester-summary" aria-label="Thông tin học kỳ một của Dương">
        <header>
          <div><span className="eyebrow">Thông báo 810/TB-ĐHGTVT</span><h2>Học kỳ I · {utcSemesterNotice.program}</h2></div>
          <a href="https://qldt.utc.edu.vn/congthongtin/Index.aspx#lichhoc" target="_blank" rel="noreferrer">Mở cổng UTC <Icon name="external-link" size={15} /></a>
        </header>
        <div className="utc-semester-grid">
          <article><span><Icon name="book" size={17} /></span><div><small>Thời gian học</small><strong>{utcSemesterNotice.studyPeriod}</strong></div></article>
          <article><span><Icon name="exam" size={17} /></span><div><small>Thời gian thi</small><strong>{utcSemesterNotice.examPeriod}</strong></div></article>
          <article><span><Icon name="check" size={17} /></span><div><small>Điều chỉnh đăng ký</small><strong>{utcSemesterNotice.registrationPeriod}</strong></div></article>
          <article><span><Icon name="calendar" size={17} /></span><div><small>Nộp học phí</small><strong>{utcSemesterNotice.tuitionPeriod}</strong></div></article>
          <article><span><Icon name="language" size={17} /></span><div><small>Chuẩn ngoại ngữ</small><strong>{utcSemesterNotice.languageStandard}</strong></div></article>
          <article><span><Icon name="layers" size={17} /></span><div><small>Lớp trực tuyến</small><strong>{utcSemesterNotice.onlineClassroom}</strong></div></article>
        </div>
        <footer><Icon name="pin" size={17} /><span>Lịch có thể được UTC điều chỉnh. Nộp học phí trễ hạn sẽ không được dự thi kết thúc học phần.</span></footer>
      </section>

      <div className="planner-view-tabs" role="tablist" aria-label="Chọn cách xem thời khóa biểu">
        <button role="tab" aria-selected={scheduleView === "month"} className={scheduleView === "month" ? "active" : ""} onClick={() => setScheduleView("month")}><Icon name="calendar" size={18} />Calendar tháng</button>
        <button role="tab" aria-selected={scheduleView === "week"} className={scheduleView === "week" ? "active" : ""} onClick={() => setScheduleView("week")}><Icon name="layers" size={18} />Lịch tuần</button>
      </div>

      {scheduleView === "month" ? <PlannerCalendar /> : <>
      <section className="planner-toolbar panel-lite">
        <div className="week-switcher">
          <button className="icon-button" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Tuần trước"><Icon name="arrow-left" /></button>
          <div><strong>{formatDate(toKey(days[0]), { day: "numeric", month: "long" })} – {formatDate(toKey(days[6]), { day: "numeric", month: "long", year: "numeric" })}</strong><small>{weekClassCount} buổi học trong tuần</small></div>
          <button className="icon-button" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Tuần sau"><Icon name="arrow-right" /></button>
        </div>
        {weekOffset !== 0 && <button className="button ghost small" onClick={() => setWeekOffset(0)}>Về tuần này</button>}
      </section>

      <section className="week-board" aria-label="Kế hoạch theo tuần">
        {days.map((day) => {
          const key = toKey(day);
          const classEvents = utcSemesterClasses.filter((event) => event.date === key);
          const current = key === todayKey();
          return (
            <article key={key} className={`day-column ${current ? "is-today" : ""}`}>
              <header><span>{new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(day)}</span><strong>{day.getDate()}</strong>{current && <small>Hôm nay</small>}</header>
              <div className="day-tasks">
                {classEvents.map((event) => (
                  <div key={`${event.start}-${event.title}`} className={`mini-class course-${event.kind}`}>
                    <span><Icon name="book" size={13} /></span>
                    <div><small>{event.start}–{event.end}</small><strong>{event.title}</strong><em>{event.format} · {event.place}</em><code>Lớp {getUtcClassCode(event)}</code></div>
                  </div>
                ))}
                {classEvents.length === 0 && <span className="day-empty">Không có lịch học</span>}
              </div>
            </article>
          );
        })}
      </section>
      </>}

      <div className="planner-lower-grid">
        <section className="panel todo-panel">
          <SectionHeading icon="target" title="To-do" description={`${state.tasks.filter((task) => !task.done).length} việc chưa hoàn thành`} />
          <div className="todo-filters" role="tablist" aria-label="Lọc To-do">
            <button role="tab" aria-selected={todoFilter === "open"} className={todoFilter === "open" ? "active" : ""} onClick={() => setTodoFilter("open")}>Đang chờ <span>{state.tasks.filter((task) => !task.done).length}</span></button>
            <button role="tab" aria-selected={todoFilter === "today"} className={todoFilter === "today" ? "active" : ""} onClick={() => setTodoFilter("today")}>Hôm nay <span>{state.tasks.filter((task) => !task.done && task.dueDate === todayKey()).length}</span></button>
            <button role="tab" aria-selected={todoFilter === "done"} className={todoFilter === "done" ? "active" : ""} onClick={() => setTodoFilter("done")}>Đã xong <span>{state.tasks.filter((task) => task.done).length}</span></button>
          </div>
          <div className="task-list">
            {todoTasks.map((task) => (
              <div key={task.id} className="dated-task"><span className="date-badge">{formatDate(task.dueDate, { day: "2-digit", month: "2-digit" })}</span><TaskRow task={task} onToggle={() => toggleTask(task.id)} onDelete={() => remove(task.id, task.title)} /></div>
            ))}
            {!todoTasks.length && <EmptyState icon={todoFilter === "done" ? "review" : "check"} title={todoFilter === "done" ? "Chưa có việc đã xong" : todoFilter === "today" ? "Hôm nay chưa có To-do" : "Đã hoàn thành hết"} description={todoFilter === "today" ? "Dương có thể thêm một việc nhỏ cho hôm nay." : "Danh sách đang gọn gàng."} />}
          </div>
        </section>

        <section className="panel timetable-panel">
          <SectionHeading icon="clock" title="Khung học cố định" description="Lịch lớp và giờ tự học gợi ý" />
          <div className="timetable-list">
            {semesterSchedule.map((item) => (
              <div className="timetable-row" key={`${item.weekday}-${item.time}-${item.title}`}>
                <div><strong>{item.weekday}</strong><span>{item.time}</span></div>
                <div><SubjectPill subject={item.subject} compact /><strong>{item.title}</strong><small>{item.place}</small></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
