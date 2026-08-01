export type AssetType = "truck" | "trailer" | "excavator" | "tlb" | "drill_rig" | "generator" | "other";
export type AssetStatus = "cleared" | "blocked" | "in_service";

export type VehicleCategory =
  | "motorcycle_code_a"
  | "light_vehicle_code_b"
  | "light_vehicle_trailer_code_eb"
  | "heavy_vehicle_code_c1"
  | "extra_heavy_vehicle_code_c"
  | "heavy_combination_code_ec1"
  | "extra_heavy_combination_code_ec"
  | "earthmoving_heavy_equipment"
  | "mewp_aerial_lift"
  | "attachment_power_tool"
  | "general_heavy_plant";

export type Asset = {
  id: string;
  name: string;
  registration: string | null;
  asset_type: AssetType;
  category: VehicleCategory;
  make_model?: string | null;
  odometer_or_hours: number;
  status: AssetStatus;
  photo_url?: string | null;
  allocated_site?: string | null;
  insurance_status?: string | null;
  last_service?: { date: string; odometer_or_hours: number; description: string } | null;
};

export type Operator = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_url?: string | null;
  user_number?: string | null;
  licence_code?: string | null; // e.g. "EC", "B", "C1", "A"
  medical_expiry?: string | null; // Date string "YYYY-MM-DD"
  allocated_site?: string | null;
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
  operator_avatar?: string | null;
  asset_name: string | null;
  asset_photo?: string | null;
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

export type ChecklistItem = {
  id: string;
  label: string;
  is_safety_critical: boolean;
  expected_type: "yn" | "pmr";
};

export type ChecklistTemplate = {
  category: VehicleCategory;
  version: number;
  type: "pre_use" | "post_use";
  sections: {
    title: string;
    items: ChecklistItem[];
  }[];
};

export type InspectionRecord = {
  id: string;
  asset_id: string;
  asset_name: string;
  operator_id: string;
  operator_name: string;
  odometer_or_hours: number;
  type: "pre_use" | "post_use";
  results: Record<string, "Y" | "N" | "P" | "M" | "R" | "NA">;
  status: "accepted" | "rejected";
  supervisor_override_by?: string | null;
  override_reason?: string | null;
  signature_data: string; // base64 signature image
  created_at: string;
};

export type DefectRecord = {
  id: string;
  event_id?: string | null;
  asset_id: string;
  asset_name?: string;
  item_label: string;
  description: string | null;
  photo_url?: string | null;
  status: "open" | "in_progress" | "resolved";
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
};

export const CHECKLIST_COMPONENTS = [
  { key: "tyres", label: "Tyres & tread" },
  { key: "hydraulic_hoses", label: "Hydraulic hoses" },
  { key: "brakes", label: "Brakes" },
  { key: "lights_indicators", label: "Lights & indicators" },
  { key: "fluid_levels", label: "Fluid levels" },
  { key: "dashboard_warnings", label: "Dashboard warning lights" },
] as const;
