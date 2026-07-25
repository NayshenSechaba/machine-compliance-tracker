import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoAssets, demoCompliance } from "@/lib/demoData";
import { Asset, ComplianceItem } from "@/lib/types";
import ReportsClient from "./ReportsClient";

async function getData(): Promise<{
  assets: Asset[];
  compliance: ComplianceItem[];
}> {
  if (isDemoMode()) {
    return {
      assets: demoAssets,
      compliance: demoCompliance,
    };
  }
  const supabase = createClient();
  const [{ data: assets }, { data: compliance }] = await Promise.all([
    supabase.from("assets").select("*").order("name"),
    supabase.from("compliance_status").select("*").order("days_to_expiry"),
  ]);

  return {
    assets: (assets as Asset[]) ?? [],
    compliance: (compliance as ComplianceItem[]) ?? [],
  };
}

export default async function ReportsPage() {
  const { assets, compliance } = await getData();

  return (
    <ReportsClient
      initialAssets={assets}
      initialCompliance={compliance}
    />
  );
}
