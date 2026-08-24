import { useEffect, useState } from "react";
import Dropzone from "./Dropzone";
import Waveform from "./Waveform";
import {
  LogoMark,
  IconBook,
  IconFootnote,
  IconPageNum,
  IconRunning,
  IconToc,
  IconKeys,
  IconSpeaker,
  IconCheck,
} from "./icons";

const DEMO_SENTENCES = [
  "En un lugar de la Mancha, de cuyo nombre no quiero acordarme…",
  "no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero,",
  "adarga antigua, rocín flaco y galgo corredor.",
  "Una olla de algo más vaca que carnero, salpicón las más noches,",
  "consumían las tres partes de su hacienda.",
];

const CLEAN_ITEMS = [
  {
    n: "01",
    icon: IconFootnote,
    title: "Notas al pie y referencias",
    desc: "Bloques de fuente pequeña al cierre de página, marcadores [12], superíndices ³ y llamadas †‡§ desaparecen del guion hablado.",
  },
  {
    n: "02",
    icon: IconPageNum,
    title: "Números de página",
    desc: "«47», «pág. 12», folios en romanos… nada de dígitos sueltos interrumpiendo la narración entre página y página.",
  },
  {
    n: "03",
    icon: IconRunning,
    title: "Encabezados y pies repetidos",
    desc: "El título del libro o del capítulo que se imprime en cada hoja se detecta por repetición y se silencia una sola vez basta.",
  },
  {
    n: "04",
    icon: IconToc,
    title: "Índices y navegación",
    desc: "Tablas de contenido, listas de enlaces y colofones de EPUB se omiten para saltar directo al primer capítulo.",
  },
];

export default function Landing({
  onFile,
  onSample,
}: {
  onFile: (f: File) => void;
  onSample: () => void;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((a) => (a + 1) % DEMO_SENTENCES.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-10 pt-6 sm:px-8">
      {/* barra superior */}
      <header className="rise-in flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber/12 text-amber ring-1 ring-amber/30">
            <LogoMark size={21} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[17px] font-bold tracking-tight text-snow">
              Voz de Página
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">
              lector que habla
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-medium text-fog sm:inline-flex">
          <IconCheck size={13} className="text-moss" />
          100% local · nada se sube
        </span>
      </header>

      {/* apertura: escritorio de lectura */}
      <main className="mt-10 grid flex-1 items-start gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-8">
        <section className="rise-in lg:col-span-7" style={{ animationDelay: "80ms" }}>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-amber">
            PDF · EPUB · TXT → audio
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6.2vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight text-snow">
            Tu documento
            <br />
            <span className="italic text-amber2">se lee solo</span>
            <span className="caret-blink text-amber">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-fog">
            Abre un libro o un informe y escúchalo con la voz de tu navegador. La página{" "}
            <strong className="font-bold text-snow">pasa sola cuando termina la lectura</strong>, y
            antes de hablar se apartan notas al pie, folios, encabezados e índices: solo queda la
            voz del texto.
          </p>

          <div className="mt-8 max-w-xl">
            <Dropzone onFile={onFile} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onSample}
                className="group inline-flex items-center gap-2.5 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-bold text-snow transition-all hover:-translate-y-0.5 hover:border-amber/50 hover:shadow-[0_8px_30px_-10px_rgba(237,164,62,0.4)]"
              >
                <IconBook size={17} className="text-amber transition-transform group-hover:-rotate-6" />
                Probar con el Quijote
                <span className="rounded-sm bg-ink2 px-1.5 py-0.5 font-mono text-[10px] text-fog">
                  muestra
                </span>
              </button>
              <p className="text-xs text-fog/80">
                Capítulo I, II y VIII · con notas al pie de muestra para ver la limpieza
              </p>
            </div>
          </div>

          {/* atajos */}
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-fog">
            <span className="inline-flex items-center gap-1.5">
              <IconKeys size={15} className="text-fog/70" />
              Atajos dentro del lector:
            </span>
            {[
              ["Espacio", "reproducir / pausar"],
              ["←  →", "cambiar página"],
              ["↑  ↓", "velocidad"],
            ].map(([k, d]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <kbd className="rounded-sm border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-snow">
                  {k}
                </kbd>
                {d}
              </span>
            ))}
          </div>
        </section>

        {/* composición viva: la hoja que escucha */}
        <aside
          className="rise-in relative hidden select-none lg:col-span-5 lg:block"
          style={{ animationDelay: "200ms" }}
          aria-hidden
        >
          <div className="relative mx-auto mt-2 w-[min(100%,360px)]">
            {/* anillos de voz */}
            <div className="absolute -right-10 -top-10 h-40 w-40">
              <span className="ring-pulse absolute inset-0 rounded-full border border-amber/30" />
              <span className="ring-pulse absolute inset-0 rounded-full border border-amber/20" style={{ animationDelay: "0.8s" }} />
              <span className="ring-pulse absolute inset-0 rounded-full border border-amber/10" style={{ animationDelay: "1.6s" }} />
            </div>

            {/* hojas apiladas */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-[4deg] rounded-sm bg-paper2/30" />
            <div className="absolute inset-0 -translate-x-2 translate-y-2 -rotate-[2.5deg] rounded-sm bg-paper2/50" />

            {/* hoja principal */}
            <div className="paper-grain relative rotate-[1.2deg] rounded-sm bg-paper px-7 py-6 text-pencil shadow-[0_30px_70px_-20px_rgba(0,0,0,0.65)] ring-1 ring-black/20">
              <div className="flex items-center justify-between border-b border-pencil/15 pb-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-pencil2">
                  Capítulo I
                </span>
                <span className="font-mono text-[10px] text-pencil2">pág. 1 / 6</span>
              </div>
              <div className="mt-4 space-y-2.5 font-body text-[13.5px] leading-relaxed">
                {DEMO_SENTENCES.map((s, i) => (
                  <p
                    key={i}
                    className={`inline transition-colors duration-300 ${
                      i === active
                        ? "hl-sentence font-bold"
                        : i < active
                          ? "spoken-sentence"
                          : "text-pencil/90"
                    }`}
                  >
                    {s}{" "}
                  </p>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-pencil/15 pt-3.5">
                <Waveform status="playing" bars={18} tone="ink" className="h-5" />
                <span className="font-mono text-[10px] tracking-wide text-pencil2">
                  voz es-ES · 1.2×
                </span>
              </div>
              {/* esquina doblada */}
              <div className="absolute bottom-0 right-0 h-7 w-7">
                <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[28px] border-l-[28px] border-b-ink/80 border-l-transparent opacity-20" />
                <div className="absolute bottom-0 right-0 h-0 w-0 border-b-[26px] border-l-[26px] border-b-paper2 border-l-transparent" />
              </div>
            </div>

            {/* chip flotante: nota omitida */}
            <div className="glow-breathe absolute -left-8 bottom-16 flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-[11px] font-medium text-fog shadow-xl">
              <IconFootnote size={14} className="text-amber" />
              nota al pie omitida
              <span className="font-mono text-[10px] text-moss">✓</span>
            </div>
            <div className="absolute -right-4 top-24 flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-[11px] font-medium text-fog shadow-xl">
              <IconSpeaker size={14} className="text-amber" />
              pase automático activo
            </div>
          </div>
        </aside>
      </main>

      {/* la limpieza */}
      <section className="mt-16 grid gap-8 border-t border-line pt-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber">
            guion limpio
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-snow sm:text-4xl">
            Antes de hablar,
            <br />
            se <em className="text-amber2">limpia</em> la página
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
            Cada página pasa por un filtro que reconoce el mobiliario del libro y lo aparta del
            audio. Lo omitido no se borra: queda contado y consultable en el panel del lector.
          </p>
        </div>
        <div className="lg:col-span-8">
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {CLEAN_ITEMS.map((it, i) => (
              <li
                key={it.n}
                className={`group relative border-t border-line py-6 pr-4 transition-transform duration-300 hover:-translate-y-1 ${
                  i % 2 === 1 ? "sm:translate-y-4" : ""
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-semibold text-amber/70">{it.n}</span>
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-snow">
                    <it.icon size={19} className="text-amber transition-transform duration-300 group-hover:scale-110" />
                    {it.title}
                  </h3>
                </div>
                <p className="mt-2 pl-8 text-[13.5px] leading-relaxed text-fog">{it.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] text-fog/80">
        <span className="inline-flex items-center gap-2">
          <LogoMark size={14} className="text-amber" />
          Voz de Página — hecho con Web Speech API · PDF.js · EPUB (ZIP)
        </span>
        <span className="font-mono tracking-wide">
          la síntesis de voz ocurre en tu navegador
        </span>
      </footer>
    </div>
  );
}
