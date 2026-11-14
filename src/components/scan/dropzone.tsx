"use client";

import { useRef, useState } from "react";

export type DocState = {
  name: string;
  pageCount?: number;
  status: "reading" | "extracting" | "done" | "error";
  progress?: [number, number];
  error?: string;
  ms?: number;
};

export function Dropzone({
  accept, title, hint, onFile, doc, onClear,
}: {
  accept: string;
  title: string;
  hint: string;
  onFile: (f: File) => void;
  doc: DocState | null;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  if (doc) {
    const pct = doc.progress ? Math.round((doc.progress[0] / Math.max(1, doc.progress[1])) * 100) : 0;
    return (
      <div className="card relative overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-11 shrink-0 items-end justify-center border border-line-2 bg-[#050505] pb-1.5 font-mono text-[9px] text-muted">PDF</div>
            <div className="min-w-0">
              <div className="truncate font-medium">{doc.name}</div>
              <div className="mt-1 font-mono text-[11px] text-muted">
                {doc.status === "reading" && <>Reading in your browser… {doc.progress ? `${doc.progress[0]}/${doc.progress[1]} pages` : ""}</>}
                {doc.status === "extracting" && <span className="text-fg">AI is reading the fine print{doc.pageCount ? ` (${doc.pageCount} pages)` : ""}<span className="cursor-blink">_</span></span>}
                {doc.status === "done" && <span className="text-money">✓ Analyzed{doc.pageCount ? ` ${doc.pageCount} pages` : ""}{doc.ms ? ` in ${(doc.ms / 1000).toFixed(0)}s` : ""}</span>}
                {doc.status === "error" && <span className="text-warn">{doc.error}</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClear} className="btn btn-ghost btn-sm shrink-0">Replace</button>
        </div>
        {(doc.status === "reading" || doc.status === "extracting") && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-line">
            <div className={`h-full bg-fg transition-all duration-300 ${doc.status === "extracting" ? "animate-pulse" : ""}`} style={{ width: doc.status === "extracting" ? "100%" : `${pct}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`group relative flex w-full flex-col items-center justify-center overflow-hidden border border-dashed px-6 py-14 text-center transition ${over ? "border-fg bg-panel-2" : "border-line-2 bg-panel hover:border-fg/70"}`}
    >
      <div className="halftone pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="relative text-muted transition group-hover:text-fg" aria-hidden>
        <path d="M12 16V4m0 0-4 4m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
      <div className="relative mt-4 text-lg font-semibold">{title}</div>
      <div className="relative mt-1 font-mono text-[12px] text-muted">{hint}</div>
      <span className="btn btn-primary btn-sm relative mt-6">Choose file</span>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}
