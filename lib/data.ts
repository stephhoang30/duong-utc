import type { Exam, Flashcard, PlannerState, StudyNote, StudyTask, Subject } from "./types";

export const subjects: Subject[] = [
  { id: "calculus", name: "Giải tích", shortName: "Giải tích", color: "coral" },
  { id: "algebra", name: "Đại số tuyến tính", shortName: "Đại số", color: "violet" },
  { id: "philosophy", name: "Triết học Mác–Lênin", shortName: "Triết", color: "rose" },
  { id: "digital", name: "Công nghệ số & AI", shortName: "CNS & AI", color: "blue" },
  { id: "chinese", name: "Tiếng Trung HSK", shortName: "Tiếng Trung", color: "jade" },
];

export const subjectMap = Object.fromEntries(subjects.map((subject) => [subject.id, subject])) as Record<Subject["id"], Subject>;

const seedTasks: StudyTask[] = [
  { id: "task-1", title: "Đọc trước bài Vật chất và ý thức", subject: "philosophy", dueDate: "2026-09-07", startTime: "19:30", duration: 35, priority: "high", done: false },
  { id: "task-2", title: "Ôn hàm số và phép biến đổi đại số", subject: "calculus", dueDate: "2026-09-08", startTime: "20:00", duration: 45, priority: "medium", done: false },
  { id: "task-3", title: "Học 10 từ HSK 1 · Chào hỏi", subject: "chinese", dueDate: "2026-09-08", startTime: "21:00", duration: 20, priority: "medium", done: false },
  { id: "task-4", title: "Chuẩn bị đồ học GDTC", subject: "digital", dueDate: "2026-09-09", startTime: "11:30", duration: 10, priority: "low", done: false },
  { id: "task-5", title: "Làm bộ câu hỏi ma trận cơ bản", subject: "algebra", dueDate: "2026-09-10", startTime: "19:30", duration: 50, priority: "high", done: false },
  { id: "task-6", title: "Tổng kết tuần và xếp lịch tuần sau", subject: "digital", dueDate: "2026-09-13", startTime: "20:30", duration: 25, priority: "medium", done: false },
];

const seedNotes: StudyNote[] = [
  {
    id: "note-1",
    title: "Vật chất và ý thức",
    subject: "philosophy",
    content: "## Ý chính\n\n- Vật chất có trước, ý thức có sau.\n- Ý thức phản ánh thế giới khách quan một cách năng động, sáng tạo.\n\n## Cần hỏi trên lớp\n\nTìm một ví dụ gần với đời sống sinh viên để giải thích tính độc lập tương đối của ý thức.",
    updatedAt: "2026-09-05T20:10:00+07:00",
    pinned: true,
  },
  {
    id: "note-2",
    title: "Công thức giới hạn cần nhớ",
    subject: "calculus",
    content: "## Ba giới hạn cơ bản\n\n1. lim(sin x / x) = 1 khi x → 0\n2. lim((1 + 1/n)^n) = e\n3. lim((a^x - 1) / x) = ln(a)\n\nMỗi công thức cần làm ít nhất hai ví dụ và ghi lại điều kiện áp dụng.",
    updatedAt: "2026-09-04T21:00:00+07:00",
    pinned: false,
  },
  {
    id: "note-3",
    title: "Tiếng Trung · Buổi 1",
    subject: "chinese",
    content: "## Chào hỏi\n\n你好 nǐ hǎo — xin chào\n谢谢 xièxie — cảm ơn\n再见 zàijiàn — tạm biệt\n\nMẫu câu: 你好吗？Nǐ hǎo ma? — Bạn khỏe không?",
    updatedAt: "2026-09-06T08:00:00+07:00",
    pinned: true,
  },
];

const seedFlashcards: Flashcard[] = [
  { id: "card-1", deck: "chinese", front: "你好", back: "nǐ hǎo · xin chào", hint: "Lời chào cơ bản", dueDate: "2026-09-06", interval: 0, repetitions: 0 },
  { id: "card-2", deck: "chinese", front: "谢谢", back: "xièxie · cảm ơn", hint: "Nói sau khi được giúp đỡ", dueDate: "2026-09-06", interval: 0, repetitions: 0 },
  { id: "card-3", deck: "chinese", front: "学习", back: "xuéxí · học tập", hint: "Hai âm đều là thanh 2", dueDate: "2026-09-06", interval: 1, repetitions: 1 },
  { id: "card-4", deck: "calculus", front: "lim(x→0) sin(x)/x", back: "1", dueDate: "2026-09-06", interval: 1, repetitions: 1 },
  { id: "card-5", deck: "algebra", front: "Khi nào ma trận A khả nghịch?", back: "Khi det(A) ≠ 0", dueDate: "2026-09-07", interval: 0, repetitions: 0 },
  { id: "card-6", deck: "philosophy", front: "Vấn đề cơ bản của triết học gồm mấy mặt?", back: "Hai mặt: quan hệ vật chất–ý thức và khả năng nhận thức thế giới.", dueDate: "2026-09-06", interval: 0, repetitions: 0 },
];

export const initialState: PlannerState = {
  tasks: seedTasks,
  notes: seedNotes,
  flashcards: seedFlashcards,
  examResults: [],
  completedChineseLessons: [],
  chineseStreak: 0,
  boyaCurrentLesson: 1,
  boyaResourceStatus: {},
};

export const exams: Exam[] = [
  {
    id: "exam-calculus-1",
    title: "Giải tích · Kiểm tra nền tảng",
    subject: "calculus",
    description: "5 câu về giới hạn, đạo hàm và tính liên tục.",
    durationMinutes: 8,
    questions: [
      { id: "c1", prompt: "Giới hạn lim(x→0) sin(x)/x bằng bao nhiêu?", options: ["0", "1", "∞", "Không tồn tại"], answer: 1, explanation: "Đây là giới hạn lượng giác cơ bản bằng 1." },
      { id: "c2", prompt: "Đạo hàm của x³ là gì?", options: ["x²", "2x", "3x²", "3x"], answer: 2, explanation: "Theo quy tắc lũy thừa: (xⁿ)' = n·xⁿ⁻¹." },
      { id: "c3", prompt: "Hàm số nào liên tục tại x = 0?", options: ["1/x", "|x|", "ln(x)", "tan(1/x)"], answer: 1, explanation: "Hàm trị tuyệt đối liên tục trên toàn bộ tập số thực." },
      { id: "c4", prompt: "Nếu f'(x) > 0 trên một khoảng thì f thế nào trên khoảng đó?", options: ["Nghịch biến", "Không đổi", "Đồng biến", "Tuần hoàn"], answer: 2, explanation: "Đạo hàm dương là điều kiện đủ để hàm đồng biến trên khoảng." },
      { id: "c5", prompt: "Đạo hàm của sin(x) là gì?", options: ["-sin(x)", "cos(x)", "-cos(x)", "tan(x)"], answer: 1, explanation: "(sin x)' = cos x." },
    ],
  },
  {
    id: "exam-philosophy-1",
    title: "Triết học · Chương mở đầu",
    subject: "philosophy",
    description: "5 câu kiểm tra khái niệm và phương pháp luận.",
    durationMinutes: 7,
    questions: [
      { id: "p1", prompt: "Vấn đề cơ bản của triết học là mối quan hệ giữa những gì?", options: ["Cá nhân và xã hội", "Vật chất và ý thức", "Lý luận và thực tiễn", "Tự nhiên và lịch sử"], answer: 1, explanation: "Triết học xem quan hệ giữa vật chất và ý thức là vấn đề cơ bản." },
      { id: "p2", prompt: "Chủ nghĩa duy vật khẳng định điều gì có trước?", options: ["Ý thức", "Ngôn ngữ", "Vật chất", "Kinh nghiệm"], answer: 2, explanation: "Chủ nghĩa duy vật khẳng định vật chất có trước và quyết định ý thức." },
      { id: "p3", prompt: "Phép biện chứng xem xét sự vật như thế nào?", options: ["Cô lập, bất biến", "Trong liên hệ và phát triển", "Chỉ qua cảm tính", "Không có mâu thuẫn"], answer: 1, explanation: "Quan điểm toàn diện và phát triển là đặc trưng của phép biện chứng." },
      { id: "p4", prompt: "Thực tiễn giữ vai trò nào với nhận thức?", options: ["Không liên quan", "Chỉ là kết quả", "Cơ sở, động lực, mục đích và tiêu chuẩn", "Chỉ là tiêu chuẩn"], answer: 2, explanation: "Thực tiễn có bốn vai trò chính đối với quá trình nhận thức." },
      { id: "p5", prompt: "Mâu thuẫn biện chứng là gì?", options: ["Hai mặt đối lập thống nhất và đấu tranh", "Một lỗi logic", "Một bất đồng cá nhân", "Hai sự vật không liên quan"], answer: 0, explanation: "Mâu thuẫn biện chứng nằm trong chính sự vật, gồm các mặt đối lập vừa thống nhất vừa đấu tranh." },
    ],
  },
  {
    id: "exam-chinese-1",
    title: "Tiếng Trung · HSK 1 mini test",
    subject: "chinese",
    description: "6 câu từ vựng và mẫu câu chào hỏi cơ bản.",
    durationMinutes: 6,
    questions: [
      { id: "z1", prompt: "“你好” có nghĩa là gì?", options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"], answer: 1, explanation: "你好 (nǐ hǎo) là lời chào cơ bản." },
      { id: "z2", prompt: "Pinyin đúng của 谢谢 là gì?", options: ["zàijiàn", "duìbuqǐ", "xièxie", "qǐng"], answer: 2, explanation: "谢谢 đọc là xièxie, nghĩa là cảm ơn." },
      { id: "z3", prompt: "“再见” dùng khi nào?", options: ["Gặp mặt", "Tạm biệt", "Hỏi tên", "Gọi món"], answer: 1, explanation: "再见 (zàijiàn) nghĩa là hẹn gặp lại/tạm biệt." },
      { id: "z4", prompt: "Trong câu “你好吗？”, 吗 có vai trò gì?", options: ["Phủ định", "Sở hữu", "Tạo câu hỏi có/không", "Chỉ số nhiều"], answer: 2, explanation: "吗 (ma) đặt cuối câu trần thuật để tạo câu hỏi có/không." },
      { id: "z5", prompt: "“我” nghĩa là gì?", options: ["Tôi", "Bạn", "Anh ấy", "Chúng ta"], answer: 0, explanation: "我 (wǒ) là đại từ ngôi thứ nhất số ít: tôi/mình." },
      { id: "z6", prompt: "Chọn câu “Tôi là sinh viên”.", options: ["我是学生。", "你是老师。", "我很好。", "他不是学生。"], answer: 0, explanation: "我是学生 (Wǒ shì xuésheng) = Tôi là sinh viên." },
    ],
  },
];

export const chineseLessons = [
  { id: "zh-1", level: "HSK 1", title: "Thanh điệu & Pinyin", description: "Bốn thanh điệu, thanh nhẹ và cách ghép âm cơ bản.", minutes: 20 },
  { id: "zh-2", level: "HSK 1", title: "Chào hỏi", description: "你好, 你好吗, 很好, 谢谢, 再见.", minutes: 18 },
  { id: "zh-3", level: "HSK 1", title: "Giới thiệu bản thân", description: "Tên, quốc tịch, nghề nghiệp và mẫu câu 是.", minutes: 25 },
  { id: "zh-4", level: "HSK 1", title: "Số đếm & ngày giờ", description: "Số 0–100, hỏi giờ, ngày tháng và tuổi.", minutes: 25 },
  { id: "zh-5", level: "HSK 1", title: "Gia đình", description: "Thành viên gia đình, lượng từ 个 và trợ từ 的.", minutes: 25 },
  { id: "zh-6", level: "HSK 1", title: "Ăn uống", description: "Gọi món, sở thích với 喜欢 và động từ 要.", minutes: 30 },
];

export const dailyChineseWords = [
  { hanzi: "学习", pinyin: "xuéxí", meaning: "học tập", example: "我学习汉语。Wǒ xuéxí Hànyǔ. — Tôi học tiếng Trung." },
  { hanzi: "大学", pinyin: "dàxué", meaning: "đại học", example: "她是大学生。Tā shì dàxuéshēng. — Cô ấy là sinh viên." },
  { hanzi: "今天", pinyin: "jīntiān", meaning: "hôm nay", example: "今天天气很好。— Hôm nay thời tiết rất đẹp." },
  { hanzi: "朋友", pinyin: "péngyou", meaning: "bạn bè", example: "他是我的朋友。— Anh ấy là bạn của tôi." },
  { hanzi: "喜欢", pinyin: "xǐhuan", meaning: "thích", example: "我喜欢喝茶。— Tôi thích uống trà." },
];

export const semesterSchedule = [
  { weekday: "Thứ Hai", time: "19:30", title: "Tự học Giải tích", place: "Bàn học", subject: "calculus" as const },
  { weekday: "Thứ Ba", time: "19:30", title: "Tự học Đại số", place: "Bàn học", subject: "algebra" as const },
  { weekday: "Thứ Tư", time: "13:00", title: "Giáo dục thể chất F1", place: "Ngoài trời 65", subject: "digital" as const },
  { weekday: "Thứ Tư", time: "15:35", title: "Triết học Mác–Lênin", place: "Phòng trực tuyến", subject: "philosophy" as const },
  { weekday: "Thứ Năm", time: "07:00", title: "Công nghệ số & AI", place: "Phòng trực tuyến", subject: "digital" as const },
  { weekday: "Thứ Sáu", time: "13:00", title: "Giải tích", place: "303-A2", subject: "calculus" as const },
  { weekday: "Thứ Sáu", time: "15:35", title: "Đại số tuyến tính", place: "303-A2", subject: "algebra" as const },
  { weekday: "Chủ Nhật", time: "09:00", title: "Tiếng Trung · HSK 1", place: "Tự học", subject: "chinese" as const },
];
