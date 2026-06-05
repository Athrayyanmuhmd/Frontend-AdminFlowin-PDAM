'use client';

import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  YAxis,
} from 'recharts';

/**
 * Kartu statistik dashboard bergaya modern (acuan visual Attex).
 *
 * Khusus untuk halaman /dashboard — sengaja dipisah dari `StatCard.tsx`
 * (yang dipakai billing & master-data) agar perubahan tidak merembet.
 *
 * Catatan: badge menampilkan STATUS nyata (Normal / Perlu perhatian),
 * bukan angka persen karangan — backend tidak menyediakan deret historis per-KPI.
 */

export type StatColor = 'primary' | 'info' | 'success' | 'warning' | 'error';

interface DashboardStatCardProps {
  color?: StatColor;
  icon: React.ReactNode;
  title: string;
  value: string | number;
  /** 'up' | 'down' | 'flat' — arah tren untuk ikon kecil */
  trend?: 'up' | 'down' | 'flat';
  /** 'good' hijau, 'warning' oranye, 'bad' merah, 'neutral' biru */
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  statusLabel?: string;
  caption?: string;
  /** Sembunyikan badge tren — berguna untuk kartu ringkasan jumlah (mis. daftar pelanggan) */
  hideBadge?: boolean;
  /** Deret angka untuk mini-chart (sparkline) di bawah kartu — gaya widget Attex */
  sparkline?: number[];
  /** Bentuk sparkline: 'line' (area) atau 'bar' */
  sparklineType?: 'line' | 'bar';
}

export default function DashboardStatCard({
  color = 'primary',
  icon,
  title,
  value,
  trend = 'flat',
  status = 'neutral',
  statusLabel,
  caption = 'Status terkini',
  hideBadge = false,
  sparkline,
  sparklineType = 'line',
}: DashboardStatCardProps) {
  const theme = useTheme();
  const mainColor = theme.palette[color].main;
  const statusColorKey =
    status === 'good' ? 'success'
    : status === 'warning' ? 'warning'
    : status === 'bad' ? 'error'
    : 'info';

  const hasSpark = Array.isArray(sparkline) && sparkline.length > 1;
  const sparkData = hasSpark ? sparkline!.map((v, i) => ({ i, v })) : [];
  const gradId = `spark-${color}`;
  // Domain ber-padding agar garis "mengambang" rapi di tengah (tidak menukik ke pojok),
  // dan batang punya headroom — tetap enak dilihat walau data sedikit.
  const sparkMin = hasSpark ? Math.min(...sparkline!) : 0;
  const sparkMax = hasSpark ? Math.max(...sparkline!) : 0;
  const sparkPad = (sparkMax - sparkMin) * 0.45 || Math.abs(sparkMax) * 0.2 || 1;
  const lineDomain: [number, number] = [sparkMin - sparkPad, sparkMax + sparkPad];
  const barDomain: [number, number] = [0, sparkMax * 1.15 || 1];

  const TrendIcon =
    trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : RemoveIcon;

  return (
    <Card
      sx={{
        height: '100%',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 24px -6px rgba(0,0,0,0.18)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        {/* Kiri: judul, angka, badge perubahan (gaya widget Attex) */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.1, fontSize: { xs: '1.5rem', sm: '1.9rem' } }}
          >
            {value}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {!hideBadge && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette[statusColorKey].main, 0.14),
                  color: (t) => t.palette[statusColorKey].main,
                  '& svg': { fontSize: 16 },
                }}
              >
                <TrendIcon />
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {statusLabel ?? (status === 'warning' ? 'Perlu perhatian' : 'Normal')}
                </Typography>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {caption}
            </Typography>
          </Box>
        </Box>

        {/* Kanan: mini-chart (gaya Attex) — atau ikon jika tidak ada data chart */}
        {hasSpark ? (
          <Box sx={{ width: '42%', maxWidth: 165, minWidth: 84, height: 56, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              {sparklineType === 'bar' ? (
                <BarChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="16%">
                  <YAxis hide domain={barDomain} />
                  <Bar dataKey="v" fill={mainColor} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              ) : (
                <AreaChart data={sparkData} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={mainColor} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={lineDomain} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={mainColor}
                    strokeWidth={2}
                    fill={`url(#${gradId})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette[color].main, 0.12),
              color: (t) => t.palette[color].main,
              '& svg': { fontSize: 28 },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Card>
  );
}
