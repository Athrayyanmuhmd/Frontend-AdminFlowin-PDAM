'use client';
import { useState } from 'react';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

/**
 * Reusable toast/snackbar state hook.
 *
 * Usage:
 *   const { toastState, showToast, closeToast } = useToast();
 *   showToast('Berhasil disimpan', 'success');
 *   showToast(err.message, 'error');
 *
 *   <ToastSnackbar {...toastState} onClose={closeToast} />
 */
export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: Severity = 'success') => {
    setToastState({ open: true, message, severity });
  };

  const closeToast = () => setToastState((s) => ({ ...s, open: false }));

  return { toastState, showToast, closeToast };
}
