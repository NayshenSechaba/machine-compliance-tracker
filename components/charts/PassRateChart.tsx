"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { InspectionRecord } from '../../lib/types';

interface Props {
  inspections: InspectionRecord[];
}

export default function PassRateChart({ inspections }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const weeks: Record<string, { pass: number; passOverride: number; fail: number }> = {};
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      weeks[key] = { pass: 0, passOverride: 0, fail: 0 };
    }

    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    inspections.forEach(insp => {
      const d = new Date(insp.created_at);
      if (d < twelveWeeksAgo) return;

      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date(d).setDate(diff));
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      
      if (weeks[key]) {
        if (insp.status === 'accepted') {
          if (insp.supervisor_override_by) {
            weeks[key].passOverride++;
          } else {
            weeks[key].pass++;
          }
        } else {
          weeks[key].fail++;
        }
      }
    });

    return Object.keys(weeks).sort().map(key => ({
      week: key,
      pass: weeks[key].pass,
      passOverride: weeks[key].passOverride,
      fail: weeks[key].fail
    }));
  }, [inspections]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-fogDark p-6 flex flex-col h-full w-full">
      <h3 className="font-display text-lg font-semibold text-ink mb-4">Inspection Outcomes</h3>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
            <XAxis 
              dataKey="week" 
              tickFormatter={(val) => {
                const [, m, d] = val.split('-');
                return `${m}/${d}`;
              }}
              tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'var(--font-plex-mono, monospace)' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'var(--font-plex-sans, sans-serif)' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px', color: '#64748b' }} />
            <Bar dataKey="pass" name="Accepted" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="passOverride" name="Accepted (Override)" stackId="a" fill="#f59e0b" />
            <Bar dataKey="fail" name="Rejected" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
