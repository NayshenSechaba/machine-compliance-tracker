import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoAssets, demoCompliance, demoOperators } from "@/lib/demoData";
import { Asset, ComplianceItem, Operator } from "@/lib/types";
import DashboardClient from "./DashboardClient";

async function getData(): Promise<{
  assets: Asset[];
  compliance: ComplianceItem[];
  operators: Operator[];
}> {
  if (isDemoMode()) {
    return {
      assets: demoAssets,
      compliance: demoCompliance,
      operators: demoOperators,
    };
  }
  const supabase = createClient();
  const [{ data: assets }, { data: compliance }, { data: operators }] = await Promise.all([
    supabase.from("assets").select("*").order("name"),
    supabase.from("compliance_status").select("*").order("days_to_expiry"),
    supabase.from("operators").select("*").order("full_name"),
  ]);

  return {
    assets: (assets as Asset[]) ?? [],
    compliance: (compliance as ComplianceItem[]) ?? [],
    operators: (operators as Operator[]) ?? [],
  };
}

export default async function DashboardPage() {
  const { assets, compliance, operators } = await getData();

  return (
    <div className="space-y-6">
      {isDemoMode() && (
        <div className="rounded-md bg-amber/15 border border-amber/40 px-4 py-2.5 text-sm text-amberDark">
          Demo mode — showing local persistent data. Connect Supabase to write changes to DB.
        </div>
      )}
      <DashboardClient
        initialAssets={assets}
        initialCompliance={compliance}
        initialOperators={operators}
      />
    </div>
  );
}
