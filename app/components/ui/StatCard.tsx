'use client';

import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';

export type StatCardColor = 'primary' | 'info' | 'success' | 'warning' | 'error' | 'dark';

const ICON_STYLE: Record<StatCardColor, { bg: string; shadow: string }> = {
  primary: { bg: '#013494', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(1,52,148,0.35)'   },
  info:    { bg: '#0277BD', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(2,119,189,0.35)'  },
  success: { bg: '#2E7D32', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(46,125,50,0.35)'  },
  warning: { bg: '#E65100', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(230,81,0,0.35)'   },
  error:   { bg: '#B71C1C', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(183,28,28,0.35)'  },
  dark:    { bg: '#263238', shadow: '0 4px 20px 0 rgba(0,0,0,0.12), 0 7px 10px -5px rgba(38,50,56,0.35)'   },
};

interface StatCardProps {
  color?: StatCardColor;
  icon: React.ReactNode;
  title: string;
  count: string | number;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
}

export default function StatCard({ color = 'primary', icon, title, count, subtitle, subtitleColor }: StatCardProps) {
  const { bg, shadow } = ICON_STYLE[color];
  return (
    <Card sx={{ height: '100%', overflow: 'visible' }}>
      <Box display="flex" justifyContent="space-between" pt={1} px={2}>
        <Box
          sx={{
            backgroundColor: bg,
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '4rem',
            height: '4rem',
            mt: -3,
            flexShrink: 0,
            boxShadow: shadow,
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
