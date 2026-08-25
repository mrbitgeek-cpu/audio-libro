import { useCallback, useEffect, useRef, useState } from "react";
import {
  FX_LIST,
  buildGraph,
  encodeWav,
  fxDef,
  makePeaks,
  renderWithFx,
  type FxId,
} from "../lib/audiofx";
import {
  IcChevL,
  IcDownload,
  IcMic,
  IcPlay,
  IcStop,
  IcTrash,
  IcWave,
} from "./icons";

interface Take {
  id: string;
  name: string;
  buffer: AudioBuffer;
  duration: number;
  peaks: number[];
  fx: FxId;
}

interface Props {
  onBack: () => void;
}

function fmtRec(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const d = Math.floor((ms % 1000) / 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${d}`;
}

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Wave({ peaks, active }: { peaks: number[]; active: boolean }) {
  const n = peaks.length;
  return (
    <svg
      viewBox={`0 0 ${n * 3} 40`}
      preserveAspectRatio="none"
      className={`h-11 w-full transition-colors duration-300 ${
        active ? "text-gold-400" : "text-teal-400/55"
      }`}
      aria-hidden
    >
      {peaks.map((p, i) => {
        const h = Math.max(2, p * 38);
        return (
          <rect
            key={i}
            x={i * 3}
            y={(40 - h) / 2}
            width={2}
            height={h}
            rx={1}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

export default function Studio({ onBack }: Props) {
  const [phase, setPhase] = useState<"idle" | "recording">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [playing, setPlaying] = useState<{ takeId: string; fx: FxId } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [busyDownload, setBusyDownload] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const startedAtRef = useRef(0);
  const counterRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef<HTMLDivElement | null>(null);
  const playSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const takesRef = useRef(takes);
  takesRef.current = takes;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }, []);

  /* ---------- osciloscopio ---------- */
  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = "rgba(108,201,172,0.25)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, canvas.height / 2);
    g.lineTo(canvas.width, canvas.height / 2);
    g.stroke();
  }, []);

  useEffect(() => {
    drawIdle();
  }, [drawIdle, phase]);

  const loopRef = useRef<() => void>(() => {});
  loopRef.current = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);

    g.strokeStyle = "rgba(108,201,172,0.14)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, H / 2);
    g.lineTo(W, H / 2);
    g.stroke();

    g.strokeStyle = "#6cc9ac";
    g.lineWidth = 2.4;
    g.shadowColor = "rgba(108,201,172,0.7)";
    g.shadowBlur = 8;
    const step = W / data.length;
    g.beginPath();
    for (let i = 0; i < data.length; i++) {
      const y = (data[i] / 255) * H;
      if (i === 0) g.moveTo(0, y);
      else g.lineTo(i * step, y);
    }
    g.stroke();
    g.shadowBlur = 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const d = (data[i] - 128) / 128;
      sum += d * d;
    }
    const rms = Math.sqrt(sum / data.length);
    if (levelRef.current) {
      levelRef.current.style.width = `${Math.min(100, rms * 260)}%`;
    }
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  };

  /* ---------- grabación ---------- */
  const finalize = useCallback(
    async (mime: string) => {
      window.clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (levelRef.current) levelRef.current.style.width = "0%";
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      if (!blob.size) return;
      try {
        const ctx = getCtx();
        const ab = await blob.arrayBuffer();
        const buffer = await ctx.decodeAudioData(ab);
        counterRef.current++;
        const take: Take = {
          id: `t${Date.now().toString(36)}`,
          name: `Toma ${counterRef.current}`,
          buffer,
          duration: buffer.duration,
          peaks: makePeaks(buffer, 72),
          fx: "normal",
        };
        setTakes((ts) => [take, ...ts]);
      } catch {
        setMicError("La grabación no se pudo decodificar. Prueba de nuevo.");
      }
    },
    [getCtx]
  );

  const startRecording = useCallback(async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("Este navegador no permite grabar audio. Prueba con Chrome, Edge o Safari recientes.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const ctx = getCtx();
      await ctx.resume();
      const srcNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      srcNode.connect(analyser);
      analyserRef.current = analyser;

      const mime =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/mpeg"].find(
          (m) => MediaRecorder.isTypeSupported(m)
        ) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      const chosen = rec.mimeType || mime || "audio/webm";
      rec.onstop = () => void finalize(chosen);
      rec.start(250);
      recRef.current = rec;

      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => setElapsed(Date.now() - startedAtRef.current), 100);
      rafRef.current = requestAnimationFrame(() => loopRef.current());
    } catch {
      setMicError(
        "No se pudo acceder al micrófono. Revisa el permiso del navegador (icono de candado o micrófono en la barra de direcciones) y la entrada de audio del sistema."
      );
    }
  }, [finalize, getCtx]);

  const stopRecording = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    window.clearInterval(timerRef.current);
    setPhase("idle");
  }, []);

  /* ---------- reproducción con efectos ---------- */
  const stopPlayback = useCallback(() => {
    const src = playSrcRef.current;
    playSrcRef.current = null;
    if (src) {
      try {
        src.stop();
      } catch {
        /* ya detenida */
      }
      src.onended = null;
    }
    setPlaying(null);
  }, []);

  const playTake = useCallback(
    (take: Take) => {
      stopPlayback();
      const ctx = getCtx();
      void ctx.resume();
      const src = buildGraph(ctx, take.buffer, take.fx);
      playSrcRef.current = src;
      setPlaying({ takeId: take.id, fx: take.fx });
      src.onended = () => {
        if (playSrcRef.current === src) {
          playSrcRef.current = null;
          setPlaying(null);
        }
      };
      src.start();
    },
    [getCtx, stopPlayback]
  );

  const toggleTake = useCallback(
    (take: Take) => {
      if (playingRef.current?.takeId === take.id) stopPlayback();
      else playTake(take);
    },
    [playTake, stopPlayback]
  );

  const setTakeFx = useCallback(
    (takeId: string, fx: FxId) => {
      setTakes((ts) => ts.map((t) => (t.id === takeId ? { ...t, fx } : t)));
      const take = takesRef.current.find((t) => t.id === takeId);
      if (!take) return;
      if (playingRef.current?.takeId === takeId) {
        playTake({ ...take, fx }); /* cambia el efecto en caliente */
      }
    },
    [playTake]
  );

  const downloadTake = useCallback(
    async (take: Take) => {
      setBusyDownload(take.id);
      try {
        const rendered = await renderWithFx(take.buffer, take.fx);
        const blob = encodeWav(rendered);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vozalta-${take.name.toLowerCase().replace(/\s+/g, "-")}-${take.fx}.wav`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch {
        setMicError("No se pudo exportar la toma a WAV.");
      }
      setBusyDownload(null);
    },
    []
  );

  const deleteTake = useCallback(
    (id: string) => {
      if (playingRef.current?.takeId === id) stopPlayback();
      setTakes((ts) => ts.filter((t) => t.id !== id));
    },
    [stopPlayback]
  );

  /* ---------- teclado y limpieza ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      } else if (e.code === "Space") {
        e.preventDefault();
        if (phaseRef.current === "recording") stopRecording();
        else void startRecording();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, startRecording, stopRecording]);

  useEffect(
    () => () => {
      window.clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      const rec = recRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* sin efecto */
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close().catch(() => undefined);
    },
    []
  );

  const recording = phase === "recording";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-pine-950 text-fern">
      {/* cabecera del estudio */}
      <div className="z-10 flex items-center gap-3 border-b border-pine-800 px-4 py-3 md:px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full border border-pine-700 px-3 py-1.5 font-display text-[12px] font-bold text-moss transition-all hover:border-teal-500 hover:text-fern active:scale-95"
          title="Volver al lector (Esc)"
        >
          <IcChevL className="h-4 w-4" />
          <span className="hidden sm:inline">Volver al lector</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[17px] font-bold uppercase tracking-[0.14em] md:text-lg">
            Estudio de voz
          </h1>
          <p className="truncate font-body text-[12px] italic text-moss">
            Graba tu narración y escúchala con efectos · Espacio graba, Esc vuelve
          </p>
        </div>
        <span className="rounded-full border border-pine-700 px-3 py-1 font-display text-[12px] font-bold tabular-nums text-gold-300">
          {takes.length} {takes.length === 1 ? "toma" : "tomas"}
        </span>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6 lg:grid-cols-[380px_1fr]">
          {/* ---------- grabadora ---------- */}
          <section className="relative h-fit overflow-hidden border border-pine-700 bg-pine-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            <span className="absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-gold-400/60" aria-hidden />
            <span className="absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-gold-400/60" aria-hidden />
            <span className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-gold-400/60" aria-hidden />
            <span className="absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-gold-400/60" aria-hidden />

            <div className="px-6 pb-7 pt-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-moss">
                  Grabadora
                </p>
                <span
                  className={`flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    recording ? "text-[#e06a55]" : "text-moss/60"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      recording ? "animate-pulse bg-[#e06a55]" : "bg-pine-600"
                    }`}
                  />
                  {recording ? "REC" : "Listo"}
                </span>
              </div>

              {/* osciloscopio */}
              <div className="mt-4 overflow-hidden rounded-md border border-pine-700 bg-pine-950/80">
                <canvas ref={canvasRef} width={640} height={130} className="h-[104px] w-full" />
              </div>

              {/* nivel */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pine-800">
                <div
                  ref={levelRef}
                  className="h-full w-0 rounded-full bg-gradient-to-r from-teal-400 via-gold-400 to-[#e06a55] transition-[width] duration-75"
                />
              </div>

              {/* temporizador + botón */}
              <div className="mt-5 flex items-center gap-6">
                <div className="relative">
                  {recording && (
                    <>
                      <span className="pulse-ring absolute inset-0 rounded-full border-2 border-[#e06a55]/50" aria-hidden />
                      <span
                        className="pulse-ring absolute inset-0 rounded-full border-2 border-[#e06a55]/30"
                        style={{ animationDelay: "0.6s" }}
                        aria-hidden
                      />
                    </>
                  )}
                  <button
                    onClick={() => (recording ? stopRecording() : void startRecording())}
                    aria-label={recording ? "Detener grabación" : "Empezar a grabar"}
                    className={`relative grid h-20 w-20 place-items-center rounded-full shadow-xl transition-all duration-200 active:scale-90 ${
                      recording
                        ? "bg-[#e06a55] text-pine-950 shadow-[0_10px_30px_rgba(224,106,85,0.4)] hover:bg-[#e97f6c]"
                        : "bg-teal-500 text-fern shadow-[0_10px_30px_rgba(47,168,132,0.35)] hover:bg-teal-400"
                    }`}
                  >
                    {recording ? <IcStop className="h-8 w-8" /> : <IcMic className="h-8 w-8" />}
                  </button>
                </div>
                <div>
                  <p className="font-display text-4xl font-extrabold tabular-nums tracking-tight text-gold-300">
                    {fmtRec(elapsed)}
                  </p>
                  <p className="mt-1 font-body text-[12.5px] italic leading-snug text-moss">
                    {recording
                      ? "Lee en voz alta; pulsa para terminar la toma."
                      : "Pulsa el micrófono (o Espacio) y empieza a hablar."}
                  </p>
                </div>
              </div>

              {micError && (
                <p className="mt-4 border border-[#e06a55]/40 bg-[#3a1a14] px-3 py-2.5 font-body text-[12.5px] leading-snug text-[#f2c2b7]">
                  {micError}
                </p>
              )}

              <p className="mt-5 border-t border-pine-800 pt-3 font-body text-[11.5px] italic text-moss/80">
                El audio se procesa en tu equipo; nada se sube a ningún servidor.
              </p>
            </div>
          </section>

          {/* ---------- tomas ---------- */}
          <section className="min-h-0">
            {takes.length === 0 ? (
              <div className="grid h-full min-h-[220px] place-items-center border-2 border-dashed border-pine-700 px-6 py-10 text-center">
                <div>
                  <IcWave className="mx-auto h-9 w-9 text-pine-600" />
                  <p className="mt-3 font-display text-[15px] font-bold text-moss">Aún no hay tomas</p>
                  <p className="mx-auto mt-1 max-w-xs font-body text-[13px] italic leading-relaxed text-moss/70">
                    Graba tu voz y podrás escucharla con eco, catedral, ardilla, gigante, robot y más.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {takes.map((take) => {
                  const isPlaying = playing?.takeId === take.id;
                  const def = fxDef(take.fx);
                  return (
                    <li
                      key={take.id}
                      className={`group border bg-pine-900 transition-all duration-200 ${
                        isPlaying
                          ? "-translate-y-0.5 border-gold-400 shadow-[0_14px_36px_-14px_rgba(236,189,79,0.35)]"
                          : "border-pine-700 hover:-translate-y-0.5 hover:border-pine-600"
                      }`}
                    >
                      <div className="px-5 pb-5 pt-4">
                        <div className="flex items-center gap-3">
                          {isPlaying && (
                            <span className="eq flex h-4 shrink-0 items-end gap-[2px]" aria-hidden>
                              {[0, 1, 2].map((i) => (
                                <span key={i} style={{ animationDelay: `${i * 0.13}s` }} />
                              ))}
                            </span>
                          )}
                          <p className="min-w-0 flex-1 truncate font-display text-[15px] font-bold tracking-tight">
                            {take.name}
                          </p>
                          <span className="rounded-full bg-pine-800 px-2.5 py-0.5 font-display text-[11px] font-bold tabular-nums text-moss">
                            {fmtDur(take.duration)}
                          </span>
                          <button
                            onClick={() => void downloadTake(take)}
                            disabled={busyDownload === take.id}
                            title="Descargar como WAV (con el efecto elegido)"
                            className="rounded-md p-1.5 text-moss transition-all hover:bg-pine-800 hover:text-gold-300 active:scale-90 disabled:opacity-40"
                          >
                            <IcDownload className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            onClick={() => deleteTake(take.id)}
                            title="Eliminar toma"
                            className="rounded-md p-1.5 text-moss transition-all hover:bg-[#3a1a14] hover:text-[#e06a55] active:scale-90"
                          >
                            <IcTrash className="h-[18px] w-[18px]" />
                          </button>
                        </div>

                        <div className="mt-2">
                          <Wave peaks={take.peaks} active={isPlaying} />
                        </div>

                        {/* efectos */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {FX_LIST.map((fx) => {
                            const active = take.fx === fx.id;
                            return (
                              <button
                                key={fx.id}
                                onClick={() => setTakeFx(take.id, fx.id)}
                                title={fx.desc}
                                className={`rounded-full px-3 py-1 font-display text-[11.5px] font-bold transition-all duration-150 active:scale-90 ${
                                  active
                                    ? "bg-gold-400 text-pine-950 shadow-[0_4px_14px_rgba(236,189,79,0.3)]"
                                    : "bg-pine-800 text-moss hover:bg-pine-700 hover:text-fern"
                                }`}
                              >
                                {fx.name}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => toggleTake(take)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-[12.5px] font-bold transition-all duration-200 active:scale-95 ${
                              isPlaying
                                ? "bg-gold-400 text-pine-950 hover:bg-gold-300"
                                : "bg-teal-500 text-fern hover:bg-teal-400"
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <IcStop className="h-4 w-4" /> Detener
                              </>
                            ) : (
                              <>
                                <IcPlay className="h-4 w-4" /> Escuchar
                              </>
                            )}
                          </button>
                          <p className="min-w-0 truncate font-body text-[12.5px] italic text-moss">
                            Efecto: <span className="text-fern/80">{def.name}</span> — {def.desc}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
