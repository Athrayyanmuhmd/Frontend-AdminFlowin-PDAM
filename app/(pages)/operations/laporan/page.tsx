'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search,
  Visibility,
  Person,
  LocationOn,
  AssignmentTurnedIn,
  Engineering,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_LAPORAN, UPDATE_LAPORAN_STATUS } from '@/lib/graphql/queries/reports';

// ─── Ahmad's enum values (via GQL SCREAMING_SNAKE_CASE) ─────────────────────
// DB stores: Ditunda, Ditugaskan, DitinjauAdmin, SedangDikerjakan, Selesai, Dibatalkan
// GQL enum:  DITUNDA, DITUGASKAN, DITINJAU_ADMIN, SEDANG_DIKERJAKAN, SELESAI, DIBATALKAN

const JENIS_LAPORAN_LABELS: Record<string, string> = {
  AIR_TIDAK_MENGALIR: 'Air Tidak Mengalir',
  AIR_KERUH: 'Air Keruh',
  KEBOCORAN_PIPA: 'Kebocoran Pipa',
  METERAN_BERMASALAH: 'Meteran Bermasalah',
  KENDALA_LAINNYA: 'Kendala Lainnya',
};

const STATUS_LABELS: Record<string, string> = {
  DITUNDA: 'Ditunda',
  DITUGASKAN: 'Ditugaskan',
  DITINJAU_ADMIN: 'Ditinjau Admin',
  SEDANG_DIKERJAKAN: 'Sedang Dikerjakan',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  DITUNDA: 'warning',
  DITUGASKAN: 'primary',
  DITINJAU_ADMIN: 'info',
  SEDANG_DIKERJAKAN: 'info',
  SELESAI: 'success',
  DIBATALKAN: 'error',
};

const JENIS_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  AIR_TIDAK_MENGALIR: 'error',
  AIR_KERUH: 'warning',
  KEBOCORAN_PIPA: 'error',
  METERAN_BERMASALAH: 'warning',
  KENDALA_LAINNYA: 'default',
};

// Status transitions yang diizinkan admin
const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  DITUNDA: [
    { value: 'DITUGASKAN', label: 'Tugaskan (mulai diproses)' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  DITUGASKAN: [
    { value: 'SEDANG_DIKERJAKAN', label: 'Tandai Sedang Dikerjakan' },
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  DITINJAU_ADMIN: [
    { value: 'SEDANG_DIKERJAKAN', label: 'Tandai Sedang Dikerjakan' },
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  SEDANG_DIKERJAKAN: [
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  SELESAI: [],
  DIBATALKAN: [],
};

export default function LaporanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_LAPORAN, {
    fetchPolicy: 'cache-and-network',
  });

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_LAPORAN_STATUS, {
    onCompleted: () => {
      refetch();
      setUpdateDialogOpen(false);
      setDetailOpen(false);
      setNewStatus('');
      setSnackbar({ open: true, message: 'Status laporan berhasil diperbarui', severity: 'success' });
    },
    onError: (err) => {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    },
  });

  const laporanList: any[] = (data as any)?.getAllLaporan || [];

  const filtered = laporanList.filter((l) => {
    const matchSearch =
      !search ||
      l.namaLaporan?.toLowerCase().includes(search.toLowerCase()) ||
      l.idPengguna?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
      l.alamat?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats — menggunakan GQL SCREAMING_SNAKE_CASE yang sesuai Ahmad
  const totalMenunggu = laporanList.filter((l) => l.status === 'DITUNDA').length;
  const totalDiproses = laporanList.filter((l) =>
    ['DITUGASKAN', 'DITINJAU_ADMIN', 'SEDANG_DIKERJAKAN'].includes(l.status)
  ).length;
  const totalSelesai = laporanList.filter((l) => l.status === 'SELESAI').length;

  const handleOpenUpdateDialog = (laporan: any) => {
    setSelectedLaporan(laporan);
    const nextOptions = NEXT_STATUSES[laporan.status] || [];
    setNewStatus(nextOptions[0]?.value || '');
    setUpdateDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedLaporan || !newStatus) return;
    updateStatus({ variables: { id: selectedLaporan._id, status: newStatus } });
  };

  const canUpdateStatus = (laporan: any) =>
    (NEXT_STATUSES[laporan.status] || []).length > 0;

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Laporan Pelanggan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kelola laporan masalah dari pelanggan PDAM
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Menunggu Tindakan</Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main">{totalMenunggu}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #3b82f6' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Sedang Diproses</Typography>
                <Typography variant="h4" fontWeight={700} color="info.main">{totalDiproses}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #22c55e' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Selesai</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{totalSelesai}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Filter Bar */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Cari laporan, nama pelanggan, alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value="DITUNDA">Ditunda</MenuItem>
                  <MenuItem value="DITUGASKAN">Ditugaskan</MenuItem>
                  <MenuItem value="DITINJAU_ADMIN">Ditinjau Admin</MenuItem>
                  <MenuItem value="SEDANG_DIKERJAKAN">Sedang Dikerjakan</MenuItem>
                  <MenuItem value="SELESAI">Selesai</MenuItem>
                  <MenuItem value="DIBATALKAN">Dibatalkan</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Gagal memuat laporan: {error.message}</Alert>
        ) : (
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Jenis Masalah</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Alamat</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Tidak ada laporan ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((laporan: any) => (
                      <TableRow key={laporan._id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {laporan.createdAt
                              ? new Date(laporan.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                              {laporan.idPengguna?.namaLengkap?.[0] || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {laporan.idPengguna?.namaLengkap || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {laporan.idPengguna?.noHP || ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              label={JENIS_LAPORAN_LABELS[laporan.jenisLaporan] || laporan.jenisLaporan}
                              size="small"
                              color={JENIS_COLORS[laporan.jenisLaporan] || 'default'}
                              variant="outlined"
                            />
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              {laporan.namaLaporan}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {laporan.alamat || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS_LABELS[laporan.status] || laporan.status}
                            size="small"
                            color={STATUS_COLORS[laporan.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Lihat Detail">
                              <IconButton
                                size="small"
                                onClick={() => { setSelectedLaporan(laporan); setDetailOpen(true); }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canUpdateStatus(laporan) && (
                              <Tooltip title="Perbarui Status">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenUpdateDialog(laporan)}
                                >
                                  <Engineering fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Menampilkan {filtered.length} dari {laporanList.length} laporan
              </Typography>
            </Box>
          </Card>
        )}

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
                <Box>
                  <Chip
                    label={JENIS_LAPORAN_LABELS[selectedLaporan.jenisLaporan] || selectedLaporan.jenisLaporan}
                    color={JENIS_COLORS[selectedLaporan.jenisLaporan] || 'default'}
                    size="small"
                  />
                  <Chip
                    label={STATUS_LABELS[selectedLaporan.status] || selectedLaporan.status}
                    color={STATUS_COLORS[selectedLaporan.status] || 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedLaporan.idPengguna?.namaLengkap}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedLaporan.idPengguna?.noHP} · {selectedLaporan.idPengguna?.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{selectedLaporan.alamat || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Deskripsi Masalah
                  </Typography>
                  <Typography variant="body2">{selectedLaporan.masalah}</Typography>
                </Box>
                {selectedLaporan.catatan && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Catatan</Typography>
                    <Typography variant="body2">{selectedLaporan.catatan}</Typography>
                  </Box>
                )}
                {selectedLaporan.imageURL?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Foto Laporan
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedLaporan.imageURL.map((url: string, i: number) => (
                        <Box
                          key={i}
                          component="img"
                          src={url}
                          alt={`foto-${i}`}
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">
                  Dilaporkan:{' '}
                  {selectedLaporan.createdAt
                    ? new Date(selectedLaporan.createdAt).toLocaleString('id-ID')
                    : '-'}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {selectedLaporan && canUpdateStatus(selectedLaporan) && (
              <Button
                variant="contained"
                startIcon={<Engineering />}
                onClick={() => { setDetailOpen(false); handleOpenUpdateDialog(selectedLaporan); }}
              >
                Perbarui Status
              </Button>
            )}
            <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Perbarui Status Laporan</DialogTitle>
          <DialogContent dividers>
            {selectedLaporan && (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Laporan</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedLaporan.namaLaporan}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pelanggan: {selectedLaporan.idPengguna?.namaLengkap || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Status saat ini:</Typography>
                  <Chip
                    label={STATUS_LABELS[selectedLaporan.status] || selectedLaporan.status}
                    size="small"
                    color={STATUS_COLORS[selectedLaporan.status] || 'default'}
                  />
                </Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Baru</InputLabel>
                  <Select
                    value={newStatus}
                    label="Status Baru"
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {(NEXT_STATUSES[selectedLaporan.status] || []).map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setUpdateDialogOpen(false); setNewStatus(''); }}>Batal</Button>
            <Button
              variant="contained"
              onClick={handleUpdateStatus}
              disabled={!newStatus || updatingStatus}
              startIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedIn />}
            >
              {updatingStatus ? 'Menyimpan...' : 'Simpan Status'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
}
