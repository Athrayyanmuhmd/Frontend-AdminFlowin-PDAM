'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import Image from 'next/image';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const role: 'admin' | 'technician' = 'admin';
  const { login, isLoading } = useAdmin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    try {
      const success = await login(email, password, role);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Login gagal. Periksa kembali email dan password.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Email atau password salah');
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    /* Outer page — cream/beige background like reference */
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f0ece8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 5 },
      }}
    >
      {/* ── Floating Card ── */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 840,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          minHeight: 520,
          boxShadow: '0 2px 18px rgba(0,0,0,0.1)','
        }}
      >
        {/* ── LEFT: Form ── */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* AuthLogo area — centered at top, with bottom border */}
          <Box
            sx={{
              p: 2.5,
              textAlign: 'center',
              borderBottom: '1px solid #f1f3f4',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Image
                src="/assets/logo/Aqualink.png"
                alt="Aqualink"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
              />
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e', letterSpacing: 0.3 }}>
                Aqualink
              </Typography>
            </Box>
          </Box>

          {/* Form area — vertically centered */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 3, sm: 5 },
              py: 4,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: '#1a1a2e', textAlign: 'center', mb: 0.75 }}
            >
              Sign In
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#9ca3af', textAlign: 'center', mb: 3.5, lineHeight: 1.7 }}
            >
              Enter your email address and password to<br />access account.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8rem', py: 0.5 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 0.75 }}>
                Email address
              </Typography>
              <TextField
                fullWidth
                placeholder="user@pdam.go.id"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoComplete="email"
                size="small"
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#4b9cf5' },
                    '&.Mui-focused fieldset': { borderColor: '#4b9cf5', borderWidth: 1.5 },
                  },
                }}
              />

              {/* Password label row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                  Password
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Forgot your password?
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                        {showPassword
                          ? <VisibilityOff sx={{ fontSize: 18, color: '#9ca3af' }} />
                          : <Visibility sx={{ fontSize: 18, color: '#9ca3af' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#4b9cf5' },
                    '&.Mui-focused fieldset': { borderColor: '#4b9cf5', borderWidth: 1.5 },
                  },
                }}
              />

              {/* Remember me */}
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    sx={{ color: '#d1d5db', p: 0.5, '&.Mui-checked': { color: '#4b9cf5' } }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.82rem' }}>
                    Remember me
                  </Typography>
                }
                sx={{ mb: 2.5 }}
              />

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                startIcon={
                  isLoading
                    ? <CircularProgress size={16} color="inherit" />
                    : <LoginIcon sx={{ fontSize: 18 }} />
                }
                sx={{
                  py: 1.25,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  bgcolor: '#4b9cf5',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#2b7de9', boxShadow: 'none' },
                  '&:disabled': { opacity: 0.7 },
                }}
              >
                {isLoading ? 'Memproses...' : 'Log In'}
              </Button>
            </form>
          </Box>
        </Box>

        {/* ── RIGHT: Visual Panel ── */}
        <Box
          sx={{
            width: '45%',
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            background: 'linear-gradient(160deg, #0a2458 0%, #1356b4 40%, #1a8fd1 75%, #28c4e6 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

          {/* Ripple rings */}
          {[100, 190, 280, 370].map((size, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: size, height: size,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${0.14 - i * 0.025})`,
              }}
            />
          ))}

          {/* Center content */}
          <Box
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              p: 4, zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: 76, height: 76,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 3,
              }}
            >
              <Image
                src="/assets/logo/Aqualink.png"
                alt="Aqualink"
                width={42}
                height={42}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, textAlign: 'center', mb: 1 }}>
              PERUMDAM Tirta Daroy
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 1.8 }}>
              Sistem Administrasi Terintegrasi<br />Smart Water Meter<br />Kota Banda Aceh
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Below card — like reference */}
      <Typography variant="body2" sx={{ mt: 3, color: '#6b7280', fontWeight: 400 }}>
        Panel administrasi —{' '}
        <Box component="span" sx={{ color: '#1a1a2e', fontWeight: 600 }}>
          PERUMDAM Tirta Daroy Kota Banda Aceh
        </Box>
      </Typography>
    </Box>
  );
}
