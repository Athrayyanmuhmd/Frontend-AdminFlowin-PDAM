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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Badge,
  Divider,
} from '@mui/material';
import {
  Speed,
  DeviceHub,
  NetworkCheck,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Add,
  Edit,
  Delete,
  Settings,
  Wifi,
  WifiOff,
  Battery0Bar,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  BatteryFull,
  Schedule,
  WaterDrop,
  LocationOn,
  SignalCellular0Bar,
  SignalCellular1Bar,
  SignalCellular2Bar,
  SignalCellular3Bar,
  SignalCellular4Bar,
  PowerSettingsNew,
  Cloud,
  Download,
  Notifications,
  Map,
  Save,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  configuration: {
    readingInterval: number;
    units: string;
    tariffId: string;
  };
  alerts: string[];
  firmware: {
    version: string;
    lastUpdate: string;
  };
}

interface MeterReading {
  meterId: string;
  timestamp: string;
  reading: number;
  usage: number;
  flowRate: number;
  pressure: number;
  quality: 'good' | 'warning' | 'error';
}

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336'];

/**
 * ✅ Mapper Function: Convert backend Meteran to frontend SmartMeter interface
 * Backend fields: nomorMeteran, nomorAkun, idKelompokPelanggan, idKoneksiData
 * Frontend needs: IoT fields (battery, connectivity, firmware) - filled with defaults
 */
function mapBackendToSmartMeter(meteranList: any[]): SmartMeter[] {
  return meteranList.map((meteran, index) => {
    const customerName = meteran.idKoneksiData?.userId?.namaLengkap || 'Pelanggan Unknown';
    const address = meteran.idKoneksiData?.alamat || 'Alamat tidak tersedia';
    const latitude = meteran.idKoneksiData?.latitude || (-5.5483 + (Math.random() - 0.5) * 0.1);
    const longitude = meteran.idKoneksiData?.longitude || (95.3238 + (Math.random() - 0.5) * 0.1);

    // Generate realistic IoT mock data for presentation
    // TODO: Replace with real IoT device data when hardware is integrated
    const onlineStatus = index % 5 === 0 ? 'offline' : (index % 10 === 0 ? 'maintenance' : 'online');

    return {
      id: meteran._id,
      serialNumber: meteran.nomorMeteran,
      customerId: meteran.idKoneksiData?.userId?._id || '',
      customerName: customerName,
      location: {
        address: address,
        latitude: latitude,
        longitude: longitude
      },
      status: onlineStatus as any,
      connectivity: {
        type: ['wifi', 'cellular', 'lora'][index % 3] as any,
        signalStrength: onlineStatus === 'online' ? (70 + Math.floor(Math.random() * 30)) : 0,
        lastSeen: new Date(Date.now() - (onlineStatus === 'online' ? Math.random() * 300000 : Math.random() * 3600000)).toISOString()
      },
      battery: {
        level: 60 + Math.floor(Math.random() * 40),
        voltage: 3.3 + Math.random() * 0.4,
        lastReplaced: new Date(Date.now() - Math.random() * 180 * 24 * 3600000).toISOString()
      },
      readings: {
        current: meteran.totalPemakaian || Math.floor(Math.random() * 10000),
        previous: (meteran.totalPemakaian || 0) - (meteran.pemakaianBelumTerbayar || Math.floor(Math.random() * 500)),
        usage: meteran.pemakaianBelumTerbayar || Math.floor(Math.random() * 500),
        timestamp: new Date().toISOString()
      },
      configuration: {
        readingInterval: 60, // Default 60 minutes
        units: 'liters',
        tariffId: meteran.idKelompokPelanggan?._id || ''
      },
      alerts: onlineStatus === 'offline' ? ['Device offline'] : (Math.random() > 0.8 ? ['High usage detected'] : []),
      firmware: {
        version: '2.4.1',
        lastUpdate: new Date(Date.now() - Math.random() * 90 * 24 * 3600000).toISOString()
      }
    };
  });
}

export default function SmartMeterManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [meters, setMeters] = useState<SmartMeter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<SmartMeter | null>(null);
  const [openMeterDialog, setOpenMeterDialog] = useState(false);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ✅ GraphQL Query - Replace REST API/mock data
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
  });

  // Handle data when query completes
  useEffect(() => {
    if (data?.getAllMeteran) {
      const mappedMeters = mapBackendToSmartMeter(data.getAllMeteran);
      setMeters(mappedMeters);

      // Generate mock readings for demo (IoT integration future work)
      const mockReadings: MeterReading[] = Array.from({ length: 24 }, (_, i) => ({
        meterId: mappedMeters[0]?._id || 'meter-1',
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        reading: 1000 + i * 50 + Math.random() * 20,
        usage: 40 + Math.random() * 20,
        flowRate: 5 + Math.random() * 10,
        pressure: 20 + Math.random() * 5,
        quality: ['good', 'warning', 'error'][Math.floor(Math.random() * 3)] as any
      }));
      setReadings(mockReadings);
    }
  }, [data]);

  // Handle errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error loading meteran:', graphqlError);
    }
  }, [graphqlError]);

  const [newMeter, setNewMeter] = useState({
    serialNumber: '',
    customerId: '',
    location: {
      address: '',
      latitude: 0,
      longitude: 0
    },
    configuration: {
      readingInterval: 60,
      units: 'liters',
      tariffId: ''
    }
  });

  const [meterConfig, setMeterConfig] = useState({
    readingInterval: 60,
    units: 'liters',
    tariffId: '',
    alertThresholds: {
      highUsage: 1000,
      lowPressure: 10,
      tamperDetection: true
    }
  });

  // ✅ GraphQL auto-executes - no need for useEffect with refetch
  // Auto-refresh dapat dihandle dengan Apollo Client polling jika diperlukan

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

  const handleCreateMeter = async () => {
    try {
      // await smartMeterAPI.create(newMeter);
      setOpenMeterDialog(false);
      setNewMeter({
        serialNumber: '',
        customerId: '',
        location: { address: '', latitude: 0, longitude: 0 },
        configuration: { readingInterval: 60, units: 'liters', tariffId: '' }
      });
      await refetch();
    } catch (error) {
      console.error('Error creating meter:', error);
    }
  };

  const handleConfigureMeter = async () => {
    try {
      // await smartMeterAPI.configure(selectedMeter?.id, meterConfig);
      setOpenConfigDialog(false);
      setSelectedMeter(null);
      await refetch();
    } catch (error) {
      console.error('Error configuring meter:', error);
    }
  };

  const handleRemoteMeterAction = async (meterId: string, action: string) => {
    try {
      // await smartMeterAPI.remoteAction(meterId, action);
      await refetch();
    } catch (error) {
      console.error('Error performing remote action:', error);
    }
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
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
            <Tab label="Monitoring Real-time" icon={<TrendingUp />} />
            <Tab label="Analitik" icon={<BarChart />} />
            <Tab label="Konfigurasi" icon={<Settings />} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daftar Meteran Pintar
              </Typography>
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
                      <TableCell align="center">Pembacaan Terakhir</TableCell>
                      <TableCell align="center">Aksi</TableCell>
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
                              ID: {meter.customerId}
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
                            <Badge badgeContent={meter.alerts.length} color="error">
                              <Warning fontSize="small" sx={{ ml: 1 }} />
                            </Badge>
                          )}
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
                            <Typography variant="body2">
                              {meter.readings.current.toLocaleString()} L
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(meter.readings.timestamp).toLocaleString('id-ID')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Konfigurasi">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedMeter(meter);
                                  setOpenConfigDialog(true);
                                }}
                              >
                                <Settings />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hapus">
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Konsumsi Air Real-time (24 Jam Terakhir)
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={readings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis />
                        <RechartsTooltip
                          labelFormatter={(value) => new Date(value).toLocaleString('id-ID')}
                          formatter={(value: any, name) => [
                            `${Number(value).toFixed(1)} ${name === 'usage' ? 'L/h' : name === 'flowRate' ? 'L/min' : 'bar'}`,
                            name === 'usage' ? 'Konsumsi' : name === 'flowRate' ? 'Flow Rate' : 'Tekanan'
                          ]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="usage" stackId="1" stroke="#2196f3" fill="#2196f3" name="usage" />
                        <Area type="monotone" dataKey="flowRate" stackId="2" stroke="#4caf50" fill="#4caf50" name="flowRate" />
                        <Area type="monotone" dataKey="pressure" stackId="3" stroke="#ff9800" fill="#ff9800" name="pressure" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Status Konektivitas
                      </Typography>
                      <Box sx={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'WiFi', value: meters.filter(m => m.connectivity.type === 'wifi').length },
                                { name: 'Cellular', value: meters.filter(m => m.connectivity.type === 'cellular').length },
                                { name: 'LoRa', value: meters.filter(m => m.connectivity.type === 'lora').length },
                                { name: 'Ethernet', value: meters.filter(m => m.connectivity.type === 'ethernet').length },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
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

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Rata-rata Konsumsi Harian
                      </Typography>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h3" color="primary">
                          {(readings.reduce((sum, r) => sum + r.usage, 0) / readings.length).toFixed(0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Liter per Jam
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
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
                          fill="#8884d8"
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
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#2196f3" />
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
                    Tren Konsumsi Air (7 Hari Terakhir)
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={Array.from({ length: 7 }, (_, i) => ({
                        day: `Hari ${i + 1}`,
                        consumption: 800 + Math.random() * 400,
                        target: 1000
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="consumption" stroke="#2196f3" name="Konsumsi" />
                        <Line type="monotone" dataKey="target" stroke="#ff9800" strokeDasharray="5 5" name="Target" />
                      </LineChart>
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
                          {((onlineMeters / meters.length) * 100).toFixed(1)}%
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

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings color="primary" />
                    Pengaturan Global
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Interval Pembacaan Default</InputLabel>
                        <Select defaultValue={15} label="Interval Pembacaan Default">
                          <MenuItem value={5}>5 menit</MenuItem>
                          <MenuItem value={15}>15 menit</MenuItem>
                          <MenuItem value={30}>30 menit</MenuItem>
                          <MenuItem value={60}>1 jam</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Interval Transmisi Data</InputLabel>
                        <Select defaultValue={60} label="Interval Transmisi Data">
                          <MenuItem value={15}>15 menit</MenuItem>
                          <MenuItem value={30}>30 menit</MenuItem>
                          <MenuItem value={60}>1 jam</MenuItem>
                          <MenuItem value={120}>2 jam</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Threshold Alert (L/h)"
                        type="number"
                        defaultValue={1000}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Aktifkan Notifikasi Real-time"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Auto Backup Data"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button variant="contained" fullWidth startIcon={<Save />}>
                        Simpan Pengaturan
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications color="primary" />
                    Pengaturan Notifikasi
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Meteran Offline"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Baterai Rendah (<20%)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Konsumsi Tinggi"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Deteksi Kebocoran"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Deteksi Sabotase"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch />}
                        label="Error Komunikasi"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Download color="primary" />
                    Export Data
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth startIcon={<Download />}>
                        Export CSV
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth startIcon={<Download />}>
                        Export Excel
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth startIcon={<Download />}>
                        Export PDF
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth startIcon={<Cloud />}>
                        Backup Cloud
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PowerSettingsNew color="primary" />
                    Aksi Massal
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Perhatian:</strong> Aksi massal akan diterapkan ke semua meteran yang dipilih. Gunakan dengan hati-hati.
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Refresh />}
                        onClick={() => alert('Melakukan restart pada semua meteran...')}
                      >
                        Restart Semua
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Schedule />}
                        onClick={() => alert('Sinkronisasi waktu pada semua meteran...')}
                      >
                        Sync Waktu
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Settings />}
                        onClick={() => alert('Menerapkan konfigurasi ke semua meteran...')}
                      >
                        Terapkan Config
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Cloud />}
                        color="warning"
                        onClick={() => alert('Update firmware pada semua meteran...')}
                      >
                        Update Firmware
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Add Meter Dialog */}
      <Dialog open={openMeterDialog} onClose={() => setOpenMeterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tambah Meteran Pintar Baru</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={newMeter.serialNumber}
                onChange={(e) => setNewMeter({ ...newMeter, serialNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer ID"
                value={newMeter.customerId}
                onChange={(e) => setNewMeter({ ...newMeter, customerId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alamat Lokasi"
                value={newMeter.location.address}
                onChange={(e) => setNewMeter({
                  ...newMeter,
                  location: { ...newMeter.location, address: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={newMeter.location.latitude}
                onChange={(e) => setNewMeter({
                  ...newMeter,
                  location: { ...newMeter.location, latitude: parseFloat(e.target.value) }
                })}
                inputProps={{ step: 'any' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={newMeter.location.longitude}
                onChange={(e) => setNewMeter({
                  ...newMeter,
                  location: { ...newMeter.location, longitude: parseFloat(e.target.value) }
                })}
                inputProps={{ step: 'any' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Interval Pembacaan (menit)</InputLabel>
                <Select
                  value={newMeter.configuration.readingInterval}
                  onChange={(e) => setNewMeter({
                    ...newMeter,
                    configuration: { ...newMeter.configuration, readingInterval: Number(e.target.value) }
                  })}
                  label="Interval Pembacaan (menit)"
                >
                  <MenuItem value={15}>15 menit</MenuItem>
                  <MenuItem value={30}>30 menit</MenuItem>
                  <MenuItem value={60}>1 jam</MenuItem>
                  <MenuItem value={120}>2 jam</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tarif ID</InputLabel>
                <Select
                  value={newMeter.configuration.tariffId}
                  onChange={(e) => setNewMeter({
                    ...newMeter,
                    configuration: { ...newMeter.configuration, tariffId: e.target.value }
                  })}
                  label="Tarif ID"
                >
                  <MenuItem value="tariff-1">Rumah Tangga</MenuItem>
                  <MenuItem value="tariff-2">Komersial</MenuItem>
                  <MenuItem value="tariff-3">Industri</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMeterDialog(false)}>Batal</Button>
          <Button
            onClick={handleCreateMeter}
            variant="contained"
            disabled={!newMeter.serialNumber || !newMeter.customerId}
          >
            Tambah Meteran
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configure Meter Dialog */}
      <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Konfigurasi Meteran {selectedMeter?.serialNumber}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Interval Pembacaan (menit)</InputLabel>
                <Select
                  value={meterConfig.readingInterval}
                  onChange={(e) => setMeterConfig({ ...meterConfig, readingInterval: Number(e.target.value) })}
                  label="Interval Pembacaan (menit)"
                >
                  <MenuItem value={15}>15 menit</MenuItem>
                  <MenuItem value={30}>30 menit</MenuItem>
                  <MenuItem value={60}>1 jam</MenuItem>
                  <MenuItem value={120}>2 jam</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Batas Alert Konsumsi Tinggi (L/hari)"
                type="number"
                value={meterConfig.alertThresholds.highUsage}
                onChange={(e) => setMeterConfig({
                  ...meterConfig,
                  alertThresholds: { ...meterConfig.alertThresholds, highUsage: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Batas Alert Tekanan Rendah (bar)"
                type="number"
                value={meterConfig.alertThresholds.lowPressure}
                onChange={(e) => setMeterConfig({
                  ...meterConfig,
                  alertThresholds: { ...meterConfig.alertThresholds, lowPressure: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={meterConfig.alertThresholds.tamperDetection}
                    onChange={(e) => setMeterConfig({
                      ...meterConfig,
                      alertThresholds: { ...meterConfig.alertThresholds, tamperDetection: e.target.checked }
                    })}
                  />
                }
                label="Deteksi Sabotase"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigDialog(false)}>Batal</Button>
          <Button onClick={handleConfigureMeter} variant="contained">
            Simpan Konfigurasi
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}