'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box, Card, CardContent, Typography, Chip, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Tooltip, Pagination,
  CircularProgress, Alert, Snackbar, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Grid, Paper, Divider, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Visibility, AssignmentTurnedIn, Search, CheckCircle, Build, Warning, Person, LocationOn,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_LAPORAN } from '@/lib/graphql/queries/reports';
import { GET_ALL_TEKNISI } from '@/lib/graphql/queries/technicians';
import { CREATE_PENYELESAIAN_LAPORAN } from '@/lib/graphql/mutations/pemasangan';

const JENIS_LABELS: Record<string, string> = {
  AirTidakMengalir: 'Air Tidak Mengalir',
  AirKeruh: 'Air Keruh',
  KebocoranPipa: 'Kebocoran Pipa',
  MeteranBermasalah: 'Meteran Bermasalah',
  KendalaLainnya: 'Kendala Lainnya',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'success'> = {
  Diajukan: 'warning',
  ProsesPerbaikan: 'info',
  Selesai: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  Diajukan: 'Diajukan',
  ProsesPerbaikan: 'Proses Perbaikan',
  Selesai: 'Selesai',
};

export default function PenyelesaianLaporanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ProsesPerbaikan');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [form, setForm] = useState({
    catatan: '',
    teknisiId: '',
    tanggalSelesai: new Date().toISOString().split('T')[0],
    durasiPengerjaan: '',
    materialDigunakan: '',
    biaya: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_LAPORAN, { fetchPolicy: 'network-only' });
  const { data: teknisiData } = useQuery(GET_ALL_TEKNISI);

  const [createPenyelesaian, { loading: creating }] = useMutation(CREATE_PENYELESAIAN_LAPORAN, {
    onCompleted: () => {
      refetch();
      setResolveOpen(false);
      setForm({ catatan: '', teknisiId: '', tanggalSelesai: new Date().toISOString().split('T')[0], durasiPengerjaan: '', materialDigunakan: '', biaya: '' });
      setSnackbar({ open: true, message: 'Laporan berhasil diselesaikan! Status diperbarui ke Selesai.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  const allLaporan: any[] = (data as any)?.getAllLaporan || [];
  const allTeknisi: any[] = (teknisiData as any)?.getAllTeknisi || [];

  const filtered = allLaporan.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSearch = !search ||
      l.namaLaporan?.toLowerCase().includes(search.toLowerCase()) ||
      l.idPengguna?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
      l.alamat?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalDiajukan = allLaporan.filter(l => l.status === 'Diajukan').length;
  const totalProses = allLaporan.filter(l => l.status === 'ProsesPerbaikan').length;
  const totalSelesai = allLaporan.filter(l => l.status === 'Selesai').length;

  const handleResolve = (laporan: any) => {
    setSelectedLaporan(laporan);
    setResolveOpen(true);
  };

  const handleSubmitResolve = () => {
    if (!selectedLaporan || !form.catatan) return;
    const materials = form.materialDigunakan ? form.materialDigunakan.split(',').map(s => s.trim()).filter(Boolean) : [];
    createPenyelesaian({
      variables: {
        input: {
          idLaporan: selectedLaporan._id,
          urlGambar: [],
          catatan: form.catatan,
          ...(form.teknisiId && { teknisiId: form.teknisiId }),
          tanggalSelesai: form.tanggalSelesai || new Date().toISOString(),
          metadata: {
            ...(form.durasiPengerjaan && { durasiPengerjaan: parseFloat(form.durasiPengerjaan) }),
            ...(materials.length > 0 && { materialDigunakan: materials }),
            ...(form.biaya && { biaya: parseFloat(form.biaya) }),
          },
        },
      },
    });
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Penyelesaian Laporan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
          Penyelesaian Laporan
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat data: {error.message}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Diajukan', value: totalDiajukan, color: 'warning.main', icon: <Warning /> },
            { label: 'Proses Perbaikan', value: totalProses, color: 'info.main', icon: <Build /> },
            { label: 'Selesai', value: totalSelesai, color: 'success.main', icon: <CheckCircle /> },
          ].map((s) => (
            <Grid item xs={12} md={4} key={s.label}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: s.color }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Cari laporan, pelanggan, alamat..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="all">Semua</MenuItem>
                  <MenuItem value="Diajukan">Diajukan</MenuItem>
                  <MenuItem value="ProsesPerbaikan">Proses Perbaikan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" onClick={() => refetch()} disabled={loading}>Refresh</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Jenis Masalah</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Alamat</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada laporan ditemukan
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((laporan: any) => (
                      <TableRow key={laporan._id} hover>
                        <TableCell>
                          <Typography variant="caption">
                            {laporan.createdAt ? new Date(laporan.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                              {laporan.idPengguna?.namaLengkap?.[0] || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{laporan.idPengguna?.namaLengkap || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">{laporan.idPengguna?.noHP || ''}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={JENIS_LABELS[laporan.jenisLaporan] || laporan.jenisLaporan}
                            size="small"
                            variant="outlined"
                            color={laporan.jenisLaporan === 'KebocoranPipa' || laporan.jenisLaporan === 'AirTidakMengalir' ? 'error' : 'warning'}
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {laporan.namaLaporan}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {laporan.alamat || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={STATUS_LABELS[laporan.status] || laporan.status}
                            size="small"
                            color={STATUS_COLORS[laporan.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Lihat Detail">
                              <IconButton size="small" onClick={() => { setSelectedLaporan(laporan); setDetailOpen(true); }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {laporan.status === 'ProsesPerbaikan' && (
                              <Tooltip title="Tandai Selesai & Buat Penyelesaian">
                                <IconButton size="small" color="success" onClick={() => handleResolve(laporan)}>
                                  <AssignmentTurnedIn fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                </Box>
              )}
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Menampilkan {paginated.length} dari {filtered.length} laporan
                </Typography>
              </Box>
            </>
          )}
        </Card>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Detail Laporan</DialogTitle>
        <DialogContent dividers>
          {selectedLaporan && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Judul Laporan</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedLaporan.namaLaporan}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={JENIS_LABELS[selectedLaporan.jenisLaporan] || selectedLaporan.jenisLaporan} size="small" variant="outlined" />
                <Chip label={STATUS_LABELS[selectedLaporan.status] || selectedLaporan.status} size="small" color={STATUS_COLORS[selectedLaporan.status] || 'default'} />
              </Stack>
              <Divider />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Person fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2" fontWeight={600}>{selectedLaporan.idPengguna?.namaLengkap}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedLaporan.idPengguna?.noHP} · {selectedLaporan.idPengguna?.email}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{selectedLaporan.alamat || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Deskripsi Masalah</Typography>
                <Typography variant="body2">{selectedLaporan.masalah}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Dilaporkan: {selectedLaporan.createdAt ? new Date(selectedLaporan.createdAt).toLocaleString('id-ID') : '-'}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selectedLaporan?.status === 'ProsesPerbaikan' && (
            <Button variant="contained" color="success" startIcon={<AssignmentTurnedIn />} onClick={() => { setDetailOpen(false); handleResolve(selectedLaporan); }}>
              Tandai Selesai
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentTurnedIn color="success" />
            Selesaikan Laporan
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLaporan && (
            <Stack spacing={2.5}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">Laporan</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedLaporan.namaLaporan}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedLaporan.idPengguna?.namaLengkap} · {selectedLaporan.alamat}</Typography>
              </Paper>

              <TextField
                fullWidth
                size="small"
                label="Catatan Penyelesaian *"
                multiline
                rows={3}
                value={form.catatan}
                onChange={(e) => setForm(f => ({ ...f, catatan: e.target.value }))}
                placeholder="Deskripsikan apa yang telah dilakukan..."
                required
              />

              <FormControl fullWidth size="small">
                <InputLabel>Teknisi yang Mengerjakan (opsional)</InputLabel>
                <Select
                  value={form.teknisiId}
                  label="Teknisi yang Mengerjakan (opsional)"
                  onChange={(e) => setForm(f => ({ ...f, teknisiId: e.target.value }))}
                >
                  <MenuItem value="">Tidak ditentukan</MenuItem>
                  {allTeknisi.map((tek: any) => (
                    <MenuItem key={tek._id} value={tek._id}>
                      {tek.namaLengkap} · {tek.divisi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Tanggal Selesai"
                type="date"
                value={form.tanggalSelesai}
                onChange={(e) => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />

              <Divider />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Metadata (opsional)</Typography>

              <TextField
                fullWidth
                size="small"
                label="Durasi Pengerjaan (jam)"
                type="number"
                value={form.durasiPengerjaan}
                onChange={(e) => setForm(f => ({ ...f, durasiPengerjaan: e.target.value }))}
                placeholder="contoh: 2.5"
              />

              <TextField
                fullWidth
                size="small"
                label="Material Digunakan (pisahkan dengan koma)"
                value={form.materialDigunakan}
                onChange={(e) => setForm(f => ({ ...f, materialDigunakan: e.target.value }))}
                placeholder="contoh: Pipa PVC, Fitting, Sealant"
              />

              <TextField
                fullWidth
                size="small"
                label="Estimasi Biaya (Rp)"
                type="number"
                value={form.biaya}
                onChange={(e) => setForm(f => ({ ...f, biaya: e.target.value }))}
                placeholder="contoh: 150000"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedIn />}
            onClick={handleSubmitResolve}
            disabled={!form.catatan || creating}
          >
            {creating ? 'Menyimpan...' : 'Selesaikan Laporan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
