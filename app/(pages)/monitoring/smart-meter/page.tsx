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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import PageHeader from '../../../components/ui/PageHeader';
import DashboardStatCard from '../../../components/ui/DashboardStatCard';
import { formatM3, formatToIDR } from '../../../utils/helper';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  GET_ALL_METERAN,
  GET_RIWAYAT_PENGGUNAAN_BULANAN,
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

const formatRupiah = (val: number) => formatToIDR(val);

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
  const [fetchEstimasi, { data: estimasiDataRaw, loading: estimasiLoading }] = useLazyQuery(GET_ESTIMASI_BIAYA);
  const [fetchMonitoring, { data: monitoringDataRaw, loading: monitoringLoading }] = useLazyQuery(GET_MONITORING_DASHBOARD, { fetchPolicy: 'network-only' });
  const bulananData = bulananDataRaw as any;
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
          <PageHeader
            title="Manajemen Meteran Pintar"
            subtitle={`${formatTanggal(today)} · Monitoring pemakaian air real-time`}
            actions={
              <>
                <Chip
                  icon={<WaterDrop />}
                  label={`${meters.length} Meteran`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Tooltip title="Segarkan Data">
                  <IconButton onClick={() => refetch()} sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </>
            }
          />

          {/* ─── Stats Cards ────────────────────────────────────────────── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardStatCard
                color="primary"
                icon={<Speed />}
                title="Total Meteran"
                value={meters.length}
                hideBadge
                caption={`${aktifMeters} aktif · ${nonaktifMeters} nonaktif`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardStatCard
                color="success"
                icon={<CheckCircle />}
                title="Meteran Aktif"
                value={aktifMeters}
                trend="up"
                status="good"
                statusLabel="Beroperasi"
                caption="Sedang beroperasi"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardStatCard
                color="error"
                icon={<Error />}
                title="Meteran Nonaktif"
                value={nonaktifMeters}
                trend={nonaktifMeters > 0 ? 'down' : 'flat'}
                status={nonaktifMeters > 0 ? 'bad' : 'good'}
                statusLabel={nonaktifMeters > 0 ? 'Perlu perhatian' : 'Aman'}
                caption="Tidak beroperasi"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardStatCard
                color="info"
                icon={<WaterDrop />}
                title="Total Pemakaian"
                value={formatM3(totalPemakaianBelumTerbayar)}
                hideBadge
                caption="Belum terbayar"
              />
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
                      <TableRow>
                        <TableCell sx={{ pl: 3, width: 50 }}>#</TableCell>
                        <TableCell>No. Meteran</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>Kelompok Tarif</TableCell>
                        <TableCell>Lokasi</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Belum Bayar</TableCell>
                        <TableCell align="center">Aksi</TableCell>
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
                                {formatM3(meter.pemakaianBelumTerbayar)}
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
                    <DashboardStatCard
                      color="info"
                      icon={<WaterDrop />}
                      title="Pemakaian Bulan Ini"
                      value={formatM3(monitoringData.bulanIni.totalPenggunaan / 1000)}
                      hideBadge
                      caption={monitoringData.bulanIni.periode}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    {monitoringData.perbandingan ? (
                      <DashboardStatCard
                        color={monitoringData.perbandingan.status === 'naik' ? 'error' : monitoringData.perbandingan.status === 'turun' ? 'success' : 'info'}
                        icon={monitoringData.perbandingan.status === 'turun' ? <TrendingDown /> : <TrendingUp />}
                        title="vs Bulan Lalu"
                        value={`${monitoringData.perbandingan.status === 'naik' ? '+' : monitoringData.perbandingan.status === 'turun' ? '-' : ''}${monitoringData.perbandingan.persentase.toFixed(1)}%`}
                        trend={monitoringData.perbandingan.status === 'naik' ? 'up' : monitoringData.perbandingan.status === 'turun' ? 'down' : 'flat'}
                        status={monitoringData.perbandingan.status === 'naik' ? 'bad' : monitoringData.perbandingan.status === 'turun' ? 'good' : 'neutral'}
                        statusLabel={monitoringData.perbandingan.status === 'naik' ? 'Naik' : monitoringData.perbandingan.status === 'turun' ? 'Turun' : 'Tetap'}
                        caption={`Bulan lalu: ${formatM3(monitoringData.perbandingan.bulanLalu / 1000)}`}
                      />
                    ) : (
                      <DashboardStatCard
                        color="info"
                        icon={<ShowChart />}
                        title="vs Bulan Lalu"
                        value="N/A"
                        hideBadge
                        caption="Data bulan lalu belum ada"
                      />
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color="warning"
                      icon={<Speed />}
                      title="Prediksi Akhir Bulan"
                      value={formatM3(monitoringData.prediksi.prediksiAkhirBulan / 1000)}
                      hideBadge
                      caption={`${(monitoringData.prediksi.rataRataHarian / 1000).toFixed(2)} m³/hari · ${monitoringData.prediksi.hariTersisa} hari tersisa`}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color={monitoringData.evaluasi.kategori === 'Hemat' ? 'success' : monitoringData.evaluasi.kategori === 'Normal' ? 'info' : 'error'}
                      icon={monitoringData.evaluasi.kategori === 'Hemat' ? <CheckCircle /> : monitoringData.evaluasi.kategori === 'Normal' ? <MonitorHeart /> : <LocalFireDepartment />}
                      title="Kategori Pemakaian"
                      value={monitoringData.evaluasi.kategori}
                      hideBadge
                      caption={monitoringData.evaluasi.deskripsi}
                    />
                  </Grid>
                </Grid>

                {/* Stats Row 2: Billing */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color="primary"
                      icon={<WaterDrop />}
                      title="Pemakaian Belum Terbayar"
                      value={formatM3(monitoringData.estimasiBiayaBulanIni.pemakaianBelumTerbayar)}
                      hideBadge
                      caption="Periode berjalan"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color="info"
                      icon={<AttachMoney />}
                      title="Estimasi Biaya Pemakaian"
                      value={formatRupiah(monitoringData.estimasiBiayaBulanIni.estimasiBiaya)}
                      hideBadge
                      caption="Estimasi pemakaian"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color="warning"
                      icon={<AttachMoney />}
                      title="Biaya Beban"
                      value={formatRupiah(monitoringData.estimasiBiayaBulanIni.biayaBeban)}
                      hideBadge
                      caption="Tetap per bulan"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DashboardStatCard
                      color="success"
                      icon={<AttachMoney />}
                      title="Total Estimasi Tagihan"
                      value={formatRupiah(monitoringData.estimasiBiayaBulanIni.totalEstimasi)}
                      trend="up"
                      status="good"
                      statusLabel="Estimasi"
                      caption={monitoringData.estimasiBiayaBulanIni.namaKelompok ? `Tarif: ${monitoringData.estimasiBiayaBulanIni.namaKelompok}` : 'Total estimasi tagihan'}
                    />
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
                            <AreaChart data={monitoringData.chartHarian.map((d: any) => ({
                              tanggal: formatTanggalPendek(d.tanggal),
                              tanggalLengkap: d.tanggal,
                              liter: d.liter,
                              m3: +(d.liter / 1000).toFixed(3),
                            }))} margin={{ top: 10, right: 16, left: 0, bottom: 16 }}>
                              <defs>
                                <linearGradient id="colorHarian" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0288d1" stopOpacity={0.28} />
                                  <stop offset="95%" stopColor="#0288d1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                              <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#697a8d' }} interval="preserveStartEnd" minTickGap={12} axisLine={false} tickLine={false} dy={6} />
                              <YAxis tickFormatter={(v: number) => `${v}L`} tick={{ fontSize: 10, fill: '#697a8d' }} axisLine={false} tickLine={false} width={46} />
                              <RechartsTooltip
                                cursor={{ stroke: '#0288d1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 }}
                                formatter={(value: number) => [
                                  `${value.toLocaleString('id-ID')} L (${(value / 1000).toFixed(3)} m³)`,
                                  'Pemakaian',
                                ]}
                                labelFormatter={(label: string) => {
                                  const item = monitoringData.chartHarian.find((d: any) => formatTanggalPendek(d.tanggal) === label);
                                  return item ? item.tanggal : label;
                                }}
                              />
                              <Area type="monotone" dataKey="liter" stroke="#0288d1" strokeWidth={2.5} fill="url(#colorHarian)" dot={{ r: 2.5, fill: '#fff', stroke: '#0288d1', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Pemakaian (L)" />
                            </AreaChart>
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
                            <AreaChart data={bulananData?.getRiwayatPenggunaanBulanan || []} margin={{ top: 10, right: 12, left: 0, bottom: 6 }}>
                              <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.28}/>
                                  <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                              <XAxis dataKey="bulan" tick={{ fontSize: 9, fill: '#697a8d' }} axisLine={false} tickLine={false} dy={4} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#697a8d' }} axisLine={false} tickLine={false} width={32} />
                              <RechartsTooltip
                                cursor={{ stroke: '#2e7d32', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 }}
                                formatter={(v: number) => [`${v.toLocaleString('id-ID')} m³`, 'Pemakaian']}
                              />
                              <Area type="monotone" dataKey="totalPemakaian" stroke="#2e7d32" strokeWidth={2.5} fill="url(#colorTotal)" dot={{ r: 2.5, fill: '#fff', stroke: '#2e7d32', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Total (m³)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

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