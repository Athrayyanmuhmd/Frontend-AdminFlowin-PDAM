'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FileDownload,
  Refresh,
  Visibility,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Policy,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import AdminLayout from '../../../layouts/AdminLayout';
import dayjs, { Dayjs } from 'dayjs';

const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($limit: Int, $offset: Int, $aksi: String, $resource: String, $startDate: String, $endDate: String) {
    getAuditLogs(limit: $limit, offset: $offset, aksi: $aksi, resource: $resource, startDate: $startDate, endDate: $endDate) {
      _id
      namaAdmin
      aksi
      resource
      resourceId
      nilaiBefore
      nilaiAfter
      catatan
      createdAt
    }
  }
`;

const actionTypes = [
  'Semua Aksi',
  'ADMIN_CREATE',
  'ADMIN_DELETE',
  'ADMIN_UPDATE_PASSWORD',
  'KONEKSI_ASSIGN_TEKNISI',
  'KONEKSI_UNASSIGN_TEKNISI',
  'KONEKSI_VERIFY',
  'METERAN_CREATE',
  'METERAN_DELETE',
  'TAGIHAN_GENERATE',
  'TAGIHAN_UPDATE_STATUS',
  'TEKNISI_CREATE',
  'TEKNISI_DELETE',
  'WORK_ORDER_CREATE',
];

const resourceTypes = [
  'Semua Resource',
  'Admin',
  'KoneksiData',
  'Meteran',
  'Tagihan',
  'Teknisi',
  'WorkOrder',
];

export default function AuditLogsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua Aksi');
  const [resourceFilter, setResourceFilter] = useState('Semua Resource');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // ── Investigasi Canary ──────────────────────────────────────────────────────
  const [investigateFile, setInvestigateFile] = useState<File | null>(null);
  const [investigateLoading, setInvestigateLoading] = useState(false);
  const [investigateResult, setInvestigateResult] = useState<any>(null);
  const [investigateError, setInvestigateError] = useState('');

  const handleInvestigate = async () => {
    if (!investigateFile) return;
    setInvestigateLoading(true);
    setInvestigateResult(null);
    setInvestigateError('');
    try {
      const token = localStorage.getItem('admin_token') ?? '';
      const formData = new FormData();
      formData.append('file', investigateFile);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace('/api', '') ?? 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/documents/investigate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan ?? 'Gagal investigasi');
      setInvestigateResult(json);
    } catch (e: any) {
      setInvestigateError(e.message ?? 'Terjadi kesalahan');
    } finally {
      setInvestigateLoading(false);
    }
  };

  const { data, loading, error, refetch } = useQuery(GET_AUDIT_LOGS, {
    variables: {
      limit: 500,
      offset: 0,
      aksi: actionFilter !== 'Semua Aksi' ? actionFilter : undefined,
      resource: resourceFilter !== 'Semua Resource' ? resourceFilter : undefined,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.endOf('day').toISOString() : undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const logs = (data as any)?.getAuditLogs || [];

  // Local search filter (on top of server-side filter)
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter((log: any) =>
      log.namaAdmin?.toLowerCase().includes(q) ||
      log.aksi?.toLowerCase().includes(q) ||
      log.resource?.toLowerCase().includes(q) ||
      log.resourceId?.toLowerCase().includes(q) ||
      log.catatan?.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const formatDate = (ts: string): { date: string; time: string } => {
    if (!ts) return { date: '-', time: '' };
    const d = new Date(parseInt(ts) || ts);
    return { date: d.toLocaleDateString('id-ID'), time: d.toLocaleTimeString('id-ID') };
  };

  const handleExport = () => {
    const headers = ['Waktu', 'Admin', 'Aksi', 'Resource', 'Resource ID', 'Catatan'];
    const csvData = filteredLogs.map((log: any) => {
      const d = formatDate(log.createdAt);
      return [`"${d.date} ${d.time}"`, `"${log.namaAdmin}"`, log.aksi, log.resource, log.resourceId || '', `"${log.catatan || ''}"`];
    });
    const csvContent = [headers.join(','), ...csvData.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActionColor = (aksi: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    if (aksi.includes('CREATE')) return 'success';
    if (aksi.includes('UPDATE') || aksi.includes('ASSIGN') || aksi.includes('VERIFY')) return 'warning';
    if (aksi.includes('DELETE') || aksi.includes('UNASSIGN')) return 'error';
    return 'default';
  };

  const getActionIcon = (aksi: string) => {
    if (aksi.includes('CREATE')) return <CheckCircle />;
    if (aksi.includes('UPDATE') || aksi.includes('VERIFY')) return <Warning />;
    if (aksi.includes('DELETE') || aksi.includes('UNASSIGN')) return <ErrorIcon />;
    if (aksi.includes('ASSIGN')) return <Info />;
    return <Info />;
  };

  const handleReset = () => {
    setSearchTerm('');
    setActionFilter('Semua Aksi');
    setResourceFilter('Semua Resource');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Log Audit">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>Log Audit Sistem</Typography>
            <Typography variant="body2" color="text.secondary">Rekam jejak semua aksi penting yang dilakukan admin</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()} disabled={loading}>{loading ? <CircularProgress size={20} /> : <Refresh />}</IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<FileDownload />} onClick={handleExport} disabled={filteredLogs.length === 0}>
              Export CSV
            </Button>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat log audit: {error.message}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Cari nama admin, aksi, resource..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Jenis Aksi</InputLabel>
                <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} label="Jenis Aksi">
                  {actionTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }} label="Resource">
                  {resourceTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker label="Dari Tanggal" value={startDate} onChange={(v) => { setStartDate(v); setPage(0); }} slotProps={{ textField: { fullWidth: true } }} />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker label="Sampai Tanggal" value={endDate} onChange={(v) => { setEndDate(v); setPage(0); }} slotProps={{ textField: { fullWidth: true } }} />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" onClick={handleReset}>Reset</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {loading ? 'Memuat...' : `${filteredLogs.length} entri log`}
            </Typography>
            <Chip label={`Halaman ${page + 1}`} color="primary" variant="outlined" />
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Waktu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Aksi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resource ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Catatan</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        Belum ada log audit yang tersedia
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.map((log: any) => {
                  const d = formatDate(log.createdAt);
                  return (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        <Typography variant="body2">{d.date}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.time}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.namaAdmin}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip icon={getActionIcon(log.aksi)} label={log.aksi} color={getActionColor(log.aksi)} size="small" />
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {log.resourceId ? log.resourceId.slice(-12) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{log.catatan || '-'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Lihat Detail">
                          <IconButton size="small" onClick={() => { setSelectedLog(log); setDetailsDialogOpen(true); }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Baris per halaman:"
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Log Audit</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Waktu', value: (() => { const d = formatDate(selectedLog.createdAt); return `${d.date} ${d.time}`; })() },
                  { label: 'Admin', value: selectedLog.namaAdmin },
                  { label: 'Aksi', value: selectedLog.aksi },
                  { label: 'Resource', value: selectedLog.resource },
                  { label: 'Resource ID', value: selectedLog.resourceId || '-', mono: true },
                  { label: 'Catatan', value: selectedLog.catatan || '-' },
                ].map(({ label, value, mono }) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body1" sx={mono ? { fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' } : {}}>
                      {value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {selectedLog.nilaiBefore && (
                <Paper sx={{ p: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>Nilai Sebelum</Typography>
                  <Box component="pre" sx={{ fontSize: '0.8rem', overflow: 'auto', m: 0 }}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selectedLog.nilaiBefore), null, 2); }
                      catch { return selectedLog.nilaiBefore || ''; }
                    })()}
                  </Box>
                </Paper>
              )}

              {selectedLog.nilaiAfter && (
                <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>Nilai Sesudah</Typography>
                  <Box component="pre" sx={{ fontSize: '0.8rem', overflow: 'auto', m: 0 }}>
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selectedLog.nilaiAfter), null, 2); }
                      catch { return selectedLog.nilaiAfter || ''; }
                    })()}
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* ── Investigasi Canary Document ─────────────────────────────────── */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Investigasi Kebocoran Dokumen</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload file dokumen yang dicurigai bocor. Sistem akan membaca canary fingerprint
          yang tertanam di dalam file dan mengidentifikasi admin yang terakhir mengaksesnya.
        </Typography>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <Alert severity="info" icon={false} sx={{ py: 0.75 }}>
              <Typography variant="caption">
                Hanya file PDF dan gambar (JPG/PNG) yang didukung. Maksimum 10 MB.
                Canary hanya ada pada dokumen yang diakses setelah fitur ini diaktifkan.
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              component="label"
              sx={{ alignSelf: 'flex-start' }}
            >
              {investigateFile ? investigateFile.name : 'Pilih File Dokumen'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  setInvestigateFile(e.target.files?.[0] ?? null);
                  setInvestigateResult(null);
                  setInvestigateError('');
                }}
              />
            </Button>

            <Button
              variant="contained"
              disabled={!investigateFile || investigateLoading}
              onClick={handleInvestigate}
              sx={{ alignSelf: 'flex-start' }}
            >
              {investigateLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              {investigateLoading ? 'Menganalisis...' : 'Mulai Investigasi'}
            </Button>

            {investigateError && (
              <Alert severity="error">{investigateError}</Alert>
            )}

            {investigateResult && (
              <Alert
                severity={
                  investigateResult.status === 'identified' ? 'error' :
                  investigateResult.status === 'hash_found_no_log' ? 'warning' : 'success'
                }
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {investigateResult.pesan}
                </Typography>
                {investigateResult.aksesLog && (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li><Typography variant="caption">Admin: <strong>{investigateResult.aksesLog.namaAdmin}</strong></Typography></li>
                    <li><Typography variant="caption">Jenis Dokumen: <strong>{investigateResult.aksesLog.jenisDokumen}</strong></Typography></li>
                    <li><Typography variant="caption">IP Address: <strong>{investigateResult.aksesLog.ipAddress}</strong></Typography></li>
                    <li><Typography variant="caption">Waktu Akses: <strong>{new Date(investigateResult.aksesLog.waktuAkses).toLocaleString('id-ID')}</strong></Typography></li>
                    <li><Typography variant="caption">Fingerprint Hash: <strong style={{ fontFamily: 'monospace', fontSize: 10 }}>{investigateResult.fingerprintHash}</strong></Typography></li>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        </Card>
      </Box>
    </AdminLayout>
  );
}
