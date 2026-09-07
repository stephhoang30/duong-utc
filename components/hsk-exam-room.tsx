"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";

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

type RoomMode = "setup" | "taking" | "score";

const audioExtensions = new Set(["mp3", "m4a", "wav", "ogg"]);
const hskGroupPattern = /^(HSK(?:K|\s|\d)|BỘ ĐỀ MÔ PHỎNG HSK)/i;

function normalizedTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.(pdf|mp3|m4a|wav|ogg)$/i, "")
    .replace(/(试题及答案|试题|试卷|卷答案|答案|听力材料|听力文本|loesungen|dap an|de thi|dê thi)/g, "")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
}

function isAnswerFile(file: HskFile) {
  if (/(试题及答案|đề.*đáp án)/i.test(file.title.normalize("NFC"))) return false;
  return /(答案|听力材料|听力文本|loesungen|đáp án|đáp án)/i.test(file.title.normalize("NFC"));
}

function findRelatedFile(source: HskFile, files: HskFile[], predicate: (file: HskFile) => boolean) {
  const sourceKey = normalizedTitle(source.title);
  if (!sourceKey) return files.find(predicate) ?? null;
  return files.find((file) => predicate(file) && (() => {
    const candidateKey = normalizedTitle(file.title);
    return candidateKey === sourceKey || candidateKey.includes(sourceKey) || sourceKey.includes(candidateKey);
  })()) ?? null;
}

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function HskExamRoom({ onComplete }: { onComplete: (result: { examId: string; score: number; total: number; durationSeconds: number }) => void }) {
  const [manifest, setManifest] = useState<HskManifest | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [documentHref, setDocumentHref] = useState("");
  const [audioHref, setAudioHref] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(55);
  const [remaining, setRemaining] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [mode, setMode] = useState<RoomMode>("setup");
  const [manualScore, setManualScore] = useState("");

  useEffect(() => {
    fetch("/resources/hsk/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Không đọc được kho đề HSK");
        return response.json() as Promise<HskManifest>;
      })
      .then((data) => {
        setManifest(data);
        const first = data.groups.find((group) => /^HSK1\b/i.test(group.label)) ?? data.groups.find((group) => hskGroupPattern.test(group.label));
        setGroupId(first?.id ?? "");
      })
      .catch(() => setLoadError(true));
  }, []);

  const groups = useMemo(() => manifest?.groups.filter((group) => hskGroupPattern.test(group.label)) ?? [], [manifest]);
  const group = groups.find((item) => item.id === groupId) ?? groups[0] ?? null;
  const documents = useMemo(() => {
    if (!group) return [];
    const pdfs = group.files.filter((file) => file.extension === "pdf");
    const examPdfs = pdfs.filter((file) => !isAnswerFile(file));
    return examPdfs.length ? examPdfs : pdfs;
  }, [group]);
  const audios = useMemo(() => group?.files.filter((file) => audioExtensions.has(file.extension)) ?? [], [group]);
  const selectedDocument = documents.find((file) => file.href === documentHref) ?? documents[0] ?? null;
  const selectedAudio = audios.find((file) => file.href === audioHref) ?? null;
  const relatedAnswer = selectedDocument && group
    ? /(试题及答案|đề.*đáp án)/i.test(selectedDocument.title.normalize("NFC"))
      ? selectedDocument
      : findRelatedFile(selectedDocument, group.files, isAnswerFile)
    : null;

  useEffect(() => {
    const firstDocument = documents[0] ?? null;
    const matchingAudio = firstDocument ? findRelatedFile(firstDocument, audios, () => true) : audios[0] ?? null;
    setDocumentHref(firstDocument?.href ?? "");
    setAudioHref(matchingAudio?.href ?? "");
    setMode("setup");
  }, [groupId, documents, audios]);

  useEffect(() => {
    if (mode !== "taking") return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === "taking" && sessionDuration > 0 && remaining === 0) setMode("score");
  }, [mode, remaining, sessionDuration]);

  const chooseDocument = (href: string) => {
    setDocumentHref(href);
    const nextDocument = documents.find((file) => file.href === href);
    if (!nextDocument) return;
    const matchingAudio = findRelatedFile(nextDocument, audios, () => true);
    setAudioHref(matchingAudio?.href ?? "");
  };

  const start = () => {
    if (!selectedDocument) return;
    const duration = durationMinutes * 60;
    setSessionDuration(duration);
    setRemaining(duration);
    setManualScore("");
    setMode("taking");
    document.getElementById("hsk-exam-room")?.scrollIntoView({ behavior: "smooth" });
  };

  const saveScore = () => {
    if (!selectedDocument) return;
    const score = Math.max(0, Math.min(100, Math.round(Number(manualScore))));
    if (!Number.isFinite(score) || manualScore.trim() === "") return;
    onComplete({
      examId: `hsk-${groupId}-${normalizedTitle(selectedDocument.title)}`,
      score,
      total: 100,
      durationSeconds: Math.max(0, sessionDuration - remaining),
    });
    setMode("setup");
  };

  if (loadError) return <section className="panel hsk-room-message" id="hsk-exam-room"><Icon name="clock" /><span>Chưa đọc được kho đề HSK. Hãy tải lại trang.</span></section>;
  if (!manifest || !group || !selectedDocument) return <section className="panel hsk-room-message" id="hsk-exam-room"><span className="loading-line" />Đang chuẩn bị phòng thi HSK…</section>;

  if (mode === "taking") return <section className="hsk-live-room" id="hsk-exam-room">
    <header className="panel hsk-live-toolbar">
      <button className="button ghost small" onClick={() => { if (window.confirm("Thoát đề HSK hiện tại?")) setMode("setup"); }}><Icon name="arrow-left" size={17} />Thoát</button>
      <div><span className="eyebrow">{group.label}</span><h2>{selectedDocument.title}</h2></div>
      <span className={`hsk-live-timer ${remaining < 300 ? "is-urgent" : ""}`}><Icon name="timer" size={18} />{formatTimer(remaining)}</span>
    </header>
    {selectedAudio && <div className="panel hsk-live-audio"><span><Icon name="headphones" size={20} /></span><div><small>Audio nghe</small><strong>{selectedAudio.title}</strong></div><audio controls preload="metadata" src={selectedAudio.href}>Trình duyệt chưa hỗ trợ audio.</audio></div>}
    <div className="panel hsk-pdf-stage"><iframe src={selectedDocument.href} title={`Đề thi ${selectedDocument.title}`} /></div>
    <div className="panel hsk-live-submit"><div><strong>Làm xong rồi?</strong><span>Nộp bài rồi đối chiếu đáp án và nhập điểm.</span></div><button className="button primary" onClick={() => setMode("score")}>Nộp bài<Icon name="arrow-right" size={17} /></button></div>
  </section>;

  if (mode === "score") return <section className="panel hsk-score-panel" id="hsk-exam-room">
    <span className="result-badge good"><Icon name="check" size={26} /></span>
    <span className="eyebrow">Hoàn thành · {group.label}</span>
    <h2>Đối chiếu đáp án và lưu kết quả</h2>
    <p>{selectedDocument.title}</p>
    <div className="hsk-score-actions">
      {relatedAnswer && <a className="button secondary" href={relatedAnswer.href} target="_blank" rel="noreferrer"><Icon name="file" size={17} />Mở đáp án</a>}
      <a className="button ghost" href={selectedDocument.href} target="_blank" rel="noreferrer"><Icon name="external-link" size={17} />Mở đề riêng</a>
    </div>
    <label className="hsk-score-input"><span>Điểm tự chấm · thang 100</span><input type="number" min="0" max="100" inputMode="numeric" value={manualScore} onChange={(event) => setManualScore(event.target.value)} placeholder="Ví dụ: 82" /></label>
    <div className="hsk-score-footer"><button className="button ghost" onClick={() => setMode("setup")}>Không lưu</button><button className="button primary" disabled={!manualScore.trim()} onClick={saveScore}><Icon name="check" size={17} />Lưu kết quả</button></div>
  </section>;

  return <section className="panel hsk-exam-room" id="hsk-exam-room">
    <header><span className="hsk-room-icon"><Icon name="exam" size={23} /></span><div><span className="eyebrow">Kho đề đã lưu trong website</span><h2>Thi thử HSK & HSKK</h2></div></header>

    <div className="hsk-level-tabs" role="tablist" aria-label="Chọn cấp độ HSK">
      {groups.map((item) => <button key={item.id} role="tab" aria-selected={item.id === group.id} className={item.id === group.id ? "active" : ""} onClick={() => setGroupId(item.id)}><span>{item.label.replace(/\s*YANGDEXIN$/i, "")}</span><small>{item.files.length} tệp</small></button>)}
    </div>

    <div className="hsk-room-settings">
      <label><span>Đề PDF</span><select value={selectedDocument.href} onChange={(event) => chooseDocument(event.target.value)}>{documents.map((file) => <option key={file.href} value={file.href}>{file.title}</option>)}</select></label>
      <label><span>Audio nghe</span><select value={selectedAudio?.href ?? ""} disabled={!audios.length} onChange={(event) => setAudioHref(event.target.value)}>{audios.length ? <><option value="">Không ghép audio</option>{audios.map((file) => <option key={file.href} value={file.href}>{file.title}</option>)}</> : <option>Không có audio</option>}</select></label>
      <label><span>Thời gian</span><select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}><option value={35}>35 phút</option><option value={55}>55 phút</option><option value={90}>90 phút</option><option value={120}>120 phút</option></select></label>
      <button className="button primary" onClick={start}><Icon name="play" size={18} />Vào phòng thi</button>
    </div>

    <div className="hsk-room-summary"><span><Icon name="file" size={17} />{documents.length} tài liệu PDF</span><span><Icon name="headphones" size={17} />{audios.length} audio</span>{relatedAnswer && <span><Icon name="check" size={17} />Có đáp án đi kèm</span>}</div>
  </section>;
}
