'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
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
  Paper,
  Grid,
} from '@mui/material';
import {
  Search,
  Visibility,
  Build,
  ReportProblem,
  CheckCircle,
  Schedule,
  Person,
  LocationOn,
  Phone,
  AssignmentTurnedIn,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_LAPORAN, GET_LAPORAN_BY_STATUS, UPDATE_LAPORAN_STATUS } from '@/lib/graphql/queries/reports';
import { CREATE_WORK_ORDER_FROM_LAPORAN } from '@/lib/graphql/mutations/workOrder';

const GET_ALL_TEKNISI = gql`
  query GetAllTeknisi {
    getAllTeknisi {
      _id
      namaLengkap
      divisi
      email
    }
  }
`;

const JENIS_LAPORAN_LABELS: Record<string, string> = {
  AirTidakMengalir: 'Air Tidak Mengalir',
  AirKeruh: 'Air Keruh',
  KebocoranPipa: 'Kebocoran Pipa',
  MeteranBermasalah: 'Meteran Bermasalah',
  KendalaLainnya: 'Kendala Lainnya',
};

const STATUS_LABELS: Record<string, string> = {
  Diajukan: 'Diajukan',
  ProsesPerbaikan: 'Proses Perbaikan',
  Selesai: 'Selesai',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'success'> = {
  Diajukan: 'warning',
  ProsesPerbaikan: 'info',
  Selesai: 'success',
};

const JENIS_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  AirTidakMengalir: 'error',
  AirKeruh: 'warning',
  KebocoranPipa: 'error',
  MeteranBermasalah: 'warning',
  KendalaLainnya: 'default',
};

export default function LaporanPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [woDialogOpen, setWoDialogOpen] = useState(false);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);
  const [catatan, setCatatan] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_LAPORAN, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: teknisiData } = useQuery(GET_ALL_TEKNISI);

  const [updateStatus] = useMutation(UPDATE_LAPORAN_STATUS, {
    onCompleted: () => {
      refetch();
      setSnackbar({ open: true, message: 'Status laporan berhasil diperbarui', severity: 'success' });
    },
    onError: (err) => {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    },
  });

  const [createWorkOrderFromLaporan, { loading: creatingWO }] = useMutation(CREATE_WORK_ORDER_FROM_LAPORAN, {
    onCompleted: () => {
      refetch();
      setWoDialogOpen(false);
      setSelectedTeknisiIds([]);
      setCatatan('');
      setSnackbar({ open: true, message: 'Work order berhasil dibuat dari laporan!', severity: 'success' });
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

  // Stats
  const totalDiajukan = laporanList.filter((l) => l.status === 'Diajukan').length;
  const totalProses = laporanList.filter((l) => l.status === 'ProsesPerbaikan').length;
  const totalSelesai = laporanList.filter((l) => l.status === 'Selesai').length;

  const handleBuatWorkOrder = () => {
    if (!selectedLaporan || selectedTeknisiIds.length === 0) return;
    createWorkOrderFromLaporan({
      variables: {
        idLaporan: selectedLaporan._id,
        teknisiIds: selectedTeknisiIds,
        catatan: catatan || undefined,
      },
    });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus({ variables: { id, status } });
  };

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
              Kelola laporan masalah dari pelanggan dan tindak lanjuti dengan work order
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Menunggu Tindakan</Typography>
                <Typography variant="h4" fontWeight={700} color="warning.main">{totalDiajukan}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderLeft: '4px solid #3b82f6' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Sedang Diproses</Typography>
                <Typography variant="h4" fontWeight={700} color="info.main">{totalProses}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderLeft: '4px solid #22c55e' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Selesai</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{totalSelesai}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Bar */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Cari laporan, nama pelanggan, alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value="Diajukan">Diajukan</MenuItem>
                  <MenuItem value="ProsesPerbaikan">Proses Perbaikan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
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
                          <Typography variant="body2" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                              <IconButton size="small" onClick={() => { setSelectedLaporan(laporan); setDetailOpen(true); }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {laporan.status === 'Diajukan' && (
                              <Tooltip title="Buat Work Order">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => { setSelectedLaporan(laporan); setWoDialogOpen(true); }}
                                >
                                  <Build fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {laporan.status === 'ProsesPerbaikan' && (
                              <Tooltip title="Tandai Selesai">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUpdateStatus(laporan._id, 'Selesai')}
                                >
                                  <AssignmentTurnedIn fontSize="small" />
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
          <DialogTitle sx={{ fontWeight: 700 }}>
            Detail Laporan
          </DialogTitle>
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
                {selectedLaporan.catatan && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Catatan</Typography>
                    <Typography variant="body2">{selectedLaporan.catatan}</Typography>
                  </Box>
                )}
                {selectedLaporan.imageUrl?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Foto Laporan</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedLaporan.imageUrl.map((url: string, i: number) => (
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
                  Dilaporkan: {selectedLaporan.createdAt ? new Date(selectedLaporan.createdAt).toLocaleString('id-ID') : '-'}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {selectedLaporan?.status === 'Diajukan' && (
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={() => { setDetailOpen(false); setWoDialogOpen(true); }}
              >
                Buat Work Order
              </Button>
            )}
            <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogActions>
        </Dialog>

        {/* Buat Work Order Dialog */}
        <Dialog open={woDialogOpen} onClose={() => setWoDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build color="primary" />
              Buat Work Order dari Laporan
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedLaporan && (
              <Stack spacing={2.5}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary">Laporan</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedLaporan.namaLaporan}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedLaporan.masalah}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={JENIS_LAPORAN_LABELS[selectedLaporan.jenisLaporan]} size="small" color={JENIS_COLORS[selectedLaporan.jenisLaporan] || 'default'} />
                  </Stack>
                </Paper>

                <FormControl fullWidth size="small">
                  <InputLabel>Pilih Teknisi *</InputLabel>
                  <Select
                    multiple
                    value={selectedTeknisiIds}
                    label="Pilih Teknisi *"
                    onChange={(e) => setSelectedTeknisiIds(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(selected as string[]).map((id) => {
                          const tek = (teknisiData as any)?.getAllTeknisi?.find((t: any) => t._id === id);
                          return <Chip key={id} label={tek?.namaLengkap || id} size="small" />;
                        })}
                      </Stack>
                    )}
                  >
                    {(teknisiData as any)?.getAllTeknisi?.map((tek: any) => (
                      <MenuItem key={tek._id} value={tek._id}>
                        <Box>
                          <Typography variant="body2">{tek.namaLengkap}</Typography>
                          <Typography variant="caption" color="text.secondary">{tek.divisi}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Catatan (opsional)"
                  multiline
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Instruksi khusus untuk teknisi..."
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setWoDialogOpen(false); setSelectedTeknisiIds([]); setCatatan(''); }}>
              Batal
            </Button>
            <Button
              variant="contained"
              startIcon={creatingWO ? <CircularProgress size={16} color="inherit" /> : <Build />}
              onClick={handleBuatWorkOrder}
              disabled={selectedTeknisiIds.length === 0 || creatingWO}
            >
              {creatingWO ? 'Membuat...' : 'Buat Work Order'}
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
