"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DefectRecord, Asset, Operator } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export default function MaintenancePage() {
  const { user } = useAuth();
  const [defects, setDefects] = useState<DefectRecord[]>([]);
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    setLoading(true);
    // Fetch assets first for lookup
    const { data: assetsData } = await supabase.from("assets").select("*");
    const assetsMap: Record<string, Asset> = {};
    if (assetsData) {
      assetsData.forEach((a: Asset) => {
        assetsMap[a.id] = a;
      });
      setAssets(assetsMap);
    }

    // Fetch open and in_progress defects
    const { data: defectsData } = await supabase
      .from("defects")
      .select("*")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    if (defectsData) {
      setDefects(defectsData as DefectRecord[]);
    }
    setLoading(false);
  };

  const updateStatus = async (defectId: string, status: "in_progress" | "resolved") => {
    const { error } = await supabase
      .from("defects")
      .update({ status })
      .eq("id", defectId);

    if (!error) {
      setDefects((prev) =>
        prev.map((d) => (d.id === defectId ? { ...d, status } : d))
      );
    }
  };

  const resolveDefect = async (defectId: string, assetId: string) => {
    const { error } = await supabase
      .from("defects")
      .update({ 
        status: "resolved", 
        resolved_at: new Date().toISOString(),
        resolution_notes: "Resolved by Maintenance" 
      })
      .eq("id", defectId);

    if (!error) {
      setDefects((prev) => prev.filter((d) => d.id !== defectId));
      
      // Check if any other open defects exist for this asset
      const { data: remaining } = await supabase
        .from("defects")
        .select("id")
        .eq("asset_id", assetId)
        .in("status", ["open", "in_progress"]);

      if (!remaining || remaining.length === 0) {
        // Unblock asset
        await supabase
          .from("assets")
          .update({ status: "in_service" })
          .eq("id", assetId);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-steel">Loading maintenance queue...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">Maintenance Queue</h2>
        <p className="text-xs text-steelLight">
          Review and resolve flagged defects from pre-start checklists.
        </p>
      </div>

      {defects.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center">
          <p className="text-emerald-800 font-bold">All clear! No open defects in the fleet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {defects.map((defect) => {
            const asset = assets[defect.asset_id];
            return (
              <div key={defect.id} className="bg-white border border-fogDark rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                {defect.photo_url ? (
                  <img src={defect.photo_url} alt="Defect" className="w-full md:w-48 h-32 object-cover rounded-lg border border-slate-200" />
                ) : (
                  <div className="w-full md:w-48 h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                    <span className="text-slate-400 text-xs font-mono">No Photo</span>
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {defect.status.replace("_", " ")}
                      </span>
                      <h3 className="font-bold text-lg text-ink mt-1">{defect.item_label}</h3>
                      <p className="text-xs text-steel font-mono">{asset ? `${asset.name} (${asset.registration})` : "Unknown Asset"}</p>
                    </div>
                    <span className="text-[10px] text-steelLight">{new Date(defect.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                    <p className="text-xs text-rose-900"><strong>Driver Note:</strong> {defect.description || "No notes provided."}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {defect.status === "open" && (
                      <button 
                        onClick={() => updateStatus(defect.id, "in_progress")}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    <button 
                      onClick={() => resolveDefect(defect.id, defect.asset_id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
