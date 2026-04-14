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
  IconButton,
  Tooltip,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Search,
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

interface PengawasanPemasangan {
  _id: string;
  idPemasangan: {
    _id: string;
    seriMeteran: string;
    idKoneksiData?: {
      _id: string;
      Alamat: string;
      IdPelanggan?: {
        _id: string;
        namaLengkap: string;
        noHP: string;
      };
    };
  };
  urlGambar: string[];
  catatan: string;
  createdAt: string;
  updatedAt: string;
}

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
    const pelanggan = item.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap ?? '';
    const seri = item.idPemasangan?.seriMeteran ?? '';
    const alamat = item.idPemasangan?.idKoneksiData?.Alamat ?? '';
    const matchSearch =
      !searchTerm ||
      pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alamat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <Grid item xs={6} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #2196f3' }}>
              <Typography variant="h4" fontWeight={700} color="#2196f3">
                {allData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Pengawasan
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #4caf50' }}>
              <Typography variant="h4" fontWeight={700} color="#4caf50">
                {allData.filter((d) => d.urlGambar?.length > 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dengan Dokumentasi
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={4}>
            <Paper sx={{ p: 2, borderLeft: '4px solid #ff9800' }}>
              <Typography variant="h4" fontWeight={700} color="#ff9800">
                {allData.filter((d) => d.catatan && d.catatan.trim() !== '').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dengan Catatan
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <TextField
                label="Cari pelanggan / seri meteran / alamat"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
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
                      <TableCell>Dokumentasi</TableCell>
                      <TableCell>Tgl Pengawasan</TableCell>
                      <TableCell>Catatan</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada data pengawasan
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item, idx) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap ?? '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.idPemasangan?.idKoneksiData?.Alamat ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.idPemasangan?.seriMeteran ?? '-'}</TableCell>
                          <TableCell>
                            {item.urlGambar?.length > 0 ? `${item.urlGambar.length} foto` : 'Tidak ada'}
                          </TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.catatan || '-'}
                            </Typography>
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
                    {selectedItem.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>No. HP:</b>{' '}
                    {selectedItem.idPemasangan?.idKoneksiData?.IdPelanggan?.noHP ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Alamat:</b> {selectedItem.idPemasangan?.idKoneksiData?.Alamat ?? '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Detail Pengawasan
                  </Typography>
                  <Typography variant="body2">
                    <b>Tanggal:</b> {formatDate(selectedItem.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <b>Terakhir Diupdate:</b> {formatDate(selectedItem.updatedAt)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Catatan */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Catatan
                  </Typography>
                  <Typography variant="body2">{selectedItem.catatan || 'Tidak ada catatan'}</Typography>
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
