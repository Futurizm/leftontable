import "server-only";
import { GoogleGenAI, type ThinkingLevel } from "@google/genai";

let client: GoogleGenAI | null = null;

function credentials() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const json = b64 ? Buffer.from(b64, "base64").toString("utf8") : raw;
  if (!json) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_BASE64 (or GOOGLE_SERVICE_ACCOUNT_JSON) env var");
  return JSON.parse(json) as { project_id: string; client_email: string; private_key: string };
}

export function ai(): GoogleGenAI {
  if (client) return client;
  const creds = credentials();
  client = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT || creds.project_id,
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
    googleAuthOptions: { credentials: creds, scopes: ["https://www.googleapis.com/auth/cloud-platform"] },
  });
  return client;
}

export const MODELS = (process.env.GEMINI_MODELS || "gemini-3.5-flash,gemini-3-flash-preview").split(",").map((s) => s.trim());

// Extraction is mostly reading, not reasoning: low thinking keeps latency down. Set "" to use the model default.
const THINKING = (process.env.GEMINI_THINKING_LEVEL ?? "LOW") as ThinkingLevel | "";

type Part ={ text: string } | { inlineData: { mimeType: string; data: string } };

/** Ask Gemini for JSON that matches `schema`, falling back across models on failure. */
export async function extractJson<T>(system: string, parts: Part[], schema: object): Promise<{ data: T; model: string }> {
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await ai().models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: system,
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          ...(THINKING ? { thinkingConfig: { thinkingLevel: THINKING } } : {}),
        },
      });
      const text = res.text;
      if (!text) throw new Error("Empty model response");
      return { data: JSON.parse(text) as T, model };
    } catch (e) {
      lastErr = e;
      console.error(`[gemini] ${model} failed:`, String((e as Error)?.message ?? e).slice(0, 300));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All models failed");
}
