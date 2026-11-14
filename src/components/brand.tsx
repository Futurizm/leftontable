import Link from "next/link";

export function LogoMark({ size = 26 }: { size?: number }) {
  // A coin resting on the edge of a table.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="13" r="9" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16 8.5v9M13.2 10.6c0-1.1 1.2-1.8 2.8-1.8s2.8.7 2.8 1.8c0 2.6-5.6 1.3-5.6 3.9 0 1.1 1.2 1.9 2.8 1.9s2.8-.8 2.8-1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 26h28" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <path d="M6 26v4M26 26v4" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-fg">
      <LogoMark />
      <span className="font-display text-[17px] font-bold tracking-tight">LeftOnTable</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-black/75 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.16em] text-muted md:flex">
          <Link href="/#how" className="hover:text-fg">How it works</Link>
          <Link href="/#checks" className="hover:text-fg">What we check</Link>
          <Link href="/#pricing" className="hover:text-fg">Pricing</Link>
          <Link href="/#faq" className="hover:text-fg">FAQ</Link>
        </nav>
        <Link href="/scan?new=1" className="btn btn-primary btn-sm">Scan free</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line no-print">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3 text-muted">
          <LogoMark size={22} />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">LeftOnTable · 2026</span>
        </div>
        <p className="max-w-md text-center font-mono text-[11px] leading-relaxed text-dim sm:text-right">
          Educational estimates, not tax, legal or investment advice. Confirm details with your plan administrator.
        </p>
      </div>
      <div className="halftone h-24 [mask-image:linear-gradient(to_top,black,transparent)]" />
    </footer>
  );
}
