"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, demoAssets, demoOperators } from "@/lib/demoData";
import { CHECKLIST_COMPONENTS } from "@/lib/types";

type ComponentState = "unchecked" | "pass" | "fail";

export default function ChecklistPage() {
  const demo = isDemoMode();
  const assets = demoAssets; // in production, fetch via a server component + pass down, or a client fetch on mount
  const operators = demoOperators;

  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [operatorId, setOperatorId] = useState(operators[0]?.id ?? "");
  const [odometer, setOdometer] = useState("");
  const [states, setStates] = useState<Record<string, ComponentState>>(
    Object.fromEntries(CHECKLIST_COMPONENTS.map((c) => [c.key, "unchecked"]))
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"cleared" | "blocked" | null>(null);

  const allAnswered = CHECKLIST_COMPONENTS.every((c) => states[c.key] !== "unchecked");
  const failedComponents = useMemo(
    () => CHECKLIST_COMPONENTS.filter((c) => states[c.key] === "fail").map((c) => c.key),
    [states]
  );

  function setComponent(key: string, value: ComponentState) {
    setStates((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const outcome = failedComponents.length > 0 ? "blocked" : "cleared";

    if (!demo) {
      const supabase = createClient();
      await supabase.from("events").insert({
        asset_id: assetId,
        operator_id: operatorId,
        event_type: "pre_start_checklist",
        checklist_result: outcome === "cleared" ? "pass" : "fail",
        odometer_or_hours: odometer ? Number(odometer) : null,
        notes,
        flagged_components: failedComponents,
      });
      if (outcome === "blocked") {
        await supabase.from("assets").update({ status: "blocked" }).eq("id", assetId);
      }
    }

    setResult(outcome);
    setSubmitting(false);
  }

  if (result) {
    return <ResultGate outcome={result} failedComponents={failedComponents} onReset={() => {
      setResult(null);
      setStates(Object.fromEntries(CHECKLIST_COMPONENTS.map((c) => [c.key, "unchecked"])));
      setOdometer("");
      setNotes("");
    }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-steelLight">Before dispatch</p>
        <h1 className="font-display font-bold text-2xl text-ink">Pre-start checklist</h1>
        <p className="text-sm text-steelLight mt-1">
          Every component must be checked before this asset can be dispatched.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Asset">
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full border border-fogDark rounded-md px-3 py-2.5 bg-white text-sm"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Operator">
          <select
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            className="w-full border border-fogDark rounded-md px-3 py-2.5 bg-white text-sm"
          >
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Odometer / engine hours">
        <input
          type="number"
          inputMode="numeric"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          placeholder="e.g. 182450"
          className="w-full border border-fogDark rounded-md px-3 py-2.5 bg-white text-sm font-mono"
        />
      </Field>

      <div className="space-y-2">
        {CHECKLIST_COMPONENTS.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between bg-white border border-fogDark rounded-md px-4 py-3"
          >
            <span className="text-sm font-medium text-ink">{c.label}</span>
            <div className="flex gap-2">
              <ToggleButton
                active={states[c.key] === "pass"}
                tone="go"
                label="Pass"
                onClick={() => setComponent(c.key, "pass")}
              />
              <ToggleButton
                active={states[c.key] === "fail"}
                tone="stop"
                label="Fail"
                onClick={() => setComponent(c.key, "fail")}
              />
            </div>
          </div>
        ))}
      </div>

      <Field label="Notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything the site manager should know"
          className="w-full border border-fogDark rounded-md px-3 py-2.5 bg-white text-sm"
        />
      </Field>

      <p className="text-xs text-steelLight">
        Photo upload per component connects to Supabase Storage — wire this up once your bucket
        policies are set (see <code className="font-mono">supabase/schema.sql</code>).
      </p>

      <button
        disabled={!allAnswered || submitting}
        onClick={handleSubmit}
        className="w-full bg-ink text-white font-medium rounded-md py-3.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-steel transition-colors"
      >
        {submitting ? "Submitting…" : allAnswered ? "Submit checklist" : `Answer all ${CHECKLIST_COMPONENTS.length} items`}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-steelLight mb-1">{label}</span>
      {children}
    </label>
  );
}

function ToggleButton({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean;
  tone: "go" | "stop";
  label: string;
  onClick: () => void;
}) {
  const activeClass =
    tone === "go" ? "bg-signal-go text-white border-signal-go" : "bg-signal-stop text-white border-signal-stop";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wide border transition-colors ${
        active ? activeClass : "bg-white text-steelLight border-fogDark"
      }`}
    >
      {label}
    </button>
  );
}

function ResultGate({
  outcome,
  failedComponents,
  onReset,
}: {
  outcome: "cleared" | "blocked";
  failedComponents: string[];
  onReset: () => void;
}) {
  const cleared = outcome === "cleared";
  return (
    <div className="flex flex-col items-center text-center py-10 space-y-5">
      <div
        className={`w-full rounded-md py-10 px-6 ${
          cleared ? "bg-signal-goBg" : "bg-signal-stopBg"
        }`}
      >
        <p
          className={`font-display font-bold text-3xl tracking-tight ${
            cleared ? "text-signal-go" : "text-signal-stop"
          }`}
        >
          {cleared ? "DISPATCH CLEARED" : "DISPATCH BLOCKED"}
        </p>
        <p className="text-sm mt-2 text-steel">
          {cleared
            ? "Checklist logged. This asset is cleared for today's dispatch."
            : `Flagged: ${failedComponents.map((f) => f.replace(/_/g, " ")).join(", ")}. A job card is needed before this asset can go out.`}
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-sm font-medium text-steel underline underline-offset-2"
      >
        Run another checklist
      </button>
    </div>
  );
}
