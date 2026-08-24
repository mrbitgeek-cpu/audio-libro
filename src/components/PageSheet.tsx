import { useEffect, useRef, useState } from "react";
import type { Page, Position, SpeechStatus } from "../lib/types";
import { IconFootnote, IconX } from "./icons";

interface Props {
  page: Page;
  pageIndex: number;
  totalPages: number;
  chapterTitle: string;
  pos: Position;
  status: SpeechStatus;
  dir: "next" | "prev";
  onSeekSentence: (sentence: number) => void;
}

export default function PageSheet({
  page,
  pageIndex,
  pos,
  totalPages,
  chapterTitle,
  status,
  dir,
  onSeekSentence,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const isCurrentPage = pos.page === pageIndex;

  // autoscroll hacia la oración activa
  useEffect(() => {
    if (!isCurrentPage) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-sent="${pos.sentence}"]`
    );
    if (el && scrollRef.current) {
      const top = el.offsetTop - scrollRef.current.clientHeight * 0.35;
      scrollRef.current.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [pos.sentence, isCurrentPage]);

  useEffect(() => {
    setShowRemoved(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pageIndex]);

  return (
    <div
      key={page.id}
      className={`paper-grain relative flex h-full flex-col rounded-sm bg-paper text-pencil shadow-[0_35px_80px_-24px_rgba(0,0,0,0.75)] ring-1 ring-black/25 ${
        dir === "next" ? "page-turn-next" : "page-turn-prev"
      }`}
    >
      {/* cabecera de la hoja */}
      <div className="flex items-center justify-between border-b border-pencil/12 px-7 pb-2.5 pt-5">
        <span className="max-w-[70%] truncate font-mono text-[9.5px] uppercase tracking-[0.22em] text-pencil2">
          {chapterTitle}
        </span>
        <span className="font-mono text-[10.5px] text-pencil2">
          {pageIndex + 1} / {totalPages}
        </span>
      </div>

      {/* cuerpo */}
      <div ref={scrollRef} className="paper-scroll relative flex-1 overflow-y-auto px-7 py-5 sm:px-9">
        {page.paragraphs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <IconFootnote size={26} className="text-pencil2/50" />
            <p className="font-display text-lg font-bold text-pencil2">Página sin texto narrativo</p>
            <p className="max-w-[260px] text-[13px] leading-relaxed text-pencil2/80">
              Esta hoja solo contenía material de referencia y se omitió del guion hablado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {page.paragraphs.map((p, pi) => {
              const sents = page.sentences.slice(p.s0, p.s1);
              const firstBody = page.paragraphs.findIndex((q) => !q.heading) === pi;
              return p.heading ? (
                <h3
                  key={pi}
                  className="pt-2 font-display text-[22px] font-bold leading-snug tracking-tight text-pencil"
                >
                  {sents.map((s, si) => {
                    const gi = p.s0 + si;
                    return (
                      <SentSpan
                        key={si}
                        gi={gi}
                        s={s}
                        isCurrentPage={isCurrentPage}
                        current={isCurrentPage && pos.sentence === gi}
                        spoken={isCurrentPage && pos.sentence > gi}
                        onClick={onSeekSentence}
                      />
                    );
                  })}
                </h3>
              ) : (
                <p
                  key={pi}
                  className={`text-[15.5px] leading-[1.78] text-pencil/95 ${firstBody ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[42px] first-letter:font-extrabold first-letter:leading-[0.85] first-letter:text-amber" : ""}`}
                >
                  {sents.map((s, si) => {
                    const gi = p.s0 + si;
                    return (
                      <SentSpan
                        key={si}
                        gi={gi}
                        s={s}
                        isCurrentPage={isCurrentPage}
                        current={isCurrentPage && pos.sentence === gi}
                        spoken={isCurrentPage && pos.sentence > gi}
                        onClick={onSeekSentence}
                      />
                    );
                  })}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* pie de la hoja: omisiones */}
      <div className="relative flex items-center justify-between border-t border-pencil/12 px-7 py-2.5">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-pencil2/80">
          {status === "playing" && isCurrentPage ? "▸ leyendo en voz alta" : "voz de página"}
        </span>
        {page.removed.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowRemoved((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                showRemoved
                  ? "border-amber bg-amber/15 text-amber"
                  : "border-pencil/20 text-pencil2 hover:border-amber/60 hover:text-amber"
              }`}
            >
              <IconFootnote size={12} />
              {page.removed.length} omitido{page.removed.length > 1 ? "s" : ""}
            </button>
            {showRemoved && (
              <div className="toast-in absolute bottom-9 right-0 z-20 w-72 rounded-md border border-line bg-ink2 p-3 text-left shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
                    apartado del audio
                  </p>
                  <button onClick={() => setShowRemoved(false)} className="text-fog hover:text-snow">
                    <IconX size={13} />
                  </button>
                </div>
                <ul className="dark-scroll mt-2 max-h-44 space-y-1.5 overflow-y-auto">
                  {page.removed.map((r, i) => (
                    <li
                      key={i}
                      className="rounded-sm bg-panel px-2 py-1.5 text-[11.5px] leading-snug text-fog line-through decoration-ember/70 decoration-[1.5px]"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* esquina doblada */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-8 w-8">
        <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[30px] border-l-[30px] border-b-black/15 border-l-transparent" />
        <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[27px] border-l-[27px] border-b-paper2 border-l-transparent" />
      </div>
    </div>
  );
}

function SentSpan({
  gi,
  s,
  current,
  spoken,
  isCurrentPage,
  onClick,
}: {
  gi: number;
  s: string;
  current: boolean;
  spoken: boolean;
  isCurrentPage: boolean;
  onClick: (gi: number) => void;
}) {
  return (
    <span
      data-sent={gi}
      onClick={() => isCurrentPage && onClick(gi)}
      title={isCurrentPage ? "Reproducir desde aquí" : undefined}
      className={`${current ? "hl-sentence" : ""} ${spoken ? "spoken-sentence" : ""} ${
        isCurrentPage ? "cursor-pointer" : ""
      } transition-colors duration-200`}
    >
      {s}{" "}
    </span>
  );
}
