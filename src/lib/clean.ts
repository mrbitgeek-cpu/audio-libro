import type {
  FilterOpts,
  FilterStats,
  PageBlock,
  RawLine,
} from "./types";

/* ---------- detección de números de página ---------- */
const PAGE_NUM_RES = [
  /^[\s\-–—•·|]*\d{1,4}(\s*(de|\/|—|–|-)\s*\d{1,4})?[\s\-–—•·|]*$/,
  /^[\s\-–—•·|]*p(á|a)g(ina)?\.?\s*\d{1,4}(\s*de\s*\d{1,4})?[\s\-–—•·|]*$/i,
  /^[\s\-–—•·|]*[ivxlcdm]{2,7}[\s\-–—•·|]*$/i,
];
const isPageNum = (t: string) => t.length <= 26 && PAGE_NUM_RES.some((r) => r.test(t));

/* ---------- detección de notas al pie ---------- */
const FOOT_MARKER_NUM = /^[\[(]?\s*(\d{1,3}|[ivxlcdm]{1,4})\s*[)\].:–—-]\s+\S{2,}/i;
const FOOT_MARKER_LETTER = /^[\[(]\s*[a-záéíóúüñ]\s*[)\]]\s+\S{2,}/i;

/* normaliza para comparar encabezados/pies repetidos (ignora cifras) */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();

interface KeptLine {
  t: string;
  x: number;
}

/**
 * Limpia páginas crudas: elimina encabezados/pies repetidos, números de página
 * y notas al pie (por posición, tamaño de fuente y patrón), y recompone párrafos
 * usando sangrías y líneas cortas de cierre.
 */
export function cleanPages(
  pagesRaw: RawLine[][],
  opts: FilterOpts
): { pages: PageBlock[]; stats: FilterStats } {
  const stats: FilterStats = { pageNumbers: 0, running: 0, footnotes: 0 };

  const sizes = pagesRaw.flat().map((l) => l.size).sort((a, b) => a - b);
  const median = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 10;

  /* encabezados/pies que se repiten en muchas páginas */
  const freq = new Map<string, number>();
  for (const lines of pagesRaw) {
    if (lines.length < 3) continue;
    for (const l of [lines[0], lines[lines.length - 1]]) {
      if (l.y > l.pageH * 0.86 || l.y < l.pageH * 0.14) {
        const k = norm(l.text);
        if (k.length > 1 && k.length < 90) freq.set(k, (freq.get(k) || 0) + 1);
      }
    }
  }
  const threshold = Math.max(3, Math.ceil(pagesRaw.length * 0.25));
  const running = new Set<string>();
  freq.forEach((n, k) => {
    if (n >= threshold) running.add(k);
  });

  const pages: PageBlock[] = [];

  for (const lines of pagesRaw) {
    const kept: KeptLine[] = [];
    let inFoot = false;

    for (const l of lines) {
      const t = l.text.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const nearTop = l.y > l.pageH * 0.86;
      const nearBottom = l.y < l.pageH * 0.14;
      const small = l.size < median * 0.9;

      if (opts.running && (nearTop || nearBottom) && running.has(norm(t))) {
        stats.running++;
        continue;
      }
      if (opts.pageNumbers && isPageNum(t) && (nearTop || nearBottom)) {
        stats.pageNumbers++;
        continue;
      }
      if (opts.footnotes) {
        const footZone = l.y < l.pageH * 0.3;
        const marker = FOOT_MARKER_NUM.test(t) || FOOT_MARKER_LETTER.test(t);
        if (
          (small && footZone) ||
          (marker && small && l.y < l.pageH * 0.4) ||
          (inFoot && small && l.y < l.pageH * 0.38)
        ) {
          inFoot = true;
          stats.footnotes++;
          continue;
        }
        if (!small) inFoot = false;
      }

      /* limpia referencias de nota en línea: [12], ¹²³ */
      kept.push({
        t: t.replace(/\s*\[\d{1,3}\]/g, "").replace(/\s*[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, ""),
        x: l.x,
      });
    }

    /* ---- recompone párrafos ---- */
    const lens = kept.map((k) => k.t.length).sort((a, b) => a - b);
    const medLen = lens.length ? lens[Math.floor(lens.length / 2)] : 60;
    const xs = kept.map((k) => k.x).sort((a, b) => a - b);
    const leftMargin = xs.length ? xs[Math.max(0, Math.floor(xs.length * 0.08))] : 0;
    const indentEps = median * 1.15;

    const paragraphs: string[] = [];
    let cur = "";
    let prevShort = false;
    for (const k of kept) {
      const indented = k.x > leftMargin + indentEps;
      if (cur && /[\wá-ú]-$/i.test(cur)) {
        cur = cur.slice(0, -1) + k.t; /* palabra partida por guion */
      } else if (cur && (indented || prevShort)) {
        paragraphs.push(cur);
        cur = k.t;
      } else {
        cur = cur ? cur + " " + k.t : k.t;
      }
      prevShort = k.t.length < medLen * 0.75;
    }
    if (cur.trim()) paragraphs.push(cur);
    pages.push({ paragraphs });
  }

  return { pages, stats };
}

/* ---------- separación en frases para TTS ---------- */
export function splitSentences(paragraph: string): string[] {
  const t = paragraph.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const parts = t.split(
    /(?<=[.!?…]+["»”')\]]*)\s+(?=["«¿¡(]*[A-ZÁÉÍÓÚÜÑ0-9])/
  );

  /* reengancha fragmentos diminutos (p. ej. «Y ya.») */
  const merged: string[] = [];
  for (const p of parts) {
    if (
      merged.length &&
      (p.length < 14 && !/[.!?…]["»”')\]]*$/.test(p))
    ) {
      merged[merged.length - 1] += " " + p;
    } else if (merged.length && p.length < 4) {
      merged[merged.length - 1] += " " + p;
    } else {
      merged.push(p);
    }
  }

  /* trocea frases kilométricas por comas/puntos y coma para que la voz no se ahogue */
  const out: string[] = [];
  for (const s of merged) {
    if (s.length <= 260) {
      out.push(s);
      continue;
    }
    const chunks = s.split(/(?<=[,;—])\s+/);
    let buf = "";
    for (const c of chunks) {
      if (buf && (buf + " " + c).length > 240) {
        out.push(buf);
        buf = c;
      } else {
        buf = buf ? buf + " " + c : c;
      }
    }
    if (buf) out.push(buf);
  }
  return out.filter((s) => s.trim().length > 0);
}
