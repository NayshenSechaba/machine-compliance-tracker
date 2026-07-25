"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { isDemoMode, demoAssets, demoOperators, demoCompliance } from "@/lib/demoData";
import { Asset, Operator, ComplianceItem, InspectionRecord, DefectRecord } from "@/lib/types";
import ComplianceHealthGauge from "@/components/charts/ComplianceHealthGauge";
import InspectionTrendChart from "@/components/charts/InspectionTrendChart";
import DefectFrequencyChart from "@/components/charts/DefectFrequencyChart";
import PassRateChart from "@/components/charts/PassRateChart";
import ComplianceHealthBar from "@/components/ComplianceHealthBar";
import { generateComplianceReport, generateInspectionReport, generateDefectReport } from "@/lib/reportGenerator";

type ReportTab = "compliance" | "inspections" | "defects" | "export";

export default function ReportsClient({
  initialAssets,
  initialCompliance,
}: {
  initialAssets: Asset[];
  initialCompliance: ComplianceItem[];
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>("compliance");

  // Merge demo + custom data
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(initialCompliance);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [defects, setDefects] = useState<DefectRecord[]>([]);

  useEffect(() => {
    // Load custom assets
    const storedAssets = localStorage.getItem("ops_gate_assets");
    if (storedAssets) {
      try {
        const customAssets = JSON.parse(storedAssets) as Asset[];
        setAssets((prev) => [...prev, ...customAssets.filter((ca) => !prev.some((p) => p.id === ca.id))]);
      } catch {}
    }
    // Load compliance
    const storedCompliance = localStorage.getItem("ops_gate_compliance");
    if (storedCompliance) {
      try {
        const customCompliance = JSON.parse(storedCompliance) as ComplianceItem[];
        setCompliance((prev) => [...prev, ...customCompliance.filter((cc) => !prev.some((p) => p.id === cc.id))]);
      } catch {}
    }
    // Load inspections
    const storedInspections = localStorage.getItem("ops_gate_inspections");
    if (storedInspections) {
      try { setInspections(JSON.parse(storedInspections)); } catch {}
    }
    // Load defects
    const storedDefects = localStorage.getItem("ops_gate_defects");
    if (storedDefects) {
      try { setDefects(JSON.parse(storedDefects)); } catch {}
    }
  }, []);

  // Generate sample inspection data if none exists (for demo purposes)
  const displayInspections = useMemo(() => {
    if (inspections.length > 0) return inspections;
    // Generate realistic sample data for the last 12 weeks
    const samples: InspectionRecord[] = [];
    const assetPool = assets.slice(0, 3);
    const operatorNames = ["Sipho Ndlovu", "Ben van der Merwe", "Thandi Khumalo"];
    for (let week = 11; week >= 0; week--) {
      const inspCount = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < inspCount; i++) {
        const d = new Date();
        d.setDate(d.getDate() - week * 7 - Math.floor(Math.random() * 7));
        const asset = assetPool[Math.floor(Math.random() * assetPool.length)];
        const opName = operatorNames[Math.floor(Math.random() * operatorNames.length)];
        const isRejected = Math.random() < 0.15;
        const hasOverride = !isRejected && Math.random() < 0.1;
        samples.push({
          id: `sample-insp-${week}-${i}`,
          asset_id: asset?.id || "asset-1",
          asset_name: asset?.name || "Fleet Vehicle",
          operator_id: `op-${i}`,
          operator_name: opName,
          odometer_or_hours: 10000 + Math.floor(Math.random() * 5000),
          type: Math.random() > 0.3 ? "pre_use" : "post_use",
          results: {},
          status: isRejected ? "rejected" : "accepted",
          supervisor_override_by: hasOverride ? "Thandi Khumalo" : null,
          override_reason: hasOverride ? "Emergency dispatch authorised" : null,
          signature_data: "",
          created_at: d.toISOString(),
        });
      }
    }
    return samples;
  }, [inspections, assets]);

  const displayDefects = useMemo(() => {
    if (defects.length > 0) return defects;
    const labels = [
      "Front left tyre tread depth",
      "Service brake operation",
      "Hydraulic hose condition",
      "Rear light cluster — right",
      "Windscreen condition",
      "Fire extinguisher valid",
      "Reverse / backup alarm",
      "Engine oil level",
      "Coolant level",
      "Seat belt condition",
      "Mirror — offside",
      "Air brake pressure",
    ];
    const samples: DefectRecord[] = [];
    for (let i = 0; i < 25; i++) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 84));
      const label = labels[Math.floor(Math.random() * labels.length)];
      const isResolved = Math.random() < 0.6;
      const resolvedDate = new Date(d);
      resolvedDate.setDate(resolvedDate.getDate() + 1 + Math.floor(Math.random() * 5));
      samples.push({
        id: `sample-defect-${i}`,
        inspection_id: `sample-insp-${i}`,
        asset_id: assets[Math.floor(Math.random() * Math.min(assets.length, 3))]?.id || "asset-1",
        asset_name: assets[Math.floor(Math.random() * Math.min(assets.length, 3))]?.name || "Fleet Vehicle",
        item_id: `item-${i}`,
        item_label: label,
        description: `${label} — failed during inspection`,
        assigned_to: isResolved ? "Workshop Team" : (Math.random() > 0.5 ? "Workshop Team" : null),
        status: isResolved ? "resolved" : "open",
        created_at: d.toISOString(),
        resolved_at: isResolved ? resolvedDate.toISOString() : null,
      });
    }
    return samples;
  }, [defects, assets]);

  // Compliance risk scoring
  const complianceRiskData = useMemo(() => {
    const riskWeights: Record<string, number> = {
      prdp: 10,
      drivers_licence: 9,
      roadworthy_cert: 8,
      vehicle_licence: 7,
      mining_safety_cert: 8,
      sadc_permit: 6,
      other: 3,
    };

    return assets.map((asset) => {
      const assetDocs = compliance.filter((c) => c.asset_name === asset.name);
      const totalWeight = assetDocs.reduce((sum, doc) => sum + (riskWeights[doc.item_type] || 3), 0);
      const riskScore = assetDocs.reduce((sum, doc) => {
        const weight = riskWeights[doc.item_type] || 3;
        if (doc.status === "expired") return sum + weight;
        if (doc.status === "critical") return sum + weight * 0.7;
        if (doc.status === "warning") return sum + weight * 0.3;
        return sum;
      }, 0);
      const riskPercent = totalWeight > 0 ? Math.round((riskScore / totalWeight) * 100) : 0;
      return { asset, riskPercent, docs: assetDocs };
    }).sort((a, b) => b.riskPercent - a.riskPercent);
  }, [assets, compliance]);

  // Date range for exports
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const tabs: { key: ReportTab; label: string; icon: string }[] = [
    { key: "compliance", label: "Compliance", icon: "🛡️" },
    { key: "inspections", label: "Inspections", icon: "📋" },
    { key: "defects", label: "Defects", icon: "🔧" },
    { key: "export", label: "Export", icon: "📄" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-ink">Reports & Analytics</h1>
          <p className="text-xs text-steel font-mono mt-0.5">Fleet compliance intelligence</p>
        </div>
        <Link
          href="/dashboard"
          className="text-[11px] font-bold text-steel hover:text-ink border border-fogDark px-3 py-1.5 rounded-lg transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-steel hover:text-ink"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "compliance" && (
        <div className="space-y-6 animate-fade-in">
          {/* Compliance Health Bar */}
          <ComplianceHealthBar complianceItems={compliance} />

          {/* Compliance Gauge Chart */}
          <ComplianceHealthGauge complianceItems={compliance} />

          {/* Risk Scoring Table */}
          <div className="bg-white border border-fogDark rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-fogDark">
              <h3 className="text-sm font-display font-bold text-ink">Asset Compliance Risk Scores</h3>
              <p className="text-[10px] text-steel font-mono mt-0.5">Weighted by document severity — PrDP & mining certs score highest</p>
            </div>
            <div className="divide-y divide-fogDark">
              {complianceRiskData.map(({ asset, riskPercent, docs }) => (
                <div key={asset.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {asset.photo_url && (
                      <img src={asset.photo_url} alt={asset.name} className="w-9 h-7 rounded object-cover border border-fogDark shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-ink">{asset.name}</p>
                      <p className="text-[10px] text-steel font-mono">{asset.registration || "No tag"} · {docs.length} docs tracked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          riskPercent >= 70 ? "bg-rose-500" : riskPercent >= 40 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(riskPercent, 3)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono font-extrabold min-w-[2.5rem] text-right ${
                      riskPercent >= 70 ? "text-rose-600" : riskPercent >= 40 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {riskPercent}%
                    </span>
                  </div>
                </div>
              ))}
              {complianceRiskData.length === 0 && (
                <p className="px-5 py-6 text-xs text-steel text-center">No assets to score</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "inspections" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Inspections", value: displayInspections.length, color: "text-ink" },
              { label: "Pass Rate", value: `${displayInspections.length > 0 ? Math.round((displayInspections.filter(i => i.status === "accepted").length / displayInspections.length) * 100) : 0}%`, color: "text-emerald-600" },
              { label: "Overrides", value: displayInspections.filter(i => i.supervisor_override_by).length, color: "text-amber-600" },
              { label: "Rejected", value: displayInspections.filter(i => i.status === "rejected").length, color: "text-rose-600" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-fogDark rounded-xl p-4 text-center shadow-sm">
                <p className="text-[9px] font-mono text-steelLight uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-2xl font-display font-extrabold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Inspection Trend Chart */}
          <InspectionTrendChart inspections={displayInspections} />

          {/* Pass Rate Chart */}
          <PassRateChart inspections={displayInspections} />
        </div>
      )}

      {activeTab === "defects" && (
        <div className="space-y-6 animate-fade-in">
          {/* Defect KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const open = displayDefects.filter(d => d.status === "open").length;
              const resolved = displayDefects.filter(d => d.status === "resolved").length;
              const resolvedWithTime = displayDefects.filter(d => d.resolved_at && d.created_at);
              const mttr = resolvedWithTime.length > 0
                ? Math.round(resolvedWithTime.reduce((sum, d) => {
                    const created = new Date(d.created_at).getTime();
                    const resolvedAt = new Date(d.resolved_at!).getTime();
                    return sum + (resolvedAt - created) / (1000 * 60 * 60 * 24);
                  }, 0) / resolvedWithTime.length * 10) / 10
                : 0;
              return [
                { label: "Total Defects", value: displayDefects.length, color: "text-ink" },
                { label: "Open", value: open, color: "text-rose-600" },
                { label: "Resolved", value: resolved, color: "text-emerald-600" },
                { label: "Avg Resolution", value: `${mttr}d`, color: "text-amber-600" },
              ];
            })().map((kpi) => (
              <div key={kpi.label} className="bg-white border border-fogDark rounded-xl p-4 text-center shadow-sm">
                <p className="text-[9px] font-mono text-steelLight uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-2xl font-display font-extrabold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Defect Frequency Chart */}
          <DefectFrequencyChart defects={displayDefects} />

          {/* Recent Defects Table */}
          <div className="bg-white border border-fogDark rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-fogDark">
              <h3 className="text-sm font-display font-bold text-ink">Recent Defect Log</h3>
            </div>
            <div className="divide-y divide-fogDark max-h-80 overflow-y-auto">
              {displayDefects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15).map((defect) => (
                <div key={defect.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{defect.item_label}</p>
                    <p className="text-[10px] text-steel font-mono truncate">{defect.asset_name} · {new Date(defect.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    defect.status === "open"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}>
                    {defect.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "export" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-fogDark rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-display font-bold text-ink">Generate Reports</h3>
              <p className="text-[10px] text-steel font-mono mt-0.5">Download PDF or CSV reports for management and regulatory submissions</p>
            </div>

            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-mono text-steel uppercase">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-fogDark rounded-lg px-3 py-2 text-xs text-ink"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-mono text-steel uppercase">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-fogDark rounded-lg px-3 py-2 text-xs text-ink"
                />
              </div>
            </div>

            {/* Report Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => generateComplianceReport(assets, compliance, user?.fullName || "System")}
                className="flex flex-col items-center gap-2 p-5 bg-slate-50 hover:bg-emerald-50 border border-fogDark hover:border-emerald-300 rounded-xl transition-all group active:scale-98"
              >
                <span className="text-2xl">🛡️</span>
                <span className="text-xs font-bold text-ink group-hover:text-emerald-700">Compliance Report</span>
                <span className="text-[9px] text-steel font-mono text-center">Fleet document status summary</span>
              </button>

              <button
                onClick={() => generateInspectionReport(displayInspections, { from: dateFrom, to: dateTo }, user?.fullName || "System")}
                className="flex flex-col items-center gap-2 p-5 bg-slate-50 hover:bg-blue-50 border border-fogDark hover:border-blue-300 rounded-xl transition-all group active:scale-98"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-bold text-ink group-hover:text-blue-700">Inspection Report</span>
                <span className="text-[9px] text-steel font-mono text-center">Pre/post-use history log</span>
              </button>

              <button
                onClick={() => generateDefectReport(displayDefects, { from: dateFrom, to: dateTo }, user?.fullName || "System")}
                className="flex flex-col items-center gap-2 p-5 bg-slate-50 hover:bg-rose-50 border border-fogDark hover:border-rose-300 rounded-xl transition-all group active:scale-98"
              >
                <span className="text-2xl">🔧</span>
                <span className="text-xs font-bold text-ink group-hover:text-rose-700">Defect Report</span>
                <span className="text-[9px] text-steel font-mono text-center">Defect log with resolution times</span>
              </button>
            </div>

            {/* CSV Export */}
            <div className="border-t border-fogDark pt-4">
              <p className="text-[10px] font-mono text-steel uppercase mb-3">Raw Data Export (CSV)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const headers = "Date,Asset,Operator,Type,Status,Override By,Override Reason\n";
                    const rows = displayInspections.map(i =>
                      `${new Date(i.created_at).toLocaleDateString()},${i.asset_name},${i.operator_name},${i.type},${i.status},${i.supervisor_override_by || ""},${i.override_reason || ""}`
                    ).join("\n");
                    const blob = new Blob([headers + rows], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `inspections_${dateFrom}_${dateTo}.csv`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[10px] font-bold text-steel hover:text-ink border border-fogDark px-3 py-1.5 rounded-lg transition-colors"
                >
                  📋 Inspections CSV
                </button>
                <button
                  onClick={() => {
                    const headers = "Date,Asset,Item,Description,Status,Assigned To,Resolved At\n";
                    const rows = displayDefects.map(d =>
                      `${new Date(d.created_at).toLocaleDateString()},${d.asset_name},${d.item_label},"${d.description}",${d.status},${d.assigned_to || ""},${d.resolved_at ? new Date(d.resolved_at).toLocaleDateString() : ""}`
                    ).join("\n");
                    const blob = new Blob([headers + rows], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `defects_${dateFrom}_${dateTo}.csv`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[10px] font-bold text-steel hover:text-ink border border-fogDark px-3 py-1.5 rounded-lg transition-colors"
                >
                  🔧 Defects CSV
                </button>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[10px] font-mono text-amber-800">
              <strong className="uppercase">Note:</strong> PDF reports include OPS GATE branding, generation timestamp, and are formatted for A4 landscape printing. Generated by: <strong>{user?.fullName || "System"}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
