"use client";

import type { BenefitsExtraction, CoverageTier, Profile } from "@/lib/types";
import { STATE_NAMES } from "@/lib/tax";
import { usd } from "@/lib/format";

export function Segmented<T extends string | number>({
  value, options, onChange, size = "md",
}: { value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className={`grid gap-px border border-line-2 bg-line-2`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center justify-center px-2 text-center transition ${size === "sm" ? "py-2 text-[12px]" : "py-2.5 text-[13px]"} ${active ? "bg-fg text-black" : "bg-[#050505] text-fg hover:bg-panel-2"}`}
          >
            <span className="font-medium leading-tight">{o.label}</span>
            {o.hint && <span className={`mt-0.5 font-mono text-[10px] ${active ? "text-black/60" : "text-dim"}`}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MoneyInput({ value, onChange, suffix, prefix = "$", step = 1, min = 0, max }: {
  value: number; onChange: (n: number) => void; suffix?: string; prefix?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center border border-line-2 bg-[#050505] focus-within:border-fg">
      {prefix && <span className="pl-3 font-mono text-[13px] text-dim">{prefix}</span>}
      <input
        inputMode="decimal"
        className="w-full min-w-0 bg-transparent px-2.5 py-[0.65rem] text-[15px] tnum outline-none"
        value={Number.isFinite(value) ? value.toLocaleString("en-US") : ""}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
          if (Number.isFinite(n)) onChange(Math.max(min, max != null ? Math.min(max, n) : n));
        }}
        step={step}
      />
      {suffix && <span className="pr-3 font-mono text-[12px] whitespace-nowrap text-dim">{suffix}</span>}
    </div>
  );
}

const TIERS: { value: CoverageTier; label: string }[] = [
  { value: "self", label: "Just me" },
  { value: "self_spouse", label: "+ Partner" },
  { value: "self_children", label: "+ Kids" },
  { value: "family", label: "Family" },
];

const USAGE = [
  { value: 500, label: "Light", hint: "~$500" },
  { value: 2500, label: "Typical", hint: "~$2.5k" },
  { value: 8000, label: "Heavy", hint: "~$8k" },
  { value: 20000, label: "Major", hint: "~$20k" },
];

export function ProfileFields({
  profile, set, benefits, plansLoading, compact = false, detected = [],
}: {
  profile: Profile;
  set: (patch: Partial<Profile>) => void;
  benefits: BenefitsExtraction | null;
  plansLoading?: boolean;
  compact?: boolean;
  detected?: (keyof Profile)[];
}) {
  const tag = (k: keyof Profile) => (detected.includes(k) ? <span className="ml-2 text-money normal-case tracking-normal">· from paystub</span> : null);
  const gap = compact ? "gap-4" : "gap-6";
  const plans = benefits?.medicalPlans ?? [];
  return (
    <div className={`grid ${gap}`}>
      <div className={`grid ${gap} ${compact ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label className="field-label">Annual salary{tag("salary")}</label>
          <MoneyInput value={profile.salary} onChange={(salary) => set({ salary })} suffix="/ yr" />
        </div>
        <div>
          <label className="field-label">Your 401(k) contribution{tag("contribution401kPercent")}</label>
          <MoneyInput value={profile.contribution401kPercent} onChange={(v) => set({ contribution401kPercent: v })} prefix="" suffix="% of pay" max={100} step={0.5} />
        </div>
      </div>

      <div className={`grid ${gap} ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}>
        <div className={compact ? "col-span-2" : ""}>
          <label className="field-label">State{tag("state")}</label>
          <select className="input" value={profile.state} onChange={(e) => set({ state: e.target.value })}>
            {Object.entries(STATE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Paid{tag("payFrequency")}</label>
          <select className="input" value={profile.payFrequency} onChange={(e) => set({ payFrequency: e.target.value as Profile["payFrequency"] })}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="semimonthly">Twice a month</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="field-label">Age</label>
          <MoneyInput value={profile.age} onChange={(age) => set({ age })} prefix="" max={99} />
        </div>
      </div>

      <div>
        <label className="field-label">Tax filing status</label>
        <Segmented
          size={compact ? "sm" : "md"}
          value={profile.filingStatus}
          onChange={(filingStatus) => set({ filingStatus })}
          options={[
            { value: "single", label: "Single" },
            { value: "married_joint", label: "Married" },
            { value: "head_of_household", label: compact ? "Head of HH" : "Head of household" },
          ]}
        />
      </div>

      <div>
        <label className="field-label">Who&apos;s on your health plan</label>
        <Segmented size={compact ? "sm" : "md"} value={profile.coverageTier} onChange={(coverageTier) => set({ coverageTier })} options={TIERS} />
      </div>

      <div>
        <label className="field-label">Your current medical plan{detected.includes("currentPlanIndex") && <span className="ml-2 text-money normal-case tracking-normal">· matched from paystub</span>}</label>
        <select
          className="input"
          value={profile.currentPlanIndex}
          disabled={plansLoading && !plans.length}
          onChange={(e) => set({ currentPlanIndex: Number(e.target.value) })}
        >
          <option value={-1}>{plansLoading && !plans.length ? "Reading plans from your guide…" : "Not sure / not enrolled"}</option>
          {plans.map((p, i) => (
            <option key={i} value={i}>{p.name}{p.hsaEligible ? " (HSA-eligible)" : ""}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">Medical bills you expect this year (before insurance)</label>
        <Segmented
          size={compact ? "sm" : "md"}
          value={USAGE.some((u) => u.value === profile.expectedMedicalSpend) ? profile.expectedMedicalSpend : -1}
          onChange={(v) => v > 0 && set({ expectedMedicalSpend: v })}
          options={USAGE}
        />
        {!compact && <p className="mt-2 font-mono text-[11px] text-dim">Light = a checkup or two. Typical = some visits + prescriptions. Heavy = a procedure, therapy or a chronic condition.</p>}
      </div>

      <div className={`grid ${gap} ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <div>
          <label className="field-label">Childcare (kids under 13)</label>
          <MoneyInput value={Math.round(profile.childcareAnnual / 12)} onChange={(v) => set({ childcareAnnual: v * 12 })} suffix="/ mo" />
        </div>
        <div>
          <label className="field-label">Transit + parking{tag("currentCommuterMonthly")}</label>
          <MoneyInput value={profile.commuteMonthly} onChange={(commuteMonthly) => set({ commuteMonthly })} suffix="/ mo" />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-[14px]">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--money)]" checked={profile.wantsEducation} onChange={(e) => set({ wantsEducation: e.target.checked })} />
        <span>
          I&apos;m planning to take courses or a degree
          <span className="block font-mono text-[11px] text-dim">Counts tuition reimbursement in your total</span>
        </span>
      </label>

      {!compact && profile.currentHsaAnnual + profile.currentHealthFsaAnnual + profile.currentDcfsaAnnual > 0 && (
        <p className="font-mono text-[11px] text-money">
          From your paystub: HSA {usd(profile.currentHsaAnnual)}/yr · FSA {usd(profile.currentHealthFsaAnnual)}/yr · Dependent care {usd(profile.currentDcfsaAnnual)}/yr
        </p>
      )}
    </div>
  );
}
