"use client";

import React, { useState, useEffect } from "react";
import { Asset, InspectionRecord, DefectRecord } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetDetailsModal({ asset, isOpen, onClose }: AssetDetailsModalProps) {
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [defects, setDefects] = useState<DefectRecord[]>([]);

  useEffect(() => {
    if (!asset || !isOpen) return;

    // Load inspections
    const storedInspections = localStorage.getItem("ops_gate_inspections");
    if (storedInspections) {
      try {
        const parsed = JSON.parse(storedInspections) as InspectionRecord[];
        const filtered = parsed
          .filter((ins) => ins.asset_id === asset.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(filtered);
      } catch (e) {
        console.error(e);
      }
    }

    // Load defects
    const storedDefects = localStorage.getItem("ops_gate_defects");
    if (storedDefects) {
      try {
        const parsed = JSON.parse(storedDefects) as DefectRecord[];
        const filtered = parsed.filter((def) => def.asset_id === asset.id);
        setDefects(filtered);
      } catch (e) {
        console.error(e);
      }
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-fogDark rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">{asset.name}</h3>
            <p className="text-[11px] text-steelLight font-mono">
              Reg: {asset.registration || "No Tag"} · {asset.category.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-steelLight hover:text-ink hover:bg-slate-200/50 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Top Panel: Photo and Allocation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {asset.photo_url && (
              <div className="md:col-span-1 rounded-xl overflow-hidden border border-fogDark aspect-video md:aspect-square">
                <img src={asset.photo_url} alt={asset.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Site Allocation</p>
                  <p className="font-bold text-ink text-sm mt-0.5">{asset.allocated_site || "Unallocated / Yard HQ"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Insurance Status</p>
                  <p className="font-semibold text-emerald-700 mt-0.5">{asset.insurance_status || "Active Coverage"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Odometer / Hours</p>
                  <p className="font-mono font-bold text-ink mt-0.5">
                    {asset.odometer_or_hours.toLocaleString()}{" "}
                    {asset.asset_type === "truck" || asset.asset_type === "trailer" ? "km" : "hrs"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operational Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={asset.status} />
                  </div>
                </div>
              </div>

              {/* Last Service Detail Box */}
              <div className="p-3 bg-amber-500/5 border border-amber/15 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber">Last Scheduled Service</p>
                {asset.last_service ? (
                  <>
                    <p className="text-[10px] text-steel font-mono">
                      Date: {asset.last_service.date} · Reading: {asset.last_service.odometer_or_hours.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-ink italic">"{asset.last_service.description}"</p>
                  </>
                ) : (
                  <p className="text-steelLight italic text-[11px]">No formal service log found. Plan generic check-up.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabular Lists: Defects and History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-fogDark pt-5">
            {/* Defects Log Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steel border-b border-slate-100 pb-1.5">
                Defects & Active Job Cards ({defects.length})
              </h4>
              {defects.length === 0 ? (
                <p className="text-xs text-steelLight italic">No defects recorded for this asset.</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {defects.map((def) => {
                    const isOpen = def.status === "open";
                    return (
                      <div
                        key={def.id}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          isOpen ? "bg-rose-50/50 border-rose-100" : "bg-slate-50 border-fogDark opacity-60"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-ink">{def.item_label}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            isOpen ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-700"
                          }`}>
                            {def.status}
                          </span>
                        </div>
                        <p className="text-slate-600 font-mono italic">"{def.description}"</p>
                        {def.assigned_to && (
                          <p className="text-[9px] text-emerald-700 font-mono">Assigned Mechanic: {def.assigned_to}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inspection History Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steel border-b border-slate-100 pb-1.5">
                Compliance Inspection Log ({history.length})
              </h4>
              {history.length === 0 ? (
                <p className="text-xs text-steelLight italic">No inspection logs recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {history.map((ins) => {
                    const isRejected = ins.status === "rejected";
                    return (
                      <div
                        key={ins.id}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          isRejected ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/20 border-emerald-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold font-mono text-ink">
                            {new Date(ins.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isRejected ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {isRejected ? "Failed" : "Passed"}
                          </span>
                        </div>
                        <p className="text-steel font-medium capitalize">
                          {ins.type.replace(/_/g, " ")} · By {ins.operator_name}
                        </p>
                        {ins.supervisor_override_by && (
                          <div className="p-1.5 bg-slate-100 rounded text-[9px] text-slate-600 mt-1">
                            <span className="font-bold">Override:</span> {ins.supervisor_override_by}
                            <br />
                            <span className="italic">"{ins.override_reason}"</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-fogDark flex justify-end bg-slate-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ink hover:bg-steelDark text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
