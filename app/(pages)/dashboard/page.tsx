'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../layouts/AdminProvider';
import {
  Grid,
  Card,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh,
  HourglassEmpty,
  Cancel,
  CheckCircle,
  People,
  Speed,
  Engineering,
  Receipt,
  Warning,
  Cable,
} from '@mui/icons-material';
import nextDynamic from 'next/dynamic';
import { Skeleton } from '@mui/material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../layouts/AdminLayout';
import { DashboardKPI } from '../../types/admin.types';
import { GET_DASHBOARD_STATS, GET_CHART_KONSUMSI_PER_BULAN, GET_DISTRIBUSI_KELOMPOK_PELANGGAN } from '@/lib/graphql/queries/dashboard';
import StatCard, { StatCardColor } from '../../components/ui/StatCard';

const DashboardLineChart = nextDynamic(
  () => import('../../components/charts/DashboardLineChart'),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 1 }} />,
  }
);

const DashboardPieChart = nextDynamic(
  () => import('../../components/charts/DashboardPieChart'),
  {
    ssr: false,
    loading: () => <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto' }} />,
  }
);

const CHART_COLORS = ['#013494', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];

interface KpiConfig { icon: React.ReactNode; color: StatCardColor; format?: (v: number, unit: string) => string }
const KPI_CONFIG: Record<string, KpiConfig> = {
  '1': { icon: <People />,       color: 'info' },
  '2': { icon: <Speed />,        color: 'success' },
  '3': { icon: <Engineering />,  color: 'warning' },
  '4': { icon: <Receipt />,      color: 'primary', format: (v) => `Rp ${v.toLocaleString('id-ID')}` },
  '5': { icon: <Warning />,      color: 'error' },
  '6': { icon: <Cable />,        color: 'dark' },
};

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
  });

  const { data: chartKonsumsiData, error: chartKonsumsiError, refetch: refetchKonsumsi } = useQuery(GET_CHART_KONSUMSI_PER_BULAN, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
  });

  const { data: distribusiData, error: distribusiError, refetch: refetchDistribusi } = useQuery(GET_DISTRIBUSI_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if ((data as any)?.getDashboardStats) {
      updateDashboardFromGraphQL((data as any).getDashboardStats);
    }
  }, [data]);

  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
    }
  }, [graphqlError]);

  const updateDashboardFromGraphQL = (stats: any) => {
    const realKPIs: DashboardKPI[] = [
      { id: '1', name: 'Total Pelanggan',        value: stats.totalPelanggan || 0,         unit: '',   trend: 'up',   status: 'good',    lastUpdated: new Date() },
      { id: '2', name: 'Total Meteran Terpasang', value: stats.totalMeteran || 0,           unit: '',   trend: 'up',   status: 'good',    lastUpdated: new Date() },
      { id: '3', name: 'Work Orders Aktif',       value: stats.activeWorkOrders || 0,       unit: '',   trend: stats.activeWorkOrders > 0 ? 'up' : 'down', status: stats.activeWorkOrders > 30 ? 'warning' : 'good', lastUpdated: new Date() },
      { id: '4', name: 'Tagihan Bulan Ini',       value: stats.totalTagihanBulanIni || 0,   unit: 'Rp', trend: 'up',   status: 'good',    lastUpdated: new Date() },
      { id: '5', name: 'Tunggakan Aktif',         value: stats.tunggakanAktif || 0,         unit: '',   trend: stats.tunggakanAktif > 0 ? 'up' : 'down', status: stats.tunggakanAktif > 100 ? 'warning' : 'good', lastUpdated: new Date() },
      { id: '6', name: 'Pending Koneksi',         value: stats.pendingKoneksi || 0,         unit: '',   trend: stats.pendingKoneksi > 0 ? 'up' : 'down', status: stats.pendingKoneksi > 20 ? 'warning' : 'good', lastUpdated: new Date() },
    ];
    setKpis(realKPIs);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchKonsumsi(), refetchDistribusi()]);
    setIsRefreshing(false);
  };

  const konsumsiChartData = (chartKonsumsiData as any)?.getChartKonsumsiPerBulan || [];
  const distribusiChartData = ((distribusiData as any)?.getDistribusiKelompokPelanggan || []).map(
    (item: { namaKelompok: string; jumlahMeteran: number }, index: number) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })
  );

  if (authLoading || !isAuthenticated) return null;

  if (loading && kpis.length === 0) {
    return (
      <AdminLayout title="Dashboard Eksekutif">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard Eksekutif">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          Dashboard Eksekutif
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} disabled={isRefreshing}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {graphqlError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Gagal memuat sebagian data dashboard: {graphqlError.message}
        </Alert>
      )}

      {/* KPI StatCards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {kpis.map((kpi) => {
          const cfg = KPI_CONFIG[kpi.id];
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id}>
              <StatCard
                color={cfg.color}
                icon={cfg.icon}
                title={kpi.name}
                count={cfg.format ? cfg.format(kpi.value, kpi.unit) : kpi.value.toLocaleString('id-ID')}
                subtitle={kpi.status === 'warning' ? 'Perlu perhatian' : 'Status normal'}
                subtitleColor={kpi.status === 'warning' ? 'warning.main' : 'success.main'}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Status Pengajuan Sambungan */}
      {(data as any)?.getDashboardStats && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Status Pengajuan Sambungan Air
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard
                color="warning"
                icon={<HourglassEmpty />}
                title="Menunggu Verifikasi"
                count={(data as any).getDashboardStats.koneksiMenunggu ?? 0}
                subtitle="Perlu ditinjau"
                subtitleColor="warning.main"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                color="success"
                icon={<CheckCircle />}
                title="Disetujui"
                count={(data as any).getDashboardStats.koneksiDisetujui ?? 0}
                subtitle="Pengajuan berhasil"
                subtitleColor="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                color="error"
                icon={<Cancel />}
                title="Ditolak"
                count={(data as any).getDashboardStats.koneksiDitolak ?? 0}
                subtitle="Pengajuan ditolak"
                subtitleColor="error.main"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Charts */}
      <Grid container spacing={3} sx={{ mt: 1 }} alignItems="stretch">

        {/* Line chart — Pendapatan */}
        <Grid item xs={12} lg={8} sx={{ display: 'flex' }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Card Header */}
            <Box
              sx={{
                px: 3, pt: 2.5, pb: 1.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                borderBottom: '1px solid', borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  Pendapatan Tagihan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  6 bulan terakhir
                </Typography>
              </Box>
              <Box
                sx={{
                  background: 'linear-gradient(195deg, #49a3f1, #1A73E8)',
                  borderRadius: '8px',
                  px: 1.5,
                  py: 0.5,
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.03em' }}>
                  6 BULAN
                </Typography>
              </Box>
            </Box>

            {/* Chart area */}
            <Box sx={{ flex: 1, px: 1, py: 1.5, minHeight: 260 }}>
              {chartKonsumsiError ? (
                <Box sx={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt sx={{ color: 'error.main', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="error.main">Gagal memuat data grafik</Typography>
                </Box>
              ) : konsumsiChartData.length === 0 ? (
                <Box sx={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt sx={{ color: 'text.disabled', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="text.disabled">Belum ada data tagihan</Typography>
                  <Typography variant="caption" color="text.disabled">Data muncul setelah tagihan pertama diterbitkan</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 260 }}>
                  <DashboardLineChart data={konsumsiChartData} />
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Diperbarui secara otomatis
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Pie chart — Distribusi */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex' }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Card Header */}
            <Box
              sx={{
                px: 3, pt: 2.5, pb: 1.5,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                borderBottom: '1px solid', borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  Distribusi Pelanggan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Berdasarkan kelompok
                </Typography>
              </Box>
              <Box
                sx={{
                  background: 'linear-gradient(195deg, #42424a, #191919)',
                  borderRadius: '8px',
                  px: 1.5,
                  py: 0.5,
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.03em' }}>
                  LIVE
                </Typography>
              </Box>
            </Box>

            {/* Chart area */}
            <Box sx={{ flex: 1, px: 1, py: 1, minHeight: 220 }}>
              {distribusiError ? (
                <Box sx={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <People sx={{ color: 'error.main', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="error.main">Gagal memuat data grafik</Typography>
                </Box>
              ) : distribusiChartData.length === 0 ? (
                <Box sx={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <People sx={{ color: 'text.disabled', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="text.disabled">Belum ada data meteran</Typography>
                  <Typography variant="caption" color="text.disabled">Data muncul setelah meteran dipasang</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 220 }}>
                  <DashboardPieChart data={distribusiChartData} />
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Diperbarui secara otomatis
              </Typography>
            </Box>
          </Card>
        </Grid>

      </Grid>
    </AdminLayout>
  );
}
