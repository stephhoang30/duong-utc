import type { IconName } from "@/components/icons";

export const chineseSourceLinks = {
  hskkYouTube: "https://www.youtube.com/results?search_query=HSKK+%E5%88%9D%E7%BA%A7",
} as const;

export const localChineseAssets = {
  pdfRoot: "/resources/boya1/pdfs",
  prerequisite1: "/resources/boya1/pdfs/prerequisite-01.pdf",
  audioRoot: "/resources/boya1/audio/tracks",
  audioArchive: "/resources/boya1/audio/audio-boya-so-cap-1.zip",
  grammar: "/resources/boya1/sheets/tong-hop-ngu-phap-boya.xlsx",
  vocabulary: "/resources/boya1/sheets/luyen-tap-tu-vung-boya.xlsx",
} as const;

export function getBoyaLessonPdf(lesson: number) {
  return `${localChineseAssets.pdfRoot}/lesson-${String(lesson).padStart(2, "0")}.pdf`;
}

export function getBoyaLessonAudio(lesson: number) {
  return `${localChineseAssets.audioRoot}/${String(lesson).padStart(2, "0")}-SC1-BOYA.mp3`;
}

export const localBoyaLibrary = {
  totalFiles: 36,
  prerequisiteCount: 3,
  lessonCount: 29,
  supportCount: 4,
  missingLessons: [21],
} as const;

export type BoyaResourceCategory = "lesson" | "practice" | "vocabulary" | "exam";

export type BoyaResource = {
  id: string;
  title: string;
  description: string;
  category: BoyaResourceCategory;
  categoryLabel: string;
  icon: IconName;
  href?: string;
  actionLabel?: string;
  download?: boolean;
};

export const boyaResources: BoyaResource[] = [
  { id: "boya-prerequisite", title: "PDF bài tiền đề BOYA 1", description: "Ba phần cần xem trước khi bắt đầu Bài 1.", category: "lesson", categoryLabel: "Bài giảng", icon: "file", href: localChineseAssets.prerequisite1, actionLabel: "Mở Phần 1" },
  { id: "boya-lecture", title: "PDF bài giảng BOYA 1", description: "Slide và nội dung chính dùng trong từng buổi học.", category: "lesson", categoryLabel: "Bài giảng", icon: "notebook" },
  { id: "boya-textbook", title: "Bài tập BOYA 1 · Bài 1–30", description: "Bản PDF bài tập gộp để luyện theo toàn bộ giáo trình.", category: "lesson", categoryLabel: "Giáo trình", icon: "book", href: `${localChineseAssets.pdfRoot}/bai-tap-boya-1-30.pdf`, actionLabel: "Mở PDF" },
  { id: "boya-answers", title: "Bài tập và đáp án BOYA 1", description: "Đáp án sách giáo trình BOYA 1, phiên bản 3.", category: "practice", categoryLabel: "Luyện tập", icon: "review", href: `${localChineseAssets.pdfRoot}/dap-an-boya-1.pdf`, actionLabel: "Mở PDF" },
  { id: "boya-audio", title: "Audio BOYA Sơ cấp 1 · Bài 00–30", description: "31 track đã lưu trong web; có thể nghe từng bài hoặc tải trọn bộ.", category: "lesson", categoryLabel: "Nghe", icon: "headphones", href: localChineseAssets.audioArchive, actionLabel: "Tải ZIP", download: true },
  { id: "boya-writing", title: "Vở luyện viết BOYA 1", description: "Luyện nét, thứ tự nét và chữ theo từng bài.", category: "practice", categoryLabel: "Luyện viết", icon: "notebook", href: `${localChineseAssets.pdfRoot}/vo-luyen-viet.pdf`, actionLabel: "Mở PDF" },
  { id: "boya-translation", title: "BOYA – Dịch bài khóa", description: "Đối chiếu nghĩa sau khi đã tự đọc và dịch.", category: "practice", categoryLabel: "Dịch bài", icon: "language" },
  { id: "boya-quizlet", title: "Quizlet từ vựng BOYA 1", description: "Ôn nhanh từ mới trước và sau buổi học.", category: "vocabulary", categoryLabel: "Từ vựng", icon: "review" },
  { id: "boya-exams", title: "Đề thi HSK và HSKK", description: "Bộ đề PDF và MP3 được duyệt và mở ngay trong website.", category: "exam", categoryLabel: "Đề thi", icon: "exam", href: "/chinese?view=hsk#hsk-files", actionLabel: "Mở thư viện" },
  { id: "boya-grammar", title: "Tổng hợp ngữ pháp BOYA", description: "Bảng Excel có các tab BOYA 1, BOYA 2 và BOYA 3.", category: "practice", categoryLabel: "Ngữ pháp", icon: "layers", href: localChineseAssets.grammar, actionLabel: "Tải Excel", download: true },
  { id: "boya-vocabulary", title: "Luyện ghi nhớ từ vựng BOYA", description: "Bảng Excel gồm hướng dẫn sử dụng và các tab BOYA 1–3.", category: "vocabulary", categoryLabel: "Từ vựng", icon: "language", href: localChineseAssets.vocabulary, actionLabel: "Tải Excel", download: true },
];

export const hskMilestones = [
  { level: "HSK 2", target: "Hết bài 20 · Quyển 2", note: "Có thể bắt đầu in đề về làm." },
  { level: "HSK 3", target: "Hết bài 30 · Quyển 2", note: "Muốn chắc hơn nên học tới bài 6–7 của Quyển 3." },
  { level: "HSK 4", target: "Hết bài 10 · Quyển 4", note: "Bắt đầu luyện đề theo từng kỹ năng." },
  { level: "HSK 5", target: "Hết bài 6 · Quyển 6", note: "Kết hợp đề tổng hợp và luyện nghe đều." },
  { level: "HSK 6", target: "Hết bài 7 · Quyển 6", note: "Có thể luyện dần đề chuẩn cấp độ." },
];

export const hskSources: { title: string; description: string; href: string; icon: IconName; tone: string; download?: boolean }[] = [
  { title: "Kho HSK & HSKK", description: "HSK 1–6, HSK 7–9, HSKK và tài liệu HSK 3.0.", href: "#hsk-files", icon: "folder", tone: "jade" },
  { title: "31 audio BOYA", description: "Track 00–30 đã tách riêng và có bản ZIP dự phòng.", href: localChineseAssets.audioArchive, icon: "headphones", tone: "blue", download: true },
  { title: "Ngữ pháp BOYA", description: "Bản Excel nội bộ theo BOYA 1, 2 và 3.", href: localChineseAssets.grammar, icon: "layers", tone: "violet", download: true },
  { title: "Từ vựng BOYA", description: "Bảng luyện ghi nhớ kèm hướng dẫn sử dụng.", href: localChineseAssets.vocabulary, icon: "language", tone: "rose", download: true },
];
