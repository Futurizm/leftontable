import { NextResponse } from "next/server";
import { extractJson } from "@/lib/server/gemini";
import { BENEFITS_PROMPT, PAYSTUB_PROMPT } from "@/lib/server/prompts";
import { benefitsSchema, paystubSchema } from "@/lib/server/schemas";
import { verifyBenefits, verifyPaystub } from "@/lib/server/verify";
import type { BenefitsExtraction, PaystubExtraction } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_CHARS = 600_000;
const MAX_FILE_BYTES = 3_500_000;
const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"]);

type Body = {
  kind: "benefits" | "paystub";
  /** Text of each page, extracted in the browser. */
  pages?: string[];
  /** Fallback for scanned PDFs or photos: base64 file. */
  file?: { mimeType: string; data: string };
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.kind !== "benefits" && body.kind !== "paystub") {
    return NextResponse.json({ error: "kind must be 'benefits' or 'paystub'" }, { status: 400 });
  }

  const pages = Array.isArray(body.pages) ? body.pages.map((p) => String(p ?? "")) : null;
  const text = pages ? pages.map((p, i) => `=== PAGE ${i + 1} ===\n${p}`).join("\n\n") : "";
  const hasText = text.replace(/=== PAGE \d+ ===/g, "").trim().length > 80;

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (hasText) {
    if (text.length > MAX_CHARS) {
      return NextResponse.json({ error: "This document is too long. Try uploading just the benefits summary section." }, { status: 413 });
    }
    parts.push({ text });
  } else if (body.file?.data) {
    if (!ALLOWED_MIME.has(body.file.mimeType)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    if ((body.file.data.length * 3) / 4 > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "This file has no readable text and is too large to scan as an image (max 3.5 MB)." }, { status: 413 });
    }
    parts.push({ inlineData: { mimeType: body.file.mimeType, data: body.file.data } });
  } else {
    return NextResponse.json({ error: "We couldn't read any text in this file. Is it a scanned image? Try a photo or a text-based PDF." }, { status: 422 });
  }

  const started = Date.now();
  try {
    if (body.kind === "benefits") {
      const { data, model } = await extractJson<BenefitsExtraction>(BENEFITS_PROMPT, parts, benefitsSchema);
      return NextResponse.json({ data: verifyBenefits(data, hasText ? pages : null), model, ms: Date.now() - started });
    }
    const { data, model } = await extractJson<PaystubExtraction>(PAYSTUB_PROMPT, parts, paystubSchema);
    return NextResponse.json({ data: verifyPaystub(data, hasText ? pages : null), model, ms: Date.now() - started });
  } catch (e) {
    console.error("[extract]", e);
    return NextResponse.json({ error: "The AI couldn't read this document right now. Please try again in a moment." }, { status: 502 });
  }
}
