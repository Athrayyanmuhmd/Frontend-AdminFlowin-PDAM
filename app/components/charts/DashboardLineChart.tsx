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
  const textColor  = darkMode ? 'rgba(255,255,255,0.8)' : '#666';
  const gridColor  = darkMode ? 'rgba(255,255,255,0.2)' : '#e0e0e0';
  const lineColor  = darkMode ? '#fff' : '#013494';
  const dotFill    = darkMode ? '#fff' : '#013494';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="bulan"
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={{ stroke: gridColor }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 12,
          }}
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
          dot={{ r: 4, fill: dotFill, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: dotFill }}
          name="totalTagihan"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
