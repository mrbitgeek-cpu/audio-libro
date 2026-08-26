import { useEffect, useRef, useState } from "react";
import type { Book, BuiltBook, Sentence } from "../lib/types";
import type { SpeechStatus } from "../hooks/useSpeech";
import { IcBookmark, IcChevL, IcChevR, IcRotate } from "./icons";

interface Props {
  book: Book;
  built: BuiltBook;
  pageIdx: number;
  onGoToPage: (p: number) => void;
  activeSentence: number;
  onSeekSentence: (globalIdx: number) => void;
  status: SpeechStatus;
  follow: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  resumePage: number | null;
  onResume: () => void;
}

export default function Reader({
  book,
  built,
  pageIdx,
  onGoToPage,
  activeSentence,
  onSeekSentence,
  status,
  follow,
  isBookmarked,
  onToggleBookmark,
  resumePage,
  onResume,
}: Props) {
  /* salto directo a una página concreta */
  const [jumpVal, setJumpVal] = useState(String(pageIdx + 1));
  useEffect(() => setJumpVal(String(pageIdx + 1)), [pageIdx]);
  const submitJump = () => {
    const n = parseInt(jumpVal, 10);
    if (!Number.isNaN(n)) onGoToPage(n - 1);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const page = built.pages[pageIdx];
  const total = built.pages.length;

  /* al cambiar de página, vuelve arriba */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageIdx]);

  /* seguimiento de la frase activa */
  useEffect(() => {
    if (!follow || status === "idle") return;
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-sid="${activeSentence}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSentence, follow, status]);

  const sentenceCls = (s: Sentence) =>
    s.id === activeSentence && status !== "idle"
      ? "bg-gold-300/80 text-ink shadow-[0_2px_0_var(--color-gold-500)]"
      : "hover:bg-paper-2";

  return (
    <div className="relative min-h-0 flex-1">
      {/* retomar donde se dejó la lectura */}
      {resumePage != null && (
        <button
          onClick={onResume}
          className="pop-in absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold-400/70 bg-pine-950 px-3.5 py-1.5 font-display text-[12px] font-bold text-gold-300 shadow-lg shadow-pine-950/30 transition-all hover:bg-pine-900 hover:text-gold-200 active:scale-95"
          title="Volver a la página donde dejaste la lectura"
        >
          <IcRotate className="h-3.5 w-3.5" />
          Retomar en pág. {resumePage + 1}
        </button>
      )}

      <div ref={scrollRef} className="scroll-slim h-full overflow-y-auto px-4 py-6 md:px-10">
        <article
          key={pageIdx}
          className="page-in paper-sheet mx-auto max-w-[720px] border border-line bg-card px-6 py-10 shadow-[0_18px_50px_-18px_rgba(23,28,26,0.35)] sm:px-10 md:px-14 md:py-14"
        >
          {/* cabecera de página */}
          <header className="mb-8 flex items-center gap-3">
            {/* saltar a una página concreta */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitJump();
              }}
              className="flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 transition-colors focus-within:border-teal-500"
              title="Ir a una página concreta"
            >
              <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-soft/70">
                pág.
              </span>
              <input
                type="number"
                min={1}
                max={total}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                className="w-9 bg-transparent text-center font-display text-[13px] font-bold tabular-nums text-teal-600 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Número de página"
              />
              <button
                type="submit"
                className="rounded-full bg-teal-600 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-fern transition-all hover:bg-teal-500 active:scale-95"
              >
                Ir
              </button>
            </form>

            <span className="h-px flex-1 bg-line" />

            {/* marcador de esta página */}
            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? "Quitar marcador (Ctrl+B)" : "Marcar esta página (Ctrl+B)"}
              aria-pressed={isBookmarked}
              className={`rounded-full p-1.5 transition-all duration-200 active:scale-90 ${
                isBookmarked
                  ? "bg-gold-400/20 text-gold-500 shadow-[0_0_0_1px_var(--color-gold-400)]"
                  : "text-ink-soft/50 hover:bg-paper-2 hover:text-gold-500"
              }`}
            >
              <IcBookmark filled={isBookmarked} className="h-[18px] w-[18px]" />
            </button>

            <span className="font-display text-[11px] font-semibold tracking-wide text-ink-soft/70">
              {total} en total
            </span>
          </header>

          {!page || page.paragraphs.length === 0 ? (
            <p className="py-16 text-center font-body italic text-ink-soft">
              Esta página quedó vacía tras la limpieza. Pasa a la siguiente.
            </p>
          ) : (
            <div className="font-body text-[16.5px] leading-[1.9] text-ink md:text-[17.5px]">
              {page.paragraphs.map((para, pi) => (
                <p
                  key={pi}
                  className={`mb-5 ${
                    pi === 0 && pageIdx === 0
                      ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[52px] first-letter:font-bold first-letter:leading-[0.85] first-letter:text-teal-600"
                      : ""
                  }`}
                >
                  {para.map((s) => (
                    <span
                      key={s.id}
                      data-sid={s.id}
                      onClick={() => onSeekSentence(s.id)}
                      title="Leer desde aquí"
                      className={`cursor-pointer rounded-[3px] px-[2px] transition-colors duration-300 ${sentenceCls(s)}`}
                    >
                      {s.text}{" "}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}

          {/* pie de página estilo libro */}
          <footer className="mt-10 flex items-center gap-4 border-t border-line pt-5">
            <span className="h-px flex-1" />
            <p className="max-w-[70%] truncate text-center font-display text-[11px] font-medium tracking-wide text-ink-soft/70">
              {book.title} · {pageIdx + 1} / {total}
            </p>
            <span className="h-px flex-1" />
          </footer>
        </article>

        <div className="mx-auto h-6 max-w-[720px]" />
      </div>

      {/* flechas de página */}
      <button
        onClick={() => onGoToPage(pageIdx - 1)}
        disabled={pageIdx <= 0}
        aria-label="Página anterior"
        className="group absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-card/90 p-2.5 text-ink-soft shadow-md transition-all hover:-translate-x-0.5 hover:border-teal-500 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-0 md:block"
      >
        <IcChevL className="h-5 w-5" />
      </button>
      <button
        onClick={() => onGoToPage(pageIdx + 1)}
        disabled={pageIdx >= total - 1}
        aria-label="Página siguiente"
        className="group absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-card/90 p-2.5 text-ink-soft shadow-md transition-all hover:translate-x-0.5 hover:border-teal-500 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-0 md:block"
      >
        <IcChevR className="h-5 w-5" />
      </button>
    </div>
  );
}
