"use client";

export type ReadResult = {
  name: string;
  pages: string[];
  pageCount: number;
  /** Base64 fallback for scanned PDFs / photos (no text layer). */
  file?: { mimeType: string; data: string };
};

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

async function shrinkImage(file: Blob, maxSide = 2000): Promise<{ mimeType: string; data: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85));
  return { mimeType: "image/jpeg", data: toBase64(await blob.arrayBuffer()) };
}

/** Extract per-page text from a PDF entirely in the browser. Images are passed through as base64. */
export async function readDocument(file: File, onProgress?: (done: number, total: number) => void): Promise<ReadResult> {
  if (file.type.startsWith("image/")) {
    onProgress?.(1, 1);
    return { name: file.name, pages: [], pageCount: 1, file: await shrinkImage(file) };
  }
  const buf = await file.arrayBuffer();
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
  } catch {
    throw new Error("This file doesn't look like a valid PDF.");
  }
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const it of content.items) {
      if (!("str" in it)) continue;
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line);
        line = "";
      }
      line += (line && !line.endsWith(" ") ? " " : "") + it.str;
      lastY = y;
    }
    lines.push(line);
    pages.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"));
    onProgress?.(i, doc.numPages);
  }
  const chars = pages.join("").replace(/\s/g, "").length;
  const result: ReadResult = { name: file.name, pages, pageCount: doc.numPages };
  if (chars < 80) {
    // Scanned PDF: no text layer. Send the PDF itself if it's small enough for the model to OCR.
    if (buf.byteLength > 3_400_000) throw new Error("This PDF is a scan without readable text and is too large to OCR. Try a photo of the key pages or a text-based PDF.");
    result.file = { mimeType: "application/pdf", data: toBase64(buf) };
  }
  return result;
}

export async function extract<T>(kind: "benefits" | "paystub", doc: ReadResult): Promise<{ data: T; model: string; ms: number }> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, pages: doc.pages, file: doc.file }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Analysis failed (${res.status})`);
  return json;
}
