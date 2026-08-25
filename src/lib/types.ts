/** Línea cruda extraída de una página (PDF o demo). `y` sigue la convención PDF: 0 = borde inferior. */
export interface RawLine {
  text: string;
  size: number;
  y: number;
  pageH: number;
  x: number;
}

/** Página ya limpia: lista de párrafos. */
export interface PageBlock {
  paragraphs: string[];
}

export interface FilterOpts {
  pageNumbers: boolean;
  running: boolean;
  footnotes: boolean;
}

export interface FilterStats {
  pageNumbers: number;
  running: number;
  footnotes: number;
}

export interface Sentence {
  id: number;
  text: string;
  page: number;
}

export interface BookPage {
  paragraphs: Sentence[][];
}

export interface BuiltBook {
  pages: BookPage[];
  sentences: Sentence[];
  words: number;
  minutes: number;
  stats: FilterStats;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  source: "pdf" | "epub" | "demo";
  /** PDF y demo pasan por la cadena de limpieza. */
  raw: RawLine[][] | null;
  /** EPUB llega ya estructurado en párrafos. */
  pages: PageBlock[] | null;
  language?: string;
}
