import { createClient } from "./client";
import { Asset, Operator, InspectionRecord, DefectRecord, ComplianceItem } from "../types";
import { AuditEntry } from "../auditLog";

// ---------------------------------------------------------------------------
// ASSETS
// ---------------------------------------------------------------------------
export async function fetchAssets(): Promise<Asset[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").select("*").order("name");
  if (error) {
    console.error("Error fetching assets:", error);
    return [];
  }
  return data as Asset[];
}

export async function createAsset(asset: Omit<Asset, "id">): Promise<Asset | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").insert(asset).select().single();
  if (error) {
    console.error("Error creating asset:", error);
    return null;
  }
  return data as Asset;
}

export async function updateAssetStatus(assetId: string, status: "in_service" | "blocked"): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("assets").update({ status }).eq("id", assetId);
  if (error) {
    console.error("Error updating asset status:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// OPERATORS
// ---------------------------------------------------------------------------
export async function fetchOperators(): Promise<Operator[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("operators").select("*").order("full_name");
  if (error) {
    console.error("Error fetching operators:", error);
    return [];
  }
  return data as Operator[];
}

export async function createOperator(operator: Omit<Operator, "id">): Promise<Operator | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("operators").insert(operator).select().single();
  if (error) {
    console.error("Error creating operator:", error);
    return null;
  }
  return data as Operator;
}

// ---------------------------------------------------------------------------
// INSPECTIONS & EVENTS
// ---------------------------------------------------------------------------
// Since schema uses 'events' table for inspections
export async function fetchInspections(): Promise<InspectionRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
  return data as InspectionRecord[];
}

export async function createInspection(inspection: Omit<InspectionRecord, "id" | "created_at">): Promise<InspectionRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").insert(inspection).select().single();
  if (error) {
    console.error("Error creating inspection:", error);
    return null;
  }
  return data as InspectionRecord;
}

// ---------------------------------------------------------------------------
// DEFECTS
// ---------------------------------------------------------------------------
export async function fetchDefects(): Promise<DefectRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("defects").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching defects:", error);
    return [];
  }
  return data as DefectRecord[];
}

export async function createDefects(defects: Omit<DefectRecord, "id" | "created_at">[]): Promise<DefectRecord[]> {
  if (defects.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("defects").insert(defects).select();
  if (error) {
    console.error("Error creating defects:", error);
    return [];
  }
  return data as DefectRecord[];
}

export async function resolveDefect(defectId: string, resolvedBy: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("defects").update({ 
    status: "resolved", 
    resolved_by: resolvedBy, 
    resolved_at: new Date().toISOString() 
  }).eq("id", defectId);
  if (error) {
    console.error("Error resolving defect:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// COMPLIANCE
// ---------------------------------------------------------------------------
export async function fetchComplianceItems(): Promise<ComplianceItem[]> {
  const supabase = createClient();
  // Using the compliance_status view
  const { data, error } = await supabase.from("compliance_status").select("*").order("days_to_expiry");
  if (error) {
    console.error("Error fetching compliance items:", error);
    return [];
  }
  return data as ComplianceItem[];
}

export async function createComplianceItem(item: Omit<ComplianceItem, "id" | "days_to_expiry" | "status" | "verification_status">): Promise<boolean> {
  const supabase = createClient();
  // We insert into compliance_items, not the view
  const { error } = await supabase.from("compliance_items").insert({
    operator_id: (item as any).operator_id || null, // Assuming you add this to type if needed
    asset_id: (item as any).asset_id || null,
    item_type: item.item_type,
    reference_number: item.reference_number,
    expiry_date: item.expiry_date,
    document_name: item.document_name,
    document_url: item.document_url,
  });
  if (error) {
    console.error("Error creating compliance item:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------------------
export async function insertAuditLog(entry: Omit<AuditEntry, "id" | "created_at">): Promise<boolean> {
  const supabase = createClient();
  // Assumes audit_log table exists
  const { error } = await supabase.from("audit_log").insert(entry);
  if (error) {
    // We don't block the UI on audit log errors, but we log them
    console.error("Error writing to audit log:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------
export async function uploadSignature(base64Data: string, fileName: string): Promise<string | null> {
  const supabase = createClient();
  
  try {
    // Convert base64 to Blob
    const base64Parts = base64Data.split(',');
    const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const binaryStr = atob(base64Parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    const { data, error } = await supabase.storage
      .from('ops-media')
      .upload(`signatures/${fileName}`, blob, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ops-media')
      .getPublicUrl(data.path);
      
    return publicUrl;
  } catch (err) {
    console.error("Error uploading signature:", err);
    return null;
  }
}
