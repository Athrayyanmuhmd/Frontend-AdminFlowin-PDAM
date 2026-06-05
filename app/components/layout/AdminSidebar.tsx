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
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Toolbar,
  Badge,
} from '@mui/material';
import {
  Dashboard,
  People,
  Receipt,
  Build,
  Assessment,
  Settings,
  Notifications,
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
  AssignmentTurnedIn,
  Handyman as HandymanIcon,
  FactCheck,
  VerifiedUser,
  NotificationsActive,
  Groups,
  PersonAdd,
  ManageAccounts,
  Payments,
  ReceiptLong,
  PostAdd,
  PriceChange,
  Engineering,
  Map as MapIcon,
  RequestQuote,
  Construction,
  ReportProblem,
  Assignment,
  MonitorHeart,
  Sensors,
  Category,
  BarChart,
  Insights,
  AccountBalance,
  Policy,
  Tune,
} from '@mui/icons-material';
import { useAdmin } from '../../layouts/AdminProvider';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permission?: string;
  roles?: ('admin' | 'technician')[];
  hidden?: boolean; // Sembunyikan sementara tanpa menghapus kode
  section?: string; // Label seksi yang tampil DI ATAS item ini (gaya Attex)
}

// Menu untuk Admin
const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['admin'],
    section: 'Navigasi',
  },
  {
    id: 'customers',
    title: 'Manajemen Pelanggan',
    icon: <Groups />,
    roles: ['admin'],
    section: 'Manajemen',
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
        icon: <PersonAdd />,
        path: '/customers/registration',
        permission: 'customers:create',
        roles: ['admin'],
      },
      {
        id: 'customer-accounts',
        title: 'Akun Pelanggan',
        icon: <ManageAccounts />,
        path: '/customers/accounts',
        permission: 'customers:read',
        roles: ['admin'],
        hidden: true,
      },
    ],
  },
  {
    id: 'billing',
    title: 'Penagihan & Keuangan',
    icon: <Payments />,
    roles: ['admin'],
    children: [
      {
        id: 'billing-list',
        title: 'Tagihan',
        icon: <ReceiptLong />,
        path: '/billing',
        permission: 'billing:read',
        roles: ['admin'],
      },
      {
        id: 'billing-generate',
        title: 'Generate Tagihan',
        icon: <PostAdd />,
        path: '/billing/generate',
        permission: 'billing:create',
        roles: ['admin'],
      },
      // Menu Pembayaran disembunyikan — duplikat halaman Billing (filter settlement)
      // Aktifkan kembali saat ada data transaksi Midtrans detail (nomor VA, bank, dll)
      {
        id: 'billing-tariffs',
        title: 'Struktur Tarif',
        icon: <PriceChange />,
        path: '/billing/tariffs',
        permission: 'billing:update',
        roles: ['admin'],
      },
      // Pemutusan: di-hide sementara — fitur belum dipakai
      // (halaman tetap ada di /billing/pemutusan, hanya tidak muncul di sidebar)
    ],
  },
  {
    id: 'operations',
    title: 'Operasi Lapangan',
    icon: <Engineering />,
    section: 'Operasional',
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
        icon: <MapIcon />,
        path: '/operations/survey-data',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'rab-connection',
        title: 'RAB Sambungan',
        icon: <RequestQuote />,
        path: '/operations/rab-connection',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'technicians',
        title: 'Manajemen Teknisi',
        icon: <Construction />,
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
        icon: <ReportProblem />,
        path: '/operations/laporan',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'penyelesaian-laporan',
        title: 'Penyelesaian Laporan',
        icon: <AssignmentTurnedIn />,
        path: '/operations/penyelesaian-laporan',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'work-orders',
        title: 'Perintah Kerja',
        icon: <Assignment />,
        path: '/operations/work-orders',
        permission: 'workorders:read',
        roles: ['admin'],
      },
      {
        id: 'maintenance',
        title: 'Maintenance',
        icon: <HandymanIcon />,
        path: '/operations/maintenance',
        permission: 'workorders:read',
        roles: ['admin'],
        hidden: true,
      },
      // Menu di bawah di-hide karena belum digunakan
      // {
      //   id: 'pemasangan',
      //   title: 'Pemasangan Meter',
      //   icon: <HandymanIcon />,
      //   path: '/operations/pemasangan',
      //   permission: 'workorders:read',
      //   roles: ['admin'],
      // },
      // {
      //   id: 'pengawasan-pemasangan',
      //   title: 'Pengawasan Pemasangan',
      //   icon: <FactCheck />,
      //   path: '/operations/pengawasan-pemasangan',
      //   permission: 'workorders:read',
      //   roles: ['admin'],
      // },
      // {
      //   id: 'pengawasan-setelah-pemasangan',
      //   title: 'Pengawasan Pasca Pasang',
      //   icon: <VerifiedUser />,
      //   path: '/operations/pengawasan-setelah-pemasangan',
      //   permission: 'workorders:read',
      //   roles: ['admin'],
      // },
      // {
      //   id: 'materials',
      //   title: 'Material & Inventaris',
      //   icon: <Build />,
      //   path: '/operations/materials',
      //   permission: 'workorders:read',
      //   roles: ['admin'],
      // },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: <MonitorHeart />,
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
        icon: <Sensors />,
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
    section: 'Data & Laporan',
    roles: ['admin'],
    children: [
      {
        id: 'kelompok-pelanggan',
        title: 'Kelompok Pelanggan',
        icon: <Category />,
        path: '/master-data/kelompok-pelanggan',
        permission: 'system:execute',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    icon: <NotificationsActive />,
    path: '/notifications',
    roles: ['admin'],
  },
  {
    id: 'reports',
    title: 'Laporan & Analitik',
    icon: <BarChart />,
    roles: ['admin'],
    hidden: true,
    children: [
      {
        id: 'operational-reports',
        title: 'Laporan Operasional',
        icon: <Insights />,
        path: '/reports/operational',
        permission: 'reports:read',
      },
      {
        id: 'financial-reports',
        title: 'Laporan Keuangan',
        icon: <AccountBalance />,
        path: '/reports/financial',
        permission: 'reports:read',
      },
      {
        id: 'compliance-reports',
        title: 'Laporan Kepatuhan',
        icon: <Policy />,
        path: '/reports/compliance',
        permission: 'reports:read',
        hidden: true,
      },
      {
        id: 'custom-reports',
        title: 'Laporan Kustom',
        icon: <Tune />,
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
    section: 'Sistem',
    children: [
      {
        id: 'users',
        title: 'Manajemen User',
        icon: <AdminPanelSettings />,
        path: '/system/users',
        permission: 'users:read',
        roles: ['admin'],
        hidden: true,
      },
      {
        id: 'audit-logs',
        title: 'Log Audit',
        icon: <Security />,
        path: '/system/audit-logs',
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
    section: 'Navigasi',
  },
  {
    id: 'my-tasks',
    title: 'Tugas Saya',
    icon: <Engineering />,
    roles: ['technician'],
    section: 'Pekerjaan',
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
        icon: <MapIcon />,
        path: '/operations/survey-data',
        roles: ['technician'],
      },
      {
        id: 'rab-connection',
        title: 'RAB Sambungan',
        icon: <RequestQuote />,
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
  const { hasPermission, userRole, notifications } = useAdmin();
  const unreadCount = (notifications as any[])?.filter((n: any) => !n.isRead).length ?? 0;
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Persist expanded state so sidebar re-mount (per-page layout) doesn't re-animate
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('sidebar_expanded');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Select menu based on user role
  const menuItems =
    userRole === 'technician' ? technicianMenuItems : adminMenuItems;

  // Mini-rail: di desktop, saat "ditutup" sidebar mengecil jadi rel ikon (bukan hilang)
  const RAIL_W = 88;
  const FULL_W = 304;
  const collapsed = !open && !isMobile;
  const drawerWidth = isMobile ? FULL_W : open ? FULL_W : RAIL_W;

  // Keep sessionStorage in sync
  useEffect(() => {
    try {
      sessionStorage.setItem('sidebar_expanded', JSON.stringify(expandedItems));
    } catch {}
  }, [expandedItems]);

  // Auto-expand the parent group whose child matches the current route
  useEffect(() => {
    const parentWithActiveChild = menuItems.find(item =>
      item.children?.some(child => child.path && pathname.startsWith(child.path))
    );
    if (parentWithActiveChild) {
      setExpandedItems(prev =>
        prev.includes(parentWithActiveChild.id)
          ? prev
          : [...prev, parentWithActiveChild.id]
      );
    }
  }, [pathname, menuItems]);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.path) {
      router.push(item.path);
      // Sidebar TIDAK auto-close saat navigasi — hanya menutup via tombol hamburger
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (item.hidden) return null;

    const hasAccess =
      !item.permission ||
      hasPermission(
        item.permission.split(':')[0],
        item.permission.split(':')[1]
      );

    if (!hasAccess) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path === pathname;
    const isChildActive = !item.path && item.children?.some(
      child => child.path && pathname.startsWith(child.path)
    );
    const isHighlighted = isActive || isChildActive;

    const menuButton = (
      <ListItemButton
        onClick={() => {
          // Saat mini-rail: klik grup membuka sidebar dulu, bukan expand inline
          if (collapsed && item.children) {
            onToggle();
            return;
          }
          handleItemClick(item);
        }}
        sx={{
          position: 'relative',
          minHeight: 44,
          pl: collapsed ? 0 : 1.5,
          pr: collapsed ? 0 : 1.5,
          py: 0.75,
          borderRadius: 2,
          mb: 0.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          backgroundColor: isActive
            ? 'rgba(255, 255, 255, 0.09)'
            : isChildActive
            ? 'rgba(255, 255, 255, 0.04)'
            : 'transparent',
          color: isHighlighted ? '#fff' : 'rgba(255, 255, 255, 0.9)',
          transition: 'background-color 0.2s ease, color 0.2s ease',
          '&::before': isActive
            ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: '62%',
                borderRadius: '0 4px 4px 0',
                backgroundColor: '#5b8def',
              }
            : undefined,
          '&:hover': {
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isHighlighted ? '#fff' : 'rgba(255, 255, 255, 0.82)',
            minWidth: collapsed ? 0 : 34,
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          {item.id === 'notifications' && unreadCount > 0 ? (
            <Badge badgeContent={unreadCount} color='error' max={99}>
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.title}
            sx={{ minWidth: 0, my: 0, pr: item.children ? 0.5 : 0 }}
            primaryTypographyProps={{
              fontSize: level > 0 ? '0.8125rem' : '0.9rem',
              fontWeight: isHighlighted ? 600 : 500,
              color: isHighlighted ? '#fff' : 'rgba(255, 255, 255, 0.92)',
              lineHeight: 1.3,
            }}
          />
        )}
        {!collapsed && item.children && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              color: isHighlighted ? '#fff' : 'rgba(255, 255, 255, 0.75)',
            }}
          >
            <ExpandMore fontSize='small' />
          </Box>
        )}
      </ListItemButton>
    );

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ px: collapsed ? 1 : level === 0 ? 1 : 0, display: 'block' }}>
          {collapsed ? (
            <Tooltip title={item.title} placement='right' arrow>
              {menuButton}
            </Tooltip>
          ) : (
            menuButton
          )}
        </ListItem>

        {item.children && !collapsed && (
          <Collapse
            in={isExpanded}
            timeout={{ enter: 280, exit: 200 }}
            unmountOnExit
          >
            <Box
              sx={{
                ml: 3,
                pl: 1,
                borderLeft: '2px solid',
                borderColor: isChildActive ? '#5b8def' : 'rgba(255, 255, 255, 0.12)',
                transition: 'border-color 0.3s ease',
                my: 0.5,
              }}
            >
              <List component='div' disablePadding>
                {item.children.map(child => renderMenuItem(child, level + 1))}
              </List>
            </Box>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      anchor='left'
      open={isMobile ? open : true}
      onClose={onToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          border: 'none',
          backgroundColor: '#081c3d',
          color: '#fff',
          overflowX: 'hidden',
          transition:
            'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // Sidebar "mengambang" (gaya Attex): jarak di semua sisi + sudut membulat
          ...(isMobile
            ? { width: drawerWidth }
            : {
                position: 'fixed',
                top: '76px',
                bottom: '14px',
                left: '14px',
                height: 'auto',
                width: drawerWidth - 26,
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(8, 28, 61, 0.28)',
              }),
          // Scrollbar tipis di dalam sidebar
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      }}
    >
      {isMobile && <Toolbar />}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.10)',
        }}
      >
        {collapsed ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={onToggle} size='small' sx={{ color: '#fff' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='h6' component='div' sx={{ fontWeight: 700, color: '#fff' }}>
                {userRole === 'technician' ? 'Flowin Teknisi' : 'Flowin Admin'}
              </Typography>
              <IconButton onClick={onToggle} size='small' sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <ChevronLeft />
              </IconButton>
            </Box>
            <Typography variant='body2' sx={{ color: '#fff', opacity: 0.85 }}>
              PDAM Tirta Daroy
            </Typography>
            {userRole && (
              <Chip
                label={userRole === 'technician' ? 'Teknisi' : 'Administrator'}
                size='small'
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.16)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            )}
          </>
        )}
      </Box>

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item: MenuItem) =>
          item.hidden ? null : (
            <React.Fragment key={`grp-${item.id}`}>
              {item.section && !collapsed && (
                <Typography
                  sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 0.75,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {item.section}
                </Typography>
              )}
              {item.section && collapsed && (
                <Divider sx={{ my: 1, mx: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              )}
              {renderMenuItem(item)}
            </React.Fragment>
          )
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <Box sx={{ p: 2 }}>
        <Typography variant='caption' textAlign='center' sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>
          {collapsed ? 'v1.0' : 'v1.0.0 - Admin Panel'}
        </Typography>
      </Box>
    </Drawer>
  );
}
