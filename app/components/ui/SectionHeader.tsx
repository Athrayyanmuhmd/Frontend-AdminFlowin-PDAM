'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Judul seksi form bergaya Attex — ikon dalam kotak ber-tint lembut + judul.
 * Tanpa gradient. Dipakai di form (mis. Registrasi Pelanggan).
 */
type SectionColor = 'primary' | 'info' | 'success' | 'warning' | 'error';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: SectionColor;
}

export default function SectionHeader({ icon, title, subtitle, color = 'primary' }: SectionHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette[color].main, 0.12),
          color: (t) => t.palette[color].main,
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
