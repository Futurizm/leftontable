import type { BenefitsExtraction, CoverageTier, PaystubExtraction, Profile } from "./types";
import { PAYCHECKS } from "./tax";
import { tierValue } from "./engine";

export const DEFAULT_PROFILE: Profile = {
  salary: 75_000,
  payFrequency: "biweekly",
  filingStatus: "single",
  state: "TX",
  age: 34,
  contribution401kPercent: 0,
  coverageTier: "self",
  currentPlanIndex: -1,
  expectedMedicalSpend: 2_500,
  currentHsaAnnual: 0,
  currentHealthFsaAnnual: 0,
  currentDcfsaAnnual: 0,
  childcareAnnual: 0,
  commuteMonthly: 0,
  currentCommuterMonthly: 0,
  inEspp: false,
  wantsEducation: false,
  dismissed: [],
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Fill what we can from the paystub. Returns the patch and a list of what was detected. */
export function profileFromPaystub(s: PaystubExtraction, base: Profile): { patch: Partial<Profile>; found: string[] } {
  const patch: Partial<Profile> = {};
  const found: string[] = [];
  const freq = s.payFrequency ?? base.payFrequency;
  const n = PAYCHECKS[freq];
  if (s.payFrequency) {
    patch.payFrequency = s.payFrequency;
    found.push(`Paid ${s.payFrequency}`);
  }
  const gross = s.grossPayCurrent;
  if (s.annualSalary) {
    patch.salary = Math.round(s.annualSalary);
    found.push("Annual salary");
  } else if (gross) {
    patch.salary = roundTo(gross * n, 100);
    found.push("Salary from gross pay");
  }
  const d = s.deductions;
  const k = (d.traditional401k ?? 0) + (d.roth401k ?? 0);
  if (d.contributionPercent401k != null) {
    patch.contribution401kPercent = d.contributionPercent401k;
    found.push("401(k) rate");
  } else if (gross && k >= 0 && (d.traditional401k != null || d.roth401k != null)) {
    patch.contribution401kPercent = roundTo((k / gross) * 100, 0.5);
    found.push("401(k) rate");
  } else if (gross) {
    patch.contribution401kPercent = 0;
    found.push("No 401(k) deduction");
  }
  if (d.hsa != null) { patch.currentHsaAnnual = Math.round(d.hsa * n); found.push("HSA"); }
  if (d.healthFsa != null) { patch.currentHealthFsaAnnual = Math.round(d.healthFsa * n); found.push("Health FSA"); }
  if (d.dependentCareFsa != null) { patch.currentDcfsaAnnual = Math.round(d.dependentCareFsa * n); found.push("Dependent care FSA"); }
  if (d.commuter != null) { patch.currentCommuterMonthly = Math.round((d.commuter * n) / 12); found.push("Commuter"); }
  if (d.espp != null && d.espp > 0) { patch.inEspp = true; found.push("ESPP"); }
  if (s.state && /^[A-Z]{2}$/.test(s.state)) { patch.state = s.state; found.push(`State: ${s.state}`); }
  return { patch, found };
}

/** Match the paystub's medical deduction to a plan + coverage tier in the guide. */
export function guessPlan(b: BenefitsExtraction, s: PaystubExtraction | null, freq: Profile["payFrequency"]): { index: number; tier: CoverageTier } | null {
  const ded = s?.deductions.medicalPremium;
  if (!ded) return null;
  const n = PAYCHECKS[freq];
  let best: { index: number; tier: CoverageTier; err: number } | null = null;
  b.medicalPlans.forEach((plan, index) => {
    // Check the main table and every salary-band table.
    const tables = [plan.employeePremium, ...(plan.premiumBands ?? []).map((band) => band.employeePremium)];
    for (const table of tables) (["self", "self_spouse", "self_children", "family"] as CoverageTier[]).forEach((tier) => {
      const v = tierValue(table, tier);
      if (v == null || table[tier] == null) return;
      const perCheck = plan.premiumPeriod === "per_paycheck" ? v : plan.premiumPeriod === "monthly" ? (v * 12) / n : plan.premiumPeriod === "annual" ? v / n : null;
      if (perCheck == null || perCheck === 0) return;
      const err = Math.abs(perCheck - ded) / perCheck;
      if (err < 0.04 && (!best || err < best.err)) best = { index, tier, err };
    });
  });
  return best ? { index: (best as { index: number }).index, tier: (best as { tier: CoverageTier }).tier } : null;
}
