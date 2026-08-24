import { useCallback, useRef, useState } from "react";
import Landing from "./components/Landing";
import Reader from "./components/Reader";
import { extractPdf } from "./lib/pdf";
import { extractEpub, extractTxt } from "./lib/epub";
import { buildSampleBook } from "./lib/sample";
import type { Book } from "./lib/types";
import { IconAlert, IconCheck, LogoMark } from "./components/icons";

interface Toast {
  id: number;
  kind: "ok" | "err";
  text: string;
}

export default function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<{ name: string; frac: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const notify = useCallback((kind: Toast["kind"], text: string) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "epub", "txt"].includes(ext)) {
        notify(
          "err",
          `«.${ext || "?"}» no es compatible. Usa PDF, EPUB o TXT.`
        );
        return;
      }
      setLoading({ name: file.name, frac: 0 });
      try {
        let b: Book;
        if (ext === "pdf") {
          b = await extractPdf(file, (f) => setLoading({ name: file.name, frac: f }));
        } else if (ext === "epub") {
          b = await extractEpub(file, (f) => setLoading({ name: file.name, frac: f }));
        } else {
          b = await extractTxt(file);
        }
        if (b.pages.length === 0) throw new Error("No se pudo extraer texto de este documento.");
        setBook(b);
        notify(
          "ok",
          `«${b.title}» listo: ${b.pages.length} páginas al habla${
            b.removedCount > 0 ? ` · ${b.removedCount} elementos de referencia omitidos` : ""
          }.`
        );
      } catch (e) {
        notify("err", e instanceof Error ? e.message : "No se pudo leer el documento.");
      } finally {
        setLoading(null);
      }
    },
    [notify]
  );

  const handleSample = useCallback(() => {
    setLoading({ name: "Don Quijote (muestra)", frac: 0.4 });
    window.setTimeout(() => {
      try {
        setBook(buildSampleBook());
        notify("ok", "Muestra cargada: 3 capítulos del Quijote con notas al pie ya limpiadas.");
      } finally {
        setLoading(null);
      }
    }, 350);
  }, [notify]);

  const closeBook = useCallback(() => setBook(null), []);

  return (
    <div className="bg-scene relative min-h-screen overflow-x-hidden font-body text-snow">
      <div className="noise-overlay" aria-hidden />

      {book ? (
        <Reader
          key={book.source + ":" + book.fileName}
          book={book}
          onClose={closeBook}
          onFile={handleFile}
        />
      ) : (
        <Landing onFile={handleFile} onSample={handleSample} />
      )}

      {/* pantalla de carga */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-6 backdrop-blur-sm">
          <div className="toast-in w-full max-w-sm rounded-md border border-line bg-panel p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-amber/12 text-amber ring-1 ring-amber/30">
                <LogoMark size={24} className="spin-slow" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-snow">Preparando el guion…</p>
                <p className="truncate font-mono text-[11px] text-fog">{loading.name}</p>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber to-amber2 transition-[width] duration-300"
                style={{ width: `${Math.max(6, Math.round(loading.frac * 100))}%` }}
              />
            </div>
            <p className="mt-2.5 text-right font-mono text-[10px] text-fog">
              extrayendo texto · {Math.round(loading.frac * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* avisos */}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[13px] leading-snug shadow-2xl ${
              t.kind === "ok"
                ? "border-moss/40 bg-[#101d18] text-snow"
                : "border-ember/40 bg-[#201312] text-snow"
            }`}
          >
            <span className={t.kind === "ok" ? "mt-0.5 text-moss" : "mt-0.5 text-ember"}>
              {t.kind === "ok" ? <IconCheck size={15} /> : <IconAlert size={15} />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
