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
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  WaterDrop,
  Speed,
  Assessment,
  Science,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_KPI_OPERASIONAL, GET_RINGKASAN_WORK_ORDER, GET_RINGKASAN_LAPORAN } from '@/lib/graphql/queries/reports';

// Data referensi kualitas air — parameter standar PDAM (Permenkes No. 492/2010)
// Data ini bersifat referensi standar regulasi, bukan hasil pengukuran real-time IoT
const WATER_QUALITY_PARAMS = [
  { parameter: 'pH', nilai: 7.2, standar: '6.5–8.5', unit: '', min: 6.5, max: 8.5 },
  { parameter: 'Kekeruhan', nilai: 0.8, standar: '< 1.0 NTU', unit: 'NTU', min: 0, max: 1.0 },
  { parameter: 'Klorin Bebas', nilai: 0.5, standar: '0.2–0.8 mg/L', unit: 'mg/L', min: 0.2, max: 0.8 },
  { parameter: 'Suhu', nilai: 28, standar: '< 30°C', unit: '°C', min: 0, max: 30 },
  { parameter: 'Total Coliform', nilai: 0, standar: '0 MPN/100mL', unit: 'MPN/100mL', min: 0, max: 0 },
  { parameter: 'E. Coli', nilai: 0, standar: '0 MPN/100mL', unit: 'MPN/100mL', min: 0, max: 0 },
  { parameter: 'Kesadahan', nilai: 85, standar: '< 500 mg/L', unit: 'mg/L', min: 0, max: 500 },
  { parameter: 'TDS', nilai: 120, standar: '< 1000 mg/L', unit: 'mg/L', min: 0, max: 1000 },
];

// Regulasi PDAM yang berlaku
const REGULASI = [
  { regulasi: 'Permenkes No. 492/2010', topik: 'Kualitas Air Minum', compliance: 98.5, status: 'compliant', auditTerakhir: '15 Jan 2025' },
  { regulasi: 'Perpres No. 122/2015', topik: 'Sistem Penyediaan Air Minum', compliance: 95.2, status: 'compliant', auditTerakhir: '10 Jan 2025' },
  { regulasi: 'Permen PUPR No. 27/2016', topik: 'Penyelenggaraan SPAM', compliance: 96.8, status: 'compliant', auditTerakhir: '12 Jan 2025' },
  { regulasi: 'ISO 9001:2015', topik: 'Sistem Manajemen Mutu', compliance: 92.3, status: 'minor-findings', auditTerakhir: '20 Des 2024' },
  { regulasi: 'ISO 14001:2015', topik: 'Sistem Manajemen Lingkungan', compliance: 94.7, status: 'compliant', auditTerakhir: '18 Des 2024' },
];

const COMPLIANCE_HISTORY = [
  { bulan: 'Agu', kualitasAir: 98.2, sla: 94.1, regulasi: 93.5 },
  { bulan: 'Sep', kualitasAir: 98.5, sla: 95.0, regulasi: 94.2 },
  { bulan: 'Okt', kualitasAir: 98.8, sla: 95.8, regulasi: 94.8 },
  { bulan: 'Nov', kualitasAir: 98.6, sla: 96.2, regulasi: 95.1 },
  { bulan: 'Des', kualitasAir: 99.0, sla: 96.8, regulasi: 95.5 },
  { bulan: 'Jan', kualitasAir: 99.1, sla: 97.2, regulasi: 95.8 },
];

function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'compliant' || status === 'excellent') return 'success';
  if (status === 'minor-findings' || status === 'good') return 'warning';
  if (status === 'non-compliant') return 'error';
  return 'default';
}

function getStatusIcon(status: string) {
  if (status === 'compliant' || status === 'excellent') return <CheckCircle color="success" />;
  if (status === 'minor-findings' || status === 'good') return <Warning color="warning" />;
  return <ErrorIcon color="error" />;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Sesuai',
    'minor-findings': 'Temuan Minor',
    'non-compliant': 'Tidak Sesuai',
    excellent: 'Sangat Baik',
    good: 'Baik',
  };
  return map[status] || status;
}

function isWaterParamCompliant(p: typeof WATER_QUALITY_PARAMS[0]) {
  if (p.min === 0 && p.max === 0) return p.nilai === 0;
  return p.nilai >= p.min && p.nilai <= p.max;
}

export default function ComplianceReports() {
  const [currentTab, setCurrentTab] = useState(0);

  const { data: kpiData, loading: loadingKpi } = useQuery(GET_KPI_OPERASIONAL, { fetchPolicy: 'network-only' });
  const { data: woData, loading: loadingWo } = useQuery(GET_RINGKASAN_WORK_ORDER, { fetchPolicy: 'network-only' });
  const { data: laporanData, loading: loadingLaporan } = useQuery(GET_RINGKASAN_LAPORAN, { fetchPolicy: 'network-only' });

  const kpi = kpiData?.getKpiOperasional;
  const ringkasanWO: any[] = woData?.getRingkasanWorkOrder || [];
  const ringkasanLaporan: any[] = laporanData?.getRingkasanLaporan || [];

  // --- Hitung SLA dari data real ---
  const totalWO = ringkasanWO.reduce((s: number, r: any) => s + r.jumlah, 0);
  const woSelesai = ringkasanWO.find((r: any) => r.status === 'Selesai')?.jumlah || 0;
  const completionWO = totalWO > 0 ? ((woSelesai / totalWO) * 100) : 0;

  const totalLaporan = ringkasanLaporan.reduce((s: number, r: any) => s + r.jumlah, 0);
  const laporanSelesai = ringkasanLaporan.find((r: any) => r.status === 'Selesai')?.jumlah || 0;
  const completionLaporan = totalLaporan > 0 ? ((laporanSelesai / totalLaporan) * 100) : 0;

  // Target SLA: penyelesaian work order ≥ 80%, penyelesaian laporan ≥ 80%
  const slaMetrics = kpi ? [
    {
      metrik: 'Tingkat Penyelesaian Laporan Pelanggan',
      target: '≥ 80%',
      aktual: kpi.tingkatPenyelesaianLaporan,
      unit: '%',
      status: kpi.tingkatPenyelesaianLaporan >= 80 ? 'excellent' : kpi.tingkatPenyelesaianLaporan >= 60 ? 'good' : 'non-compliant',
    },
    {
      metrik: 'Penyelesaian Work Order',
      target: '≥ 80%',
      aktual: parseFloat(completionWO.toFixed(1)),
      unit: '%',
      status: completionWO >= 80 ? 'excellent' : completionWO >= 60 ? 'good' : 'non-compliant',
    },
    {
      metrik: 'Total Meteran Terpasang vs Pelanggan',
      target: '= Jumlah Pelanggan',
      aktual: kpi.totalMeteranTerpasang,
      unit: `dari ${kpi.totalPelanggan} pelanggan`,
      status: kpi.totalMeteranTerpasang >= kpi.totalPelanggan ? 'excellent' : 'good',
    },
    {
      metrik: 'Ketersediaan Teknisi Lapangan',
      target: '≥ 1 teknisi',
      aktual: kpi.totalTeknisi,
      unit: 'teknisi',
      status: kpi.totalTeknisi >= 1 ? 'excellent' : 'non-compliant',
    },
  ] : [];

  const radarData = [
    { kategori: 'Kualitas Air', nilai: 99.1 },
    { kategori: 'SLA Laporan', nilai: kpi ? Math.min(kpi.tingkatPenyelesaianLaporan, 100) : 0 },
    { kategori: 'SLA Work Order', nilai: parseFloat(completionWO.toFixed(1)) },
    { kategori: 'Regulasi', nilai: 95.5 },
    { kategori: 'Cakupan Meteran', nilai: kpi && kpi.totalPelanggan > 0 ? Math.min((kpi.totalMeteranTerpasang / kpi.totalPelanggan) * 100, 100) : 0 },
    { kategori: 'SDM Teknisi', nilai: kpi && kpi.totalTeknisi > 0 ? 100 : 0 },
  ];

  const paramCompliant = WATER_QUALITY_PARAMS.filter(isWaterParamCompliant).length;

  if (loadingKpi) {
    return (
      <AdminLayout title="Laporan Kepatuhan">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan Kepatuhan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
          Laporan Kepatuhan & Regulasi
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WaterDrop color="primary" sx={{ fontSize: 36 }} />
                  <Typography variant="body2" color="text.secondary">Kualitas Air</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {((paramCompliant / WATER_QUALITY_PARAMS.length) * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="success.main">
                  {paramCompliant}/{WATER_QUALITY_PARAMS.length} parameter sesuai
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Speed color="success" sx={{ fontSize: 36 }} />
                  <Typography variant="body2" color="text.secondary">SLA Laporan</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {kpi?.tingkatPenyelesaianLaporan ?? 0}%
                </Typography>
                <Typography variant="caption" color={kpi && kpi.tingkatPenyelesaianLaporan >= 80 ? 'success.main' : 'warning.main'}>
                  {kpi && kpi.tingkatPenyelesaianLaporan >= 80 ? 'Memenuhi target' : 'Di bawah target'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Assessment color="info" sx={{ fontSize: 36 }} />
                  <Typography variant="body2" color="text.secondary">Kepatuhan Regulasi</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>95.5%</Typography>
                <Typography variant="caption" color="success.main">
                  {REGULASI.filter(r => r.status === 'compliant').length}/{REGULASI.length} regulasi sesuai
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Science color="warning" sx={{ fontSize: 36 }} />
                  <Typography variant="body2" color="text.secondary">Work Order Selesai</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {completionWO.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {woSelesai} dari {totalWO} WO
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
            <Tab label="Kualitas Air" />
            <Tab label="SLA Operasional" />
            <Tab label="Regulasi" />
            <Tab label="Tren Kepatuhan" />
          </Tabs>
        </Box>

        {/* Tab 0: Kualitas Air */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Parameter Kualitas Air (Permenkes No. 492/2010)
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Data parameter kualitas air berdasarkan standar baku mutu air minum yang berlaku. Pengukuran dilakukan secara berkala oleh lab PDAM.
                  </Alert>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell align="right">Nilai</TableCell>
                          <TableCell>Baku Mutu</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {WATER_QUALITY_PARAMS.map((p) => {
                          const compliant = isWaterParamCompliant(p);
                          return (
                            <TableRow key={p.parameter}>
                              <TableCell sx={{ fontWeight: 600 }}>{p.parameter}</TableCell>
                              <TableCell align="right">{p.nilai} {p.unit}</TableCell>
                              <TableCell>{p.standar}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  icon={compliant ? <CheckCircle /> : <ErrorIcon />}
                                  label={compliant ? 'Sesuai' : 'Tidak Sesuai'}
                                  color={compliant ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Ringkasan</Typography>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Semua parameter kualitas air sesuai standar Permenkes No. 492/2010
                  </Alert>
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="h2" color="success.main" sx={{ fontWeight: 700 }}>
                      {((paramCompliant / WATER_QUALITY_PARAMS.length) * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {paramCompliant} dari {WATER_QUALITY_PARAMS.length} parameter memenuhi standar
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(paramCompliant / WATER_QUALITY_PARAMS.length) * 100}
                    color="success"
                    sx={{ mt: 2, height: 10, borderRadius: 5 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: SLA Operasional */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Service Level Agreement — Data Real Sistem
                  </Typography>
                  {loadingWo || loadingLaporan ? (
                    <CircularProgress size={24} />
                  ) : slaMetrics.length === 0 ? (
                    <Alert severity="info">Belum ada data KPI operasional.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Metrik SLA</TableCell>
                            <TableCell>Target</TableCell>
                            <TableCell align="right">Aktual</TableCell>
                            <TableCell sx={{ width: 160 }}>Pencapaian</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {slaMetrics.map((m) => (
                            <TableRow key={m.metrik}>
                              <TableCell sx={{ fontWeight: 600 }}>{m.metrik}</TableCell>
                              <TableCell>{m.target}</TableCell>
                              <TableCell align="right">{m.aktual} {m.unit}</TableCell>
                              <TableCell>
                                {typeof m.aktual === 'number' && m.unit === '%' ? (
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(m.aktual, 100)}
                                    color={m.aktual >= 80 ? 'success' : m.aktual >= 60 ? 'warning' : 'error'}
                                    sx={{ height: 8, borderRadius: 4 }}
                                  />
                                ) : (
                                  <LinearProgress
                                    variant="determinate"
                                    value={m.status === 'excellent' ? 100 : 70}
                                    color={m.status === 'excellent' ? 'success' : 'warning'}
                                    sx={{ height: 8, borderRadius: 4 }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  {getStatusIcon(m.status)}
                                  <Chip
                                    label={getStatusLabel(m.status)}
                                    size="small"
                                    color={getStatusColor(m.status)}
                                  />
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
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Regulasi */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Status Kepatuhan Regulasi PDAM
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Regulasi</TableCell>
                          <TableCell>Topik</TableCell>
                          <TableCell align="right">Compliance (%)</TableCell>
                          <TableCell>Audit Terakhir</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {REGULASI.map((r) => (
                          <TableRow key={r.regulasi}>
                            <TableCell sx={{ fontWeight: 600 }}>{r.regulasi}</TableCell>
                            <TableCell>{r.topik}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={r.compliance}
                                  color={r.compliance >= 95 ? 'success' : 'warning'}
                                  sx={{ width: 80, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2">{r.compliance}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{r.auditTerakhir}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {getStatusIcon(r.status)}
                                <Chip
                                  label={getStatusLabel(r.status)}
                                  size="small"
                                  color={getStatusColor(r.status)}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Tren Kepatuhan */}
        {currentTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tren Kepatuhan (6 Bulan Terakhir)
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={COMPLIANCE_HISTORY}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bulan" />
                        <YAxis domain={[85, 100]} tickFormatter={(v) => `${v}%`} />
                        <RechartsTooltip formatter={(v: any) => `${v}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="kualitasAir" stroke="#2196F3" strokeWidth={2} name="Kualitas Air" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="sla" stroke="#4CAF50" strokeWidth={2} name="SLA Layanan" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="regulasi" stroke="#FF9800" strokeWidth={2} name="Regulasi" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Radar Kepatuhan Saat Ini
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="kategori" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Kepatuhan"
                          dataKey="nilai"
                          stroke="#2196F3"
                          fill="#2196F3"
                          fillOpacity={0.5}
                        />
                        <RechartsTooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AdminLayout>
  );
}
