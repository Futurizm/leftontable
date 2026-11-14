// Generates the fictional "Acme Corp" sample benefits guide + paystub used by the
// "Try a sample employee" demo. Run: npm run samples
import fs from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { GUIDE } from "./sample-content.mjs";
import { COMPANIES } from "./samples/companies.mjs";
import { genericPaystub } from "./samples/paystub.mjs";

const W = 612, H = 792, M = 60, TOP = H - 70, BOTTOM = 64;
const INK = rgb(0.1, 0.1, 0.12), MUTED = rgb(0.42, 0.42, 0.45), ACCENT = rgb(0.11, 0.42, 0.33), LINE = rgb(0.84, 0.84, 0.86), TINT = rgb(0.93, 0.96, 0.94);

async function fontsFor(doc) {
  return {
    r: await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
    i: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
}

function wrap(text, font, size, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// ── Benefits guide ──────────────────────────────────────────────
async function guide(opts = {}) {
  const title = opts.title ?? "Acme Corp 2027 Benefits Guide";
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor("Acme Corp People Team (fictional)");
  const f = await fontsFor(doc);
  const toc = [];
  let page, y;

  const newPage = () => {
    page = doc.addPage([W, H]);
    y = TOP;
  };
  const ensure = (h) => {
    if (y - h < BOTTOM) newPage();
  };
  const text = (s, x, yy, size, font = f.r, color = INK) => page.drawText(s, { x, y: yy, size, font, color });
  const para = (s, { size = 10, font = f.r, color = INK, indent = 0, lead = 4.6, after = 7 } = {}) => {
    for (const l of wrap(s, font, size, W - 2 * M - indent)) {
      ensure(size + lead);
      text(l, M + indent, y - size, size, font, color);
      y -= size + lead;
    }
    y -= after;
  };

  // Cover
  newPage();
  if (opts.cover) {
    const [eyebrow, big, sub, oe] = opts.cover;
    const [r, g, b] = opts.color;
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(r, g, b) });
    page.drawRectangle({ x: M, y: H - 250, width: 46, height: 6, color: rgb(0.95, 0.85, 0.55) });
    text(eyebrow, M, H - 220, 13, f.b, rgb(0.9, 0.9, 0.9));
    text(big, M, H - 300, 38, f.b, rgb(1, 1, 1));
    text(sub, M, H - 335, 14, f.r, rgb(0.88, 0.88, 0.88));
    text(oe, M, H - 390, 13, f.b, rgb(0.95, 0.85, 0.55));
    text("FICTIONAL SAMPLE DOCUMENT - created for product testing only", M, 100, 9, f.r, rgb(0.75, 0.75, 0.75));
  } else {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.07, 0.2, 0.17) });
  page.drawRectangle({ x: M, y: H - 250, width: 46, height: 6, color: rgb(0.55, 0.85, 0.65) });
  text("ACME CORP", M, H - 220, 14, f.b, rgb(0.8, 0.92, 0.85));
  text("2027 Benefits Guide", M, H - 300, 40, f.b, rgb(1, 1, 1));
  text("Your guide to medical, savings, retirement, wellness", M, H - 335, 14, f.r, rgb(0.85, 0.9, 0.88));
  text("and family benefits for the January 1 - December 31, 2027 plan year", M, H - 354, 14, f.r, rgb(0.85, 0.9, 0.88));
  text("Open Enrollment: November 2 - November 30, 2026", M, H - 410, 13, f.b, rgb(0.55, 0.85, 0.65));
  text("For full-time U.S. employees", M, 120, 11, f.r, rgb(0.8, 0.88, 0.85));
  text("FICTIONAL SAMPLE DOCUMENT - created for product demonstration only", M, 100, 9, f.r, rgb(0.6, 0.72, 0.68));
  }

  // Content (TOC page inserted afterwards)
  for (const block of opts.blocks ?? GUIDE) {
    const [kind, a, b, c] = block;
    if (kind === "h1") {
      newPage();

      toc.push([a, doc.getPageCount()]);
      page.drawRectangle({ x: M, y: y - 4, width: 34, height: 4, color: ACCENT });
      y -= 16;
      text(a, M, y - 24, 24, f.b);
      y -= 44;
    } else if (kind === "h2") {
      ensure(60);
      y -= 6;
      text(a, M, y - 14, 14, f.b, ACCENT);
      y -= 24;
    } else if (kind === "h3") {
      ensure(40);
      text(a, M, y - 11, 11, f.b);
      y -= 18;
    } else if (kind === "p") para(a);
    else if (kind === "note") para(a, { size: 8.5, color: MUTED, font: f.i });
    else if (kind === "callout") {
      const lines = wrap(a, f.b, 10, W - 2 * M - 24);
      const h = lines.length * 14.6 + 20;
      ensure(h + 8);
      page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: TINT, borderColor: ACCENT, borderWidth: 0.8 });
      let yy = y - 14;
      for (const l of lines) {
        text(l, M + 12, yy - 6, 10, f.b, ACCENT);
        yy -= 14.6;
      }
      y -= h + 12;
    } else if (kind === "ul") {
      for (const item of a) {
        const lines = wrap(item, f.r, 10, W - 2 * M - 16);
        ensure(lines.length * 14.6);
        text("•", M + 3, y - 10, 10, f.b, ACCENT);
        for (const l of lines) {
          ensure(14.6);
          text(l, M + 16, y - 10, 10);
          y -= 14.6;
        }
        y -= 2.5;
      }
      y -= 6;
    } else if (kind === "table") {
      const cols = a, rows = b, widths = c;
      const drawRow = (cells, header) => {
        const wrapped = cells.map((cell, i) => wrap(cell, header ? f.b : f.r, 9, widths[i] - 10));
        const h = Math.max(...wrapped.map((w) => w.length)) * 12 + 8;
        if (y - h < BOTTOM) {
          newPage();
          if (!header) drawRow(cols, true);
        }
        if (header) page.drawRectangle({ x: M, y: y - h, width: widths.reduce((s, w) => s + w, 0), height: h, color: TINT });
        let x = M;
        wrapped.forEach((lines, i) => {
          lines.forEach((l, j) => text(l, x + 5, y - 13 - j * 12, 9, header ? f.b : f.r));
          x += widths[i];
        });
        y -= h;
        page.drawLine({ start: { x: M, y }, end: { x: M + widths.reduce((s, w) => s + w, 0), y }, thickness: 0.6, color: LINE });
      };
      ensure(40);
      drawRow(cols, true);
      rows.forEach((r) => drawRow(r, false));
      y -= 14;
    }
  }

  // Table of contents (inserted as page 2)
  const tocPage = doc.insertPage(1, [W, H]);
  tocPage.drawRectangle({ x: M, y: TOP - 4, width: 34, height: 4, color: ACCENT });
  tocPage.drawText("Contents", { x: M, y: TOP - 40, size: 24, font: f.b, color: INK });
  let ty = TOP - 80;
  for (const [name, p] of toc) {
    const pageNo = String(p + 1); // +1 for the inserted TOC page
    tocPage.drawText(name, { x: M, y: ty, size: 11, font: f.r, color: INK });
    const nameW = f.r.widthOfTextAtSize(name, 11);
    const numW = f.r.widthOfTextAtSize(pageNo, 11);
    const dots = ".".repeat(Math.max(0, Math.floor((W - 2 * M - nameW - numW - 12) / f.r.widthOfTextAtSize(".", 11))));
    tocPage.drawText(dots, { x: M + nameW + 6, y: ty, size: 11, font: f.r, color: LINE });
    tocPage.drawText(pageNo, { x: W - M - numW, y: ty, size: 11, font: f.r, color: INK });
    ty -= 24;
  }

  // Running header + footer on every page after the cover
  const pages = doc.getPages();
  const sectionOf = (i) => {
    let s = "";
    for (const [name, p] of toc) if (p - 1 + 1 <= i) s = name; // toc pages are 1-based before TOC insert
    return s;
  };
  pages.forEach((pg, i) => {
    if (i === 0) return;
    pg.drawText(title, { x: M, y: H - 40, size: 8, font: f.b, color: MUTED });
    const s = i === 1 ? "Contents" : sectionOf(i);
    const sw = f.r.widthOfTextAtSize(s, 8);
    pg.drawText(s, { x: W - M - sw, y: H - 40, size: 8, font: f.r, color: MUTED });
    pg.drawLine({ start: { x: M, y: H - 48 }, end: { x: W - M, y: H - 48 }, thickness: 0.5, color: LINE });
    pg.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.5, color: LINE });
    pg.drawText("FICTIONAL SAMPLE for demonstration only", { x: M, y: 32, size: 7.5, font: f.r, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    pg.drawText(label, { x: W - M - f.r.widthOfTextAtSize(label, 8), y: 32, size: 8, font: f.r, color: MUTED });
  });
  return { bytes: await doc.save(), pages: pages.length };
}

// ── Paystub (2 pages) ───────────────────────────────────────────
async function paystub() {
  const doc = await PDFDocument.create();
  doc.setTitle("Acme Corp Earnings Statement 11/13/2026");
  const f = await fontsFor(doc);
  let page = doc.addPage([W, H]);
  let y = H - 50;
  const t = (s, x, size = 8.5, font = f.r, color = INK) => page.drawText(String(s), { x, y, size, font, color });
  const rule = (yy = y - 5, c = LINE) => page.drawLine({ start: { x: M - 20, y: yy }, end: { x: W - M + 20, y: yy }, thickness: 0.6, color: c });
  const L = M - 20, R = W - M + 20;
  const right = (s, xr, size = 8.5, font = f.r) => page.drawText(String(s), { x: xr - font.widthOfTextAtSize(String(s), size), y, size, font, color: INK });

  const section = (title, cols, rows, colX, bold = []) => {
    page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 16, color: TINT });
    t(title, L + 4, 8.5, f.b, ACCENT);
    cols.forEach((c, i) => i > 0 && right(c, colX[i], 8, f.b));
    y -= 18;
    rows.forEach((r, ri) => {
      const isBold = bold.includes(ri);
      t(r[0], L + 4, 8.5, isBold ? f.b : f.r);
      r.slice(1).forEach((c, i) => right(c, colX[i + 1], 8.5, isBold ? f.b : f.r));
      rule(y - 4);
      y -= 14;
    });
    y -= 8;
  };

  // Header
  t("ACME CORP", L, 16, f.b); right("EARNINGS STATEMENT", R, 12, f.b); y -= 14;
  t("1 Acme Plaza, Suite 400, Chicago, IL 60601", L, 8.5, f.r, MUTED); right("FICTIONAL SAMPLE", R, 8, f.r); y -= 11;
  t("Payroll questions: Acme Benefits Center 1-800-555-0142", L, 8.5, f.r, MUTED); y -= 22;

  const info = [
    ["Employee", "Jordan Rivera", "Pay period", "10/25/2026 - 11/07/2026"],
    ["Employee ID", "004821", "Pay date", "11/13/2026"],
    ["Department", "Operations - Supply Planning", "Pay frequency", "Biweekly"],
    ["Job title", "Senior Planning Analyst", "Check / advice no.", "DD-2026-23-004821"],
    ["Pay rate", "Salaried", "Work state", "IL"],
  ];
  for (const r of info) {
    t(r[0], L, 8, f.r, MUTED); t(r[1], L + 80, 8.5, f.b); t(r[2], 330, 8, f.r, MUTED); t(r[3], 410, 8.5, f.b);
    y -= 13;
  }
  y -= 10;

  const X = [L, 330, 395, 470, R];
  section("EARNINGS", ["", "Hours", "Rate", "Current", "Year to date"], [
    ["Regular salary", "72.00", "43.2692", "3,115.39", "72,123.08"],
    ["Paid time off", "8.00", "43.2692", "346.15", "6,577.92"],
    ["Holiday", "0.00", "43.2692", "0.00", "914.42"],
    ["Cell phone stipend", "", "", "0.00", "0.00"],
    ["Gross pay", "80.00", "", "3,461.54", "79,615.42"],
  ], X, [4]);

  const X2 = [L, 0, 0, 470, R];
  section("PRE-TAX DEDUCTIONS", ["", "", "", "Current", "Year to date"], [
    ["401(k) 3%", "", "", "103.85", "2,388.55"],
    ["Medical - Acme Choice PPO (Family)", "", "", "214.00", "4,922.00"],
    ["Dental - Basic (Family)", "", "", "11.60", "266.80"],
    ["Vision (Family)", "", "", "4.20", "96.60"],
    ["Total pre-tax deductions", "", "", "333.65", "7,673.95"],
  ], X2, [4]);

  section("TAXES", ["", "", "", "Current", "Year to date"], [
    ["Federal income tax", "", "", "180.00", "4,140.00"],
    ["Social Security (OASDI)", "", "", "200.37", "4,608.51"],
    ["Medicare", "", "", "46.86", "1,077.78"],
    ["IL state income tax", "", "", "149.40", "3,436.20"],
    ["Total taxes", "", "", "576.63", "13,262.49"],
  ], X2, [4]);

  section("AFTER-TAX DEDUCTIONS", ["", "", "", "Current", "Year to date"], [
    ["Supplemental life - employee (1x)", "", "", "6.40", "147.20"],
    ["Accident insurance (Family)", "", "", "9.80", "225.40"],
    ["Total after-tax deductions", "", "", "16.20", "372.60"],
  ], X2, [2]);

  section("EMPLOYER CONTRIBUTIONS (not included in pay)", ["", "", "", "Current", "Year to date"], [
    ["401(k) company match", "", "", "103.85", "2,388.55"],
    ["Medical - employer share", "", "", "642.00", "14,766.00"],
    ["Basic life / AD&D (imputed income on 1x salary over $50k)", "", "", "1.86", "42.78"],
  ], X2);

  page.drawRectangle({ x: L, y: y - 30, width: R - L, height: 36, color: rgb(0.07, 0.2, 0.17) });
  y -= 18;
  t("NET PAY", L + 10, 12, f.b, rgb(1, 1, 1));
  page.drawText("2,535.06", { x: R - 10 - f.b.widthOfTextAtSize("2,535.06", 14), y: y - 2, size: 14, font: f.b, color: rgb(0.6, 0.9, 0.7) });
  page.drawText("YTD 58,306.38", { x: 330, y, size: 9, font: f.r, color: rgb(0.85, 0.9, 0.88) });
  y -= 36;
  t("Statement continues on page 2.", L, 8, f.i, MUTED);
  page.drawText("Page 1 of 2", { x: R - f.r.widthOfTextAtSize("Page 1 of 2", 8), y: 30, size: 8, font: f.r, color: MUTED });

  // Page 2
  page = doc.addPage([W, H]);
  y = H - 50;
  t("ACME CORP  |  Earnings statement for Jordan Rivera  |  Pay date 11/13/2026", L, 9, f.b); y -= 26;

  section("NET PAY DISTRIBUTION", ["", "", "", "", "Amount"], [
    ["Direct deposit - Checking ****4821 (Lakeshore Credit Union)", "", "", "", "2,035.06"],
    ["Direct deposit - Savings ****9033 (Lakeshore Credit Union)", "", "", "", "500.00"],
    ["Total net pay", "", "", "", "2,535.06"],
  ], X, [2]);

  section("TAXABLE WAGES", ["", "", "", "Current", "Year to date"], [
    ["Federal taxable wages", "", "", "3,127.89", "71,941.47"],
    ["Social Security wages", "", "", "3,231.74", "74,330.02"],
    ["Medicare wages", "", "", "3,231.74", "74,330.02"],
    ["IL taxable wages", "", "", "3,127.89", "71,941.47"],
  ], X2);

  section("TAX WITHHOLDING SETTINGS", ["", "", "", "", ""], [
    ["Federal (Form W-4, 2020 or later): Married filing jointly; Step 2 not checked; dependents $2,000; extra withholding $0.00", "", "", "", ""],
    ["Illinois (Form IL-W-4): basic allowances 2; additional allowances 1; extra withholding $0.00", "", "", "", ""],
  ], X);

  section("TIME OFF BALANCES (hours)", ["", "Accrued YTD", "Used YTD", "", "Available"], [
    ["Paid time off (PTO)", "110.77", "152.00", "", "62.77"],
    ["Floating holiday", "16.00", "8.00", "", "8.00"],
    ["Sick (IL Paid Leave for All Workers Act)", "40.00", "0.00", "", "40.00"],
  ], [L, 330, 400, 0, R]);

  section("BENEFIT ELECTIONS ON FILE (2026 plan year)", ["", "", "", "", "Per pay"], [
    ["Medical: Acme Choice PPO - Employee + Family", "", "", "", "214.00"],
    ["Dental: Dental Basic - Employee + Family", "", "", "", "11.60"],
    ["Vision: Acme Vision - Employee + Family", "", "", "", "4.20"],
    ["Health Savings Account", "", "", "", "Not enrolled"],
    ["Health Care FSA / Limited Purpose FSA", "", "", "", "Not enrolled"],
    ["Dependent Care FSA", "", "", "", "Not enrolled"],
    ["Commuter benefits", "", "", "", "Not enrolled"],
    ["Employee Stock Purchase Plan", "", "", "", "Not enrolled"],
    ["401(k) Savings Plan - pre-tax", "", "", "", "3%"],
  ], X);

  page.drawRectangle({ x: L, y: y - 98, width: R - L, height: 104, color: TINT, borderColor: ACCENT, borderWidth: 0.6 });
  y -= 10;
  t("MESSAGES FROM ACME", L + 10, 9, f.b, ACCENT); y -= 16;
  for (const m of [
    "Open Enrollment for the 2027 plan year is open now through November 30, 2026 at benefits.acme.example.",
    "Health Care and Dependent Care FSA elections do not roll over - you must re-elect them for 2027.",
    "Reminder: update your mailing address in Workday by December 31 to receive your 2026 Form W-2 on time.",
    "Questions about this statement? Contact the Acme Benefits Center at 1-800-555-0142.",
  ]) {
    t(`- ${m}`, L + 10, 8.5); y -= 14;
  }
  y -= 30;
  t("This statement is for informational purposes only. Keep it for your records. FICTIONAL SAMPLE - Acme Corp is not a real company.", L, 7.5, f.i, MUTED);
  page.drawText("Page 2 of 2", { x: R - f.r.widthOfTextAtSize("Page 2 of 2", 8), y: 30, size: 8, font: f.r, color: MUTED });

  return doc.save();
}

const DATA = "Data for checking the app";
fs.mkdirSync("public/samples", { recursive: true });
fs.mkdirSync(DATA, { recursive: true });
const g = await guide();
const acmeStub = await paystub();
for (const dir of ["public/samples", DATA]) {
  fs.writeFileSync(`${dir}/acme-benefits-guide-2027.pdf`, g.bytes);
  fs.writeFileSync(`${dir}/acme-paystub-2026-11.pdf`, acmeStub);
}
console.log(`acme: guide ${g.pages} pages, paystub 2 pages`);
for (const c of COMPANIES) {
  const cg = await guide({ title: c.title, blocks: c.guide, cover: c.cover, color: c.color });
  fs.writeFileSync(`${DATA}/${c.file}.pdf`, cg.bytes);
  const st = await genericPaystub({ ...c.paystub, accent: c.color });
  fs.writeFileSync(`${DATA}/${c.stubFile}.pdf`, st.bytes);
  console.log(`${c.slug}: guide ${cg.pages} pages, paystub net ${st.net} gross ${st.gross}`);
}
