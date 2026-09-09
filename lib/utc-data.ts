export type UtcCourseKind = "physical" | "philosophy" | "digital" | "calculus" | "algebra";
export type UtcClassFormat = "Lý thuyết" | "Bài tập" | "Thảo luận" | "Thực hành";

export type UtcClassEvent = {
  date: string;
  start: string;
  end: string;
  periods: string;
  title: string;
  className: string;
  format: UtcClassFormat;
  place: string;
  kind: UtcCourseKind;
};

export type UtcUndatedClass = {
  code: string;
  name: string;
  format: UtcClassFormat;
  startDate: string;
  endDate: string;
};

type EventSeed = Omit<UtcClassEvent, "date"> & { dates: string[] };

const eventSeeds: EventSeed[] = [
  {
    dates: ["2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30", "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28"],
    start: "13:00", end: "15:25", periods: "Tiết 7–9", title: "Giáo dục thể chất F1", className: "Giáo dục thể chất F1-1-1-26(N123).TH", format: "Thực hành", place: "Ngoài trời 65", kind: "physical",
  },
  {
    dates: ["2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30", "2026-10-07", "2026-10-14"],
    start: "15:35", end: "18:00", periods: "Tiết 10–12", title: "Triết học Mác–Lênin", className: "Triết học Mác–Lênin-1-1-26(N.22)", format: "Lý thuyết", place: "Phòng trực tuyến", kind: "philosophy",
  },
  {
    dates: ["2026-10-21"], start: "15:35", end: "18:00", periods: "Tiết 10–12", title: "Triết học Mác–Lênin", className: "Triết học Mác–Lênin-1-1-26(N.22)", format: "Lý thuyết", place: "202-A5", kind: "philosophy",
  },
  {
    dates: ["2026-10-28", "2026-12-02", "2026-12-09", "2026-12-16"], start: "15:35", end: "18:00", periods: "Tiết 10–12", title: "Triết học Mác–Lênin", className: "Triết học Mác–Lênin-1-1-26(N.22)", format: "Lý thuyết", place: "303-A2", kind: "philosophy",
  },
  {
    dates: ["2026-09-10", "2026-09-17", "2026-09-24", "2026-10-01"],
    start: "07:00", end: "09:25", periods: "Tiết 1–3", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", className: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17)", format: "Lý thuyết", place: "Phòng trực tuyến", kind: "digital",
  },
  {
    dates: ["2026-10-08", "2026-10-15", "2026-10-22", "2026-10-29"],
    start: "07:00", end: "09:25", periods: "Tiết 1–3", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", className: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17)", format: "Lý thuyết", place: "303-A2", kind: "digital",
  },
  {
    dates: ["2026-12-03", "2026-12-10", "2026-12-17"],
    start: "07:00", end: "09:25", periods: "Tiết 1–3", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", className: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17)", format: "Lý thuyết", place: "103-A2", kind: "digital",
  },
  {
    dates: ["2026-09-25", "2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23"],
    start: "13:00", end: "15:25", periods: "Tiết 7–9", title: "Giải tích", className: "Giải tích-1-1-26(N.24)", format: "Lý thuyết", place: "303-A2", kind: "calculus",
  },
  {
    dates: ["2026-10-30", "2026-12-04", "2026-12-11", "2026-12-18"],
    start: "13:00", end: "15:25", periods: "Tiết 7–9", title: "Giải tích", className: "Giải tích-1-1-26(N.24.BT1)", format: "Bài tập", place: "303-A2", kind: "calculus",
  },
  {
    dates: ["2026-09-25", "2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23"],
    start: "15:35", end: "18:00", periods: "Tiết 10–12", title: "Đại số tuyến tính", className: "Đại số tuyến tính-1-1-26(N.44)", format: "Lý thuyết", place: "303-A2", kind: "algebra",
  },
  {
    dates: ["2026-10-30", "2026-12-04", "2026-12-11", "2026-12-18"],
    start: "15:35", end: "18:00", periods: "Tiết 10–12", title: "Đại số tuyến tính", className: "Đại số tuyến tính-1-1-26(N.44.BT1)", format: "Bài tập", place: "303-A2", kind: "algebra",
  },
  {
    dates: ["2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22", "2026-12-29", "2027-01-05"],
    start: "07:00", end: "09:25", periods: "Tiết 1–3", title: "Triết học Mác–Lênin", className: "Triết học Mác–Lênin-1-1-26(N.22.TL1)", format: "Thảo luận", place: "105-A5", kind: "philosophy",
  },
  {
    dates: ["2026-10-20", "2026-10-27", "2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22"],
    start: "09:35", end: "12:00", periods: "Tiết 4–6", title: "Công nghệ số và ứng dụng trí tuệ nhân tạo", className: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17.BT1)", format: "Bài tập", place: "401-A9", kind: "digital",
  },
  {
    dates: ["2026-12-02", "2026-12-09", "2026-12-16"],
    start: "09:35", end: "12:00", periods: "Tiết 4–6", title: "Giáo dục thể chất F1", className: "Giáo dục thể chất F1-1-1-26(N123).TH", format: "Thực hành", place: "Ngoài trời 65", kind: "physical",
  },
];

export const utcSemesterClasses: UtcClassEvent[] = eventSeeds
  .flatMap(({ dates, ...event }) => dates.map((date) => ({ date, ...event })))
  .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));

export const utcUndatedClasses: UtcUndatedClass[] = [
  { code: "ANHA2.4-35-1-26(N01)", name: "Tiếng Anh A2-35-1-26(N01)", format: "Lý thuyết", startDate: "2026-09-07", endDate: "2026-09-20" },
  { code: "IT0.007.3-1-1-26(N.17.TH1)", name: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17.TH1)", format: "Thực hành", startDate: "2026-10-12", endDate: "2026-11-01" },
  { code: "DE0.001.3-1-1-26(N33)", name: "Giáo dục quốc phòng – an ninh 1-1-1-26(N33)", format: "Lý thuyết", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.001.3-1-1-26(N33.BT1)", name: "Giáo dục quốc phòng – an ninh 1-1-1-26(N33.BT1)", format: "Bài tập", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.002.2-1-1-26(N33)", name: "Giáo dục quốc phòng – an ninh 2-1-1-26(N33)", format: "Lý thuyết", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.002.2-1-1-26(N33.BT1)", name: "Giáo dục quốc phòng – an ninh 2-1-1-26(N33.BT1)", format: "Bài tập", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.003.1-1-1-26(N33)", name: "Giáo dục quốc phòng – an ninh 3-1-1-26(N33)", format: "Lý thuyết", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.003.1-1-1-26(N33.TH1)", name: "Giáo dục quốc phòng – an ninh 3-1-1-26(N33.TH1)", format: "Thực hành", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.004.2-1-1-26(N33)", name: "Giáo dục quốc phòng – an ninh 4-1-1-26(N33)", format: "Lý thuyết", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "DE0.004.2-1-1-26(N33.TH1)", name: "Giáo dục quốc phòng – an ninh 4-1-1-26(N33.TH1)", format: "Thực hành", startDate: "2026-11-02", endDate: "2026-11-29" },
  { code: "IT0.007.3-1-1-26(N.17.TH1)", name: "Công nghệ số và ứng dụng trí tuệ nhân tạo-1-1-26(N.17.TH1)", format: "Thực hành", startDate: "2026-11-30", endDate: "2027-01-10" },
];

export const utcSemesterNotice = {
  program: "K67 · Ngành Kinh tế",
  studyPeriod: "07/09/2026 – 16/01/2027",
  examPeriod: "18/01/2027 – 27/02/2027",
  registrationPeriod: "07/09/2026 – 18/09/2026",
  tuitionPeriod: "21/09/2026 – 09/10/2026",
  languageStandard: "Bậc 3/6 · B1 CEFR (hệ cử nhân)",
  onlineClassroom: "hoctructuyen.utc.edu.vn / MS Teams / LMS",
} as const;

export const utcCourseLabels: Record<UtcCourseKind, string> = {
  physical: "GDTC F1",
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
