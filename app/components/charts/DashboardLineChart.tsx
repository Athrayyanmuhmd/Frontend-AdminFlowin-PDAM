'use client';

import React from 'react';
import {
  AreaChart,
  Area,
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

/**
 * Grafik pendapatan — area chart dengan gradient (acuan visual Attex).
 * Data shape sama: { bulan, totalTagihan }.
 */
export default function DashboardLineChart({ data, darkMode = false }: DashboardLineChartProps) {
  const textColor = darkMode ? 'rgba(255,255,255,0.8)' : '#697a8d';
  const gridColor = darkMode ? 'rgba(255,255,255,0.15)' : '#eef0f3';
  const lineColor = darkMode ? '#5b8def' : '#013494';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
            <stop offset="75%" stopColor={lineColor} stopOpacity={0.04} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="bulan"
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
            return `${v}`;
          }}
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 4' }}
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.97)',
            border: 'none',
            borderRadius: 10,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            fontSize: 12,
          }}
          formatter={(value: any, name: string) => [
            name === 'totalTagihan'
              ? `Rp ${Number(value).toLocaleString('id-ID')}`
              : `${value} tagihan`,
            name === 'totalTagihan' ? 'Total Pendapatan' : 'Jumlah Tagihan',
          ]}
        />
        <Area
          type="monotone"
          dataKey="totalTagihan"
          stroke={lineColor}
          strokeWidth={3}
          fill="url(#revenueGradient)"
          dot={{ r: 3, fill: '#fff', stroke: lineColor, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
          name="totalTagihan"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
