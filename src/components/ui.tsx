import type { ReactNode } from "react";

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-teal-500" : "bg-pine-700"
      }`}
    >
      <span
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-fern shadow transition-all duration-200 ${
          on ? "left-[21px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-moss">
      {children}
    </p>
  );
}

export function SourceBadge({ source }: { source: "pdf" | "epub" | "demo" }) {
  const cls =
    source === "pdf"
      ? "bg-[#3b2b20] text-[#e8b184]"
      : source === "epub"
        ? "bg-[#1e3328] text-[#7fc7a8]"
        : "bg-[#3a301d] text-[#e5c069]";
  return (
    <span className={`rounded px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider ${cls}`}>
      {source.toUpperCase()}
    </span>
  );
}
