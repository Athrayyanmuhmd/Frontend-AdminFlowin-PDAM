'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CssBaseline, CircularProgress, Alert, useMediaQuery, useTheme } from '@mui/material';
import { useAdmin } from './AdminProvider';
import AdminSidebar from '../components/layout/AdminSidebar';
import AdminHeader from '../components/layout/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAdmin();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Inisialisasi dari localStorage agar state persisten antar navigasi halaman
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) return saved === 'true';
    return true; // default: terbuka di desktop
  });

  // Saat screen size berubah (resize), paksa tutup di mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSidebarToggle = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', String(next));
      return next;
    });
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
      localStorage.setItem('sidebarOpen', 'false');
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Alert severity="info">
          Memuat panel administrasi...
        </Alert>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <AdminSidebar open={sidebarOpen} onToggle={handleSidebarToggle} onClose={handleSidebarClose} isMobile={isMobile} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          minWidth: 0, // prevent flex overflow
          overflow: 'hidden',
        }}
      >
        <AdminHeader onMenuToggle={handleSidebarToggle} title={title} />
        
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: 8, // Account for AppBar height
            backgroundColor: 'background.default',
            width: '100%',
            overflowX: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
