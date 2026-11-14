import type { FilingStatus, PayFrequency } from "./types";

/** 2026 IRS limits (Rev. Proc. 2025-32, IRS Notice 2025-67, One Big Beautiful Bill Act). */
export const LIMITS_2026 = {
  deferral401k: 24_500,
  catchUp401k: 8_000,
  hsaSelf: 4_400,
  hsaFamily: 8_750,
  hsaCatchUp: 1_000,
  healthFsa: 3_400,
  dependentCareFsa: 7_500,
  commuterMonthly: 340,
  tuitionTaxFree: 5_250,
  esppFmvCap: 25_000,
  ssWageBase: 184_500,
} as const;

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  married_joint: 32_200,
  head_of_household: 24_150,
};

// Upper bound of each bracket; last is Infinity.
const BRACKETS: Record<FilingStatus, [number, number][]> = {
  single: [
    [12_400, 0.1], [50_400, 0.12], [105_700, 0.22], [201_775, 0.24], [256_225, 0.32], [640_600, 0.35], [Infinity, 0.37],
  ],
  married_joint: [
    [24_800, 0.1], [100_800, 0.12], [211_400, 0.22], [403_550, 0.24], [512_450, 0.32], [768_700, 0.35], [Infinity, 0.37],
  ],
  head_of_household: [
    [17_700, 0.1], [67_450, 0.12], [105_700, 0.22], [201_750, 0.24], [256_200, 0.32], [640_600, 0.35], [Infinity, 0.37],
  ],
};

/** Approximate marginal state income-tax rate for a typical $50k–$150k earner (2026). */
export const STATE_RATES: Record<string, number> = {
  AL: 0.05, AK: 0, AZ: 0.025, AR: 0.039, CA: 0.093, CO: 0.044, CT: 0.055, DE: 0.066, DC: 0.085, FL: 0,
  GA: 0.0519, HI: 0.079, ID: 0.053, IL: 0.0495, IN: 0.0295, IA: 0.038, KS: 0.0558, KY: 0.035, LA: 0.03, ME: 0.0675,
  MD: 0.0475, MA: 0.05, MI: 0.0425, MN: 0.068, MS: 0.04, MO: 0.047, MT: 0.059, NE: 0.0455, NV: 0, NH: 0,
  NJ: 0.05525, NM: 0.049, NY: 0.06, NC: 0.0399, ND: 0.0195, OH: 0.0275, OK: 0.0475, OR: 0.0875, PA: 0.0307, RI: 0.0475,
  SC: 0.06, SD: 0, TN: 0, TX: 0, UT: 0.045, VT: 0.066, VA: 0.0575, WA: 0, WV: 0.0482, WI: 0.053, WY: 0,
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/** States that do not exempt HSA contributions from state income tax. */
export const HSA_STATE_TAXABLE = new Set(["CA", "NJ"]);

export const PAYCHECKS: Record<PayFrequency, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };

export function federalMarginal(salary: number, status: FilingStatus): number {
  const taxable = Math.max(0, salary - STANDARD_DEDUCTION[status]);
  for (const [top, rate] of BRACKETS[status]) if (taxable <= top) return rate;
  return 0.37;
}

export function marginalRates(salary: number, status: FilingStatus, state: string) {
  const federal = federalMarginal(salary, status);
  const st = STATE_RATES[state] ?? 0;
  const fica = salary < LIMITS_2026.ssWageBase ? 0.0765 : 0.0145;
  return { federal, state: st, fica, combinedPreTax: federal + st + fica };
}
