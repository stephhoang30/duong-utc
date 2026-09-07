export type LibrarySubject = "calculus" | "algebra" | "philosophy" | "digital" | "physical" | "chinese";

export type LibraryChapter = {
  label: string;
  url: string;
};

export type LibraryBook = {
  id: string;
  title: string;
  subject: LibrarySubject;
  author: string;
  language: string;
  access: "open" | "public" | "personal" | "preview";
  accessLabel: string;
  description: string;
  readUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  license: string;
  fileLabel: string;
  chapters?: LibraryChapter[];
};

export const librarySubjectOptions: Array<{ id: "all" | "saved" | LibrarySubject; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "saved", label: "Đã lưu" },
  { id: "calculus", label: "Giải tích" },
  { id: "algebra", label: "Đại số" },
  { id: "philosophy", label: "Triết học" },
  { id: "digital", label: "CNS & AI" },
  { id: "physical", label: "GDTC" },
  { id: "chinese", label: "Tiếng Trung" },
];

export const librarySubjectMeta: Record<LibrarySubject, { label: string; tone: string }> = {
  calculus: { label: "Giải tích", tone: "coral" },
  algebra: { label: "Đại số tuyến tính", tone: "violet" },
  philosophy: { label: "Triết học Mác–Lênin", tone: "rose" },
  digital: { label: "Công nghệ số & AI", tone: "blue" },
  physical: { label: "Giáo dục thể chất", tone: "gold" },
  chinese: { label: "Tiếng Trung", tone: "jade" },
};

const boyaChapters: LibraryChapter[] = Array.from({ length: 30 }, (_, index) => ({
  label: `Bài ${index + 1}`,
  url: `/resources/boya1/pdfs/lesson-${String(index + 1).padStart(2, "0")}.pdf`,
})).filter((chapter) => chapter.label !== "Bài 21");

export const libraryBooks: LibraryBook[] = [
  {
    id: "openstax-calculus-1",
    title: "Calculus Volume 1",
    subject: "calculus",
    author: "Gilbert Strang · Edwin Herman",
    language: "Tiếng Anh",
    access: "open",
    accessLabel: "Giáo trình mở",
    description: "Hàm số, giới hạn, đạo hàm và tích phân — phù hợp nội dung nền tảng của Giải tích 1.",
    readUrl: "/resources/library/pdfs/calculus-volume-1.pdf",
    sourceUrl: "https://openstax.org/details/books/calculus-volume-1",
    sourceLabel: "OpenStax · Rice University",
    license: "CC BY-NC-SA 4.0 · Access for free at openstax.org",
    fileLabel: "769 trang · 22 MB · PDF nội bộ",
  },
  {
    id: "hefferon-linear-algebra",
    title: "Linear Algebra · Fourth edition",
    subject: "algebra",
    author: "Jim Hefferon",
    language: "Tiếng Anh",
    access: "open",
    accessLabel: "Giáo trình mở",
    description: "Hệ phương trình, không gian vector, ánh xạ tuyến tính, định thức và trị riêng; có nhiều bài tập tự học.",
    readUrl: "/resources/library/pdfs/linear-algebra-hefferon.pdf",
    sourceUrl: "https://hefferon.net/linearalgebra/",
    sourceLabel: "Jim Hefferon · Saint Michael’s College",
    license: "CC BY-SA hoặc GNU FDL",
    fileLabel: "525 trang · 2,6 MB · PDF nội bộ",
  },
  {
    id: "berkeley-cs188",
    title: "Introduction to Artificial Intelligence",
    subject: "digital",
    author: "Nikhil Sharma · Josh Hug · Jacky Liang · Henry Zhu",
    language: "Tiếng Anh",
    access: "open",
    accessLabel: "Giáo trình mở",
    description: "Nhập môn AI từ tìm kiếm, ra quyết định, học tăng cường đến học máy và logic.",
    readUrl: "/resources/library/pdfs/introduction-to-ai-cs188.pdf",
    sourceUrl: "https://inst.eecs.berkeley.edu/~cs188/textbook/",
    sourceLabel: "UC Berkeley · CS 188",
    license: "CC BY-SA 4.0",
    fileLabel: "187 trang · 25,2 MB · PDF nội bộ",
  },
  {
    id: "marx-lenin-philosophy",
    title: "Giáo trình Triết học Mác–Lênin",
    subject: "philosophy",
    author: "Bộ Giáo dục và Đào tạo",
    language: "Tiếng Việt",
    access: "personal",
    accessLabel: "Tài liệu của Dương",
    description: "Bản đầy đủ dành cho bậc đại học hệ không chuyên lý luận chính trị, xuất bản năm 2021.",
    readUrl: "/resources/library/pdfs/triet-hoc-mac-lenin.pdf",
    sourceUrl: "https://nxbctqg.org.vn/giao-trinh-triet-hoc-mac-lenin-danh-cho-bac-dai-hoc-he-khong-chuyen-ly-luan-chinh-tri-.html",
    sourceLabel: "Bản PDF Dương cung cấp · NXB Chính trị quốc gia Sự thật",
    license: "Tài liệu cá nhân của Dương",
    fileLabel: "495 trang · 9,8 MB · PDF nội bộ",
  },
  {
    id: "physical-activity-guide",
    title: "Physical Activity Guidelines · Second edition",
    subject: "physical",
    author: "U.S. Department of Health and Human Services",
    language: "Tiếng Anh",
    access: "public",
    accessLabel: "Tài liệu chính thức",
    description: "Hướng dẫn dựa trên bằng chứng về vận động, thể lực và cách xây dựng thói quen tập luyện an toàn.",
    readUrl: "/resources/library/pdfs/physical-activity-guidelines-2nd.pdf",
    sourceUrl: "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/current-guidelines",
    sourceLabel: "Office of Disease Prevention and Health Promotion · HHS",
    license: "Tài liệu chính thức được phát hành miễn phí",
    fileLabel: "118 trang · 8,4 MB · PDF nội bộ",
  },
  {
    id: "boya-lessons",
    title: "BOYA 1 · Bộ bài giảng theo bài",
    subject: "chinese",
    author: "Khoá học Yangdexin",
    language: "Tiếng Việt · 中文",
    access: "personal",
    accessLabel: "Tài liệu của Dương",
    description: "Mở trực tiếp từng bài BOYA 1 đã nhập vào planner, không cần qua Google Drive.",
    readUrl: boyaChapters[0].url,
    sourceUrl: "/chinese",
    sourceLabel: "Kho tài liệu BOYA trong planner",
    license: "Tài liệu cá nhân do Dương cung cấp",
    fileLabel: "29 bài · PDF nội bộ đã tối ưu",
    chapters: boyaChapters,
  },
  {
    id: "boya-workbook",
    title: "BOYA 1 · Bài tập Bài 1–30",
    subject: "chinese",
    author: "Khoá học Yangdexin",
    language: "Tiếng Việt · 中文",
    access: "personal",
    accessLabel: "Tài liệu của Dương",
    description: "Bộ bài tập gộp để luyện ngay sau khi học từng bài.",
    readUrl: "/resources/boya1/pdfs/bai-tap-boya-1-30.pdf",
    sourceUrl: "/chinese",
    sourceLabel: "Kho tài liệu BOYA trong planner",
    license: "Tài liệu cá nhân do Dương cung cấp",
    fileLabel: "PDF nội bộ đã tối ưu",
  },
  {
    id: "boya-writing",
    title: "BOYA 1 · Vở luyện viết",
    subject: "chinese",
    author: "Khoá học Yangdexin",
    language: "Tiếng Việt · 中文",
    access: "personal",
    accessLabel: "Tài liệu của Dương",
    description: "Luyện nét, chữ Hán và ghi nhớ mặt chữ song song với bài học.",
    readUrl: "/resources/boya1/pdfs/vo-luyen-viet.pdf",
    sourceUrl: "/chinese",
    sourceLabel: "Kho tài liệu BOYA trong planner",
    license: "Tài liệu cá nhân do Dương cung cấp",
    fileLabel: "PDF nội bộ đã tối ưu",
  },
];
