import type { Book, BuiltBook, FilterOpts } from "../lib/types";
import type { SpeechEngine } from "../hooks/useSpeech";
import { SectionTitle, SourceBadge, Switch } from "./ui";
import {
  IcAsterisk,
  IcBookmark,
  IcFunnel,
  IcGauge,
  IcHash,
  IcLayers,
  IcLogo,
  IcPen,
  IcPlus,
  IcTrash,
  IcVoice,
  IcX,
} from "./icons";

interface Props {
  books: Book[];
  activeId: string | null;
  built: BuiltBook | null;
  filters: FilterOpts;
  onFilters: (f: FilterOpts) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onPaste: () => void;
  bookmarkPages: number[];
  onGoToPage: (p: number) => void;
  speech: SpeechEngine;
}

const FILTER_ROWS: {
  key: keyof FilterOpts;
  icon: typeof IcHash;
  name: string;
  desc: string;
}[] = [
  { key: "footnotes", icon: IcAsterisk, name: "Notas al pie", desc: "texto pequeño al final de página" },
  { key: "pageNumbers", icon: IcHash, name: "Números de página", desc: "«— 12 —», «pág. 12», folios" },
  { key: "running", icon: IcLayers, name: "Cabeceras repetidas", desc: "título y autor en cada página" },
];

export default function Sidebar({
  books,
  activeId,
  built,
  filters,
  onFilters,
  onSelect,
  onRemove,
  onAdd,
  onPaste,
  bookmarkPages,
  onGoToPage,
  speech,
}: Props) {
  const esVoices = speech.voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const otherVoices = speech.voices.filter((v) => !v.lang.toLowerCase().startsWith("es"));
  const removedTotal = built ? built.stats.pageNumbers + built.stats.running + built.stats.footnotes : 0;
  const activeBook = books.find((b) => b.id === activeId) ?? null;

  return (
    <div className="flex h-full flex-col bg-pine-950 text-fern">
      {/* marca */}
      <div className="flex items-center gap-2.5 border-b border-pine-800 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-fern shadow-[0_4px_14px_rgba(20,138,104,0.35)]">
          <IcLogo className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-[17px] font-bold tracking-tight">Vozalta</p>
          <p className="text-[11px] italic text-moss">el lector que escucha</p>
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        {/* biblioteca */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <SectionTitle>Biblioteca</SectionTitle>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPaste}
                className="group flex items-center gap-1 rounded-md bg-pine-800 px-2 py-1 font-display text-[11px] font-semibold text-moss transition-all hover:bg-gold-500 hover:text-pine-950 active:scale-95"
                title="Pegar texto para leerlo en voz alta"
              >
                <IcPen className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
                Pegar
              </button>
              <button
                onClick={onAdd}
                className="group flex items-center gap-1 rounded-md bg-pine-800 px-2 py-1 font-display text-[11px] font-semibold text-moss transition-all hover:bg-teal-600 hover:text-fern active:scale-95"
                title="Añadir PDF o EPUB"
              >
                <IcPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                Añadir
              </button>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5">
            {books.length === 0 && (
              <li className="rounded-lg border border-dashed border-pine-700 px-3 py-4 text-center text-[12px] text-moss">
                Todavía no hay libros en la sesión.
              </li>
            )}
            {books.map((b) => {
              const active = b.id === activeId;
              return (
                <li key={b.id} className="group relative">
                  <button
                    onClick={() => onSelect(b.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
                      active
                        ? "border-teal-600 bg-pine-800 shadow-[inset_3px_0_0_var(--color-gold-400)]"
                        : "border-transparent hover:border-pine-700 hover:bg-pine-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <SourceBadge source={b.source} />
                      <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold">
                        {b.title}
                      </span>
                    </span>
                    {b.author && (
                      <span className="mt-0.5 block truncate pl-0.5 text-[11px] italic text-moss">
                        {b.author}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(b.id);
                    }}
                    className="absolute right-2 top-2 rounded p-1 text-moss opacity-0 transition-all hover:bg-pine-700 hover:text-fern group-hover:opacity-100"
                    title="Quitar de la sesión"
                  >
                    <IcX className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* limpieza */}
        <div className="mt-6 border-t border-pine-800 px-5 py-5">
          <div className="flex items-center gap-2">
            <IcFunnel className="h-4 w-4 text-gold-400" />
            <SectionTitle>Limpieza del texto</SectionTitle>
          </div>

          {activeBook?.source === "epub" || activeBook?.source === "paste" ? (
            <p className="mt-3 rounded-lg bg-pine-900 px-3 py-2.5 text-[12px] leading-relaxed text-moss">
              {activeBook?.source === "paste"
                ? "Texto pegado a mano: se paginó tal cual, sin limpieza que aplicar."
                : "Este EPUB ya se limpió al importarlo: notas, índices y marcadores de página quedaron fuera."}
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-2.5">
                {FILTER_ROWS.map((row) => (
                  <li key={row.key} className="flex items-center gap-3">
                    <row.icon className="h-4 w-4 shrink-0 text-teal-300" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[12.5px] font-semibold leading-tight">{row.name}</p>
                      <p className="truncate text-[11px] text-moss">{row.desc}</p>
                    </div>
                    <Switch
                      on={filters[row.key]}
                      onChange={(v) => onFilters({ ...filters, [row.key]: v })}
                      label={`Filtrar ${row.name}`}
                    />
                  </li>
                ))}
              </ul>
              {built && (
                <p
                  className={`mt-3 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
                    removedTotal > 0
                      ? "bg-gold-400/10 text-gold-300"
                      : "bg-pine-900 text-moss"
                  }`}
                >
                  {removedTotal > 0
                    ? `${removedTotal} líneas de ruido eliminadas en este libro`
                    : "Sin ruido detectado por ahora"}
                </p>
              )}
            </>
          )}
        </div>

        {/* marcadores */}
        <div className="mt-1 border-t border-pine-800 px-5 py-5">
          <div className="flex items-center gap-2">
            <IcBookmark className="h-4 w-4 text-teal-300" />
            <SectionTitle>Marcadores</SectionTitle>
          </div>
          {bookmarkPages.length === 0 ? (
            <p className="mt-3 rounded-lg bg-pine-900 px-3 py-2.5 text-[12px] leading-relaxed text-moss">
              Sin marcadores en este libro. Pulsa el icono del libro o{" "}
              <kbd className="rounded bg-pine-800 px-1 font-display text-[10px] text-teal-300">Ctrl+B</kbd>{" "}
              para guardar la página actual.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {bookmarkPages.map((p) => (
                <li key={p}>
                  <button
                    onClick={() => onGoToPage(p)}
                    className="rounded-full border border-teal-600/50 bg-teal-600/10 px-3 py-1.5 font-display text-[12px] font-bold text-teal-300 transition-all hover:border-teal-500 hover:bg-teal-600/25 hover:text-fern active:scale-95"
                    title={`Ir a la página ${p + 1}`}
                  >
                    pág. {p + 1}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* voz */}
        <div className="mt-1 border-t border-pine-800 px-5 py-5">
          <div className="flex items-center gap-2">
            <IcVoice className="h-4 w-4 text-gold-400" />
            <SectionTitle>Voz y ritmo</SectionTitle>
          </div>

          <label className="mt-3 block">
            <span className="text-[11px] text-moss">Voz del sistema</span>
            <select
              value={speech.voiceURI}
              onChange={(e) => speech.setVoiceURI(e.target.value)}
              className="mt-1 w-full rounded-md border border-pine-700 bg-pine-900 px-2.5 py-2 font-display text-[12.5px] font-medium text-fern outline-none transition-colors focus:border-teal-500"
            >
              <option value="">Automática (español si hay)</option>
              {esVoices.length > 0 && (
                <optgroup label="Español">
                  {esVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} · {v.lang}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="Otros idiomas">
                  {otherVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} · {v.lang}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="flex items-center justify-between text-[11px] text-moss">
              Velocidad
              <span className="font-display font-bold text-gold-300">{speech.rate.toFixed(2).replace(/0$/, "")}×</span>
            </span>
            <input
              type="range"
              min={0.7}
              max={1.6}
              step={0.05}
              value={speech.rate}
              onChange={(e) => speech.setRate(parseFloat(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="mt-2 block">
            <span className="flex items-center justify-between text-[11px] text-moss">
              Tono
              <span className="font-display font-bold text-gold-300">{speech.pitch.toFixed(2).replace(/0$/, "")}</span>
            </span>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={speech.pitch}
              onChange={(e) => speech.setPitch(parseFloat(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <button
            onClick={() => speech.previewVoice("Así suena tu lectura. Un, dos, tres.")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-pine-700 px-3 py-2 font-display text-[12px] font-semibold text-teal-300 transition-all hover:border-teal-500 hover:bg-pine-900 hover:text-fern active:scale-[0.98]"
          >
            <IcGauge className="h-4 w-4" />
            Probar esta voz
          </button>

          {/* diagnóstico de sonido */}
          <div className="mt-4 rounded-lg border border-pine-800 bg-pine-900/70 px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-[10.5px] font-bold uppercase tracking-[0.14em] text-moss">
                Diagnóstico de sonido
              </p>
              <span
                className={`h-2 w-2 rounded-full ${
                  speech.voices.length ? "bg-teal-400" : "bg-gold-500"
                }`}
                title={speech.voices.length ? "Voces detectadas" : "Sin voces todavía"}
              />
            </div>

            <dl className="mt-2 space-y-1 text-[11px] leading-snug">
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Voces del sistema</dt>
                <dd className="font-display font-bold text-fern">{speech.voices.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">Motor hablando</dt>
                <dd className={`font-display font-bold ${speech.diag.speaking ? "text-teal-300" : "text-fern/60"}`}>
                  {speech.diag.speaking ? "sí" : "no"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-moss">En cola / pausa</dt>
                <dd className="font-display font-bold text-fern/80">
                  {speech.diag.pending ? "cola" : speech.diag.paused ? "pausa" : "—"}
                </dd>
              </div>
            </dl>

            {speech.lastError && (
              <p className="mt-2 rounded bg-[#3b2118] px-2 py-1.5 text-[10.5px] font-medium text-[#f0b39e]">
                Último error: {speech.lastError}
              </p>
            )}

            {speech.voices.length === 0 && (
              <p className="mt-2 rounded bg-gold-400/10 px-2 py-1.5 text-[10.5px] leading-snug text-gold-300">
                Tu navegador aún no expone voces. Pulsa «Probar esta voz»: a veces el primer
                gesto las desbloquea.
              </p>
            )}

            <button
              onClick={speech.beep}
              className="mt-2.5 w-full rounded-md bg-pine-800 px-3 py-1.5 font-display text-[11px] font-semibold text-moss transition-all hover:bg-pine-700 hover:text-fern active:scale-[0.98]"
              title="Emite un tono con WebAudio, sin usar la síntesis de voz"
            >
              Bip de prueba (audio puro)
            </button>
            <p className="mt-1.5 text-[10px] leading-snug text-moss/80">
              ¿Suena el bip pero no la voz? Es un problema de voces del sistema. ¿Ni el bip?
              Es el volumen del sistema o la pestaña silenciada.
            </p>
          </div>
        </div>
      </div>

      {/* pie */}
      <div className="border-t border-pine-800 px-5 py-3 text-[10.5px] leading-relaxed text-moss">
        <p className="font-display font-semibold tracking-wide text-fern/70">ATAJOS</p>
        <p>
          <kbd>Espacio</kbd> reproducir/pausa · <kbd>←</kbd><kbd>→</kbd> página ·{" "}
          <kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> frase · <kbd>F</kbd> seguimiento
        </p>
      </div>
    </div>
  );
}
