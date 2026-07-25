export interface AuditEntry {
  id: string;
  entity_type: 'asset' | 'operator' | 'inspection' | 'defect' | 'compliance';
  entity_id: string;
  entity_name: string;  // human readable name
  action: string;       // 'created' | 'updated' | 'status_changed' | 'override' | 'assigned' | 'resolved' | 'inspection_submitted' | 'defect_created' | 'document_uploaded' | 'document_verified' | 'document_rejected'
  actor_name: string;   // who performed the action
  actor_role: string;   // role at time of action
  details: Record<string, any>;  // flexible payload
  created_at: string;   // ISO timestamp
}

const STORAGE_KEY = 'ops_gate_audit_log';

function getStoredLogs(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse audit logs from local storage', error);
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditEntry, 'id' | 'created_at'>): AuditEntry {
  const newEntry: AuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const logs = getStoredLogs();
    logs.unshift(newEntry); // newest first
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit log to local storage', error);
    }
  }

  return newEntry;
}

export function getAuditLog(): AuditEntry[] {
  return getStoredLogs();
}

export function getEntityAuditLog(entityType: string, entityId: string): AuditEntry[] {
  return getStoredLogs().filter(
    (log) => log.entity_type === entityType && log.entity_id === entityId
  );
}

export function getRecentAuditLog(limit: number): AuditEntry[] {
  return getStoredLogs().slice(0, limit);
}
