import { Asset, ComplianceItem, Operator } from "./types";

export const isDemoMode = () => false;

export const demoAssets: Asset[] = [
  {
    id: "a1",
    name: "Volvo FH16 — Fleet 04",
    registration: "ND 45 GP",
    asset_type: "truck",
    category: "extra_heavy_combination_code_ec",
    make_model: "Volvo FH16",
    odometer_or_hours: 182340,
    status: "in_service",
    photo_url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=350&q=80",
    allocated_site: "Secunda Mine",
    insurance_status: "Active (Mutual & Federal - Pol #MF-9823)",
    last_service: {
      date: "2026-05-12",
      odometer_or_hours: 180000,
      description: "Major 180k service. Replaced primary air filters, front brake linings, and engine oil.",
    },
  },
  {
    id: "a2",
    name: "CAT 336D Excavator",
    registration: "RIG-07",
    asset_type: "excavator",
    category: "earthmoving_heavy_equipment",
    make_model: "CAT 336D",
    odometer_or_hours: 6120,
    status: "in_service",
    photo_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=350&q=80",
    allocated_site: "Kusile Power Station",
    insurance_status: "Active (Hollard Specialised - Pol #HL-2311)",
    last_service: {
      date: "2026-06-01",
      odometer_or_hours: 6000,
      description: "Hydraulic oil swap, replacement of main bucket pins and track tensioner adjustment.",
    },
  },
  {
    id: "a3",
    name: "Isuzu FTR — Fleet 11",
    registration: "ND 88 HP",
    asset_type: "truck",
    category: "heavy_vehicle_code_c1",
    make_model: "Isuzu FTR",
    odometer_or_hours: 94210,
    status: "blocked",
    photo_url: "https://images.unsplash.com/photo-1516576882236-0568019689e4?auto=format&fit=crop&w=350&q=80",
    allocated_site: "Saldanha Port Yard",
    insurance_status: "Active (Outsurance Commercial - Pol #OUT-8721)",
    last_service: {
      date: "2026-04-18",
      odometer_or_hours: 90000,
      description: "Standard service, gearbox fluid top-up, rear tyres rotated.",
    },
  },
];

export const demoOperators: Operator[] = [
  { id: "o1", full_name: "Sipho Ndlovu", phone: "+27 82 123 4567", role: "driver", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", user_number: "01", licence_code: "C1", medical_expiry: "2027-12-01", allocated_site: "Secunda Mine" },
  { id: "o2", full_name: "Ben van der Merwe", phone: "+27 82 765 4321", role: "driver", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", user_number: "02", licence_code: "EC", medical_expiry: "2027-08-15", allocated_site: "Kusile Power Station" },
  { id: "o3", full_name: "Thandi Khumalo", phone: "+27 82 999 8888", role: "site_manager", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", user_number: "03", licence_code: "B", medical_expiry: "2028-02-10", allocated_site: "Yard HQ" },
];

const today = new Date();
const addDays = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};
const statusFor = (days: number) =>
  days < 0 ? "expired" : days <= 7 ? "critical" : days <= 30 ? "warning" : days <= 60 ? "upcoming" : "ok";

export const demoCompliance: ComplianceItem[] = [
  {
    id: "c1",
    item_type: "prdp",
    reference_number: "PRDP-88213",
    expiry_date: addDays(5),
    operator_name: "Sipho Ndlovu",
    operator_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    asset_name: null,
    days_to_expiry: 5,
    status: statusFor(5) as any,
    document_name: "sipho_prdp_scan.jpg",
    verification_status: "pending_verification",
    ocr_data: {
      reference_number: "PRDP-88213",
      expiry_date: addDays(5),
      holder_name: "Sipho Ndlovu",
      document_type: "Professional Driving Permit (PrDP)",
      confidence: 94,
      raw_text: "REPUBLIC OF SOUTH AFRICA\nPROFESSIONAL DRIVING PERMIT\nHOLDER: SIPHO NDLOVU\nREF: PRDP-88213\nEXPIRY: " + addDays(5),
    },
  },
  {
    id: "c2",
    item_type: "roadworthy_cert",
    reference_number: "RWC-9981",
    expiry_date: addDays(-3),
    operator_name: null,
    asset_name: "Isuzu FTR — Fleet 11",
    asset_photo: "https://images.unsplash.com/photo-1516576882236-0568019689e4?auto=format&fit=crop&w=350&q=80",
    days_to_expiry: -3,
    status: statusFor(-3) as any,
    document_name: "roadworthy_isuzu_fleet11.pdf",
    verification_status: "rejected",
    rejection_reason: "Scanned certificate scan is unreadable/blurry near expiry stamp.",
    ocr_data: {
      reference_number: "RWC-9981",
      expiry_date: addDays(-3),
      holder_name: "Isuzu FTR (ND 88 HP)",
      document_type: "Roadworthy Certificate",
      confidence: 62,
      raw_text: "CERTIFICATE OF ROADWORTHINESS\nVEHICLE: ISUZU FTR REG: ND 88 HP\nCERT NO: RWC-9981",
    },
  },
  {
    id: "c3",
    item_type: "vehicle_licence",
    reference_number: "VL-2201",
    expiry_date: addDays(20),
    operator_name: null,
    asset_name: "Volvo FH16 — Fleet 04",
    asset_photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=350&q=80",
    days_to_expiry: 20,
    status: statusFor(20) as any,
    document_name: "volvo_licence_disc.jpg",
    verification_status: "verified",
    verified_by: "Thandi Khumalo (Site Manager)",
    verified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    ocr_data: {
      reference_number: "VL-2201",
      expiry_date: addDays(20),
      holder_name: "Volvo FH16 (ND 45 GP)",
      document_type: "Motor Vehicle Licence Disc",
      confidence: 98,
      raw_text: "LICENCE DISC / CERTIFICATE OF REGISTRATION\nREG NO: ND 45 GP\nREF: VL-2201\nEXPIRY: " + addDays(20),
    },
  },
  {
    id: "c4",
    item_type: "drivers_licence",
    reference_number: "DL-40213",
    expiry_date: addDays(45),
    operator_name: "Ben van der Merwe",
    operator_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    asset_name: null,
    days_to_expiry: 45,
    status: statusFor(45) as any,
    verification_status: "pending_upload",
  },
  {
    id: "c5",
    item_type: "mining_safety_cert",
    reference_number: "MSC-1187",
    expiry_date: addDays(120),
    operator_name: "Thandi Khumalo",
    operator_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    asset_name: null,
    days_to_expiry: 120,
    status: statusFor(120) as any,
    document_name: "thandi_mining_safety.png",
    verification_status: "verified",
    verified_by: "Compliance Officer",
    verified_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    ocr_data: {
      reference_number: "MSC-1187",
      expiry_date: addDays(120),
      holder_name: "Thandi Khumalo",
      document_type: "Mining Safety Pass",
      confidence: 96,
      raw_text: "MINING SAFETY CLEARANCE CERTIFICATE\nNAME: THANDI KHUMALO\nID: MSC-1187",
    },
  },
];
