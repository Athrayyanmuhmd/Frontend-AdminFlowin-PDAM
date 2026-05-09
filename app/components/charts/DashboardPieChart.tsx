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
  darkMode?: boolean;
}

export default function DashboardPieChart({ data, darkMode = false }: DashboardPieChartProps) {
  const textColor = darkMode ? 'rgba(255,255,255,0.85)' : '#555';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="42%"
          innerRadius={45}
          outerRadius={80}
          paddingAngle={4}
          dataKey="jumlahMeteran"
          nameKey="namaKelompok"
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 12,
          }}
          formatter={(value: any, name: string) => [
            `${Number(value).toLocaleString('id-ID')} meteran`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: textColor }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
