import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { Book, Chapter, Page } from "./types";
import { makePage } from "./text";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Line {
  text: string;
  y: number;
  size: number;
  relY: number; // 0 = arriba de la página, 1 = abajo
}

interface RawPage {
  lines: Line[];
  removed: string[];
}

const PAGE_NUM_RE =
  /^\s*(p[áa]g\.?|p[aá]gina|page|pag\.?)?\s*([ivxlcdm]+|\d{1,5})\s*\.?\s*$/i;

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function isPageNumber(text: string): boolean {
  const t = text.trim();
  if (t.length > 14) return false;
  return PAGE_NUM_RE.test(t) || /^\s*[–—-]?\s*\d{1,4}\s*[–—-]?\s*$/.test(t);
}

type TcItem = { str?: string; transform?: number[]; height?: number; width?: number };

/** Agrupa los fragmentos de texto por línea según su coordenada Y. */
async function extractRawPage(page: pdfjsLib.PDFPageProxy): Promise<Line[]> {
  const tc = await page.getTextContent();
  type Piece = { str: string; x: number; y: number; w: number; h: number };
  const withY: Piece[] = [];
  for (const it of tc.items as TcItem[]) {
    if (typeof it.str !== "string" || !it.str.trim() || !it.transform) continue;
    const h = it.height || Math.abs(it.transform[3]) || 10;
    withY.push({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      w: it.width || it.str.length * h * 0.55,
      h,
    });
  }
  withY.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: Line[] = [];
  let cur: { parts: Piece[]; y: number; size: number } | null = null;
  const flush = () => {
    if (!cur) return;
    cur.parts.sort((a, b) => a.x - b.x);
    let text = "";
    for (let i = 0; i < cur.parts.length; i++) {
      const p = cur.parts[i];
      if (i > 0) {
        const prev = cur.parts[i - 1];
        if (p.x - (prev.x + prev.w) > Math.max(1.5, cur.size * 0.16)) text += " ";
      }
      text += p.str;
    }
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean) lines.push({ text: clean, y: cur.y, size: cur.size, relY: 0 });
    cur = null;
  };
  for (const it of withY) {
    if (cur && Math.abs(cur.y - it.y) <= Math.max(2.5, it.h * 0.45)) {
      cur.parts.push(it);
      cur.size = Math.max(cur.size, it.h);
    } else {
      flush();
      cur = { parts: [it], y: it.y, size: it.h };
    }
  }
  flush();
  return lines;
}

/**
 * Limpieza global: números de página, encabezados/pies repetidos en todo el
 * documento y bloques de notas al pie (fuente menor al final de la página).
 */
function cleanPages(raw: Line[][]): RawPage[] {
  const pages: RawPage[] = raw.map((lines) => ({ lines, removed: [] }));

  const sizes = pages.flatMap((p) => p.lines.map((l) => l.size)).sort((a, b) => a - b);
  const bodySize = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 10;
  const smallTh = bodySize * 0.82;

  for (const p of pages) {
    if (!p.lines.length) continue;
    const top = Math.max(...p.lines.map((l) => l.y));
    const bottom = Math.min(...p.lines.map((l) => l.y));
    const span = Math.max(1, top - bottom);
    for (const l of p.lines) l.relY = (top - l.y) / span;
  }

  const freq = new Map<string, number>();
  for (const p of pages)
    for (const l of p.lines)
      if (l.text.length <= 90) {
        const k = norm(l.text);
        freq.set(k, (freq.get(k) ?? 0) + 1);
      }
  const repeatedTh = Math.max(3, Math.ceil(pages.length * 0.45));

  for (const p of pages) {
    if (!p.lines.length) continue;
    const removed: string[] = [];

    // bloque final de notas al pie: líneas con fuente menor (o formato "1. nota")
    let cut = p.lines.length;
    while (cut > 0) {
      const l = p.lines[cut - 1];
      const looksSmall = l.size < smallTh && l.text.length < 220;
      const looksNote =
        /^(?:\d{1,2}|[ivx]+)[\.\)]\s/.test(l.text) && l.relY > 0.72 && l.size <= bodySize;
      const looksRule = /^[_\-–—.=\s]{6,}$/.test(l.text);
      if (looksSmall || looksNote || looksRule) cut--;
      else break;
    }
    if (cut === 0) cut = p.lines.length;

    const keep: Line[] = [];
    for (let i = 0; i < p.lines.length; i++) {
      const l = p.lines[i];
      const n = norm(l.text);
      const isRepeated =
        l.text.length <= 90 && (freq.get(n) ?? 0) >= repeatedTh && pages.length >= 4;
      const isNum = isPageNumber(l.text) && (l.relY < 0.14 || l.relY > 0.84);
      const inFootBlock = i >= cut;
      const isHeaderSmall = l.text.length <= 70 && l.size < smallTh && l.relY < 0.1;
      if (isRepeated || isNum || inFootBlock || isHeaderSmall) removed.push(l.text);
      else keep.push(l);
    }

    // notas huérfanas sueltas en la zona baja
    const keep2: Line[] = [];
    for (const l of keep) {
      const orphan =
        l.relY > 0.6 && l.size < smallTh && /^(?:\d{1,2}[\.\)]|[*•])\s?/.test(l.text);
      if (orphan) removed.push(l.text);
      else keep2.push(l);
    }

    p.lines = keep2;
    p.removed = removed;
  }

  return pages;
}

/** Une líneas en párrafos: fusión de guiones de corte y detección de títulos. */
function linesToParagraphs(lines: Line[]): { text: string; heading?: boolean }[] {
  const sizes = lines.map((l) => l.size).sort((a, b) => a - b);
  const bodySize = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 10;
  const paras: { text: string; heading?: boolean }[] = [];
  let buf = "";
  const flush = (heading?: boolean) => {
    const t = buf.replace(/\s+/g, " ").trim();
    if (t) paras.push({ text: t, heading });
    buf = "";
  };
  lines.forEach((l, i) => {
    const next = lines[i + 1];
    if (l.size >= bodySize * 1.22 && l.text.length < 110) {
      flush();
      buf = l.text;
      flush(true);
      return;
    }
    if (buf && buf.endsWith("-")) buf = buf.slice(0, -1) + l.text;
    else if (buf) buf += " " + l.text;
    else buf = l.text;

    const endsSentence = /[.!?…:»"”)\]]$/.test(l.text.trim());
    const nextStartsUpper = next ? /^[A-ZÁÉÍÓÚÑÜ¿¡"“«(\d]/.test(next.text) : true;
    if (endsSentence && nextStartsUpper) flush();
  });
  flush();
  return paras;
}

export async function extractPdf(
  file: File,
  onProgress?: (frac: number) => void
): Promise<Book> {
  const data = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data });
  const doc = await task.promise;
  const rawPages: Line[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    rawPages.push(await extractRawPage(page));
    onProgress?.(i / doc.numPages);
  }
  try {
    await task.destroy();
  } catch {
    /* sin importancia */
  }

  const cleaned = cleanPages(rawPages);
  const pages: Page[] = cleaned.map((p) => makePage(linesToParagraphs(p.lines), 0, p.removed));
  const removedCount = pages.reduce((a, p) => a + p.removed.length, 0);
  const totalWords = pages.reduce((a, p) => a + p.words, 0);
  const chapter: Chapter = {
    title: file.name.replace(/\.pdf$/i, ""),
    startPage: 0,
    endPage: Math.max(0, pages.length - 1),
  };
  return {
    title: file.name.replace(/\.pdf$/i, ""),
    source: "pdf",
    fileName: file.name,
    pages,
    chapters: [chapter],
    removedCount,
    totalWords,
  };
}
