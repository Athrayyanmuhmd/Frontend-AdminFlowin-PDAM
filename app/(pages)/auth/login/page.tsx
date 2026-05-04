'use client';

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
    <main>
    {/* Outer page — cream/beige background like reference */}
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
          boxShadow: '0 2px 18px rgba(0,0,0,0.1)',
        }}
      >
        {/* ── LEFT: Form ── */}
        <Box
          sx={{
            flex: { xs: 1, md: 'none' },
            width: { xs: '100%', md: '50%' },
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* AuthLogo area — logo centered at top, with bottom border */}
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottom: '1px solid #f1f3f4',
            }}
          >
            <Image
              src="/assets/logo/logo-tirta-daroy.png"
              alt="PERUMDAM Tirta Daroy"
              width={160}
              height={48}
              style={{ objectFit: 'contain', maxHeight: 48 }}
              priority
            />
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
              Masuk
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#9ca3af', textAlign: 'center', mb: 3.5, lineHeight: 1.7 }}
            >
              Masukkan alamat email dan kata sandi Anda<br />untuk mengakses akun.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8rem', py: 0.5 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 0.75 }}>
                Alamat Email
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
                    '&:hover fieldset': { borderColor: '#7c3aed' },
                    '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: 1.5 },
                  },
                }}
              />

              {/* Password label row */}
              <Box sx={{ mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                  Kata Sandi
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
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showPassword
                          ? <VisibilityOff sx={{ fontSize: 18, color: '#9ca3af' }} />
                          : <Visibility sx={{ fontSize: 18, color: '#9ca3af' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#7c3aed' },
                    '&.Mui-focused fieldset': { borderColor: '#7c3aed', borderWidth: 1.5 },
                  },
                }}
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
                  bgcolor: '#013494',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#012a7a', boxShadow: 'none' },
                  '&:disabled': { opacity: 0.7 },
                }}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </Box>
        </Box>

        {/* ── RIGHT: Image Panel ── */}
        <Box
          sx={{
            width: '50%',
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Image
            src="/assets/gambar-sebelah-kanan-login.png"
            alt=""
            fill
            sizes="420px"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
          />
        </Box>
      </Paper>


    </Box>
    </main>
  );
}
