import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { Book, RawLine } from "./types";
import { uid } from "./book";

GlobalWorkerOptions.workerSrc = workerUrl;

interface TItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface TempLine {
  text: string;
  size: number;
  y: number;
  x: number;
  xEnd: number;
}

/** Extrae el texto de un PDF agrupando los fragmentos en líneas por posición. */
export async function loadPdfBook(
  file: File,
  onProgress?: (p: number) => void
): Promise<Book> {
  const data = await file.arrayBuffer();
  const doc = await getDocument({ data }).promise;
  const rawPages: RawLine[][] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = tc.items.filter(
      (it) => "str" in it && it.str.trim().length > 0
    ) as unknown as TItem[];
    /* arriba→abajo, izquierda→derecha */
    items.sort(
      (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]
    );

    const lines: TempLine[] = [];
    for (const it of items) {
      const y = it.transform[5];
      const x = it.transform[4];
      const size =
        it.height ||
        Math.hypot(it.transform[2] ?? 0, it.transform[3] ?? 0) ||
        10;
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - y) <= Math.max(2.5, last.size * 0.4)) {
        const gap = x - last.xEnd;
        const needsSpace =
          gap > size * 0.12 &&
          !last.text.endsWith(" ") &&
          !it.str.startsWith(" ") &&
          !/^[.,;:)\]»”'!?%]/.test(it.str);
        last.text += (needsSpace ? " " : "") + it.str;
        last.xEnd = x + it.width;
        last.size = Math.max(last.size, size);
      } else {
        lines.push({ text: it.str, size, y, x, xEnd: x + it.width });
      }
    }

    rawPages.push(
      lines
        .map((l) => ({
          text: l.text.replace(/\s+/g, " ").trim(),
          size: l.size,
          y: l.y,
          x: l.x,
          pageH: vp.height,
        }))
        .filter((l) => l.text)
    );
    onProgress?.(p / doc.numPages);
  }

  const totalLines = rawPages.reduce((a, pg) => a + pg.length, 0);
  if (totalLines === 0) {
    throw new Error(
      "Este PDF no tiene texto extraíble: parece un documento escaneado. Prueba con un PDF de texto seleccionable."
    );
  }

  let title = file.name.replace(/\.pdf$/i, "");
  try {
    const meta = await doc.getMetadata();
    const info = meta?.info as { Title?: string } | undefined;
    if (info?.Title?.trim()) title = info.Title.trim();
  } catch {
    /* sin metadatos */
  }

  return { id: uid(), title, source: "pdf", raw: rawPages, pages: null };
}
