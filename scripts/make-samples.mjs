// Generates the fictional "Acme Corp" sample benefits guide + paystub used by the
// "Try a sample employee" demo. Run: npm run samples
import fs from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const W = 612, H = 792, M = 56;
const INK = rgb(0.08, 0.08, 0.08), MUTED = rgb(0.42, 0.42, 0.42), ACCENT = rgb(0.13, 0.55, 0.3), LINE = rgb(0.85, 0.85, 0.85);

async function makeDoc() {
  const doc = await PDFDocument.create();
  const fonts = {
    r: await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  return { doc, fonts };
}

function writer(doc, fonts, footer) {
  let page, y, n = 0;
  const newPage = () => {
    page = doc.addPage([W, H]);
    n++;
    y = H - M;
    page.drawText(footer, { x: M, y: 30, size: 8, font: fonts.r, color: MUTED });
    page.drawText(`Page ${n}`, { x: W - M - 30, y: 30, size: 8, font: fonts.r, color: MUTED });
  };
  const wrap = (text, font, size, width) => {
    const words = text.split(" ");
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
  };
  const api = {
    newPage,
    h1(t) { page.drawText(t, { x: M, y: y - 24, size: 24, font: fonts.b, color: INK }); y -= 40; },
    h2(t) { y -= 8; page.drawText(t, { x: M, y: y - 15, size: 15, font: fonts.b, color: ACCENT }); y -= 26; },
    h3(t) { page.drawText(t, { x: M, y: y - 11, size: 11, font: fonts.b, color: INK }); y -= 18; },
    p(t, opts = {}) {
      const size = opts.size ?? 10.5;
      for (const l of wrap(t, fonts.r, size, W - 2 * M)) {
        page.drawText(l, { x: M, y: y - size, size, font: fonts.r, color: opts.muted ? MUTED : INK });
        y -= size + 4.5;
      }
      y -= 6;
    },
    bullet(t) {
      const lines = wrap(t, fonts.r, 10.5, W - 2 * M - 14);
      page.drawText("-", { x: M + 2, y: y - 10.5, size: 10.5, font: fonts.r, color: ACCENT });
      for (const l of lines) {
        page.drawText(l, { x: M + 14, y: y - 10.5, size: 10.5, font: fonts.r, color: INK });
        y -= 15;
      }
      y -= 2;
    },
    table(cols, rows, widths) {
      const x0 = M;
      const drawRow = (cells, bold) => {
        let x = x0;
        cells.forEach((c, i) => {
          page.drawText(String(c), { x: x + 4, y: y - 12, size: 9.5, font: bold ? fonts.b : fonts.r, color: INK });
          x += widths[i];
        });
        y -= 18;
        page.drawLine({ start: { x: x0, y: y + 3 }, end: { x: x0 + widths.reduce((a, b) => a + b, 0), y: y + 3 }, thickness: 0.6, color: LINE });
      };
      drawRow(cols, true);
      rows.forEach((r) => drawRow(r, false));
      y -= 10;
    },
    gap(h = 10) { y -= h; },
  };
  return api;
}

async function guide() {
  const { doc, fonts } = await makeDoc();
  const w = writer(doc, fonts, "Acme Corp 2027 Benefits Guide  |  FICTIONAL SAMPLE for demonstration only");

  w.newPage();
  w.h1("Acme Corp 2027 Benefits Guide");
  w.p("For full-time U.S. employees (30+ hours per week). Plan year: January 1, 2027 - December 31, 2027.", { muted: true });
  w.h2("Open Enrollment");
  w.p("Open Enrollment runs from November 2, 2026 through November 30, 2026. This is your once-a-year opportunity to change your medical plan, spending accounts and coverage tiers. If you do nothing, your current medical, dental and vision elections roll over, but your Health FSA and Dependent Care FSA elections do NOT roll over and must be re-elected each year.");
  w.h2("How to enroll");
  w.p("Log in to Acme Benefits Hub (benefits.acme.example) and select Enroll Now. Most changes take about 15 minutes. Questions? Call the Acme Benefits Center at 1-800-555-0142, Monday to Friday, 8 a.m. to 8 p.m. CT.");
  w.h2("What is new for 2027");
  w.bullet("Acme now contributes up to $1,500 to your Health Savings Account when you enroll in the Acme Saver HDHP.");
  w.bullet("The Acme Transit Subsidy increases to $100 per month.");
  w.bullet("New: a $40 monthly cell phone stipend for all full-time employees.");
  w.bullet("The 401(k) match formula is unchanged (see page 4).");
  w.p("This guide is a summary. If anything here conflicts with the official plan documents, the plan documents govern.", { muted: true, size: 9 });

  w.newPage();
  w.h1("Medical Plans");
  w.p("Acme offers two medical plans through Northstar Health. Both cover in-network preventive care at 100%.");
  w.h3("Plan design (in-network)");
  w.table(
    ["", "Acme Choice PPO", "Acme Saver HDHP with HSA"],
    [
      ["Deductible (individual / family)", "$750 / $1,500", "$1,700 / $3,400"],
      ["Out-of-pocket max (ind. / family)", "$3,500 / $7,000", "$4,000 / $8,000"],
      ["Coinsurance after deductible", "20%", "10%"],
      ["Primary care visit", "$25 copay", "10% after deductible"],
      ["HSA eligible", "No", "Yes"],
    ],
    [190, 140, 170],
  );
  w.h3("Your per-paycheck cost (26 pay periods per year)");
  w.table(
    ["Coverage tier", "Acme Choice PPO", "Acme Saver HDHP"],
    [
      ["Employee only", "$68.00", "$24.00"],
      ["Employee + Spouse", "$152.00", "$70.00"],
      ["Employee + Child(ren)", "$131.00", "$61.00"],
      ["Employee + Family", "$214.00", "$118.00"],
    ],
    [190, 140, 170],
  );
  w.h3("Acme HSA contribution");
  w.p("If you enroll in the Acme Saver HDHP, Acme contributes $750 per year to your Health Savings Account for Employee only coverage and $1,500 per year for all other coverage tiers, deposited in equal amounts each paycheck. You must open your HSA with Summit HSA through Acme Benefits Hub to receive the Acme contribution.");

  w.newPage();
  w.h1("Spending Accounts");
  w.h2("Health Care FSA");
  w.p("Set aside up to $3,400 pre-tax in 2027 for eligible medical, dental and vision expenses such as copays, prescriptions, glasses and contact lenses. The full annual amount is available on January 1. Up to $680 of unused funds may be carried over to the next year. Employees enrolled in the Acme Saver HDHP may enroll in the Limited Purpose FSA instead (dental and vision expenses only).");
  w.h2("Dependent Care FSA");
  w.p("Use pre-tax dollars to pay for daycare, preschool, before- and after-school programs and summer day camp for children under age 13. You may contribute up to $7,500 per household per year. You will need your care provider's tax ID number to submit claims.");
  w.h2("Commuter Benefits");
  w.p("Pay for transit passes and work-related parking with pre-tax dollars, up to the IRS monthly limit ($340 per month for transit and $340 per month for parking in 2026). You can enroll or change your election at any time; changes take effect the first of the following month.");
  w.p("Acme Transit Subsidy: Acme pays $100 per month toward transit passes for employees who enroll in the commuter benefit. The subsidy is loaded to your commuter card automatically each month.");

  w.newPage();
  w.h1("Saving for the Future");
  w.h2("Acme 401(k) Savings Plan");
  w.p("The Acme 401(k) Savings Plan is administered by Fidelis Retirement. You may contribute from 1% to 75% of eligible pay on a pre-tax or Roth basis, up to the IRS annual limit.");
  w.h3("Company match");
  w.p("Acme matches 100% of the first 4% of pay you contribute, plus 50% of the next 2% of pay. To receive the full company match of 5% of eligible pay, you must contribute at least 6% of pay each paycheck.");
  w.p("New hires are automatically enrolled at 3% of pay unless they choose a different amount. Matching contributions vest 100% after two years of service. You can change your contribution rate at any time at fidelis.example/acme.");
  w.h2("Employee Stock Purchase Plan (ESPP)");
  w.p("Buy Acme stock at a 15% discount through payroll deductions of 1% to 10% of eligible pay. Offering periods last six months and begin January 1 and July 1. The ESPP includes a lookback: the purchase price is 85% of the lower of the stock price on the first or last day of the offering period. Enrollment for the January 1 offering closes December 15.");

  w.newPage();
  w.h1("Stipends and Reimbursements");
  w.p("These programs are available to all full-time employees. Claim them in Acme Benefits Hub under Stipends & Reimbursements. Unclaimed amounts do not carry over.");
  w.h2("Wellness Reimbursement");
  w.p("Get reimbursed up to $600 per year for gym memberships, fitness classes, sports leagues, fitness equipment and meditation apps. Submit receipts within 90 days of purchase.");
  w.h2("Cell Phone Stipend");
  w.p("All full-time employees receive a $40 monthly cell phone stipend, paid through payroll once you enroll in the Stipends section of Acme Benefits Hub.");
  w.h2("Learning & Development Budget");
  w.p("Each employee has a $1,000 annual learning budget for online courses, certifications, books and conferences related to your career. Request approval from your manager before purchasing.");
  w.h2("Tuition Assistance");
  w.p("Acme reimburses up to $5,250 per calendar year for tuition in accredited degree programs related to your role. Courses must be pre-approved and completed with a grade of C or better.");
  w.h2("Student Loan Repayment");
  w.p("Acme contributes $100 per month toward qualifying student loans, paid directly to your loan servicer, after you enroll through Acme Benefits Hub.");

  w.newPage();
  w.h1("Support for You and Your Family");
  w.h2("Employee Assistance Program (EAP)");
  w.p("Lumen EAP provides 8 free, confidential counseling sessions per issue per year for you and anyone in your household, plus 24/7 phone support, financial coaching and legal consultations. Call 1-800-555-0177.");
  w.h2("Legal Plan");
  w.p("Free basic legal services through Acme Legal Access, including will preparation, document review and identity theft support. No enrollment needed.");
  w.h2("Backup Child and Elder Care");
  w.p("Up to 10 days per year of subsidized backup care when your regular arrangements fall through. You pay $10 per day for in-center care; Acme covers the rest.");
  w.h2("Employee Discounts");
  w.p("Exclusive discounts on electronics, travel, theme parks and more through Acme Perks Marketplace.");

  w.newPage();
  w.h1("Important Contacts");
  w.table(
    ["Benefit", "Provider", "Contact"],
    [
      ["Enrollment & questions", "Acme Benefits Hub", "benefits.acme.example"],
      ["Medical", "Northstar Health", "1-800-555-0110"],
      ["HSA", "Summit HSA", "1-800-555-0123"],
      ["FSA & Commuter", "Acme Benefits Hub", "1-800-555-0142"],
      ["401(k)", "Fidelis Retirement", "fidelis.example/acme"],
      ["EAP", "Lumen EAP", "1-800-555-0177"],
    ],
    [170, 160, 170],
  );
  w.gap(20);
  w.p("Acme Corp, Northstar Health, Summit HSA, Fidelis Retirement and Lumen EAP are fictional organizations. This document was created for product demonstration purposes only and does not describe any real employer's benefits.", { muted: true, size: 9 });

  return doc.save();
}

async function paystub() {
  const { doc, fonts } = await makeDoc();
  const page = doc.addPage([W, 520]);
  let y = 520 - M;
  const t = (s, x, size = 9.5, bold = false, color = INK) => page.drawText(s, { x, y, size, font: bold ? fonts.b : fonts.r, color });
  const line = () => page.drawLine({ start: { x: M, y: y - 6 }, end: { x: W - M, y: y - 6 }, thickness: 0.6, color: LINE });

  t("ACME CORP", M, 16, true); t("EARNINGS STATEMENT", 400, 12, true); y -= 16;
  t("1 Acme Plaza, Chicago, IL 60601", M, 9, false, MUTED); t("FICTIONAL SAMPLE", 400, 9, false, MUTED); y -= 26;
  t("Employee: Jordan Rivera", M); t("Pay period: 10/25/2026 - 11/07/2026", 300); y -= 14;
  t("Employee ID: 004821", M); t("Pay date: 11/13/2026", 300); y -= 14;
  t("Pay frequency: Biweekly", M); t("Federal filing status: Married filing jointly", 300); y -= 14;
  t("Work state: IL", M); y -= 22;

  const cols = [M, 300, 400, 490];
  const row = (cells, bold = false) => {
    cells.forEach((c, i) => t(String(c), cols[i], 9.5, bold));
    line();
    y -= 17;
  };
  row(["EARNINGS", "Hours", "Current", "YTD"], true);
  row(["Regular salary", "80.00", "3,461.54", "79,615.42"]);
  row(["Gross pay", "", "3,461.54", "79,615.42"], true);
  y -= 8;
  row(["PRE-TAX DEDUCTIONS", "", "Current", "YTD"], true);
  row(["401(k) 3%", "", "103.85", "2,388.55"]);
  row(["Medical - Acme Choice PPO (Family)", "", "214.00", "4,922.00"]);
  row(["Dental - Family", "", "18.50", "425.50"]);
  row(["Vision - Family", "", "4.20", "96.60"]);
  y -= 8;
  row(["TAXES", "", "Current", "YTD"], true);
  row(["Federal income tax", "", "180.00", "4,140.00"]);
  row(["Social Security", "", "199.94", "4,598.62"]);
  row(["Medicare", "", "46.76", "1,075.48"]);
  row(["IL state income tax", "", "149.06", "3,428.38"]);
  y -= 8;
  row(["NET PAY", "", "2,545.23", "58,540.29"], true);
  y -= 6;
  row(["EMPLOYER CONTRIBUTIONS (not included in pay)", "", "Current", "YTD"], true);
  row(["401(k) company match", "", "103.85", "2,388.55"]);

  return doc.save();
}

fs.mkdirSync("public/samples", { recursive: true });
fs.writeFileSync("public/samples/acme-benefits-guide-2027.pdf", await guide());
fs.writeFileSync("public/samples/acme-paystub-2026-11.pdf", await paystub());
console.log("wrote public/samples/*.pdf");
