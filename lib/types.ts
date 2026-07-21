export type AssetType = "truck" | "trailer" | "excavator" | "tlb" | "drill_rig" | "generator" | "other";
export type AssetStatus = "cleared" | "blocked" | "in_service";

export type Asset = {
  id: string;
  name: string;
  registration: string | null;
  asset_type: AssetType;
  odometer_or_hours: number;
  status: AssetStatus;
};

export type Operator = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
};

export type ComplianceStatus = "expired" | "critical" | "warning" | "upcoming" | "ok";
export type VerificationStatus = "pending_upload" | "pending_verification" | "verified" | "rejected";

export type OcrData = {
  reference_number?: string;
  expiry_date?: string;
  holder_name?: string;
  document_type?: string;
  raw_text?: string;
  confidence?: number;
};

export type ComplianceItem = {
  id: string;
  item_type: string;
  reference_number: string | null;
  expiry_date: string;
  operator_name: string | null;
  asset_name: string | null;
  days_to_expiry: number;
  status: ComplianceStatus;
  document_url?: string | null;
  document_name?: string | null;
  verification_status: VerificationStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  ocr_data?: OcrData | null;
};

export const CHECKLIST_COMPONENTS = [
  { key: "tyres", label: "Tyres & tread" },
  { key: "hydraulic_hoses", label: "Hydraulic hoses" },
  { key: "brakes", label: "Brakes" },
  { key: "lights_indicators", label: "Lights & indicators" },
  { key: "fluid_levels", label: "Fluid levels" },
  { key: "dashboard_warnings", label: "Dashboard warning lights" },
] as const;
