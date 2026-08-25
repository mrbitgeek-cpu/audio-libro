import { useCallback, useEffect, useRef, useState } from "react";
import type { Sentence } from "../lib/types";

export type SpeechStatus = "idle" | "playing" | "paused";

function usePersist<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s != null ? (JSON.parse(s) as T) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* sin almacenamiento */
    }
  }, [key, v]);
  return [v, setV] as const;
}

function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const pool = es.length ? es : voices;
  const preferred = pool.find(
    (v) => /google|mónica|monica|paulina|sabina|helena|lucia|lucía|elvira|monica|jorge/i.test(v.name)
  );
  return preferred || pool.find((v) => v.default) || pool[0];
}

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/**
 * Motor de lectura en voz alta frase a frase, endurecido contra los fallos
 * clásicos de los navegadores:
 *  - Chrome congela la cola tras cancel()  → retraso + resume() + watchdog.
 *  - Chrome recolecta la utterance activa  → referencia viva permanente.
 *  - Chrome/Safari pierden onend           → el watchdog re-lanza la frase.
 *  - iOS corta el habla a los ~15 s        → latido de pausa/resume (solo iOS).
 *  - La pestaña pierde el foco             → resume automático al volver.
 */
export function useSpeech(sentences: Sentence[], onIndex: (i: number) => void) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [index, setIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = usePersist<string>("vozalta.voice", "");
  const [rate, setRate] = usePersist<number>("vozalta.rate", 1);
  const [pitch, setPitch] = usePersist<number>("vozalta.pitch", 1);

  /* diagnóstico en vivo del motor (para el panel de sonido) */
  const [lastError, setLastError] = useState<string | null>(null);
  const [diag, setDiag] = useState({
    speaking: false,
    pending: false,
    paused: false,
  });

  const sessionRef = useRef(0);
  const idxRef = useRef(-1);
  const rescueRef = useRef(0);
  /* referencia viva: sin esto Chrome puede recolectar la utterance a mitad de frase */
  const liveUtt = useRef<SpeechSynthesisUtterance | null>(null);
  const sentencesRef = useRef(sentences);
  const onIndexRef = useRef(onIndex);
  sentencesRef.current = sentences;
  onIndexRef.current = onIndex;

  const statusRef = useRef(status);
  statusRef.current = status;
  const speakAtRef = useRef<(from: number) => void>(() => {});

  /* voces disponibles: Safari las entrega tarde, a veces solo tras un gesto */
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const load = () => {
      const v = speechSynthesis.getVoices();
      if (v.length) setVoices(v);
      return v.length > 0;
    };
    if (load()) return;
    speechSynthesis.addEventListener("voiceschanged", load);
    let tries = 0;
    const iv = window.setInterval(() => {
      tries++;
      if (load() || tries > 25) window.clearInterval(iv);
    }, 400);
    return () => {
      window.clearInterval(iv);
      speechSynthesis.removeEventListener("voiceschanged", load);
      speechSynthesis.cancel();
    };
  }, []);

  /* si cambia el libro, se acabó la sesión anterior */
  useEffect(() => {
    sessionRef.current++;
    liveUtt.current = null;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    idxRef.current = -1;
    setIndex(-1);
    setStatus("idle");
  }, [sentences]);

  const speakAt = useCallback(
    (from: number) => {
      if (typeof speechSynthesis === "undefined") return;
      const list = sentencesRef.current;
      if (!list.length) return;
      const synth = speechSynthesis;

      synth.cancel();
      /* despierta el motor: Chrome a veces deja la cola congelada */
      try {
        synth.resume();
      } catch {
        /* sin efecto */
      }
      synth.getVoices();

      const session = ++sessionRef.current;
      rescueRef.current = 0;
      setLastError(null);

      const step = (j: number) => {
        if (sessionRef.current !== session) return;
        if (j < 0 || j >= list.length) {
          liveUtt.current = null;
          idxRef.current = -1;
          setIndex(-1);
          setStatus("idle");
          return;
        }
        idxRef.current = j;
        setIndex(j);
        onIndexRef.current(j);

        const u = new SpeechSynthesisUtterance(list[j].text);
        liveUtt.current = u; /* ancla anti-recolección */

        const all = synth.getVoices();
        const v = all.find((x) => x.voiceURI === voiceURI) || pickDefaultVoice(all);
        if (v) {
          u.voice = v;
          u.lang = v.lang;
        } else {
          u.lang = "es-ES";
        }
        u.rate = rate;
        u.pitch = pitch;

        let settled = false;
        const advance = () => {
          if (settled) return;
          settled = true;
          step(j + 1);
        };
        u.onend = advance;
        u.onerror = (e) => {
          if (sessionRef.current !== session) return;
          /* interrupted/canceled: se encarga el watchdog; el resto, salta la frase */
          if (e.error === "interrupted" || e.error === "canceled") return;
          setLastError(e.error || "error desconocido");
          advance();
        };
        synth.speak(u);
      };

      setStatus("playing");
      /* iOS y Chrome descartan el speak() si llega en el mismo tick que cancel() */
      window.setTimeout(() => {
        if (sessionRef.current === session) step(from);
      }, 130);
    },
    [voiceURI, rate, pitch]
  );
  speakAtRef.current = speakAt;

  /* ---------- watchdog: si decimos que suena pero el motor calla, rescate ---------- */
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    let silentTicks = 0;
    const iv = window.setInterval(() => {
      const synth = speechSynthesis;
      setDiag((d) =>
        d.speaking === synth.speaking &&
        d.pending === synth.pending &&
        d.paused === synth.paused
          ? d
          : { speaking: synth.speaking, pending: synth.pending, paused: synth.paused }
      );
      if (statusRef.current !== "playing") {
        silentTicks = 0;
        return;
      }
      if (synth.speaking || synth.pending) {
        silentTicks = 0;
        rescueRef.current = 0;
        return;
      }
      /* dos avisos seguidos (~2,4 s) de silencio injustificado */
      silentTicks++;
      if (silentTicks < 2) return;
      silentTicks = 0;
      rescueRef.current++;
      if (rescueRef.current > 5) {
        /* el motor no responde: rendimos la sesión para no bloquear la app */
        sessionRef.current++;
        liveUtt.current = null;
        setStatus("idle");
        return;
      }
      try {
        synth.resume();
      } catch {
        /* sin efecto */
      }
      speakAtRef.current(idxRef.current >= 0 ? idxRef.current : 0);
    }, 1200);
    return () => window.clearInterval(iv);
  }, []);

  /* ---------- latido anti-corte de iOS (allí el habla muere a los ~15 s) ---------- */
  useEffect(() => {
    if (!isIOS || typeof speechSynthesis === "undefined" || status !== "playing") return;
    const iv = window.setInterval(() => {
      const synth = speechSynthesis;
      if (!synth.speaking && !synth.pending) return;
      try {
        synth.pause();
        synth.resume();
      } catch {
        /* sin efecto */
      }
    }, 10_000);
    return () => window.clearInterval(iv);
  }, [status]);

  /* ---------- al volver del segundo plano, retomamos la voz ---------- */
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (statusRef.current === "playing") {
        window.setTimeout(() => {
          try {
            speechSynthesis.resume();
          } catch {
            /* sin efecto */
          }
        }, 300);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const pause = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return;
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      window.setTimeout(() => {
        if (speechSynthesis.paused) {
          try {
            speechSynthesis.resume();
          } catch {
            /* sin efecto */
          }
        }
      }, 250);
    }
    setStatus("playing");
  }, []);

  const stop = useCallback(() => {
    sessionRef.current++;
    liveUtt.current = null;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else if (status === "paused") resume();
    else speakAt(idxRef.current >= 0 ? idxRef.current : 0);
  }, [status, pause, resume, speakAt]);

  const seek = useCallback(
    (i: number) => {
      const n = sentencesRef.current.length;
      if (!n) return;
      const clamped = Math.max(0, Math.min(n - 1, i));
      if (statusRef.current !== "idle") speakAt(clamped);
      else {
        idxRef.current = clamped;
        setIndex(clamped);
        onIndexRef.current(clamped);
      }
    },
    [speakAt]
  );

  const previewVoice = useCallback(
    (text: string) => {
      if (typeof speechSynthesis === "undefined") return;
      const synth = speechSynthesis;
      synth.cancel();
      try {
        synth.resume();
      } catch {
        /* sin efecto */
      }
      const u = new SpeechSynthesisUtterance(text);
      liveUtt.current = u;
      const all = synth.getVoices();
      const v = all.find((x) => x.voiceURI === voiceURI) || pickDefaultVoice(all);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else {
        u.lang = "es-ES";
      }
      u.rate = rate;
      u.pitch = pitch;
      u.onend = () => setLastError(null);
      u.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          setLastError(e.error || "error desconocido");
        }
      };
      window.setTimeout(() => synth.speak(u), 130);
    },
    [voiceURI, rate, pitch]
  );

  /**
   * Prueba de sonido puro con WebAudio (esquiva la síntesis de voz).
   * Si esto suena y la voz no, el problema es de las voces del sistema;
   * si esto tampoco suena, es el volumen del sistema o la pestaña silenciada.
   */
  const beep = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
      osc.onended = () => void ctx.close();
    } catch {
      /* sin audio */
    }
  }, []);

  return {
    status,
    index,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    speakAt,
    pause,
    resume,
    stop,
    toggle,
    seek,
    previewVoice,
    beep,
    lastError,
    diag,
  };
}

export type SpeechEngine = ReturnType<typeof useSpeech>;
