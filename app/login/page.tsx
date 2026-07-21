"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [userNumber, setUserNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Allow any credentials for MVP/demo; validate inputs present
      if (!usernameOrEmail && !userNumber) {
        setError("Please enter either your username/email or user number.");
        setIsSubmitting(false);
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        setIsSubmitting(false);
        return;
      }

      await login(usernameOrEmail, userNumber, password);
    } catch (err: any) {
      setError("Login failed. Please verify your credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (profile: { name: string; number: string }) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(profile.name, profile.number, "password123");
    } catch (err) {
      setError("Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 relative">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-5000" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-fogDark rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-fogDark">
            <span className="w-2 h-2 rounded-full bg-amber animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-steel uppercase">
              Secure Gateway
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Sign in to Ops Gate</h1>
          <p className="text-xs text-steelLight">
            Enter your credentials to access the fleet dispatch and permit vault
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-steel">
              Username or Email Address
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="e.g. sipho.ndlovu@fleet.co"
              className="w-full px-4 py-2.5 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-steel">User Number</label>
              <span className="text-[10px] text-steelLight font-mono">Optional</span>
            </div>
            <input
              type="text"
              value={userNumber}
              onChange={(e) => setUserNumber(e.target.value)}
              placeholder="e.g. 01, 02, or 03"
              className="w-full px-4 py-2.5 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-steel">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-ink hover:bg-steelDark disabled:bg-steelLight text-white font-semibold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying Credentials...
              </>
            ) : (
              "Access System Gateway"
            )}
          </button>
        </form>

        {/* Quick Demo Access Options */}
        <div className="pt-4 border-t border-fogDark space-y-3">
          <p className="text-center text-[10px] font-mono text-steelLight uppercase tracking-wider">
            Quick Sign-in (Demo Profiles)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin({ name: "Sipho Ndlovu", number: "01" })}
              className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-fogDark text-left hover:scale-102 transition-transform"
            >
              <p className="text-[10px] font-bold text-ink truncate">Sipho (Driver)</p>
              <p className="text-[8px] font-mono text-steelLight mt-0.5">No. 01</p>
            </button>
            <button
              onClick={() => handleQuickLogin({ name: "Ben van der Merwe", number: "02" })}
              className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-fogDark text-left hover:scale-102 transition-transform"
            >
              <p className="text-[10px] font-bold text-ink truncate">Ben (Driver)</p>
              <p className="text-[8px] font-mono text-steelLight mt-0.5">No. 02</p>
            </button>
            <button
              onClick={() => handleQuickLogin({ name: "Thandi Khumalo", number: "03" })}
              className="px-2 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-left hover:scale-102 transition-transform"
            >
              <p className="text-[10px] font-bold text-amber-900 truncate font-sans">Thandi (Manager)</p>
              <p className="text-[8px] font-mono text-amber-800 mt-0.5">No. 03</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
