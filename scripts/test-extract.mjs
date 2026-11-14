// End-to-end check of the extraction API against real PDFs, using the same per-page text
// extraction (pdf.js) the browser uses.
// Usage: node scripts/test-extract.mjs <file.pdf> [benefits|paystub] [baseUrl]
import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const [file, kind = "benefits", base = "http://localhost:3000"] = process.argv.slice(2);
if (!file) throw new Error("usage: node scripts/test-extract.mjs <file.pdf> [benefits|paystub]");

const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), useSystemFonts: true }).promise;
const pages = [];
for (let i = 1; i <= doc.numPages; i++) {
  const content = await (await doc.getPage(i)).getTextContent();
  pages.push(content.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("").replace(/[ \t]+/g, " "));
}
const t = Date.now();
const res = await fetch(`${base}/api/extract`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ kind, pages }),
});
const json = await res.json();
if (!res.ok) {
  console.error(res.status, json);
  process.exit(1);
}
const d = json.data;
const evs = [];
const walk = (o) => {
  if (o && typeof o === "object") {
    if ("quote" in o && "verified" in o) evs.push(o);
    else Object.values(o).forEach(walk);
  }
};
walk(d);
console.log(`file=${file.split(/[\\/]/).pop()} pages=${pages.length} model=${json.model} ${Date.now() - t}ms`);
console.log(`evidence verified ${evs.filter((e) => e.verified).length}/${evs.length}`);
if (process.env.FULL) console.log(JSON.stringify(d, null, 2));
else if (kind === "benefits") {
  console.log("employer:", d.employerName, "| year:", d.planYear, "| OE:", JSON.stringify(d.openEnrollment && { s: d.openEnrollment.start, e: d.openEnrollment.end }));
  console.log("401k:", JSON.stringify(d.retirement.matchTiers), "nonElective:", d.retirement.nonElectivePercent);
  for (const m of d.medicalPlans) console.log("plan:", m.name, m.type, "hsa:", m.hsaEligible, "ded:", m.deductibleIndividual, "prem:", JSON.stringify(m.employeePremium), m.premiumPeriod, "acct:", JSON.stringify(m.employerAccountContribution));
  console.log("hsa:", d.hsa.offered, JSON.stringify(d.hsa.employerContribution), "| fsa:", d.healthFsa.offered, "| dcfsa:", d.dependentCareFsa.offered, "| commuter:", d.commuter.offered, d.commuter.employerSubsidyMonthly, "| espp:", d.espp.offered, d.espp.discountPercent, "| tuition:", d.tuition.offered, d.tuition.annualMax);
  for (const p of d.perks) console.log("perk:", p.category, p.name, p.annualValue, p.evidence?.verified ? "✓" : "✗");
  console.log("notes:", d.notes.join(" | "));
} else console.log(JSON.stringify(d, null, 2));
