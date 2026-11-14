// Deterministic rules engine. The AI only extracts facts from documents;
// every dollar figure shown to the user is computed here, with the math spelled out.
import type {
  BenefitsExtraction, CoverageTier, EngineResult, MatchTier, MedicalPlan, Opportunity, Perk, PlanCost, Profile, TierAmounts,
} from "./types";
import { HSA_STATE_TAXABLE, LIMITS_2026, PAYCHECKS, marginalRates } from "./tax";
import { usd } from "./format";

/** Percent of pay the employer matches when the employee contributes `pct` percent. */
export function matchedPercent(contribution: number, tiers: MatchTier[]): number {
  let remaining = Math.max(0, contribution);
  let matched = 0;
  for (const t of tiers) {
    if (remaining <= 0) break;
    const covered = Math.min(remaining, t.percentOfPay);
    matched += covered * t.matchRate;
    remaining -= covered;
  }
  return matched;
}

export const fullMatchContribution = (tiers: MatchTier[]) => tiers.reduce((s, t) => s + t.percentOfPay, 0);

export function tierValue(amounts: TierAmounts | undefined, tier: CoverageTier): number | null {
  if (!amounts) return null;
  const direct = amounts[tier];
  if (direct != null) return direct;
  // Many guides only list "employee only" and "family" — fall back sensibly.
  if (tier === "self") return amounts.self ?? null;
  return amounts.family ?? amounts.self_spouse ?? amounts.self_children ?? null;
}

const GENERIC_PLAN = { deductible: 1_500, coinsurance: 20, oopMax: 5_000 };
/** Share of bills assumed to be paid as copays on plans with 0% coinsurance. */
export const COPAY_PROXY = 10;

export function estimateOutOfPocket(plan: MedicalPlan | null, spend: number, tier: CoverageTier): number {
  const single = tier === "self";
  let ded = GENERIC_PLAN.deductible * (single ? 1 : 2);
  let oopMax = GENERIC_PLAN.oopMax * (single ? 1 : 2);
  let coins = GENERIC_PLAN.coinsurance;
  if (plan) {
    const d = single ? plan.deductibleIndividual : plan.deductibleFamily ?? (plan.deductibleIndividual ?? 0) * 2;
    const m = single ? plan.oopMaxIndividual : plan.oopMaxFamily ?? (plan.oopMaxIndividual ?? 0) * 2;
    if (d != null) ded = d;
    if (m) oopMax = m;
    if (plan.coinsurancePercent != null) coins = plan.coinsurancePercent;
    // Copay-only plans (no coinsurance) still cost something per visit / prescription.
    if (!coins) coins = COPAY_PROXY;
  }
  const oop = spend <= ded ? spend : ded + (spend - ded) * (coins / 100);
  return Math.min(oop, oopMax);
}

function annualPremium(plan: MedicalPlan, tier: CoverageTier, paychecks: number): number | null {
  const p = tierValue(plan.employeePremium, tier);
  if (p == null) return null;
  switch (plan.premiumPeriod) {
    case "per_paycheck": return p * paychecks;
    case "monthly": return p * 12;
    case "annual": return p;
    default: return null;
  }
}

const dollars = (n: number) => Math.max(0, Math.round(n));

export function runEngine(b: BenefitsExtraction, p: Profile): EngineResult {
  const rates = marginalRates(p.salary, p.filingStatus, p.state);
  const rateFull = rates.combinedPreTax;
  const rateHsa = rates.federal + rates.fica + (HSA_STATE_TAXABLE.has(p.state) ? 0 : rates.state);
  const rateIncome = rates.federal + rates.state; // 401(k) deferrals still pay FICA
  const paychecks = PAYCHECKS[p.payFrequency];
  const ops: Opportunity[] = [];
  const oeEnd = b.openEnrollment?.end ? Date.parse(b.openEnrollment.end.replace(/(\d)(st|nd|rd|th)/g, "$1")) : NaN;
  const oe = b.openEnrollment?.end && (Number.isNaN(oeEnd) || oeEnd > Date.now() - 864e5)
    ? `Open enrollment ends ${b.openEnrollment.end}`
    : "Next open enrollment";
  const portal = b.employerName ? `${b.employerName}'s benefits portal` : "your benefits portal";
  const rateLabel = `${Math.round(rateFull * 1000) / 10}% combined tax rate`;

  // ── 401(k) match ────────────────────────────────────────────────
  const r = b.retirement;
  if (r.offered && r.matchTiers.length) {
    const full = fullMatchContribution(r.matchTiers);
    const maxPct = matchedPercent(full, r.matchTiers);
    const curPct = matchedPercent(p.contribution401kPercent, r.matchTiers);
    let gap = (p.salary * (maxPct - curPct)) / 100;
    if (r.matchCapAnnual) gap = Math.min(gap, Math.max(0, r.matchCapAnnual - (p.salary * curPct) / 100));
    if (gap > 1) {
      const extra = (p.salary * (full - p.contribution401kPercent)) / 100;
      const perCheck = extra / paychecks;
      const takeHome = perCheck * (1 - rateIncome);
      ops.push({
        key: "401k-match",
        title: `Unclaimed 401(k) match`,
        category: "retirement",
        annualValue: dollars(gap),
        kind: "counted",
        confidence: "high",
        why: `Your employer matches up to ${maxPct.toFixed(1).replace(/\.0$/, "")}% of pay, but at ${p.contribution401kPercent}% you only collect ${curPct.toFixed(1).replace(/\.0$/, "")}%. The rest is free money you're declining every paycheck.`,
        steps: [
          `Log in to ${r.planName ?? "your 401(k) provider"} and raise your contribution from ${p.contribution401kPercent}% to ${full}%.`,
          `That's ${usd(perCheck)} more per paycheck into your account, but only about ${usd(takeHome)} less take-home (the rest is tax you no longer pay now).`,
          r.vestingNote ? `Note on vesting: ${r.vestingNote}` : "Check the vesting schedule so you know when the match is fully yours.",
        ],
        math: `${usd(p.salary)} × (${maxPct.toFixed(2)}% − ${curPct.toFixed(2)}%) = ${usd(gap)} per year`,
        evidence: r.evidence,
        deadline: "Any time — applies from your next paycheck",
      });
    }
  }

  // ── Health plans: cost comparison ───────────────────────────────
  const currentPlan = p.currentPlanIndex >= 0 ? b.medicalPlans[p.currentPlanIndex] ?? null : null;
  const hsaLimit = (p.coverageTier === "self" ? LIMITS_2026.hsaSelf : LIMITS_2026.hsaFamily) + (p.age >= 55 ? LIMITS_2026.hsaCatchUp : 0);
  const employerHsaFor = (plan: MedicalPlan | null) =>
    plan?.hsaEligible ? tierValue(plan.employerAccountContribution, p.coverageTier) ?? tierValue(b.hsa.employerContribution, p.coverageTier) ?? 0 : 0;

  const planCosts: PlanCost[] = b.medicalPlans.map((plan, index) => {
    const premium = annualPremium(plan, p.coverageTier, paychecks);
    const oop = estimateOutOfPocket(plan, p.expectedMedicalSpend, p.coverageTier);
    const employerAccount = plan.hsaEligible ? employerHsaFor(plan) : tierValue(plan.employerAccountContribution, p.coverageTier) ?? 0;
    const taxSavings = plan.hsaEligible && b.hsa.offered
      ? Math.min(Math.max(0, oop - employerAccount), hsaLimit - employerAccount) * rateHsa
      : b.healthFsa.offered ? Math.min(oop, LIMITS_2026.healthFsa) * rateFull : 0;
    return {
      index, name: plan.name, type: plan.type,
      availabilityNote: plan.availabilityNote ?? null,
      premiumAnnual: premium,
      outOfPocket: Math.round(oop),
      employerAccount: Math.round(employerAccount),
      taxSavings: Math.round(taxSavings),
      netCost: premium == null ? null : Math.round(premium + oop - employerAccount - taxSavings),
    };
  });

  // Region- or group-restricted plans are shown but never recommended (unless it's the user's own plan).
  const priced = planCosts.filter((c) => c.netCost != null && (!c.availabilityNote || c.index === p.currentPlanIndex));
  const best = priced.length ? priced.reduce((a, c) => (c.netCost! < a.netCost! ? c : a)) : null;
  const cur = currentPlan ? planCosts[p.currentPlanIndex] : null;
  if (best && cur && cur.netCost != null && best.index !== cur.index && cur.netCost - best.netCost! > 150) {
    const save = cur.netCost - best.netCost!;
    ops.push({
      key: "plan-switch",
      title: `Cheaper health plan for your usage: ${best.name}`,
      category: "health",
      annualValue: dollars(save),
      kind: "counted",
      confidence: "medium",
      why: `At about ${usd(p.expectedMedicalSpend)} of medical bills a year, ${best.name} costs you an estimated ${usd(best.netCost!)} all-in vs ${usd(cur.netCost)} on ${cur.name} (premiums + out-of-pocket − employer account money − tax savings).`,
      steps: [
        `During open enrollment, switch from ${cur.name} to ${best.name} in ${portal}.`,
        best.employerAccount > 0 ? `Open the HSA so the employer's ${usd(best.employerAccount)} actually lands in your account.` : "Re-check that your doctors are in network before you switch.",
        "Use the plan comparison table below to stress-test a bad year (high spend).",
      ],
      math: `${usd(cur.netCost)} − ${usd(best.netCost!)} = ${usd(save)} estimated per year`,
      evidence: b.medicalPlans[best.index]?.evidence ?? null,
      deadline: oe,
    });
  }

  // ── HSA / FSA on the current plan ───────────────────────────────
  const expectedOop = estimateOutOfPocket(currentPlan, p.expectedMedicalSpend, p.coverageTier);
  if (currentPlan?.hsaEligible && b.hsa.offered) {
    const employerHsa = employerHsaFor(currentPlan);
    if (employerHsa > 0 && p.currentHsaAnnual === 0) {
      ops.push({
        key: "hsa-employer",
        title: "Employer HSA money waiting for you",
        category: "health",
        annualValue: dollars(employerHsa),
        kind: "counted",
        confidence: "medium",
        why: `Your plan comes with ${usd(employerHsa)} a year of employer HSA money, but your paystub shows no HSA activity. Many employers only deposit it once you open the account (and sometimes contribute yourself).`,
        steps: [`Open the HSA in ${portal}.`, "Confirm the employer deposit schedule (per paycheck or lump sum).", "Even $1 per paycheck can unlock some employer seed programs — check the rule in your guide."],
        math: `Employer contribution for ${p.coverageTier.replace("_", " + ")} coverage = ${usd(employerHsa)}`,
        evidence: b.hsa.evidence ?? currentPlan.evidence,
        deadline: oe,
      });
    }
    const target = Math.min(hsaLimit - employerHsa, Math.max(expectedOop, 0));
    if (target - p.currentHsaAnnual > 50) {
      const saved = (target - p.currentHsaAnnual) * rateHsa;
      ops.push({
        key: "hsa-tax",
        title: "Pay your medical bills with pre-tax HSA dollars",
        category: "tax",
        annualValue: dollars(saved),
        kind: "counted",
        confidence: "high",
        why: `You expect about ${usd(expectedOop)} out-of-pocket. Routing that through your HSA skips federal income tax, FICA${HSA_STATE_TAXABLE.has(p.state) ? "" : " and state tax"}. Unused money rolls over forever and can be invested.`,
        steps: [`Set an HSA payroll contribution of ${usd(target / paychecks)} per paycheck (${usd(target)}/yr).`, "Pay medical bills with the HSA card, or pay out of pocket and reimburse yourself later.", `2026 limit: ${usd(hsaLimit)} including employer money.`],
        math: `${usd(target - p.currentHsaAnnual)} × ${Math.round(rateHsa * 1000) / 10}% = ${usd(saved)}`,
        evidence: b.hsa.evidence,
        deadline: "Any time — HSA elections can change mid-year",
      });
    }
  } else if (b.healthFsa.offered) {
    const target = Math.min(LIMITS_2026.healthFsa, expectedOop);
    const employerFsa = b.healthFsa.employerContribution ?? 0;
    if (target - p.currentHealthFsaAnnual > 50 || (employerFsa > 0 && p.currentHealthFsaAnnual === 0)) {
      const saved = Math.max(0, target - p.currentHealthFsaAnnual) * rateFull + (p.currentHealthFsaAnnual === 0 ? employerFsa : 0);
      ops.push({
        key: "fsa-tax",
        title: "Use the Health FSA for predictable medical costs",
        category: "tax",
        annualValue: dollars(saved),
        kind: "counted",
        confidence: "high",
        why: `You expect about ${usd(expectedOop)} of out-of-pocket costs (copays, prescriptions, glasses, dental). Paying them through the FSA saves your ${rateLabel}.${employerFsa ? ` Your employer also adds ${usd(employerFsa)}.` : ""}`,
        steps: [`Elect ${usd(target)} for 2026 during open enrollment (${usd(target / paychecks)} per paycheck).`, "Only elect what you're confident you'll spend — FSA money is use-it-or-lose-it.", "Save receipts; most FSA cards auto-substantiate copays."],
        math: `${usd(Math.max(0, target - p.currentHealthFsaAnnual))} × ${Math.round(rateFull * 1000) / 10}%${employerFsa && p.currentHealthFsaAnnual === 0 ? ` + ${usd(employerFsa)} employer` : ""} = ${usd(saved)}`,
        evidence: b.healthFsa.evidence,
        deadline: oe,
      });
    }
  }

  // ── Dependent care FSA ──────────────────────────────────────────
  if (b.dependentCareFsa.offered && p.childcareAnnual > 0) {
    const target = Math.min(p.childcareAnnual, LIMITS_2026.dependentCareFsa);
    const employer = p.currentDcfsaAnnual === 0 ? b.dependentCareFsa.employerContribution ?? 0 : 0;
    const saved = Math.max(0, target - p.currentDcfsaAnnual) * rateFull + employer;
    if (saved > 25) {
      ops.push({
        key: "dcfsa",
        title: "Pay daycare with pre-tax dollars (Dependent Care FSA)",
        category: "family",
        annualValue: dollars(saved),
        kind: "counted",
        confidence: "high",
        why: `You spend about ${usd(p.childcareAnnual)} a year on care for kids under 13. In 2026 up to ${usd(LIMITS_2026.dependentCareFsa)} per household can be paid pre-tax.`,
        steps: [`Elect ${usd(target)} in the Dependent Care FSA (${usd(target / paychecks)} per paycheck).`, "Get your provider's tax ID — you need it for reimbursement claims.", "If your spouse's employer also offers one, the household cap is shared."],
        math: `${usd(Math.max(0, target - p.currentDcfsaAnnual))} × ${Math.round(rateFull * 1000) / 10}%${employer ? ` + ${usd(employer)} employer` : ""} = ${usd(saved)}`,
        evidence: b.dependentCareFsa.evidence,
        deadline: oe,
      });
    }
  }

  // ── Commuter ────────────────────────────────────────────────────
  if (b.commuter.offered && p.commuteMonthly > 0) {
    const subsidy = p.currentCommuterMonthly === 0 ? Math.min(b.commuter.employerSubsidyMonthly ?? 0, p.commuteMonthly) : 0;
    const pretax = Math.max(0, Math.min(p.commuteMonthly - subsidy, LIMITS_2026.commuterMonthly - subsidy) - p.currentCommuterMonthly);
    const saved = pretax * 12 * rateFull + subsidy * 12;
    if (saved > 25) {
      ops.push({
        key: "commuter",
        title: "Commute on pre-tax money",
        category: "commute",
        annualValue: dollars(saved),
        kind: "counted",
        confidence: "high",
        why: `You spend about ${usd(p.commuteMonthly)}/month on transit or parking. Up to ${usd(LIMITS_2026.commuterMonthly)}/month can come out pre-tax${subsidy ? `, and your employer chips in ${usd(subsidy)}/month` : ""}.`,
        steps: [`Enroll in the commuter benefit in ${portal} — it's not tied to open enrollment.`, `Set ${usd(Math.min(p.commuteMonthly, LIMITS_2026.commuterMonthly))}/month.`, "Load the commuter card or link it to your transit / parking account."],
        math: `${usd(pretax)}/mo × 12 × ${Math.round(rateFull * 1000) / 10}%${subsidy ? ` + ${usd(subsidy)}/mo × 12 employer` : ""} = ${usd(saved)}`,
        evidence: b.commuter.evidence,
        deadline: "Any time — monthly elections",
      });
    }
  }

  // ── ESPP ────────────────────────────────────────────────────────
  if (b.espp.offered && !p.inEspp && b.espp.discountPercent) {
    const d = b.espp.discountPercent / 100;
    const pctPay = Math.min(b.espp.maxContributionPercent ?? 10, 10);
    const contrib = Math.min((p.salary * pctPay) / 100, LIMITS_2026.esppFmvCap * (1 - d));
    const gain = (contrib * d) / (1 - d);
    ops.push({
      key: "espp",
      title: `Employee stock purchase plan at ${b.espp.discountPercent}% off`,
      category: "stock",
      annualValue: dollars(gain),
      kind: "optional",
      confidence: "medium",
      why: `You can buy company stock at a ${b.espp.discountPercent}% discount${b.espp.lookback ? " with a lookback (price is the lower of start or end of period)" : ""}. Selling right after each purchase locks in roughly a ${Math.round((d / (1 - d)) * 1000) / 10}% return.`,
      steps: [`Enroll and choose up to ${b.espp.maxContributionPercent ?? pctPay}% of pay.`, "Decide in advance whether you'll sell immediately (lower risk) or hold.", "Keep the purchase confirmations — your W-2 reports the discount."],
      math: `${usd(contrib)} contributed × ${b.espp.discountPercent}% / (1 − ${b.espp.discountPercent}%) = ${usd(gain)}`,
      evidence: b.espp.evidence,
      deadline: "Next ESPP offering period",
    });
  }

  // ── Tuition ─────────────────────────────────────────────────────
  if (b.tuition.offered && b.tuition.annualMax) {
    ops.push({
      key: "tuition",
      title: "Tuition reimbursement",
      category: "education",
      annualValue: dollars(b.tuition.annualMax),
      kind: p.wantsEducation ? "counted" : "optional",
      confidence: "medium",
      why: `Your employer pays up to ${usd(b.tuition.annualMax)} a year for courses or a degree (the first ${usd(LIMITS_2026.tuitionTaxFree)} is tax-free to you).`,
      steps: ["Get the course pre-approved by your manager / HR before you enroll.", "Keep grades and receipts — reimbursement usually requires both.", "Check any stay-or-repay clause."],
      math: `Annual maximum = ${usd(b.tuition.annualMax)}`,
      evidence: b.tuition.evidence,
    });
  }

  // ── Stipends & perks ────────────────────────────────────────────
  const optionalCats = new Set(["student_loan", "family_building", "childcare", "discounts"]);
  const freePerks: Perk[] = [];
  b.perks.forEach((perk, i) => {
    // Coverage maximums (fertility, adoption) are not money you can "claim"; list them as perks instead.
    if (!perk.annualValue || perk.annualValue <= 0 || perk.category === "family_building") {
      freePerks.push(perk);
      return;
    }
    ops.push({
      key: `perk-${i}-${perk.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`,
      title: perk.name,
      category: "perk",
      annualValue: dollars(perk.annualValue),
      kind: optionalCats.has(perk.category) ? "optional" : "counted",
      confidence: "medium",
      why: perk.description,
      steps: perk.howToClaim ? [perk.howToClaim] : [`Look up "${perk.name}" in ${portal} or ask HR how to claim it.`],
      math: `Up to ${usd(perk.annualValue)} per year per your guide`,
      evidence: perk.evidence,
    });
  });

  const dismissed = new Set(p.dismissed);
  ops.sort((a, c) => (a.kind === c.kind ? c.annualValue - a.annualValue : a.kind === "counted" ? -1 : 1));
  const live = ops.filter((o) => !dismissed.has(o.key));
  return {
    opportunities: ops,
    total: live.filter((o) => o.kind === "counted").reduce((s, o) => s + o.annualValue, 0),
    optionalTotal: live.filter((o) => o.kind === "optional").reduce((s, o) => s + o.annualValue, 0),
    marginal: rates,
    planCosts,
    freePerks,
  };
}
