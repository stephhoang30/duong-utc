import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UtcGuide } from "@/components/utc-guide";
import { utcGuideNavigation, type UtcGuideSectionId } from "@/lib/utc-data";

function cleanLegacyFragment(fragment: string) {
  return fragment
    .replace(/<span class="deco[^>]*>[\s\S]*?<\/span>/g, "")
    .replace(/\sstyle="margin-top:18px; font-size:13\.5px; color:var\(--text-muted\)"/g, " class=\"legacy-source-note\"")
    .replace(/\sstyle="margin-top:26px"/g, "")
    .replace(/\sstyle="margin-top:22px"/g, "")
    .replace(/\sstyle="margin-top:16px"/g, "")
    .replace(/\sstyle="margin:0; color:var\(--text-secondary\); font-size:14\.8px"/g, "")
    .replace(/\sstyle="text-align:left; padding:14px 16px 0; font-size:12\.5px; color:var\(--text-muted\)"/g, "")
    .replace("(Danh sách này chỉ lưu trong phiên xem hiện tại — tải lại trang sẽ trở về ban đầu.)", "Tiến độ được tự động lưu trên thiết bị này.");
}

function cleanLegacySection(id: UtcGuideSectionId, fragment: string) {
  let cleaned = cleanLegacyFragment(fragment);

  if (id === "nganh") {
    cleaned = cleaned.replace(/<div class="tiles">[\s\S]*?(?=<div class="cols2")/, "");
  }

  if (id === "lotrinh") {
    cleaned = cleaned
      .replace("Lộ trình từ hôm nay đến ngày đi làm", "Lộ trình từ năm nhất đến ngày đi làm")
      .replace(/<div class="phase" style="--phase:var\(--p0\)">[\s\S]*?(?=<div class="phase" style="--phase:var\(--p1\)">)/, "");
  }

  if (id === "tienganh") {
    cleaned = cleaned
      .replace("Kế hoạch ôn 2 tuần, mỗi ngày 60 phút", "Kế hoạch củng cố A2 trong 2 tuần")
      .replace("Trước hôm thi: ngủ đủ. Bài này đo nền tảng, thức đêm không cứu được điểm.", "Cuối mỗi tuần: làm lại câu sai, ghi một trang tổng kết và giữ một ngày nghỉ hoàn toàn.");
  }

  if (id === "dilai") {
    cleaned = cleaned
      .replace("Mẹo cho tân sinh viên", "Mẹo đi học bằng xe buýt")
      .replace("<b>Đi thử một lần trước ngày 24/8</b> — tiện nhất là ghép luôn vào hôm lên trường nhập học (ngày ghi trên Giấy báo, 20 hoặc 21/8). Bấm giờ thật từ lúc ra khỏi nhà; đó mới là con số để lên lịch, không phải con số ước tính trên mạng.", "<b>Đi thử tuyến 54 → 34 vào một ngày học thử</b> và bấm giờ thật từ lúc ra khỏi nhà. Dùng con số đó để lên lịch thay vì chỉ dựa vào thời gian ước tính trên mạng.")
      .replace("Cần thẻ sinh viên và ảnh thẻ, làm ngay sau khi nhập học.", "Cần thẻ sinh viên và ảnh thẻ; đăng ký khi Dương bắt đầu đi học bằng buýt thường xuyên.")
      .replace("trước ngày nhập học nên kiểm tra lại", "trước mỗi tuần học nên kiểm tra lại");
  }

  return cleaned;
}

function extractLegacyContent() {
  const source = readFileSync(join(process.cwd(), "legacy", "index.html"), "utf8");
  const sections = {} as Partial<Record<UtcGuideSectionId, string>>;

  for (const item of utcGuideNavigation) {
    if (item.id === "lich") continue;
    const pattern = new RegExp(`<section id="${item.id}"[^>]*>([\\s\\S]*?)<\\/section>`);
    const content = source.match(pattern)?.[1];
    if (content) sections[item.id] = cleanLegacySection(item.id, content);
  }

  return sections;
}

export default function UtcGuidePage() {
  return <UtcGuide sectionHtml={extractLegacyContent()} />;
}
