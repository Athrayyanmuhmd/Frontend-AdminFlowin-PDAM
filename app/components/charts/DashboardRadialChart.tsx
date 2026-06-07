'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Tooltip,
  PolarAngleAxis,
} from 'recharts';

interface RadialDatum {
  name: string;
  value: number;
  fill: string;
}

interface DashboardRadialChartProps {
  data: RadialDatum[];
}

/**
 * "Circle Chart - Custom Angle" (acuan Attex) — radial bar konsentris.
 * Legend manual di kiri (nama: jumlah), grafik di kanan.
 */
export default function DashboardRadialChart({ data }: DashboardRadialChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 2, pl: 2, pr: 1 }}>
      {/* Legend kiri */}
      <Box sx={{ flexShrink: 0, minWidth: 0 }}>
        {data.map((d) => (
          <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: d.fill, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {d.name}: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{d.value}</Box>
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Radial chart kanan */}
      <Box sx={{ flex: 1, height: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="100%"
            barSize={13}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#eef0f3' }}
              dataKey="value"
              cornerRadius={8}
              isAnimationActive={false}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }: any) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0]?.payload;
                return (
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      borderRadius: 2,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item?.name}: {item?.value} pelanggan
                    </Typography>
                  </Box>
                );
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
