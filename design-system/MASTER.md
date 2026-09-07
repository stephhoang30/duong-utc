# Dương Digital Planner — Design System

## 1. Tính cách thị giác

- Phong cách: sổ tay học tập pastel, ấm áp, gọn gàng và có cảm giác giấy thật.
- Mục tiêu: dễ đọc trong phiên học dài; vui mắt nhưng không làm phân tán việc học.
- Giữ nguyên ngôn ngữ gốc của `legacy/index.html`: nền xanh trời chấm bi, giấy kem, điểm nhấn hồng/mint/lavender/bơ/peach.

## 2. Màu sắc

| Vai trò | Token | Màu sáng |
|---|---|---|
| Nền ứng dụng | `--surface-0` | `#d5eff8` |
| Giấy/card | `--surface-1` | `#fffdf9` |
| Giấy phụ | `--surface-2` | `#fdf6ea` |
| Chữ chính | `--text-primary` | `#3a3150` |
| Chữ phụ | `--text-secondary` | `#5d5476` |
| Thương hiệu | `--brand` | `#2f7fc4` |
| Điểm nhấn | `--accent` | `#cf3f78` |

Module mapping: Kế hoạch = peach/coral, Sổ tay = lavender, Ôn bài = pink, Phòng thi = sky, Tiếng Trung = mint. Dark mode dùng cùng sắc độ cảm xúc nhưng tăng tương phản chữ/nền.

## 3. Typography

- Display: **Baloo 2** — tiêu đề, số liệu lớn, tên thương hiệu.
- Body/UI: **Quicksand** — nội dung, nút, form, nhãn.
- Handwritten: **Patrick Hand** — lời nhắc và ghi chú cảm xúc; không dùng cho dữ liệu quan trọng.
- Năm cấp chữ: `body`, `ui`, `small`, `caption`, `micro`. Mặc định lần lượt 17 / 14 / 13 / 12 / 10.5px.
- Người dùng chọn Gọn, Vừa hoặc Lớn trong menu profile; không dùng chữ nhỏ hơn 9.5px.
- Nhãn nút, chip và điều hướng ngắn giữ một dòng. Tiêu đề và nội dung dài được xuống dòng tự nhiên, không cắt mất dữ liệu.

## 4. Không gian và hình khối

- Nhịp khoảng cách cơ bản: 4px; ưu tiên 8, 12, 16, 20, 24, 32px.
- Card: radius 20px; panel nổi bật: 28px; input/nút: 12–14px.
- Viền giấy màu `--line`; bóng thấp, mềm. Tránh bóng neon hoặc glass quá mạnh.
- Tất cả vùng bấm chính tối thiểu 44×44px.

## 5. Icon

- SVG outline 24×24, `stroke-width: 1.8`, đầu nét tròn.
- Một nghĩa cho một icon: ghim = pushpin, địa điểm = location pin, ôn bài = flashcard, bài thi = clipboard-check.
- Không dùng emoji làm icon điều khiển. Icon trang trí phải có `aria-hidden`; nút icon phải có `aria-label`.

## 6. Sticker system

- Mỗi trang chức năng tối đa một sticker ở header: mảnh giấy pastel 56–66px, xoay khoảng −4°, có băng dính giấy và một sparkle nhỏ.
- Sticker lấy màu theo module, dùng icon SVG hiện có và không phụ thuộc ảnh tải ngoài.
- Sticky note lớn chỉ dùng cho mục tiêu tuần hoặc lời nhắc quan trọng.
- Decoration không che chữ, không mang thông tin duy nhất và không tạo chuyển động liên tục.

## 7. Responsive và accessibility

- Desktop: sidebar cố định; settings mở từ profile dưới cùng như một popover.
- Tablet/mobile: sidebar thành drawer, bottom navigation giữ 5 tác vụ chính; settings mở phía trên profile trong drawer.
- Nội dung không tràn ngang ngoài các vùng chủ động cuộn như bảng và tab tháng.
- Focus ring rõ, hỗ trợ `prefers-reduced-motion`, màu chữ đạt tương phản đọc được ở light/dark mode.
- Ưu tiên câu chữ ngắn, động từ ở đầu nút và trạng thái lưu rõ ràng.
