import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const publicRoot = path.resolve("public");
const libraryRoot = path.join(publicRoot, "resources", "hsk", "library", "Bộ Đề HSK Yangdexin");
const outputPath = path.join(publicRoot, "resources", "hsk", "manifest.json");
const ignoredNames = new Set([".DS_Store", "desktop.ini"]);
const unavailable = [
  "TÀI LIỆU HSK3.0 YANGDEXIN / 第一分册：等级描述、音节、汉字.pdf",
  "TÀI LIỆU HSK3.0 YANGDEXIN / 第三分册：语法.pdf",
  "TÀI LIỆU HSK3.0 YANGDEXIN / 第二分册：词汇.pdf",
];

async function collectFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name) || entry.name.endsWith(".part")) continue;
    const absolutePath = path.join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath));
    if (entry.isFile()) {
      const fileStat = await stat(absolutePath);
      const relativePath = path.relative(libraryRoot, absolutePath);
      const parts = relativePath.split(path.sep);
      const extension = path.extname(entry.name).slice(1).toLowerCase() || "file";
      const encodedPath = ["resources", "hsk", "library", "Bộ Đề HSK Yangdexin", ...parts]
        .map(encodeURIComponent)
        .join("/");
      files.push({
        title: entry.name,
        folder: parts.slice(1, -1).join(" / "),
        group: parts[0] ?? "Khác",
        extension,
        bytes: fileStat.size,
        href: `/${encodedPath}`,
      });
    }
  }

  return files;
}

const files = (await collectFiles(libraryRoot)).sort((left, right) =>
  left.group.localeCompare(right.group, "vi") || left.folder.localeCompare(right.folder, "vi") || left.title.localeCompare(right.title, "vi")
);

const groups = Object.values(files.reduce((result, file) => {
  result[file.group] ??= { id: encodeURIComponent(file.group), label: file.group, files: [], totalBytes: 0 };
  result[file.group].files.push(file);
  result[file.group].totalBytes += file.bytes;
  return result;
}, {}));

const manifest = {
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  totalBytes: files.reduce((total, file) => total + file.bytes, 0),
  unavailable,
  groups,
};

await writeFile(outputPath, `${JSON.stringify(manifest)}\n`, "utf8");
console.log(`Đã lập chỉ mục ${manifest.totalFiles} tệp trong ${groups.length} nhóm.`);
