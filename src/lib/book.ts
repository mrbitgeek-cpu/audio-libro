import { cleanPages, splitSentences } from "./clean";
import type {
  Book,
  BookPage,
  BuiltBook,
  FilterOpts,
  FilterStats,
  PageBlock,
  Sentence,
} from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const ZERO: FilterStats = { pageNumbers: 0, running: 0, footnotes: 0 };

/**
 * Convierte un libro (crudo o estructurado) en páginas con frases numeradas,
 * listas para leerse en voz alta y para resaltar la frase activa.
 */
export function buildBook(book: Book, filters: FilterOpts): BuiltBook {
  let blocks: PageBlock[];
  let stats: FilterStats;
  if (book.pages) {
    blocks = book.pages;
    stats = ZERO;
  } else {
    const r = cleanPages(book.raw ?? [], filters);
    blocks = r.pages;
    stats = r.stats;
  }

  const pages: BookPage[] = [];
  const sentences: Sentence[] = [];
  let id = 0;
  blocks.forEach((b, pi) => {
    const paras: Sentence[][] = [];
    for (const p of b.paragraphs) {
      const ss = splitSentences(p).map((t) => ({ id: id++, text: t, page: pi }));
      if (ss.length) {
        sentences.push(...ss);
        paras.push(ss);
      }
    }
    pages.push({ paragraphs: paras });
  });

  const words = sentences.reduce(
    (acc, s) => acc + s.text.split(/\s+/).length,
    0
  );

  return {
    pages,
    sentences,
    words,
    minutes: Math.max(1, Math.round(words / 150)),
    stats,
  };
}
