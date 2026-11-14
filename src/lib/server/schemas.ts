// JSON Schemas handed to Gemini as `responseJsonSchema` so the model must return this exact shape.

const num = { type: ["number", "null"] } as const;
const str = { type: ["string", "null"] } as const;
const bool = { type: "boolean" } as const;

const evidence = {
  type: ["object", "null"],
  description: "Short verbatim quote (max ~30 words) copied exactly from the document, plus its page number.",
  properties: { page: { type: ["integer", "null"] }, quote: { type: "string" } },
  required: ["page", "quote"],
} as const;

const tierAmounts = {
  type: "object",
  description: "Amounts by coverage tier. self = employee only; self_spouse = employee + spouse/partner; self_children = employee + child(ren); family = employee + family.",
  properties: { self: num, self_spouse: num, self_children: num, family: num },
  required: ["self", "self_spouse", "self_children", "family"],
} as const;

export const benefitsSchema = {
  type: "object",
  properties: {
    employerName: str,
    planYear: str,
    openEnrollment: {
      type: ["object", "null"],
      properties: { start: str, end: str, evidence },
      required: ["start", "end", "evidence"],
    },
    retirement: {
      type: "object",
      properties: {
        offered: bool,
        planName: str,
        matchTiers: {
          type: "array",
          description: "Employer MATCH formula as ordered tiers. '100% of first 3% + 50% of next 2%' => [{matchRate:1,percentOfPay:3},{matchRate:0.5,percentOfPay:2}]. Empty if no match.",
          items: {
            type: "object",
            properties: { matchRate: { type: "number" }, percentOfPay: { type: "number" } },
            required: ["matchRate", "percentOfPay"],
          },
        },
        nonElectivePercent: { ...num, description: "Employer contribution (% of pay) given regardless of employee deferral, e.g. safe-harbor 3% or a fixed 10%." },
        matchCapAnnual: { ...num, description: "Dollar cap on the annual match, if any." },
        eligibilityNote: str,
        vestingNote: str,
        evidence,
      },
      required: ["offered", "planName", "matchTiers", "nonElectivePercent", "matchCapAnnual", "eligibilityNote", "vestingNote", "evidence"],
    },
    medicalPlans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["HDHP", "PPO", "HMO", "EPO", "POS", "OTHER"] },
          hsaEligible: bool,
          deductibleIndividual: num,
          deductibleFamily: num,
          oopMaxIndividual: num,
          oopMaxFamily: num,
          coinsurancePercent: { ...num, description: "In-network share the MEMBER pays after deductible, e.g. 20 for 80/20." },
          employeePremium: { ...tierAmounts, description: "EMPLOYEE share of the premium (what is deducted from pay), not the total or employer cost." },
          premiumPeriod: { type: "string", enum: ["per_paycheck", "monthly", "annual", "unknown"] },
          employerAccountContribution: { ...tierAmounts, description: "Annual employer HSA or HRA seed money for this plan. Annualize per-paycheck amounts." },
          availabilityNote: { ...str, description: "If the plan is only available in certain states/regions/service areas or to certain employee groups (e.g. 'Hawaii residents only', 'Kaiser service area', 'union members'), describe it briefly. Null if available to everyone." },
          evidence,
        },
        required: [
          "name", "type", "hsaEligible", "availabilityNote", "deductibleIndividual", "deductibleFamily", "oopMaxIndividual", "oopMaxFamily",
          "coinsurancePercent", "employeePremium", "premiumPeriod", "employerAccountContribution", "evidence",
        ],
      },
    },
    hsa: {
      type: "object",
      properties: { offered: bool, employerContribution: tierAmounts, evidence },
      required: ["offered", "employerContribution", "evidence"],
    },
    healthFsa: {
      type: "object",
      properties: { offered: bool, limitedPurposeOffered: bool, employerContribution: num, evidence },
      required: ["offered", "limitedPurposeOffered", "employerContribution", "evidence"],
    },
    dependentCareFsa: {
      type: "object",
      properties: { offered: bool, employerContribution: num, evidence },
      required: ["offered", "employerContribution", "evidence"],
    },
    commuter: {
      type: "object",
      properties: { offered: bool, employerSubsidyMonthly: num, evidence },
      required: ["offered", "employerSubsidyMonthly", "evidence"],
    },
    espp: {
      type: "object",
      properties: { offered: bool, discountPercent: num, maxContributionPercent: num, lookback: { type: ["boolean", "null"] }, evidence },
      required: ["offered", "discountPercent", "maxContributionPercent", "lookback", "evidence"],
    },
    tuition: {
      type: "object",
      properties: { offered: bool, annualMax: num, evidence },
      required: ["offered", "annualMax", "evidence"],
    },
    perks: {
      type: "array",
      description: "Stipends, reimbursements, allowances and free services NOT already covered by the fields above.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: {
            type: "string",
            enum: ["wellness", "fitness", "phone", "internet", "home_office", "learning", "student_loan", "childcare", "family_building", "eap", "legal", "discounts", "other"],
          },
          annualValue: { ...num, description: "Annual cash value to the employee if the document states one (annualize monthly amounts). Null for free services without a stated dollar value." },
          description: { type: "string", description: "One plain-English sentence on what it is." },
          howToClaim: str,
          evidence,
        },
        required: ["name", "category", "annualValue", "description", "howToClaim", "evidence"],
      },
    },
    notes: { type: "array", items: { type: "string" }, description: "Caveats, e.g. which employee group the numbers apply to." },
  },
  required: [
    "employerName", "planYear", "openEnrollment", "retirement", "medicalPlans", "hsa", "healthFsa", "dependentCareFsa",
    "commuter", "espp", "tuition", "perks", "notes",
  ],
} as const;

export const paystubSchema = {
  type: "object",
  properties: {
    employerName: str,
    payDate: str,
    payFrequency: { type: ["string", "null"], enum: ["weekly", "biweekly", "semimonthly", "monthly", null] },
    grossPayCurrent: num,
    grossPayYtd: num,
    annualSalary: { ...num, description: "Only if explicitly printed (e.g. 'Annual salary'). Do not compute." },
    state: { ...str, description: "Two-letter US state code for state income tax withholding, if shown." },
    deductions: {
      type: "object",
      description: "CURRENT-PERIOD amounts in dollars (not YTD). Null when the line is absent.",
      properties: {
        traditional401k: num,
        roth401k: num,
        contributionPercent401k: { ...num, description: "Employee 401(k)/403(b) deferral rate in percent, only if printed." },
        employer401k: { ...num, description: "Employer match / contribution shown on the stub (often in a memo or 'employer paid' section)." },
        hsa: num,
        healthFsa: num,
        dependentCareFsa: num,
        commuter: num,
        espp: num,
        medicalPremium: num,
      },
      required: [
        "traditional401k", "roth401k", "contributionPercent401k", "employer401k", "hsa", "healthFsa", "dependentCareFsa", "commuter", "espp", "medicalPremium",
      ],
    },
    evidence: { type: "array", items: { ...evidence, type: "object" } },
  },
  required: ["employerName", "payDate", "payFrequency", "grossPayCurrent", "grossPayYtd", "annualSalary", "state", "deductions", "evidence"],
} as const;
