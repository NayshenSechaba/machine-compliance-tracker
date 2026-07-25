"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Using local type declaration for standalone component
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

interface NotificationBellProps {
  complianceItems: ComplianceItem[];
}

export default function NotificationBell({ complianceItems }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const expired = complianceItems.filter(item => item.status === 'expired');
  const critical = complianceItems.filter(item => item.status === 'critical');
  const warning = complianceItems.filter(item => item.status === 'warning');

  const badgeCount = expired.length + critical.length;
  
  const hasNotifications = badgeCount > 0 || warning.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors relative text-steel focus:outline-none"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full px-1">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-fogDark z-50 transform origin-top-right transition-transform scale-100">
          <div className="p-4 border-b border-fogDark flex justify-between items-center">
            <h3 className="font-display font-medium text-ink">Notifications</h3>
            <span className="text-xs font-mono text-steelLight">{badgeCount + warning.length} items</span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {!hasNotifications ? (
              <div className="p-6 text-center text-emerald-600 font-medium text-sm flex flex-col items-center">
                <svg className="w-8 h-8 mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All documents are current ✓
              </div>
            ) : (
              <div className="flex flex-col">
                {expired.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50">Expired</div>
                    {expired.map(item => (
                      <Link href="/vault" key={item.id} className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                        <div className="text-sm font-medium text-ink">{item.item_type}</div>
                        <div className="text-xs text-steel mt-0.5">{item.operator_name || item.asset_name}</div>
                        <div className="text-xs text-rose-600 mt-1 font-mono">{Math.abs(item.days_to_expiry)}d overdue</div>
                      </Link>
                    ))}
                  </div>
                )}
                
                {critical.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50">Critical (≤7 days)</div>
                    {critical.map(item => (
                      <Link href="/vault" key={item.id} className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                        <div className="text-sm font-medium text-ink">{item.item_type}</div>
                        <div className="text-xs text-steel mt-0.5">{item.operator_name || item.asset_name}</div>
                        <div className="text-xs text-amber-600 mt-1 font-mono">expires in {item.days_to_expiry}d</div>
                      </Link>
                    ))}
                  </div>
                )}
                
                {warning.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-xs font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50">Warning (≤30 days)</div>
                    {warning.map(item => (
                      <Link href="/vault" key={item.id} className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                        <div className="text-sm font-medium text-ink">{item.item_type}</div>
                        <div className="text-xs text-steel mt-0.5">{item.operator_name || item.asset_name}</div>
                        <div className="text-xs text-yellow-600 mt-1 font-mono">expires in {item.days_to_expiry}d</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-fogDark text-center bg-slate-50 rounded-b-xl">
            <Link href="/vault" className="text-xs text-amber-600 hover:text-amber-700 font-medium font-body">
              View all in Vault &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
