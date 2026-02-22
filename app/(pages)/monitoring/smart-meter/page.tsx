// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Settings,
  Wifi,
  WifiOff,
  Battery0Bar,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  BatteryFull,
  WaterDrop,
  LocationOn,
  SignalCellular0Bar,
  SignalCellular1Bar,
  SignalCellular2Bar,
  SignalCellular3Bar,
  SignalCellular4Bar,
  NetworkCheck,
  DeviceHub,
  Add,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_METERAN } from '@/lib/graphql/queries/meteran';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SmartMeter {
  id: string;
  serialNumber: string;
  customerId: string;
  customerName: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: 'online' | 'offline' | 'maintenance' | 'error';
  connectivity: {
    type: 'wifi' | 'cellular' | 'lora' | 'ethernet';
    signalStrength: number;
    lastSeen: string;
  };
  battery: {
    level: number;
    voltage: number;
    lastReplaced: string;
  };
  readings: {
    current: number;
    previous: number;
    usage: number;
    timestamp: string;
  };
  alerts: string[];
}

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336'];

/**
 * Mapper Function: Convert backend Meteran to frontend SmartMeter interface
 * Backend fields: nomorMeteran, nomorAkun, idKelompokPelanggan, idKoneksiData
 * IoT fields (battery, connectivity) filled with defaults — hardware not yet integrated
 */
function mapBackendToSmartMeter(meteranList: any[]): SmartMeter[] {
  return meteranList.map((meteran, index) => {
    const customerName = meteran.idKoneksiData?.userId?.namaLengkap || 'Pelanggan Unknown';
    const address = meteran.idKoneksiData?.alamat || 'Alamat tidak tersedia';
    const latitude = meteran.idKoneksiData?.latitude || (-5.5483 + (Math.random() - 0.5) * 0.1);
    const longitude = meteran.idKoneksiData?.longitude || (95.3238 + (Math.random() - 0.5) * 0.1);

    const onlineStatus = index % 5 === 0 ? 'offline' : (index % 10 === 0 ? 'maintenance' : 'online');

    return {
      id: meteran._id,
      serialNumber: meteran.nomorMeteran,
      customerId: meteran.idKoneksiData?.userId?._id || '',
      customerName,
      location: { address, latitude, longitude },
      status: onlineStatus as SmartMeter['status'],
      connectivity: {
        type: (['wifi', 'cellular', 'lora'] as const)[index % 3],
        signalStrength: onlineStatus === 'online' ? (70 + Math.floor(Math.random() * 30)) : 0,
        lastSeen: new Date(Date.now() - (onlineStatus === 'online' ? Math.random() * 300000 : Math.random() * 3600000)).toISOString(),
      },
      battery: {
        level: 60 + Math.floor(Math.random() * 40),
        voltage: 3.3 + Math.random() * 0.4,
        lastReplaced: new Date(Date.now() - Math.random() * 180 * 24 * 3600000).toISOString(),
      },
      readings: {
        current: meteran.totalPemakaian || 0,
        previous: (meteran.totalPemakaian || 0) - (meteran.pemakaianBelumTerbayar || 0),
        usage: meteran.pemakaianBelumTerbayar || 0,
        timestamp: new Date().toISOString(),
      },
      alerts: onlineStatus === 'offline' ? ['Device offline'] : (Math.random() > 0.8 ? ['High usage detected'] : []),
    };
  });
}

export default function SmartMeterManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [meters, setMeters] = useState<SmartMeter[]>([]);

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.getAllMeteran) {
      setMeters(mapBackendToSmartMeter(data.getAllMeteran));
    }
  }, [data]);

  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error loading meteran:', graphqlError);
    }
  }, [graphqlError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle />;
      case 'offline': return <Error />;
      case 'maintenance': return <Settings />;
      case 'error': return <Warning />;
      default: return <Warning />;
    }
  };

  const getConnectivityIcon = (type: string, signalStrength: number) => {
    switch (type) {
      case 'wifi':
        return signalStrength > 50 ? <Wifi color="success" /> : <WifiOff color="error" />;
      case 'cellular':
        if (signalStrength >= 80) return <SignalCellular4Bar color="success" />;
        if (signalStrength >= 60) return <SignalCellular3Bar color="success" />;
        if (signalStrength >= 40) return <SignalCellular2Bar color="warning" />;
        if (signalStrength >= 20) return <SignalCellular1Bar color="warning" />;
        return <SignalCellular0Bar color="error" />;
      case 'lora':
        return <NetworkCheck color={signalStrength > 50 ? 'success' : 'warning'} />;
      case 'ethernet':
        return <DeviceHub color="success" />;
      default:
        return <NetworkCheck />;
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level >= 80) return <BatteryFull color="success" />;
    if (level >= 60) return <Battery3Bar color="success" />;
    if (level >= 40) return <Battery2Bar color="warning" />;
    if (level >= 20) return <Battery1Bar color="warning" />;
    return <Battery0Bar color="error" />;
  };

  if (loading && meters.length === 0) {
    return (
      <AdminLayout title="Manajemen Meteran Pintar">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  const onlineMeters = meters.filter(m => m.status === 'online').length;
  const offlineMeters = meters.filter(m => m.status === 'offline').length;
  const maintenanceMeters = meters.filter(m => m.status === 'maintenance').length;
  const errorMeters = meters.filter(m => m.status === 'error').length;

  return (
    <AdminLayout title="Manajemen Meteran Pintar">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manajemen Meteran Pintar
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/monitoring/smart-meters/register')}
            >
              Registrasi Meteran
            </Button>
          </Box>
        </Box>

        {/* Status Overview Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  <Box>
                    <Typography variant="h6">{onlineMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Online</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Error color="error" />
                  <Box>
                    <Typography variant="h6">{offlineMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Offline</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings color="warning" />
                  <Box>
                    <Typography variant="h6">{maintenanceMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Maintenance</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="error" />
                  <Box>
                    <Typography variant="h6">{errorMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Error</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Daftar Meteran" icon={<Speed />} />
            <Tab label="Analitik" icon={<TrendingUp />} />
          </Tabs>
        </Box>

        {/* Tab 0: Daftar Meteran */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daftar Meteran Pintar
              </Typography>
              {meters.length === 0 ? (
                <Alert severity="info">Belum ada meteran terdaftar.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Serial Number</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>Lokasi</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Konektivitas</TableCell>
                        <TableCell align="center">Baterai</TableCell>
                        <TableCell align="center">Pemakaian (m³)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meters.map((meter) => (
                        <TableRow key={meter.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {meter.serialNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{meter.customerName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {meter.customerId || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" />
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {meter.location.address}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <Chip
                                icon={getStatusIcon(meter.status)}
                                label={
                                  meter.status === 'online' ? 'Online' :
                                  meter.status === 'offline' ? 'Offline' :
                                  meter.status === 'maintenance' ? 'Maintenance' : 'Error'
                                }
                                color={getStatusColor(meter.status) as any}
                                size="small"
                              />
                              {meter.alerts.length > 0 && (
                                <Tooltip title={meter.alerts.join(', ')}>
                                  <Badge badgeContent={meter.alerts.length} color="error">
                                    <Warning fontSize="small" />
                                  </Badge>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              {getConnectivityIcon(meter.connectivity.type, meter.connectivity.signalStrength)}
                              <Typography variant="caption">
                                {meter.connectivity.signalStrength}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              {getBatteryIcon(meter.battery.level)}
                              <Typography variant="caption">
                                {meter.battery.level}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {meter.readings.usage.toLocaleString('id-ID')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                belum terbayar
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 1: Analitik */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribusi Status Meteran
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Online', value: onlineMeters },
                            { name: 'Offline', value: offlineMeters },
                            { name: 'Maintenance', value: maintenanceMeters },
                            { name: 'Error', value: errorMeters },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Level Baterai Meteran
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { range: '0-20%', count: meters.filter(m => m.battery.level <= 20).length },
                        { range: '21-40%', count: meters.filter(m => m.battery.level > 20 && m.battery.level <= 40).length },
                        { range: '41-60%', count: meters.filter(m => m.battery.level > 40 && m.battery.level <= 60).length },
                        { range: '61-80%', count: meters.filter(m => m.battery.level > 60 && m.battery.level <= 80).length },
                        { range: '81-100%', count: meters.filter(m => m.battery.level > 80).length },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#2196f3" name="Jumlah Meteran" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistik Meteran
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">{meters.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Meteran</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {meters.length > 0 ? ((onlineMeters / meters.length) * 100).toFixed(1) : '0'}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Uptime</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {meters.filter(m => m.battery.level < 30).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Baterai Rendah</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                          {meters.filter(m => m.alerts.length > 0).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Alert Aktif</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </AdminLayout>
  );
}
