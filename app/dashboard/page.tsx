import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoAssets, demoCompliance, demoOperators } from "@/lib/demoData";
import { Asset, ComplianceItem, Operator, DefectRecord } from "@/lib/types";
import DashboardClient from "./DashboardClient";

async function getData(): Promise<{
  assets: Asset[];
  compliance: ComplianceItem[];
  operators: Operator[];
  defects: DefectRecord[];
}> {
  if (isDemoMode()) {
    return {
      assets: demoAssets,
      compliance: demoCompliance,
      operators: demoOperators,
      defects: [],
    };
  }
  const supabase = createClient();
  const [{ data: assets }, { data: compliance }, { data: operators }, { data: defects }] = await Promise.all([
    supabase.from("assets").select("*").order("name"),
    supabase.from("compliance_status").select("*").order("days_to_expiry"),
    supabase.from("operators").select("*").order("full_name"),
    supabase.from("defects").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    assets: (assets as Asset[]) ?? [],
    compliance: (compliance as ComplianceItem[]) ?? [],
    operators: (operators as Operator[]) ?? [],
    defects: (defects as DefectRecord[]) ?? [],
  };
}

export default async function DashboardPage() {
  const { assets, compliance, operators, defects } = await getData();

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
        initialDefects={defects}
      />
    </div>
  );
}
