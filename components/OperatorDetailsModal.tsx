"use client";

import React, { useState, useEffect } from "react";
import { Operator, InspectionRecord } from "@/lib/types";

interface OperatorDetailsModalProps {
  operator: Operator | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OperatorDetailsModal({ operator, isOpen, onClose }: OperatorDetailsModalProps) {
  const [history, setHistory] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    if (!operator || !isOpen) return;

    // Load inspections
    const storedInspections = localStorage.getItem("ops_gate_inspections");
    if (storedInspections) {
      try {
        const parsed = JSON.parse(storedInspections) as InspectionRecord[];
        const filtered = parsed
          .filter((ins) => ins.operator_id === operator.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(filtered);
      } catch (e) {
        console.error(e);
      }
    }
  }, [operator, isOpen]);

  if (!isOpen || !operator) return null;

  // Medical status check
  const checkMedicalValid = () => {
    if (!operator.medical_expiry) return { valid: false, text: "No Medical Record" };
    const exp = new Date(operator.medical_expiry);
    const today = new Date();
    return exp.getTime() > today.getTime()
      ? { valid: true, text: `Cleared (Exp: ${operator.medical_expiry})` }
      : { valid: false, text: `Expired on ${operator.medical_expiry}` };
  };

  const medStatus = checkMedicalValid();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-fogDark rounded-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">{operator.full_name}</h3>
            <p className="text-[11px] text-steelLight capitalize font-mono">
              Employee ID: {operator.user_number || "N/A"} · {operator.role.replace(/_/g, " ")}
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

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 border border-fogDark rounded-xl">
            {operator.avatar_url && (
              <img
                src={operator.avatar_url}
                alt={operator.full_name}
                className="w-16 h-16 rounded-full object-cover border border-fogDark shrink-0 shadow"
              />
            )}
            <div className="space-y-2 w-full">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Licence Class Code</p>
                  <p className="font-bold text-ink mt-0.5">Code {operator.licence_code || "None"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Site Allocation</p>
                  <p className="font-semibold text-ink mt-0.5">{operator.allocated_site || "Yard Headquarters"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Contact</p>
                  <p className="font-mono text-steel mt-0.5">{operator.phone || "No phone added"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Medical Certification</p>
                  <p className={`font-semibold mt-0.5 ${medStatus.valid ? "text-emerald-700" : "text-rose-600"}`}>
                    {medStatus.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Inspection Logs History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-steel border-b border-slate-100 pb-1.5">
              Completed Inspections & Audits ({history.length})
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-steelLight italic">No historical inspections recorded by this operator.</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {history.map((ins) => {
                  const isFailed = ins.status === "rejected";
                  return (
                    <div
                      key={ins.id}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        isFailed ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/20 border-emerald-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-ink">{ins.asset_name}</span>
                        <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          isFailed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isFailed ? "Failed" : "Cleared"}
                        </span>
                      </div>
                      <p className="text-steel font-mono text-[10px]">
                        Date: {new Date(ins.created_at).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        Type: {ins.type.replace(/_/g, " ")} · Odometer: {ins.odometer_or_hours.toLocaleString()}
                      </p>
                      {ins.supervisor_override_by && (
                        <p className="text-[9px] text-emerald-800 font-medium bg-emerald-50 p-1 rounded border border-emerald-100 mt-1">
                          Override authorized by: {ins.supervisor_override_by}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
