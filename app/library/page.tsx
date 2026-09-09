import type { Metadata } from "next";
import { TextbookLibrary } from "@/components/textbook-library";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Thư viện giáo trình",
  description: "Trình đọc giáo trình PDF hai trang, có tìm kiếm toàn văn và ghi nhớ trang đang đọc.",
};

export default function LibraryPage() {
  return (
    <div className="page library-page">
      <PageHeader
        eyebrow="Thư viện"
        title="Góc đọc sách của Dương"
        description="Mở giáo trình như một cuốn sách, đọc hai trang song song và tìm ngay nội dung cần học trong PDF."
        sticker="bookmark"
        stickerTone="gold"
      />
      <TextbookLibrary />
    </div>
  );
}
