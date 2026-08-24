import JSZip from "jszip";
import type { Book, Chapter, Page } from "./types";
import { paginateChapter, type SimpleChapter } from "./text";

function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(0, i + 1) : "";
}

function resolvePath(base: string, href: string): string {
  const clean = href.split("#")[0];
  if (clean.startsWith("/")) return clean.slice(1);
  const stack = (base + clean).split("/");
  const out: string[] = [];
  for (const part of stack) {
    if (part === "..") out.pop();
    else if (part !== "." && part !== "") out.push(part);
  }
  return out.join("/");
}

const NOTE_TYPE_RE = /(footnote|rearnote|endnote|^note$|annotation|bibliography|index|toc)/i;
const NOTE_CLASS_RE = /(foot|end|rear)?[-_]?note|annotation|bibliograph/i;

/** Elimina nodos de notas, navegación e índices dentro de un capítulo XHTML. */
function stripNotes(doc: Document): number {
  let removed = 0;
  const kill: Element[] = [];

  doc.querySelectorAll("script, style, nav").forEach((el) => kill.push(el));

  doc.querySelectorAll("*").forEach((el) => {
    const type = el.getAttribute("epub:type") || el.getAttributeNS("http://www.idpf.org/2007/ops", "type") || "";
    if (type && NOTE_TYPE_RE.test(type)) kill.push(el);
    else if (el.tagName.toLowerCase() === "aside") kill.push(el);
    else {
      const cls = `${el.getAttribute("class") ?? ""} ${el.getAttribute("id") ?? ""}`;
      if (NOTE_CLASS_RE.test(cls) && el.children.length < 40) kill.push(el);
    }
  });

  // referencias inline: <a epub:type="noteref"> o enlaces a #nota con texto corto
  doc.querySelectorAll("a").forEach((a) => {
    const type = a.getAttribute("epub:type") ?? "";
    const href = a.getAttribute("href") ?? "";
    const txt = (a.textContent ?? "").trim();
    const isRef =
      /noteref/i.test(type) ||
      (href.startsWith("#") && /^[\d*†‡¶ivxlcdma-z]{1,5}$/i.test(txt));
    if (isRef) kill.push(a);
  });

  const seen = new Set<Element>();
  for (const el of kill) {
    if (seen.has(el)) continue;
    let p: Element | null = el;
    let nested = false;
    while (p) {
      if (seen.has(p)) {
        nested = true;
        break;
      }
      p = p.parentElement;
    }
    if (nested) continue;
    seen.add(el);
    const text = el.textContent?.trim();
    if (text && text.length > 1 && el.tagName.toLowerCase() !== "a") removed++;
    el.remove();
  }
  // <sup> que solo contenían números de nota
  doc.querySelectorAll("sup").forEach((s) => {
    const t = (s.textContent ?? "").trim();
    if (/^[\d*†‡¶]{1,4}$/.test(t)) s.remove();
  });
  return removed;
}

function chapterFromXhtml(
  html: string,
  fallbackTitle: string
): { chapter: SimpleChapter | null; isToc: boolean; removed: number } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const removed = stripNotes(doc);
  const body = doc.body;
  if (!body) return { chapter: null, isToc: false, removed };

  // detección de índice: mayoría de los bloques son enlaces cortos
  const anchors = body.querySelectorAll("a[href]").length;
  const blocks = Array.from(
    body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd, pre")
  );
  const paras: { text: string; heading?: boolean }[] = [];
  let title: string | null = null;

  for (const el of blocks) {
    let text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text || /^\d{1,4}$/.test(text)) continue;
    if (text.length > 4000) text = text.slice(0, 4000);
    const tag = el.tagName.toLowerCase();
    const isH = /^h[1-6]$/.test(tag);
    if (isH && !title && text.length < 90) title = text;
    if (isH && text.length < 90) paras.push({ text, heading: true });
    else paras.push({ text });
  }

  const shortBlocks = paras.filter((p) => p.text.length < 90).length;
  const isToc =
    paras.length >= 6 && anchors >= Math.max(5, shortBlocks * 0.6) && shortBlocks / Math.max(1, paras.length) > 0.7;

  if (!paras.length) return { chapter: null, isToc, removed };
  return {
    chapter: { title: title ?? fallbackTitle, paragraphs: paras },
    isToc,
    removed,
  };
}

export async function extractEpub(
  file: File,
  onProgress?: (frac: number) => void
): Promise<Book> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("No es un EPUB válido (falta container.xml).");
  // parseado como HTML para evitar problemas de namespaces XML en querySelector
  const container = new DOMParser().parseFromString(containerXml, "text/html");
  const rootfile = container.querySelector("rootfile")?.getAttribute("full-path");
  if (!rootfile) throw new Error("No es un EPUB válido (sin rootfile).");

  const opfText = await zip.file(rootfile)?.async("string");
  if (!opfText) throw new Error("No es un EPUB válido (falta el OPF).");
  const opf = new DOMParser().parseFromString(opfText, "text/html");
  const base = dirOf(rootfile);

  const title =
    opf.querySelector("metadata title, dc\\:title, title")?.textContent?.trim() ||
    file.name.replace(/\.epub$/i, "");
  const author =
    opf.querySelector("metadata creator, dc\\:creator, creator")?.textContent?.trim() ||
    undefined;

  const manifest = new Map<string, { href: string; type: string }>();
  opf.querySelectorAll("manifest item").forEach((it) => {
    const id = it.getAttribute("id");
    const href = it.getAttribute("href");
    if (id && href)
      manifest.set(id, { href, type: it.getAttribute("media-type") ?? "" });
  });
  const spineIds = Array.from(opf.querySelectorAll("spine > itemref")).map((r) =>
    r.getAttribute("idref")
  );

  const chapters: SimpleChapter[] = [];
  const chapterMeta: { title: string; removed: number; toc: boolean }[] = [];
  let done = 0;
  for (const id of spineIds) {
    const item = id ? manifest.get(id) : undefined;
    done++;
    if (!item || (!/xhtml|html/.test(item.type) && !/\.x?html?$/i.test(item.href))) {
      onProgress?.(done / spineIds.length);
      continue;
    }
    const path = resolvePath(base, item.href);
    const f = zip.file(path);
    if (!f) continue;
    const html = await f.async("string");
    const { chapter, isToc, removed } = chapterFromXhtml(html, `Sección ${chapters.length + 1}`);
    chapterMeta.push({ title: chapter?.title ?? "Índice", removed, toc: isToc });
    if (chapter && !isToc) chapters.push(chapter);
    onProgress?.(done / spineIds.length);
  }

  if (!chapters.length) throw new Error("No se encontró texto legible en el EPUB.");

  // encabezados/pies repetidos entre capítulos (título del libro en cada página)
  const freq = new Map<string, number>();
  for (const ch of chapters)
    for (const p of ch.paragraphs)
      if (!p.heading && p.text.length <= 90) {
        const k = p.text.toLowerCase().replace(/\s+/g, " ").trim();
        freq.set(k, (freq.get(k) ?? 0) + 1);
      }
  const repTh = Math.max(3, Math.ceil(chapters.length * 0.6));
  let removedRepeated = 0;
  for (const ch of chapters) {
    ch.paragraphs = ch.paragraphs.filter((p) => {
      const k = p.text.toLowerCase().replace(/\s+/g, " ").trim();
      const rep = !p.heading && p.text.length <= 90 && (freq.get(k) ?? 0) >= repTh;
      if (rep) removedRepeated++;
      return !rep;
    });
  }

  const pages: Page[] = [];
  const bookChapters: Chapter[] = [];
  chapters.forEach((ch, ci) => {
    const removedLines: string[] = [];
    const meta = chapterMeta[ci];
    if (meta && meta.removed > 0)
      removedLines.push(`${meta.removed} nota(s) o sección(es) omitida(s)`);
    const chPages = paginateChapter(ch, ci, removedLines);
    bookChapters.push({
      title: ch.title,
      startPage: pages.length,
      endPage: pages.length + Math.max(0, chPages.length - 1),
    });
    pages.push(...chPages);
  });

  const tocRemoved = chapterMeta.filter((m) => m.toc).length;
  const removedCount =
    pages.reduce((a, p) => a + p.removed.length, 0) + removedRepeated + tocRemoved;
  const totalWords = pages.reduce((a, p) => a + p.words, 0);

  return {
    title,
    author,
    source: "epub",
    fileName: file.name,
    pages,
    chapters: bookChapters,
    removedCount,
    totalWords,
  };
}

/** Documento TXT plano: párrafos por doble salto de línea. */
export async function extractTxt(file: File): Promise<Book> {
  const text = await file.text();
  const paras = text
    .split(/\n{2,}/)
    .map((t) => ({ text: t.replace(/\s+/g, " ").trim() }))
    .filter((p) => p.text.length > 0);
  if (!paras.length) throw new Error("El archivo de texto está vacío.");
  const chapter: SimpleChapter = {
    title: file.name.replace(/\.txt$/i, ""),
    paragraphs: paras,
  };
  const pages = paginateChapter(chapter, 0);
  return {
    title: chapter.title,
    source: "txt",
    fileName: file.name,
    pages,
    chapters: [{ title: chapter.title, startPage: 0, endPage: Math.max(0, pages.length - 1) }],
    removedCount: 0,
    totalWords: pages.reduce((a, p) => a + p.words, 0),
  };
}
