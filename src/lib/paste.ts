import type { Book, PageBlock } from "./types";
import { uid } from "./book";

/**
 * Convierte texto pegado a mano en un libro paginado (~1000 caracteres por
 * página), listo para leerse en voz alta con el mismo motor que PDF/EPUB.
 */
export function makePasteBook(title: string, text: string): Book {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 1);

  if (!paragraphs.length) {
    throw new Error("El texto está vacío: pega al menos una frase.");
  }

  const blocks: PageBlock[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const p of paragraphs) {
    cur.push(p);
    len += p.length;
    if (len >= 1000) {
      blocks.push({ paragraphs: cur });
      cur = [];
      len = 0;
    }
  }
  if (cur.length) blocks.push({ paragraphs: cur });

  const first = paragraphs[0] || "";
  const fallbackTitle =
    first.length > 46 ? first.slice(0, 46).trimEnd() + "…" : first;

  return {
    id: uid(),
    title: title.trim() || fallbackTitle || "Texto pegado",
    author: "Pegado a mano",
    source: "paste",
    raw: null,
    pages: blocks,
  };
}
