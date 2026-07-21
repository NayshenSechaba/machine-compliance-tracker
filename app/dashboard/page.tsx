import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoAssets, demoCompliance } from "@/lib/demoData";
import { Asset, ComplianceItem } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

async function getData(): Promise<{ assets: Asset[]; compliance: ComplianceItem[] }> {
  if (isDemoMode()) {
    return { assets: demoAssets, compliance: demoCompliance };
  }
  const supabase = createClient();
  const [{ data: assets }, { data: compliance }] = await Promise.all([
    supabase.from("assets").select("*").order("name"),
    supabase.from("compliance_status").select("*").order("days_to_expiry"),
  ]);
  return { assets: (assets as Asset[]) ?? [], compliance: (compliance as ComplianceItem[]) ?? [] };
}

export default async function DashboardPage() {
  const { assets, compliance } = await getData();
  const blocked = assets.filter((a) => a.status === "blocked");
  const urgent = compliance.filter((c) => c.status === "expired" || c.status === "critical");

  return (
    <div className="space-y-6">
      {isDemoMode() && (
        <div className="rounded-md bg-amber/15 border border-amber/40 px-4 py-2.5 text-sm text-amberDark">
          Demo mode — showing sample data. Connect Supabase (see README) to see your own fleet.
        </div>
      )}

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-steelLight">Today</p>
        <h1 className="font-display font-bold text-2xl text-ink">Fleet status</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Assets tracked" value={assets.length} />
        <SummaryCard label="Blocked from dispatch" value={blocked.length} tone={blocked.length ? "stop" : "go"} />
        <SummaryCard label="Compliance items" value={compliance.length} />
        <SummaryCard label="Need action now" value={urgent.length} tone={urgent.length ? "stop" : "go"} />
      </div>

      {urgent.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-steelLight mb-2">
            Needs action
          </h2>
          <div className="space-y-2">
            {urgent.map((c) => (
              <Link
                key={c.id}
                href="/vault"
                className="flex items-center justify-between bg-white border border-fogDark rounded-md px-4 py-3 hover:border-amber transition-colors"
              >
                <div>
                  <p className="font-medium text-sm text-ink">
                    {(c.operator_name ?? c.asset_name) || "Unknown"}
                  </p>
                  <p className="text-xs text-steelLight font-mono">
                    {c.item_type.replace(/_/g, " ")} · {c.reference_number}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-steelLight mb-2">
          Assets
        </h2>
        <div className="space-y-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-white border border-fogDark rounded-md px-4 py-3 gap-3"
            >
              <div className="flex items-center gap-3">
                {a.photo_url && (
                  <img
                    src={a.photo_url}
                    alt={a.name}
                    className="w-10 h-10 rounded object-cover border border-fogDark shrink-0"
                  />
                )}
                <div>
                  <p className="font-medium text-sm text-ink">{a.name}</p>
                  <p className="text-xs text-steelLight font-mono">
                    {a.registration} · {a.odometer_or_hours.toLocaleString()}{" "}
                    {a.asset_type === "truck" || a.asset_type === "trailer" ? "km" : "hrs"}
                  </p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/checklist"
        className="block text-center bg-ink text-white font-medium rounded-md py-3.5 hover:bg-steel transition-colors"
      >
        Start a pre-start checklist →
      </Link>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "go" | "stop";
}) {
  const toneClass =
    tone === "stop" ? "text-signal-stop" : tone === "go" ? "text-signal-go" : "text-ink";
  return (
    <div className="bg-white border border-fogDark rounded-md px-4 py-3">
      <p className={`font-display font-bold text-3xl font-tabular ${toneClass}`}>{value}</p>
      <p className="text-xs text-steelLight mt-0.5">{label}</p>
    </div>
  );
}
