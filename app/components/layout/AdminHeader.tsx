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
  Divider,
  ListItemIcon,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  NotificationsOutlined,
  Logout,
  Settings,
  Person,
  Circle,
  OpenInNew,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

const formatTime = (ts: Date | undefined) => {
  if (!ts) return '';
  const diff = Date.now() - ts.getTime();
  if (diff < 60_000) return 'Baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mnt lalu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`;
  return ts.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const priorityColor = (p?: string) => {
  if (p === 'critical' || p === 'high') return '#f59e0b';
  return '#3b82f6';
};

export default function AdminHeader({ onMenuToggle, title }: AdminHeaderProps) {
  const { user, notifications, logout, markNotificationAsRead } = useAdmin();
  const router = useRouter();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const unread = notifications.filter(n => !n.isRead);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    setProfileAnchor(null);
  };

  const initials = (user?.username ?? user?.email ?? 'A')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: 'text.primary',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
        {/* Hamburger */}
        <IconButton
          onClick={onMenuToggle}
          size="small"
          sx={{
            mr: 2,
            color: '#64748b',
            '&:hover': { backgroundColor: '#f1f5f9' },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Page title */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            fontSize: '1rem',
            color: '#1e293b',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          {title || 'Dashboard'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Notifications bell */}
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            size="small"
            sx={{
              color: '#64748b',
              '&:hover': { backgroundColor: '#f1f5f9' },
              position: 'relative',
            }}
          >
            <Badge
              badgeContent={unread.length || null}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.6rem',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                },
              }}
            >
              <NotificationsOutlined sx={{ fontSize: '1.35rem' }} />
            </Badge>
          </IconButton>

          {/* Profile button */}
          <Box
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f1f5f9' },
              transition: 'background 0.15s',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#1e293b',
                fontSize: '0.8125rem',
                fontWeight: 700,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  lineHeight: 1.2,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {user?.username ?? 'Admin'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  color: '#94a3b8',
                  lineHeight: 1,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {user?.role === 'administrator' ? 'Administrator' : 'Teknisi'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>

      {/* ── Notification Dropdown ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{
          elevation: 8,
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header notif */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', fontFamily: 'Poppins, sans-serif' }}>
            Notifikasi
          </Typography>
          {unread.length > 0 && (
            <Box
              sx={{
                backgroundColor: alpha('#ef4444', 0.1),
                color: '#ef4444',
                fontSize: '0.6875rem',
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: 10,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {unread.length} belum dibaca
            </Box>
          )}
        </Box>

        {/* List notif scrollable */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <NotificationsOutlined sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif' }}>
                Tidak ada notifikasi
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 8).map((notif) => (
              <Box
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  setNotifAnchor(null);
                }}
                sx={{
                  px: 2,
                  py: 1.25,
                  display: 'flex',
                  gap: 1.25,
                  cursor: 'pointer',
                  backgroundColor: notif.isRead ? 'transparent' : alpha('#3b82f6', 0.04),
                  borderLeft: notif.isRead ? '3px solid transparent' : `3px solid ${priorityColor(notif.priority)}`,
                  '&:hover': { backgroundColor: '#f8fafc' },
                  transition: 'background 0.1s',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: notif.isRead ? 'transparent' : priorityColor(notif.priority),
                    flexShrink: 0,
                    mt: 0.75,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: notif.isRead ? 400 : 600,
                      color: '#1e293b',
                      lineHeight: 1.4,
                      fontFamily: 'Poppins, sans-serif',
                      mb: 0.25,
                    }}
                    noWrap
                  >
                    {notif.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      lineHeight: 1.4,
                      fontFamily: 'Poppins, sans-serif',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {notif.message}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', mt: 0.5, fontFamily: 'Poppins, sans-serif' }}>
                    {formatTime(notif.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Footer notif */}
        <Box
          onClick={() => { router.push('/notifications'); setNotifAnchor(null); }}
          sx={{
            px: 2,
            py: 1.25,
            textAlign: 'center',
            borderTop: '1px solid #f1f5f9',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#f8fafc' },
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3b82f6', fontFamily: 'Poppins, sans-serif' }}>
            Lihat semua notifikasi
          </Typography>
          <OpenInNew sx={{ fontSize: '0.875rem', color: '#3b82f6' }} />
        </Box>
      </Menu>

      {/* ── Profile Dropdown ── */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        PaperProps={{
          elevation: 8,
          sx: {
            width: 220,
            mt: 1,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            overflow: 'visible',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', fontFamily: 'Poppins, sans-serif' }}>
            {user?.username ?? 'Admin'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Poppins, sans-serif' }}>
            {user?.email ?? ''}
          </Typography>
        </Box>

        <MenuItem
          onClick={() => { router.push('/system/users'); setProfileAnchor(null); }}
          sx={{ py: 1, px: 2, fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif', gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 'unset', color: '#64748b' }}>
            <Person sx={{ fontSize: '1.1rem' }} />
          </ListItemIcon>
          Profil Saya
        </MenuItem>

        <MenuItem
          onClick={() => { router.push('/system/config'); setProfileAnchor(null); }}
          sx={{ py: 1, px: 2, fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif', gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 'unset', color: '#64748b' }}>
            <Settings sx={{ fontSize: '1.1rem' }} />
          </ListItemIcon>
          Pengaturan
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ py: 1, px: 2, fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif', gap: 1.5, color: '#ef4444' }}
        >
          <ListItemIcon sx={{ minWidth: 'unset', color: '#ef4444' }}>
            <Logout sx={{ fontSize: '1.1rem' }} />
          </ListItemIcon>
          Keluar
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
