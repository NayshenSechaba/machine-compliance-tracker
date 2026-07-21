import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoCompliance } from "@/lib/demoData";
import { ComplianceItem } from "@/lib/types";
import VaultClient from "./VaultClient";

async function getCompliance(): Promise<ComplianceItem[]> {
  if (isDemoMode()) return demoCompliance;
  const supabase = createClient();
  const { data } = await supabase.from("compliance_status").select("*").order("days_to_expiry");
  return (data as ComplianceItem[]) ?? [];
}

const ORDER: Record<string, number> = { expired: 0, critical: 1, warning: 2, upcoming: 3, ok: 4 };

export default async function VaultPage() {
  const items = (await getCompliance()).sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const expiredOrCritical = items.filter((i) => i.status === "expired" || i.status === "critical").length;
  const pendingVerification = items.filter((i) => i.verification_status === "pending_verification").length;

  return (
    <div className="space-y-6">
      {isDemoMode() && (
        <div className="rounded-md bg-amber/15 border border-amber/40 px-4 py-2.5 text-sm text-amberDark flex items-center justify-between">
          <span>Demo mode — showing sample compliance & verification data. Connect Supabase to record live document uploads.</span>
          <span className="text-xs font-mono bg-amber-500/20 px-2 py-0.5 rounded font-semibold text-amber-900">
            Interactive Verification Enabled
          </span>
        </div>
      )}

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-steelLight">The Vault</p>
        <h1 className="font-display font-bold text-2xl text-ink">
          Document Expiry, Uploads & Manager Verification
        </h1>
        <p className="text-sm text-steelLight mt-1">
          {pendingVerification > 0
            ? `${pendingVerification} document upload${pendingVerification === 1 ? "" : "s"} pending manager review & verification.`
            : expiredOrCritical > 0
            ? `${expiredOrCritical} compliance item${expiredOrCritical === 1 ? "" : "s"} need urgent attention.`
            : "All certifications and driver licences up to date."}
        </p>
      </div>

      <VaultClient initialItems={items} />

      <div className="rounded-md border border-dashed border-fogDark px-4 py-4 text-xs text-steelLight space-y-1">
        <p className="font-semibold text-steel mb-1">OCR Data Extraction & Manager Sign-off Workflow</p>
        <p>
          Drivers and operators upload certification documents (driver&apos;s licence, vehicle licence disc, PrDP, mining safety pass) via <strong>File Attachment</strong> or <strong>Live Camera Capture</strong>. The client-side OCR engine scans reference numbers and expiry dates automatically. Managers review document previews, compare OCR results, edit if necessary, and click <strong>Verify & Confirm</strong>.
        </p>
      </div>
    </div>
  );
}
