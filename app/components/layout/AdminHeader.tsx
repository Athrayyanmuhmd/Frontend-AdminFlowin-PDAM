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
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  AdminPanelSettings,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function AdminHeader({ onMenuToggle, title }: AdminHeaderProps) {
  const { user, notifications, logout, markNotificationAsRead } = useAdmin();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
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

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const criticalNotifications = unreadNotifications.filter(n => n.priority === 'critical');

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle menu"
          onClick={onMenuToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title || 'Dashboard Admin'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifikasi">
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ position: 'relative' }}
            >
              <Badge 
                badgeContent={unreadNotifications.length} 
                color="error"
                max={99}
              >
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

          {/* User Profile */}
          <Tooltip title="Profil Pengguna">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
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
          <MenuItem onClick={() => { router.push('/profile'); handleMenuClose(); }}>
            <AccountCircle sx={{ mr: 1 }} />
            Profil
          </MenuItem>
          <MenuItem onClick={() => { router.push('/settings'); handleMenuClose(); }}>
            <Settings sx={{ mr: 1 }} />
            Pengaturan
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
              Notifikasi ({unreadNotifications.length})
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
                      {new Date(notification.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
