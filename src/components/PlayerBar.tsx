import { useEffect, useRef, useState } from "react";
import type { BuiltBook } from "../lib/types";
import type { SpeechEngine } from "../hooks/useSpeech";
import {
  IcClock,
  IcNext,
  IcPause,
  IcPlay,
  IcPrev,
  IcStop,
} from "./icons";

interface Props {
  speech: SpeechEngine;
  built: BuiltBook;
  pageIdx: number;
  onToggle: () => void;
}

const RATES = [0.8, 1, 1.25, 1.5];
const TIMER_OPTS = [10, 20, 30, 45, 60];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export default function PlayerBar({ speech, built, pageIdx, onToggle }: Props) {
  const { status, index } = speech;
  const total = built.sentences.length;
  const current = index >= 0 && index < total ? built.sentences[index] : null;
  const progressRef = useRef<HTMLDivElement>(null);

  const [timerMin, setTimerMin] = useState(0);
  const [leftSec, setLeftSec] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const stopRef = useRef(speech.stop);
  stopRef.current = speech.stop;

  /* temporizador de sueño */
  useEffect(() => {
    if (!timerMin) return;
    const end = Date.now() + timerMin * 60_000;
    setLeftSec(timerMin * 60);
    const iv = window.setInterval(() => {
      const l = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeftSec(l);
      if (l <= 0) {
        window.clearInterval(iv);
        setTimerMin(0);
        stopRef.current();
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [timerMin]);

  const seekFromClick = (e: React.MouseEvent) => {
    const el = progressRef.current;
    if (!el || total === 0) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    speech.seek(Math.round(f * (total - 1)));
  };

  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;
  const playing = status === "playing";

  return (
    <div className="relative z-20 border-t border-pine-800 bg-pine-950 text-fern shadow-[0_-10px_30px_rgba(10,20,17,0.25)]">
      {/* barra de progreso */}
      <div
        ref={progressRef}
        onClick={seekFromClick}
        role="slider"
        aria-label="Progreso de lectura"
        aria-valuenow={pct}
        className="group h-2.5 cursor-pointer bg-pine-900"
      >
        <div
          className="relative h-full bg-gradient-to-r from-teal-500 to-gold-400 transition-[width] duration-300 ease-out"
          style={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }}
        >
          <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-gold-300 opacity-0 shadow transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 md:px-5">
        {/* transporte */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => speech.seek(index - 1)}
            disabled={index <= 0}
            title="Frase anterior (Shift+←)"
            className="rounded-full p-2 text-moss transition-all hover:bg-pine-800 hover:text-fern active:scale-90 disabled:opacity-30"
          >
            <IcPrev className="h-5 w-5" />
          </button>
          <button
            onClick={onToggle}
            title={playing ? "Pausa (Espacio)" : "Reproducir (Espacio)"}
            className={`grid h-11 w-11 place-items-center rounded-full shadow-lg transition-all duration-200 active:scale-90 ${
              playing
                ? "bg-gold-400 text-pine-950 shadow-gold-400/30 hover:bg-gold-300"
                : "bg-teal-500 text-fern shadow-teal-500/30 hover:bg-teal-400"
            }`}
          >
            {playing ? <IcPause className="h-5 w-5" /> : <IcPlay className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              speech.stop();
              setTimerMin(0);
            }}
            disabled={status === "idle" && index < 0}
            title="Detener"
            className="rounded-full p-2 text-moss transition-all hover:bg-pine-800 hover:text-fern active:scale-90 disabled:opacity-30"
          >
            <IcStop className="h-5 w-5" />
          </button>
          <button
            onClick={() => speech.seek(index + 1)}
            disabled={index >= total - 1}
            title="Frase siguiente (Shift+→)"
            className="rounded-full p-2 text-moss transition-all hover:bg-pine-800 hover:text-fern active:scale-90 disabled:opacity-30"
          >
            <IcNext className="h-5 w-5" />
          </button>
        </div>

        {/* ecualizador + frase actual */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`eq flex h-6 shrink-0 items-end gap-[3px] ${
              playing ? "" : status === "paused" ? "eq-paused" : "eq-idle"
            }`}
            aria-hidden
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-teal-300">
              {playing
                ? `Escuchando · pág. ${pageIdx + 1}`
                : status === "paused"
                  ? "En pausa"
                  : index >= 0
                    ? "Listo para seguir"
                    : "Pulsa play para escuchar"}
            </p>
            <p className="truncate font-body text-[13px] italic text-fern/75">
              {current ? current.text : "La frase activa aparecerá aquí mientras lees."}
            </p>
          </div>
        </div>

        {/* contador */}
        <p className="hidden font-display text-[12px] font-semibold tabular-nums text-moss sm:block">
          frase {Math.max(index + 1, 0)} / {total}
          <span className="ml-2 text-gold-300">{pct}%</span>
        </p>

        {/* velocidad rápida */}
        <div className="flex items-center rounded-full border border-pine-700 p-0.5">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => speech.setRate(r)}
              className={`rounded-full px-2.5 py-1 font-display text-[11px] font-bold transition-all ${
                Math.abs(speech.rate - r) < 0.011
                  ? "bg-teal-500 text-fern shadow"
                  : "text-moss hover:text-fern"
              }`}
              title={`Velocidad ${r}×`}
            >
              {r}×
            </button>
          ))}
        </div>

        {/* temporizador */}
        <div className="relative">
          <button
            onClick={() => setTimerOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[11.5px] font-bold transition-all ${
              timerMin
                ? "border-gold-400 bg-gold-400/15 text-gold-300"
                : "border-pine-700 text-moss hover:border-teal-500 hover:text-fern"
            }`}
            title="Temporizador de sueño"
          >
            <IcClock className="h-4 w-4" />
            {timerMin ? fmt(leftSec) : "Temporizador"}
          </button>
          {timerOpen && (
            <div className="pop-in absolute bottom-full right-0 z-30 mb-2 w-40 overflow-hidden rounded-lg border border-pine-700 bg-pine-900 shadow-xl">
              <button
                onClick={() => {
                  setTimerMin(0);
                  setTimerOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left font-display text-[12px] font-semibold transition-colors hover:bg-pine-800 ${
                  !timerMin ? "text-gold-300" : "text-fern"
                }`}
              >
                Desactivado
              </button>
              {TIMER_OPTS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setTimerMin(m);
                    setTimerOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left font-display text-[12px] font-semibold transition-colors hover:bg-pine-800 ${
                    timerMin === m ? "text-gold-300" : "text-fern"
                  }`}
                >
                  Dentro de {m} min
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
