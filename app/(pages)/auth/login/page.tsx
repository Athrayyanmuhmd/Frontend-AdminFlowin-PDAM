'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Security,
  AdminPanelSettings,
} from '@mui/icons-material';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'admin' | 'technician'>('admin');
  const { login, isLoading } = useAdmin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    const success = await login(email, password, role);
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Email atau password salah');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <AdminPanelSettings sx={{ fontSize: 40, color: 'white' }} />
            </Box>

            <Typography variant='h4' component='h1' gutterBottom>
              Flowin Admin
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              textAlign='center'
            >
              Panel Administrasi PDAM Tirta Daroy
            </Typography>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mb: 1, textAlign: 'center' }}
            >
              Login Sebagai:
            </Typography>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, newRole) => newRole && setRole(newRole)}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value='admin'>Admin</ToggleButton>
              <ToggleButton value='technician'>Teknisi</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='Email'
              type='email'
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              margin='normal'
              required
              autoComplete='email'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Security />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label='Password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              margin='normal'
              required
              autoComplete='current-password'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Security />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={togglePasswordVisibility} edge='end'>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              size='large'
              disabled={isLoading}
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <LoginIcon />
              }
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2, #1CB5E0)',
                },
              }}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Testing Credentials:
            </Typography>
            <Typography
              variant='body2'
              color='primary'
              sx={{ fontSize: '0.75rem' }}
            >
              Admin: admin@pdam.com / admin123
            </Typography>
            <Typography
              variant='body2'
              color='primary'
              sx={{ fontSize: '0.75rem' }}
            >
              Teknisi: teknisi@pdam.com / teknisi123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
