"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const tabs = [
  { href: "/dashboard", label: "Fleet" },
  { href: "/checklist", label: "Pre-Start" },
  { href: "/vault", label: "Vault" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isLoginPage = pathname === "/login";

  if (isLoginPage || !user) {
    return (
      <header className="border-b border-fogDark bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            <span className="font-display font-bold text-white tracking-wider text-xl uppercase">
              OPS GATE
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="border-b border-fogDark bg-ink">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="w-2 h-2 rounded-full bg-amber group-hover:scale-125 transition-transform" aria-hidden />
            <span className="font-display font-bold text-white tracking-tight text-lg group-hover:text-amber transition-colors">
              OPS GATE
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.fullName}</p>
              <p className="text-[10px] font-mono text-white/50 capitalize">{user.role.replace(/_/g, " ")}</p>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
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
