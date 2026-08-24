import type { Page, Paragraph } from "./types";

/** Limpieza inline: referencias de nota [12], superíndices, marcas †‡§¶, etc. */
export function scrubInline(s: string): string {
  return s
    .replace(/\[\d{1,3}\]/g, " ")
    .replace(/\(\d{1,3}\)(?=\s|$)/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, "")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, "")
    .replace(/[†‡§¶]/g, "")
    .replace(/\u00ad/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const ABBR =
  /\b(sr|sra|srta|dr|dra|ud|uds|etc|pág|págs|cap|vol|núm|nº|no|aprox|ej|vs|d|inc)\s*\.\s*$/i;

/** Divide un texto en oraciones (con soporte para ¿¡ y abreviaturas comunes). */
export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts =
    cleaned.match(/[^.!?…]+[.!?…]+[»"”’)\]]*\s*|[^.!?…]+$/g) ?? [cleaned];
  const out: string[] = [];
  for (const raw of parts) {
    const t = raw.trim();
    if (!t) continue;
    if (out.length && (ABBR.test(out[out.length - 1]) || t.length === 1)) {
      out[out.length - 1] += " " + t;
    } else {
      out.push(t);
    }
  }
  return out.length ? out : [cleaned];
}

export function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

let pageSeq = 0;

/** Convierte una lista de párrafos en una Page con oraciones indexadas. */
export function makePage(
  rawParagraphs: { text: string; heading?: boolean }[],
  chapterIndex: number,
  removed: string[] = []
): Page {
  const paragraphs: Paragraph[] = [];
  const sentences: string[] = [];
  let words = 0;
  for (const p of rawParagraphs) {
    const text = scrubInline(p.text);
    if (!text) continue;
    const s = splitSentences(text);
    paragraphs.push({ text, heading: p.heading, s0: sentences.length, s1: sentences.length + s.length });
    sentences.push(...s);
    words += countWords(text);
  }
  pageSeq += 1;
  return {
    id: `pg-${pageSeq}`,
    chapterIndex,
    paragraphs,
    sentences,
    removed,
    words,
  };
}

export interface SimpleChapter {
  title: string;
  paragraphs: { text: string; heading?: boolean }[];
}

const PAGE_CHARS = 1250;

/** Paginación fluida para EPUB/TXT: corta por párrafos buscando ~PAGE_CHARS caracteres. */
export function paginateChapter(
  chapter: SimpleChapter,
  chapterIndex: number,
  removed: string[] = []
): Page[] {
  const paras = chapter.paragraphs.filter((p) => p.text.trim().length > 0);
  if (paras.length === 0) return [];
  const pages: Page[] = [];
  let bucket: { text: string; heading?: boolean }[] = [];
  let len = 0;
  const flush = () => {
    if (bucket.length) {
      pages.push(makePage(bucket, chapterIndex, removed));
      bucket = [];
      len = 0;
    }
  };
  for (const p of paras) {
    // un encabezado empieza página nueva si ya hay contenido
    if (p.heading && bucket.length) flush();
    bucket.push(p);
    len += p.text.length;
    if (len >= PAGE_CHARS && !p.heading) flush();
  }
  flush();
  return pages;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h} h ${String(m % 60).padStart(2, "0")} min`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}
