// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  Assessment,
  Receipt,
  Warning,
  Download,
  Print,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_LAPORAN_KEUANGAN_BULANAN,
  GET_TUNGGAKAN_PER_KELOMPOK,
  GET_TAGIHAN_TERTINGGI,
  GET_RINGKASAN_STATUS_TAGIHAN,
} from '@/lib/graphql/queries/reports';

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Settlement: 'success',
  Pending: 'warning',
  Expire: 'error',
  Cancel: 'error',
};

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF';
  const csvContent = bom + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinancialReports() {
  const [currentTab, setCurrentTab] = useState(0);

  const { data: bulananData, loading: loadingBulanan, error: errorBulanan } = useQuery(GET_LAPORAN_KEUANGAN_BULANAN, { fetchPolicy: 'network-only' });
  const { data: tunggakanData, loading: loadingTunggakan } = useQuery(GET_TUNGGAKAN_PER_KELOMPOK, { fetchPolicy: 'network-only' });
  const { data: tertinggiData, loading: loadingTertinggi } = useQuery(GET_TAGIHAN_TERTINGGI, {
    variables: { limit: 10 },
    fetchPolicy: 'network-only',
  });
  const { data: ringkasanData, loading: loadingRingkasan, error: errorRingkasan } = useQuery(GET_RINGKASAN_STATUS_TAGIHAN, { fetchPolicy: 'network-only' });

  const isLoading = loadingBulanan || loadingRingkasan;
  const queryError = errorBulanan || errorRingkasan;

  const bulanan = bulananData?.getLaporanKeuanganBulanan || [];
  const tunggakan = tunggakanData?.getTunggakanPerKelompok || [];
  const tertinggi = tertinggiData?.getTagihanTertinggi || [];
  const ringkasan = ringkasanData?.getRingkasanStatusTagihan;

  const collectionRate = ringkasan && ringkasan.nilaiTotal > 0
    ? ((ringkasan.nilaiLunas / ringkasan.nilaiTotal) * 100).toFixed(1)
    : '0.0';

  const handleExportBulanan = () => {
    const headers = ['Bulan', 'Total Tagihan (Rp)', 'Tagihan Lunas (Rp)', 'Jumlah Tagihan', 'Jumlah Lunas'];
    const rows = bulanan.map((r: any) => [r.bulan, r.totalTagihan, r.totalLunas, r.jumlahTagihan, r.jumlahLunas]);
    exportCSV(`laporan-keuangan-bulanan-${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
  };

  const handleExportTunggakan = () => {
    const headers = ['Kelompok Pelanggan', 'Jumlah Tunggakan', 'Total Nilai (Rp)'];
    const rows = tunggakan.map((r: any) => [r.namaKelompok, r.jumlahTunggakan, r.totalTunggakan]);
    exportCSV(`tunggakan-per-kelompok-${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
  };

  const handleExportTertinggi = () => {
    const headers = ['No', 'Nomor Meteran', 'Nomor Akun', 'Kelompok', 'Periode', 'Total Biaya (Rp)', 'Status'];
    const rows = tertinggi.map((r: any, i: number) => [i + 1, r.nomorMeteran, r.nomorAkun, r.namaKelompok, r.periode, r.totalBiaya, r.statusPembayaran]);
    exportCSV(`tagihan-tertinggi-${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <AdminLayout title="Laporan Keuangan">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (queryError) {
    return (
      <AdminLayout title="Laporan Keuangan">
        <Alert severity="error" sx={{ mt: 2 }}>
          Gagal memuat data laporan keuangan: {queryError.message}
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan Keuangan">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Laporan Keuangan
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={currentTab === 0 ? handleExportBulanan : currentTab === 1 ? handleExportTunggakan : handleExportTertinggi}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Stack>
        </Box>

        {/* Kartu Ringkasan */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: 36, color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Total Tagihan</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rp {(ringkasan?.nilaiTotal || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ringkasan?.totalTagihan || 0} tagihan
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ fontSize: 36, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Tingkat Penagihan</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {collectionRate}%
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(collectionRate)}
                    color="success"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ fontSize: 36, color: 'info.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Tagihan Lunas</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rp {(ringkasan?.nilaiLunas || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="caption" color="success.main">
                  {ringkasan?.totalLunas || 0} tagihan Settlement
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning sx={{ fontSize: 36, color: 'error.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">Tagihan Menunggak</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rp {(ringkasan?.nilaiTunggakan || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="caption" color="error.main">
                  {ringkasan?.totalTunggakan || 0} pelanggan menunggak
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
            <Tab label="Tren Pendapatan" />
            <Tab label="Tunggakan per Kelompok" />
            <Tab label="Tagihan Tertinggi" />
          </Tabs>
        </Box>

        {/* Tab 0: Tren Pendapatan Bulanan */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tren Tagihan dan Penagihan (6 Bulan Terakhir)
                  </Typography>
                  {bulanan.length === 0 ? (
                    <Alert severity="info">Belum ada data tagihan.</Alert>
                  ) : (
                    <Box sx={{ height: 380 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={bulanan}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bulan" />
                          <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                          <RechartsTooltip
                            formatter={(value: any, name: string) => [
                              `Rp ${Number(value).toLocaleString('id-ID')}`,
                              name === 'totalTagihan' ? 'Total Tagihan' : 'Tagihan Lunas',
                            ]}
                          />
                          <Legend formatter={(v) => v === 'totalTagihan' ? 'Total Tagihan' : 'Tagihan Lunas'} />
                          <Line type="monotone" dataKey="totalTagihan" stroke="#2196F3" strokeWidth={3} dot={{ r: 4 }} name="totalTagihan" />
                          <Line type="monotone" dataKey="totalLunas" stroke="#4CAF50" strokeWidth={3} dot={{ r: 4 }} name="totalLunas" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Jumlah Tagihan per Bulan
                  </Typography>
                  {bulanan.length === 0 ? (
                    <Alert severity="info">Belum ada data.</Alert>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bulanan}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bulan" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip formatter={(v: any, name: string) => [v, name === 'jumlahTagihan' ? 'Total' : 'Lunas']} />
                          <Legend formatter={(v) => v === 'jumlahTagihan' ? 'Total Tagihan' : 'Tagihan Lunas'} />
                          <Bar dataKey="jumlahTagihan" fill="#2196F3" name="jumlahTagihan" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="jumlahLunas" fill="#4CAF50" name="jumlahLunas" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Tunggakan per Kelompok */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tunggakan per Kelompok Pelanggan
                  </Typography>
                  {loadingTunggakan ? (
                    <CircularProgress size={24} />
                  ) : tunggakan.length === 0 ? (
                    <Alert severity="success">Tidak ada tunggakan saat ini.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Kelompok Pelanggan</TableCell>
                            <TableCell align="right">Jumlah Tunggakan</TableCell>
                            <TableCell align="right">Total Nilai (Rp)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tunggakan.map((row: any) => (
                            <TableRow key={row.namaKelompok}>
                              <TableCell>{row.namaKelompok}</TableCell>
                              <TableCell align="right">
                                <Chip label={`${row.jumlahTunggakan} tagihan`} size="small" color="error" />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                                Rp {row.totalTunggakan.toLocaleString('id-ID')}
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

            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Status Tagihan Keseluruhan
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {[
                      { label: 'Lunas (Settlement)', value: ringkasan?.totalLunas || 0, total: ringkasan?.totalTagihan || 1, color: '#4CAF50' },
                      { label: 'Pending', value: ringkasan?.totalPending || 0, total: ringkasan?.totalTagihan || 1, color: '#FF9800' },
                      { label: 'Menunggak', value: ringkasan?.totalTunggakan || 0, total: ringkasan?.totalTagihan || 1, color: '#F44336' },
                    ].map((item) => (
                      <Box key={item.label} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.value} ({((item.value / item.total) * 100).toFixed(0)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(item.value / item.total) * 100}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': { backgroundColor: item.color, borderRadius: 5 },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Tagihan Tertinggi */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    10 Tagihan Tertinggi
                  </Typography>
                  {loadingTertinggi ? (
                    <CircularProgress size={24} />
                  ) : tertinggi.length === 0 ? (
                    <Alert severity="info">Belum ada data tagihan.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Nomor Meteran</TableCell>
                            <TableCell>Nomor Akun</TableCell>
                            <TableCell>Kelompok</TableCell>
                            <TableCell>Periode</TableCell>
                            <TableCell align="right">Total Biaya (Rp)</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tertinggi.map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{row.nomorMeteran}</TableCell>
                              <TableCell>{row.nomorAkun}</TableCell>
                              <TableCell>
                                <Chip label={row.namaKelompok} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{row.periode}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {row.totalBiaya.toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={row.statusPembayaran}
                                  size="small"
                                  color={STATUS_COLOR[row.statusPembayaran] || 'default'}
                                />
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
        )}
      </Box>
    </AdminLayout>
  );
}
