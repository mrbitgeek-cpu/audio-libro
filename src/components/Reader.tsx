import { useEffect, useMemo, useRef, useState } from "react";
import type { Book } from "../lib/types";
import { useSpeech } from "../hooks/useSpeech";
import { formatClock } from "../lib/text";
import PageSheet from "./PageSheet";
import Waveform from "./Waveform";
import Dropzone, { FileBadge } from "./Dropzone";
import {
  LogoMark,
  IconPlay,
  IconPause,
  IconPrev,
  IconNext,
  IconRestart,
  IconX,
  IconChevL,
  IconChevR,
  IconFilter,
  IconAlert,
  IconClock,
  IconWave,
  IconSpeaker,
} from "./icons";

interface Props {
  book: Book;
  onClose: () => void;
  onFile: (f: File) => void;
}

export default function Reader({ book, onClose, onFile }: Props) {
  const engine = useSpeech(book);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const totalPages = book.pages.length;
  const pageIndex = Math.min(engine.pos.page, totalPages - 1);
  const page = book.pages[pageIndex];
  const chapter =
    book.chapters.find((c) => pageIndex >= c.startPage && pageIndex <= c.endPage) ??
    book.chapters[0];

  const currentSentence =
    page && engine.pos.sentence < page.sentences.length
      ? page.sentences[engine.pos.sentence]
      : "";

  const goPage = (p: number) => {
    const clamped = Math.max(0, Math.min(p, totalPages - 1));
    if (clamped === pageIndex) return;
    setDir(clamped > pageIndex ? "next" : "prev");
    engine.seekPage(clamped);
  };

  const engineRef = useRef(engine);
  engineRef.current = engine;
  const goPageRef = useRef(goPage);
  goPageRef.current = goPage;

  // atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const eng = engineRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        eng.toggle();
      } else if (e.key === "ArrowRight") {
        goPageRef.current(eng.pos.page + 1);
      } else if (e.key === "ArrowLeft") {
        goPageRef.current(eng.pos.page - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        eng.setRate(eng.rate + 0.1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        eng.setRate(eng.rate - 0.1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // palabras restantes y tiempo estimado
  const remaining = useMemo(() => {
    let words = 0;
    for (let i = pageIndex; i < totalPages; i++) words += book.pages[i].words;
    if (page && page.sentences.length)
      words -= page.words * (engine.pos.sentence / page.sentences.length);
    const totalSec = book.totalWords / (2.75 * engine.rate);
    return { leftSec: words / (2.75 * engine.rate), totalSec };
  }, [pageIndex, engine.pos.sentence, engine.rate, book, totalPages, page]);

  const progress = totalPages > 1 ? pageIndex / (totalPages - 1) : 1;
  const esVoices = engine.voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const otherVoices = engine.voices.filter((v) => !v.lang.toLowerCase().startsWith("es"));
  const activeVoice = engine.voices.find((v) => v.voiceURI === engine.voiceURI);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
      {/* cabecera */}
      <header className="relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-panel/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber/12 text-amber ring-1 ring-amber/30">
            <LogoMark size={18} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[15px] font-bold text-snow">
              {book.title}
            </p>
            <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog">
              {book.author ? `${book.author} · ` : ""}
              {book.source === "sample" ? "muestra" : book.source} · {book.pages.length} páginas
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden sm:block">
            <FileBadge name={book.fileName} />
          </span>
          <Dropzone onFile={onFile} compact />
          <button
            onClick={onClose}
            title="Volver al inicio"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-fog transition-all hover:border-ember/60 hover:text-ember"
          >
            <IconX size={15} />
          </button>
        </div>
        {/* barra de progreso de lectura */}
        <div className="absolute inset-x-0 bottom-0 h-[2.5px] overflow-hidden rounded-b-md bg-ink2">
          <div
            className="h-full bg-gradient-to-r from-amber to-amber2 transition-[width] duration-500 ease-out"
            style={{ width: `${(pageIndex + 1) / totalPages * 100}%` }}
          />
        </div>
      </header>

      <main className="mt-5 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* columna de la página */}
        <section className="flex min-w-0 flex-col">
          <div className="relative flex-1">
            {/* flechas laterales */}
            <button
              onClick={() => goPage(pageIndex - 1)}
              disabled={pageIndex === 0}
              aria-label="Página anterior"
              className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel text-fog shadow-xl transition-all hover:-translate-x-0.5 hover:border-amber/60 hover:text-amber disabled:pointer-events-none disabled:opacity-0 sm:flex lg:-left-5"
            >
              <IconChevL size={20} />
            </button>
            <button
              onClick={() => goPage(pageIndex + 1)}
              disabled={pageIndex === totalPages - 1}
              aria-label="Página siguiente"
              className="absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel text-fog shadow-xl transition-all hover:translate-x-0.5 hover:border-amber/60 hover:text-amber disabled:pointer-events-none disabled:opacity-0 sm:flex lg:-right-5"
            >
              <IconChevR size={20} />
            </button>

            <div className="h-[min(66vh,640px)] min-h-[440px]">
              {page && (
                <PageSheet
                  page={page}
                  pageIndex={pageIndex}
                  totalPages={totalPages}
                  chapterTitle={chapter?.title ?? book.title}
                  pos={engine.pos}
                  status={engine.status}
                  dir={dir}
                  onSeekSentence={(s) => engine.seekSentence(pageIndex, s)}
                />
              )}
            </div>
          </div>

          {/* scruber + tiempo */}
          <div className="mt-4 rounded-md border border-line bg-panel/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] tabular-nums text-fog">
                {String(pageIndex + 1).padStart(2, "0")}
              </span>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, totalPages - 1)}
                  value={pageIndex}
                  onChange={(e) => goPage(parseInt(e.target.value, 10))}
                  className="scrub w-full"
                  style={{ ["--fill" as string]: `${progress * 100}%` }}
                  aria-label="Ir a la página"
                />
                {/* marcas de capítulo */}
                {book.chapters.length > 1 &&
                  book.chapters.map(
                    (c, i) =>
                      i > 0 && (
                        <span
                          key={c.title + i}
                          title={c.title}
                          className="pointer-events-none absolute top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-full bg-amber/70"
                          style={{ left: `${(c.startPage / Math.max(1, totalPages - 1)) * 100}%` }}
                        />
                      )
                  )}
              </div>
              <span className="font-mono text-[11px] tabular-nums text-fog">
                {String(totalPages).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-fog">
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={13} className="text-amber" />
                queda ≈ {formatClock(remaining.leftSec)}
                <span className="text-fog/60">· total ≈ {formatClock(remaining.totalSec)}</span>
              </span>
              <span className="hidden truncate sm:inline">
                {engine.status !== "idle" && currentSentence
                  ? `frase ${engine.pos.sentence + 1}/${page?.sentences.length ?? 0}`
                  : "pulsa reproducir o haz clic en una frase"}
              </span>
            </div>
          </div>
        </section>

        {/* panel lateral */}
        <aside className="dark-scroll flex flex-col gap-3.5 lg:max-h-[calc(66vh+96px)] lg:overflow-y-auto lg:pr-1">
          {/* ahora escuchando */}
          <div className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                ahora escuchando
              </p>
              <Waveform status={engine.status} bars={14} className="h-4" />
            </div>
            <p
              className={`mt-2.5 min-h-[64px] font-display text-[15px] font-medium leading-snug ${
                engine.status === "idle" && !currentSentence
                  ? "italic text-fog"
                  : "text-snow"
              }`}
            >
              {currentSentence ||
                (engine.atEnd
                  ? "Fin de la última página."
                  : "En silencio… por ahora. Pulsa reproducir para empezar.")}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-fog">
              {chapter ? chapter.title : ""} · pág. {pageIndex + 1}
            </p>
          </div>

          {/* transporte */}
          <div className="rounded-md border border-line bg-panel p-4">
            {!engine.supported && (
              <div className="mb-3 flex items-start gap-2 rounded-sm border border-ember/40 bg-ember/10 p-2.5 text-[12px] leading-snug text-ember">
                <IconAlert size={15} className="mt-0.5 shrink-0" />
                Tu navegador no expone síntesis de voz; el lector sigue funcionando como visor.
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  engine.seekPage(0);
                  engine.play({ page: 0, sentence: 0 });
                }}
                title="Reiniciar lectura"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fog transition-all hover:border-amber/50 hover:text-amber active:scale-90"
              >
                <IconRestart size={17} />
              </button>
              <button
                onClick={() => goPage(pageIndex - 1)}
                title="Página anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog transition-all hover:border-amber/50 hover:text-amber active:scale-90"
              >
                <IconPrev size={18} />
              </button>
              <div className="relative">
                {engine.status === "playing" && (
                  <span className="ring-pulse absolute inset-0 rounded-full border-2 border-amber/50" />
                )}
                <button
                  onClick={engine.toggle}
                  title={engine.status === "playing" ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber text-ink shadow-[0_10px_35px_-8px_rgba(237,164,62,0.7)] transition-all hover:scale-105 hover:bg-amber2 active:scale-95"
                >
                  {engine.status === "playing" ? (
                    <IconPause size={24} />
                  ) : (
                    <IconPlay size={26} className="translate-x-0.5" />
                  )}
                </button>
              </div>
              <button
                onClick={() => goPage(pageIndex + 1)}
                title="Página siguiente"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-fog transition-all hover:border-amber/50 hover:text-amber active:scale-90"
              >
                <IconNext size={18} />
              </button>
              <button
                onClick={engine.stop}
                title="Detener"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fog transition-all hover:border-ember/50 hover:text-ember active:scale-90"
              >
                <span className="h-3 w-3 rounded-[2px] bg-current" />
              </button>
            </div>

            {/* pase automático */}
            <button
              onClick={() => engine.setAutoAdvance(!engine.autoAdvance)}
              className={`mt-4 flex w-full items-center justify-between rounded-sm border px-3 py-2.5 text-left transition-all ${
                engine.autoAdvance
                  ? "border-amber/40 bg-amber/[0.07]"
                  : "border-line bg-ink2 hover:border-fog/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <IconSpeaker size={16} className={engine.autoAdvance ? "text-amber" : "text-fog"} />
                <span>
                  <span className="block text-[13px] font-bold text-snow">Pase automático</span>
                  <span className="block text-[11px] text-fog">
                    la hoja avanza al terminar de leerse
                  </span>
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  engine.autoAdvance ? "bg-amber" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${
                    engine.autoAdvance ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          {/* voz y ritmo */}
          <div className="rounded-md border border-line bg-panel p-4">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
              <IconWave size={13} /> voz y ritmo
            </p>
            <label className="mt-3 block">
              <span className="text-[11px] font-bold text-fog">Voz del navegador</span>
              <select
                value={engine.voiceURI ?? ""}
                onChange={(e) => engine.setVoiceURI(e.target.value || null)}
                className="mt-1.5 w-full cursor-pointer rounded-sm border border-line bg-ink2 px-2.5 py-2 text-[13px] text-snow outline-none transition-colors focus:border-amber/60"
              >
                {engine.voices.length === 0 && (
                  <option value="">(cargando voces del sistema…)</option>
                )}
                {esVoices.length > 0 && (
                  <optgroup label="Español">
                    {esVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} · {v.lang}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="Otros idiomas">
                    {otherVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} · {v.lang}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {activeVoice && !activeVoice.lang.toLowerCase().startsWith("es") && (
                <span className="mt-1 block text-[11px] text-amber2">
                  La voz elegida no es española; la pronunciación puede resentirse.
                </span>
              )}
            </label>
            <label className="mt-3.5 block">
              <span className="flex items-center justify-between text-[11px] font-bold text-fog">
                Velocidad de lectura
                <span className="font-mono text-[12px] text-amber2">
                  {engine.rate.toFixed(1)}×
                </span>
              </span>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.1}
                value={engine.rate}
                onChange={(e) => engine.setRate(parseFloat(e.target.value))}
                className="scrub mt-2 w-full"
                style={{
                  ["--fill" as string]: `${((engine.rate - 0.6) / 1.0) * 100}%`,
                }}
              />
              <span className="mt-1 flex justify-between font-mono text-[9.5px] text-fog/70">
                <span>pausada 0.6×</span>
                <span>normal 1.0×</span>
                <span>ligera 1.6×</span>
              </span>
            </label>
          </div>

          {/* limpieza */}
          <div className="rounded-md border border-line bg-panel p-4">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
              <IconFilter size={13} /> limpieza del guion
            </p>
            {book.removedCount > 0 ? (
              <>
                <p className="mt-2.5 text-[13px] leading-relaxed text-fog">
                  <strong className="font-display text-xl font-extrabold text-moss">
                    {book.removedCount}
                  </strong>{" "}
                  elemento{book.removedCount > 1 ? "s" : ""} apartado
                  {book.removedCount > 1 ? "s" : ""} del audio: notas al pie, folios, encabezados e
                  índices.
                </p>
                {page && page.removed.length > 0 && (
                  <p className="mt-2 rounded-sm bg-ink2 px-2.5 py-1.5 text-[11.5px] text-fog">
                    En esta página:{" "}
                    <span className="font-bold text-amber2">{page.removed.length}</span> — usa el
                    botón del pie de la hoja para verlos.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2.5 text-[13px] leading-relaxed text-fog">
                El filtro no encontró notas al pie, folios ni encabezados que apartar en este
                documento. Todo el texto extraído forma parte del guion.
              </p>
            )}
          </div>

          {/* estadísticas */}
          <div className="grid grid-cols-3 divide-x divide-line rounded-md border border-line bg-panel text-center">
            {[
              [book.totalWords.toLocaleString("es"), "palabras"],
              [String(book.pages.length), "páginas"],
              [String(book.chapters.length), book.chapters.length === 1 ? "sección" : "capítulos"],
            ].map(([v, l]) => (
              <div key={l} className="px-2 py-3">
                <p className="font-display text-lg font-extrabold text-snow">{v}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-fog">{l}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
