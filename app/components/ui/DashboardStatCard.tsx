'use client';

import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

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
}: DashboardStatCardProps) {
  const statusColorKey =
    status === 'good' ? 'success'
    : status === 'warning' ? 'warning'
    : status === 'bad' ? 'error'
    : 'info';

  const TrendIcon =
    trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : RemoveIcon;

  return (
    <Card
      sx={{
        height: '100%',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 24px -6px rgba(0,0,0,0.18)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mt: 0.75, lineHeight: 1.1, fontSize: { xs: '1.6rem', sm: '2rem' } }}
          >
            {value}
          </Typography>
        </Box>

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
      </Box>

      <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {caption}
        </Typography>
      </Box>
    </Card>
  );
}
