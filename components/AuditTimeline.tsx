"use client";

import React, { useEffect, useState } from 'react';
import { getEntityAuditLog, AuditEntry } from '../lib/auditLog';

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
  maxEntries?: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) return `${diffInDays}d ago`;
  if (diffInHours > 0) return `${diffInHours}h ago`;
  if (diffInMins > 0) return `${diffInMins}m ago`;
  return 'just now';
}

function getActionColor(action: string): string {
  switch (action) {
    case 'created':
    case 'inspection_submitted':
    case 'resolved':
    case 'document_verified':
      return 'bg-emerald-500';
    case 'updated':
    case 'assigned':
      return 'bg-blue-500';
    case 'status_changed':
    case 'override':
      return 'bg-amber-500';
    case 'defect_created':
    case 'document_rejected':
      return 'bg-rose-500';
    default:
      return 'bg-steelLight';
  }
}

export default function AuditTimeline({ entityType, entityId, maxEntries }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = () => {
      let data = getEntityAuditLog(entityType, entityId);
      if (maxEntries) {
        data = data.slice(0, maxEntries);
      }
      setLogs(data);
    };
    fetchLogs();
    
    // Listen for storage changes if logs are updated in same window
    window.addEventListener('storage', fetchLogs);
    return () => window.removeEventListener('storage', fetchLogs);
  }, [entityType, entityId, maxEntries]);

  if (logs.length === 0) {
    return (
      <div className="text-steelLight italic text-sm py-4">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="relative max-h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-fogDark">
      {/* Vertical line */}
      <div className="absolute left-[80px] top-4 bottom-4 w-px bg-fogDark" />
      
      <div className="space-y-6 relative">
        {logs.map((log) => (
          <div key={log.id} className="flex group">
            {/* Time */}
            <div className="w-[80px] flex-shrink-0 pt-1 pr-4 text-right">
              <span className="text-xs text-steelLight font-mono">
                {formatRelativeTime(log.created_at)}
              </span>
            </div>
            
            {/* Dot & Line Connection */}
            <div className="relative flex-shrink-0 w-8 flex justify-center -ml-4">
              <div className={`h-3 w-3 rounded-full mt-1.5 ring-4 ring-white ${getActionColor(log.action)} z-10`} />
            </div>

            {/* Content */}
            <div className="flex-grow pt-0.5 pb-2">
              <div className="text-sm font-body">
                <span className="text-ink font-medium capitalize">
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-xs text-steel mt-0.5">
                by <span className="font-medium text-ink">{log.actor_name}</span> ({log.actor_role})
              </div>
              
              {/* Expandable Details */}
              {Object.keys(log.details).length > 0 && (
                <div className="mt-2">
                  <button 
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium font-body transition-colors"
                  >
                    {expandedId === log.id ? 'Hide details' : 'Show details'}
                  </button>
                  {expandedId === log.id && (
                    <div className="mt-2 bg-slate-50 p-3 rounded border border-fogDark text-xs font-mono text-steel overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom fade */}
      <div className="sticky bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}
