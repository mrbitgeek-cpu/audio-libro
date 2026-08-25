import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Book, FilterOpts } from "./lib/types";
import { buildBook } from "./lib/book";
import { makeDemoBook } from "./lib/demo";
import { makePasteBook } from "./lib/paste";
import { useSpeech } from "./hooks/useSpeech";
import Landing from "./components/Landing";
import Sidebar from "./components/Sidebar";
import Reader from "./components/Reader";
import PlayerBar from "./components/PlayerBar";
import PasteModal from "./components/PasteModal";
import { Switch } from "./components/ui";
import { IcAlert, IcEye, IcMenu, IcPen, IcPlus, IcX } from "./components/icons";

const EMPTY_SENTENCES: never[] = [];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOpts>(() =>
    loadJSON("vozalta.filters", { pageNumbers: true, running: true, footnotes: true })
  );
  const [pageIdx, setPageIdx] = useState(0);
  const [follow, setFollow] = useState<boolean>(() => loadJSON("vozalta.follow", true));
  const [parsing, setParsing] = useState<{ name: string; progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* persistencia ligera */
  useEffect(() => {
    try {
      localStorage.setItem("vozalta.filters", JSON.stringify(filters));
    } catch { /* sin almacenamiento */ }
  }, [filters]);
  useEffect(() => {
    try {
      localStorage.setItem("vozalta.follow", JSON.stringify(follow));
    } catch { /* sin almacenamiento */ }
  }, [follow]);

  const active = books.find((b) => b.id === activeId) ?? null;
  const built = useMemo(
    () => (active ? buildBook(active, filters) : null),
    [active, filters]
  );
  const builtRef = useRef(built);
  builtRef.current = built;

  /* la voz cambia de página sola */
  const handleIndex = useCallback((i: number) => {
    const b = builtRef.current;
    const s = b?.sentences[i];
    if (s) setPageIdx(s.page);
  }, []);

  const speech = useSpeech(built?.sentences ?? EMPTY_SENTENCES, handleIndex);

  /* al cambiar de libro o de filtros, reinicia la sesión de audio */
  useEffect(() => {
    speech.stop();
    setPageIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built]);

  /* aviso temporal */
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 7000);
    return () => window.clearTimeout(t);
  }, [error]);

  /* ---------- acciones ---------- */
  const addFiles = useCallback(async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      try {
        setParsing({ name: f.name, progress: 0 });
        let book: Book;
        if (ext === "pdf") {
          /* el parser de PDF se carga bajo demanda para aligerar el arranque */
          const { loadPdfBook } = await import("./lib/pdf");
          book = await loadPdfBook(f, (p: number) =>
            setParsing({ name: f.name, progress: p * 0.9 })
          );
        } else if (ext === "epub") {
          const { loadEpubBook } = await import("./lib/epub");
          book = await loadEpubBook(f, (p: number) =>
            setParsing({ name: f.name, progress: p * 0.9 })
          );
        } else {
          setError(`«${f.name}»: formato no compatible. Usa PDF o EPUB.`);
          continue;
        }
        setParsing({ name: f.name, progress: 1 });
        setBooks((bs) => [...bs, book]);
        setActiveId(book.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : `No se pudo abrir «${f.name}».`);
      } finally {
        window.setTimeout(() => setParsing(null), 350);
      }
    }
  }, []);

  const addDemo = useCallback(() => {
    const demo = makeDemoBook();
    setBooks((bs) => [...bs, demo]);
    setActiveId(demo.id);
  }, []);

  const addPaste = useCallback((title: string, text: string) => {
    try {
      const book = makePasteBook(title, text);
      setBooks((bs) => [...bs, book]);
      setActiveId(book.id);
      setPasteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer ese texto.");
    }
  }, []);

  const removeBook = useCallback(
    (id: string) => {
      const remaining = books.filter((b) => b.id !== id);
      setBooks(remaining);
      if (id === activeId) {
        speech.stop();
        setActiveId(remaining[0]?.id ?? null);
      }
    },
    [books, activeId, speech]
  );

  const goToPage = useCallback(
    (p: number) => {
      const b = builtRef.current;
      if (!b) return;
      const target = Math.max(0, Math.min(b.pages.length - 1, p));
      setPageIdx(target);
      if (speech.status !== "idle") {
        const first = b.sentences.findIndex((s) => s.page === target);
        if (first >= 0) speech.speakAt(first);
      }
    },
    [speech]
  );

  const seekSentence = useCallback(
    (idx: number) => {
      speech.seek(idx);
    },
    [speech]
  );

  /* al pulsar play sin sesión activa, arranca desde la página visible */
  const handleToggle = useCallback(() => {
    const st = speechRef.current.status;
    if (st !== "idle") {
      speechRef.current.toggle();
      return;
    }
    if (speechRef.current.index >= 0) {
      speechRef.current.toggle();
      return;
    }
    const b = builtRef.current;
    if (b && pageRef.current > 0) {
      const first = b.sentences.findIndex((s) => s.page === pageRef.current);
      speechRef.current.speakAt(first >= 0 ? first : 0);
    } else {
      speechRef.current.toggle();
    }
  }, []);

  /* ---------- teclado ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "SELECT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (!builtRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleToggle();
      } else if (e.key === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        speechRef.current.seek(speechRef.current.index + 1);
      } else if (e.key === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        speechRef.current.seek(speechRef.current.index - 1);
      } else if (e.key === "ArrowRight") {
        pageRef.current + 1 <= builtRef.current.pages.length - 1 && goToPageRef.current(pageRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        pageRef.current - 1 >= 0 && goToPageRef.current(pageRef.current - 1);
      } else if (e.key === "f" || e.key === "F") {
        setFollow((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const speechRef = useRef(speech);
  speechRef.current = speech;
  const pageRef = useRef(pageIdx);
  pageRef.current = pageIdx;
  const goToPageRef = useRef(goToPage);
  goToPageRef.current = goToPage;

  /* ---------- pantallas ---------- */
  if (!active || !built) {
    return (
      <>
        <Landing onFiles={addFiles} onDemo={addDemo} onPaste={() => setPasteOpen(true)} />
        <ParsingOverlay parsing={parsing} />
        <ErrorToast error={error} onClose={() => setError(null)} />
        <PasteModal open={pasteOpen} onClose={() => setPasteOpen(false)} onSubmit={addPaste} />
      </>
    );
  }

  return (
    <div className="app-bg flex h-dvh overflow-hidden text-ink">
      {/* barra lateral escritorio */}
      <aside className="hidden w-[302px] shrink-0 border-r border-pine-800 lg:block">
        <Sidebar
          books={books}
          activeId={activeId}
          built={built}
          filters={filters}
          onFilters={setFilters}
          onSelect={setActiveId}
          onRemove={removeBook}
          onAdd={() => fileRef.current?.click()}
          onPaste={() => setPasteOpen(true)}
          speech={speech}
        />
      </aside>

      {/* barra lateral móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-pine-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="slide-in absolute left-0 top-0 h-full w-[302px] shadow-2xl">
            <Sidebar
              books={books}
              activeId={activeId}
              built={built}
              filters={filters}
              onFilters={setFilters}
              onSelect={(id) => {
                setActiveId(id);
                setMenuOpen(false);
              }}
              onRemove={removeBook}
              onAdd={() => fileRef.current?.click()}
              onPaste={() => {
                setPasteOpen(true);
                setMenuOpen(false);
              }}
              speech={speech}
            />
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* barra superior */}
        <header className="z-10 flex items-center gap-3 border-b border-line bg-card/80 px-4 py-3 backdrop-blur md:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-md border border-line p-2 text-ink-soft transition-colors hover:border-teal-500 hover:text-teal-600 lg:hidden"
            aria-label="Abrir menú"
          >
            <IcMenu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[16px] font-bold tracking-tight md:text-lg">
              {active.title}
            </h1>
            <p className="truncate font-body text-[12px] italic text-ink-soft">
              {active.author
                ? `${active.author} · `
                : ""}
              {built.words.toLocaleString("es")} palabras · ~{built.minutes} min de audio
            </p>
          </div>

          <label className="hidden items-center gap-2 sm:flex" title="Seguir la frase activa con el scroll (F)">
            <IcEye className={`h-[18px] w-[18px] ${follow ? "text-teal-600" : "text-ink-soft/60"}`} />
            <span className="font-display text-[12px] font-semibold text-ink-soft">Seguir lectura</span>
            <Switch on={follow} onChange={setFollow} label="Seguir lectura" />
          </label>

          <span className="rounded-full border border-line bg-paper px-3 py-1 font-display text-[12px] font-bold tabular-nums text-pine-800">
            {pageIdx + 1} / {built.pages.length}
          </span>

          <button
            onClick={() => setPasteOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 font-display text-[12px] font-bold text-pine-800 transition-all hover:border-teal-500 hover:text-teal-600 active:scale-95"
            title="Pegar texto para leerlo en voz alta"
          >
            <IcPen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Texto</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-1.5 font-display text-[12px] font-bold text-fern shadow transition-all hover:bg-teal-500 active:scale-95"
            title="Añadir otro libro"
          >
            <IcPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Libro</span>
          </button>
        </header>

        <Reader
          book={active}
          built={built}
          pageIdx={pageIdx}
          onGoToPage={goToPage}
          activeSentence={speech.index}
          onSeekSentence={seekSentence}
          status={speech.status}
          follow={follow}
        />

        <PlayerBar speech={speech} built={built} pageIdx={pageIdx} onToggle={handleToggle} />
      </main>

      <ParsingOverlay parsing={parsing} />
      <ErrorToast error={error} onClose={() => setError(null)} />
      <PasteModal open={pasteOpen} onClose={() => setPasteOpen(false)} onSubmit={addPaste} />
    </div>
  );
}

/* ---------- overlays ---------- */
function ParsingOverlay({ parsing }: { parsing: { name: string; progress: number } | null }) {
  if (!parsing) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-pine-950/70 px-6 backdrop-blur-sm">
      <div className="pop-in w-full max-w-sm border border-pine-700 bg-pine-900 p-6 text-fern shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-600/20 text-teal-300">
            <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-bold">Extrayendo y limpiando el texto…</p>
            <p className="truncate font-body text-[12px] italic text-moss">{parsing.name}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-pine-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-gold-400 transition-[width] duration-200"
            style={{ width: `${Math.round(parsing.progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-right font-display text-[11px] font-bold tabular-nums text-moss">
          {Math.round(parsing.progress * 100)}%
        </p>
      </div>
    </div>
  );
}

function ErrorToast({ error, onClose }: { error: string | null; onClose: () => void }) {
  if (!error) return null;
  return (
    <div className="pop-in fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 border border-[#e08a77]/40 bg-[#2b1512] px-4 py-3 text-[#f6d9d2] shadow-2xl">
      <IcAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#e79075]" />
      <p className="font-body text-[13px] leading-snug">{error}</p>
      <button onClick={onClose} className="ml-1 shrink-0 opacity-60 transition-opacity hover:opacity-100" aria-label="Cerrar aviso">
        <IcX className="h-4 w-4" />
      </button>
    </div>
  );
}
