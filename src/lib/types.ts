export interface Paragraph {
  text: string;
  heading?: boolean;
  /** índice global de la primera oración de este párrafo dentro de la página */
  s0: number;
  /** índice global (exclusivo) de la última oración */
  s1: number;
}

export interface Page {
  id: string;
  chapterIndex: number;
  paragraphs: Paragraph[];
  /** oraciones aplanadas de toda la página, en orden de lectura */
  sentences: string[];
  /** líneas omitidas por el limpiador en esta página */
  removed: string[];
  words: number;
}

export interface Chapter {
  title: string;
  startPage: number;
  endPage: number;
}

export interface Book {
  title: string;
  author?: string;
  source: "pdf" | "epub" | "txt" | "sample";
  fileName: string;
  pages: Page[];
  chapters: Chapter[];
  /** total de líneas omitidas por la limpieza */
  removedCount: number;
  totalWords: number;
}

export interface Position {
  page: number;
  sentence: number;
}

export type SpeechStatus = "idle" | "playing" | "paused";
