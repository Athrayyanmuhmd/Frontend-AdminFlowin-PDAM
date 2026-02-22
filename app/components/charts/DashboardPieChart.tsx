// @ts-nocheck
'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardPieChartProps {
  data: any[];
}

export default function DashboardPieChart({ data }: DashboardPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={100}
          paddingAngle={4}
          dataKey="jumlahMeteran"
          nameKey="namaKelompok"
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any, name: string) => [
            `${Number(value).toLocaleString('id-ID')} meteran`,
            name,
          ]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
