"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell
} from 'recharts';
import { DefectRecord } from '../../lib/types';

interface Props {
  defects: DefectRecord[];
}

export default function DefectFrequencyChart({ defects }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    defects.forEach(d => {
      counts[d.item_label] = (counts[d.item_label] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [defects]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-fogDark p-6 flex flex-col h-full w-full">
      <h3 className="font-display text-lg font-semibold text-ink mb-4">Top Failing Checklist Items</h3>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
            <XAxis 
              type="number" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              dataKey="item" 
              type="category" 
              tick={{ fill: '#0f172a', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              width={120}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
            <Bar dataKey="count" name="Defects" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="url(#colorRedGradient)" />
              ))}
              <LabelList dataKey="count" position="right" style={{ fill: '#64748b', fontSize: 12, fontFamily: 'var(--font-plex-mono, monospace)' }} />
            </Bar>
            <defs>
              <linearGradient id="colorRedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#e11d48" stopOpacity={1} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
