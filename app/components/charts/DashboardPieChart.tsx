'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardPieChartProps {
  data: any[];
  darkMode?: boolean;
}

/**
 * Donut distribusi pelanggan — sudut membulat + total di tengah
 * (acuan visual Attex). Data shape sama: { namaKelompok, jumlahMeteran, color }.
 */
export default function DashboardPieChart({ data, darkMode = false }: DashboardPieChartProps) {
  const textColor = darkMode ? 'rgba(255,255,255,0.85)' : '#555';
  const total = data.reduce((acc: number, d: any) => acc + (Number(d.jumlahMeteran) || 0), 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={3}
          cornerRadius={6}
          dataKey="jumlahMeteran"
          nameKey="namaKelompok"
          stroke="none"
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <Label
            position="center"
            content={({ viewBox }: any) => {
              const { cx, cy } = viewBox || {};
              return (
                <g>
                  <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 22, fontWeight: 700, fill: darkMode ? '#fff' : '#013494' }}>
                    {total.toLocaleString('id-ID')}
                  </text>
                  <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 11, fill: textColor }}>
                    Meteran
                  </text>
                </g>
              );
            }}
          />
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.97)',
            border: 'none',
            borderRadius: 10,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
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
