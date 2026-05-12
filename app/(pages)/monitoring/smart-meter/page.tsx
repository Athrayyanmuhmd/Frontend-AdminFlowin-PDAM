'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Divider,
  Stack,
  Fade,
  Skeleton,
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  WaterDrop,
  LocationOn,
  MonitorHeart,
  AttachMoney,
  OpenInNew,
  Group,
  AccountBalance,
  CalendarMonth,
  Today,
  ShowChart,
  LocalFireDepartment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  GET_ALL_METERAN,
  GET_RIWAYAT_PENGGUNAAN_BULANAN,
  GET_RIWAYAT_PENGGUNAAN,
  GET_ESTIMASI_BIAYA,
  GET_MONITORING_DASHBOARD,
} from '@/lib/graphql/queries/meteran';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface SmartMeter {
  id: string;
  serialNumber: string;
  nomorAkun: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  namaKelompok: string;
  statusAktif: boolean;
  location: { address: string };
  pemakaianBelumTerbayar: number;
  totalPemakaian: number;
  lastUpdate: string;
}

function mapBackendToSmartMeter(meteranList: any[]): SmartMeter[] {
  return meteranList.map((meteran) => ({
    id: meteran._id,
    serialNumber: meteran.NomorMeteran,
    nomorAkun: meteran.NomorAkun || '-',
    customerId: meteran.IdKoneksiData?.IdPelanggan?._id || '',
    customerName: meteran.IdKoneksiData?.IdPelanggan?.namaLengkap || 'Belum terhubung',
    customerEmail: meteran.IdKoneksiData?.IdPelanggan?.email || '-',
    namaKelompok: meteran.IdKelompokPelanggan?.NamaKelompok || '-',
    statusAktif: meteran.statusAktif ?? true,
    location: { address: meteran.IdKoneksiData?.Alamat || 'Alamat tidak tersedia' },
    pemakaianBelumTerbayar: meteran.pemakaianBelumTerbayar || 0,
    totalPemakaian: meteran.totalPemakaian || 0,
    lastUpdate: meteran.updatedAt || new Date().toISOString(),
  }));
}

// Helper format tanggal Indonesia
const formatTanggal = (date: Date) => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

// Format tanggal Indonesia pendek
const formatTanggalPendek = (dateStr: string) => {
  const date = new Date(dateStr);
  const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return `${hari[date.getDay()]} ${date.getDate()}`;
};

// Helper format bulan Indonesia
const formatBulanIndonesia = (dateStr: string) => {
  const [year, month] = dateStr.split('-');
  const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${bulan[parseInt(month)]} ${year}`;
};

const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

export default function SmartMeterManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMeteranId, setSelectedMeteranId] = useState<string>('');
  const [selectedPeriode, setSelectedPeriode] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [meters, setMeters] = useState<SmartMeter[]>([]);

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
  });

  const [fetchBulanan, { data: bulananDataRaw, loading: bulananLoading }] = useLazyQuery(GET_RIWAYAT_PENGGUNAAN_BULANAN);
  const [fetchRiwayat, { data: riwayatDataRaw, loading: riwayatLoading }] = useLazyQuery(GET_RIWAYAT_PENGGUNAAN);
  const [fetchEstimasi, { data: estimasiDataRaw, loading: estimasiLoading }] = useLazyQuery(GET_ESTIMASI_BIAYA);
  const [fetchMonitoring, { data: monitoringDataRaw, loading: monitoringLoading }] = useLazyQuery(GET_MONITORING_DASHBOARD, { fetchPolicy: 'network-only' });
  const bulananData = bulananDataRaw as any;
  const riwayatData = riwayatDataRaw as any;
  const estimasiData = estimasiDataRaw as any;
  const monitoringData = (monitoringDataRaw as any)?.getMonitoringDashboard;

  useEffect(() => {
    if ((data as any)?.getAllMeteran) {
      const mapped = mapBackendToSmartMeter((data as any).getAllMeteran);
      setMeters(mapped);
    }
  }, [data]);

  useEffect(() => {
    if (selectedMeteranId) {
      fetchBulanan({ variables: { meteranId: selectedMeteranId } });
      fetchRiwayat({ variables: { meteranId: selectedMeteranId, limit: 30 } });
      fetchEstimasi({ variables: { meteranId: selectedMeteranId } });
      fetchMonitoring({ variables: { meteranId: selectedMeteranId, periode: selectedPeriode } });
    }
  }, [selectedMeteranId, selectedPeriode]);

  if (authLoading || !isAuthenticated) return null;

  const aktifMeters = meters.filter(m => m.statusAktif).length;
  const nonaktifMeters = meters.filter(m => !m.statusAktif).length;
  const totalPemakaianBelumTerbayar = meters.reduce((s, m) => s + m.pemakaianBelumTerbayar, 0);

  const selectedMeter = meters.find(m => m.id === selectedMeteranId);
  const today = new Date();

  return (
    <AdminLayout title="Manajemen Meteran Pintar">
      <Fade in timeout={400}>
        <Box>
          {/* ─── Header ─────────────────────────────────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>Manajemen Meteran Pintar</Typography>
                  <Chip
                    icon={<WaterDrop />}
                    label={`${meters.length} Meteran`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatTanggal(today)} · Monitoring pemakaian air real-time
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Segarkan Data">
                  <IconButton onClick={() => refetch()} sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Box>

          {/* ─── Stats Cards ────────────────────────────────────────────── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Total Meteran
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {meters.length}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        {aktifMeters} aktif · {nonaktifMeters} nonaktif
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Speed sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Meteran Aktif
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {aktifMeters}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Sedang beroperasi
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <CheckCircle sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #c62828 0%, #f44336 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Meteran Nonaktif
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {nonaktifMeters}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Perlu perhatian
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Error sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(2, 136, 209, 0.3)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Total Pemakaian
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {(totalPemakaianBelumTerbayar / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} m³
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Belum terbayar
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <WaterDrop sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Tabs ────────────────────────────────────────────────────── */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                }
              }}
            >
              <Tab label="Daftar Meteran" icon={<Speed />} iconPosition="start" />
              <Tab label="Monitoring Pemakaian" icon={<MonitorHeart />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Tab 0: Daftar Meteran */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Card sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                  ))}
                </Stack>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 1000 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5, pl: 3, width: 50 }}>#</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>No. Meteran</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Pelanggan</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Kelompok Tarif</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Lokasi</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="center">Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="right">Belum Bayar</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                            <Speed sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">Belum Ada Meteran Terdaftar</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        meters.map((meter, index) => (
                          <TableRow key={meter.id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                            <TableCell sx={{ pl: 3, color: 'text.secondary', fontSize: 13 }}>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{
                                fontFamily: 'monospace', fontWeight: 700,
                                color: 'primary.main', bgcolor: 'primary.50',
                                px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block'
                              }}>
                                {meter.serialNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{meter.customerName}</Typography>
                              {meter.customerEmail !== '-' && (
                                <Typography variant="caption" color="text.secondary">{meter.customerEmail}</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip icon={<Group fontSize="small" />} label={meter.namaKelompok} size="small" variant="outlined" color="primary" />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                <LocationOn fontSize="small" color="action" sx={{ mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {meter.location.address.length > 40 ? meter.location.address.substring(0, 40) + '...' : meter.location.address}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={meter.statusAktif ? <CheckCircle /> : <Error />}
                                label={meter.statusAktif ? 'Aktif' : 'Nonaktif'}
                                color={meter.statusAktif ? 'success' : 'default'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={meter.pemakaianBelumTerbayar > 20 ? 'error.main' : 'text.primary'}
                              >
                                {(meter.pemakaianBelumTerbayar / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Lihat Monitoring">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<MonitorHeart fontSize="small" />}
                                  onClick={() => {
                                    setSelectedMeteranId(meter.id);
                                    setActiveTab(1);
                                  }}
                                >
                                  Monitor
                                </Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            )}
          </TabPanel>

          {/* Tab 1: Monitoring Pemakaian */}
          <TabPanel value={activeTab} index={1}>
            {/* Meter Selector */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: { xs: '100%', sm: 350 } }}>
                    <InputLabel>Pilih Meteran</InputLabel>
                    <Select
                      value={selectedMeteranId}
                      label="Pilih Meteran"
                      onChange={(e: SelectChangeEvent) => setSelectedMeteranId(e.target.value)}
                    >
                      {meters.map(m => (
                        <MenuItem key={m.id} value={m.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {m.serialNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">— {m.customerName}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    type="month"
                    label="Periode"
                    value={selectedPeriode}
                    onChange={(e) => setSelectedPeriode(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 180 }}
                    inputProps={{ max: new Date().toISOString().slice(0, 7) }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {monitoringLoading ? (
                      <CircularProgress size={20} />
                    ) : monitoringData ? (
                      <>
                        <Chip
                          icon={monitoringData.redisConnected ? <CheckCircle /> : <Warning />}
                          label={monitoringData.redisConnected ? 'Redis Terhubung' : 'Data MongoDB'}
                          color={monitoringData.redisConnected ? 'success' : 'warning'}
                          size="small"
                        />
                        {monitoringData.lastUpdate && (
                          <Typography variant="caption" color="text.secondary">
                            Update: {new Date(monitoringData.lastUpdate).toLocaleString('id-ID')}
                          </Typography>
                        )}
                      </>
                    ) : null}
                  </Box>
                </Box>

                {selectedMeter && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Speed />}
                      label={selectedMeter.serialNumber}
                      sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {selectedMeter.customerName} · {selectedMeter.namaKelompok}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedMeter.location.address}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Placeholder when no meter selected */}
            {!selectedMeteranId && (
              <Alert severity="info" icon={<MonitorHeart />} sx={{ borderRadius: 2 }}>
                <Typography variant="body1" fontWeight={600}>Pilih meteran untuk melihat data monitoring</Typography>
                <Typography variant="body2" color="text.secondary">
                  Gunakan dropdown di atas untuk memilih meteran yang ingin dipantau.
                </Typography>
              </Alert>
            )}

            {/* Monitoring Dashboard */}
            {monitoringLoading && selectedMeteranId && (
              <Grid container spacing={2.5}>
                {[1, 2, 3, 4].map(i => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={40} />
                        <Skeleton variant="text" width="80%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {monitoringData && (
              <>
                {/* Period Info */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" color="primary" />
                      Monitoring Periode {formatBulanIndonesia(selectedPeriode)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data harian dari IoT meteran · {monitoringData.bulanIni.dataHarian.length} hari tercatat
                    </Typography>
                  </Box>
                </Box>

                {/* Stats Row 1: Usage & Comparison */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
                      color: 'white',
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(2, 136, 209, 0.25)',
                    }}>
                      <CardContent sx={{ py: 2.5, px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                              Pemakaian Bulan Ini
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                              {(monitoringData.bulanIni.totalPenggunaan / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              {monitoringData.bulanIni.periode}
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <WaterDrop sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: monitoringData.perbandingan?.status === 'naik'
                        ? 'linear-gradient(135deg, #c62828 0%, #f44336 100%)'
                        : monitoringData.perbandingan?.status === 'turun'
                        ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                        : 'linear-gradient(135deg, #616161 0%, #9e9e9e 100%)',
                      color: 'white',
                      borderRadius: 2,
                      boxShadow: monitoringData.perbandingan?.status === 'naik'
                        ? '0 4px 20px rgba(244, 67, 54, 0.25)'
                        : monitoringData.perbandingan?.status === 'turun'
                        ? '0 4px 20px rgba(76, 175, 80, 0.25)'
                        : '0 4px 20px rgba(158, 158, 158, 0.25)',
                    }}>
                      <CardContent sx={{ py: 2.5, px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                              vs Bulan Lalu
                            </Typography>
                            {monitoringData.perbandingan ? (
                              <>
                                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {monitoringData.perbandingan.status === 'naik' ? <TrendingUp sx={{ fontSize: 20 }} /> :
                                   monitoringData.perbandingan.status === 'turun' ? <TrendingDown sx={{ fontSize: 20 }} /> : null}
                                  {monitoringData.perbandingan.status === 'naik' ? '+' : monitoringData.perbandingan.status === 'turun' ? '-' : ''}
                                  {monitoringData.perbandingan.persentase.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                  Bulan lalu: {(monitoringData.perbandingan.bulanLalu / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>N/A</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.75 }}>Data bulan lalu belum ada</Typography>
                              </>
                            )}
                          </Box>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {monitoringData.perbandingan?.status === 'naik' ? <TrendingUp sx={{ fontSize: 24 }} /> :
                             monitoringData.perbandingan?.status === 'turun' ? <TrendingDown sx={{ fontSize: 24 }} /> : <ShowChart sx={{ fontSize: 24 }} />}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                      color: 'white',
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(245, 124, 0, 0.25)',
                    }}>
                      <CardContent sx={{ py: 2.5, px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                              Prediksi Akhir Bulan
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                              {(monitoringData.prediksi.prediksiAkhirBulan / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              {(monitoringData.prediksi.rataRataHarian / 1000).toFixed(3)} m³/hari · {monitoringData.prediksi.hariTersisa} hari tersisa
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Speed sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: monitoringData.evaluasi.kategori === 'Hemat'
                        ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                        : monitoringData.evaluasi.kategori === 'Normal'
                        ? 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)'
                        : 'linear-gradient(135deg, #c62828 0%, #f44336 100%)',
                      color: 'white',
                      borderRadius: 2,
                      boxShadow: monitoringData.evaluasi.kategori === 'Hemat'
                        ? '0 4px 20px rgba(76, 175, 80, 0.25)'
                        : monitoringData.evaluasi.kategori === 'Normal'
                        ? '0 4px 20px rgba(2, 136, 209, 0.25)'
                        : '0 4px 20px rgba(244, 67, 54, 0.25)',
                    }}>
                      <CardContent sx={{ py: 2.5, px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                              Kategori Pemakaian
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                              {monitoringData.evaluasi.kategori}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              {monitoringData.evaluasi.deskripsi}
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {monitoringData.evaluasi.kategori === 'Hemat' ? <CheckCircle sx={{ fontSize: 24 }} /> :
                             monitoringData.evaluasi.kategori === 'Normal' ? <MonitorHeart sx={{ fontSize: 24 }} /> : <LocalFireDepartment sx={{ fontSize: 24 }} />}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Stats Row 2: Billing */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <WaterDrop color="primary" />
                          <Typography variant="body2" color="text.secondary">Pemakaian Belum Terbayar</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {(monitoringData.estimasiBiayaBulanIni.pemakaianBelumTerbayar / 1000).toLocaleString('id-ID', { maximumFractionDigits: 3 })} m³
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AttachMoney color="info" />
                          <Typography variant="body2" color="text.secondary">Estimasi Biaya Pemakaian</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {formatRupiah(monitoringData.estimasiBiayaBulanIni.estimasiBiaya)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AttachMoney color="warning" />
                          <Typography variant="body2" color="text.secondary">Biaya Beban</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                          {formatRupiah(monitoringData.estimasiBiayaBulanIni.biayaBeban)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'success.main',
                      bgcolor: 'success.50'
                    }}>
                      <CardContent sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AttachMoney sx={{ color: 'success.dark' }} />
                          <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 600 }}>Total Estimasi Tagihan</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
                          {formatRupiah(monitoringData.estimasiBiayaBulanIni.totalEstimasi)}
                        </Typography>
                        {monitoringData.estimasiBiayaBulanIni.namaKelompok && (
                          <Typography variant="caption" color="text.secondary">
                            Tarif: {monitoringData.estimasiBiayaBulanIni.namaKelompok}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Charts Section */}
                <Grid container spacing={3}>
                  {/* Daily Chart */}
                  <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ p: 3, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Today fontSize="small" color="primary" />
                              Pemakaian Harian — {formatBulanIndonesia(selectedPeriode)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Data pembacaan IoT per hari
                            </Typography>
                          </Box>
                          <Chip
                            icon={monitoringData.bulanIni.sumberData === 'redis' ? <CheckCircle /> : <Warning />}
                            label={`Sumber: ${monitoringData.bulanIni.sumberData === 'redis' ? 'Redis (Real-time)' : 'MongoDB'}`}
                            color={monitoringData.bulanIni.sumberData === 'redis' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ height: 320, p: 2, pt: 1 }}>
                        {(monitoringData.chartHarian?.length ?? 0) === 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                            <WaterDrop sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                            <Typography variant="h6">Belum Ada Data Harian</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Data akan muncul setelah IoT mengirim pembacaan
                            </Typography>
                          </Box>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monitoringData.chartHarian.map((d: any) => ({
                              tanggal: formatTanggalPendek(d.tanggal),
                              tanggalLengkap: d.tanggal,
                              liter: d.liter,
                              m3: +(d.liter / 1000).toFixed(3),
                            }))} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} interval={0} />
                              <YAxis tickFormatter={(v: number) => `${v}L`} tick={{ fontSize: 10 }} />
                              <RechartsTooltip
                                formatter={(value: number, name: string) => [
                                  `${value.toLocaleString('id-ID')} L (${(value / 1000).toFixed(3)} m³)`,
                                  'Pemakaian',
                                ]}
                                labelFormatter={(label: string) => {
                                  const item = monitoringData.chartHarian.find((d: any) => formatTanggalPendek(d.tanggal) === label);
                                  return item ? item.tanggal : label;
                                }}
                              />
                              <Bar dataKey="liter" fill="#0288d1" name="Pemakaian (L)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Monthly Chart */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                      <Box sx={{ p: 3, pb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarMonth fontSize="small" color="success" />
                          Riwayat Bulanan
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Data historis dari IoT
                        </Typography>
                      </Box>
                      <Box sx={{ height: 320, p: 2, pt: 1 }}>
                        {bulananLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                          </Box>
                        ) : (bulananData?.getRiwayatPenggunaanBulanan?.length ?? 0) === 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                            <CalendarMonth sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                            <Typography variant="body2">Belum ada data bulanan</Typography>
                          </Box>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bulananData?.getRiwayatPenggunaanBulanan || []}>
                              <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="bulan" tick={{ fontSize: 9 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                              <RechartsTooltip formatter={(v: number) => [`${v.toLocaleString('id-ID')} m³`, 'Pemakaian']} />
                              <Area type="monotone" dataKey="totalPemakaian" stroke="#4caf50" strokeWidth={2} fill="url(#colorTotal)" name="Total (m³)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

                {/* IoT Records Table */}
                <Card sx={{ mt: 3, borderRadius: 2 }}>
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonitorHeart fontSize="small" color="primary" />
                      30 Pencatatan IoT Terakhir
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data real-time dari perangkat IoT
                    </Typography>
                  </Box>
                  {riwayatLoading ? (
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (riwayatData?.getRiwayatPenggunaan?.length ?? 0) === 0 ? (
                    <Box sx={{ p: 3 }}>
                      <Alert severity="info">Belum ada data pencatatan IoT untuk meteran ini.</Alert>
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 360 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell sx={{ fontWeight: 600, width: 60 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Waktu Pencatatan</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Pemakaian (L/detik)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Volume (m³)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(riwayatData?.getRiwayatPenggunaan || []).map((r: any, idx: number) => (
                            <TableRow key={r._id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                              <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{idx + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {r.createdAt ? new Date(r.createdAt).toLocaleString('id-ID', {
                                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  }) : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${r.penggunaanAir?.toLocaleString('id-ID', { maximumFractionDigits: 3 })} L/s`}
                                  size="small"
                                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {r.penggunaanAir ? (r.penggunaanAir / 1000).toFixed(6) : '0'} m³
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card>
              </>
            )}

            {/* Error State */}
            {!monitoringData && !monitoringLoading && selectedMeteranId && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography variant="body1" fontWeight={600}>Gagal memuat data monitoring</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pastikan backend terhubung dan meteran valid.
                </Typography>
              </Alert>
            )}
          </TabPanel>
        </Box>
      </Fade>
    </AdminLayout>
  );
}