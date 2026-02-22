// @ts-nocheck
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
}

export default function DashboardLineChart({ data }: DashboardLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bulan" />
        <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
        <Tooltip
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
          stroke="#2196F3"
          strokeWidth={3}
          dot={{ r: 4 }}
          name="totalTagihan"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
