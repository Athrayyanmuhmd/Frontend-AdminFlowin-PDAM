'use client';
export const dynamic = 'force-dynamic';

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
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  WaterDrop,
  LocationOn,
  Add,
  MonitorHeart,
  AttachMoney,
  OpenInNew,
  Group,
  AccountBalance,
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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

export default function SmartMeterManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMeteranId, setSelectedMeteranId] = useState<string>('');

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
      // Auto-select first meter for monitoring tab
      if (mapped.length > 0 && !selectedMeteranId) {
        setSelectedMeteranId(mapped[0].id);
      }
    }
  }, [data]);

  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error loading meteran:', graphqlError);
    }
  }, [graphqlError]);

  useEffect(() => {
    if (selectedMeteranId) {
      fetchBulanan({ variables: { meteranId: selectedMeteranId } });
      fetchRiwayat({ variables: { meteranId: selectedMeteranId, limit: 30 } });
      fetchEstimasi({ variables: { meteranId: selectedMeteranId } });
      fetchMonitoring({ variables: { meteranId: selectedMeteranId } });
    }
  }, [selectedMeteranId]);

  if (loading && meters.length === 0) {
    return (
      <AdminLayout title="Manajemen Meteran Pintar">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (graphqlError) {
    return (
      <AdminLayout title="Manajemen Meteran Pintar">
        <Alert severity="error" sx={{ mt: 2 }}>
          Gagal memuat data meteran: {graphqlError.message}
        </Alert>
      </AdminLayout>
    );
  }

  if (authLoading || !isAuthenticated) return null;

  const aktifMeters = meters.filter(m => m.statusAktif).length;
  const nonaktifMeters = meters.filter(m => !m.statusAktif).length;
  const totalPemakaianBelumTerbayar = meters.reduce((s, m) => s + m.pemakaianBelumTerbayar, 0);

  return (
    <AdminLayout title="Manajemen Meteran Pintar">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manajemen Meteran Pintar
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                  <Speed color="primary" />
                  <Box>
                    <Typography variant="h6">{meters.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Meteran</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  <Box>
                    <Typography variant="h6">{aktifMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Aktif</Typography>
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
                    <Typography variant="h6">{nonaktifMeters}</Typography>
                    <Typography variant="body2" color="text.secondary">Nonaktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WaterDrop color="info" />
                  <Box>
                    <Typography variant="h6">
                      {totalPemakaianBelumTerbayar.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Pemakaian Belum Bayar (m³)</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab label="Daftar Meteran" icon={<Speed />} iconPosition="start" />
            <Tab label="Monitoring Pemakaian" icon={<MonitorHeart />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 0: Daftar Meteran */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Daftar Meteran Pintar</Typography>
              {meters.length === 0 ? (
                <Alert severity="info">Belum ada meteran terdaftar.</Alert>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>No. Meteran</TableCell>
                        <TableCell>No. Akun</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>Kelompok Tarif</TableCell>
                        <TableCell>Lokasi</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Belum Terbayar (m³)</TableCell>
                        <TableCell align="right">Total Pemakaian (m³)</TableCell>
                        <TableCell align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meters.map((meter) => (
                        <TableRow key={meter.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                              {meter.serialNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {meter.nomorAkun}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{meter.customerName}</Typography>
                              {meter.customerEmail !== '-' && (
                                <Typography variant="caption" color="text.secondary">
                                  {meter.customerEmail}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<Group fontSize="small" />}
                              label={meter.namaKelompok}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              <LocationOn fontSize="small" color="action" sx={{ mt: 0.2, flexShrink: 0 }} />
                              <Typography variant="caption" color="text.secondary">
                                {meter.location.address}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={meter.statusAktif ? <CheckCircle /> : <Error />}
                              label={meter.statusAktif ? 'Aktif' : 'Nonaktif'}
                              color={meter.statusAktif ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={meter.pemakaianBelumTerbayar > 20 ? 'error.main' : 'text.primary'}
                            >
                              {meter.pemakaianBelumTerbayar.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {meter.totalPemakaian.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Lihat monitoring detail">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedMeteranId(meter.id);
                                  setActiveTab(1);
                                }}
                              >
                                <MonitorHeart fontSize="small" />
                              </IconButton>
                            </Tooltip>
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

        {/* Tab 1: Monitoring Pemakaian */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Meter Selector */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: { xs: '100%', sm: 320 } }}>
                      <InputLabel>Pilih Meteran</InputLabel>
                      <Select
                        value={selectedMeteranId}
                        label="Pilih Meteran"
                        onChange={(e: SelectChangeEvent) => setSelectedMeteranId(e.target.value)}
                      >
                        {meters.map(m => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.serialNumber} — {m.customerName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {monitoringLoading && <CircularProgress size={24} />}
                    {monitoringData && (
                      <Chip
                        icon={monitoringData.redisConnected ? <CheckCircle /> : <Warning />}
                        label={monitoringData.redisConnected ? 'Redis Terhubung' : 'Data MongoDB'}
                        color={monitoringData.redisConnected ? 'success' : 'warning'}
                        size="small"
                      />
                    )}
                    {monitoringData?.lastUpdate && (
                      <Typography variant="caption" color="text.secondary">
                        Update: {new Date(monitoringData.lastUpdate).toLocaleString('id-ID')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Monitoring Dashboard — tampil kalau ada data */}
            {monitoringData && (
              <>
                {/* Evaluasi + Prediksi Row */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WaterDrop color="primary" />
                        <Typography variant="body2" color="text.secondary">Pemakaian Bulan Ini</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        {(monitoringData.bulanIni.totalPenggunaan / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {monitoringData.bulanIni.periode} · {monitoringData.bulanIni.dataHarian.length} hari tercatat
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp color={
                          monitoringData.perbandingan?.status === 'naik' ? 'error' :
                          monitoringData.perbandingan?.status === 'turun' ? 'success' : 'info'
                        } />
                        <Typography variant="body2" color="text.secondary">
                          vs Bulan Lalu
                        </Typography>
                      </Box>
                      {monitoringData.perbandingan ? (
                        <>
                          <Typography variant="h5" fontWeight="bold" color={
                            monitoringData.perbandingan.status === 'naik' ? 'error.main' :
                            monitoringData.perbandingan.status === 'turun' ? 'success.main' : 'text.primary'
                          }>
                            {monitoringData.perbandingan.status === 'naik' ? '+' : monitoringData.perbandingan.status === 'turun' ? '-' : ''}
                            {monitoringData.perbandingan.persentase.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Bulan lalu: {(monitoringData.perbandingan.bulanLalu / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Data bulan lalu belum tersedia</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Speed color="warning" />
                        <Typography variant="body2" color="text.secondary">Prediksi Akhir Bulan</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        {(monitoringData.prediksi.prediksiAkhirBulan / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m³
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rata-rata {(monitoringData.prediksi.rataRataHarian / 1000).toFixed(3)} m³/hari · {monitoringData.prediksi.hariTersisa} hari tersisa
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <MonitorHeart color={
                          monitoringData.evaluasi.kategori === 'Hemat' ? 'success' :
                          monitoringData.evaluasi.kategori === 'Normal' ? 'info' : 'warning'
                        } />
                        <Typography variant="body2" color="text.secondary">Kategori Pemakaian</Typography>
                      </Box>
                      <Chip
                        label={monitoringData.evaluasi.kategori}
                        color={
                          monitoringData.evaluasi.kategori === 'Hemat' ? 'success' :
                          monitoringData.evaluasi.kategori === 'Normal' ? 'info' : 'warning'
                        }
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        {monitoringData.evaluasi.deskripsi}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Estimasi Biaya dari data monitoring bulan ini */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WaterDrop />
                        <Typography variant="body2">Pemakaian Belum Terbayar</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        {monitoringData.estimasiBiayaBulanIni.pemakaianBelumTerbayar.toLocaleString('id-ID', { maximumFractionDigits: 3 })} m³
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoney />
                        <Typography variant="body2">Estimasi Biaya Pemakaian</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Rp {monitoringData.estimasiBiayaBulanIni.estimasiBiaya.toLocaleString('id-ID')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoney />
                        <Typography variant="body2">Biaya Beban</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Rp {monitoringData.estimasiBiayaBulanIni.biayaBeban.toLocaleString('id-ID')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoney />
                        <Typography variant="body2">Total Estimasi Tagihan</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Rp {monitoringData.estimasiBiayaBulanIni.totalEstimasi.toLocaleString('id-ID')}
                      </Typography>
                      {monitoringData.estimasiBiayaBulanIni.namaKelompok && (
                        <Typography variant="caption">
                          Tarif: {monitoringData.estimasiBiayaBulanIni.namaKelompok}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Grafik Harian (14 hari dari Redis) */}
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Pemakaian Harian — {monitoringData.bulanIni.periode}</Typography>
                        <Chip
                          label={`Sumber: ${monitoringData.bulanIni.sumberData === 'redis' ? 'Redis (Real-time)' : 'MongoDB'}`}
                          color={monitoringData.bulanIni.sumberData === 'redis' ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {(monitoringData.chartHarian?.length ?? 0) === 0 ? (
                        <Alert severity="info">
                          Belum ada data harian dari Redis untuk meteran ini. Data akan muncul setelah IoT mengirim pembacaan.
                        </Alert>
                      ) : (
                        <Box sx={{ height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monitoringData.chartHarian.map((d: any) => ({
                              tanggal: `Tgl ${d.tanggal}`,
                              liter: d.liter,
                              m3: +(d.liter / 1000).toFixed(3),
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                              <YAxis tickFormatter={(v: number) => `${v}L`} />
                              <RechartsTooltip
                                formatter={(value: number, name: string) => [
                                  `${value.toLocaleString('id-ID')} L (${(value / 1000).toFixed(3)} m³)`,
                                  'Pemakaian',
                                ]}
                              />
                              <Bar dataKey="liter" fill="#013494" name="Pemakaian (L)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Grafik Bulanan historis */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Riwayat Bulanan (IoT)</Typography>
                      {bulananLoading ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                      ) : (bulananData?.getRiwayatPenggunaanBulanan?.length ?? 0) === 0 ? (
                        <Alert severity="info">Belum ada data bulanan IoT.</Alert>
                      ) : (
                        <Box sx={{ height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bulananData?.getRiwayatPenggunaanBulanan || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="bulan" tick={{ fontSize: 9 }} />
                              <YAxis allowDecimals={false} />
                              <RechartsTooltip formatter={(v: number) => [`${v.toLocaleString('id-ID')} m³`, 'Pemakaian']} />
                              <Line type="monotone" dataKey="totalPemakaian" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} name="Total (m³)" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {/* Kalau monitoring belum dipilih atau loading */}
            {!monitoringData && !monitoringLoading && selectedMeteranId && (
              <Grid item xs={12}>
                <Alert severity="warning">Gagal memuat data monitoring. Pastikan backend terhubung dan meteran valid.</Alert>
              </Grid>
            )}

            {/* Riwayat IoT Terbaru */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>30 Pencatatan IoT Terakhir</Typography>
                  {riwayatLoading ? (
                    <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
                  ) : (riwayatData?.getRiwayatPenggunaan?.length ?? 0) === 0 ? (
                    <Alert severity="info">Belum ada data pencatatan IoT untuk meteran ini.</Alert>
                  ) : (
                    <TableContainer sx={{ maxHeight: 320, overflowX: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Waktu Pencatatan</TableCell>
                            <TableCell align="right">Pemakaian (L/detik)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(riwayatData?.getRiwayatPenggunaan || []).map((r: any, idx: number) => (
                            <TableRow key={r._id} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                {r.createdAt ? new Date(r.createdAt).toLocaleString('id-ID') : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {r.penggunaanAir?.toLocaleString('id-ID', { maximumFractionDigits: 3 })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </AdminLayout>
  );
}
