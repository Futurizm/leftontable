import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/brand";

const FOUND = [
  { label: "Cheaper health plan for how you use care", value: "+$3,024", page: "p.2" },
  { label: "Daycare through the Dependent Care FSA", value: "+$1,845", page: "p.3" },
  { label: "401(k) match you're not collecting", value: "+$1,800", page: "p.4" },
  { label: "Commuter subsidy + pre-tax transit", value: "+$1,525", page: "p.3" },
  { label: "Learning, wellness & phone stipends", value: "+$2,080", page: "p.5" },
];

const WHY = [
  {
    n: "#01",
    tag: "FIND",
    title: "Money hiding in plain sight",
    body: "The average benefits guide runs 30–50 pages. We read all of it and find the matches, stipends and tax breaks you never claimed.",
    img: "/art/hand-laptop.png",
  },
  {
    n: "#02",
    tag: "PRIVATE",
    title: "Your files never get stored",
    body: "PDFs are read inside your browser. Only the extracted text is sent for analysis, and nothing is saved. Close the tab and it's gone.",
    img: "/art/hands-screen.png",
  },
  {
    n: "#03",
    tag: "PROOF",
    title: "Every dollar has a source",
    body: "AI pulls the facts out of your guide. A transparent calculator does the math. Each finding links to the exact quote and page.",
    img: "/art/sculptor.png",
  },
];

const CHECKS = [
  ["401(k) / 403(b) match", "Are you contributing enough to get the full match?"],
  ["HSA employer seed", "Free money that only lands if you open the account."],
  ["Health FSA", "Pay copays, glasses and prescriptions pre-tax."],
  ["Dependent care FSA", "Up to $7,500 of daycare pre-tax in 2026."],
  ["Commuter benefits", "Up to $340/mo of transit and parking pre-tax, plus subsidies."],
  ["Health plan choice", "PPO vs HDHP priced against how you actually use care."],
  ["Stipends", "Wellness, gym, phone, internet, home office, learning."],
  ["ESPP", "Discounted company stock, explained without the jargon."],
  ["Tuition & student loans", "Education dollars most people never touch."],
];

const STEPS = [
  ["01", "Upload your guide", "The benefits PDF from HR or your intranet."],
  ["02", "Add a paystub", "Optional. Shows what you're actually using today."],
  ["03", "Answer 6 questions", "Salary, state, commute, kids. 30 seconds."],
  ["04", "Claim your money", "A ranked list with steps, deadlines and sources."],
];

const PLANS = [
  {
    name: "Scan",
    price: "$0",
    per: "forever",
    blurb: "One full report, whenever you need it.",
    features: ["Full benefits scan", "Paystub cross-check", "Step-by-step claim plan", "Calendar deadlines"],
    cta: "Start free scan",
    href: "/scan",
    highlight: false,
  },
  {
    name: "Plus",
    price: "$6",
    per: "/ month",
    blurb: "Keeps checking after every payday.",
    features: ["Everything in Scan", "Paycheck monitoring each payday", "Use-it-or-lose-it FSA alerts", "Life events: baby, marriage, move", "Open-enrollment plan picker"],
    cta: "Free during beta",
    href: "/scan",
    highlight: true,
  },
  {
    name: "Household",
    price: "$99",
    per: "/ year",
    blurb: "Two jobs, two benefit packages.",
    features: ["Everything in Plus", "Compare both employers' plans", "Who should cover the kids?", "Shared FSA & HSA caps handled"],
    cta: "Free during beta",
    href: "/scan",
    highlight: false,
  },
];

const FAQ = [
  ["Is it really free?", "Yes. During the beta every feature is free with no account and no card. Paid plans will add ongoing paycheck monitoring; a one-time scan stays free."],
  ["What happens to my documents?", "Your PDF is opened in your browser and only its text is sent to our AI for extraction. We don't store files, text or results on our servers. Your report lives in this browser tab only."],
  ["Where do the dollar amounts come from?", "AI extracts facts (match formula, stipends, plan prices) and quotes the page it found them on. Then a deterministic calculator applies 2026 IRS limits and your tax bracket. Every card shows its math."],
  ["Do I need my paystub?", "No, but it helps. The paystub shows what you're already contributing, so we can tell what's missing instead of guessing. A photo works too."],
  ["Where do I find my benefits guide?", "Search your company intranet or HR portal (Workday, ADP, Benefitfocus, bswift) for \"benefits guide\" or \"benefits summary\", or ask HR. It's usually published every open enrollment."],
  ["Is this financial advice?", "No. It's an educational estimate to help you ask the right questions. Always confirm with your plan administrator before changing elections."],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="halftone pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_80%,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-line-2" />
              <span className="eyebrow">LeftOnTable · for US employees</span>
              <span className="h-px w-10 bg-line-2" />
            </div>
            <h1 className="font-display mx-auto max-w-4xl text-[40px] leading-[1.02] font-bold sm:text-6xl md:text-7xl">
              Get every dollar your job <span className="money">already promised</span> you.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
              Upload your benefits guide. AI reads the fine print, checks it against your paycheck, and shows how much money you&apos;re leaving on the table, and exactly how to claim it.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/scan" className="btn btn-primary w-full sm:w-auto">Scan my benefits, free →</Link>
              <Link href="/scan?sample=acme" className="btn btn-ghost w-full sm:w-auto">Try a sample employee</Link>
            </div>
            <p className="mt-4 font-mono text-[11px] text-dim">No sign-up · nothing stored · about 60 seconds</p>
          </div>

          {/* hero visual */}
          <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
            <div className="card relative grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[260px] border-b border-line bg-black md:border-r md:border-b-0">
                <Image src="/art/hand-laptop.png" alt="" fill priority sizes="(max-width: 768px) 100vw, 560px" className="art object-cover object-center" />
                <div className="scanlines absolute inset-0" />
                <span className="eyebrow absolute top-4 left-4">scan · acme corp guide · 7 pages</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Left on the table</span>
                  <span className="font-mono text-[11px] text-dim">2026</span>
                </div>
                <div className="font-display money mt-2 text-5xl font-bold sm:text-6xl">$10,692<span className="text-2xl text-muted">/yr</span></div>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {FOUND.map((f) => (
                    <li key={f.label} className="flex items-center justify-between gap-3 py-3 text-[14px]">
                      <span className="text-fg/90">{f.label}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-dim">{f.page}</span>
                        <span className="money font-mono">{f.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-[11px] text-dim">✓ sample employee · every number quoted from the guide</p>
              </div>
            </div>
          </div>
        </section>

        {/* STRIP */}
        <section className="border-y border-line bg-panel">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-4 sm:px-6 md:grid-cols-4 md:divide-x">
            {[
              ["9", "benefit types checked"],
              ["2026", "IRS limits built in"],
              ["100%", "findings cited to a page"],
              ["0", "files stored"],
            ].map(([n, l]) => (
              <div key={l} className="px-2 py-6 text-center md:px-6">
                <div className="font-display text-3xl font-bold">{n}</div>
                <div className="eyebrow mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-line-2" />
              <span className="eyebrow">Why LeftOnTable</span>
              <span className="h-px w-10 bg-line-2" />
            </div>
            <h2 className="font-display mx-auto max-w-3xl text-center text-3xl font-bold sm:text-5xl">Your employer wrote it down. Nobody read it to you.</h2>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {WHY.map((w) => (
                <article key={w.n} className="card group flex flex-col">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <span className="font-mono text-[11px] text-dim">{w.n}</span>
                    <span className="eyebrow">{w.tag}</span>
                  </div>
                  <h3 className="font-display px-5 pt-3 text-2xl font-bold">{w.title}</h3>
                  <div className="relative mx-5 mt-5 aspect-[3/2] overflow-hidden bg-black">
                    <Image src={w.img} alt="" fill sizes="(max-width: 768px) 100vw, 360px" className="art object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <p className="px-5 pt-5 pb-6 font-mono text-[13px] leading-relaxed text-muted">{w.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[260px_1fr]">
              <div>
                <span className="eyebrow">#04 · How it works</span>
                <h2 className="font-display mt-3 text-3xl font-bold">Ready in a minute</h2>
                <p className="mt-3 font-mono text-[13px] leading-relaxed text-muted">One upload. A few questions. A plan you can act on today.</p>
              </div>
              <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map(([n, t, d], i) => (
                  <li key={n} className="relative">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center border border-line-2 font-mono text-sm">{n}</span>
                      {i < STEPS.length - 1 && <span className="hidden h-px flex-1 border-t border-dashed border-line-2 lg:block" />}
                    </div>
                    <h3 className="mt-4 font-semibold">{t}</h3>
                    <p className="mt-1 font-mono text-[12px] leading-relaxed text-muted">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* CHECKS */}
        <section id="checks" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
            <span className="eyebrow">What we check</span>
            <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Nine places money hides in a benefits package.</h2>
            <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map(([t, d], i) => (
                <div key={t} className="bg-black p-6 transition hover:bg-panel-2">
                  <div className="font-mono text-[11px] text-dim">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="relative overflow-hidden border-y border-line">
          <div className="halftone absolute inset-0 opacity-70 [mask-image:linear-gradient(90deg,transparent,black,transparent)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
            <h2 className="font-display max-w-3xl text-3xl font-bold sm:text-5xl">Open enrollment closes soon. Your elections lock for a year.</h2>
            <p className="max-w-xl text-muted">Most benefit choices can only change once a year. A 60-second scan now beats twelve months of overpaying.</p>
            <Link href="/scan" className="btn btn-primary">Find my money →</Link>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="eyebrow">Pricing</span>
                <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">Pays for itself on the first paycheck.</h2>
              </div>
              <span className="border border-money/40 bg-money/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-money uppercase">Everything free during beta</span>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.name} className={`card relative flex flex-col p-6 ${p.highlight ? "border-fg/60" : ""}`}>
                  {p.highlight && <span className="absolute -top-px right-6 bg-fg px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-black uppercase">Most popular</span>}
                  <span className="eyebrow">{p.name}</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold">{p.price}</span>
                    <span className="font-mono text-[12px] text-muted">{p.per}</span>
                  </div>
                  <p className="mt-2 text-[14px] text-muted">{p.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-5 text-[14px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5"><span className="money font-mono">+</span>{f}</li>
                    ))}
                  </ul>
                  <Link href={p.href} className={`btn mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"}`}>{p.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <span className="eyebrow">Q&amp;A</span>
              <h2 className="font-display mt-3 text-4xl font-bold">Fair questions.</h2>
              <p className="mt-3 font-mono text-[13px] text-muted">Still curious?</p>
              <div className="mt-6 flex gap-3">
                <Link href="/scan" className="btn btn-primary btn-sm">Start a scan</Link>
                <Link href="/scan?sample=acme" className="btn btn-ghost btn-sm">See a sample</Link>
              </div>
            </div>
            <div className="space-y-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="card group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold">
                    {q}
                    <span className="font-mono text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-[14px] leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
