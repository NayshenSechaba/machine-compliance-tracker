"use client";

import React from 'react';

export type ComplianceItem = {
  id: string;
  item_type: string;
  reference_number: string | null;
  expiry_date: string;
  operator_name: string | null;
  asset_name: string | null;
  days_to_expiry: number;
  status: "expired" | "critical" | "warning" | "upcoming" | "ok";
  verification_status: "pending_upload" | "pending_verification" | "verified" | "rejected";
};

interface ComplianceHealthBarProps {
  complianceItems: ComplianceItem[];
}

export default function ComplianceHealthBar({ complianceItems }: ComplianceHealthBarProps) {
  const total = complianceItems.length;
  
  if (total === 0) {
    return (
      <div className="p-4 border border-fogDark rounded-xl bg-white">
        <h3 className="font-mono text-xs uppercase text-steelLight mb-3 tracking-wider">Document Compliance Status</h3>
        <div className="text-sm text-steel italic">No compliance items tracked yet.</div>
      </div>
    );
  }

  const counts = {
    ok: 0,
    upcoming: 0,
    warning: 0,
    critical: 0,
    expired: 0
  };

  complianceItems.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  });

  const allOk = counts.ok === total;

  return (
    <div className="p-5 border border-fogDark rounded-xl bg-white shadow-sm">
      <h3 className="font-mono text-xs uppercase text-steel mb-4 font-semibold tracking-wider flex justify-between items-center">
        <span>Document Compliance Status</span>
        <span className="text-steelLight font-normal">{total} total items</span>
      </h3>
      
      {allOk ? (
        <div className="flex items-center space-x-3 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">All documents are up to date!</span>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="w-full h-4 flex rounded-full overflow-hidden bg-slate-100">
            {counts.expired > 0 && <div style={{ width: `${(counts.expired / total) * 100}%` }} className="bg-red-500" title={`Expired: ${counts.expired}`} />}
            {counts.critical > 0 && <div style={{ width: `${(counts.critical / total) * 100}%` }} className="bg-orange-500" title={`Critical: ${counts.critical}`} />}
            {counts.warning > 0 && <div style={{ width: `${(counts.warning / total) * 100}%` }} className="bg-amber-500" title={`Warning: ${counts.warning}`} />}
            {counts.upcoming > 0 && <div style={{ width: `${(counts.upcoming / total) * 100}%` }} className="bg-cyan-500" title={`Upcoming: ${counts.upcoming}`} />}
            {counts.ok > 0 && <div style={{ width: `${(counts.ok / total) * 100}%` }} className="bg-emerald-500" title={`OK: ${counts.ok}`} />}
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-body">
            {counts.expired > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-ink font-medium">{counts.expired}</span>
                <span className="text-steel">Expired</span>
              </div>
            )}
            {counts.critical > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-ink font-medium">{counts.critical}</span>
                <span className="text-steel">Critical (≤7d)</span>
              </div>
            )}
            {counts.warning > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-ink font-medium">{counts.warning}</span>
                <span className="text-steel">Warning (≤30d)</span>
              </div>
            )}
            {counts.upcoming > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-ink font-medium">{counts.upcoming}</span>
                <span className="text-steel">Upcoming (≤90d)</span>
              </div>
            )}
            {counts.ok > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-ink font-medium">{counts.ok}</span>
                <span className="text-steel">OK</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
