export type UtcCourseKind = "physical" | "philosophy" | "digital" | "calculus" | "algebra";

export type UtcClassEvent = {
  date: string;
  start: string;
  end: string;
  title: string;
  place: string;
  kind: UtcCourseKind;
};

type EventSeed = Omit<UtcClassEvent, "date"> & { dates: string[] };

const eventSeeds: EventSeed[] = [
  {
    dates: ["2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30", "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28"],
    start: "13:00", end: "15:25", title: "Giáo dục thể chất F1", place: "Ngoài trời 65", kind: "physical",
  },
  {
    dates: ["2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30", "2026-10-07", "2026-10-14"],
    start: "15:35", end: "18:00", title: "Triết học Mác–Lênin", place: "Phòng trực tuyến", kind: "philosophy",
  },
  { dates: ["2026-10-21"], start: "15:35", end: "18:00", title: "Triết học Mác–Lênin", place: "202-A5", kind: "philosophy" },
  { dates: ["2026-10-28"], start: "15:35", end: "18:00", title: "Triết học Mác–Lênin", place: "303-A2", kind: "philosophy" },
  {
    dates: ["2026-09-10", "2026-09-17", "2026-09-24", "2026-10-01"],
    start: "07:00", end: "09:25", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", place: "Phòng trực tuyến", kind: "digital",
  },
  {
    dates: ["2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29"],
    start: "07:00", end: "09:25", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", place: "303-A2", kind: "digital",
  },
  {
    dates: ["2026-09-25", "2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30"],
    start: "13:00", end: "15:25", title: "Giải tích", place: "303-A2", kind: "calculus",
  },
  {
    dates: ["2026-09-25", "2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30"],
    start: "15:35", end: "18:00", title: "Đại số tuyến tính", place: "303-A2", kind: "algebra",
  },
  {
    dates: ["2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22", "2026-12-29", "2027-01-05"],
    start: "07:00", end: "09:25", title: "Triết học Mác–Lênin · thảo luận", place: "105-A5", kind: "philosophy",
  },
  {
    dates: ["2026-10-20", "2026-10-27", "2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22"],
    start: "09:35", end: "12:00", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo · bài tập", place: "401-A9", kind: "digital",
  },
  {
    dates: ["2026-12-02", "2026-12-09", "2026-12-16"],
    start: "09:35", end: "12:00", title: "Giáo dục thể chất F1", place: "Ngoài trời 65", kind: "physical",
  },
  {
    dates: ["2026-12-02", "2026-12-09", "2026-12-16"],
    start: "15:35", end: "18:00", title: "Triết học Mác–Lênin", place: "303-A2", kind: "philosophy",
  },
  {
    dates: ["2026-12-03", "2026-12-10", "2026-12-17"],
    start: "07:00", end: "09:25", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", place: "103-A2", kind: "digital",
  },
  {
    dates: ["2026-12-04", "2026-12-11", "2026-12-18"],
    start: "13:00", end: "15:25", title: "Giải tích · bài tập", place: "303-A2", kind: "calculus",
  },
  {
    dates: ["2026-12-04", "2026-12-11", "2026-12-18"],
    start: "15:35", end: "18:00", title: "Đại số tuyến tính · bài tập", place: "303-A2", kind: "algebra",
  },
];

export const utcSemesterClasses: UtcClassEvent[] = eventSeeds
  .flatMap(({ dates, ...event }) => dates.map((date) => ({ date, ...event })))
  .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));

export const utcCourseLabels: Record<UtcCourseKind, string> = {
  physical: "GDTC",
  philosophy: "Triết học",
  digital: "Công nghệ số & AI",
  calculus: "Giải tích",
  algebra: "Đại số tuyến tính",
};

export const utcGuideNavigation = [
  { id: "lich", label: "Lịch học" },
  { id: "hocki", label: "Kế hoạch học kỳ" },
  { id: "nganh", label: "Ngành Kinh tế" },
  { id: "lotrinh", label: "Lộ trình 4 năm" },
  { id: "tienganh", label: "Tiếng Anh" },
  { id: "nghe", label: "Hướng nghề" },
  { id: "dilai", label: "Đi lại" },
] as const;

export type UtcGuideSectionId = (typeof utcGuideNavigation)[number]["id"];
