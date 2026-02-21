'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Speed,
  Build,
  People,
  WaterDrop,
  Assignment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_KPI_OPERASIONAL,
  GET_RINGKASAN_WORK_ORDER,
  GET_RINGKASAN_LAPORAN,
} from '@/lib/graphql/queries/reports';

const WORK_ORDER_COLORS: Record<string, string> = {
  Ditugaskan: '#2196F3',
  SedangDikerjakan: '#FF9800',
  Selesai: '#4CAF50',
  Dibatalkan: '#F44336',
  Ditunda: '#9E9E9E',
  DitinjauAdmin: '#9C27B0',
};

const LAPORAN_COLORS: Record<string, string> = {
  Diajukan: '#2196F3',
  ProsesPerbaikan: '#FF9800',
  Selesai: '#4CAF50',
};

const FALLBACK_COLOR = '#607D8B';

export default function OperationalReports() {
  const [currentTab, setCurrentTab] = useState(0);

  const { data: kpiData, loading: loadingKpi } = useQuery(GET_KPI_OPERASIONAL, { fetchPolicy: 'network-only' });
  const { data: woData, loading: loadingWo } = useQuery(GET_RINGKASAN_WORK_ORDER, { fetchPolicy: 'network-only' });
  const { data: laporanData, loading: loadingLaporan } = useQuery(GET_RINGKASAN_LAPORAN, { fetchPolicy: 'network-only' });

  const kpi = kpiData?.getKpiOperasional;
  const ringkasanWO: any[] = woData?.getRingkasanWorkOrder || [];
  const ringkasanLaporan: any[] = laporanData?.getRingkasanLaporan || [];

  const kpiCards = kpi
    ? [
        { label: 'Total Meteran Terpasang', value: kpi.totalMeteranTerpasang, icon: <Speed color="primary" sx={{ fontSize: 36 }} />, sub: 'unit terdaftar' },
        { label: 'Total Pelanggan', value: kpi.totalPelanggan, icon: <People color="info" sx={{ fontSize: 36 }} />, sub: 'pengguna aktif' },
        { label: 'Work Order Aktif', value: kpi.totalWorkOrderAktif, icon: <Build color="warning" sx={{ fontSize: 36 }} />, sub: `${kpi.totalWorkOrderSelesai} sudah selesai` },
        { label: 'Laporan Masuk', value: kpi.totalLaporanMasuk, icon: <Assignment color="error" sx={{ fontSize: 36 }} />, sub: `${kpi.totalLaporanSelesai} selesai ditangani` },
        { label: 'Total Teknisi', value: kpi.totalTeknisi, icon: <WaterDrop color="success" sx={{ fontSize: 36 }} />, sub: 'teknisi lapangan' },
        {
          label: 'Tingkat Penyelesaian Laporan', value: `${kpi.tingkatPenyelesaianLaporan}%`,
          icon: <CheckCircle color="success" sx={{ fontSize: 36 }} />, sub: 'dari total laporan masuk',
          isPercent: true, percentValue: kpi.tingkatPenyelesaianLaporan,
        },
      ]
    : [];

  if (loadingKpi) {
    return (
      <AdminLayout title="Laporan Operasional">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan Operasional">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
          Laporan Operasional
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
            <Tab label="KPI Operasional" />
            <Tab label="Work Order" />
            <Tab label="Laporan Pelanggan" />
          </Tabs>
        </Box>

        {/* Tab 0: KPI Cards */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {kpiCards.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">Belum ada data operasional.</Alert>
              </Grid>
            ) : (
              kpiCards.map((card, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        {card.icon}
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{card.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                      {card.isPercent && (
                        <LinearProgress
                          variant="determinate"
                          value={card.percentValue}
                          color={card.percentValue >= 80 ? 'success' : card.percentValue >= 50 ? 'warning' : 'error'}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Tab 1: Work Order */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Distribusi Status Work Order</Typography>
                  {loadingWo ? (
                    <CircularProgress size={24} />
                  ) : ringkasanWO.length === 0 ? (
                    <Alert severity="info">Belum ada data work order.</Alert>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={ringkasanWO} cx="50%" cy="50%" outerRadius={100} dataKey="jumlah" nameKey="status"
                            label={({ status, percent }: any) => `${status} ${(percent * 100).toFixed(0)}%`}>
                            {ringkasanWO.map((entry, index) => (
                              <Cell key={index} fill={WORK_ORDER_COLORS[entry.status] || FALLBACK_COLOR} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(v: any) => [`${v} work order`]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Rincian per Status</Typography>
                  {loadingWo ? (
                    <CircularProgress size={24} />
                  ) : ringkasanWO.length === 0 ? (
                    <Alert severity="info">Belum ada data.</Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Jumlah</TableCell>
                            <TableCell>Proporsi</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ringkasanWO.map((row) => {
                            const total = ringkasanWO.reduce((s: number, r: any) => s + r.jumlah, 0);
                            const pct = total > 0 ? (row.jumlah / total) * 100 : 0;
                            return (
                              <TableRow key={row.status}>
                                <TableCell>
                                  <Chip label={row.status} size="small"
                                    sx={{ backgroundColor: WORK_ORDER_COLORS[row.status] || FALLBACK_COLOR, color: '#fff' }} />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{row.jumlah}</TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <LinearProgress variant="determinate" value={pct}
                                    sx={{ height: 8, borderRadius: 4,
                                      '& .MuiLinearProgress-bar': { backgroundColor: WORK_ORDER_COLORS[row.status] || FALLBACK_COLOR, borderRadius: 4 } }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Laporan Pelanggan */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Status Laporan Pelanggan</Typography>
                  {loadingLaporan ? (
                    <CircularProgress size={24} />
                  ) : ringkasanLaporan.length === 0 ? (
                    <Alert severity="info">Belum ada laporan pelanggan.</Alert>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ringkasanLaporan} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="status" width={130} />
                          <RechartsTooltip formatter={(v: any) => [`${v} laporan`]} />
                          <Bar dataKey="jumlah" radius={[0, 4, 4, 0]}>
                            {ringkasanLaporan.map((entry, index) => (
                              <Cell key={index} fill={LAPORAN_COLORS[entry.status] || FALLBACK_COLOR} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Ringkasan Penanganan Laporan</Typography>
                  {loadingLaporan || loadingKpi ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      {[
                        { label: 'Total Laporan Masuk', value: kpi?.totalLaporanMasuk || 0, color: '#2196F3' },
                        { label: 'Laporan Selesai', value: kpi?.totalLaporanSelesai || 0, color: '#4CAF50' },
                        { label: 'Laporan Belum Selesai', value: (kpi?.totalLaporanMasuk || 0) - (kpi?.totalLaporanSelesai || 0), color: '#FF9800' },
                      ].map((item) => (
                        <Box key={item.label} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{item.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                          </Box>
                          <LinearProgress variant="determinate"
                            value={kpi?.totalLaporanMasuk ? Math.min((item.value / kpi.totalLaporanMasuk) * 100, 100) : 0}
                            sx={{ height: 10, borderRadius: 5, backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': { backgroundColor: item.color, borderRadius: 5 } }} />
                        </Box>
                      ))}
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle color="success" />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Tingkat Penyelesaian: {kpi?.tingkatPenyelesaianLaporan || 0}%
                        </Typography>
                      </Box>
                    </Box>
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
