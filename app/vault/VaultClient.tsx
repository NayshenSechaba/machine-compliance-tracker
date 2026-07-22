"use client";

import React, { useState, useEffect } from "react";
import { ComplianceItem, OcrData } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import VerificationBadge from "@/components/VerificationBadge";
import DocumentUploadModal from "@/components/DocumentUploadModal";
import ManagerVerificationModal from "@/components/ManagerVerificationModal";

interface VaultClientProps {
  initialItems: ComplianceItem[];
}

const ORDER: Record<string, number> = { expired: 0, critical: 1, warning: 2, upcoming: 3, ok: 4 };

export default function VaultClient({ initialItems }: VaultClientProps) {
  const [items, setItems] = useState<ComplianceItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"all" | "pending_review">("all");
  const [selectedUploadItem, setSelectedUploadItem] = useState<ComplianceItem | null>(null);
  const [selectedVerifyItem, setSelectedVerifyItem] = useState<ComplianceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedCompliance = localStorage.getItem("ops_gate_compliance");
    if (storedCompliance) {
      try {
        const parsed = JSON.parse(storedCompliance) as ComplianceItem[];
        const ids = new Set(initialItems.map((i) => i.id));
        setItems([
          ...initialItems,
          ...parsed.filter((p) => !ids.has(p.id)),
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [initialItems]);

  const pendingReviewCount = items.filter(
    (i) => i.verification_status === "pending_verification"
  ).length;

  const filteredItems = items
    .filter((i) => {
      if (activeTab === "pending_review" && i.verification_status !== "pending_verification") {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const name = (i.operator_name || i.asset_name || "").toLowerCase();
        const ref = (i.reference_number || "").toLowerCase();
        const type = i.item_type.toLowerCase();
        return name.includes(query) || ref.includes(query) || type.includes(query);
      }
      return true;
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const handleDocumentSave = (
    itemId: string,
    documentName: string,
    documentUrl: string,
    ocrData: OcrData
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            document_name: documentName,
            document_url: documentUrl,
            ocr_data: ocrData,
            reference_number: ocrData.reference_number || item.reference_number,
            expiry_date: ocrData.expiry_date || item.expiry_date,
            verification_status: "pending_verification",
            rejection_reason: null,
          };
        }
        return item;
      })
    );
  };

  const handleConfirmVerification = (
    itemId: string,
    refNumber: string,
    expiryDate: string,
    managerName: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const today = new Date();
          const exp = new Date(expiryDate);
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
          const statusCalc =
            diffDays < 0
              ? "expired"
              : diffDays <= 7
              ? "critical"
              : diffDays <= 30
              ? "warning"
              : diffDays <= 60
              ? "upcoming"
              : "ok";

          return {
            ...item,
            reference_number: refNumber,
            expiry_date: expiryDate,
            days_to_expiry: diffDays,
            status: statusCalc as any,
            verification_status: "verified",
            verified_by: managerName,
            verified_at: new Date().toISOString(),
            rejection_reason: null,
          };
        }
        return item;
      })
    );
  };

  const handleRejectVerification = (itemId: string, reason: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            verification_status: "rejected",
            rejection_reason: reason,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-fogDark pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-steelDark text-white shadow-sm"
                : "bg-slate-100 text-steelLight hover:text-ink"
            }`}
          >
            All Expiries ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("pending_review")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "pending_review"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
            }`}
          >
            Pending Manager Review
            {pendingReviewCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-amber-700 text-white rounded-full font-mono">
                {pendingReviewCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search driver, vehicle, ref no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ember/40"
          />
          <svg
            className="w-4 h-4 text-steelLight absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Compliance List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-fogDark rounded-xl">
            <p className="text-sm font-semibold text-steel">No matching items found</p>
            <p className="text-xs text-steelLight mt-1">
              {activeTab === "pending_review"
                ? "All uploaded documentation has been verified by managers!"
                : "Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-fogDark rounded-xl p-4 shadow-sm hover:border-steelLight/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {item.operator_avatar && (
                      <img
                        src={item.operator_avatar}
                        alt={item.operator_name || "Operator"}
                        className="w-8 h-8 rounded-full object-cover border border-fogDark shrink-0"
                      />
                    )}
                    {item.asset_photo && (
                      <img
                        src={item.asset_photo}
                        alt={item.asset_name || "Asset"}
                        className="w-10 h-7 rounded object-cover border border-fogDark shrink-0"
                      />
                    )}
                    <p className="font-bold text-sm text-ink truncate">
                      {item.operator_name ?? item.asset_name ?? "Unassigned"}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <VerificationBadge
                    status={item.verification_status}
                    verifiedBy={item.verified_by}
                    rejectionReason={item.rejection_reason}
                  />
                </div>

                <div className="text-xs text-steelLight font-mono flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-steel uppercase">
                    {item.item_type.replace(/_/g, " ")}
                  </span>
                  <span>·</span>
                  <span>Ref: {item.reference_number ?? "no ref"}</span>
                  <span>·</span>
                  <span>
                    Expires{" "}
                    {new Date(item.expiry_date).toLocaleDateString("en-ZA", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>({item.days_to_expiry >= 0 ? `${item.days_to_expiry}d left` : `${Math.abs(item.days_to_expiry)}d overdue`})</span>
                </div>

                {/* Rejection notice box */}
                {item.verification_status === "rejected" && item.rejection_reason && (
                  <div className="mt-2 text-xs bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Rejection Reason:</strong> {item.rejection_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {/* Driver Upload Trigger */}
                <button
                  type="button"
                  onClick={() => setSelectedUploadItem(item)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-ink border border-fogDark transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {item.document_name ? "Re-upload / Photo" : "Upload / Snap"}
                </button>

                {/* Manager Verification Trigger */}
                {(item.verification_status === "pending_verification" ||
                  item.verification_status === "verified") && (
                  <button
                    type="button"
                    onClick={() => setSelectedVerifyItem(item)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.verification_status === "verified" ? "View Verification" : "Manager Verify"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {selectedUploadItem && (
        <DocumentUploadModal
          item={selectedUploadItem}
          isOpen={!!selectedUploadItem}
          onClose={() => setSelectedUploadItem(null)}
          onSave={handleDocumentSave}
        />
      )}

      {/* Manager Verification Modal */}
      {selectedVerifyItem && (
        <ManagerVerificationModal
          item={selectedVerifyItem}
          isOpen={!!selectedVerifyItem}
          onClose={() => setSelectedVerifyItem(null)}
          onConfirmVerification={handleConfirmVerification}
          onRejectVerification={handleRejectVerification}
        />
      )}
    </div>
  );
}
