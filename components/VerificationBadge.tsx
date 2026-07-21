import React from "react";
import { VerificationStatus } from "@/lib/types";

interface VerificationBadgeProps {
  status: VerificationStatus;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  className?: string;
}

export default function VerificationBadge({
  status,
  verifiedBy,
  rejectionReason,
  className = "",
}: VerificationBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <span
          title={verifiedBy ? `Verified by ${verifiedBy}` : "Verified by Manager"}
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-500/30 ${className}`}
        >
          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Verified
        </span>
      );
    case "pending_verification":
      return (
        <span
          title="Uploaded & waiting for manager confirmation"
          className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-500/30 ${className}`}
        >
          <svg className="w-3 h-3 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Pending Review
        </span>
      );
    case "rejected":
      return (
        <span
          title={rejectionReason ? `Reason: ${rejectionReason}` : "Document rejected"}
          className={`inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-500/30 ${className}`}
        >
          <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rejected
        </span>
      );
    case "pending_upload":
    default:
      return (
        <span
          title="No document uploaded yet"
          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200 ${className}`}
        >
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Missing Doc
        </span>
      );
  }
}
