'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  Chip,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  People,
  Receipt,
  Build,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  AdminPanelSettings,
  WaterDrop,
  Speed,
  Report,
  AccountTree,
  Security,
  Storage,
  Group,
  AssignmentTurnedIn,
  NotificationsActive,
  PersonOff,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';
import Image from 'next/image';

// ─── Warna sidebar ─────────────────────────────────────────────────────────────
const S = {
  bg: '#1e293b',
  border: 'rgba(255,255,255,0.07)',
  text: '#94a3b8',
  textActive: '#ffffff',
  textHover: '#cbd5e1',
  activeBg: 'rgba(255,255,255,0.1)',
  hoverBg: 'rgba(255,255,255,0.05)',
  accent: '#3b82f6',
};

interface MenuItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
  roles?: ('admin' | 'technician')[];
}

const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Dashboard fontSize="small" />,
    path: '/dashboard',
    roles: ['admin'],
  },
  {
    id: 'customers',
    title: 'Manajemen Pelanggan',
    icon: <People fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'customer-list', title: 'Daftar Pelanggan', path: '/customers', permission: 'customers:read', roles: ['admin'] },
      { id: 'customer-registration', title: 'Registrasi Baru', path: '/customers/registration', permission: 'customers:create', roles: ['admin'] },
      { id: 'customer-accounts', title: 'Akun Pelanggan', path: '/customers/accounts', permission: 'customers:read', roles: ['admin'] },
    ],
  },
  {
    id: 'billing',
    title: 'Penagihan & Keuangan',
    icon: <Receipt fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'billing-list', title: 'Tagihan', path: '/billing', permission: 'billing:read', roles: ['admin'] },
      { id: 'billing-generate', title: 'Generate Tagihan', path: '/billing/generate', permission: 'billing:create', roles: ['admin'] },
      { id: 'billing-payments', title: 'Pembayaran', path: '/billing/payments', permission: 'billing:read', roles: ['admin'] },
      { id: 'billing-tariffs', title: 'Struktur Tarif', path: '/billing/tariffs', permission: 'billing:update', roles: ['admin'] },
      { id: 'billing-pemutusan', title: 'Pemutusan', path: '/billing/pemutusan', permission: 'billing:update', roles: ['admin'] },
    ],
  },
  {
    id: 'operations',
    title: 'Operasi Lapangan',
    icon: <Build fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'connection-data', title: 'Data Sambungan', path: '/operations/connection-data', permission: 'workorders:read', roles: ['admin'] },
      { id: 'survey-data', title: 'Data Survei', path: '/operations/survey-data', permission: 'workorders:read', roles: ['admin'] },
      { id: 'rab-connection', title: 'RAB Sambungan', path: '/operations/rab-connection', permission: 'workorders:read', roles: ['admin'] },
      { id: 'technicians', title: 'Manajemen Teknisi', path: '/operations/technicians', permission: 'workorders:read', roles: ['admin'] },
      { id: 'meteran', title: 'Manajemen Meteran', path: '/operations/meteran', permission: 'workorders:read', roles: ['admin'] },
      { id: 'laporan', title: 'Laporan Pelanggan', path: '/operations/laporan', permission: 'workorders:read', roles: ['admin'] },
      { id: 'penyelesaian-laporan', title: 'Penyelesaian Laporan', path: '/operations/penyelesaian-laporan', permission: 'workorders:read', roles: ['admin'] },
      { id: 'work-orders', title: 'Perintah Kerja', path: '/operations/work-orders', permission: 'workorders:read', roles: ['admin'] },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: <Speed fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'smart-meters', title: 'Meteran Pintar', path: '/monitoring/smart-meter', permission: 'system:execute', roles: ['admin'] },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    icon: <Storage fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'kelompok-pelanggan', title: 'Kelompok Pelanggan', path: '/master-data/kelompok-pelanggan', permission: 'system:execute', roles: ['admin'] },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    icon: <NotificationsActive fontSize="small" />,
    path: '/notifications',
    roles: ['admin'],
  },
  {
    id: 'reports',
    title: 'Laporan & Analitik',
    icon: <Assessment fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'operational-reports', title: 'Laporan Operasional', path: '/reports/operational', permission: 'reports:read' },
      { id: 'financial-reports', title: 'Laporan Keuangan', path: '/reports/financial', permission: 'reports:read' },
      { id: 'compliance-reports', title: 'Laporan Kepatuhan', path: '/reports/compliance', permission: 'reports:read' },
      { id: 'custom-reports', title: 'Laporan Kustom', path: '/reports/custom', permission: 'reports:create', roles: ['admin'] },
    ],
  },
  {
    id: 'system',
    title: 'Sistem',
    icon: <Settings fontSize="small" />,
    roles: ['admin'],
    children: [
      { id: 'users', title: 'Manajemen User', path: '/system/users', permission: 'users:read', roles: ['admin'] },
      { id: 'permissions', title: 'Izin & Role', path: '/system/permissions', permission: 'users:update', roles: ['admin'] },
      { id: 'audit-logs', title: 'Log Audit', path: '/system/audit-logs', permission: 'system:execute', roles: ['admin'] },
      { id: 'system-config', title: 'Konfigurasi', path: '/system/config', permission: 'system:execute', roles: ['admin'] },
    ],
  },
];

const technicianMenuItems: MenuItem[] = [
  { id: 'dashboard', title: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard', roles: ['technician'] },
  {
    id: 'my-tasks',
    title: 'Tugas Saya',
    icon: <Build fontSize="small" />,
    roles: ['technician'],
    children: [
      { id: 'connection-data', title: 'Data Sambungan', path: '/operations/connection-data', roles: ['technician'] },
      { id: 'survey-data', title: 'Data Survei', path: '/operations/survey-data', roles: ['technician'] },
      { id: 'rab-connection', title: 'RAB Sambungan', path: '/operations/rab-connection', roles: ['technician'] },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function AdminSidebar({ open, onToggle, onClose, isMobile = false }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, userRole } = useAdmin();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems = userRole === 'technician' ? technicianMenuItems : adminMenuItems;

  useEffect(() => {
    const parentWithActiveChild = menuItems.find(item =>
      item.children?.some(child => child.path && pathname.startsWith(child.path))
    );
    if (parentWithActiveChild) {
      setExpandedItems(prev =>
        prev.includes(parentWithActiveChild.id) ? prev : [...prev, parentWithActiveChild.id]
      );
    }
  }, [pathname, menuItems]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setExpandedItems(prev =>
        prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
      );
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasAccess =
      !item.permission ||
      hasPermission(item.permission.split(':')[0], item.permission.split(':')[1]);
    if (!hasAccess) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path === pathname;
    const isChildActive = !item.path && item.children?.some(
      child => child.path && pathname.startsWith(child.path)
    );

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ display: 'block', mb: 0.25, px: 1 }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              borderRadius: 1.5,
              pl: level > 0 ? 2.5 : 1.5,
              pr: 1.5,
              py: level > 0 ? 0.625 : 0.875,
              backgroundColor: isActive ? S.activeBg : 'transparent',
              borderLeft: isActive
                ? `3px solid ${S.accent}`
                : isChildActive
                ? `3px solid ${alpha(S.accent, 0.4)}`
                : '3px solid transparent',
              '&:hover': {
                backgroundColor: isActive ? S.activeBg : S.hoverBg,
              },
              transition: 'background-color 0.15s ease',
              minHeight: level > 0 ? 36 : 44,
            }}
          >
            {level === 0 && item.icon && (
              <ListItemIcon
                sx={{
                  color: isActive ? S.accent : isChildActive ? alpha(S.accent, 0.8) : S.text,
                  minWidth: 34,
                  '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            {level > 0 && (
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  mr: 1.5,
                  flexShrink: 0,
                  backgroundColor: isActive ? S.accent : alpha(S.text, 0.5),
                }}
              />
            )}
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.8125rem' : '0.875rem',
                fontWeight: isActive ? 600 : isChildActive ? 500 : 400,
                color: isActive ? S.textActive : isChildActive ? S.textHover : S.text,
                lineHeight: 1.4,
                fontFamily: 'Poppins, sans-serif',
              }}
            />
            {item.children && (
              <Box sx={{ color: S.text, display: 'flex', ml: 0.5 }}>
                {isExpanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {item.children && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onToggle}
      transitionDuration={0}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: open ? 260 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          backgroundColor: S.bg,
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          transition: 'none !important',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo & Brand */}
      <Box
        sx={{
          px: 2,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          borderBottom: `1px solid ${S.border}`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/assets/logo/Aqualink_2.png"
            alt="Aqualink"
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9375rem',
              lineHeight: 1.2,
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            Aqualink
          </Typography>
          <Typography
            sx={{
              color: S.text,
              fontSize: '0.6875rem',
              lineHeight: 1,
              mt: 0.25,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            PDAM Tirta Daroy
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{ color: S.text, '&:hover': { color: S.textActive, backgroundColor: S.hoverBg } }}
        >
          <ChevronLeft sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Box>

      {/* Role Badge */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Chip
          label={userRole === 'technician' ? 'Teknisi' : 'Administrator'}
          size="small"
          sx={{
            backgroundColor: userRole === 'technician'
              ? alpha('#06b6d4', 0.15)
              : alpha('#3b82f6', 0.15),
            color: userRole === 'technician' ? '#22d3ee' : '#60a5fa',
            fontSize: '0.6875rem',
            fontWeight: 600,
            height: 22,
            fontFamily: 'Poppins, sans-serif',
            border: `1px solid ${userRole === 'technician' ? alpha('#06b6d4', 0.25) : alpha('#3b82f6', 0.25)}`,
          }}
        />
      </Box>

      {/* Scrollable menu */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: alpha('#fff', 0.1), borderRadius: 2 },
        }}
      >
        <List dense disablePadding>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: `1px solid ${S.border}`,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: alpha(S.text, 0.6),
            fontSize: '0.6875rem',
            textAlign: 'center',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          v1.0.0 · Admin Panel
        </Typography>
      </Box>
    </Drawer>
  );
}
