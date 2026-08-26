import JSZip from "jszip";
import type { Book, PageBlock } from "./types";
import { uid } from "./book";

const parse = (s: string, type: DOMParserSupportedType) =>
  new DOMParser().parseFromString(s, type);

function resolvePath(p: string): string {
  let decoded = p;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    /* nombre con % malformado: se usa tal cual */
  }
  const out: string[] = [];
  for (const seg of decoded.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

const NOISE_TOKENS =
  /^(footnote|endnote|rearnote|marginal|annotation|pagebreak|pagenumber|page-number|toc|bibliography)$/i;

const NOISE_CLASS =
  /(footnote|endnote|rearnote|notas?-?al-?pie|pie-?de-?pagina|pagenumber|page-number)/i;

/** Quita scripts, notas al pie tipográficas, índices y marcadores de página. */
function stripNoise(doc: Document) {
  doc.querySelectorAll("script, style, nav, svg, hr").forEach((el) => el.remove());
  for (const el of [...doc.querySelectorAll("*")]) {
    if (!el.isConnected) continue;
    const tag = el.tagName.toLowerCase();
    const etype =
      el.getAttribute("epub:type") ||
      el.getAttributeNS("http://www.idpf.org/2007/ops", "type") ||
      "";
    const cls = el.getAttribute("class") || "";
    const idl = el.getAttribute("id") || "";

    const typedNoise = /(footnote|endnote|rearnote|marginal|annotation|toc|pagebreak|pagenumber)/i.test(
      etype
    );
    const classNoise =
      cls.split(/\s+/).some((c) => NOISE_TOKENS.test(c)) || NOISE_CLASS.test(cls) ||
      idl.split(/\s+/).some((c) => NOISE_TOKENS.test(c));

    if (typedNoise || classNoise) {
      el.remove();
      continue;
    }
    /* referencia de nota: <a href="#fn12">12</a> o <sup>12</sup> */
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      if (
        (/^#(fn|note|sdfootnote|endnote)/i.test(href) ||
          /ref/i.test(cls)) &&
        (el.textContent || "").trim().length <= 6
      ) {
        el.remove();
        continue;
      }
    }
    if (tag === "sup" && /^[\s[(]?\d{1,3}[\])]?\s*$/.test(el.textContent || "")) {
      el.remove();
    }
  }
}

function extractParagraphs(doc: Document): string[] {
  const body = doc.querySelector("body");
  if (!body) return [];
  const out: string[] = [];
  const nodes = body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li");
  nodes.forEach((n) => {
    const t = (n.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length > 1) out.push(t);
  });
  if (out.length < 3) {
    const t = (body.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length > 40) out.push(t);
  }
  return out;
}

const TOC_LINE = /(\.{2,}|…{1,})\s*\d+\s*$|^\d{1,3}\s*[.)]\s+\S/;

function looksLikeToc(paras: string[]): boolean {
  if (paras.length < 6) return false;
  const avg = paras.reduce((a, p) => a + p.length, 0) / paras.length;
  const hits = paras.filter((p) => TOC_LINE.test(p)).length;
  return avg < 60 && hits / paras.length >= 0.45;
}

/**
 * Parsea un documento de contenido de forma indulgente.
 * `text/html` recupera el XHTML ligeramente malformado que el parser estricto
 * de iOS rechaza (la causa típica del mensaje «sin texto legible»).
 */
function parseContent(s: string): Document {
  return new DOMParser().parseFromString(s, "text/html");
}

function isContent(item: { href: string; type: string }): boolean {
  if (/xhtml|html/i.test(item.type)) return true;
  return /\.(xhtml|html?|htm)$/i.test(item.href);
}

const TOC_PATH = /(^|\/)(toc|contents?|nav|indice|index)[^/]*$/i;

/** Convierte los párrafos de un capítulo en páginas de ~1000 caracteres. */
function repaginate(paras: string[], into: PageBlock[]) {
  let cur: string[] = [];
  let len = 0;
  for (const p of paras) {
    cur.push(p);
    len += p.length;
    if (len >= 1000) {
      into.push({ paragraphs: cur });
      cur = [];
      len = 0;
    }
  }
  if (cur.length) into.push({ paragraphs: cur });
}

/** Lee un EPUB completo: metadatos, lomo (spine) y texto limpio por capítulos. */
export async function loadEpubBook(
  file: File,
  onProgress?: (p: number) => void
): Promise<Book> {
  const zip = await JSZip.loadAsync(file);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  if (!container) throw new Error("EPUB inválido: falta META-INF/container.xml.");
  const cdoc = parse(container, "application/xml");
  const opfPath = cdoc.querySelector("rootfile")?.getAttribute("full-path");
  if (!opfPath) throw new Error("EPUB inválido: no se encontró el archivo OPF.");
  const opfXml = await zip.file(resolvePath(opfPath))?.async("string");
  if (!opfXml) throw new Error("EPUB inválido: no se pudo leer el OPF.");
  const opf = parse(opfXml, "application/xml");

  const title =
    opf.getElementsByTagName("dc:title")[0]?.textContent?.trim() ||
    file.name.replace(/\.epub$/i, "");
  const author =
    opf.getElementsByTagName("dc:creator")[0]?.textContent?.trim() || undefined;
  const language =
    opf.getElementsByTagName("dc:language")[0]?.textContent?.trim() || undefined;

  const base = opfPath.includes("/")
    ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1)
    : "";

  const manifest = new Map<string, { href: string; type: string }>();
  opf.querySelectorAll("manifest > item").forEach((el) => {
    const id = el.getAttribute("id");
    const href = el.getAttribute("href");
    const type = el.getAttribute("media-type") || "";
    if (id && href) manifest.set(id, { href, type });
  });

  const spineIds = [...opf.querySelectorAll("spine > itemref")]
    .filter((el) => el.getAttribute("linear") !== "no")
    .map((el) => el.getAttribute("idref") || "")
    .filter(Boolean);

  const blocks: PageBlock[] = [];
  const seen = new Set<string>();

  /* procesa un archivo de contenido; devuelve true si aportó texto */
  const consume = async (item: { href: string; type: string }): Promise<boolean> => {
    const path = resolvePath(base + item.href);
    if (seen.has(path)) return false;
    seen.add(path);
    const raw = await zip.file(path)?.async("string");
    if (!raw) return false;
    const doc = parseContent(raw);
    stripNoise(doc);
    const paras = extractParagraphs(doc);
    if (!paras.length) return false;
    /* solo descartamos como índice si el nombre del archivo Y el contenido lo delatan */
    if (TOC_PATH.test(path) && looksLikeToc(paras)) return false;
    repaginate(paras, blocks);
    return true;
  };

  let done = 0;
  for (const id of spineIds) {
    done++;
    const item = manifest.get(id);
    if (item && isContent(item)) await consume(item);
    onProgress?.(spineIds.length ? done / spineIds.length : 1);
  }

  /* respaldo: si el lomo no aportó nada, recorre los archivos de contenido del manifiesto */
  if (!blocks.length) {
    const items = [...manifest.values()].filter(isContent);
    for (let i = 0; i < items.length; i++) {
      await consume(items[i]);
      onProgress?.(items.length ? (i + 1) / items.length : 1);
    }
  }

  if (!blocks.length) {
    throw new Error("No se pudo extraer texto legible de este EPUB.");
  }

  return { id: uid(), title, author, language, source: "epub", raw: null, pages: blocks };
}
