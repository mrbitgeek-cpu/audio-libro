import { useEffect, useMemo, useRef, useState } from "react";
import { IcPen, IcPlay, IcX } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, text: string) => void;
}

export default function PasteModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => areaRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const stats = useMemo(() => {
    const clean = text.trim();
    const words = clean ? clean.split(/\s+/).length : 0;
    return {
      words,
      chars: clean.length,
      minutes: Math.max(1, Math.round(words / 150)),
      pages: Math.max(1, Math.ceil(clean.length / 1000)),
      ok: words > 0,
    };
  }, [text]);

  if (!open) return null;

  const submit = () => {
    if (!stats.ok) return;
    onSubmit(title, text);
    setTitle("");
    setText("");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-pine-950/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pop-in w-full max-w-xl border border-line bg-card text-ink shadow-[0_30px_80px_-20px_rgba(10,20,17,0.6)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pegar texto para leer en voz alta"
      >
        {/* cabecera de ficha */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-pine-950 text-gold-400">
              <IcPen className="h-[18px] w-[18px]" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[16px] font-bold tracking-tight">Ficha de manuscrito</p>
              <p className="font-body text-[12px] italic text-ink-soft">
                pega tu texto y Vozalta lo paginará y lo leerá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-soft transition-all hover:bg-paper-2 hover:text-ink active:scale-90"
            aria-label="Cerrar"
          >
            <IcX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              Título (opcional)
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi lectura de hoy"
              maxLength={80}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 font-display text-[14px] font-semibold outline-none transition-colors placeholder:font-normal placeholder:italic placeholder:text-ink-soft/60 focus:border-teal-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              Texto
            </span>
            <textarea
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={
                "Pega aquí un artículo, unos apuntes, un capítulo, un poema…\n\nCada línea en blanco separa un párrafo."
              }
              className="scroll-slim mt-1 h-52 w-full resize-y rounded-md border border-line bg-paper px-3.5 py-3 font-body text-[15px] leading-relaxed outline-none transition-colors placeholder:italic placeholder:text-ink-soft/60 focus:border-teal-500 md:h-64"
            />
          </label>

          {/* contadores vivos */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-display text-[12px] font-semibold">
            <span className={stats.ok ? "text-teal-600" : "text-ink-soft/60"}>
              {stats.words.toLocaleString("es")} palabras
            </span>
            <span className="text-ink-soft/70">{stats.chars.toLocaleString("es")} caracteres</span>
            {stats.ok && (
              <>
                <span className="text-gold-600">~{stats.minutes} min de audio</span>
                <span className="text-ink-soft/70">
                  {stats.pages} {stats.pages === 1 ? "página" : "páginas"}
                </span>
              </>
            )}
            <span className="ml-auto hidden text-[11px] font-medium italic text-ink-soft/60 sm:inline">
              Ctrl+Enter para leer
            </span>
          </div>
        </div>

        {/* pie */}
        <div className="flex items-center justify-end gap-2.5 border-t border-line bg-paper px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 font-display text-[13px] font-semibold text-ink-soft transition-all hover:bg-paper-2 hover:text-ink active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!stats.ok}
            className="flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2 font-display text-[13px] font-bold text-fern shadow-md transition-all hover:bg-teal-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <IcPlay className="h-4 w-4" />
            Leer en voz alta
          </button>
        </div>
      </div>
    </div>
  );
}
