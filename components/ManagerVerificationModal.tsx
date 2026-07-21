"use client";

import React, { useState, useEffect } from "react";
import { ComplianceItem } from "@/lib/types";

interface ManagerVerificationModalProps {
  item: ComplianceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmVerification: (
    itemId: string,
    refNumber: string,
    expiryDate: string,
    managerName: string
  ) => void;
  onRejectVerification: (itemId: string, reason: string) => void;
}

export default function ManagerVerificationModal({
  item,
  isOpen,
  onClose,
  onConfirmVerification,
  onRejectVerification,
}: ManagerVerificationModalProps) {
  const [refNumber, setRefNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [managerName, setManagerName] = useState<string>("Thandi Khumalo (Site Manager)");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  useEffect(() => {
    if (item) {
      setRefNumber(item.reference_number || item.ocr_data?.reference_number || "");
      setExpiryDate(item.expiry_date || item.ocr_data?.expiry_date || "");
      setIsRejecting(false);
      setRejectionReason("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmVerification(item.id, refNumber, expiryDate, managerName);
    onClose();
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    onRejectVerification(item.id, rejectionReason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-fogDark rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex items-center justify-between bg-steelDark/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-ink">
                Manager Verification & Sign-Off
              </h2>
              <p className="text-xs text-steelLight">
                Verify uploaded documentation & confirm extracted fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-steelLight hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-fogDark/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body: Side-by-Side View */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Left Panel: Document Image Preview */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-steelLight font-mono">
                Uploaded Document Attachment
              </span>
              <span className="text-xs text-steelLight font-mono">
                {item.document_name || "scanned_document.jpg"}
              </span>
            </div>

            <div className="relative border border-fogDark rounded-xl bg-slate-900 min-h-[300px] flex items-center justify-center overflow-hidden p-2">
              <img
                src={
                  item.document_url ||
                  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
                }
                alt="Document Attachment"
                className="max-h-[360px] w-auto object-contain rounded shadow"
              />
            </div>

            {/* Raw OCR Text Drawer */}
            {item.ocr_data?.raw_text && (
              <div className="border border-fogDark rounded-lg p-3 bg-slate-50 text-[11px] font-mono space-y-1">
                <p className="font-semibold text-steel font-sans text-xs">Raw OCR Detected Text:</p>
                <p className="text-steelLight whitespace-pre-line max-h-24 overflow-y-auto leading-relaxed bg-white p-2 rounded border border-fogDark">
                  {item.ocr_data.raw_text}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Data Verification Form */}
          <div className="flex flex-col justify-between space-y-4 bg-slate-50/60 p-5 rounded-xl border border-fogDark">
            <div className="space-y-4">
              <div className="border-b border-fogDark pb-3">
                <span className="text-xs text-steelLight uppercase font-mono font-semibold">
                  Target Compliance Item
                </span>
                <p className="text-base font-bold text-ink">
                  {item.operator_name ? `Operator: ${item.operator_name}` : `Asset: ${item.asset_name}`}
                </p>
                <p className="text-xs text-steel font-medium capitalize mt-0.5">
                  {item.item_type.replace(/_/g, " ")}
                </p>
              </div>

              {/* OCR Confidence Banner */}
              {item.ocr_data && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center text-emerald-800 font-semibold">
                    <span>OCR Scan Accuracy</span>
                    <span className="font-mono">{item.ocr_data.confidence}% Confidence</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Fields auto-populated from scanned document. Please verify correctness below.
                  </p>
                </div>
              )}

              {/* Form fields to verify/correct */}
              <form id="verify-form" onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-steel mb-1">
                    Document Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. PRDP-88213"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ember/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-steel mb-1">
                    Confirmed Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ember/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-steel mb-1">
                    Verifying Manager Name
                  </label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ember/50"
                  />
                </div>
              </form>

              {/* Rejection Mode View */}
              {isRejecting && (
                <form id="reject-form" onSubmit={handleReject} className="space-y-3 pt-2 border-t border-rose-200">
                  <label className="block text-xs font-bold text-rose-700">
                    Specify Reason for Rejection:
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Image blurry, unreadable expiry date stamp, or wrong document uploaded."
                    className="w-full p-2.5 text-xs rounded-lg border border-rose-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 text-xs text-steelLight hover:text-ink font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-sm"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Action Buttons */}
            {!isRejecting && (
              <div className="flex items-center justify-between pt-4 border-t border-fogDark gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Document
                </button>

                <button
                  type="submit"
                  form="verify-form"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Verify & Confirm Documentation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
