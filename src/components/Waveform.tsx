import { useMemo } from "react";
import type { SpeechStatus } from "../lib/types";

interface Props {
  status: SpeechStatus;
  bars?: number;
  className?: string;
  tone?: "amber" | "ink";
}

/** Ecualizador animado: suena, se congela en pausa o reposa en silencio. */
export default function Waveform({ status, bars = 24, className = "", tone = "amber" }: Props) {
  const heights = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      // pseudoaleatorio determinista
      const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      out.push(0.3 + v * 0.7);
    }
    return out;
  }, [bars]);

  const stateClass =
    status === "playing" ? "" : status === "paused" ? "eq-paused" : "eq-idle";
  const color = tone === "amber" ? "bg-amber" : "bg-pencil/70";

  return (
    <div className={`flex items-end gap-[3px] ${stateClass} ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className={`eq-bar w-[3px] rounded-full ${color}`}
          style={{
            height: `${h * 100}%`,
            animationDelay: `${(i % 7) * 0.09}s`,
            animationDuration: `${0.8 + ((i * 37) % 50) / 100}s`,
            opacity: status === "idle" ? 0.35 : 0.55 + h * 0.45,
          }}
        />
      ))}
    </div>
  );
}
