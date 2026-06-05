'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Tooltip,
  Chip,
} from '@mui/material';
import { Divider } from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Fullscreen,
  FullscreenExit,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Daftar Pelanggan',
  '/customers/accounts': 'Akun Pelanggan',
  '/customers/registration': 'Registrasi Pelanggan',
  '/billing': 'Tagihan',
  '/billing/tariffs': 'Struktur Tarif',
  '/billing/payments': 'Pembayaran',
  '/billing/generate': 'Generate Tagihan',
  '/operations/connection-data': 'Data Sambungan Air',
  '/operations/survey-data': 'Data Survei',
  '/operations/rab-connection': 'RAB Sambungan',
  '/operations/work-orders': 'Work Order',
  '/operations/technicians': 'Manajemen Teknisi',
  '/operations/meteran': 'Manajemen Meteran',
  '/operations/materials': 'Manajemen Material',
  '/operations/pemasangan': 'Pemasangan Meteran',
  '/operations/pengawasan-pemasangan': 'Pengawasan Pemasangan',
  '/operations/pengawasan-setelah-pemasangan': 'Pengawasan Setelah Pemasangan',
  '/operations/laporan': 'Laporan Pelanggan',
  '/operations/penyelesaian-laporan': 'Penyelesaian Laporan',
  '/monitoring/smart-meter': 'Smart Meter',
  '/monitoring/smart-meters': 'Manajemen Smart Meter',
  '/monitoring/smart-meters/register': 'Registrasi Smart Meter',
  '/master-data/kelompok-pelanggan': 'Kelompok Pelanggan',
  '/reports/operational': 'Laporan Operasional',
  '/reports/financial': 'Laporan Keuangan',
  '/reports/compliance': 'Laporan Kepatuhan',
  '/reports/custom': 'Laporan Kustom',
  '/system/users': 'Akun Pengguna',
  '/system/audit-logs': 'Audit Log',
  '/notifications': 'Notifikasi',
  '/mobile/technician': 'Portal Teknisi',
};

function resolvePageTitle(pathname: string, fallback?: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match dynamic routes like /customers/detail/[id] or /operations/work-orders/[id]
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 3) {
    const parentPath = '/' + segments.slice(0, -1).join('/');
    if (PAGE_TITLES[parentPath]) return PAGE_TITLES[parentPath] + ' — Detail';
  }
  return fallback || 'Dashboard Admin';
}

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function AdminHeader({ onMenuToggle, title }: AdminHeaderProps) {
  const { user, notifications, logout, markNotificationAsRead } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname, title);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  // Jumlah unread yang sudah "dilihat" saat klik bell — badge shows delta dari sini
  const [clearedCount, setClearedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const criticalNotifications = unreadNotifications.filter(n => n.priority === 'critical');
  const badgeCount = Math.max(0, unreadNotifications.length - clearedCount);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    // Reset badge saat bell diklik
    setClearedCount(unreadNotifications.length);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    handleMenuClose();
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    handleMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // Header "mengambang" (gaya Attex): jarak di semua sisi + sudut membulat
        top: 14,
        left: 14,
        right: 14,
        width: 'auto',
        borderRadius: '18px',
        overflow: 'hidden',
        // Glassmorphism kuat (gaya glass-card)
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'text.primary',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow:
          '0 8px 32px rgba(8, 28, 61, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(255, 255, 255, 0.2)',
        // Garis cahaya tepi atas
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          zIndex: 2,
        },
        // Garis cahaya tepi kiri
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '100%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.9), transparent, rgba(255,255,255,0.3))',
          zIndex: 2,
        },
      }}
    >
      <Toolbar>
        {/* Hamburger hanya di mobile (desktop sudah ada toggle di sidebar) */}
        <IconButton
          color="inherit"
          aria-label="toggle menu"
          onClick={onMenuToggle}
          edge="start"
          sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' }, color: 'text.secondary' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo PDAM Tirta Daroy di sudut kiri (sama dgn halaman login) */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          <Image
            src="/assets/logo/logo-tirta-daroy.png"
            alt="PERUMDAM Tirta Daroy"
            width={150}
            height={40}
            style={{ objectFit: 'contain', maxHeight: 40, width: 'auto' }}
            priority
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Fullscreen */}
          <Tooltip title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}>
            <IconButton color="inherit" onClick={toggleFullscreen} sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.secondary' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Pengaturan Sistem">
            <IconButton color="inherit" onClick={() => router.push('/system/users')} sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.secondary' }}>
              <Settings />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifikasi">
            <IconButton color="inherit" onClick={handleNotificationMenuOpen} sx={{ position: 'relative', color: 'text.secondary' }}>
              <Badge badgeContent={badgeCount} color="error" max={99}>
                <Notifications />
              </Badge>
              {criticalNotifications.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5, display: { xs: 'none', sm: 'block' } }} />

          {/* User Profile — avatar + nama + role (gaya Attex) */}
          <Box
            onClick={handleProfileMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: 2,
              pl: 0.5,
              pr: { xs: 0.5, md: 1 },
              py: 0.5,
              transition: 'background-color 0.2s ease',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.95rem' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                {user?.role === 'administrator' ? 'Administrator' : 'Teknisi'}
              </Typography>
            </Box>
            <KeyboardArrowDown sx={{ fontSize: 18, color: 'text.secondary', display: { xs: 'none', md: 'block' } }} />
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2">{user?.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip 
                label={user?.role === 'administrator' ? 'Administrator' : 'Teknisi'} 
                size="small" 
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </MenuItem>
          <MenuItem onClick={() => { router.push('/system/users'); handleMenuClose(); }}>
            <AccountCircle sx={{ mr: 1 }} />
            Profil
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Keluar
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { width: 350, maxHeight: 400 }
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Notifikasi {badgeCount > 0 ? `(${badgeCount} belum dibaca)` : ''}
            </Typography>
          </MenuItem>
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                Tidak ada notifikasi
              </Typography>
            </MenuItem>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                sx={{
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  borderLeft: notification.priority === 'critical' ? '4px solid' : 'none',
                  borderColor: notification.priority === 'critical' ? 'error.main' : 'transparent',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: notification.isRead ? 400 : 600,
                        color: notification.priority === 'critical' ? 'error.main' : 'inherit'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(() => {
                        const d = new Date(notification.createdAt);
                        return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      })()}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mt: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
          {notifications.length > 5 && (
            <MenuItem onClick={() => { router.push('/notifications'); handleMenuClose(); }}>
              <Typography variant="body2" color="primary" textAlign="center" sx={{ width: '100%' }}>
                Lihat semua notifikasi
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
