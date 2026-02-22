// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Add,
  Delete,
  PlayArrow,
  Assessment,
  Download,
  Print,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_KPI_OPERASIONAL,
  GET_RINGKASAN_WORK_ORDER,
  GET_RINGKASAN_LAPORAN,
  GET_RINGKASAN_STATUS_TAGIHAN,
  GET_LAPORAN_KEUANGAN_BULANAN,
  GET_TUNGGAKAN_PER_KELOMPOK,
} from '@/lib/graphql/queries/reports';

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

function getExportData(reportId: string | null, data: any): { headers: string[]; rows: (string | number)[][] } | null {
  if (!reportId || !data) return null;
  if (reportId === 'kpi_operasional') {
    return {
      headers: ['Indikator', 'Nilai', 'Satuan'],
      rows: [
        ['Total Meteran Terpasang', data.totalMeteranTerpasang, 'unit'],
        ['Total Pelanggan', data.totalPelanggan, 'orang'],
        ['Work Order Aktif', data.totalWorkOrderAktif, 'WO'],
        ['Work Order Selesai', data.totalWorkOrderSelesai, 'WO'],
        ['Laporan Masuk', data.totalLaporanMasuk, 'laporan'],
        ['Laporan Selesai', data.totalLaporanSelesai, 'laporan'],
        ['Total Teknisi', data.totalTeknisi, 'orang'],
        ['Tingkat Penyelesaian Laporan', `${data.tingkatPenyelesaianLaporan}%`, ''],
      ],
    };
  }
  if (reportId === 'work_order' || reportId === 'laporan_pelanggan') {
    const rows: any[] = data;
    const total = rows.reduce((s: number, r: any) => s + r.jumlah, 0);
    return {
      headers: ['Status', 'Jumlah', 'Persentase'],
      rows: rows.map((r: any) => [r.status, r.jumlah, total > 0 ? `${((r.jumlah / total) * 100).toFixed(1)}%` : '0%']),
    };
  }
  if (reportId === 'ringkasan_tagihan') {
    return {
      headers: ['Keterangan', 'Nilai'],
      rows: [
        ['Total Tagihan', data.totalTagihan],
        ['Tagihan Lunas', data.totalLunas],
        ['Tagihan Tunggakan', data.totalTunggakan],
        ['Tagihan Pending', data.totalPending],
        ['Nilai Total Tagihan (Rp)', data.nilaiTotal],
        ['Nilai Sudah Lunas (Rp)', data.nilaiLunas],
        ['Nilai Tunggakan (Rp)', data.nilaiTunggakan],
      ],
    };
  }
  if (reportId === 'laporan_bulanan') {
    const rows: any[] = data;
    return {
      headers: ['Bulan', 'Total Tagihan (Rp)', 'Sudah Lunas (Rp)', 'Jumlah Tagihan', 'Jumlah Lunas'],
      rows: rows.map((r: any) => [r.bulan, r.totalTagihan, r.totalLunas, r.jumlahTagihan, r.jumlahLunas]),
    };
  }
  if (reportId === 'tunggakan_kelompok') {
    const rows: any[] = data;
    return {
      headers: ['Kelompok Pelanggan', 'Jumlah Tunggakan', 'Total Nilai (Rp)'],
      rows: rows.map((r: any) => [r.namaKelompok, r.jumlahTunggakan, r.totalTunggakan]),
    };
  }
  return null;
}

// Kategori laporan yang tersedia
const REPORT_CATEGORIES = [
  {
    id: 'kpi_operasional',
    nama: 'KPI Operasional',
    deskripsi: 'Ringkasan indikator kinerja operasional: meteran, pelanggan, work order, laporan, teknisi',
    kategori: 'operational',
  },
  {
    id: 'work_order',
    nama: 'Distribusi Work Order',
    deskripsi: 'Sebaran status pekerjaan teknis lapangan (ditugaskan, dikerjakan, selesai, dll)',
    kategori: 'operational',
  },
  {
    id: 'laporan_pelanggan',
    nama: 'Status Laporan Pelanggan',
    deskripsi: 'Distribusi status pengaduan/laporan dari pelanggan',
    kategori: 'operational',
  },
  {
    id: 'ringkasan_tagihan',
    nama: 'Ringkasan Status Tagihan',
    deskripsi: 'Total tagihan, jumlah lunas, tunggakan, dan nilai rupiah keseluruhan',
    kategori: 'financial',
  },
  {
    id: 'laporan_bulanan',
    nama: 'Laporan Keuangan Bulanan',
    deskripsi: 'Pendapatan tagihan dan jumlah tagihan per bulan (6 bulan terakhir)',
    kategori: 'financial',
  },
  {
    id: 'tunggakan_kelompok',
    nama: 'Tunggakan per Kelompok Pelanggan',
    deskripsi: 'Rekapitulasi tunggakan berdasarkan kelompok/kategori pelanggan',
    kategori: 'financial',
  },
];

type ReportId = typeof REPORT_CATEGORIES[number]['id'];

function useReportData(reportId: ReportId | null) {
  const skip = !reportId;
  const { data: kpiData, loading: l1 } = useQuery(GET_KPI_OPERASIONAL, { skip: skip || reportId !== 'kpi_operasional', fetchPolicy: 'network-only' });
  const { data: woData, loading: l2 } = useQuery(GET_RINGKASAN_WORK_ORDER, { skip: skip || reportId !== 'work_order', fetchPolicy: 'network-only' });
  const { data: laporanData, loading: l3 } = useQuery(GET_RINGKASAN_LAPORAN, { skip: skip || reportId !== 'laporan_pelanggan', fetchPolicy: 'network-only' });
  const { data: tagihanData, loading: l4 } = useQuery(GET_RINGKASAN_STATUS_TAGIHAN, { skip: skip || reportId !== 'ringkasan_tagihan', fetchPolicy: 'network-only' });
  const { data: bulananData, loading: l5 } = useQuery(GET_LAPORAN_KEUANGAN_BULANAN, { skip: skip || reportId !== 'laporan_bulanan', fetchPolicy: 'network-only' });
  const { data: tunggakanData, loading: l6 } = useQuery(GET_TUNGGAKAN_PER_KELOMPOK, { skip: skip || reportId !== 'tunggakan_kelompok', fetchPolicy: 'network-only' });

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  const result: any = {};
  if (kpiData?.getKpiOperasional) result.rows = kpiData.getKpiOperasional;
  if (woData?.getRingkasanWorkOrder) result.rows = woData.getRingkasanWorkOrder;
  if (laporanData?.getRingkasanLaporan) result.rows = laporanData.getRingkasanLaporan;
  if (tagihanData?.getRingkasanStatusTagihan) result.rows = tagihanData.getRingkasanStatusTagihan;
  if (bulananData?.getLaporanKeuanganBulanan) result.rows = bulananData.getLaporanKeuanganBulanan;
  if (tunggakanData?.getTunggakanPerKelompok) result.rows = tunggakanData.getTunggakanPerKelompok;

  return { data: result.rows, loading };
}

function renderReportTable(reportId: ReportId, data: any) {
  if (!data) return null;

  if (reportId === 'kpi_operasional') {
    const kpi = data;
    const rows = [
      { label: 'Total Meteran Terpasang', nilai: kpi.totalMeteranTerpasang, satuan: 'unit' },
      { label: 'Total Pelanggan', nilai: kpi.totalPelanggan, satuan: 'orang' },
      { label: 'Work Order Aktif', nilai: kpi.totalWorkOrderAktif, satuan: 'WO' },
      { label: 'Work Order Selesai', nilai: kpi.totalWorkOrderSelesai, satuan: 'WO' },
      { label: 'Laporan Masuk', nilai: kpi.totalLaporanMasuk, satuan: 'laporan' },
      { label: 'Laporan Selesai', nilai: kpi.totalLaporanSelesai, satuan: 'laporan' },
      { label: 'Total Teknisi', nilai: kpi.totalTeknisi, satuan: 'orang' },
      { label: 'Tingkat Penyelesaian Laporan', nilai: `${kpi.tingkatPenyelesaianLaporan}%`, satuan: '' },
    ];
    return (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Indikator</TableCell>
          <TableCell align="right">Nilai</TableCell>
          <TableCell>Satuan</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.label}>
              <TableCell sx={{ fontWeight: 600 }}>{r.label}</TableCell>
              <TableCell align="right">{typeof r.nilai === 'number' ? r.nilai.toLocaleString('id-ID') : r.nilai}</TableCell>
              <TableCell>{r.satuan}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reportId === 'work_order' || reportId === 'laporan_pelanggan') {
    const rows: any[] = data;
    const total = rows.reduce((s: number, r: any) => s + r.jumlah, 0);
    return (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Status</TableCell>
          <TableCell align="right">Jumlah</TableCell>
          <TableCell align="right">Persentase</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {rows.map((r: any) => (
            <TableRow key={r.status}>
              <TableCell sx={{ fontWeight: 600 }}>{r.status}</TableCell>
              <TableCell align="right">{r.jumlah}</TableCell>
              <TableCell align="right">{total > 0 ? ((r.jumlah / total) * 100).toFixed(1) : 0}%</TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ backgroundColor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{total}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (reportId === 'ringkasan_tagihan') {
    const t = data;
    const rows = [
      { label: 'Total Tagihan', nilai: t.totalTagihan, tipe: 'angka' },
      { label: 'Tagihan Lunas', nilai: t.totalLunas, tipe: 'angka' },
      { label: 'Tagihan Tunggakan', nilai: t.totalTunggakan, tipe: 'angka' },
      { label: 'Tagihan Pending', nilai: t.totalPending, tipe: 'angka' },
      { label: 'Nilai Total Tagihan', nilai: t.nilaiTotal, tipe: 'rupiah' },
      { label: 'Nilai Sudah Lunas', nilai: t.nilaiLunas, tipe: 'rupiah' },
      { label: 'Nilai Tunggakan', nilai: t.nilaiTunggakan, tipe: 'rupiah' },
    ];
    return (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Keterangan</TableCell>
          <TableCell align="right">Nilai</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.label}>
              <TableCell sx={{ fontWeight: 600 }}>{r.label}</TableCell>
              <TableCell align="right">
                {r.tipe === 'rupiah'
                  ? `Rp ${Number(r.nilai).toLocaleString('id-ID')}`
                  : Number(r.nilai).toLocaleString('id-ID')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reportId === 'laporan_bulanan') {
    const rows: any[] = data;
    return (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Bulan</TableCell>
          <TableCell align="right">Total Tagihan (Rp)</TableCell>
          <TableCell align="right">Sudah Lunas (Rp)</TableCell>
          <TableCell align="right">Jumlah Tagihan</TableCell>
          <TableCell align="right">Jumlah Lunas</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {rows.map((r: any) => (
            <TableRow key={r.bulan}>
              <TableCell sx={{ fontWeight: 600 }}>{r.bulan}</TableCell>
              <TableCell align="right">{Number(r.totalTagihan).toLocaleString('id-ID')}</TableCell>
              <TableCell align="right">{Number(r.totalLunas).toLocaleString('id-ID')}</TableCell>
              <TableCell align="right">{r.jumlahTagihan}</TableCell>
              <TableCell align="right">{r.jumlahLunas}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reportId === 'tunggakan_kelompok') {
    const rows: any[] = data;
    return (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Kelompok Pelanggan</TableCell>
          <TableCell align="right">Jumlah Tunggakan</TableCell>
          <TableCell align="right">Total Nilai (Rp)</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {rows.map((r: any) => (
            <TableRow key={r.namaKelompok}>
              <TableCell sx={{ fontWeight: 600 }}>{r.namaKelompok}</TableCell>
              <TableCell align="right">{r.jumlahTunggakan}</TableCell>
              <TableCell align="right">{Number(r.totalTunggakan).toLocaleString('id-ID')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return null;
}

export default function CustomReports() {
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportId | null>(null);
  const [filterKategori, setFilterKategori] = useState<string>('all');

  const { data, loading } = useReportData(generatedReport);

  const kategoriLabel: Record<string, string> = {
    operational: 'Operasional',
    financial: 'Keuangan',
    compliance: 'Kepatuhan',
  };

  const tampilKategori = filterKategori === 'all'
    ? REPORT_CATEGORIES
    : REPORT_CATEGORIES.filter(r => r.kategori === filterKategori);

  const selectedMeta = REPORT_CATEGORIES.find(r => r.id === generatedReport);

  const handleExportCustom = () => {
    const exportData = getExportData(generatedReport, data);
    if (!exportData) return;
    const filename = `laporan-${generatedReport}-${new Date().toISOString().slice(0,10)}.csv`;
    exportCSV(filename, exportData.headers, exportData.rows);
  };

  return (
    <AdminLayout title="Laporan Kustom">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Laporan Kustom
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pilih jenis laporan yang ingin digenerate dari data sistem secara real-time.
        </Typography>

        <Grid container spacing={3}>
          {/* Panel kiri: Pilih laporan */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 24 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Jenis Laporan Tersedia
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Filter Kategori</InputLabel>
                  <Select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    label="Filter Kategori"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="operational">Operasional</MenuItem>
                    <MenuItem value="financial">Keuangan</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {tampilKategori.map((r) => (
                    <Paper
                      key={r.id}
                      onClick={() => setSelectedReport(r.id as ReportId)}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedReport === r.id ? 'primary.main' : 'transparent',
                        backgroundColor: selectedReport === r.id ? 'primary.50' : 'background.paper',
                        '&:hover': { borderColor: 'primary.light' },
                        transition: 'all 0.15s',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {r.nama}
                        </Typography>
                        <Chip
                          label={kategoriLabel[r.kategori]}
                          size="small"
                          color={r.kategori === 'operational' ? 'info' : r.kategori === 'financial' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {r.deskripsi}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrow />}
                  onClick={() => setGeneratedReport(selectedReport)}
                  disabled={!selectedReport}
                  sx={{ mt: 2 }}
                >
                  Generate Laporan
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel kanan: Hasil laporan */}
          <Grid item xs={12} md={8}>
            {!generatedReport ? (
              <Card>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Pilih jenis laporan di sebelah kiri
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                      Klik salah satu laporan lalu tekan "Generate Laporan"
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedMeta?.nama}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedMeta?.deskripsi}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={`Kategori: ${kategoriLabel[selectedMeta?.kategori || '']}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={handleExportCustom}
                        disabled={!data || loading}
                      >
                        CSV
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Print />}
                        onClick={() => window.print()}
                        disabled={!data || loading}
                      >
                        Print
                      </Button>
                    </Stack>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : !data ? (
                    <Alert severity="info">Belum ada data untuk laporan ini.</Alert>
                  ) : (
                    <>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Data berhasil dimuat — {new Date().toLocaleString('id-ID')}
                      </Alert>
                      <TableContainer>
                        {renderReportTable(generatedReport, data)}
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
