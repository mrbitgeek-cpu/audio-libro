import { useCallback, useEffect, useRef, useState } from "react";
import type { Book, Position, SpeechStatus } from "../lib/types";

const LS_RATE = "vozpagina.rate";
const LS_VOICE = "vozpagina.voice";
const LS_AUTO = "vozpagina.autoadvance";

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === "undefined") return [];
  const all = speechSynthesis.getVoices();
  const es = all.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const rest = all.filter((v) => !v.lang.toLowerCase().startsWith("es"));
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (/google/i.test(v.name)) s += 4;
    if (/m[óo]nica|paulina|helena|luciana|sabina|elvira|esperanza|isabela/i.test(v.name)) s += 2;
    if (v.localService) s += 1;
    return s;
  };
  es.sort((a, b) => score(b) - score(a));
  return [...es, ...rest];
}

export interface SpeechEngine {
  supported: boolean;
  status: SpeechStatus;
  pos: Position;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string | null) => void;
  rate: number;
  setRate: (r: number) => void;
  autoAdvance: boolean;
  setAutoAdvance: (v: boolean) => void;
  play: (from?: Position) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  stop: () => void;
  seekPage: (page: number) => void;
  seekSentence: (page: number, sentence: number) => void;
  atEnd: boolean;
}

export function useSpeech(book: Book | null, onAutoTurn?: (page: number) => void): SpeechEngine {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [pos, setPos] = useState<Position>({ page: 0, sentence: 0 });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(loadVoices);
  const [voiceURI, setVoiceURIState] = useState<string | null>(
    () => localStorage.getItem(LS_VOICE) ?? null
  );
  const [rate, setRateState] = useState<number>(() => {
    const r = parseFloat(localStorage.getItem(LS_RATE) ?? "1");
    return Number.isFinite(r) && r >= 0.5 && r <= 2 ? r : 1;
  });
  const [autoAdvance, setAutoAdvanceState] = useState<boolean>(
    () => localStorage.getItem(LS_AUTO) !== "0"
  );

  const bookRef = useRef(book);
  const posRef = useRef<Position>({ page: 0, sentence: 0 });
  const statusRef = useRef<SpeechStatus>("idle");
  const runIdRef = useRef(0);
  const rateRef = useRef(rate);
  const voiceRef = useRef(voices);
  const autoRef = useRef(autoAdvance);
  const onAutoTurnRef = useRef(onAutoTurn);
  const timerRef = useRef<number | undefined>(undefined);

  bookRef.current = book;
  rateRef.current = rate;
  voiceRef.current = voices;
  autoRef.current = autoAdvance;
  onAutoTurnRef.current = onAutoTurn;

  // reinicio al cambiar de libro
  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    runIdRef.current += 1;
    posRef.current = { page: 0, sentence: 0 };
    setPos({ page: 0, sentence: 0 });
    setStatus("idle");
    statusRef.current = "idle";
  }, [book]);

  useEffect(() => {
    if (!supported) return;
    const update = () => setVoices(loadVoices());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      speechSynthesis.cancel();
    };
  }, [supported]);

  const setStatusBoth = (s: SpeechStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const speakCurrent = useCallback(
    (runId: number) => {
      const b = bookRef.current;
      if (!b || runId !== runIdRef.current) return;
      const { page, sentence } = posRef.current;
      const pg = b.pages[page];
      if (!pg) {
        setStatusBoth("idle");
        return;
      }
      if (sentence >= pg.sentences.length) {
        // fin de página → pase automático o pausa
        const next = page + 1;
        if (autoRef.current && next < b.pages.length) {
          posRef.current = { page: next, sentence: 0 };
          setPos(posRef.current);
          onAutoTurnRef.current?.(next);
          timerRef.current = window.setTimeout(() => speakCurrent(runId), 700);
        } else {
          setStatusBoth("idle");
        }
        return;
      }
      setPos({ page, sentence });
      const u = new SpeechSynthesisUtterance(pg.sentences[sentence]);
      const v = voiceRef.current.find((x) => x.voiceURI === (localStorage.getItem(LS_VOICE) ?? ""));
      const picked = v ?? voiceRef.current[0];
      if (picked) {
        u.voice = picked;
        u.lang = picked.lang;
      } else {
        u.lang = "es-ES";
      }
      u.rate = rateRef.current;
      u.pitch = 1;
      u.onend = () => {
        if (runId !== runIdRef.current) return;
        posRef.current = { page, sentence: sentence + 1 };
        speakCurrent(runId);
      };
      u.onerror = (e) => {
        if (runId !== runIdRef.current) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        posRef.current = { page, sentence: sentence + 1 };
        speakCurrent(runId);
      };
      window.speechSynthesis.speak(u);
    },
    []
  );

  const cancelChain = () => {
    runIdRef.current += 1;
    window.clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  };

  const play = useCallback(
    (from?: Position) => {
      if (!bookRef.current || !supported) return;
      cancelChain();
      const runId = runIdRef.current;
      const start: Position =
        from ??
        (posRef.current.page >= bookRef.current.pages.length
          ? { page: 0, sentence: 0 }
          : posRef.current);
      // si estaba al final de la página actual, avanza
      const pg = bookRef.current.pages[start.page];
      if (pg && start.sentence >= pg.sentences.length) {
        if (start.page + 1 < bookRef.current.pages.length) {
          start.page += 1;
          start.sentence = 0;
        } else if (statusRef.current === "idle") {
          // terminó el libro: reproducir de nuevo desde el inicio
          start.page = 0;
          start.sentence = 0;
        }
      }
      posRef.current = { ...start };
      setPos(posRef.current);
      setStatusBoth("playing");
      speakCurrent(runId);
    },
    [supported, speakCurrent]
  );

  const pause = useCallback(() => {
    if (!supported || statusRef.current !== "playing") return;
    window.speechSynthesis.pause();
    setStatusBoth("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported || statusRef.current !== "paused") return;
    window.speechSynthesis.resume();
    setStatusBoth("playing");
    // vigilancia: en algunos navegadores resume() no reanuda
    const runId = runIdRef.current;
    window.setTimeout(() => {
      if (
        runId === runIdRef.current &&
        statusRef.current === "playing" &&
        supported &&
        window.speechSynthesis.paused
      ) {
        cancelChain();
        const id = runIdRef.current;
        setStatusBoth("playing");
        speakCurrent(id);
      }
    }, 350);
  }, [supported, speakCurrent]);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") pause();
    else if (statusRef.current === "paused") resume();
    else play();
  }, [pause, resume, play]);

  const stop = useCallback(() => {
    cancelChain();
    posRef.current = { ...posRef.current, sentence: 0 };
    setPos(posRef.current);
    setStatusBoth("idle");
  }, []);

  const seekPage = useCallback(
    (page: number) => {
      const b = bookRef.current;
      if (!b) return;
      const p = Math.max(0, Math.min(page, b.pages.length - 1));
      cancelChain();
      posRef.current = { page: p, sentence: 0 };
      setPos(posRef.current);
      if (statusRef.current === "playing") speakCurrent(runIdRef.current);
    },
    [speakCurrent]
  );

  const seekSentence = useCallback(
    (page: number, sentence: number) => {
      const b = bookRef.current;
      if (!b || !b.pages[page]) return;
      cancelChain();
      posRef.current = { page, sentence };
      setPos(posRef.current);
      setStatusBoth("playing");
      speakCurrent(runIdRef.current);
    },
    [speakCurrent]
  );

  const setRate = useCallback((r: number) => {
    const clamped = Math.max(0.5, Math.min(2, r));
    setRateState(clamped);
    localStorage.setItem(LS_RATE, String(clamped));
  }, []);

  const setVoiceURI = useCallback((uri: string | null) => {
    setVoiceURIState(uri);
    if (uri) localStorage.setItem(LS_VOICE, uri);
    else localStorage.removeItem(LS_VOICE);
    // reinicia la frase actual con la nueva voz si está hablando
    if (statusRef.current === "playing") {
      cancelChain();
      const id = runIdRef.current;
      setStatusBoth("playing");
      window.setTimeout(() => speakCurrent(id), 30);
    }
  }, [speakCurrent]);

  const setAutoAdvance = useCallback((v: boolean) => {
    setAutoAdvanceState(v);
    localStorage.setItem(LS_AUTO, v ? "1" : "0");
  }, []);

  const b = book;
  const atEnd =
    !!b &&
    pos.page === b.pages.length - 1 &&
    pos.sentence >= (b.pages[pos.page]?.sentences.length ?? 0);

  return {
    supported,
    status,
    pos,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    autoAdvance,
    setAutoAdvance,
    play,
    pause,
    resume,
    toggle,
    stop,
    seekPage,
    seekSentence,
    atEnd,
  };
}
