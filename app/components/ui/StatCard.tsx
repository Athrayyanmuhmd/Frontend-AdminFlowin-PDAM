'use client';

import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';

const COLOR_GRADIENT: Record<string, string> = {
  primary: 'linear-gradient(195deg, #3b6fce, #013494)',
  info:    'linear-gradient(195deg, #49a3f1, #1A73E8)',
  success: 'linear-gradient(195deg, #66BB6A, #43A047)',
  warning: 'linear-gradient(195deg, #FFA726, #FB8C00)',
  error:   'linear-gradient(195deg, #EF5350, #E53935)',
  dark:    'linear-gradient(195deg, #42424a, #191919)',
};

const COLOR_SHADOW: Record<string, string> = {
  primary: 'rgba(1,52,148,0.4)',
  info:    'rgba(26,115,232,0.4)',
  success: 'rgba(67,160,71,0.4)',
  warning: 'rgba(251,140,0,0.4)',
  error:   'rgba(229,57,53,0.4)',
  dark:    'rgba(25,25,25,0.4)',
};

export type StatCardColor = keyof typeof COLOR_GRADIENT;

interface StatCardProps {
  color?: StatCardColor;
  icon: React.ReactNode;
  title: string;
  count: string | number;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
}

export default function StatCard({ color = 'primary', icon, title, count, subtitle, subtitleColor }: StatCardProps) {
  const gradient = COLOR_GRADIENT[color] ?? COLOR_GRADIENT.primary;
  const shadow = COLOR_SHADOW[color] ?? COLOR_SHADOW.primary;

  return (
    <Card sx={{ height: '100%', overflow: 'visible' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" pt={1} px={2} sx={{ minHeight: 84 }}>
        <Box
          sx={{
            background: gradient,
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '4rem',
            height: '4rem',
            mt: -3,
            flexShrink: 0,
            boxShadow: `0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px ${shadow}`,
            color: '#fff',
          }}
        >
          {icon}
        </Box>
        <Box textAlign="right" sx={{ minWidth: 0, flex: 1, pl: 1, pt: 0.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              display: 'block',
              lineHeight: 1.4,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.75, lineHeight: 1.2 }}>
            {count}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mt: 1.5, mb: 1 }} />
      <Box pb={1.5} px={2}>
        <Typography variant="caption" color={subtitleColor ?? 'text.secondary'} sx={{ fontWeight: 500 }}>
          {subtitle ?? '\u00A0'}
        </Typography>
      </Box>
    </Card>
  );
}