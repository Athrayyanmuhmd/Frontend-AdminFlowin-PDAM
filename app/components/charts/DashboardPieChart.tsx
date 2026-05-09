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
  showLegend?: boolean;
}

export default function DashboardPieChart({ data, darkMode = false, showLegend = true }: DashboardPieChartProps) {
  const textColor = darkMode ? 'rgba(255,255,255,0.85)' : '#555';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy={showLegend ? "42%" : "50%"}
          innerRadius={showLegend ? 40 : 50}
          outerRadius={showLegend ? 72 : 85}
          paddingAngle={3}
          dataKey="jumlahMeteran"
          nameKey="namaKelompok"
          strokeWidth={0}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontSize: 12,
            padding: '8px 12px',
          }}
          formatter={(value: any, name: string) => [
            `${Number(value).toLocaleString('id-ID')} meteran`,
            name,
          ]}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: textColor }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}