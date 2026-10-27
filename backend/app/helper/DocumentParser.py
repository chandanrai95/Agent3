import asyncio
import base64
import csv
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import pymupdf as fitz
from docx import Document as DocxDocument
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openpyxl import load_workbook

from app.config.setting import VISION_MODEL, MAX_IMAGES_PER_DOCUMENT

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx"} | IMAGE_EXTENSIONS

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
# chunks shorter than this (page numbers, stray labels) carry no meaning on their own
MIN_CHUNK_CHARS = 25
TABLE_CHUNK_SIZE = 1500
# a page with less text than this is treated as scanned and read with the vision model
SCANNED_PAGE_MIN_CHARS = 50
# skip icons, bullets and logos
MIN_IMAGE_SIDE = 120
VISION_CONCURRENCY = 4
NO_CONTENT = "NO_CONTENT"

IMAGE_PROMPT = f"""You are indexing an image from a document for a search engine.
- Transcribe all visible text verbatim.
- If it contains a table, render it as a GitHub markdown table.
- For charts, state the chart type, axes, and the key values and trends.
- For diagrams or photos, describe the components and what they show.
Be factual and concise. If the image is purely decorative (logo, icon, divider) reply exactly {NO_CONTENT}."""

SCANNED_PAGE_PROMPT = f"""This is a scanned document page. Transcribe its content for a search index.
- Transcribe all text verbatim in reading order, write headings as markdown headings (#, ##).
- Render every table as a GitHub markdown table.
- Describe charts, photos, stamps or signatures briefly as [Figure: ...].
Output only the page content. If the page is blank reply exactly {NO_CONTENT}."""

MIME_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif"}


@dataclass
class ImageJob:
    data: bytes
    mime: str
    content_type: str  # "image" or "scanned_page"
    metadata: dict = field(default_factory=dict)


@dataclass
class ParsedDocument:
    # markdown segments, tables are inline markdown tables
    segments: list[Document] = field(default_factory=list)
    images: list[ImageJob] = field(default_factory=list)
    skipped_images: int = 0

    def add_image(self, job: ImageJob):
        if len(self.images) >= MAX_IMAGES_PER_DOCUMENT:
            self.skipped_images += 1
            return
        self.images.append(job)


# -----------------------------
# MARKDOWN HELPERS
# -----------------------------
def _cell(value) -> str:
    return "" if value is None else str(value).replace("|", "\\|").replace("\n", " ").strip()


def rows_to_markdown(rows: list[list]) -> str:
    rows = [r for r in rows if any(_cell(c) for c in r)]
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    rows = [[_cell(c) for c in r] + [""] * (width - len(r)) for r in rows]
    lines = ["| " + " | ".join(rows[0]) + " |", "|" + " --- |" * width]
    lines += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return "\n".join(lines)


# -----------------------------
# PARSERS (sync, run in a thread)
# -----------------------------
def _pixmap_png(doc: fitz.Document, xref: int) -> Optional[bytes]:
    pix = fitz.Pixmap(doc, xref)
    if pix.width < MIN_IMAGE_SIDE or pix.height < MIN_IMAGE_SIDE:
        return None
    if pix.n - pix.alpha >= 4:  # CMYK -> RGB
        pix = fitz.Pixmap(fitz.csRGB, pix)
    return pix.tobytes("png")


def _is_bold(span: dict) -> bool:
    return bool(span["flags"] & 16) or "bold" in span["font"].lower()


def _text_blocks(page: fitz.Page, clip=None, hidden: bool = False) -> list[tuple[fitz.Rect, str, dict]]:
    """(rect, text, style) for visible text blocks (or only the invisible OCR layer when hidden=True),
    without fake-bold duplicates (same span drawn twice with a small offset)."""
    blocks, kept = [], []
    for block in page.get_text("dict", clip=clip, sort=True)["blocks"]:
        if block["type"] != 0:
            continue
        lines, spans_kept = [], []
        for line in block["lines"]:
            spans = []
            for span in line["spans"]:
                # alpha 0 = invisible text, usually an OCR layer drawn over the page
                if (span.get("alpha", 255) == 0) != hidden or not span["text"].strip():
                    continue
                x, y = span["bbox"][:2]
                if any(t == span["text"] and abs(x - kx) < 3 and abs(y - ky) < 3 for t, kx, ky in kept):
                    continue
                kept.append((span["text"], x, y))
                spans.append(span)
            if spans:
                lines.append("".join(sp["text"] for sp in spans).strip())
                spans_kept += spans
        if not lines:
            continue
        style = {
            "size": round(max(sp["size"] for sp in spans_kept)),
            "bold": all(_is_bold(sp) for sp in spans_kept),
            "lines": len(lines),
        }
        rect, text = fitz.Rect(block["bbox"]), "\n".join(lines)
        # "2.1.15." and its title are often separate blocks, join them
        if blocks and _SECTION_NUMBER_ONLY.match(blocks[-1][1]) and len(text) < 150:
            prev_rect, prev_text, prev_style = blocks.pop()
            rect, text = prev_rect | rect, f"{prev_text} {text}"
            style = {**style, "size": max(style["size"], prev_style["size"]), "lines": style["lines"]}
        blocks.append((rect, text, style))
    return blocks


_SECTION_NUMBER_ONLY = re.compile(r"^\d+(\.\d+)*\.?$")
_SECTION_NUMBER = re.compile(r"^(\d+(?:\.\d+)*)\.?\s+\S")
_TOC_LEADER = re.compile(r"\.{4,}|…{2,}")


def _heading_levels(page_blocks: list[list]) -> dict:
    """Assigns markdown heading levels using font sizes ranked across the whole document
    (per page ranking gives every page its own "level 1")."""
    size_chars: dict = {}
    for blocks in page_blocks:
        for _, text, style in blocks:
            size_chars[style["size"]] = size_chars.get(style["size"], 0) + len(text)
    if not size_chars:
        return {}
    body = max(size_chars, key=size_chars.get)

    def candidate(text, style):
        return (style["lines"] <= 2 and len(text) < 150 and re.search(r"[A-Za-z]", text)
                and not text.rstrip().endswith((".", ",", ";")) and not _TOC_LEADER.search(text))

    heading_sizes = sorted({st["size"] for blocks in page_blocks for _, t, st in blocks
                            if candidate(t, st) and st["size"] >= body * 1.15}, reverse=True)
    rank = {size: min(i + 1, 3) for i, size in enumerate(heading_sizes)}

    levels = {}
    for p, blocks in enumerate(page_blocks):
        for b, (_, text, style) in enumerate(blocks):
            if not candidate(text, style):
                continue
            numbered = _SECTION_NUMBER.match(text)
            if numbered and (style["bold"] or style["size"] > body):
                # numbered sections nest below the font-size ranked headings (levels 1-3)
                levels[(p, b)] = min(3 + numbered.group(1).count(".") + 1, 6)
            elif style["size"] in rank:
                levels[(p, b)] = rank[style["size"]]
            elif style["bold"] and len(blocks) > 1:
                levels[(p, b)] = 3
    return levels


def _extract_table(page: fitz.Page, table, hidden: bool = False) -> list[list[str]]:
    # table.extract() duplicates glyphs of fake-bold text ("TTaabbllee"), read cells as deduped text
    return [
        [" ".join(t for _, t, _ in _text_blocks(page, clip=cell, hidden=hidden)) if cell else "" for cell in row.cells]
        for row in table.rows
    ]


def _char_count(blocks: list) -> int:
    return sum(len(t.strip()) for _, t, _ in blocks)


_CAPTION = re.compile(r"^(table|tab\.|exhibit|schedule|annex\w*|appendix|figure|fig\.)\b", re.IGNORECASE)


def caption_or_none(text: Optional[str]) -> Optional[str]:
    """Keeps a line only when it reads like a table caption ("Table 3: Fees", "Fee schedule:")."""
    text = (text or "").replace("\n", " ").strip().lstrip("#").strip()
    if text and len(text) <= 150 and (_CAPTION.match(text) or text.endswith(":")):
        return text
    return None


def _table_caption(blocks: list, table_rect: fitz.Rect) -> Optional[str]:
    above = [(rect, t) for rect, t, _ in blocks if rect.y1 <= table_rect.y0 + 2 and table_rect.y0 - rect.y1 < 60]
    return caption_or_none(max(above, key=lambda b: b[0].y1)[1]) if above else None


_PAGE_NUMBER = re.compile(r"^(page\s*)?\d+(\s*(of|/)\s*\d+)?$", re.IGNORECASE)


def _running_key(text: str) -> str:
    # "170 THE CONSTITUTION OF INDIA" and "THE CONSTITUTION OF INDIA 171" are the same running header
    return re.sub(r"\s+", " ", re.sub(r"\d+", "", text)).strip().lower()


def _drop_running_blocks(page_blocks: list[list]) -> list[list]:
    """Removes page numbers and headers/footers repeated on many pages, they pollute every chunk."""
    counts: dict = {}
    for blocks in page_blocks:
        for key in {_running_key(t) for _, t, _ in blocks if len(t) < 120}:
            counts[key] = counts.get(key, 0) + 1
    threshold = max(3, len(page_blocks) * 0.5)
    running = {k for k, c in counts.items() if c >= threshold} if len(page_blocks) >= 3 else set()
    return [
        [b for b in blocks if _running_key(b[1]) not in running and not _PAGE_NUMBER.match(b[1].strip())]
        for blocks in page_blocks
    ]


def parse_pdf(file_path: Path) -> ParsedDocument:
    parsed = ParsedDocument()
    seen_xrefs = set()
    # (segment, blocks) filled in after all pages are read, heading levels need the whole document
    text_pages = []

    with fitz.open(file_path) as doc:
        for page in doc:
            page_no = page.number + 1
            meta = {"page": page_no}

            blocks = _text_blocks(page)
            hidden = False
            if _char_count(blocks) < SCANNED_PAGE_MIN_CHARS:
                # no visible text: use an existing OCR layer if there is one, else read the page with vision
                ocr_blocks = _text_blocks(page, hidden=True)
                if _char_count(ocr_blocks) >= SCANNED_PAGE_MIN_CHARS:
                    blocks, hidden = ocr_blocks, True
                else:
                    if page.get_images() or page.get_drawings():
                        pix = page.get_pixmap(dpi=150)
                        parsed.add_image(ImageJob(pix.tobytes("png"), "image/png", "scanned_page", meta))
                    continue

            # the default table finder needs ruling lines, skip the slow search on pages without any
            tables = page.find_tables().tables if page.get_drawings() else []
            table_rows = [_extract_table(page, t, hidden) for t in tables]
            # one column "tables" are boxed text or a table of contents, keep them as text
            tables = [t for t, rows in zip(tables, table_rows) if max((len(r) for r in rows), default=0) > 1]
            table_rows = [rows for rows in table_rows if max((len(r) for r in rows), default=0) > 1]
            table_rects = [fitz.Rect(t.bbox) for t in tables]

            # text blocks outside tables so table cells aren't indexed twice as broken prose
            outside = [b for b in blocks if not any(b[0].intersects(r) for r in table_rects)]
            if outside:
                segment = Document(page_content="", metadata={**meta, "content_type": "text"})
                parsed.segments.append(segment)
                text_pages.append((segment, outside))

            for rect, rows in zip(table_rects, table_rows):
                markdown = rows_to_markdown(rows)
                if markdown:
                    parsed.segments.append(Document(page_content=markdown, metadata={
                        **meta, "content_type": "table", "caption": _table_caption(blocks, rect)}))

            for img in page.get_images(full=True):
                xref = img[0]
                if xref in seen_xrefs:  # logos repeated on every page
                    continue
                seen_xrefs.add(xref)
                try:
                    png = _pixmap_png(doc, xref)
                except Exception:
                    continue
                if png:
                    parsed.add_image(ImageJob(png, "image/png", "image", meta))

        page_blocks = _drop_running_blocks([blocks for _, blocks in text_pages])
        levels = _heading_levels(page_blocks)
        for p, ((segment, _), blocks) in enumerate(zip(text_pages, page_blocks)):
            segment.page_content = "\n".join(
                ("#" * levels[(p, b)] + " " + text.replace("\n", " ") if (p, b) in levels else text)
                for b, (_, text, _) in enumerate(blocks)
            )
        parsed.segments = [seg for seg in parsed.segments if seg.page_content.strip()]

    return parsed


def parse_docx(file_path: Path) -> ParsedDocument:
    parsed = ParsedDocument()
    doc = DocxDocument(str(file_path))

    # walk the body in order so tables stay next to the text that introduces them
    parts = []
    for child in doc.element.body.iterchildren():
        tag = child.tag.split("}")[-1]
        if tag == "p":
            p = DocxParagraph(child, doc)
            if p.text.strip():
                style = (p.style.name or "") if p.style is not None else ""
                level = re.match(r"Heading (\d)", style)
                parts.append(("#" * int(level.group(1)) + " " if level else "") + p.text.strip())
        elif tag == "tbl":
            table = DocxTable(child, doc)
            parts.append(rows_to_markdown([[c.text for c in row.cells] for row in table.rows]))
    if parts:
        parsed.segments.append(Document(page_content="\n\n".join(parts), metadata={"content_type": "text"}))

    for rel in doc.part.rels.values():
        if "image" not in rel.reltype:
            continue
        part = rel.target_part
        if part.content_type in MIME_TYPES.values():
            parsed.add_image(ImageJob(part.blob, part.content_type, "image"))

    return parsed


def parse_xlsx(file_path: Path) -> ParsedDocument:
    parsed = ParsedDocument()
    workbook = load_workbook(file_path, read_only=True, data_only=True)
    for sheet in workbook.worksheets:
        markdown = rows_to_markdown([list(r) for r in sheet.iter_rows(values_only=True)])
        if markdown:
            parsed.segments.append(Document(page_content=markdown, metadata={"sheet": sheet.title, "content_type": "table"}))
    workbook.close()
    return parsed


def _read_text(file_path: Path) -> str:
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return file_path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return file_path.read_text(errors="ignore")


def parse_csv(file_path: Path) -> ParsedDocument:
    rows = list(csv.reader(_read_text(file_path).splitlines()))
    markdown = rows_to_markdown(rows)
    segments = [Document(page_content=markdown, metadata={"content_type": "table"})] if markdown else []
    return ParsedDocument(segments=segments)


def parse_text(file_path: Path) -> ParsedDocument:
    text = _read_text(file_path).strip()
    return ParsedDocument(segments=[Document(page_content=text, metadata={"content_type": "text"})] if text else [])


def parse_image(file_path: Path) -> ParsedDocument:
    parsed = ParsedDocument()
    parsed.add_image(ImageJob(file_path.read_bytes(), MIME_TYPES[file_path.suffix.lower()], "image"))
    return parsed


PARSERS = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".xlsx": parse_xlsx,
    ".csv": parse_csv,
    ".txt": parse_text,
    ".md": parse_text,
    **{ext: parse_image for ext in IMAGE_EXTENSIONS},
}


def parse_file(file_path: Path) -> ParsedDocument:
    ext = file_path.suffix.lower()
    if ext not in PARSERS:
        raise ValueError(f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
    return PARSERS[ext](file_path)


# -----------------------------
# VISION (images, scanned pages)
# -----------------------------
async def describe_images(jobs: list[ImageJob]) -> tuple[list[Document], int]:
    """Turns images into searchable markdown. Returns (segments, failed_count)."""
    if not jobs:
        return [], 0

    llm = ChatOpenAI(model=VISION_MODEL, temperature=0)
    semaphore = asyncio.Semaphore(VISION_CONCURRENCY)

    async def describe(job: ImageJob) -> Optional[Document]:
        prompt = SCANNED_PAGE_PROMPT if job.content_type == "scanned_page" else IMAGE_PROMPT
        image_url = f"data:{job.mime};base64,{base64.b64encode(job.data).decode()}"
        async with semaphore:
            response = await llm.ainvoke([HumanMessage(content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ])])
        content = (response.content or "").strip()
        if not content or content == NO_CONTENT:
            return None
        return Document(page_content=content, metadata={**job.metadata, "content_type": job.content_type})

    results = await asyncio.gather(*(describe(j) for j in jobs), return_exceptions=True)
    failed = [r for r in results if isinstance(r, Exception)]
    for e in failed:
        print(f"WARNING: image description failed: {e}")
    return [r for r in results if isinstance(r, Document)], len(failed)


# -----------------------------
# CHUNKING
# -----------------------------
_text_splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
_TABLE_LINE = re.compile(r"^\s*\|.*\|\s*$")
_HEADING_LINE = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$")
CONTENT_LABELS = {"table": "Table", "image": "Image description", "scanned_page": "Scanned page transcription"}


class _SectionTracker:
    """Keeps the heading path ("Fees > Late payment") while walking a document in order."""

    def __init__(self):
        self.path: list[tuple[int, str, Optional[str]]] = []

    def update(self, level: int, title: str):
        title = re.sub(r"\s+", " ", title).strip()
        number = _SECTION_NUMBER.match(title)
        number = number.group(1) if number else None
        while self.path and (
            self.path[-1][0] >= level
            # "2.1.19" belongs under "2.1", never under "1.4"
            or (number and self.path[-1][2] and not number.startswith(self.path[-1][2] + "."))
        ):
            self.path.pop()
        self.path.append((level, title[:80], number))

    @property
    def section(self) -> Optional[str]:
        # only the nearest heading: levels guessed from pdf fonts make longer breadcrumbs unreliable
        return self.path[-1][1] if self.path else None


def _split_blocks(text: str, sections: _SectionTracker) -> list[tuple[str, str, Optional[str]]]:
    """Splits markdown into (kind, content, section) blocks, kind is "text" or "table"."""
    blocks, current, current_kind = [], [], None

    def flush():
        if current and "\n".join(current).strip():
            blocks.append((current_kind, "\n".join(current), sections.section))
        current.clear()

    for line in text.splitlines():
        heading = _HEADING_LINE.match(line)
        if heading:
            flush()
            sections.update(len(heading.group(1)), heading.group(2))
            continue
        kind = "table" if _TABLE_LINE.match(line) else "text"
        if kind != current_kind:
            flush()
        current_kind = kind
        current.append(line)
    flush()
    return blocks


def split_table(markdown: str) -> list[str]:
    """Row-group chunks that each repeat the header, so every chunk stays a readable table."""
    lines = markdown.splitlines()
    if len(lines) <= 2:
        return [markdown]
    header, rows = lines[:2], lines[2:]
    chunks, current = [], []
    for row in rows:
        if current and len("\n".join(header + current + [row])) > TABLE_CHUNK_SIZE:
            chunks.append("\n".join(header + current))
            current = []
        current.append(row)
    chunks.append("\n".join(header + current))
    return chunks


def chunk_header(source_name: str, metadata: dict) -> str:
    """Context line embedded with every chunk, so a chunk is findable and understandable on its own."""
    parts = [f"Document: {source_name}"]
    if metadata.get("section"):
        parts.append(f"Section: {metadata['section']}")
    if metadata.get("page"):
        parts.append(f"Page {metadata['page']}")
    if metadata.get("sheet"):
        parts.append(f"Sheet: {metadata['sheet']}")
    label = CONTENT_LABELS.get(metadata.get("content_type"))
    if label:
        parts.append(label + (f": {metadata['caption']}" if metadata.get("caption") else ""))
    return "[" + " | ".join(parts) + "]\n"


def chunk_segments(segments: list[Document], source_name: str) -> list[Document]:
    # images are described after parsing, put them back next to the page they came from
    segments = sorted(segments, key=lambda s: s.metadata.get("page") or 0)
    sections = _SectionTracker()
    chunks = []

    for segment in segments:
        segment_type = segment.metadata.get("content_type", "text")
        previous_text = None
        for kind, block, section in _split_blocks(segment.page_content, sections):
            metadata = {**segment.metadata, "section": section,
                        "content_type": "table" if kind == "table" else segment_type}
            if kind == "table":
                # caption from the pdf layout, else the line right before the table
                metadata["caption"] = segment.metadata.get("caption") or (
                    caption_or_none(previous_text.strip().splitlines()[-1]) if previous_text else None)
                pieces = split_table(block)
            else:
                metadata.pop("caption", None)
                previous_text = block
                pieces = [p for p in _text_splitter.split_text(block) if len(p.strip()) >= MIN_CHUNK_CHARS]

            header = chunk_header(source_name, metadata)
            chunks += [Document(page_content=header + p, metadata=metadata) for p in pieces]
    return chunks
