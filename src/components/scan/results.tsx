"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AnalysisSession, Evidence, Opportunity, Profile } from "@/lib/types";
import { runEngine } from "@/lib/engine";
import { usd } from "@/lib/format";
import { buildHrEmail, buildIcs, buildPlanText, download } from "@/lib/client/exports";
import { ProfileFields } from "./fields";

const CAT_LABEL: Record<Opportunity["category"], string> = {
  retirement: "Retirement", health: "Health plan", tax: "Tax break", commute: "Commute", family: "Family", stock: "Stock", perk: "Stipend / perk", education: "Education",
};

function EvidenceQuote({ ev, source }: { ev: Evidence; source: string }) {
  return (
    <figure className="border-l-2 border-line-2 bg-[#070707] px-4 py-3">
      <blockquote className="text-[13px] leading-relaxed text-fg/85 italic">&ldquo;{ev.quote}&rdquo;</blockquote>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-dim">
        <span>{source}{ev.page ? ` · page ${ev.page}` : ""}</span>
        {ev.verified ? (
          <span className="text-money">✓ found verbatim in your document</span>
        ) : (
          <span className="text-warn">⚠ paraphrased — double-check in the guide</span>
        )}
      </figcaption>
    </figure>
  );
}

function OpportunityCard({ o, i, dismissed, onToggle, source }: { o: Opportunity; i: number; dismissed: boolean; onToggle: () => void; source: string }) {
  const [open, setOpen] = useState(i < 2);
  return (
    <article className={`card rise transition ${dismissed ? "opacity-45" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] text-dim">#{String(i + 1).padStart(2, "0")}</span>
            <span className="eyebrow">{CAT_LABEL[o.category]}</span>
            {o.kind === "optional" && <span className="border border-line-2 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted uppercase">If you choose</span>}
            {o.confidence !== "high" && <span className="font-mono text-[10px] tracking-wider text-dim uppercase">{o.confidence} confidence</span>}
          </div>
          <h3 className="mt-2 text-[18px] leading-snug font-semibold sm:text-[19px]">{o.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className={`font-display text-2xl font-bold sm:text-3xl ${dismissed ? "text-dim line-through" : o.kind === "optional" ? "text-fg" : "money"}`}>{usd(o.annualValue)}</div>
          <div className="font-mono text-[10px] text-dim">per year</div>
        </div>
      </button>
      {open && (
        <div className="space-y-5 border-t border-line px-5 pt-5 pb-6 sm:px-6">
          <p className="text-[14.5px] leading-relaxed text-fg/85">{o.why}</p>
          <div>
            <div className="eyebrow mb-2.5">How to claim it</div>
            <ol className="space-y-2">
              {o.steps.map((s, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-line-2 font-mono text-[10px] text-muted">{j + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          {o.evidence && <EvidenceQuote ev={o.evidence} source={source} />}
          <div className="flex flex-col justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
            <div className="font-mono text-[11px] text-muted">
              <span className="text-dim">MATH · </span>{o.math}
              {o.deadline && <><br /><span className="text-dim">WHEN · </span>{o.deadline}</>}
            </div>
            <button type="button" onClick={onToggle} className="btn btn-ghost btn-sm self-start sm:self-auto">
              {dismissed ? "↺ Count it again" : "✓ Already doing this"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export function Results({ session, setProfile, onRestart }: { session: AnalysisSession; setProfile: (p: Profile) => void; onRestart: () => void }) {
  const { benefits: b, profile } = session;
  const result = useMemo(() => runEngine(b, profile), [b, profile]);
  const [copied, setCopied] = useState<string | null>(null);
  const set = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });
  const toggle = (key: string) =>
    set({ dismissed: profile.dismissed.includes(key) ? profile.dismissed.filter((k) => k !== key) : [...profile.dismissed, key] });

  const counted = result.opportunities.filter((o) => o.kind === "counted");
  const optional = result.opportunities.filter((o) => o.kind === "optional");
  const liveCount = counted.filter((o) => !profile.dismissed.includes(o.key)).length;
  const perPaycheck = result.total / ({ weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 } as const)[profile.payFrequency];
  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      download(`${what}.txt`, text, "text/plain");
    }
  };
  const allEv = [b.retirement.evidence, b.hsa.evidence, b.healthFsa.evidence, b.dependentCareFsa.evidence, b.commuter.evidence, b.espp.evidence, b.tuition.evidence, ...b.perks.map((p) => p.evidence), ...b.medicalPlans.map((p) => p.evidence)].filter(Boolean) as Evidence[];
  const verified = allEv.filter((e) => e.verified).length;
  const priced = result.planCosts.filter((c) => c.netCost != null && (!c.availabilityNote || c.index === profile.currentPlanIndex));
  const bestCost = priced.length ? Math.min(...priced.map((c) => c.netCost!)) : null;
  const sourceLabel = session.sourceName.replace(/\.pdf$/i, "");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* headline */}
      <section className="relative overflow-hidden border-b border-line py-12 sm:py-16">
        <div className="halftone pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_80%_50%,black,transparent_65%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="eyebrow">{b.employerName ?? "Your employer"} · {b.planYear ?? "2026"} benefits{session.sample ? " · sample" : ""}</div>
            <div className="mt-5 text-[15px] text-muted">You&apos;re leaving</div>
            <div className="font-display money mt-1 text-[64px] leading-none font-bold sm:text-[92px]">{usd(result.total)}</div>
            <div className="mt-3 text-[17px] text-fg/90">
              on the table every year: about <span className="money">{usd(perPaycheck)}</span> per paycheck, across {liveCount} {liveCount === 1 ? "opportunity" : "opportunities"}.
            </div>
            {result.optionalTotal > 0 && (
              <div className="mt-2 font-mono text-[12px] text-muted">+ {usd(result.optionalTotal)} more available if you choose to use it (ESPP, tuition, other programs)</div>
            )}
            <div className="no-print mt-8 flex flex-wrap gap-2.5">
              <button className="btn btn-primary btn-sm" onClick={() => copy("plan", buildPlanText(session, result))}>{copied === "plan" ? "✓ Copied" : "Copy action plan"}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => download("leftontable-deadlines.ics", buildIcs(session, result), "text/calendar")}>Add deadlines to calendar</button>
              <button className="btn btn-ghost btn-sm" onClick={() => copy("email", buildHrEmail(session, result))}>{copied === "email" ? "✓ Copied" : "Copy email to HR"}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Save as PDF</button>
            </div>
          </div>
          <div className="card relative hidden aspect-[3/2] overflow-hidden bg-black lg:block">
            <Image src="/art/sculptor.png" alt="" fill sizes="420px" className="art object-cover" />
            <div className="scanlines absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black to-transparent px-4 pt-10 pb-3 font-mono text-[10.5px] text-muted">
              <span>{session.pageCount} pages read</span>
              <span className="text-money">{verified}/{allEv.length} quotes verified</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-10">
          {/* opportunities */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold">Your money, ranked</h2>
              <span className="font-mono text-[11px] text-dim">tap a card for steps</span>
            </div>
            {counted.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="font-display text-2xl font-bold">Nice — you&apos;re using what we can see.</div>
                <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">Based on your answers, we didn&apos;t find unclaimed money. Try adjusting your numbers on the right, or add a paystub for a sharper check.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {counted.map((o, i) => (
                  <OpportunityCard key={o.key} o={o} i={i} source={sourceLabel} dismissed={profile.dismissed.includes(o.key)} onToggle={() => toggle(o.key)} />
                ))}
              </div>
            )}
          </section>

          {optional.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Also available, if you want it</h2>
              <p className="mt-1 mb-4 text-[14px] text-muted">Real money, but it depends on a choice you make. Not counted in your total.</p>
              <div className="space-y-3">
                {optional.map((o, i) => (
                  <OpportunityCard key={o.key} o={o} i={counted.length + i} source={sourceLabel} dismissed={profile.dismissed.includes(o.key)} onToggle={() => toggle(o.key)} />
                ))}
              </div>
            </section>
          )}

          {/* plan comparison */}
          {b.medicalPlans.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Health plans, priced for you</h2>
              <p className="mt-1 mb-4 text-[14px] text-muted">
                Estimated yearly cost at {usd(profile.expectedMedicalSpend)} of medical bills. Change your expected usage on the right to stress-test.
              </p>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-[13px]">
                  <thead className="font-mono text-[10.5px] tracking-wider text-dim uppercase">
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 font-normal">Plan</th>
                      <th className="px-3 py-3 text-right font-normal">Premiums</th>
                      <th className="px-3 py-3 text-right font-normal">Out of pocket</th>
                      <th className="px-3 py-3 text-right font-normal">Employer $</th>
                      <th className="px-3 py-3 text-right font-normal">Tax saved</th>
                      <th className="px-4 py-3 text-right font-normal">Net cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.planCosts.map((c) => {
                      const best = c.netCost != null && c.netCost === bestCost && priced.some((x) => x.index === c.index);
                      const current = c.index === profile.currentPlanIndex;
                      return (
                        <tr key={c.index} className={`border-b border-line last:border-0 ${best ? "bg-money/5" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{c.name}</div>
                            <div className="mt-0.5 flex gap-2 font-mono text-[10px] text-dim">
                              <span>{c.type}</span>
                              {current && <span className="text-fg">· YOUR PLAN</span>}
                              {best && <span className="text-money">· CHEAPEST FOR YOU</span>}
                            </div>
                            {c.availabilityNote && <div className="mt-0.5 font-mono text-[10px] text-warn">{c.availabilityNote}</div>}
                          </td>
                          <td className="px-3 py-3 text-right tnum">{c.premiumAnnual == null ? <span className="text-dim">n/a</span> : usd(c.premiumAnnual)}</td>
                          <td className="px-3 py-3 text-right tnum">{usd(c.outOfPocket)}</td>
                          <td className="px-3 py-3 text-right tnum text-money">{c.employerAccount ? `−${usd(c.employerAccount)}` : "—"}</td>
                          <td className="px-3 py-3 text-right tnum text-money">{c.taxSavings ? `−${usd(c.taxSavings)}` : "—"}</td>
                          <td className={`px-4 py-3 text-right font-semibold tnum ${best ? "money" : ""}`}>{c.netCost == null ? <span className="font-normal text-dim">premiums not listed</span> : usd(c.netCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 font-mono text-[10.5px] text-dim">Simplified model: deductible → coinsurance → out-of-pocket max. Copay-only plans are estimated at 10% of bills. Networks vary; confirm your doctors before switching. Region-limited plans are never recommended.</p>
            </section>
          )}

          {result.freePerks.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Free perks hiding in your guide</h2>
              <p className="mt-1 mb-4 text-[14px] text-muted">No dollar amount listed, but already paid for by your employer.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.freePerks.map((p, i) => (
                  <div key={i} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.evidence?.page && <span className="font-mono text-[10px] text-dim">p. {p.evidence.page}</span>}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.description}</p>
                    {p.howToClaim && <p className="mt-2 font-mono text-[11px] text-fg/70">→ {p.howToClaim}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card p-5 font-mono text-[11px] leading-relaxed text-muted">
            <div className="eyebrow mb-2">How we got these numbers</div>
            <p>
              {session.pageCount} pages of <span className="text-fg">{session.sourceName}</span> were read in your browser. {session.model} extracted the facts and quoted its sources; {verified} of {allEv.length} quotes were found verbatim in the document.
              A deterministic calculator then applied 2026 IRS limits and your estimated marginal tax rate: {Math.round(result.marginal.federal * 100)}% federal + {(result.marginal.state * 100).toFixed(1)}% state + {(result.marginal.fica * 100).toFixed(2)}% FICA.
            </p>
            {b.notes.length > 0 && <ul className="mt-2 list-disc pl-4">{b.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <p className="mt-2 text-dim">Educational estimate, not tax or investment advice. Nothing you uploaded was stored.</p>
          </section>
        </div>

        {/* sidebar */}
        <aside className="no-print lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:thin]">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Your numbers</span>
              <span className="font-mono text-[10px] text-money">live</span>
            </div>
            <p className="mt-1 mb-5 text-[12.5px] text-muted">Change anything. The total updates instantly.</p>
            <ProfileFields profile={profile} set={set} benefits={b} compact />
          </div>
          <button onClick={onRestart} className="btn btn-ghost mt-3 w-full">Scan another guide</button>
        </aside>
      </div>
    </div>
  );
}
