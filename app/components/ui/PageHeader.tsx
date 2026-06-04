'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Header halaman standar bergaya Attex — judul + subjudul opsional di kiri,
 * area aksi (tombol/dll) di kanan. Tanpa gradient.
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
