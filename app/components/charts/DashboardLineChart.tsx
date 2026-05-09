'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardLineChartProps {
  data: any[];
  darkMode?: boolean;
}

export default function DashboardLineChart({ data, darkMode = false }: DashboardLineChartProps) {
  const textColor  = darkMode ? 'rgba(255,255,255,0.85)' : '#666';
  const gridColor  = darkMode ? 'rgba(255,255,255,0.15)' : '#e0e0e0';
  const lineColor  = darkMode ? '#ffffff' : '#013494';
  const dotFill    = darkMode ? '#ffffff' : '#013494';
  const dotStroke  = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(1,52,148,0.3)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="bulan"
          tick={{ fill: textColor, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={4}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontSize: 12,
            padding: '8px 12px',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#333' }}
          formatter={(value: any, name: string) => [
            name === 'totalTagihan'
              ? `Rp ${Number(value).toLocaleString('id-ID')}`
              : `${value} tagihan`,
            name === 'totalTagihan' ? 'Total Pendapatan' : 'Jumlah Tagihan',
          ]}
        />
        <Line
          type="monotone"
          dataKey="totalTagihan"
          stroke={lineColor}
          strokeWidth={2.5}
          dot={{ r: 4, fill: dotFill, stroke: dotStroke, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: dotFill, stroke: '#fff', strokeWidth: 2 }}
          name="totalTagihan"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}