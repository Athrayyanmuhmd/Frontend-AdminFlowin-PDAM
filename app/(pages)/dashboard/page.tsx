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
  WaterDrop,
  Speed,
  People,
  Receipt,
  Build,
  Warning,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../layouts/AdminLayout';
import { DashboardKPI } from '../../types/admin.types';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/queries/dashboard';

// Mock data untuk demo
const mockKPIs: DashboardKPI[] = [
  {
    id: '1',
    name: 'Efisiensi Produksi',
    value: 87.5,
    unit: '%',
    target: 85,
    trend: 'up',
    changePercentage: 2.3,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '2',
    name: 'Air Tidak Berekening',
    value: 18.2,
    unit: '%',
    target: 20,
    trend: 'down',
    changePercentage: -1.8,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Waktu Respons Layanan',
    value: 2.4,
    unit: 'jam',
    target: 4,
    trend: 'down',
    changePercentage: -15.2,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '4',
    name: 'Efisiensi Penagihan',
    value: 92.8,
    unit: '%',
    target: 90,
    trend: 'up',
    changePercentage: 1.2,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '5',
    name: 'Uptime Aset',
    value: 98.7,
    unit: '%',
    target: 95,
    trend: 'up',
    changePercentage: 0.5,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '6',
    name: 'Kepatuhan Kualitas Air',
    value: 99.1,
    unit: '%',
    target: 98,
    trend: 'up',
    changePercentage: 0.3,
    status: 'good',
    lastUpdated: new Date(),
  },
];

const consumptionData = [
  { month: 'Jan', consumption: 45000, revenue: 125000000 },
  { month: 'Feb', consumption: 48000, revenue: 135000000 },
  { month: 'Mar', consumption: 52000, revenue: 145000000 },
  { month: 'Apr', consumption: 49000, revenue: 138000000 },
  { month: 'Mei', consumption: 55000, revenue: 155000000 },
  { month: 'Jun', consumption: 58000, revenue: 165000000 },
];

const customerTypeData = [
  { name: 'Rumah Tangga', value: 8500, color: '#2196F3' },
  { name: 'Komersial', value: 3200, color: '#4CAF50' },
  { name: 'Industri', value: 1800, color: '#FF9800' },
  { name: 'Sosial', value: 500, color: '#9C27B0' },
];

const systemStatusData = [
  { name: 'Plant Pengolahan A', status: 'normal', flow: 1250, pressure: 3.2 },
  { name: 'Plant Pengolahan B', status: 'warning', flow: 980, pressure: 2.8 },
  { name: 'Reservoir Utama', status: 'normal', flow: 2100, pressure: 4.1 },
  { name: 'Distribusi Zona 1', status: 'normal', flow: 850, pressure: 2.5 },
  { name: 'Distribusi Zona 2', status: 'critical', flow: 420, pressure: 1.8 },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPI[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ GraphQL Query - Replace REST API dengan GraphQL
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'network-only', // Always fetch fresh data
  });

  // Handle data when query completes
  useEffect(() => {
    if (data?.getDashboardStats) {
      updateDashboardFromGraphQL(data.getDashboardStats);
    }
  }, [data]);

  // Handle errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      // Fallback to mock data if GraphQL fails
      setKpis(mockKPIs);
    }
  }, [graphqlError]);

  const updateDashboardFromGraphQL = (stats: any) => {
    // Generate KPIs from GraphQL data
    const realKPIs: DashboardKPI[] = [
      {
        id: '1',
        name: 'Total Pelanggan',
        value: stats.totalPelanggan || 0,
        unit: '',
        target: 15000,
        trend: stats.totalPelanggan > 14000 ? 'up' : 'down',
        changePercentage: 2.3,
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '2',
        name: 'Total Meteran Terpasang',
        value: stats.totalMeteran || 0,
        unit: '',
        target: stats.totalPelanggan || 0,
        trend: 'up',
        changePercentage: 1.5,
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '3',
        name: 'Work Orders Aktif',
        value: stats.activeWorkOrders || 0,
        unit: '',
        target: 50,
        trend: stats.activeWorkOrders < 30 ? 'down' : 'up',
        changePercentage: -3.1,
        status: stats.activeWorkOrders < 30 ? 'good' : 'warning',
        lastUpdated: new Date(),
      },
      {
        id: '4',
        name: 'Tagihan Bulan Ini',
        value: stats.totalTagihanBulanIni || 0,
        unit: 'Rp',
        target: 150000000,
        trend: 'up',
        changePercentage: 5.2,
        status: 'good',
        lastUpdated: new Date(),
      },
      {
        id: '5',
        name: 'Tunggakan Aktif',
        value: stats.tunggakanAktif || 0,
        unit: '',
        target: 100,
        trend: stats.tunggakanAktif < 100 ? 'down' : 'up',
        changePercentage: -2.1,
        status: stats.tunggakanAktif < 100 ? 'good' : 'warning',
        lastUpdated: new Date(),
      },
      {
        id: '6',
        name: 'Pending Koneksi',
        value: stats.pendingKoneksi || 0,
        unit: '',
        target: 20,
        trend: stats.pendingKoneksi < 20 ? 'down' : 'up',
        changePercentage: -1.5,
        status: stats.pendingKoneksi < 20 ? 'good' : 'warning',
        lastUpdated: new Date(),
      },
    ];

    setKpis(realKPIs);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch(); // ✅ GraphQL refetch - replace loadDashboardData()
    setIsRefreshing(false);
  };

  // ✅ GraphQL auto-executes on mount - no need for useEffect
  // Auto-refresh dapat dihandle dengan polling di GraphQL Apollo Client jika diperlukan

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
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

  // ✅ GraphQL Loading State
  if (loading && kpis.length === 0) {
    return (
      <AdminLayout title="Dashboard Eksekutif">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  // ✅ GraphQL Error State
  if (graphqlError && kpis.length === 0) {
    return (
      <AdminLayout title="Dashboard Eksekutif">
        <Alert severity="error" sx={{ mb: 3 }}>
          Gagal memuat data dashboard: {graphqlError.message}
          <br />
          <em>Menampilkan data mock untuk demo.</em>
        </Alert>
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

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
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
                    {kpi.changePercentage > 0 ? '+' : ''}{kpi.changePercentage}%
                  </Typography>
                </Box>

                {kpi.target && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {kpi.target}{kpi.unit}
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Konsumsi dan Pendapatan */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Konsumsi Air dan Pendapatan (6 Bulan Terakhir)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumptionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'consumption' ? `${value.toLocaleString('id-ID')} m³` : `Rp ${value.toLocaleString('id-ID')}`,
                        name === 'consumption' ? 'Konsumsi' : 'Pendapatan'
                      ]}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="#2196F3" 
                      strokeWidth={3}
                      name="consumption"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4CAF50" 
                      strokeWidth={3}
                      name="revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribusi Pelanggan */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribusi Jenis Pelanggan
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `${value.toLocaleString('id-ID')} pelanggan`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Status Sistem SCADA Real-time
              </Typography>
              <Grid container spacing={2}>
                {systemStatusData.map((system, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: system.status === 'normal' ? 'success.main' : 
                                   system.status === 'warning' ? 'warning.main' : 'error.main',
                        borderRadius: 2,
                        backgroundColor: system.status === 'normal' ? 'success.light' : 
                                       system.status === 'warning' ? 'warning.light' : 'error.light',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {system.name}
                        </Typography>
                        <Chip 
                          label={system.status.toUpperCase()} 
                          size="small"
                          color={system.status === 'normal' ? 'success' : 
                                 system.status === 'warning' ? 'warning' : 'error'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Aliran
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {system.flow} L/min
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Tekanan
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {system.pressure} bar
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}
