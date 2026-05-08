'use client';

import React from 'react';
import { Box, Button, Typography, Alert, Collapse, IconButton } from '@mui/material';
import { Refresh, ExpandMore, ExpandLess } from '@mui/icons-material';

interface ErrorWithRetryProps {
  /** User-facing error message (Bahasa Indonesia) */
  message?: string;
  /** Raw technical error (optional, shown in expandable detail) */
  detail?: string;
  /** Called when user clicks retry */
  onRetry: () => void;
  /** Whether a retry is currently in progress */
  retrying?: boolean;
}

/**
 * Reusable error state with retry button.
 * Shows a friendly message with optional technical detail (expandable).
 * Used on all detail pages after a failed fetch.
 */
export default function ErrorWithRetry({
  message = 'Gagal memuat data. Silakan coba lagi.',
  detail,
  onRetry,
  retrying = false,
}: ErrorWithRetryProps) {
  const [showDetail, setShowDetail] = React.useState(false);

  return (
    <Box sx={{ my: 2 }}>
      <Alert
        severity='error'
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {detail && (
              <IconButton
                size='small'
                color='inherit'
                onClick={() => setShowDetail((v) => !v)}
                aria-label={showDetail ? 'Sembunyikan detail' : 'Lihat detail'}
              >
                {showDetail ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
              </IconButton>
            )}
            <Button
              size='small'
              color='inherit'
              startIcon={<Refresh />}
              onClick={onRetry}
              disabled={retrying}
            >
              {retrying ? 'Memuat...' : 'Coba Lagi'}
            </Button>
          </Box>
        }
      >
        <Typography variant='body2'>{message}</Typography>
      </Alert>

      {detail && (
        <Collapse in={showDetail}>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: 'grey.100',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
            }}
          >
            <Typography variant='caption' color='text.secondary' fontFamily='monospace'>
              {detail}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
