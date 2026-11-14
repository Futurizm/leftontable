import type { BenefitsExtraction, Evidence, PaystubExtraction } from "../types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9%$.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Check every evidence quote against the source text. A quote is "verified" when it appears
 * verbatim (after whitespace/punctuation normalisation) or when ≥85% of its words appear in order
 * on one page. Page numbers are corrected when the quote is found on a different page.
 */
export function verifyEvidence(pages: string[] | null, ev: Evidence | null): Evidence | null {
  if (!ev || !ev.quote?.trim()) return null;
  if (!pages || !pages.length) return { ...ev, verified: false };
  const q = norm(ev.quote);
  const normPages = pages.map(norm);
  const order = ev.page && ev.page >= 1 && ev.page <= pages.length ? [ev.page - 1, ...normPages.keys()] : [...normPages.keys()];
  for (const i of order) if (normPages[i].includes(q)) return { ...ev, page: i + 1, verified: true };

  // Quotes stitched from table cells ("Plan A ... $0 ... $210.00"): every fragment must appear on one page.
  const fragments = ev.quote.split(/\.{3}|…/).map(norm).filter((f) => f.length >= 2);
  if (fragments.length > 1) {
    for (const i of order) if (fragments.every((f) => normPages[i].includes(f))) return { ...ev, page: i + 1, verified: true };
  }

  const words = q.split(" ").filter(Boolean);
  if (words.length >= 4) {
    for (const i of order) {
      const hay = normPages[i];
      let pos = 0;
      let hits = 0;
      for (const w of words) {
        const at = hay.indexOf(w, pos);
        if (at >= 0) {
          hits++;
          pos = at + w.length;
        }
      }
      if (hits / words.length >= 0.85) return { ...ev, page: i + 1, verified: true };
    }
  }
  return { ...ev, verified: false };
}

export function verifyBenefits(b: BenefitsExtraction, pages: string[] | null): BenefitsExtraction {
  const v = (e: Evidence | null) => verifyEvidence(pages, e);
  return {
    ...b,
    openEnrollment: b.openEnrollment ? { ...b.openEnrollment, evidence: v(b.openEnrollment.evidence) } : null,
    retirement: { ...b.retirement, matchTiers: b.retirement.matchTiers ?? [], evidence: v(b.retirement.evidence) },
    medicalPlans: (b.medicalPlans ?? []).map((m) => ({ ...m, evidence: v(m.evidence) })),
    hsa: { ...b.hsa, evidence: v(b.hsa.evidence) },
    healthFsa: { ...b.healthFsa, evidence: v(b.healthFsa.evidence) },
    dependentCareFsa: { ...b.dependentCareFsa, evidence: v(b.dependentCareFsa.evidence) },
    commuter: { ...b.commuter, evidence: v(b.commuter.evidence) },
    espp: { ...b.espp, evidence: v(b.espp.evidence) },
    tuition: { ...b.tuition, evidence: v(b.tuition.evidence) },
    perks: (b.perks ?? []).map((p) => ({ ...p, evidence: v(p.evidence) })),
    notes: b.notes ?? [],
  };
}

export function verifyPaystub(p: PaystubExtraction, pages: string[] | null): PaystubExtraction {
  return { ...p, evidence: (p.evidence ?? []).map((e) => verifyEvidence(pages, e)).filter(Boolean) as Evidence[] };
}
