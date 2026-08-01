"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { isDemoMode, demoAssets, demoOperators } from "@/lib/demoData";
import { checklistTemplates } from "@/lib/checklistTemplates";
import { Asset, Operator, ComplianceItem, InspectionRecord, DefectRecord, ChecklistItem } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";

// Licence validation mapping
const checkLicenceValid = (operatorLicence: string | null | undefined, requiredCategory: string): { valid: boolean; reason?: string } => {
  if (!operatorLicence) return { valid: false, reason: "No licence class recorded on driver profile." };

  const op = operatorLicence.toUpperCase();

  // HE ticket for earthmoving
  if (requiredCategory === "earthmoving_heavy_equipment") {
    return op === "HE" ? { valid: true } : { valid: false, reason: "Requires Heavy Equipment (HE) Operator Ticket." };
  }
  // MEWP ticket for scissor lifts
  if (requiredCategory === "mewp_aerial_lift") {
    return op === "MEWP" ? { valid: true } : { valid: false, reason: "Requires Mobile Elevated Work Platform (MEWP) Operator Card." };
  }

  // Motorcycle Code A
  if (requiredCategory === "motorcycle_code_a") {
    return op === "A" ? { valid: true } : { valid: false, reason: "Requires Motorcycle Code A driving licence." };
  }

  // Bakkie Code B
  if (requiredCategory === "light_vehicle_code_b") {
    return ["B", "EB", "C1", "C", "EC1", "EC"].includes(op)
      ? { valid: true }
      : { valid: false, reason: "Requires Code B (or higher) driving licence." };
  }

  // Code EB (Bakkie + trailer)
  if (requiredCategory === "light_vehicle_trailer_code_eb") {
    return ["EB", "EC1", "EC"].includes(op)
      ? { valid: true }
      : { valid: false, reason: "Requires Code EB (or higher combination) driving licence." };
  }

  // Code C1 (Rigid heavy truck <= 16T)
  if (requiredCategory === "heavy_vehicle_code_c1") {
    return ["C1", "C", "EC1", "EC"].includes(op)
      ? { valid: true }
      : { valid: false, reason: "Requires Code C1 (or higher rigid) driving licence." };
  }

  // Code C (Rigid heavy truck > 16T)
  if (requiredCategory === "extra_heavy_vehicle_code_c") {
    return ["C", "EC"].includes(op)
      ? { valid: true }
      : { valid: false, reason: "Requires Code C (or EC combination) driving licence." };
  }

  // Code EC1 combination
  if (requiredCategory === "heavy_combination_code_ec1") {
    return ["EC1", "EC"].includes(op)
      ? { valid: true }
      : { valid: false, reason: "Requires Code EC1 (or EC extra heavy) combination licence." };
  }

  // Code EC combination (Articulated superlink)
  if (requiredCategory === "extra_heavy_combination_code_ec") {
    return op === "EC"
      ? { valid: true }
      : { valid: false, reason: "Requires Code EC Extra Heavy Combination driving licence." };
  }

  return { valid: true }; // Support tools, plant fallback
};

export default function ChecklistPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(demoAssets);
  const [operators, setOperators] = useState<Operator[]>(demoOperators);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [inspectionType, setInspectionType] = useState<"pre_use" | "post_use">("pre_use");
  const [odometer, setOdometer] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  // Checklist values
  const [answers, setAnswers] = useState<Record<string, "Y" | "N" | "P" | "M" | "R" | "NA">>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({}); // Tied to specific line items

  // Supervisor override
  const [supervisorPin, setSupervisorPin] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [isOverrideApproved, setIsOverrideApproved] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Sync Queue Simulation
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSimulateOffline, setIsSimulateOffline] = useState(false);

  // Checklist Outcome state
  const [finalRecord, setFinalRecord] = useState<InspectionRecord | null>(null);
  const [generatedDefects, setGeneratedDefects] = useState<DefectRecord[]>([]);

  // Load custom assets & operators
  useEffect(() => {
    const fetchLiveData = async () => {
      const { data: assetsData } = await supabase.from("assets").select("*");
      if (assetsData && assetsData.length > 0) setAssets(assetsData as Asset[]);
      
      const { data: operatorsData } = await supabase.from("operators").select("*");
      if (operatorsData && operatorsData.length > 0) setOperators(operatorsData as Operator[]);
    };
    fetchLiveData();
  }, []);

  // Set default selection
  useEffect(() => {
    if (assets.length && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
    if (operators.length && !selectedOperatorId) {
      setSelectedOperatorId(operators[0].id);
    }
  }, [assets, operators, selectedAssetId, selectedOperatorId]);

  // Selected details
  const selectedAsset = useMemo(() => assets.find((a) => a.id === selectedAssetId), [assets, selectedAssetId]);
  const selectedOperator = useMemo(() => operators.find((o) => o.id === selectedOperatorId), [operators, selectedOperatorId]);

  // Licence & Medical validations
  const licenceValidation = useMemo(() => {
    if (!selectedAsset || !selectedOperator) return { valid: true };
    return checkLicenceValid(selectedOperator.licence_code, selectedAsset.category);
  }, [selectedAsset, selectedOperator]);

  const medicalValidation = useMemo(() => {
    if (!selectedOperator) return { valid: true };
    if (!selectedOperator.medical_expiry) {
      // Require medical certification only for heavy rigid/combination / HE / MEWP
      const isHeavy = ["heavy_vehicle_code_c1", "extra_heavy_vehicle_code_c", "heavy_combination_code_ec1", "extra_heavy_combination_code_ec", "earthmoving_heavy_equipment", "mewp_aerial_lift"].includes(selectedAsset?.category || "");
      return isHeavy ? { valid: false, reason: "Requires active medical certificate." } : { valid: true };
    }

    const exp = new Date(selectedOperator.medical_expiry);
    const today = new Date();
    return exp.getTime() < today.getTime()
      ? { valid: false, reason: `Medical Certificate expired on ${selectedOperator.medical_expiry}` }
      : { valid: true };
  }, [selectedOperator, selectedAsset]);

  const isOperatorBlocked = !licenceValidation.valid || !medicalValidation.valid;

  // Retrieve checklist template
  const template = useMemo(() => {
    if (!selectedAsset) return null;
    return checklistTemplates[selectedAsset.category] || checklistTemplates.general_heavy_plant;
  }, [selectedAsset]);

  // For post-use, filter down to a subset of checks (exclude documentation/spares, keep safety/exterior/brakes)
  const filteredTemplateSections = useMemo(() => {
    if (!template) return [];
    if (inspectionType === "pre_use") return template.sections;

    // Post-Use filters out static documentation & spare parts checking
    return template.sections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => {
          const lbl = item.label.toLowerCase();
          return !lbl.includes("doc_") && !lbl.includes("spare") && !lbl.includes("triangle") && !lbl.includes("licence disc");
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [template, inspectionType]);

  // Flat array of current items
  const currentItems = useMemo(() => {
    return filteredTemplateSections.flatMap((s) => s.items);
  }, [filteredTemplateSections]);

  // Check if all items are checked
  const allAnswered = useMemo(() => {
    return currentItems.every((item) => {
      const ans = answers[item.id];
      if (ans === undefined) return false;
      if (ans === "N" || ans === "R" || ans === "M") {
        return !!photoUrls[item.id] && !!remarks[item.id];
      }
      return true;
    });
  }, [currentItems, answers, photoUrls, remarks]);

  // Determine if safety-critical failure exists
  const safetyCriticalFailures = useMemo(() => {
    return currentItems.filter((item) => {
      const val = answers[item.id];
      const isFailed = val === "N" || val === "R";
      return item.is_safety_critical && isFailed;
    });
  }, [currentItems, answers]);

  const isDispatchBlocked = safetyCriticalFailures.length > 0 && !isOverrideApproved;

  // Handle answers update
  const setAnswer = (id: string, value: "Y" | "N" | "P" | "M" | "R" | "NA") => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleRemarkChange = (id: string, text: string) => {
    setRemarks((prev) => ({ ...prev, [id]: text }));
  };

  const handlePhotoUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(prev => ({ ...prev, [itemId]: true }));
    const fileName = `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage.from("ops-media").upload(fileName, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("ops-media").getPublicUrl(fileName);
      setPhotoUrls(prev => ({ ...prev, [itemId]: urlData.publicUrl }));
    } else {
      alert("Failed to upload photo. Please try again.");
    }
    setUploadingPhotos(prev => ({ ...prev, [itemId]: false }));
  };

  // Supervisor override PIN submit
  const handleVerifyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorPin === "1234" && supervisorName.trim()) {
      setIsOverrideApproved(true);
      setOverrideError(null);
    } else {
      setOverrideError("Invalid Supervisor Authorization PIN.");
    }
  };

  // Signature Pad Logic
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Sync Offline Queue
  const triggerSyncQueue = () => {
    if (!offlineQueue.length) return;

    // Load completed inspections
    const storedInspections = localStorage.getItem("ops_gate_inspections");
    let currentInspections = storedInspections ? JSON.parse(storedInspections) : [];
    
    // Load defects
    const storedDefects = localStorage.getItem("ops_gate_defects");
    let currentDefects = storedDefects ? JSON.parse(storedDefects) : [];

    offlineQueue.forEach((queued) => {
      currentInspections.push(queued.record);
      currentDefects.push(...queued.defects);
    });

    localStorage.setItem("ops_gate_inspections", JSON.stringify(currentInspections));
    localStorage.setItem("ops_gate_defects", JSON.stringify(currentDefects));
    localStorage.removeItem("ops_gate_offline_queue");
    setOfflineQueue([]);
    alert("Offline queue synchronized successfully with central datastore!");
  };

  // Submit Inspection Form
  const handleFinalSubmit = async () => {
    if (!selectedAsset || !selectedOperator) return;

    // Get Signature data URL
    const signatureUrl = canvasRef.current ? canvasRef.current.toDataURL() : "";

    const newRecord: InspectionRecord = {
      id: `insp-${Date.now()}`,
      asset_id: selectedAsset.id,
      asset_name: selectedAsset.name,
      operator_id: selectedOperator.id,
      operator_name: selectedOperator.full_name,
      odometer_or_hours: odometer ? Number(odometer) : selectedAsset.odometer_or_hours,
      type: inspectionType,
      results: answers,
      status: isDispatchBlocked ? "rejected" : "accepted",
      supervisor_override_by: isOverrideApproved ? supervisorName : null,
      override_reason: isOverrideApproved ? overrideReason : null,
      signature_data: signatureUrl,
      created_at: new Date().toISOString(),
    };

    // Auto-generate defect records for failed items (N or R or M)
    const defects: DefectRecord[] = [];
    currentItems.forEach((item) => {
      const val = answers[item.id];
      if (val === "N" || val === "R" || val === "M") {
        defects.push({
          id: `defect-${Date.now()}-${item.id}`,
          event_id: newRecord.id,
          asset_id: selectedAsset.id,
          asset_name: selectedAsset.name,
          
          item_label: item.label,
          description: remarks[item.id] || "No description recorded.",
          status: "open",
          created_at: new Date().toISOString(),
        });
      }
    });

    // Check if offline mode simulated
    // Save to Supabase DB instead of localStorage
    const eventPayload = {
      asset_id: selectedAsset.id,
      operator_id: selectedOperator.id,
      event_type: "pre_start_checklist",
      checklist_result: isDispatchBlocked ? "fail" : "pass",
      odometer_or_hours: newRecord.odometer_or_hours,
      notes: overrideReason,
      photo_urls: Object.values(photoUrls),
      flagged_components: defects.map(d => d.item_label)
    };

    const { data: eventData, error: eventError } = await supabase.from("events").insert(eventPayload).select().single();

    if (eventData) {
      if (defects.length > 0) {
        const defectInserts = defects.map(d => ({
          event_id: eventData.id,
          asset_id: selectedAsset.id,
          item_label: d.item_label,
          description: d.description,
          photo_url: photoUrls[d.item_label],
          status: "open"
        }));
        await supabase.from("defects").insert(defectInserts);
      }

      if (newRecord.status === "rejected") {
        await supabase.from("assets").update({ status: "blocked" }).eq("id", selectedAsset.id);
      } else {
        await supabase.from("assets").update({ status: "in_service" }).eq("id", selectedAsset.id);
      }
    } else {
      console.error("Failed to insert event", eventError);
    }

    setFinalRecord(newRecord);
    setGeneratedDefects(defects);
    setStep(3);

    // Audit trail: inspection submission
    logAuditEvent({
      entity_type: "inspection",
      entity_id: newRecord.id,
      entity_name: `${newRecord.type === "pre_use" ? "Pre-Use" : "Post-Use"} — ${selectedAsset.name}`,
      action: "inspection_submitted",
      actor_name: user?.fullName || selectedOperator.full_name,
      actor_role: user?.role || "driver",
      details: {
        asset_name: selectedAsset.name,
        operator_name: selectedOperator.full_name,
        status: newRecord.status,
        defect_count: defects.length,
        override: newRecord.supervisor_override_by || null,
      },
    });

    // Audit trail: each defect created
    defects.forEach((defect) => {
      logAuditEvent({
        entity_type: "defect",
        entity_id: defect.id,
        entity_name: defect.item_label,
        action: "defect_created",
        actor_name: user?.fullName || selectedOperator.full_name,
        actor_role: user?.role || "driver",
        details: {
          asset_name: selectedAsset.name,
          description: defect.description,
        },
      });
    });
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({});
    setRemarks({});
    setSupervisorPin("");
    setSupervisorName("");
    setIsOverrideApproved(false);
    setOverrideReason("");
    setOdometer("");
    setFinalRecord(null);
    setGeneratedDefects([]);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Offline simulation indicator bar */}
      <div className="flex items-center justify-between bg-slate-100 border border-fogDark rounded-xl p-3 text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isSimulateOffline ? "bg-amber" : "bg-emerald-500"}`} />
          <span className="font-semibold text-ink">
            {isSimulateOffline ? "Working Offline" : "Connected Live"}
          </span>
          {offlineQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 font-mono text-[10px] font-bold">
              {offlineQueue.length} queued
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulateOffline(!isSimulateOffline)}
            className="text-[10px] uppercase font-bold text-steel hover:underline font-mono"
          >
            {isSimulateOffline ? "Go Online" : "Simulate Offline"}
          </button>
          {offlineQueue.length > 0 && (
            <button
              onClick={triggerSyncQueue}
              className="text-[10px] uppercase font-bold text-amber hover:underline font-mono border border-amber/30 px-2 py-1 rounded bg-amber/5"
            >
              Sync Queue
            </button>
          )}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white border border-fogDark rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber">Step 1 of 2</span>
            <h2 className="font-display font-bold text-2xl text-ink mt-1">Select Asset & Operator</h2>
            <p className="text-xs text-steelLight">
              Provide operator credentials and choose the vehicle/equipment for verification.
            </p>
          </div>

          <div className="space-y-4">
            {/* Operator Select */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Assigned Operator</label>
              <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="w-full border border-fogDark rounded-lg px-3.5 py-2.5 bg-white text-xs text-ink"
              >
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} ({o.role} · Code {o.licence_code || "None"})
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Select */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Target Fleet Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full border border-fogDark rounded-lg px-3.5 py-2.5 bg-white text-xs text-ink"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.registration || "No Tag"} · {a.category.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            {/* Visual preview panel */}
            {selectedAsset && selectedOperator && (
              <div className="bg-slate-50 border border-fogDark rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedAsset.photo_url && (
                    <img
                      src={selectedAsset.photo_url}
                      alt={selectedAsset.name}
                      className="w-14 h-11 rounded object-cover border border-fogDark shrink-0 shadow-sm"
                    />
                  )}
                  <div>
                    <p className="text-[9px] font-mono text-steelLight uppercase tracking-wider">Asset</p>
                    <p className="text-xs font-bold text-ink">{selectedAsset.name}</p>
                    <p className="text-[10px] text-steel font-mono capitalize">{selectedAsset.category.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-[9px] font-mono text-steelLight uppercase tracking-wider">Operator</p>
                    <p className="text-xs font-bold text-ink">{selectedOperator.full_name}</p>
                    <p className="text-[10px] text-steel font-mono">Licence: Code {selectedOperator.licence_code || "N/A"}</p>
                  </div>
                  {selectedOperator.avatar_url && (
                    <img
                      src={selectedOperator.avatar_url}
                      alt={selectedOperator.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-fogDark shrink-0 shadow-sm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Validation Feedback Boxes */}
            {selectedAsset && selectedOperator && (
              <div className="space-y-2">
                {/* Licence check */}
                {!licenceValidation.valid ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold uppercase tracking-wide">Invalid Licence Class</p>
                      <p className="text-slate-600 mt-0.5">{licenceValidation.reason}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex gap-2">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                    </svg>
                    <span>Operator licence code <strong>{selectedOperator.licence_code}</strong> meets compliance class for this asset.</span>
                  </div>
                )}

                {/* Medical expiry check */}
                {!medicalValidation.valid ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-bold uppercase tracking-wide">Medical Clearance Expired / Missing</p>
                      <p className="text-slate-600 mt-0.5">{medicalValidation.reason}</p>
                    </div>
                  </div>
                ) : (
                  selectedOperator.medical_expiry && (
                    <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex gap-2">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                      </svg>
                      <span>Medical certificate clearance valid until {selectedOperator.medical_expiry}.</span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Inspection Type Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Inspection Window</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInspectionType("pre_use")}
                  className={`py-3 rounded-lg border text-xs font-bold transition-all ${
                    inspectionType === "pre_use"
                      ? "bg-steelDark text-white border-steelDark"
                      : "bg-white text-steel border-fogDark hover:bg-slate-50"
                  }`}
                >
                  🌅 Pre-Use / Start of Shift
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType("post_use")}
                  className={`py-3 rounded-lg border text-xs font-bold transition-all ${
                    inspectionType === "post_use"
                      ? "bg-steelDark text-white border-steelDark"
                      : "bg-white text-steel border-fogDark hover:bg-slate-50"
                  }`}
                >
                  🌇 Post-Use / End of Shift
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={isOperatorBlocked}
            className="w-full py-4 bg-ink disabled:bg-slate-200 disabled:text-slate-400 hover:bg-steelDark text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98"
          >
            {isOperatorBlocked ? "Resolve Operator Blocks First" : "Start Inspection Checklist →"}
          </button>
        </div>
      )}

      {step === 2 && selectedAsset && (
        <div className="bg-white border border-fogDark rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber">Step 2 of 2</span>
              <h2 className="font-display font-bold text-xl text-ink mt-0.5">
                {inspectionType === "pre_use" ? "🌅 Pre-Use" : "🌇 Post-Use"} Inspection Form
              </h2>
              <p className="text-xs text-steelLight capitalize mt-0.5">
                Asset: {selectedAsset.name} · Code: {selectedAsset.category.replace(/_/g, " ")}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-amber font-mono hover:underline font-bold"
            >
              Back to Start
            </button>
          </div>

          {/* Render Checklist Items Grouped by Section */}
          <div className="space-y-6">
            {filteredTemplateSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 bg-slate-50 p-2 rounded border border-fogDark">
                  {sec.title}
                </h4>

                <div className="divide-y divide-slate-100">
                  {sec.items.map((item) => {
                    const ans = answers[item.id];
                    const hasFailed = ans === "N" || ans === "R";

                    return (
                      <div key={item.id} className="py-3.5 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-ink leading-relaxed">
                            {item.label}
                            {item.is_safety_critical && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[8px] bg-rose-100 text-rose-800 border border-rose-200 font-mono font-bold uppercase">
                                Safety Critical
                              </span>
                            )}
                          </span>

                          {/* Action Radio Group Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {item.expected_type === "yn" ? (
                              <>
                                <CheckButton
                                  active={ans === "Y"}
                                  label="Yes / Pass"
                                  onClick={() => setAnswer(item.id, "Y")}
                                  tone="go"
                                />
                                <CheckButton
                                  active={ans === "N"}
                                  label="No / Fail"
                                  onClick={() => setAnswer(item.id, "N")}
                                  tone="stop"
                                />
                              </>
                            ) : (
                              <>
                                <CheckButton
                                  active={ans === "P"}
                                  label="P (Pass)"
                                  onClick={() => setAnswer(item.id, "P")}
                                  tone="go"
                                />
                                <CheckButton
                                  active={ans === "M"}
                                  label="M (Maint)"
                                  onClick={() => setAnswer(item.id, "M")}
                                  tone="warn"
                                />
                                <CheckButton
                                  active={ans === "R"}
                                  label="R (Reject)"
                                  onClick={() => setAnswer(item.id, "R")}
                                  tone="stop"
                                />
                              </>
                            )}
                            <CheckButton
                              active={ans === "NA"}
                              label="N/A"
                              onClick={() => setAnswer(item.id, "NA")}
                              tone="neutral"
                            />
                          </div>
                        </div>

                        {/* Defect Remarks and Photo tied directly to line number */}
                        {(ans === "N" || ans === "R" || ans === "M") && (
                          <div className="animate-slide-down space-y-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                            <input
                              type="text"
                              required
                              value={remarks[item.id] || ""}
                              onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                              placeholder="🚨 REQUIRED: Describe the failure details..."
                              className="w-full px-3 py-2 text-xs border border-rose-200 text-rose-900 rounded-lg placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer bg-white border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-2">
                                📷 {uploadingPhotos[item.id] ? "Uploading..." : "Take Photo (Required)"}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  className="hidden" 
                                  onChange={(e) => handlePhotoUpload(item.id, e)} 
                                  disabled={uploadingPhotos[item.id]}
                                />
                              </label>
                              
                              {photoUrls[item.id] && (
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                  ✓ Photo attached
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Safety Gate Warning Block */}
          {safetyCriticalFailures.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-black text-rose-800 text-sm tracking-tight uppercase">🚨 DISPATCH BLOCKED</p>
                  <p className="text-xs text-rose-700 mt-1">
                    Failed safety-critical items: <strong>{safetyCriticalFailures.map((f) => f.label.split(":")[0]).join(", ")}</strong>.
                    An authorized site supervisor must verify and input an override PIN to clear this asset for shift dispatch.
                  </p>
                </div>
              </div>

              {isOverrideApproved ? (
                <div className="px-3 py-2 rounded bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  ✓ Supervisor Override Approved by {supervisorName}
                </div>
              ) : (
                <form onSubmit={handleVerifyOverride} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-rose-200">
                  <input
                    type="text"
                    required
                    placeholder="Supervisor Name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-fogDark rounded bg-white text-ink placeholder-steelLight shrink min-w-0"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Override PIN"
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-fogDark rounded bg-white text-ink placeholder-steelLight w-24 font-mono text-center"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold uppercase shrink-0"
                  >
                    Authorize
                  </button>
                </form>
              )}
              {overrideError && <p className="text-[10px] text-rose-600 font-bold font-mono">{overrideError}</p>}

              {isOverrideApproved && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-rose-800 uppercase">Override Justification Comment</label>
                  <input
                    type="text"
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Cleared for yard relocation check only. Maintenance scheduled at 14:00."
                    className="w-full px-3 py-2 text-xs border border-rose-200 bg-white text-ink rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Odometer and Signature Panel */}
          <div className="border-t border-fogDark pt-4 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">
                Current Odometer / Engine Hours Reading
              </label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder={`Initial: ${selectedAsset.odometer_or_hours.toLocaleString()} ${selectedAsset.asset_type === "truck" || selectedAsset.asset_type === "trailer" ? "km" : "hrs"}`}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink font-mono focus:outline-none focus:ring-2 focus:ring-amber/40"
              />
            </div>

            {/* Signature Pad Canvas */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-steel">Operator Digital Signature</label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[10px] text-rose-600 hover:underline font-mono"
                >
                  Clear Pad
                </button>
              </div>
              <div className="bg-slate-50 border border-fogDark border-dashed rounded-xl overflow-hidden touch-none relative h-28 flex items-center justify-center">
                {!hasSignature && (
                  <p className="absolute text-[10px] text-steelLight pointer-events-none uppercase font-mono">
                    Sign inside this box
                  </p>
                )}
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={112}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair relative z-10"
                />
              </div>

              {user && (
                <div className="mt-2 flex items-center justify-between text-xs text-steel bg-slate-50 border border-fogDark px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-5 h-5 rounded-full object-cover border border-fogDark shrink-0 shadow-sm"
                      />
                    )}
                    <span>Logged In Inspector: <strong className="text-ink font-bold">{user.fullName}</strong></span>
                  </div>
                  <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">
                    {user.role.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <button
            onClick={handleFinalSubmit}
            disabled={!allAnswered || isDispatchBlocked || !hasSignature || (safetyCriticalFailures.length > 0 && isOverrideApproved && !overrideReason.trim())}
            className="w-full py-4 bg-ink disabled:bg-slate-200 disabled:text-slate-400 hover:bg-steelDark text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98"
          >
            {!allAnswered
              ? `Check remaining items (${currentItems.length - Object.keys(answers).length} left)`
              : !hasSignature
              ? "Please sign the signature pad"
              : isDispatchBlocked
              ? "Dispatch Blocked - Requires Override Justification"
              : "Confirm & Submit Inspection"}
          </button>
        </div>
      )}

      {step === 3 && finalRecord && (
        <div className="bg-white border border-fogDark rounded-2xl p-6 shadow-xl text-center space-y-6 animate-scale-up">
          <div className={`p-8 rounded-2xl ${finalRecord.status === "accepted" ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
            <span className={`text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full ${
              finalRecord.status === "accepted" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}>
              {finalRecord.status === "accepted" ? "DISPATCH CLEARED" : "DISPATCH BLOCKED"}
            </span>

            <h2 className="font-display font-black text-2xl text-ink mt-4">
              {finalRecord.status === "accepted" ? "Inspection Approved" : "Inspection Flagged / Blocked"}
            </h2>
            <p className="text-xs text-steelLight mt-2 max-w-sm mx-auto leading-relaxed">
              {finalRecord.status === "accepted"
                ? `Compliance checks completed. Asset ${finalRecord.asset_name} is cleared for dispatch under driver ${finalRecord.operator_name}.`
                : `Dispatch has been blocked. Asset is parked pending mechanic inspection and defect clearance.`}
            </p>

            {finalRecord.supervisor_override_by && (
              <div className="mt-4 p-2.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium text-left">
                <strong>Supervisor Override Clear:</strong> {finalRecord.supervisor_override_by}
                <br />
                <strong>Reason:</strong> {finalRecord.override_reason}
              </div>
            )}
          </div>

          {generatedDefects.length > 0 && (
            <div className="text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steel">Defects Logged ({generatedDefects.length})</h4>
              <div className="space-y-2">
                {generatedDefects.map((def) => (
                  <div key={def.id} className="p-3 bg-slate-50 border border-fogDark rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink">{def.item_label}</p>
                      <p className="text-[10px] text-rose-700 italic mt-0.5">Defect: {def.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] bg-rose-100 border border-rose-200 text-rose-800 font-mono font-bold uppercase">
                      Open
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 border border-fogDark hover:bg-slate-50 text-xs font-bold rounded-xl text-steel transition-colors"
            >
              Start Another Check
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-3.5 bg-ink hover:bg-steelDark text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
            >
              Return to Fleet Status
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Toggle checking button sub-component
function CheckButton({
  active,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: "go" | "warn" | "stop" | "neutral";
}) {
  const baseClass = "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95 shrink-0";
  let activeClass = "";

  if (active) {
    if (tone === "go") activeClass = "bg-emerald-600 text-white border-emerald-600 shadow-md";
    else if (tone === "warn") activeClass = "bg-amber-500 text-white border-amber-500 shadow-md";
    else if (tone === "stop") activeClass = "bg-rose-600 text-white border-rose-600 shadow-md";
    else activeClass = "bg-slate-700 text-white border-slate-700 shadow-md";
  } else {
    activeClass = "bg-white text-steelLight border-fogDark hover:bg-slate-50";
  }

  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${activeClass}`}>
      {label}
    </button>
  );
}
