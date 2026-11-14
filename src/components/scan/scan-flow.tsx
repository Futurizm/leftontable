"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalysisSession, BenefitsExtraction, PaystubExtraction, Profile } from "@/lib/types";
import { extract, readDocument } from "@/lib/client/read-file";
import { DEFAULT_PROFILE, guessPlan, profileFromPaystub } from "@/lib/profile";
import { Dropzone, type DocState } from "./dropzone";
import { ProfileFields } from "./fields";
import { Results } from "./results";

type Step = "guide" | "paystub" | "profile" | "analyzing" | "results";
const STORE = "lot:session:v1";

const SAMPLE_PROFILE: Partial<Profile> = {
  filingStatus: "married_joint",
  state: "IL",
  age: 34,
  coverageTier: "family",
  expectedMedicalSpend: 2_500,
  childcareAnnual: 1_100 * 12,
  commuteMonthly: 210,
};

function StepBar({ step }: { step: Step }) {
  const items: [Step, string][] = [["guide", "Guide"], ["paystub", "Paystub"], ["profile", "About you"], ["results", "Your money"]];
  const idx = step === "analyzing" ? 3 : items.findIndex(([s]) => s === step);
  return (
    <ol className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] uppercase sm:gap-3">
      {items.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3">
          <span className={`flex items-center gap-2 ${i === idx ? "text-fg" : i < idx ? "text-money" : "text-dim"}`}>
            <span className={`flex h-6 w-6 items-center justify-center border ${i === idx ? "border-fg" : i < idx ? "border-money/60" : "border-line-2"}`}>{i < idx ? "✓" : `0${i + 1}`}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
          {i < items.length - 1 && <span className="h-px w-4 bg-line-2 sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}

function Analyzing({ guide, paystub, onRetry }: { guide: DocState | null; paystub: DocState | null; onRetry: () => void }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const lines = [
    { ok: true, text: `Opened ${guide?.name ?? "guide"} in your browser (${guide?.pageCount ?? "?"} pages)` },
    { ok: guide?.status === "done", text: "Extracting 401(k) match formula, HSA/FSA rules, plan prices" },
    { ok: guide?.status === "done" && t > 0, text: "Collecting stipends and perks with page citations" },
    ...(paystub ? [{ ok: paystub.status === "done", text: "Reading your paystub deductions" }] : []),
    { ok: false, text: "Applying 2026 IRS limits and your tax bracket" },
  ];
  const err = guide?.status === "error" ? guide.error : null;
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
      <div className="card relative aspect-[3/2] overflow-hidden bg-black">
        <Image src="/art/sculptor.png" alt="" fill sizes="480px" className="art object-cover" />
        <div className="scanlines absolute inset-0" />
        {!err && <div className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-white/10 to-transparent" style={{ animation: "scan 2.2s linear infinite" }} />}
      </div>
      <div>
        <div className="eyebrow">{err ? "Something went wrong" : `Analyzing · ${t}s`}</div>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{err ? "We couldn't read that guide." : "Reading the fine print so you don't have to."}</h2>
        {err ? (
          <>
            <p className="mt-4 text-muted">{err}</p>
            <button className="btn btn-primary mt-6" onClick={onRetry}>Try another file</button>
          </>
        ) : (
          <ul className="mt-6 space-y-2.5 font-mono text-[12.5px]">
            {lines.map((l, i) => (
              <li key={i} className={l.ok ? "text-fg" : "text-muted"}>
                <span className={l.ok ? "text-money" : "text-dim"}>{l.ok ? "✓" : "›"}</span> {l.text}
                {!l.ok && i === lines.findIndex((x) => !x.ok) && <span className="cursor-blink">_</span>}
              </li>
            ))}
          </ul>
        )}
        {!err && <p className="mt-6 text-[13px] text-dim">Long guides take 20–40 seconds. Nothing is stored.</p>}
      </div>
    </div>
  );
}

export function ScanFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("guide");
  const [guide, setGuide] = useState<DocState | null>(null);
  const [paystub, setPaystub] = useState<DocState | null>(null);
  const [benefits, setBenefits] = useState<BenefitsExtraction | null>(null);
  const [stub, setStub] = useState<PaystubExtraction | null>(null);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [detected, setDetected] = useState<(keyof Profile)[]>([]);
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [isSample, setIsSample] = useState(false);
  const meta = useRef<{ pageCount: number; name: string; model: string }>({ pageCount: 0, name: "", model: "" });
  const touched = useRef<Set<keyof Profile>>(new Set());
  const runId = useRef(0);

  const setProfile = (patch: Partial<Profile>) => {
    Object.keys(patch).forEach((k) => touched.current.add(k as keyof Profile));
    setProfileState((p) => ({ ...p, ...patch }));
  };

  // Restore a previous result in this tab (e.g. after a reload). Links that say "scan" open /scan?new=1,
  // which always starts a fresh scan.
  useEffect(() => {
    if (params.get("sample")) return;
    if (params.get("new")) {
      try {
        sessionStorage.removeItem(STORE);
      } catch {}
      router.replace("/scan");
      return;
    }
    try {
      const raw = sessionStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw) as AnalysisSession;
        setSession(s);
        setStep("results");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuide = useCallback(async (file: File) => {
    const id = ++runId.current;
    setBenefits(null);
    setGuide({ name: file.name, status: "reading" });
    try {
      const doc = await readDocument(file, (d, t) => id === runId.current && setGuide((g) => g && { ...g, progress: [d, t] }));
      if (id !== runId.current) return;
      meta.current = { ...meta.current, pageCount: doc.pageCount, name: file.name };
      setGuide((g) => g && { ...g, status: "extracting", pageCount: doc.pageCount });
      const res = await extract<BenefitsExtraction>("benefits", doc);
      if (id !== runId.current) return;
      meta.current.model = res.model;
      setBenefits(res.data);
      setGuide((g) => g && { ...g, status: "done", ms: res.ms });
    } catch (e) {
      if (id !== runId.current) return;
      setGuide((g) => g && { ...g, status: "error", error: (e as Error).message });
    }
  }, []);

  const handlePaystub = useCallback(async (file: File) => {
    setStub(null);
    setPaystub({ name: file.name, status: "reading" });
    try {
      const doc = await readDocument(file);
      setPaystub((g) => g && { ...g, status: "extracting", pageCount: doc.pageCount });
      const res = await extract<PaystubExtraction>("paystub", doc);
      setStub(res.data);
      setPaystub((g) => g && { ...g, status: "done", ms: res.ms });
    } catch (e) {
      setPaystub((g) => g && { ...g, status: "error", error: (e as Error).message });
    }
  }, []);

  // Apply paystub facts to fields the user hasn't edited.
  useEffect(() => {
    if (!stub) return;
    const { patch } = profileFromPaystub(stub, profile);
    const keys = (Object.keys(patch) as (keyof Profile)[]).filter((k) => !touched.current.has(k));
    const clean = Object.fromEntries(keys.map((k) => [k, patch[k]])) as Partial<Profile>;
    setProfileState((p) => ({ ...p, ...clean }));
    setDetected((d) => [...new Set([...d, ...keys])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stub]);

  // Once plans are known, auto-detect the current plan from the paystub premium.
  useEffect(() => {
    if (!benefits || !stub || touched.current.has("currentPlanIndex")) return;
    const g = guessPlan(benefits, stub, stub.payFrequency ?? profile.payFrequency);
    if (g) {
      setProfileState((p) => ({ ...p, currentPlanIndex: g.index, coverageTier: touched.current.has("coverageTier") ? p.coverageTier : g.tier }));
      setDetected((d) => [...new Set([...d, "currentPlanIndex" as const])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefits, stub]);

  // Sample employee: run the real pipeline on bundled sample PDFs.
  useEffect(() => {
    if (params.get("sample") !== "acme") return;
    setIsSample(true);
    sessionStorage.removeItem(STORE);
    setProfileState({ ...DEFAULT_PROFILE, ...SAMPLE_PROFILE });
    (async () => {
      const [g, p] = await Promise.all(
        ["/samples/acme-benefits-guide-2027.pdf", "/samples/acme-paystub-2026-11.pdf"].map(async (u) => {
          const blob = await (await fetch(u)).blob();
          return new File([blob], u.split("/").pop()!, { type: "application/pdf" });
        }),
      );
      handleGuide(g);
      handlePaystub(p);
      setStep("profile");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When analysis is pending and data arrives, show results.
  useEffect(() => {
    if (step !== "analyzing" || !benefits) return;
    if (paystub && paystub.status !== "done" && paystub.status !== "error") return;
    // The plan-detection effect may not have committed yet; resolve it here too.
    let finalProfile = profile;
    if (stub && profile.currentPlanIndex === -1 && !touched.current.has("currentPlanIndex")) {
      const g = guessPlan(benefits, stub, stub.payFrequency ?? profile.payFrequency);
      if (g) finalProfile = { ...profile, currentPlanIndex: g.index, coverageTier: touched.current.has("coverageTier") ? profile.coverageTier : g.tier };
    }
    const s: AnalysisSession = {
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      sourceName: meta.current.name,
      pageCount: meta.current.pageCount,
      benefits,
      paystub: stub,
      profile: finalProfile,
      model: meta.current.model,
      sample: isSample,
    };
    setSession(s);
    setStep("results");
    window.scrollTo({ top: 0 });
  }, [step, benefits, stub, paystub, profile, isSample]);

  useEffect(() => {
    if (!session) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify(session));
    } catch {}
  }, [session]);

  const restart = () => {
    runId.current++;
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
    setSession(null);
    setGuide(null);
    setPaystub(null);
    setBenefits(null);
    setStub(null);
    setDetected([]);
    touched.current = new Set();
    setProfileState(DEFAULT_PROFILE);
    setIsSample(false);
    setStep("guide");
    router.replace("/scan");
    window.scrollTo({ top: 0 });
  };

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <div className="no-print sticky top-0 z-40 border-b border-line bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="font-display text-[17px] font-bold">LeftOnTable</Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <StepBar step={step} />
            {step === "results" && (
              <button onClick={restart} className="btn btn-primary btn-sm">
                <span className="hidden sm:inline">+ New scan</span>
                <span className="sm:hidden">+ New</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isSample && step !== "results" && (
        <div className="border-b border-line bg-panel-2">
          <div className="mx-auto max-w-3xl px-4 py-3 font-mono text-[11.5px] text-muted sm:px-6">
            <span className="text-money">SAMPLE</span> · Jordan Rivera, 34, Chicago, married with a toddler in daycare. Works at the fictional Acme Corp. Real AI analysis of the sample PDFs.
          </div>
        </div>
      )}

      {step === "guide" && (
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="eyebrow">Step 01</div>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Upload your benefits guide</h1>
          <p className="mt-3 max-w-xl text-muted">The PDF your employer publishes for open enrollment, often called the <em>Benefits Guide</em>, <em>Benefits Summary</em> or <em>Total Rewards guide</em>.</p>
          <div className="mt-8">
            <Dropzone accept="application/pdf" title="Drop your benefits guide here" hint="PDF · read privately in your browser" doc={guide} onFile={handleGuide} onClear={() => { runId.current++; setGuide(null); setBenefits(null); }} />
          </div>
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Link href="/scan?sample=acme" onClick={(e) => { e.preventDefault(); window.location.href = "/scan?sample=acme"; }} className="font-mono text-[12px] text-muted underline decoration-line-2 underline-offset-4 hover:text-fg">
              No guide handy? Try a sample employee →
            </Link>
            <button className="btn btn-primary" disabled={!guide || guide.status === "error"} onClick={() => go("paystub")}>Continue →</button>
          </div>
          <div className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            {[
              ["Where to find it", "Your HR portal (Workday, ADP, bswift, Benefitfocus) or intranet. Search “benefits guide 2026”."],
              ["Private by design", "The PDF is opened on your device. Only its text is analyzed, and nothing is saved."],
              ["Works with", "Companies, universities, cities and states. Any US employer guide in English."],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="eyebrow">{t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === "paystub" && (
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="eyebrow">Step 02 · optional</div>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Add a recent paystub</h1>
          <p className="mt-3 max-w-xl text-muted">It tells us what you&apos;re already contributing (401(k), HSA, FSA, commuter) so we only flag what&apos;s actually missing. A PDF or a phone photo works.</p>
          <div className="mt-8">
            <Dropzone accept="application/pdf,image/*" title="Drop a paystub (PDF or photo)" hint="We only read deduction lines. Nothing is saved." doc={paystub} onFile={handlePaystub} onClear={() => { setPaystub(null); setStub(null); }} />
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <button className="btn btn-ghost" onClick={() => go("guide")}>← Back</button>
            <div className="flex gap-3">
              {!paystub && <button className="btn btn-ghost" onClick={() => go("profile")}>Skip</button>}
              {paystub && <button className="btn btn-primary" onClick={() => go("profile")}>Continue →</button>}
            </div>
          </div>
        </section>
      )}

      {step === "profile" && (
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="eyebrow">Step 03</div>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">A few quick facts</h1>
          <p className="mt-3 max-w-xl text-muted">Used only to price what you&apos;re missing. Rough numbers are fine, and you can tweak everything on the results page.</p>
          {(guide || paystub) && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]">
              {guide && <span className={guide.status === "done" ? "text-money" : guide.status === "error" ? "text-warn" : "text-muted"}>{guide.status === "done" ? "✓" : guide.status === "error" ? "!" : "…"} Guide: {guide.status === "done" ? "analyzed" : guide.status === "error" ? guide.error : "analyzing in background"}</span>}
              {paystub && <span className={paystub.status === "done" ? "text-money" : paystub.status === "error" ? "text-warn" : "text-muted"}>{paystub.status === "done" ? "✓" : paystub.status === "error" ? "!" : "…"} Paystub: {paystub.status === "done" ? "read" : paystub.status === "error" ? paystub.error : "reading"}</span>}
            </div>
          )}
          <div className="card mt-8 p-5 sm:p-7">
            <ProfileFields profile={profile} set={setProfile} benefits={benefits} plansLoading={guide?.status !== "done"} detected={detected} />
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <button className="btn btn-ghost" onClick={() => go(isSample ? "guide" : "paystub")} disabled={isSample}>← Back</button>
            <button className="btn btn-primary" onClick={() => go(guide?.status === "error" ? "guide" : "analyzing")} disabled={!guide}>Show my money →</button>
          </div>
        </section>
      )}

      {step === "analyzing" && <Analyzing guide={guide} paystub={paystub} onRetry={restart} />}

      {step === "results" && session && (
        <Results
          session={session}
          setProfile={(p) => setSession((s) => s && { ...s, profile: p })}
          onRestart={restart}
        />
      )}
    </div>
  );
}
