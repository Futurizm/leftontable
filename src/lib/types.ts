// Shared data shapes for extraction (AI) and the deterministic rules engine.

export type Evidence = {
  page: number | null;
  quote: string;
  /** Set server-side: true when the quote was found in the document text. */
  verified?: boolean;
};

export type CoverageTier = "self" | "self_spouse" | "self_children" | "family";
export type TierAmounts = Partial<Record<CoverageTier, number | null>>;

export type MatchTier = {
  /** Employer match rate, e.g. 1 = 100%, 0.5 = 50%. */
  matchRate: number;
  /** Percent of pay this tier covers, e.g. 3 means "the next 3% of pay". */
  percentOfPay: number;
};

export type MedicalPlan = {
  name: string;
  type: "HDHP" | "PPO" | "HMO" | "EPO" | "POS" | "OTHER";
  hsaEligible: boolean;
  deductibleIndividual: number | null;
  deductibleFamily: number | null;
  oopMaxIndividual: number | null;
  oopMaxFamily: number | null;
  /** Member coinsurance after deductible, in percent (20 = member pays 20%). */
  coinsurancePercent: number | null;
  employeePremium: TierAmounts;
  premiumPeriod: "per_paycheck" | "monthly" | "annual" | "unknown";
  /** Annual employer HSA/HRA seed money tied to this plan. */
  employerAccountContribution: TierAmounts;
  /** Region / group restriction, e.g. "Hawaii only". Null when available to everyone. */
  availabilityNote?: string | null;
  evidence: Evidence | null;
};

export type PerkCategory =
  | "wellness"
  | "fitness"
  | "phone"
  | "internet"
  | "home_office"
  | "learning"
  | "student_loan"
  | "childcare"
  | "family_building"
  | "eap"
  | "legal"
  | "discounts"
  | "other";

export type Perk = {
  name: string;
  category: PerkCategory;
  /** Annual cash value if the guide states one (monthly values are annualized by the model). */
  annualValue: number | null;
  description: string;
  howToClaim: string | null;
  evidence: Evidence | null;
};

export type BenefitsExtraction = {
  employerName: string | null;
  planYear: string | null;
  openEnrollment: { start: string | null; end: string | null; evidence: Evidence | null } | null;
  retirement: {
    offered: boolean;
    planName: string | null;
    matchTiers: MatchTier[];
    /** Employer contribution paid regardless of employee deferral, percent of pay. */
    nonElectivePercent: number | null;
    matchCapAnnual: number | null;
    eligibilityNote: string | null;
    vestingNote: string | null;
    evidence: Evidence | null;
  };
  medicalPlans: MedicalPlan[];
  hsa: { offered: boolean; employerContribution: TierAmounts; evidence: Evidence | null };
  healthFsa: { offered: boolean; limitedPurposeOffered: boolean; employerContribution: number | null; evidence: Evidence | null };
  dependentCareFsa: { offered: boolean; employerContribution: number | null; evidence: Evidence | null };
  commuter: { offered: boolean; employerSubsidyMonthly: number | null; evidence: Evidence | null };
  espp: { offered: boolean; discountPercent: number | null; maxContributionPercent: number | null; lookback: boolean | null; evidence: Evidence | null };
  tuition: { offered: boolean; annualMax: number | null; evidence: Evidence | null };
  perks: Perk[];
  notes: string[];
};

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export type PaystubExtraction = {
  employerName: string | null;
  payDate: string | null;
  payFrequency: PayFrequency | null;
  grossPayCurrent: number | null;
  grossPayYtd: number | null;
  annualSalary: number | null;
  state: string | null;
  deductions: {
    traditional401k: number | null;
    roth401k: number | null;
    contributionPercent401k: number | null;
    employer401k: number | null;
    hsa: number | null;
    healthFsa: number | null;
    dependentCareFsa: number | null;
    commuter: number | null;
    espp: number | null;
    medicalPremium: number | null;
  };
  evidence: Evidence[];
};

export type FilingStatus = "single" | "married_joint" | "head_of_household";

/** Everything the user tells us (or we infer from the paystub). Editable live on the results page. */
export type Profile = {
  salary: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  state: string;
  age: number;
  contribution401kPercent: number;
  coverageTier: CoverageTier;
  /** Index into medicalPlans, or -1 when unknown / not enrolled. */
  currentPlanIndex: number;
  /** Total medical bills expected this year before insurance pays. */
  expectedMedicalSpend: number;
  currentHsaAnnual: number;
  currentHealthFsaAnnual: number;
  currentDcfsaAnnual: number;
  childcareAnnual: number;
  commuteMonthly: number;
  currentCommuterMonthly: number;
  inEspp: boolean;
  wantsEducation: boolean;
  /** Keys of opportunities the user marked as "already doing this". */
  dismissed: string[];
};

export type Opportunity = {
  key: string;
  title: string;
  category: "retirement" | "health" | "tax" | "commute" | "family" | "stock" | "perk" | "education";
  annualValue: number;
  /** "counted" adds to the headline total; "optional" depends on a life choice. */
  kind: "counted" | "optional";
  confidence: "high" | "medium" | "low";
  why: string;
  steps: string[];
  math: string;
  evidence: Evidence | null;
  deadline?: string;
};

export type PlanCost = {
  index: number;
  name: string;
  type: MedicalPlan["type"];
  availabilityNote: string | null;
  premiumAnnual: number | null;
  outOfPocket: number;
  employerAccount: number;
  taxSavings: number;
  netCost: number | null;
};

export type EngineResult = {
  opportunities: Opportunity[];
  total: number;
  optionalTotal: number;
  marginal: { federal: number; state: number; fica: number; combinedPreTax: number };
  planCosts: PlanCost[];
  freePerks: Perk[];
};

export type AnalysisSession = {
  id: string;
  createdAt: string;
  sourceName: string;
  pageCount: number;
  benefits: BenefitsExtraction;
  paystub: PaystubExtraction | null;
  profile: Profile;
  model: string;
  sample?: boolean;
};
