import type { Book } from "./types";

/**
 * Persistencia de la biblioteca y de la sesión de lectura.
 *
 * Los libros se guardan en IndexedDB (pueden ocupar varios megas, sobre todo
 * los PDF, y localStorage se quedaría corto). La sesión —qué libro estaba
 * abierto, en qué página y en qué frase— es diminuta y vive en localStorage.
 * Así, al cerrar la app en el iPhone y volver a abrirla, la biblioteca y el
 * punto de lectura se recuperan solos.
 */

const DB_NAME = "vozalta";
const DB_VERSION = 1;
const STORE = "library";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(book);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* sin almacenamiento: la sesión sigue funcionando en memoria */
  }
}

export async function deleteBookRecord(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* sin almacenamiento */
  }
}

export async function loadAllBooks(): Promise<Book[]> {
  try {
    const db = await openDb();
    const books = await new Promise<Book[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as Book[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return books;
  } catch {
    return [];
  }
}

/* ---------- sesión (diminuta, va en localStorage) ---------- */

export interface SessionState {
  activeId: string | null;
  pageIdx: number;
  sentenceIdx: number;
}

const SESSION_KEY = "vozalta.session";

export function loadSession(): SessionState {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return { activeId: null, pageIdx: 0, sentenceIdx: 0 };
    const p = JSON.parse(s) as Partial<SessionState>;
    return {
      activeId: typeof p.activeId === "string" ? p.activeId : null,
      pageIdx: typeof p.pageIdx === "number" && p.pageIdx >= 0 ? p.pageIdx : 0,
      sentenceIdx: typeof p.sentenceIdx === "number" && p.sentenceIdx >= 0 ? p.sentenceIdx : 0,
    };
  } catch {
    return { activeId: null, pageIdx: 0, sentenceIdx: 0 };
  }
}

export function saveSession(s: SessionState): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}
