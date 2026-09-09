"use client";

import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";

type ReaderMode = "spread" | "single";

type SearchResult = {
  page: number;
  excerpt: string;
};

type PdfBookReaderProps = {
  title: string;
  url: string;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getPageExcerpt(text: string, matchAt: number, queryLength: number) {
  const start = Math.max(0, matchAt - 54);
  const end = Math.min(text.length, matchAt + queryLength + 76);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function PdfCanvasPage({ document, pageNumber, zoom }: { document: PDFDocumentProxy; pageNumber: number; zoom: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderWidth, setRenderWidth] = useState(0);
  const [isRendering, setIsRendering] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => setRenderWidth(Math.round(host.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || renderWidth < 40) return;

    let disposed = false;
    let renderTask: RenderTask | null = null;
    setIsRendering(true);
    setFailed(false);

    void document.getPage(pageNumber).then((pdfPage) => {
      if (disposed) return;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const cssScale = (renderWidth / baseViewport.width) * zoom;
      const viewport = pdfPage.getViewport({ scale: cssScale });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      renderTask = pdfPage.render({
        canvas,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      });
      return renderTask.promise;
    }).then(() => {
      if (!disposed) setIsRendering(false);
    }).catch((error: unknown) => {
      if (disposed || (error instanceof Error && error.name === "RenderingCancelledException")) return;
      setFailed(true);
      setIsRendering(false);
    });

    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, renderWidth, zoom]);

  return (
    <div ref={hostRef} className="pdf-book-page" aria-label={`Trang ${pageNumber}`}>
      {isRendering && <div className="pdf-page-loading"><span /><small>Đang dàn trang {pageNumber}</small></div>}
      {failed ? (
        <div className="pdf-page-error"><Icon name="file" size={28} /><strong>Chưa đọc được trang {pageNumber}</strong></div>
      ) : (
        <canvas ref={canvasRef} aria-label={`Nội dung trang ${pageNumber}`} />
      )}
      <span className="pdf-page-number">{pageNumber}</span>
    </div>
  );
}

export function PdfBookReader({ title, url }: PdfBookReaderProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<ReaderMode>("spread");
  const [compact, setCompact] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const searchRunRef = useRef(0);
  const searchIndexRef = useRef<Map<number, string>>(new Map());

  const displayMode: ReaderMode = compact ? "single" : mode;
  const pageCount = document?.numPages ?? 0;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDocument: PDFDocumentProxy | null = null;

    setDocument(null);
    setLoadError("");
    setPage(1);
    setZoom(1);
    setSearchQuery("");
    setSearchedQuery("");
    setSearchResults([]);
    setSearchProgress(0);
    searchIndexRef.current = new Map();
    searchRunRef.current += 1;

    void import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      loadingTask = pdfjs.getDocument({ url });
      loadedDocument = await loadingTask.promise;
      if (disposed) {
        await loadingTask.destroy();
        return;
      }

      setDocument(loadedDocument);
      try {
        const savedPage = Number(localStorage.getItem(`duong-pdf-page:${url}`));
        if (Number.isFinite(savedPage) && savedPage >= 1 && savedPage <= loadedDocument.numPages) {
          setPage(savedPage);
        }
      } catch {
        // The reader works normally when storage is unavailable.
      }
    }).catch((error: unknown) => {
      if (!disposed) {
        console.error("Unable to load PDF", error);
        setLoadError("Chưa thể mở PDF này. Dương có thể thử lại hoặc mở bản PDF gốc.");
      }
    });

    return () => {
      disposed = true;
      searchRunRef.current += 1;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [url]);

  const goToPage = useCallback((target: number) => {
    if (!pageCount) return;
    const bounded = Math.min(pageCount, Math.max(1, Math.round(target)));
    const firstPage = displayMode === "spread" && bounded > 1
      ? bounded - (bounded % 2)
      : bounded;
    setPage(firstPage);
    try {
      localStorage.setItem(`duong-pdf-page:${url}`, String(firstPage));
    } catch {
      // Saving reading progress is optional.
    }
  }, [displayMode, pageCount, url]);

  useEffect(() => {
    if (displayMode === "spread" && page > 1 && page % 2 !== 0) {
      goToPage(page);
    }
  }, [displayMode, goToPage, page]);

  const visiblePages = useMemo<Array<number | null>>(() => {
    if (!pageCount) return [];
    if (displayMode === "single") return [page];
    if (page === 1) return [null, 1];
    return [page, page + 1 <= pageCount ? page + 1 : null];
  }, [displayMode, page, pageCount]);

  const canGoBack = page > 1;
  const canGoForward = displayMode === "spread"
    ? (page === 1 ? pageCount > 1 : page + 1 < pageCount)
    : page < pageCount;

  const previousPage = () => {
    if (!canGoBack) return;
    if (displayMode === "spread") goToPage(page <= 2 ? 1 : page - 2);
    else goToPage(page - 1);
  };

  const nextPage = () => {
    if (!canGoForward) return;
    if (displayMode === "spread") goToPage(page === 1 ? 2 : page + 2);
    else goToPage(page + 1);
  };

  const runSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!document) return;

    const normalizedQuery = normalizeSearch(searchQuery);
    const runId = searchRunRef.current + 1;
    searchRunRef.current = runId;
    setSearchedQuery(searchQuery.trim());
    setSearchResults([]);
    setSearchProgress(0);

    if (!normalizedQuery) {
      setSearching(false);
      return;
    }

    setSearching(true);
    const results: SearchResult[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        if (searchRunRef.current !== runId) return;

        let text = searchIndexRef.current.get(pageNumber);
        if (text === undefined) {
          const pdfPage = await document.getPage(pageNumber);
          const content = await pdfPage.getTextContent();
          text = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          searchIndexRef.current.set(pageNumber, text);
          pdfPage.cleanup();
        }

        const matchAt = normalizeSearch(text).indexOf(normalizedQuery);
        if (matchAt >= 0) {
          results.push({ page: pageNumber, excerpt: getPageExcerpt(text, matchAt, normalizedQuery.length) });
        }

        if (pageNumber % 8 === 0 || pageNumber === document.numPages) {
          setSearchProgress(pageNumber);
          setSearchResults([...results]);
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }
      }
    } catch (error) {
      console.error("Unable to search PDF", error);
    } finally {
      if (searchRunRef.current === runId) setSearching(false);
    }
  };

  const clearSearch = () => {
    searchRunRef.current += 1;
    setSearchQuery("");
    setSearchedQuery("");
    setSearchResults([]);
    setSearching(false);
    setSearchProgress(0);
  };

  const pageLabel = displayMode === "spread" && page > 1 && page + 1 <= pageCount
    ? `${page}–${page + 1}`
    : String(page);
  const displayedSearchResults = searchResults.slice(0, 60);

  return (
    <section className="pdf-book-reader" aria-label={`Đọc ${title}`}>
      <div className="pdf-reader-toolbar">
        <div className="pdf-page-controls" aria-label="Điều hướng trang">
          <button type="button" className="pdf-tool-button" onClick={previousPage} disabled={!canGoBack} aria-label="Trang trước"><Icon name="arrow-left" size={17} /></button>
          <label className="pdf-page-input">
            <span>Trang</span>
            <input type="number" min={1} max={pageCount || 1} value={page} onChange={(event) => goToPage(Number(event.target.value))} disabled={!document} />
            <small>/ {pageCount || "—"}</small>
          </label>
          <button type="button" className="pdf-tool-button" onClick={nextPage} disabled={!canGoForward} aria-label="Trang sau"><Icon name="arrow-right" size={17} /></button>
        </div>

        <div className="pdf-view-controls" aria-label="Chế độ đọc">
          <div className="pdf-mode-switch">
            <button type="button" className={displayMode === "spread" ? "active" : ""} onClick={() => setMode("spread")} aria-pressed={displayMode === "spread"} disabled={compact}><Icon name="book" size={16} />Sách đôi</button>
            <button type="button" className={displayMode === "single" ? "active" : ""} onClick={() => setMode("single")} aria-pressed={displayMode === "single"}><Icon name="file" size={15} />1 trang</button>
          </div>
          <div className="pdf-zoom-controls">
            <button type="button" onClick={() => setZoom((value) => Math.max(.75, Number((value - .15).toFixed(2))))} disabled={zoom <= .75} aria-label="Thu nhỏ">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.6, Number((value + .15).toFixed(2))))} disabled={zoom >= 1.6} aria-label="Phóng to">+</button>
          </div>
        </div>

        <form className="pdf-text-search" onSubmit={runSearch} role="search">
          <Icon name="search" size={17} />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm từ trong PDF…" aria-label="Tìm từ trong PDF" />
          {searchQuery && <button type="button" className="pdf-search-clear" onClick={clearSearch} aria-label="Xóa tìm kiếm"><Icon name="x" size={14} /></button>}
          <button type="submit" className="pdf-search-submit" disabled={!document || !searchQuery.trim() || searching}>{searching ? "Đang tìm" : "Tìm"}</button>
        </form>
      </div>

      {searchedQuery && (
        <div className="pdf-search-results" aria-live="polite">
          <div className="pdf-search-summary">
            <Icon name="search" size={16} />
            <strong>{searching ? `Đang tìm “${searchedQuery}”` : `${searchResults.length} trang có “${searchedQuery}”`}</strong>
            {searching && <span>{searchProgress}/{pageCount}</span>}
          </div>
          <div className="pdf-search-hits">
            {displayedSearchResults.map((result) => (
              <button type="button" key={result.page} className={visiblePages.includes(result.page) ? "active" : ""} onClick={() => goToPage(result.page)}>
                <strong>Trang {result.page}</strong>
                <span>{result.excerpt || "Có từ khóa trên trang này"}</span>
              </button>
            ))}
            {!searching && searchResults.length > displayedSearchResults.length && <p className="pdf-search-more">Hiển thị 60 kết quả đầu · thử cụm từ cụ thể hơn để thu hẹp.</p>}
            {!searching && searchResults.length === 0 && <p>Không tìm thấy từ này trong phần văn bản của PDF.</p>}
          </div>
        </div>
      )}

      <div
        className={`pdf-book-stage mode-${displayMode}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") previousPage();
          if (event.key === "ArrowRight") nextPage();
        }}
      >
        {!document && !loadError && (
          <div className="pdf-reader-loading">
            <span className="pdf-reader-loading-book"><i /><i /></span>
            <strong>Đang mở sách…</strong>
            <small>Chuẩn bị trang và mục tìm kiếm</small>
          </div>
        )}

        {loadError && (
          <div className="pdf-reader-error">
            <span><Icon name="file" size={30} /></span>
            <strong>PDF chưa mở được</strong>
            <p>{loadError}</p>
            <a className="button primary small" href={url} target="_blank" rel="noreferrer">Mở PDF gốc <Icon name="external-link" size={15} /></a>
          </div>
        )}

        {document && (
          <div
            className={`pdf-book-spread ${page === 1 && displayMode === "spread" ? "cover-spread" : ""}`}
            style={{ width: `${zoom * 100}%`, maxWidth: `${(displayMode === "spread" ? 1160 : 660) * zoom}px` }}
          >
            {visiblePages.map((pageNumber, index) => pageNumber ? (
              <PdfCanvasPage key={pageNumber} document={document} pageNumber={pageNumber} zoom={1} />
            ) : (
              <div key={`blank-${index}`} className="pdf-book-page blank-page" aria-hidden="true">
                <span><Icon name="bookmark" size={20} />{title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="pdf-reader-footer">
        <span><Icon name="book" size={15} />{displayMode === "spread" ? "Đang mở như một cuốn sách" : "Chế độ đọc một trang"}</span>
        <strong>Trang {pageLabel} / {pageCount || "—"}</strong>
        <span>Dùng phím ← → để lật trang</span>
      </footer>
    </section>
  );
}
