'use client';
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  /** Auto-hide duration in ms. Default: 4000 */
  duration?: number;
}

/**
 * Reusable toast snackbar. Pair with useToast() hook.
 *
 * Usage:
 *   <ToastSnackbar {...toastState} onClose={closeToast} />
 */
export default function ToastSnackbar({
  open,
  message,
  severity,
  onClose,
  duration = 4000,
}: ToastSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={severity} onClose={onClose} variant='filled' sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
