"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Asset, ComplianceItem, Operator, DefectRecord } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import AddAssetModal from "@/components/AddAssetModal";
import AddOperatorModal from "@/components/AddOperatorModal";
import AssetDetailsModal from "@/components/AssetDetailsModal";
import OperatorDetailsModal from "@/components/OperatorDetailsModal";
import ComplianceHealthBar from "@/components/ComplianceHealthBar";
import { useAuth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/auditLog";
import { isDemoMode } from "@/lib/demoData";
import { createAsset, createOperator, resolveDefect, updateAssetStatus } from "@/lib/supabase/queries";

interface DashboardClientProps {
  initialAssets: Asset[];
  initialCompliance: ComplianceItem[];
  initialOperators: Operator[];
  initialDefects?: DefectRecord[];
}

export default function DashboardClient({
  initialAssets,
  initialCompliance,
  initialOperators,
  initialDefects = [],
}: DashboardClientProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(initialCompliance);
  const [defects, setDefects] = useState<DefectRecord[]>(initialDefects);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAssetDetailsOpen, setIsAssetDetailsOpen] = useState(false);

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isOperatorDetailsOpen, setIsOperatorDetailsOpen] = useState(false);

  // Load custom assets, operators, and defects from local storage
  useEffect(() => {
    if (!isDemoMode()) return;
    const storedAssets = localStorage.getItem("ops_gate_assets");
    if (storedAssets) {
      try {
        const parsed = JSON.parse(storedAssets) as Asset[];
        const ids = new Set(initialAssets.map((a) => a.id));
        const merged = [
          ...initialAssets,
          ...parsed.filter((p) => !ids.has(p.id)),
        ];
        setAssets(merged);
      } catch (e) {
        console.error(e);
      }
    }

    const storedOperators = localStorage.getItem("ops_gate_operators");
    if (storedOperators) {
      try {
        const parsed = JSON.parse(storedOperators) as Operator[];
        const ids = new Set(initialOperators.map((o) => o.id));
        const merged = [
          ...initialOperators,
          ...parsed.filter((p) => !ids.has(p.id)),
        ];
        setOperators(merged);
      } catch (e) {
        console.error(e);
      }
    }

    const storedDefects = localStorage.getItem("ops_gate_defects");
    if (storedDefects) {
      try {
        setDefects(JSON.parse(storedDefects));
      } catch (e) {
        console.error(e);
      }
    }
  }, [initialAssets, initialOperators]);

  // Handle Save Asset
  const handleSaveAsset = async (newAsset: Omit<Asset, "id" | "status">) => {
    let registered: Asset;
    if (isDemoMode()) {
      registered = {
        ...newAsset,
        id: `custom-asset-${Date.now()}`,
        status: "in_service",
      };
      const updated = [...assets, registered];
      setAssets(updated);
      const customOnly = updated.filter((a) => a.id.startsWith("custom-asset-"));
      localStorage.setItem("ops_gate_assets", JSON.stringify(customOnly));
    } else {
      const res = await createAsset({ ...newAsset, status: "in_service", org_id: user?.orgId } as any);
      if (!res) return;
      registered = res;
      setAssets((prev) => [...prev, registered]);
    }

    // Audit log
    logAuditEvent({
      entity_type: "asset",
      entity_id: registered.id,
      entity_name: registered.name,
      action: "created",
      actor_name: user?.fullName || "System",
      actor_role: user?.role || "unknown",
      details: { registration: registered.registration, category: registered.category },
    });
  };

  // Handle Save Operator
  const handleSaveOperator = async (newOperator: Omit<Operator, "id">) => {
    let registered: Operator;
    if (isDemoMode()) {
      registered = {
        ...newOperator,
        id: `custom-op-${Date.now()}`,
      };
      const updated = [...operators, registered];
      setOperators(updated);
      const customOnly = updated.filter((o) => o.id.startsWith("custom-op-"));
      localStorage.setItem("ops_gate_operators", JSON.stringify(customOnly));
    } else {
      const res = await createOperator({ ...newOperator, org_id: user?.orgId } as any);
      if (!res) return;
      registered = res;
      setOperators((prev) => [...prev, registered]);
    }

    // Audit log
    logAuditEvent({
      entity_type: "operator",
      entity_id: registered.id,
      entity_name: registered.full_name,
      action: "created",
      actor_name: user?.fullName || "System",
      actor_role: user?.role || "unknown",
      details: { role: registered.role, licence_code: registered.licence_code },
    });

    // Automatically seed a dummy compliance item for the new driver so they show in vault
    const newComplianceItem: ComplianceItem = {
      id: `custom-comp-op-${Date.now()}`,
      operator_name: registered.full_name,
      operator_avatar: registered.avatar_url || undefined,
      asset_name: null,
      asset_photo: null,
      item_type: registered.role === "driver" ? "prdp" : "induction",
      reference_number: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 days
      days_to_expiry: 60,
      status: "ok",
      verification_status: "pending_upload",
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      document_name: null,
      document_url: null,
    };

    const updatedCompliance = [...compliance, newComplianceItem];
    setCompliance(updatedCompliance);
    localStorage.setItem("ops_gate_compliance", JSON.stringify(updatedCompliance.filter((c) => c.id.startsWith("custom-"))));
  };

  // Resolve a defect log
  const handleResolveDefect = async (defectId: string) => {
    const updatedDefects = defects.map((def) => {
      if (def.id === defectId) {
        return { ...def, status: "resolved" as const, resolved_at: new Date().toISOString() };
      }
      return def;
    });

    setDefects(updatedDefects);

    if (isDemoMode()) {
      localStorage.setItem("ops_gate_defects", JSON.stringify(updatedDefects));
    } else {
      await resolveDefect(defectId, user?.id || "");
    }

    // Audit log
    const resolvedDef = defects.find((d) => d.id === defectId);
    if (resolvedDef) {
      logAuditEvent({
        entity_type: "defect",
        entity_id: defectId,
        entity_name: resolvedDef.item_label,
        action: "resolved",
        actor_name: user?.fullName || "System",
        actor_role: user?.role || "unknown",
        details: { asset_name: resolvedDef.asset_name },
      });
    }

    // Check if the asset has any other OPEN defects. If all are resolved, clear its 'blocked' status!
    const targetDefect = defects.find((d) => d.id === defectId);
    if (targetDefect) {
      const assetId = targetDefect.asset_id;
      const hasOtherOpenDefects = updatedDefects.some((d) => d.asset_id === assetId && d.status === "open");

      if (!hasOtherOpenDefects) {
        // Clear asset block in local state
        const updatedAssets = assets.map((a) => {
          if (a.id === assetId && a.status === "blocked") {
            return { ...a, status: "in_service" as const };
          }
          return a;
        });
        setAssets(updatedAssets);

        if (isDemoMode()) {
          const customOnly = updatedAssets.filter((a) => a.id.startsWith("custom-asset-"));
          localStorage.setItem("ops_gate_assets", JSON.stringify(customOnly));
        } else {
          await updateAssetStatus(assetId, "in_service");
        }
      }
    }
  };

  // Assign a mechanic to a defect log
  const handleAssignMechanic = (defectId: string, mechanicName: string) => {
    const updatedDefects = defects.map((def) => {
      if (def.id === defectId) {
        return { ...def, resolved_by: mechanicName };
      }
      return def;
    });

    setDefects(updatedDefects);
    localStorage.setItem("ops_gate_defects", JSON.stringify(updatedDefects));

    // Audit log
    const assignedDef = defects.find((d) => d.id === defectId);
    if (assignedDef) {
      logAuditEvent({
        entity_type: "defect",
        entity_id: defectId,
        entity_name: assignedDef.item_label,
        action: "assigned",
        actor_name: user?.fullName || "System",
        actor_role: user?.role || "unknown",
        details: { resolved_by: mechanicName, asset_name: assignedDef.asset_name },
      });
    }
  };

  const blocked = assets.filter((a) => a.status === "blocked");
  const urgent = compliance.filter((c) => c.status === "expired" || c.status === "critical");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-steelLight">Today</p>
        <h1 className="font-display font-bold text-2xl text-ink">Fleet status</h1>
      </div>

      {/* Compliance Health Bar */}
      <ComplianceHealthBar complianceItems={compliance} />

      {/* Grid Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Assets tracked" value={assets.length} />
        <SummaryCard label="Blocked / Dispatch" value={blocked.length} tone={blocked.length ? "stop" : "go"} />
        <SummaryCard label="Operators / Drivers" value={operators.length} />
        <SummaryCard label="Need action now" value={urgent.length} tone={urgent.length ? "stop" : "go"} />
      </div>

      {/* Needs Action List */}
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

      {/* Assets Grid/Section with Add button */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-steelLight">
            Assets ({assets.length})
          </h2>
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber hover:text-amberDark px-2 py-1 rounded bg-amber-500/10 transition-colors"
          >
            + Add Asset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {assets.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setSelectedAsset(a);
                setIsAssetDetailsOpen(true);
              }}
              className="flex items-center justify-between bg-white border border-fogDark rounded-xl px-4 py-3 gap-3 hover:border-amber/50 cursor-pointer transition-all shadow-sm active:scale-98"
            >
              <div className="flex items-center gap-3">
                {a.photo_url && (
                  <img
                    src={a.photo_url}
                    alt={a.name}
                    className="w-12 h-10 rounded object-cover border border-fogDark shrink-0"
                  />
                )}
                <div>
                  <p className="font-bold text-sm text-ink">{a.name}</p>
                  <p className="text-[10px] text-steelLight font-mono">
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

      {/* Operators Section with Add button */}
      <section className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-steelLight">
            Operators / Drivers ({operators.length})
          </h2>
          <button
            onClick={() => setIsOperatorModalOpen(true)}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded bg-emerald-500/10 transition-colors"
          >
            + Add Operator
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {operators.map((o) => (
            <div
              key={o.id}
              onClick={() => {
                setSelectedOperator(o);
                setIsOperatorDetailsOpen(true);
              }}
              className="flex items-center justify-between bg-white border border-fogDark rounded-xl px-4 py-3 gap-3 hover:border-emerald-500/50 cursor-pointer transition-all shadow-sm active:scale-98"
            >
              <div className="flex items-center gap-3">
                {o.avatar_url && (
                  <img
                    src={o.avatar_url}
                    alt={o.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-fogDark shrink-0"
                  />
                )}
                <div>
                  <p className="font-bold text-sm text-ink">{o.full_name}</p>
                  <p className="text-[10px] text-steelLight capitalize font-mono">
                    ID: {o.user_number} · {o.role.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 uppercase tracking-wider font-mono">
                Active
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Defects & Maintenance Log Section */}
      <section className="space-y-3 pt-2">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-steelLight">
          Defects & Job Cards ({defects.filter((d) => d.status === "open").length} open)
        </h2>

        {defects.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-fogDark rounded-xl p-6 text-center text-xs text-steelLight">
            No compliance defects logged. Fleet is fully cleared.
          </div>
        ) : (
          <div className="space-y-2">
            {defects.map((def) => {
              const isResolved = def.status === "resolved";
              return (
                <div
                  key={def.id}
                  className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                    isResolved ? "bg-slate-50/50 border-fogDark opacity-60" : "bg-white border-rose-200 hover:border-rose-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        isResolved ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {isResolved ? "Resolved" : "Open Defect"}
                      </span>
                      <span className="text-xs font-bold text-ink">
                        {def.asset_name}
                      </span>
                      <span className="text-slate-300 font-mono">·</span>
                      <span className="text-xs font-semibold text-steel">
                        {def.item_label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono italic">
                      Fault: {def.description}
                    </p>
                    {def.resolved_by ? (
                      <p className="text-[10px] text-emerald-700 font-mono font-semibold">
                        🛠️ Assigned to: {def.resolved_by}
                      </p>
                    ) : (
                      !isResolved && (
                        <p className="text-[10px] text-amber font-mono font-semibold">
                          ⚠️ Unassigned
                        </p>
                      )
                    )}
                    {isResolved && def.resolved_at && (
                      <p className="text-[9px] text-slate-400 font-mono">
                        Cleared on: {new Date(def.resolved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {!isResolved && (
                    <div className="flex gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          const mech = prompt("Enter mechanic name to assign job:");
                          if (mech) handleAssignMechanic(def.id, mech);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold border border-fogDark rounded-lg text-steel hover:bg-slate-50"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleResolveDefect(def.id)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                      >
                        Clear Defect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* pre start gate link */}
      <div className="pt-2">
        <Link
          href="/checklist"
          className="block text-center bg-ink text-white font-semibold rounded-xl py-4 hover:bg-steelDark shadow-lg hover:shadow-xl transition-all active:scale-98"
        >
          Start a pre-start checklist →
        </Link>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSave={handleSaveAsset}
      />

      {/* Add Operator Modal */}
      <AddOperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onSave={handleSaveOperator}
      />

      {/* Asset Details Modal */}
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={isAssetDetailsOpen}
        onClose={() => {
          setSelectedAsset(null);
          setIsAssetDetailsOpen(false);
        }}
      />

      {/* Operator Details Modal */}
      <OperatorDetailsModal
        operator={selectedOperator}
        isOpen={isOperatorDetailsOpen}
        onClose={() => {
          setSelectedOperator(null);
          setIsOperatorDetailsOpen(false);
        }}
      />
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
    <div className="bg-white border border-fogDark rounded-xl px-4 py-3 shadow-sm">
      <p className={`font-display font-black text-2xl font-tabular ${toneClass}`}>{value}</p>
      <p className="text-[10px] text-steelLight mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}
