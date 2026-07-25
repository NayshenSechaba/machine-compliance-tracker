"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ComplianceItem } from '../../lib/types';

interface Props {
  complianceItems: ComplianceItem[];
}

const COLORS = {
  ok: '#10b981',
  warning: '#f59e0b',
  critical: '#f97316',
  expired: '#ef4444'
};

export default function ComplianceHealthGauge({ complianceItems }: Props) {
  const data = useMemo(() => {
    let ok = 0, warning = 0, critical = 0, expired = 0;
    complianceItems.forEach(item => {
      if (item.status === 'ok') ok++;
      else if (item.status === 'warning' || item.status === 'upcoming') warning++;
      else if (item.status === 'critical') critical++;
      else if (item.status === 'expired') expired++;
    });

    return [
      { name: 'OK', value: ok, color: COLORS.ok },
      { name: 'Warning/Upcoming', value: warning, color: COLORS.warning },
      { name: 'Critical', value: critical, color: COLORS.critical },
      { name: 'Expired', value: expired, color: COLORS.expired },
    ].filter(d => d.value > 0);
  }, [complianceItems]);

  const total = complianceItems.length;
  const okCount = data.find(d => d.name === 'OK')?.value || 0;
  const healthPercent = total === 0 ? 0 : Math.round((okCount / total) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-fogDark p-6 flex flex-col h-full w-full">
      <h3 className="font-display text-lg font-semibold text-ink mb-4">Fleet Compliance Health</h3>
      <div className="flex-1 relative min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              itemStyle={{ fontFamily: 'var(--font-plex-sans, sans-serif)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontFamily: 'var(--font-plex-sans, sans-serif)', fontSize: '14px', color: '#64748b' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-[36px]">
          <div className="text-center">
            <span className="block text-3xl font-bold text-ink">{healthPercent}%</span>
            <span className="block text-xs font-mono text-steel">HEALTH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
