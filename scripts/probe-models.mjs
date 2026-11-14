// Probe which Gemini models the configured service account can call on Vertex AI.
// Usage: node --env-file=.env.local scripts/probe-models.mjs
import { GoogleGenAI } from "@google/genai";

const creds = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
const ai = new GoogleGenAI({
  vertexai: true,
  project: creds.project_id,
  location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  googleAuthOptions: { credentials: creds, scopes: ["https://www.googleapis.com/auth/cloud-platform"] },
});

const models = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];

for (const model of models) {
  const t = Date.now();
  try {
    const r = await ai.models.generateContent({ model, contents: "Reply with the single word: ok" });
    console.log("OK  ", model, `${Date.now() - t}ms`, JSON.stringify(r.text?.trim()));
  } catch (e) {
    console.log("FAIL", model, String(e.message || e).slice(0, 160));
  }
}
