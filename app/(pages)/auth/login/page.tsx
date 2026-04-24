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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  EmailOutlined,
  LockOutlined,
  WaterDrop,
  VerifiedUser,
  People,
  BarChart,
} from '@mui/icons-material';
import Image from 'next/image';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const role = 'admin';
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    { icon: <VerifiedUser sx={{ fontSize: 20 }} />, text: 'Manajemen data pelanggan terintegrasi' },
    { icon: <People sx={{ fontSize: 20 }} />, text: 'Pengelolaan teknisi lapangan real-time' },
    { icon: <BarChart sx={{ fontSize: 20 }} />, text: 'Laporan & analitik konsumsi air' },
    { icon: <WaterDrop sx={{ fontSize: 20 }} />, text: 'Monitoring smart water meter' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f5f7fa' }}>
      {/* ── Left Panel: Branding ── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(160deg, #0d47a1 0%, #1565c0 40%, #0288d1 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        {/* decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', top: '40%', right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5, zIndex: 1 }}>
          <Image
            src="/assets/logo/Aqualink.png"
            alt="Aqualink Logo"
            width={52}
            height={52}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, lineHeight: 1 }}>
              Aqualink
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
              ADMIN PANEL
            </Typography>
          </Box>
        </Box>

        {/* Headline */}
        <Box sx={{ textAlign: 'center', mb: 5, zIndex: 1, maxWidth: 420 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2, lineHeight: 1.2 }}>
            Sistem Administrasi
          </Typography>
          <Typography variant="h3" sx={{ color: '#90caf9', fontWeight: 700, mb: 3, lineHeight: 1.2 }}>
            Smart Water Meter
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
            Platform terintegrasi untuk pengelolaan operasional PERUMDAM Tirta Daroy Kota Banda Aceh
          </Typography>
        </Box>

        {/* Feature list */}
        <Box sx={{ width: '100%', maxWidth: 380, zIndex: 1 }}>
          {features.map((f, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Box sx={{ color: '#90caf9', flexShrink: 0 }}>{f.icon}</Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {f.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 5, zIndex: 1 }}>
          © 2024 PERUMDAM Tirta Daroy Kota Banda Aceh
        </Typography>
      </Box>

      {/* ── Right Panel: Login Form ── */}
      <Box
        sx={{
          width: { xs: '100%', lg: 480 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'white',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.06)',
        }}
      >
        {/* Mobile logo */}
        <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Image
            src="/assets/logo/Aqualink.png"
            alt="Aqualink Logo"
            width={36}
            height={36}
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d47a1' }}>
            Aqualink Admin
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>
            Selamat Datang 👋
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280' }}>
            Masukkan email dan password untuk mengakses panel administrasi.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.75 }}>
              Alamat Email
            </Typography>
            <TextField
              fullWidth
              placeholder="nama@pdam.go.id"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              autoComplete="email"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: '#9ca3af', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f9fafb',
                  '&:hover fieldset': { borderColor: '#1565c0' },
                  '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                },
              }}
            />
          </Box>

          {/* Password */}
          <Box sx={{ mt: 2.5, mb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                Password
              </Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="Masukkan password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#9ca3af', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20, color: '#9ca3af' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20, color: '#9ca3af' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f9fafb',
                  '&:hover fieldset': { borderColor: '#1565c0' },
                  '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                },
              }}
            />
          </Box>

          {/* Remember me */}
          <Box sx={{ mt: 1.5, mb: 3 }}>
            <FormControlLabel
              control={<Checkbox size="small" sx={{ color: '#1565c0', '&.Mui-checked': { color: '#1565c0' } }} />}
              label={<Typography variant="body2" sx={{ color: '#6b7280' }}>Ingat saya</Typography>}
            />
          </Box>

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #1565c0 0%, #0288d1 100%)',
              boxShadow: '0 4px 15px rgba(21,101,192,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d47a1 0%, #0277bd 100%)',
                boxShadow: '0 6px 20px rgba(21,101,192,0.45)',
              },
              '&:disabled': { opacity: 0.7 },
            }}
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
          </Button>
        </form>

        {/* Footer note */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            Hanya untuk staf resmi PERUMDAM Tirta Daroy
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
