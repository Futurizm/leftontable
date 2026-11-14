// Generic two-page earnings statement. All taxes, totals, net pay and YTD figures are computed
// from the spec so every stub reconciles to the cent.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const W = 612, H = 792, M = 60;
const INK = rgb(0.1, 0.1, 0.12), MUTED = rgb(0.42, 0.42, 0.45), LINE = rgb(0.84, 0.84, 0.86);
const r2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => (n === "" ? "" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export async function genericPaystub(s) {
  const accent = rgb(...(s.accent ?? [0.12, 0.3, 0.45]));
  const tint = rgb(0.94, 0.95, 0.97);
  const n = s.periodsYtd;

  // ── math ──
  const gross = r2(s.earnings.reduce((a, e) => a + e[3], 0));
  const sec125 = r2(s.pretax.filter((p) => p[2]).reduce((a, p) => a + p[1], 0));
  const retire = r2(s.pretax.filter((p) => !p[2]).reduce((a, p) => a + p[1], 0));
  const pretaxTotal = r2(sec125 + retire);
  const ficaWages = r2(gross - sec125);
  const fedTaxable = r2(ficaWages - retire);
  const fed = r2(fedTaxable * s.fedRate);
  const ss = r2(ficaWages * 0.062);
  const medicare = r2(ficaWages * 0.0145);
  const state = s.stateRate ? r2(fedTaxable * s.stateRate) : 0;
  const extras = (s.extraTaxes ?? []).map(([label, rate]) => [label, r2(gross * rate)]);
  const taxes = [["Federal income tax", fed], ["Social Security (OASDI)", ss], ["Medicare", medicare], ...(state ? [[s.stateLabel, state]] : []), ...extras];
  const taxTotal = r2(taxes.reduce((a, t) => a + t[1], 0));
  const after = [...(s.roth ?? []).map(([l, v]) => [l, v]), ...s.aftertax];
  const afterTotal = r2(after.reduce((a, t) => a + t[1], 0));
  const net = r2(gross - pretaxTotal - taxTotal - afterTotal);

  const doc = await PDFDocument.create();
  doc.setTitle(`${s.employer} earnings statement ${s.payDate}`);
  const f = { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold), i: await doc.embedFont(StandardFonts.HelveticaOblique) };
  let page = doc.addPage([W, H]);
  let y = H - 50;
  const L = M - 20, R = W - M + 20;
  const t = (str, x, size = 8.5, font = f.r, color = INK) => page.drawText(String(str), { x, y, size, font, color });
  const right = (str, xr, size = 8.5, font = f.r) => page.drawText(String(str), { x: xr - font.widthOfTextAtSize(String(str), size), y, size, font, color: INK });
  const rule = (yy) => page.drawLine({ start: { x: L, y: yy }, end: { x: R, y: yy }, thickness: 0.6, color: LINE });
  const COLS = [L, 330, 395, 470, R];
  const section = (title, cols, rows, boldLast = false, colX = COLS) => {
    page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 16, color: tint });
    t(title, L + 4, 8.5, f.b, accent);
    cols.forEach((c, i) => i > 0 && c && right(c, colX[i], 8, f.b));
    y -= 18;
    rows.forEach((row, ri) => {
      const bold = boldLast && ri === rows.length - 1;
      t(row[0], L + 4, 8.5, bold ? f.b : f.r);
      row.slice(1).forEach((c, i) => c !== "" && c != null && right(c, colX[i + 1], 8.5, bold ? f.b : f.r));
      rule(y - 4);
      y -= 14;
    });
    y -= 8;
  };

  t(s.employer, L, 15, f.b); right("EARNINGS STATEMENT", R, 12, f.b); y -= 14;
  t(s.address, L, 8.5, f.r, MUTED); right("FICTIONAL SAMPLE", R, 8); y -= 11;
  t(s.phone, L, 8.5, f.r, MUTED); y -= 22;
  for (const [a, b, c, d] of [
    ["Employee", s.employee, "Pay period", s.period],
    ["Employee ID", s.id, "Pay date", s.payDate],
    ["Department", s.dept, "Pay frequency", s.frequency],
    ["Job title", s.jobTitle, "Work state", s.workState],
    ["Pay rate", s.rateLabel, "Pay periods YTD", String(n)],
  ]) {
    t(a, L, 8, f.r, MUTED); t(b, L + 80, 8.5, f.b); t(c, 330, 8, f.r, MUTED); t(d, 410, 8.5, f.b);
    y -= 13;
  }
  y -= 10;

  section("EARNINGS", ["", "Hours", "Rate", "Current", "Year to date"], [
    ...s.earnings.map(([l, h, rate, amt]) => [l, h, rate, fmt(amt), fmt(r2(amt * n))]),
    ["Gross pay", "", "", fmt(gross), fmt(r2(gross * n))],
  ], true);
  section("PRE-TAX DEDUCTIONS", ["", "", "", "Current", "Year to date"], [
    ...s.pretax.map(([l, v]) => [l, "", "", fmt(v), fmt(r2(v * n))]),
    ["Total pre-tax deductions", "", "", fmt(pretaxTotal), fmt(r2(pretaxTotal * n))],
  ], true);
  section("TAXES", ["", "", "", "Current", "Year to date"], [
    ...taxes.map(([l, v]) => [l, "", "", fmt(v), fmt(r2(v * n))]),
    ["Total taxes", "", "", fmt(taxTotal), fmt(r2(taxTotal * n))],
  ], true);
  section("AFTER-TAX DEDUCTIONS", ["", "", "", "Current", "Year to date"], [
    ...after.map(([l, v]) => [l, "", "", fmt(v), fmt(r2(v * n))]),
    ["Total after-tax deductions", "", "", fmt(afterTotal), fmt(r2(afterTotal * n))],
  ], true);
  section("EMPLOYER CONTRIBUTIONS (not included in pay)", ["", "", "", "Current", "Year to date"],
    s.employerLines.map(([l, v]) => [l, "", "", fmt(v), fmt(r2(v * n))]));

  page.drawRectangle({ x: L, y: y - 30, width: R - L, height: 36, color: accent });
  y -= 18;
  t("NET PAY", L + 10, 12, f.b, rgb(1, 1, 1));
  page.drawText(`YTD ${fmt(r2(net * n))}`, { x: 330, y, size: 9, font: f.r, color: rgb(0.9, 0.92, 0.95) });
  page.drawText(fmt(net), { x: R - 10 - f.b.widthOfTextAtSize(fmt(net), 14), y: y - 2, size: 14, font: f.b, color: rgb(1, 1, 1) });
  y -= 36;
  t("Statement continues on page 2.", L, 8, f.i, MUTED);
  page.drawText("Page 1 of 2", { x: R - f.r.widthOfTextAtSize("Page 1 of 2", 8), y: 30, size: 8, font: f.r, color: MUTED });

  // Page 2
  page = doc.addPage([W, H]);
  y = H - 50;
  t(`${s.employer}  |  Earnings statement for ${s.employee}  |  Pay date ${s.payDate}`, L, 9, f.b); y -= 26;
  section("NET PAY DISTRIBUTION", ["", "", "", "", "Amount"], [[s.bank, "", "", "", fmt(net)]]);
  const stateTaxable = s.stateRate ? fedTaxable : null;
  section("TAXABLE WAGES", ["", "", "", "Current", "Year to date"], [
    ["Federal taxable wages", "", "", fmt(fedTaxable), fmt(r2(fedTaxable * n))],
    ["Social Security wages", "", "", fmt(ficaWages), fmt(r2(ficaWages * n))],
    ["Medicare wages", "", "", fmt(ficaWages), fmt(r2(ficaWages * n))],
    ...(stateTaxable != null ? [[`${s.workState} taxable wages`, "", "", fmt(stateTaxable), fmt(r2(stateTaxable * n))]] : []),
  ]);
  page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 16, color: tint });
  t("TAX WITHHOLDING SETTINGS", L + 4, 8.5, f.b, accent); y -= 18;
  for (const line of wrapText(s.filing, f.r, 8.5, R - L - 8)) { t(line, L + 4); y -= 12; }
  y -= 10;
  section("BENEFIT ELECTIONS ON FILE (2026)", ["", "", "", "", "Per pay"], s.elections.map(([l, v]) => [l, "", "", "", v]));

  const msgH = 20 + s.messages.length * 14;
  page.drawRectangle({ x: L, y: y - msgH, width: R - L, height: msgH + 6, color: tint, borderColor: accent, borderWidth: 0.6 });
  y -= 10;
  t(`MESSAGES FROM ${s.employer}`, L + 10, 9, f.b, accent); y -= 16;
  for (const m of s.messages) { t(`- ${m}`, L + 10, 8.3); y -= 14; }
  y -= 26;
  t("This statement is for informational purposes only. FICTIONAL SAMPLE - this employer and person do not exist.", L, 7.5, f.i, MUTED);
  page.drawText("Page 2 of 2", { x: R - f.r.widthOfTextAtSize("Page 2 of 2", 8), y: 30, size: 8, font: f.r, color: MUTED });

  return { bytes: await doc.save(), net, gross };
}

function wrapText(text, font, size, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const tt = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(tt, size) > width && line) { lines.push(line); line = w; } else line = tt;
  }
  if (line) lines.push(line);
  return lines;
}
