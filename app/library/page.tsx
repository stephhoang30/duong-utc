import type { Metadata } from "next";
import { TextbookLibrary } from "@/components/textbook-library";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Thư viện giáo trình",
  description: "Giáo trình theo các môn Dương đang học, mở và đọc trực tiếp trong planner.",
};

export default function LibraryPage() {
  return (
    <div className="page library-page">
      <PageHeader
        eyebrow="Thư viện"
        title="Giáo trình của Dương"
        description="PDF đã lưu trong planner, tải nhanh và đọc không cần mở website khác."
        sticker="bookmark"
        stickerTone="gold"
      />
      <TextbookLibrary />
    </div>
  );
}
