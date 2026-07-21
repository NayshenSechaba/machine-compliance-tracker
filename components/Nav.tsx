"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Fleet" },
  { href: "/checklist", label: "Pre-Start" },
  { href: "/vault", label: "Vault" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-fogDark bg-ink">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber" aria-hidden />
            <span className="font-display font-bold text-white tracking-tight text-lg">
              OPS GATE
            </span>
          </Link>
          <span className="hidden sm:block text-xs font-mono text-white/50">
            Demo Fleet Co
          </span>
        </div>
      </header>

      {/* Bottom tab bar — reachable one-handed on a phone in a cab or on site */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-ink border-t border-black/30 sm:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-3">
          {tabs.map((t) => {
            const active = pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center justify-center py-3 text-xs font-medium ${
                  active ? "text-amber" : "text-white/60"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mb-1 ${active ? "bg-amber" : "bg-transparent"}`}
                  aria-hidden
                />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop nav */}
      <nav className="hidden sm:flex bg-ink border-b border-black/30" aria-label="Primary">
        <div className="max-w-3xl mx-auto px-6 flex gap-6">
          {tabs.map((t) => {
            const active = pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`py-3 text-sm font-medium border-b-2 ${
                  active ? "border-amber text-white" : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
