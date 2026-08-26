import { useEffect, useState } from "react";
import { IcCheck, IcShare } from "./icons";

const APP_TEXT =
  "Vozalta — convierte tus PDF y EPUB en audio: lectura en voz alta con pase automático de página.";

/**
 * Comparte la app: en móvil abre la hoja nativa del sistema (Web Share API);
 * en escritorio copia el enlace al portapapeles con confirmación visual.
 */
export default function ShareButton({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyFallback = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
  };

  const onShare = async () => {
    const data = { title: "Vozalta — el lector que escucha", text: APP_TEXT, url: window.location.href };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* el usuario canceló o falló: caemos en copiar el enlace */
      }
    }
    await copyFallback();
  };

  if (compact) {
    return (
      <button
        onClick={onShare}
        title={copied ? "¡Enlace copiado!" : "Compartir Vozalta"}
        aria-label="Compartir Vozalta"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[12px] font-bold transition-all duration-200 active:scale-95 ${
          copied
            ? "border-teal-500 bg-teal-500 text-fern shadow-md shadow-teal-500/30"
            : "border-line bg-paper text-pine-800 hover:border-teal-500 hover:text-teal-600"
        }`}
      >
        {copied ? <IcCheck className="h-3.5 w-3.5" /> : <IcShare className="h-3.5 w-3.5" />}
        <span className={copied ? "pop-in" : ""}>{copied ? "¡Copiado!" : "Compartir"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onShare}
      title={copied ? "¡Enlace copiado!" : "Compartir Vozalta"}
      className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-display text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
        copied
          ? "border-teal-500 bg-teal-500 text-fern shadow-md shadow-teal-500/30"
          : "border-pine-700 bg-pine-900/60 text-fern hover:border-gold-400 hover:text-gold-300"
      }`}
    >
      {copied ? <IcCheck className="h-4 w-4" /> : <IcShare className="h-4 w-4 transition-transform group-hover:rotate-12" />}
      {copied ? "¡Enlace copiado!" : "Compartir"}
    </button>
  );
}
