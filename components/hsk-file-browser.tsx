"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { SectionHeading } from "./ui";
import { resourceUrl } from "@/lib/resource-url";

type HskFile = {
  title: string;
  folder: string;
  group: string;
  extension: string;
  bytes: number;
  href: string;
};

type HskGroup = {
  id: string;
  label: string;
  files: HskFile[];
  totalBytes: number;
};

type HskManifest = {
  totalFiles: number;
  totalBytes: number;
  unavailable: string[];
  groups: HskGroup[];
};

const audioExtensions = new Set(["mp3", "m4a", "wav", "ogg"]);

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function HskFileBrowser() {
  const [manifest, setManifest] = useState<HskManifest | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeGroup, setActiveGroup] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(36);
  const [activeAudio, setActiveAudio] = useState<HskFile | null>(null);

  useEffect(() => {
    fetch(resourceUrl("/resources/hsk/manifest.json"))
      .then((response) => {
        if (!response.ok) throw new Error("Không đọc được danh mục tài liệu");
        return response.json() as Promise<HskManifest>;
      })
      .then((data) => {
        setManifest(data);
        const hskOne = data.groups.find((group) => /^HSK1\b/i.test(group.label));
        setActiveGroup(hskOne?.id ?? data.groups[0]?.id ?? "");
      })
      .catch(() => setLoadError(true));
  }, []);

  const selectedGroup = manifest?.groups.find((group) => group.id === activeGroup) ?? null;
  const matchedFiles = useMemo(() => {
    if (!selectedGroup) return [];
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return selectedGroup.files;
    return selectedGroup.files.filter((file) => normalizeSearch(`${file.title} ${file.folder}`).includes(normalizedQuery));
  }, [query, selectedGroup]);
  const matchedBytes = useMemo(() => matchedFiles.reduce((total, file) => total + file.bytes, 0), [matchedFiles]);

  const chooseGroup = (groupId: string) => {
    setActiveGroup(groupId);
    setVisibleCount(36);
    setQuery("");
    setActiveAudio(null);
  };

  return (
    <section className="panel hsk-file-browser" id="hsk-files">
      <SectionHeading icon="folder" title="Kho đề HSK & HSKK trên web" description={manifest ? `${manifest.totalFiles} tệp · ${formatBytes(manifest.totalBytes)} · giữ nguyên cấu trúc theo cấp độ` : "Đang đọc danh mục PDF và audio…"} />

      {loadError && <div className="hsk-library-message"><Icon name="clock" size={18} /><span>Danh mục đang được hoàn tất. Các tệp đã tải vẫn được giữ nguyên trong thư mục tài nguyên.</span></div>}

      {manifest && <>
        {manifest.unavailable.length > 0 && <details className="hsk-unavailable">
          <summary><Icon name="clock" size={17} /><span>{manifest.unavailable.length} tệp bị chủ sở hữu khóa tải xuống</span><Icon name="arrow-right" size={16} /></summary>
          <div>{manifest.unavailable.map((file) => <p key={file}><Icon name="file" size={15} />{file}</p>)}</div>
        </details>}
        <div className="hsk-group-tabs" role="tablist" aria-label="Chọn nhóm tài liệu HSK">
          {manifest.groups.map((group) => <button key={group.id} role="tab" aria-selected={group.id === activeGroup} className={group.id === activeGroup ? "active" : ""} onClick={() => chooseGroup(group.id)}><span>{group.label}</span><small>{group.files.length}</small></button>)}
        </div>

        <div className="hsk-browser-toolbar">
          <label><Icon name="search" size={18} /><input aria-label="Tìm trong nhóm tài liệu HSK" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(36); }} placeholder="Tìm mã đề, đáp án, audio…" /></label>
          {selectedGroup && <span>{matchedFiles.length} {query.trim() ? "kết quả" : "tệp"} · {formatBytes(matchedBytes)}</span>}
        </div>

        {activeAudio && <div className="hsk-audio-player">
          <span><Icon name="headphones" size={20} /></span>
          <div><small>Đang nghe</small><strong>{activeAudio.title}</strong></div>
          <audio key={activeAudio.href} controls autoPlay preload="metadata" src={resourceUrl(activeAudio.href)}>Trình duyệt của bạn chưa hỗ trợ phát audio.</audio>
          <button onClick={() => setActiveAudio(null)} aria-label="Đóng trình phát"><Icon name="x" size={17} /></button>
        </div>}

        <div className="hsk-file-list">
          {matchedFiles.slice(0, visibleCount).map((file) => {
            const isAudio = audioExtensions.has(file.extension);
            const mainContent = <><span className={`hsk-file-icon ${isAudio ? "audio" : "document"}`}><Icon name={isAudio ? "headphones" : "file"} size={18} /></span><div><strong title={file.title}>{file.title}</strong><p title={file.folder || file.group}>{file.folder || file.group}</p></div></>;
            return <article key={file.href}>
              {isAudio ? <button className="hsk-file-main" onClick={() => setActiveAudio(file)} aria-label={`Nghe ${file.title}`}>{mainContent}</button> : <a className="hsk-file-main" href={resourceUrl(file.href)} target="_blank" rel="noreferrer">{mainContent}</a>}
              <span className="hsk-file-meta">{file.extension.toUpperCase()} · {formatBytes(file.bytes)}</span>
              <a className="hsk-file-download" href={resourceUrl(file.href)} download aria-label={`Tải ${file.title}`}><Icon name="download" size={17} /></a>
            </article>;
          })}
        </div>

        {matchedFiles.length === 0 && <div className="hsk-library-message"><Icon name="search" size={18} /><span>Không tìm thấy tệp phù hợp trong nhóm này.</span></div>}
        {matchedFiles.length > visibleCount && <button className="button ghost hsk-load-more" onClick={() => setVisibleCount((count) => count + 36)}>Xem thêm {Math.min(36, matchedFiles.length - visibleCount)} tệp</button>}
      </>}
    </section>
  );
}
