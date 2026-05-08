'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title = 'Belum ada data', description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        gap: 1.5,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ fontSize: 56, lineHeight: 1, opacity: 0.3 }}>
        {icon ?? <InboxIcon sx={{ fontSize: 'inherit' }} />}
      </Box>
      <Typography variant='h6' fontWeight={600} color='text.secondary'>
        {title}
      </Typography>
      {description && (
        <Typography variant='body2' color='text.disabled' textAlign='center' maxWidth={360}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant='outlined' size='small' onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
