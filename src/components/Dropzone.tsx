import { useRef, useState, type DragEvent } from "react";
import { IconDrop, IconDoc } from "./icons";

interface Props {
  onFile: (file: File) => void;
  compact?: boolean;
}

const ACCEPT = ".pdf,.epub,.txt";

export default function Dropzone({ onFile, compact }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    handle(e.dataTransfer.files);
  };

  if (compact) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.click();
        }}
        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-medium text-fog transition-all hover:border-amber/50 hover:text-snow"
      >
        <IconDrop size={15} className="text-amber transition-transform group-hover:translate-y-0.5" />
        Cambiar archivo
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </span>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed px-8 py-10 text-left transition-all duration-300 ${
        over
          ? "scale-[1.015] border-amber bg-amber/[0.07] shadow-[0_0_60px_-12px_rgba(237,164,62,0.45)]"
          : "border-line bg-panel/60 hover:border-fog/60 hover:bg-panel"
      }`}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${
            over
              ? "border-amber/60 bg-amber/15 text-amber"
              : "border-line bg-ink2 text-fog group-hover:text-amber"
          }`}
        >
          <IconDrop size={30} className={over ? "translate-y-1" : "transition-transform group-hover:translate-y-1"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-snow">
            {over ? "Suéltalo aquí" : "Arrastra tu documento"}
          </p>
          <p className="mt-0.5 text-sm text-fog">
            o <span className="font-bold text-amber2 underline decoration-amber/40 underline-offset-4">búscalo en tu equipo</span> — no se sube a ningún servidor
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {["PDF", "EPUB", "TXT"].map((f) => (
            <span
              key={f}
              className="rounded-sm border border-line bg-ink2 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-fog"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber/10 blur-2xl transition-opacity duration-300 ${
          over ? "opacity-100" : "opacity-0"
        }`}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function FileBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[240px] items-center gap-1.5 rounded-sm bg-ink2 px-2 py-0.5 font-mono text-[11px] text-fog">
      <IconDoc size={13} className="shrink-0 text-amber" />
      <span className="truncate">{name}</span>
    </span>
  );
}
