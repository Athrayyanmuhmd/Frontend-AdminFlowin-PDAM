// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Refresh,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { Skeleton } from '@mui/material';

const DashboardLineChart = dynamic(
  () => import('../../components/charts/DashboardLineChart'),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 1 }} />,
  }
);

const DashboardPieChart = dynamic(
  () => import('../../components/charts/DashboardPieChart'),
  {
    ssr: false,
    loading: () => <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />,
  }
);
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../layouts/AdminLayout';
import { DashboardKPI } from '../../types/admin.types';
import { GET_DASHBOARD_STATS, GET_CHART_KONSUMSI_PER_BULAN, GET_DISTRIBUSI_KELOMPOK_PELANGGAN } from '@/lib/graphql/queries/dashboard';

const CHART_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'network-only',
  });

  const { data: chartKonsumsiData, refetch: refetchKonsumsi } = useQuery(GET_CHART_KONSUMSI_PER_BULAN, {
    fetchPolicy: 'network-only',
  });

  const { data: distribusiData, refetch: refetchDistribusi } = useQuery(GET_DISTRIBUSI_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.getDashboardStats) {
      updateDashboardFromGraphQL(data.getDashboardStats);
    }
  }, [data]);

  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
    }
  }, [graphqlError]);

  const updateDashboardFromGraphQL = (stats: any) => {
    const realKPIs: DashboardKPI[] = [
      {
        id: '1',
        name: 'Total Pelanggan',
        value: stats.totalPelanggan || 0,
        unit: '',
        trend: 'up',
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '2',
        name: 'Total Meteran Terpasang',
        value: stats.totalMeteran || 0,
        unit: '',
        trend: 'up',
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '3',
        name: 'Work Orders Aktif',
        value: stats.activeWorkOrders || 0,
        unit: '',
        trend: stats.activeWorkOrders > 0 ? 'up' : 'down',
        status: stats.activeWorkOrders > 30 ? 'warning' : 'good',
        lastUpdated: new Date(),
      },
      {
        id: '4',
        name: 'Tagihan Bulan Ini',
        value: stats.totalTagihanBulanIni || 0,
        unit: 'Rp',
        trend: 'up',
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '5',
        name: 'Tunggakan Aktif',
        value: stats.tunggakanAktif || 0,
        unit: '',
        trend: stats.tunggakanAktif > 0 ? 'up' : 'down',
        status: stats.tunggakanAktif > 100 ? 'warning' : 'good',
        lastUpdated: new Date(),
      },
      {
        id: '6',
        name: 'Pending Koneksi',
        value: stats.pendingKoneksi || 0,
        unit: '',
        trend: stats.pendingKoneksi > 0 ? 'up' : 'down',
        status: stats.pendingKoneksi > 20 ? 'warning' : 'good',
        lastUpdated: new Date(),
      },
    ];

    setKpis(realKPIs);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchKonsumsi(), refetchDistribusi()]);
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Warning color="error" />;
      default: return <CheckCircle />;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
  };

  // Data chart dari GraphQL — fallback ke array kosong jika belum ada data
  const konsumsiChartData = chartKonsumsiData?.getChartKonsumsiPerBulan || [];
  const distribusiChartData = (distribusiData?.getDistribusiKelompokPelanggan || []).map(
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

  return (
    <AdminLayout title="Dashboard Eksekutif">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
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

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {kpi.name}
                  </Typography>
                  {getStatusIcon(kpi.status)}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {kpi.value.toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {kpi.unit}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {getTrendIcon(kpi.trend)}
                  <Typography
                    variant="body2"
                    color={kpi.trend === 'up' ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 500 }}
                  >
                    {kpi.trend === 'up' ? 'Naik' : 'Turun'}
                  </Typography>
                </Box>

                {kpi.target && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {kpi.target.toLocaleString('id-ID')}{kpi.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((kpi.value / kpi.target) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((kpi.value / kpi.target) * 100, 100)}
                      color={kpi.value >= kpi.target ? 'success' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3}>
        {/* Pendapatan per Bulan (6 Bulan Terakhir) */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Pendapatan Tagihan (6 Bulan Terakhir)
              </Typography>
              {konsumsiChartData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Belum ada data tagihan
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <DashboardLineChart data={konsumsiChartData} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribusi Kelompok Pelanggan */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribusi Kelompok Pelanggan
              </Typography>
              {distribusiChartData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Belum ada data meteran terpasang
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <DashboardPieChart data={distribusiChartData} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}
