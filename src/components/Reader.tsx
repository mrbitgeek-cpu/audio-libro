import { useEffect, useRef } from "react";
import type { Book, BuiltBook, Sentence } from "../lib/types";
import type { SpeechStatus } from "../hooks/useSpeech";
import { IcChevL, IcChevR } from "./icons";

interface Props {
  book: Book;
  built: BuiltBook;
  pageIdx: number;
  onGoToPage: (p: number) => void;
  activeSentence: number;
  onSeekSentence: (globalIdx: number) => void;
  status: SpeechStatus;
  follow: boolean;
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
}: Props) {
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
      <div ref={scrollRef} className="scroll-slim h-full overflow-y-auto px-4 py-6 md:px-10">
        <article
          key={pageIdx}
          className="page-in paper-sheet mx-auto max-w-[720px] border border-line bg-card px-6 py-10 shadow-[0_18px_50px_-18px_rgba(23,28,26,0.35)] sm:px-10 md:px-14 md:py-14"
        >
          {/* cabecera de página */}
          <header className="mb-8 flex items-center gap-4">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-teal-600">
              Página {pageIdx + 1}
            </span>
            <span className="h-px flex-1 bg-line" />
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
