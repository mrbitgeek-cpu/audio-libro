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
    (v) => /google|mónica|monica|paulina|sabina|helena|lucia|lucía|elvira/i.test(v.name)
  );
  return preferred || pool.find((v) => v.default) || pool[0];
}

/**
 * Motor de lectura en voz alta: habla frase a frase, informa del índice actual
 * (para pasar páginas y resaltar) y permite pausar, detener y saltar.
 */
export function useSpeech(sentences: Sentence[], onIndex: (i: number) => void) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [index, setIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = usePersist<string>("vozalta.voice", "");
  const [rate, setRate] = usePersist<number>("vozalta.rate", 1);
  const [pitch, setPitch] = usePersist<number>("vozalta.pitch", 1);

  const sessionRef = useRef(0);
  const idxRef = useRef(-1);
  const sentencesRef = useRef(sentences);
  const onIndexRef = useRef(onIndex);
  sentencesRef.current = sentences;
  onIndexRef.current = onIndex;

  /* voces disponibles: Safari/iOS las carga en diferido, a veces solo tras un
     gesto del usuario, así que reintentamos durante unos segundos */
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
      if (load() || tries > 20) window.clearInterval(iv);
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
      /* Chrome a veces deja la cola «congelada» tras cancelar */
      try {
        synth.resume();
      } catch {
        /* sin efecto */
      }
      const session = ++sessionRef.current;

      const step = (j: number) => {
        if (sessionRef.current !== session) return;
        if (j >= list.length || j < 0) {
          idxRef.current = -1;
          setIndex(-1);
          setStatus("idle");
          return;
        }
        idxRef.current = j;
        setIndex(j);
        onIndexRef.current(j);

        const u = new SpeechSynthesisUtterance(list[j].text);
        const all = synth.getVoices();
        const v =
          all.find((x) => x.voiceURI === voiceURI) || pickDefaultVoice(all);
        if (v) {
          u.voice = v;
          u.lang = v.lang;
        } else {
          u.lang = "es-ES";
        }
        u.rate = rate;
        u.pitch = pitch;
        u.onend = () => step(j + 1);
        u.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return;
          step(j + 1);
        };
        synth.speak(u);
      };

      setStatus("playing");
      /* iOS ignora el speak() si llega en el mismo tick que el cancel() */
      window.setTimeout(() => step(from), 90);
    },
    [voiceURI, rate, pitch]
  );

  const pause = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return;
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      /* algunos navegadores se quedan dormidos: si no arranca, reintentamos */
      window.setTimeout(() => {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        }
      }, 250);
    }
    setStatus("playing");
  }, []);

  const stop = useCallback(() => {
    sessionRef.current++;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  /* Safari en iPhone corta el audio a los ~15 s: un ciclo pause/resume cada
     10 s lo mantiene vivo; y si la pestaña vuelve al primer plano, reanudamos */
  useEffect(() => {
    if (typeof speechSynthesis === "undefined" || status !== "playing") return;
    const iv = window.setInterval(() => {
      const s = speechSynthesis;
      if (s.speaking && !s.paused) {
        s.pause();
        s.resume();
      }
    }, 10_000);
    const onVis = () => {
      if (document.visibilityState === "visible" && speechSynthesis.paused) {
        speechSynthesis.resume();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [status]);

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
      if (statusRef() !== "idle") speakAt(clamped);
      else {
        idxRef.current = clamped;
        setIndex(clamped);
        onIndexRef.current(clamped);
      }
    },
    [speakAt]
  );

  const statusRefFn = useRef(status);
  statusRefFn.current = status;
  function statusRef() {
    return statusRefFn.current;
  }

  const previewVoice = useCallback(
    (text: string) => {
      if (typeof speechSynthesis === "undefined") return;
      const synth = speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
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
      synth.speak(u);
    },
    [voiceURI, rate, pitch]
  );

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
  };
}

export type SpeechEngine = ReturnType<typeof useSpeech>;
