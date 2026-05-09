'use client';

import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';

const ICON_BG = '#013494';
const ICON_SHADOW = '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(1,52,148,0.35)';

export type StatCardColor = 'primary' | 'info' | 'success' | 'warning' | 'error' | 'dark';

interface StatCardProps {
  color?: StatCardColor;
  icon: React.ReactNode;
  title: string;
  count: string | number;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
}

export default function StatCard({ color = 'primary', icon, title, count, subtitle, subtitleColor }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', overflow: 'visible' }}>
      <Box display="flex" justifyContent="space-between" pt={1} px={2}>
        <Box
          sx={{
            backgroundColor: ICON_BG,
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '4rem',
            height: '4rem',
            mt: -3,
            flexShrink: 0,
            boxShadow: ICON_SHADOW,
            color: '#fff',
          }}
        >
          {icon}
        </Box>
        <Box textAlign="right" lineHeight={1.25} sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, display: 'block', lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
            {count}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Box pb={1.5} px={2}>
        <Typography variant="caption" color={subtitleColor ?? 'text.secondary'}>
          {subtitle ?? ' '}
        </Typography>
      </Box>
    </Card>
  );
}
