'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Warning,
  CheckCircle,
  Search,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  GET_ALL_PENGAWASAN_PEMASANGAN,
} from '@/lib/graphql/queries/pengawasan';
import {
  DELETE_PENGAWASAN_PEMASANGAN,
} from '@/lib/graphql/mutations/pengawasan';

interface ChecklistPengawasan {
  kualitasSambunganPipa?: string;
  posisiMeteran?: string;
  kebersihanPemasangan?: string;
  kepatuhanK3?: string;
}

interface PengawasanPemasangan {
  _id: string;
  idPemasangan: {
    _id: string;
    seriMeteran: string;
    idKoneksiData?: {
      _id: string;
      alamat: string;
      idPelanggan?: {
        namaLengkap: string;
        noHP: string;
      };
    };
    teknisiId?: {
      _id: string;
      namaLengkap: string;
    };
  };
  urlGambar: string[];
  catatan: string;
  supervisorId: {
    _id: string;
    namaLengkap: string;
    divisi?: string;
  };
  tanggalPengawasan?: string;
  hasilPengawasan: string;
  temuan?: string[];
  rekomendasi?: string;
  perluTindakLanjut: boolean;
  checklist?: ChecklistPengawasan;
  createdAt: string;
  updatedAt: string;
}

const hasilColor = (hasil: string) => {
  if (hasil === 'Sesuai') return 'success';
  if (hasil === 'Perbaikan Diperlukan') return 'warning';
  if (hasil === 'Tidak Sesuai') return 'error';
  return 'default';
};

const formatDate = (ts?: string) => {
  if (!ts) return '-';
  const d = new Date(isNaN(Number(ts)) ? ts : Number(ts));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function PengawasanPemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterHasil, setFilterHasil] = useState('');
  const [filterTindakLanjut, setFilterTindakLanjut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<PengawasanPemasangan | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PengawasanPemasangan | null>(null);
  const [snackMsg, setSnackMsg] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_ALL_PENGAWASAN_PEMASANGAN, {
    fetchPolicy: 'network-only',
    skip: !isAuthenticated,
  });

  const [deletePengawasan, { loading: deleting }] = useMutation(DELETE_PENGAWASAN_PEMASANGAN, {
    onCompleted: () => {
      setSnackMsg('Data pengawasan berhasil dihapus');
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => setSnackMsg('Gagal menghapus: ' + err.message),
  });

  if (authLoading || !isAuthenticated) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allData: PengawasanPemasangan[] = (data as any)?.getAllPengawasanPemasangan ?? [];

  const filtered = allData.filter((item) => {
    const matchHasil = !filterHasil || item.hasilPengawasan === filterHasil;
    const matchTL =
      !filterTindakLanjut ||
      (filterTindakLanjut === 'ya' ? item.perluTindakLanjut : !item.perluTindakLanjut);
    const pelanggan = item.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '';
    const seri = item.idPemasangan?.seriMeteran ?? '';
    const supervisor = item.supervisorId?.namaLengkap ?? '';
    const matchSearch =
      !searchTerm ||
      pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchHasil && matchTL && matchSearch;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const statsSesuai = allData.filter((d) => d.hasilPengawasan === 'Sesuai').length;
  const statsPerbaikan = allData.filter((d) => d.hasilPengawasan === 'Perbaikan Diperlukan').length;
  const statsTidakSesuai = allData.filter((d) => d.hasilPengawasan === 'Tidak Sesuai').length;
  const statsTindakLanjut = allData.filter((d) => d.perluTindakLanjut).length;

  const handleDelete = () => {
    if (deleteTarget) deletePengawasan({ variables: { id: deleteTarget._id } });
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Pengawasan Pemasangan
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Rekap hasil pengawasan selama proses pemasangan meteran air
        </Typography>

        {snackMsg && (
          <Alert severity="info" onClose={() => setSnackMsg('')} sx={{ mb: 2 }}>
            {snackMsg}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Sesuai', value: statsSesuai, color: '#4caf50' },
            { label: 'Perbaikan Diperlukan', value: statsPerbaikan, color: '#ff9800' },
            { label: 'Tidak Sesuai', value: statsTidakSesuai, color: '#f44336' },
            { label: 'Perlu Tindak Lanjut', value: statsTindakLanjut, color: '#2196f3' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderLeft: `4px solid ${s.color}` }}>
                <Typography variant="h4" fontWeight={700} color={s.color}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Cari pelanggan / seri / supervisor"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Hasil Pengawasan"
                size="small"
                fullWidth
                value={filterHasil}
                onChange={(e) => { setFilterHasil(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} /> }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="Sesuai">Sesuai</MenuItem>
                <MenuItem value="Perbaikan Diperlukan">Perbaikan Diperlukan</MenuItem>
                <MenuItem value="Tidak Sesuai">Tidak Sesuai</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Tindak Lanjut"
                size="small"
                fullWidth
                value={filterTindakLanjut}
                onChange={(e) => { setFilterTindakLanjut(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="ya">Perlu Tindak Lanjut</MenuItem>
                <MenuItem value="tidak">Tidak Perlu</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Gagal memuat data: {error.message}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.50' }}>
                      <TableCell>No</TableCell>
                      <TableCell>Pelanggan</TableCell>
                      <TableCell>Seri Meteran</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>Tgl Pengawasan</TableCell>
                      <TableCell>Hasil</TableCell>
                      <TableCell>Tindak Lanjut</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada data pengawasan
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item, idx) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.idPemasangan?.idKoneksiData?.alamat ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.idPemasangan?.seriMeteran ?? '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.supervisorId?.namaLengkap ?? '-'}
                            </Typography>
                            {item.supervisorId?.divisi && (
                              <Typography variant="caption" color="text.secondary">
                                {item.supervisorId.divisi}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(item.tanggalPengawasan ?? item.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.hasilPengawasan}
                              color={hasilColor(item.hasilPengawasan) as 'success' | 'warning' | 'error' | 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.perluTindakLanjut ? (
                              <Chip label="Perlu" color="warning" size="small" icon={<Warning />} />
                            ) : (
                              <Chip label="Tidak" color="success" size="small" icon={<CheckCircle />} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Detail">
                              <IconButton
                                size="small"
                                onClick={() => { setSelectedItem(item); setOpenDetail(true); }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hapus">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => { setDeleteTarget(item); setOpenDeleteDialog(true); }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                labelRowsPerPage="Baris per halaman:"
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Pengawasan Pemasangan</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Info Pemasangan
                  </Typography>
                  <Typography variant="body2">
                    <b>Seri Meteran:</b> {selectedItem.idPemasangan?.seriMeteran ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Pelanggan:</b>{' '}
                    {selectedItem.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Alamat:</b> {selectedItem.idPemasangan?.idKoneksiData?.alamat ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Teknisi Pemasang:</b>{' '}
                    {selectedItem.idPemasangan?.teknisiId?.namaLengkap ?? '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Hasil Pengawasan
                  </Typography>
                  <Typography variant="body2">
                    <b>Supervisor:</b> {selectedItem.supervisorId?.namaLengkap ?? '-'}
                    {selectedItem.supervisorId?.divisi && ` (${selectedItem.supervisorId.divisi})`}
                  </Typography>
                  <Typography variant="body2">
                    <b>Tanggal:</b> {formatDate(selectedItem.tanggalPengawasan ?? selectedItem.createdAt)}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={selectedItem.hasilPengawasan}
                      color={hasilColor(selectedItem.hasilPengawasan) as 'success' | 'warning' | 'error' | 'default'}
                    />
                    {selectedItem.perluTindakLanjut && (
                      <Chip label="Perlu Tindak Lanjut" color="warning" sx={{ ml: 1 }} icon={<Warning />} />
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Checklist */}
              {selectedItem.checklist && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Checklist Pengawasan
                    </Typography>
                    <Grid container spacing={1}>
                      {[
                        ['Kualitas Sambungan Pipa', selectedItem.checklist.kualitasSambunganPipa],
                        ['Posisi Meteran', selectedItem.checklist.posisiMeteran],
                        ['Kebersihan Pemasangan', selectedItem.checklist.kebersihanPemasangan],
                        ['Kepatuhan K3', selectedItem.checklist.kepatuhanK3],
                      ].map(([label, val]) => (
                        <Grid item xs={6} key={label}>
                          <Typography variant="body2">
                            <b>{label}:</b>{' '}
                            <Chip
                              label={val ?? '-'}
                              size="small"
                              color={val === 'Baik' || val === 'Tepat' ? 'success' : val === 'Cukup' ? 'warning' : 'error'}
                            />
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Temuan & Rekomendasi */}
              {(selectedItem.temuan?.length || selectedItem.rekomendasi) && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Temuan & Rekomendasi
                    </Typography>
                    {selectedItem.temuan && selectedItem.temuan.length > 0 && (
                      <>
                        <Typography variant="body2" fontWeight={600}>Temuan:</Typography>
                        <List dense disablePadding>
                          {selectedItem.temuan.map((t, i) => (
                            <ListItem key={i} disablePadding>
                              <ListItemText primary={`• ${t}`} />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    {selectedItem.rekomendasi && (
                      <Typography variant="body2" mt={1}>
                        <b>Rekomendasi:</b> {selectedItem.rekomendasi}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Catatan */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Catatan
                  </Typography>
                  <Typography variant="body2">{selectedItem.catatan}</Typography>
                </Paper>
              </Grid>

              {/* Foto */}
              {selectedItem.urlGambar?.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Dokumentasi Foto ({selectedItem.urlGambar.length})
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {selectedItem.urlGambar.map((url, i) => (
                        <Button
                          key={i}
                          variant="outlined"
                          size="small"
                          onClick={() => window.open(url, '_blank')}
                        >
                          Foto {i + 1}
                        </Button>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs">
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Hapus data pengawasan untuk seri meteran{' '}
            <b>{deleteTarget?.idPemasangan?.seriMeteran}</b>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={18} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
