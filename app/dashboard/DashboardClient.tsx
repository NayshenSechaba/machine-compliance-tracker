"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Asset, ComplianceItem, Operator } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import AddAssetModal from "@/components/AddAssetModal";
import AddOperatorModal from "@/components/AddOperatorModal";

interface DashboardClientProps {
  initialAssets: Asset[];
  initialCompliance: ComplianceItem[];
  initialOperators: Operator[];
}

export default function DashboardClient({
  initialAssets,
  initialCompliance,
  initialOperators,
}: DashboardClientProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(initialCompliance);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);

  // Load custom assets & operators from local storage
  useEffect(() => {
    const storedAssets = localStorage.getItem("ops_gate_assets");
    if (storedAssets) {
      try {
        const parsed = JSON.parse(storedAssets) as Asset[];
        // Merge without duplicate IDs
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
  }, [initialAssets, initialOperators]);

  // Handle Save Asset
  const handleSaveAsset = (newAsset: Omit<Asset, "id" | "status">) => {
    const registered: Asset = {
      ...newAsset,
      id: `custom-asset-${Date.now()}`,
      status: "in_service",
    };

    const updated = [...assets, registered];
    setAssets(updated);

    // Save custom assets to local storage
    const customOnly = updated.filter((a) => a.id.startsWith("custom-asset-"));
    localStorage.setItem("ops_gate_assets", JSON.stringify(customOnly));
  };

  // Handle Save Operator
  const handleSaveOperator = (newOperator: Omit<Operator, "id">) => {
    const registered: Operator = {
      ...newOperator,
      id: `custom-op-${Date.now()}`,
    };

    const updated = [...operators, registered];
    setOperators(updated);

    // Save custom operators to local storage
    const customOnly = updated.filter((o) => o.id.startsWith("custom-op-"));
    localStorage.setItem("ops_gate_operators", JSON.stringify(customOnly));

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

  const blocked = assets.filter((a) => a.status === "blocked");
  const urgent = compliance.filter((c) => c.status === "expired" || c.status === "critical");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-steelLight">Today</p>
        <h1 className="font-display font-bold text-2xl text-ink">Fleet status</h1>
      </div>

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
              className="flex items-center justify-between bg-white border border-fogDark rounded-xl px-4 py-3 gap-3 hover:border-steelLight/35 transition-colors shadow-sm"
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
              className="flex items-center justify-between bg-white border border-fogDark rounded-xl px-4 py-3 gap-3 hover:border-steelLight/35 transition-colors shadow-sm"
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
