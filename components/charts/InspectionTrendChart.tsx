"use client";

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
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

export default function InspectionTrendChart({ inspections }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const weeks: Record<string, { total: number; passed: number }> = {};
    
    // Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      weeks[key] = { total: 0, passed: 0 };
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
        weeks[key].total++;
        if (insp.status === 'accepted') {
          weeks[key].passed++;
        }
      }
    });

    return Object.keys(weeks).sort().map(key => {
      const w = weeks[key];
      const passRate = w.total > 0 ? Math.round((w.passed / w.total) * 100) : 0;
      return {
        week: key,
        label: `Week of ${key}`,
        total: w.total,
        passRate: passRate
      };
    });
  }, [inspections]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-fogDark p-6 flex flex-col h-full w-full">
      <h3 className="font-display text-lg font-semibold text-ink mb-4">Inspection Trends (12 Weeks)</h3>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              yAxisId="left" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              tick={{ fill: '#10b981', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'var(--font-plex-sans, sans-serif)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
              labelFormatter={(label, payload) => payload[0]?.payload.label || label}
            />
            <Legend wrapperStyle={{ fontSize: '14px', color: '#64748b' }} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="total" 
              name="Total Inspections"
              fill="#e2e8f0" 
              stroke="#94a3b8" 
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="passRate" 
              name="Pass Rate %"
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
