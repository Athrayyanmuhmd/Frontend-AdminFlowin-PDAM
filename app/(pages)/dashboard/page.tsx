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
  Chip,
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
  Schedule,
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
    loading: () => <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 1 }} />,
  }
);

const DashboardPieChart = nextDynamic(
  () => import('../../components/charts/DashboardPieChart'),
  {
    ssr: false,
    loading: () => <Skeleton variant="circular" width={140} height={140} sx={{ mx: 'auto' }} />,
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
  });

  const { data: chartKonsumsiData, refetch: refetchKonsumsi } = useQuery(GET_CHART_KONSUMSI_PER_BULAN, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: distribusiData, refetch: refetchDistribusi } = useQuery(GET_DISTRIBUSI_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'cache-and-network',
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

  if (loading && kpis.length === 0) {
    return (
      <AdminLayout title="Dashboard Eksekutif">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Dashboard Eksekutif">
      {/* ── Header ── */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Dashboard Eksekutif
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ringkasan operasional sistem Aqualink
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
          >
            <Refresh sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {graphqlError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Gagal memuat sebagian data dashboard: {graphqlError.message}
        </Alert>
      )}

      {/* ── KPI Row ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => {
          const cfg = KPI_CONFIG[kpi.id];
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id} sx={{ display: 'flex' }}>
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

      {/* ── Status Pengajuan Sambungan ── */}
      {(data as any)?.getDashboardStats && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Status Pengajuan Sambungan Air
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
              <StatCard
                color="warning"
                icon={<HourglassEmpty />}
                title="Menunggu Verifikasi"
                count={(data as any).getDashboardStats.koneksiMenunggu ?? 0}
                subtitle="Perlu ditinjau"
                subtitleColor="warning.main"
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
              <StatCard
                color="success"
                icon={<CheckCircle />}
                title="Disetujui"
                count={(data as any).getDashboardStats.koneksiDisetujui ?? 0}
                subtitle="Pengajuan berhasil"
                subtitleColor="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
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

      {/* ── Chart Section ── */}
      <Grid container spacing={3} sx={{ mt: 3 }} alignItems="stretch">
        {/* Line Chart — Pendapatan Tagihan */}
        <Grid item xs={12} lg={8} sx={{ display: 'flex' }}>
          <Card sx={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Floating gradient chart header */}
            <Box
              sx={{
                background: 'linear-gradient(195deg, #49a3f1, #1A73E8)',
                borderRadius: '12px',
                mx: 2,
                mt: -3,
                p: 1.5,
                height: 240,
                flexShrink: 0,
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(26,115,232,0.4)',
              }}
            >
              {konsumsiChartData.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    Belum ada data tagihan
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Data akan muncul setelah tagihan pertama diterbitkan
                  </Typography>
                </Box>
              ) : (
                <DashboardLineChart data={konsumsiChartData} darkMode />
              )}
            </Box>
            {/* Card body */}
            <Box px={2.5} pt={2} pb={2} sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    Pendapatan Tagihan
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    6 bulan terakhir
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  Diperbarui secara otomatis
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Pie Chart — Distribusi Kelompok */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex' }}>
          <Card sx={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Floating gradient chart header */}
            <Box
              sx={{
                background: 'linear-gradient(195deg, #42424a, #191919)',
                borderRadius: '12px',
                mx: 2,
                mt: -3,
                p: 1.5,
                height: 200,
                flexShrink: 0,
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(25,25,25,0.4)',
              }}
            >
              {distribusiChartData.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    Belum ada data meteran
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Data akan muncul setelah meteran dipasang
                  </Typography>
                </Box>
              ) : (
                <DashboardPieChart data={distribusiChartData} darkMode showLegend={false} />
              )}
            </Box>
            {/* Card body */}
            <Box px={2.5} pt={2} pb={2} sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                Distribusi Kelompok Pelanggan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Berdasarkan meteran terpasang
              </Typography>

              {/* Inline legend rendered below chart title */}
              {distribusiChartData.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {distribusiChartData.map((item: any) => (
                    <Box
                      key={item.namaKelompok}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          flexShrink: 0,
                          boxShadow: `0 0 0 2px ${item.color}22`,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                        {item.namaKelompok}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  Diperbarui secara otomatis
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}