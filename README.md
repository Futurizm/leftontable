# LeftOnTable

**Find the money your employer already promised you.**

US employees get a 30–50 page benefits guide every open enrollment and almost nobody reads it. People miss 401(k) matches, employer HSA money, pre-tax daycare and commuter accounts, stipends, and pick the wrong health plan. LeftOnTable reads the guide (and optionally a paystub), finds what you're not using, prices it in dollars per year, and tells you exactly how to claim it.

- **B2C, web-only, no sign-up.** Upload → answer 6 questions → ranked list of money with steps, deadlines and sources.
- **Every number has a source.** The AI extracts facts with verbatim quotes and page numbers; the server checks each quote against the document text and marks it ✓ verified.
- **AI extracts, code calculates.** Gemini only reads the documents. All dollar amounts come from a deterministic, unit-testable rules engine with 2026 IRS limits and federal/state/FICA marginal rates (`src/lib/engine.ts`, `src/lib/tax.ts`).
- **Private by design.** PDFs are parsed in the browser with pdf.js; only page text is sent for analysis. Nothing is stored server-side; the report lives in the browser tab.

## What it checks

401(k)/403(b) match gap · employer HSA seed money · HSA / Health FSA tax savings · Dependent Care FSA · commuter benefits + subsidies · health plan cost comparison for your expected usage · ESPP · tuition reimbursement · stipends and perks (wellness, phone, learning, student loans…) · free perks (EAP, legal, backup care).

## Architecture

```
Browser                                   Server (Next.js route)            Vertex AI
───────                                   ──────────────────────            ─────────
PDF ─► pdf.js text per page ─► POST /api/extract ─► Gemini 3.5 Flash (JSON schema)
                                           ◄─ verify quotes against pages ◄─┘
facts + profile ─► rules engine (client, instant recalculation) ─► results UI
```

- `src/app/api/extract/route.ts` – extraction endpoint (benefits guide or paystub; scanned PDFs / photos fall back to multimodal input)
- `src/lib/server/schemas.ts`, `prompts.ts` – structured-output schema and extraction rules
- `src/lib/server/verify.ts` – evidence verification and page correction
- `src/lib/engine.ts` – opportunity calculations, plan comparison
- `src/components/scan/*` – upload → paystub → profile → results flow

## Run locally

```bash
npm install
cp .env.example .env.local   # fill GOOGLE_SERVICE_ACCOUNT_BASE64
npm run dev
```

Open http://localhost:3000 and click **Try a sample employee** (fictional Acme Corp guide + paystub in `public/samples`, regenerate with `npm run samples`).

Test extraction against any PDF from the command line (dev server must be running):

```bash
node scripts/test-extract.mjs path/to/benefits-guide.pdf
node scripts/test-extract.mjs path/to/paystub.pdf paystub
```

Tested on public 2026 guides from ADP TotalSource (38 pages), Bentley University (24), DC Government (47), LLNL (32), The Ford Family Foundation (1), with 100% of evidence quotes verified.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add env vars `GOOGLE_SERVICE_ACCOUNT_BASE64` and `GOOGLE_CLOUD_LOCATION=global`.
3. Deploy. The extraction route uses `maxDuration = 120`.

## Disclaimer

Educational estimates, not tax, legal or investment advice. The Acme Corp sample documents are fictional.
