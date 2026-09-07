#!/usr/bin/env python3
"""Create compact, web-friendly PDF copies while preserving page order."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import sys
import tempfile

import pymupdf
import pikepdf


def optimize_pdf(source: Path, destination: Path, *, dpi: int, quality: int) -> tuple[int, int, int]:
    source_size = source.stat().st_size
    destination.parent.mkdir(parents=True, exist_ok=True)

    with pymupdf.open(source) as document:
        page_count = document.page_count
        if document.needs_pass:
            raise RuntimeError("PDF được bảo vệ bằng mật khẩu")

        document.rewrite_images(
            dpi_threshold=dpi + 25,
            dpi_target=dpi,
            quality=quality,
            lossy=True,
            lossless=True,
            bitonal=True,
            color=True,
            gray=True,
        )

        with tempfile.NamedTemporaryFile(
            prefix=f".{destination.stem}-",
            suffix=".pdf",
            dir=destination.parent,
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
        rewrite_path = temporary_path.with_suffix(".rewrite.pdf")

        try:
            document.save(
                rewrite_path,
                garbage=3,
                clean=False,
                deflate=True,
                deflate_images=True,
                deflate_fonts=True,
                use_objstms=1,
                no_new_id=True,
                compression_effort=100,
            )

            with pikepdf.open(rewrite_path) as compact:
                compact.save(
                    temporary_path,
                    linearize=True,
                    compress_streams=True,
                    recompress_flate=True,
                    object_stream_mode=pikepdf.ObjectStreamMode.generate,
                )

            with pymupdf.open(temporary_path) as check:
                if check.page_count != page_count:
                    raise RuntimeError(f"số trang thay đổi: {page_count} → {check.page_count}")
                if check.page_count and check[0].rect.is_empty:
                    raise RuntimeError("trang đầu tiên không hợp lệ")

            optimized_size = temporary_path.stat().st_size
            if optimized_size >= source_size:
                shutil.copy2(source, destination)
                final_size = source_size
            else:
                os.replace(temporary_path, destination)
                final_size = optimized_size
        finally:
            temporary_path.unlink(missing_ok=True)
            rewrite_path.unlink(missing_ok=True)

    return page_count, source_size, final_size


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("sources", nargs="+", type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--dpi", type=int, default=150)
    parser.add_argument("--quality", type=int, default=76)
    args = parser.parse_args()

    if args.in_place == bool(args.output_dir):
        parser.error("chọn đúng một trong --in-place hoặc --output-dir")

    failed = False
    for source in args.sources:
        if not source.is_file():
            print(f"SKIP {source}: không tìm thấy", file=sys.stderr)
            failed = True
            continue

        destination = source if args.in_place else args.output_dir / source.name
        try:
            page_count, before, after = optimize_pdf(
                source,
                destination,
                dpi=args.dpi,
                quality=args.quality,
            )
            saving = (1 - after / before) * 100 if before else 0
            print(
                f"OK {source.name}: {page_count} trang · "
                f"{before / 1_048_576:.1f} → {after / 1_048_576:.1f} MiB "
                f"({saving:.1f}% nhẹ hơn)"
            )
        except Exception as error:  # noqa: BLE001
            print(f"ERROR {source}: {error}", file=sys.stderr)
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
