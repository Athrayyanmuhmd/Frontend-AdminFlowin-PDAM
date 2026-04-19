'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { useTeknisiAuth } from '@/app/hooks/useTeknisiAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeknisiLoginDialog({
  open,
  onClose,
  onSuccess,
}: Props) {
  const { login } = useTeknisiAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Login Sistem Teknisi</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Masukkan kredensial akun admin pada sistem teknisi untuk mengakses
          fitur ini.
        </Typography>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label='Email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            fullWidth
            label='Password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant='contained'
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? <CircularProgress size={20} /> : 'Login'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
