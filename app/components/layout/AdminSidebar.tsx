'use client';

import React, { useState } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Receipt,
  Build,
  Assessment,
  Settings,
  Notifications,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  ChevronLeft,
  AdminPanelSettings,
  WaterDrop,
  Speed,
  Report,
  AccountTree,
  Security,
  Storage,
  Group,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
  roles?: ('admin' | 'technician')[]; // Roles yang dapat mengakses menu ini
}

// Menu untuk Admin
const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['admin'],
  },
  {
    id: 'customers',
    title: 'Manajemen Pelanggan',
    icon: <People />,
    roles: ['admin'],
    children: [
      {
        id: 'customer-list',
        title: 'Daftar Pelanggan',
        icon: <People />,
        path: '/customers',
        permission: 'customers:read',
        roles: ['admin'],
      },
      {
        id: 'customer-registration',
        title: 'Registrasi Baru',
        icon: <People />,
        path: '/customers/registration',
        permission: 'customers:create',
        roles: ['admin'],
      },
      {
        id: 'customer-accounts',
        title: 'Akun Pelanggan',
        icon: <AccountTree />,
        path: '/customers/accounts',
        permission: 'customers:read',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'billing',
    title: 'Penagihan & Keuangan',
    icon: <Receipt />,
    roles: ['admin'],
    children: [
      {
        id: 'billing-list',
        title: 'Tagihan',
        icon: <Receipt />,
        path: '/billing',
        permission: 'billing:read',
        roles: ['admin'],
      },
      {
        id: 'billing-generate',
        title: 'Generate Tagihan',
        icon: <Receipt />,
        path: '/billing/generate',
        permission: 'billing:create',
        roles: ['admin'],
      },
      {
        id: 'billing-payments',
        title: 'Pembayaran',
        icon: <Receipt />,
        path: '/billing/payments',
        permission: 'billing:read',
        roles: ['admin'],
      },
      {
        id: 'billing-tariffs',
        title: 'Struktur Tarif',
        icon: <Receipt />,
        path: '/billing/tariffs',
        permission: 'billing:update',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operasi Lapangan',
    icon: <Build />,
    roles: ['admin'],
    children: [
      {
        id: 'connection-data',
        title: 'Data Sambungan',
        icon: <WaterDrop />,
        path: '/operations/connection-data',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'survey-data',
        title: 'Data Survey',
        icon: <Assessment />,
        path: '/operations/survey-data',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'rab-connection',
        title: 'RAB Sambungan',
        icon: <Receipt />,
        path: '/operations/rab-connection',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'technicians',
        title: 'Manajemen Teknisi',
        icon: <Build />,
        path: '/operations/technicians',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'meteran',
        title: 'Manajemen Meteran',
        icon: <Speed />,
        path: '/operations/meteran',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'laporan',
        title: 'Laporan Pelanggan',
        icon: <Report />,
        path: '/operations/laporan',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'work-orders',
        title: 'Perintah Kerja',
        icon: <Build />,
        path: '/operations/work-orders',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'materials',
        title: 'Material & Inventaris',
        icon: <Build />,
        path: '/operations/materials',
        permission: 'workorders:read',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: <Speed />,
    roles: ['admin'],
    children: [
      // SCADA Real-time & Kualitas Air di-hide karena tidak ada dalam proposal
      // {
      //   id: 'scada',
      //   title: 'SCADA Real-time',
      //   icon: <Speed />,
      //   path: '/monitoring/scada',
      //   permission: 'system:execute',
      //   roles: ['admin'],
      // },
      // {
      //   id: 'water-quality',
      //   title: 'Kualitas Air',
      //   icon: <WaterDrop />,
      //   path: '/monitoring/water-quality',
      //   permission: 'system:execute',
      //   roles: ['admin'],
      // },
      {
        id: 'smart-meters',
        title: 'Meteran Pintar',
        icon: <Speed />,
        path: '/monitoring/smart-meter',
        permission: 'system:execute',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    icon: <Storage />,
    roles: ['admin'],
    children: [
      {
        id: 'kelompok-pelanggan',
        title: 'Kelompok Pelanggan',
        icon: <Group />,
        path: '/master-data/kelompok-pelanggan',
        permission: 'system:execute',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'reports',
    title: 'Laporan & Analitik',
    icon: <Assessment />,
    roles: ['admin'],
    children: [
      {
        id: 'operational-reports',
        title: 'Laporan Operasional',
        icon: <Report />,
        path: '/reports/operational',
        permission: 'reports:read',
      },
      {
        id: 'financial-reports',
        title: 'Laporan Keuangan',
        icon: <Report />,
        path: '/reports/financial',
        permission: 'reports:read',
      },
      {
        id: 'compliance-reports',
        title: 'Laporan Kepatuhan',
        icon: <Report />,
        path: '/reports/compliance',
        permission: 'reports:read',
      },
      {
        id: 'custom-reports',
        title: 'Laporan Kustom',
        icon: <Report />,
        path: '/reports/custom',
        permission: 'reports:create',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'system',
    title: 'Sistem',
    icon: <Settings />,
    roles: ['admin'],
    children: [
      {
        id: 'users',
        title: 'Manajemen User',
        icon: <AdminPanelSettings />,
        path: '/system/users',
        permission: 'users:read',
        roles: ['admin'],
      },
      {
        id: 'permissions',
        title: 'Izin & Role',
        icon: <Security />,
        path: '/system/permissions',
        permission: 'users:update',
        roles: ['admin'],
      },
      {
        id: 'audit-logs',
        title: 'Log Audit',
        icon: <Security />,
        path: '/system/audit-logs',
        permission: 'system:execute',
        roles: ['admin'],
      },
      {
        id: 'system-config',
        title: 'Konfigurasi',
        icon: <Settings />,
        path: '/system/config',
        permission: 'system:execute',
        roles: ['admin'],
      },
    ],
  },
];

// Menu untuk Teknisi
const technicianMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['technician'],
  },
  {
    id: 'my-tasks',
    title: 'Tugas Saya',
    icon: <Build />,
    roles: ['technician'],
    children: [
      {
        id: 'connection-data',
        title: 'Data Sambungan',
        icon: <WaterDrop />,
        path: '/operations/connection-data',
        roles: ['technician'],
      },
      {
        id: 'survey-data',
        title: 'Data Survey',
        icon: <Assessment />,
        path: '/operations/survey-data',
        roles: ['technician'],
      },
      {
        id: 'rab-connection',
        title: 'RAB Sambungan',
        icon: <Receipt />,
        path: '/operations/rab-connection',
        roles: ['technician'],
      },
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

  // Select menu based on user role
  const menuItems =
    userRole === 'technician' ? technicianMenuItems : adminMenuItems;

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.path) {
      router.push(item.path);
      // Auto-close sidebar on mobile after navigation
      if (isMobile && onClose) onClose();
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasAccess =
      !item.permission ||
      hasPermission(
        item.permission.split(':')[0],
        item.permission.split(':')[1]
      );

    if (!hasAccess) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path === pathname;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              pl: 2 + level * 2,
              backgroundColor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'inherit',
              '&:hover': {
                backgroundColor: isActive ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{ color: isActive ? 'primary.contrastText' : 'inherit' }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
            {item.children && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {item.children && (
          <Collapse in={isExpanded} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
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
      anchor='left'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }} // Better mobile performance
      sx={{
        width: open ? 280 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6' component='div' sx={{ fontWeight: 600 }}>
            {userRole === 'technician' ? 'Flowin Teknisi' : 'Flowin Admin'}
          </Typography>
          <IconButton onClick={onToggle} size='small'>
            <ChevronLeft />
          </IconButton>
        </Box>
        <Typography variant='body2' color='text.secondary'>
          PDAM Tirta Daroy
        </Typography>
        {userRole && (
          <Chip
            label={userRole === 'technician' ? 'Teknisi' : 'Administrator'}
            size='small'
            color={userRole === 'technician' ? 'info' : 'primary'}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item: MenuItem) => renderMenuItem(item))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          v1.0.0 - Admin Panel
        </Typography>
      </Box>
    </Drawer>
  );
}
