import { useRef, useState } from "react";
import {
  IcArrowR,
  IcAsterisk,
  IcBook,
  IcEpub,
  IcFilePdf,
  IcLogo,
  IcPen,
  IcShield,
  IcSparkle,
  IcUpload,
  IcWave,
} from "./icons";

interface Props {
  onFiles: (files: FileList | File[]) => void;
  onDemo: () => void;
  onPaste: () => void;
}

const MARQUEE = [
  "salta las notas al pie",
  "ignora números de página",
  "olvida cabeceras repetidas",
  "pasa la página sola",
  "lee lo que pegues a mano",
  "elige voz y velocidad",
  "todo ocurre en tu navegador",
];

export default function Landing({ onFiles, onDemo, onPaste }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="app-bg relative flex min-h-dvh flex-col overflow-hidden text-ink">
      {/* glifo ambiental */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-40 select-none font-body text-[34rem] leading-none text-teal-600/[0.06]"
      >
        «
      </span>

      {/* cabecera */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-950 text-gold-400 shadow-lg">
            <IcLogo className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-xl font-bold tracking-tight">Vozalta</p>
            <p className="font-body text-[12px] italic text-ink-soft">el lector que escucha</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 font-display text-[12px] font-semibold text-teal-600 sm:flex">
          <IcShield className="h-4 w-4" />
          100% local · tus archivos no se suben
        </span>
      </header>

      {/* cuerpo */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-8 md:px-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        {/* columna editorial */}
        <div>
          <p className="rise-in flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.28em] text-teal-600">
            <span className="h-px w-8 bg-teal-500" />
            PDF · EPUB → voz
          </p>
          <h1 className="rise-in mt-4 font-display text-[2.7rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            Deja de leer.
            <span className="mt-1 block font-body text-[0.72em] font-medium italic tracking-normal text-pine-800">
              Empieza a <span className="text-teal-600 underline decoration-gold-400 decoration-[6px] underline-offset-[6px]">escuchar</span>.
            </span>
          </h1>
          <p className="rise-in mt-6 max-w-xl font-body text-[17px] leading-relaxed text-ink-soft" style={{ animationDelay: "80ms" }}>
            Vozalta abre tus <strong className="text-ink">PDF</strong> y{" "}
            <strong className="text-ink">EPUB</strong>, limpia el ruido de imprenta —notas al
            pie, folios, cabeceras— y te lo lee en voz alta, pasando cada página en el
            momento exacto.
          </p>

          {/* qué hace, en vertical */}
          <ul className="rise-in mt-8 max-w-xl" style={{ animationDelay: "160ms" }}>
            {[
              {
                icon: IcAsterisk,
                title: "Limpieza de imprenta",
                desc: "Notas al pie, números de página y cabeceras repetidas se detectan por posición, tamaño y patrón.",
                tone: "text-gold-600 bg-gold-400/15",
              },
              {
                icon: IcBook,
                title: "Pase automático de página",
                desc: "La vista avanza sola al compás de la voz; la frase que suena queda iluminada.",
                tone: "text-teal-600 bg-teal-500/10",
              },
              {
                icon: IcWave,
                title: "Voz a tu gusto",
                desc: "Elige la voz del sistema, velocidad de 0,7× a 1,6× y tono. Toca cualquier frase para leer desde ahí.",
                tone: "text-pine-800 bg-pine-800/10",
              },
            ].map((f) => (
              <li
                key={f.title}
                className="group flex gap-4 border-t border-line py-4 transition-all duration-200 last:border-b hover:translate-x-1.5"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${f.tone}`}>
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="font-display text-[15px] font-bold tracking-tight">{f.title}</p>
                  <p className="mt-0.5 font-body text-[13.5px] leading-relaxed text-ink-soft">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ficha de préstamo */}
        <div className="rise-in" style={{ animationDelay: "120ms" }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className={`group relative cursor-pointer border-2 border-dashed px-8 py-12 text-center shadow-[0_24px_60px_-24px_rgba(23,28,26,0.35)] transition-all duration-300 ${
              drag
                ? "scale-[1.02] border-gold-500 bg-gold-300/30"
                : "border-pine-800/35 bg-card hover:-translate-y-1 hover:border-teal-500 hover:shadow-[0_30px_70px_-24px_rgba(14,122,95,0.4)]"
            }`}
          >
            {/* esquinas de ficha */}
            <span className="absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-teal-500/60" aria-hidden />
            <span className="absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-teal-500/60" aria-hidden />
            <span className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-teal-500/60" aria-hidden />
            <span className="absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-teal-500/60" aria-hidden />

            <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-ink-soft/70">
              Ficha de préstamo
            </p>

            <div className="relative mx-auto mt-6 grid h-20 w-20 place-items-center">
              <span className={`absolute inset-0 rounded-full bg-teal-500/15 transition-transform duration-500 ${drag ? "scale-125" : "group-hover:scale-110"}`} />
              <span className="pulse-ring absolute inset-0 rounded-full border-2 border-teal-500/40" aria-hidden />
              <IcUpload
                className={`relative h-9 w-9 transition-all duration-300 ${
                  drag ? "-translate-y-1 text-gold-600" : "text-teal-600 group-hover:-translate-y-1"
                }`}
              />
            </div>

            <p className="mt-5 font-display text-2xl font-bold tracking-tight">
              {drag ? "Suéltalo aquí" : "Arrastra tu libro"}
            </p>
            <p className="mt-1 font-body text-[14px] italic text-ink-soft">
              o pulsa para elegirlo desde tu equipo
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-[#3b2b20] px-2.5 py-1 font-display text-[11px] font-bold tracking-wider text-[#e8b184]">
                <IcFilePdf className="h-3.5 w-3.5" /> PDF
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-pine-900 px-2.5 py-1 font-display text-[11px] font-bold tracking-wider text-[#7fc7a8]">
                <IcEpub className="h-3.5 w-3.5" /> EPUB
              </span>
            </div>

            <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-pine-950 px-6 py-3 font-display text-[14px] font-bold text-fern shadow-lg transition-all duration-200 group-hover:bg-teal-600 group-active:scale-95">
              Abrir libro
              <IcArrowR className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <button
            onClick={onDemo}
            className="group mt-5 flex w-full items-center justify-between rounded-lg border border-line bg-card/70 px-5 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-300/25"
          >
            <span className="flex items-center gap-3">
              <IcSparkle className="h-5 w-5 text-gold-600 transition-transform group-hover:rotate-12" />
              <span>
                <span className="block font-display text-[14px] font-bold">¿Sin un archivo a mano?</span>
                <span className="block font-body text-[12.5px] italic text-ink-soft">
                  Escucha el demo: Don Quijote, con notas al pie incluidas para ver la limpieza.
                </span>
              </span>
            </span>
            <IcArrowR className="h-5 w-5 shrink-0 text-gold-600 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onPaste}
            className="group mt-3 flex w-full items-center justify-between rounded-lg border border-line bg-card/70 px-5 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500 hover:bg-teal-500/10"
          >
            <span className="flex items-center gap-3">
              <IcPen className="h-5 w-5 text-teal-600 transition-transform group-hover:-rotate-12" />
              <span>
                <span className="block font-display text-[14px] font-bold">Pegar texto a mano</span>
                <span className="block font-body text-[12.5px] italic text-ink-soft">
                  Un artículo, unos apuntes, un poema… se pagina solo y se lee igual.
                </span>
              </span>
            </span>
            <IcArrowR className="h-5 w-5 shrink-0 text-teal-600 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>

      {/* cinta corrediza */}
      <footer className="relative z-10 border-t border-line bg-pine-950 py-3 text-fern">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {MARQUEE.map((m) => (
                  <span key={m + k} className="flex items-center font-display text-[12px] font-bold uppercase tracking-[0.18em]">
                    <span className="px-5">{m}</span>
                    <IcSparkle className="h-3.5 w-3.5 text-gold-400" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
