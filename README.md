# Dương Study Planner

Digital planner cá nhân được xây bằng Next.js App Router và TypeScript. Ứng dụng gồm kế hoạch tuần, sổ tay tự lưu, flashcard ôn tập ngắt quãng, phòng thi có đồng hồ và thư viện học BOYA/HSK.

## Chạy tại máy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm tra và build

```bash
npm run typecheck
npm run build
```

Bản build tĩnh nằm trong thư mục `out/`. Toàn bộ dữ liệu cá nhân được lưu bằng `localStorage` trên trình duyệt.

## Thư viện tiếng Trung

- `public/resources/boya1/pdfs/`: PDF BOYA theo bài và tài liệu bổ trợ.
- `public/resources/boya1/audio/`: 31 audio BOYA và gói ZIP.
- `public/resources/boya1/sheets/`: bảng ngữ pháp và từ vựng đã xuất thành Excel.
- `public/resources/hsk/library/`: kho đề HSK/HSKK giữ nguyên cấu trúc nguồn.
- `public/resources/hsk/manifest.json`: chỉ mục để tìm, lọc và mở tệp trong web.

Sau khi bổ sung hoặc thay đổi tệp HSK, chạy:

```bash
node scripts/generate-hsk-manifest.mjs
```

Các tài nguyên lớn chỉ được tải khi người dùng mở PDF hoặc phát audio, nên không làm nặng lần tải trang đầu.

## Lưu trữ production

Trang tĩnh được deploy riêng, còn thư mục `public/resources/` được đồng bộ vào bucket S3 private. Lambda redirector tại `infrastructure/resource-redirector/` xác thực khóa truy cập từ SSM Parameter Store rồi tạo URL S3 có chữ ký sống trong 5 phút. Vì trình duyệt tải trực tiếp từ S3 nên PDF/audio lớn vẫn hỗ trợ HTTP range requests và không đi xuyên qua Lambda.

Build production cần hai biến trong `.env.example`. Không commit giá trị khóa thật; lấy khóa SecureString từ SSM chỉ trong bước build.

Trang HTML trước khi chuyển đổi được giữ tại `legacy/index.html` để đối chiếu nội dung.
