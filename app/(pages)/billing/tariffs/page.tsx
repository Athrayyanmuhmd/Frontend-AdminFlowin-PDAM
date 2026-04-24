'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
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
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  TrendingUp,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_ALL_KELOMPOK_PELANGGAN,
  CREATE_KELOMPOK_PELANGGAN,
  UPDATE_KELOMPOK_PELANGGAN,
  DELETE_KELOMPOK_PELANGGAN,
} from '@/lib/graphql/queries/kelompokPelanggan';

interface KelompokForm {
  NamaKelompok: string;
  TarifRendah: string;
  TarifTinggi: string;
  BiayaBeban: string;
}

const defaultForm: KelompokForm = {
  NamaKelompok: '',
  TarifRendah: '',
  TarifTinggi: '',
  BiayaBeban: '',
};

export default function TariffsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<KelompokForm>(defaultForm);
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data, loading, error, refetch } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'network-only',
  });

  const [createKelompok, { loading: createLoading }] = useMutation(CREATE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
  });

  const [updateKelompok, { loading: updateLoading }] = useMutation(UPDATE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
  });

  const [deleteKelompok, { loading: deleteLoading }] = useMutation(DELETE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
  });

  const kelompokList = (data as any)?.getAllKelompokPelanggan || [];
  const isMutating = createLoading || updateLoading;

  const handleOpenAdd = () => {
    setForm(defaultForm);
    setFormError('');
    setEditMode(false);
    setSelectedId(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (k: any) => {
    setForm({
      NamaKelompok: k.NamaKelompok || '',
      TarifRendah: String(k.TarifRendah || ''),
      TarifTinggi: String(k.TarifTinggi || ''),
      BiayaBeban: String(k.BiayaBeban || ''),
    });
    setFormError('');
    setEditMode(true);
    setSelectedId(k._id);
    setOpenDialog(true);
  };

  const handleOpenDelete = (id: string) => {
    setSelectedId(id);
    setOpenDeleteDialog(true);
  };

  const validateForm = () => {
    if (!form.NamaKelompok.trim()) return 'Nama kelompok wajib diisi';
    if (!form.TarifRendah || isNaN(Number(form.TarifRendah))) return 'Harga di bawah 10m³ tidak valid';
    if (!form.TarifTinggi || isNaN(Number(form.TarifTinggi))) return 'Harga di atas 10m³ tidak valid';
    if (!form.BiayaBeban || isNaN(Number(form.BiayaBeban))) return 'Biaya beban tidak valid';
    return '';
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    const input = {
      NamaKelompok: form.NamaKelompok.trim(),
      TarifRendah: Number(form.TarifRendah),
      TarifTinggi: Number(form.TarifTinggi),
      BiayaBeban: Number(form.BiayaBeban),
    };

    try {
      if (editMode && selectedId) {
        await updateKelompok({ variables: { id: selectedId, input } });
        setSnackbar({ open: true, message: 'Kelompok tarif berhasil diperbarui', severity: 'success' });
      } else {
        await createKelompok({ variables: { input } });
        setSnackbar({ open: true, message: 'Kelompok tarif berhasil ditambahkan', severity: 'success' });
      }
      setOpenDialog(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Operasi gagal', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteKelompok({ variables: { id: selectedId } });
      setSnackbar({ open: true, message: 'Kelompok tarif berhasil dihapus', severity: 'success' });
      setOpenDeleteDialog(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Gagal menghapus', severity: 'error' });
    }
  };

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <AdminLayout title="Struktur Tarif">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Struktur Tarif">
        <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat data tarif: {error.message}</Alert>
        <Button startIcon={<Refresh />} onClick={() => refetch()}>Coba Lagi</Button>
      </AdminLayout>
    );
  }

  const minHarga = kelompokList.length > 0
    ? Math.min(...kelompokList.map((k: any) => k.TarifRendah || 0))
    : 0;

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Struktur Tarif">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Struktur Tarif Air
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kelompok pelanggan dan tarif berdasarkan ERD sistem Aqualink
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()}><Refresh /></IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
              Tambah Kelompok Tarif
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Tarif air menggunakan sistem dua tingkat: di bawah 10m³ dan di atas 10m³. Perubahan tarif akan langsung mempengaruhi perhitungan tagihan berikutnya.
        </Alert>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AttachMoney sx={{ color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{kelompokList.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Kelompok Tarif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{kelompokList.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Kelompok Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp sx={{ color: 'warning.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatRupiah(minHarga)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Tarif Terendah (≤10m³)</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tariff Table */}
        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nama Kelompok</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tarif ≤ 10m³ (per m³)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tarif &gt; 10m³ (per m³)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Biaya Beban</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dibuat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kelompokList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Belum ada kelompok tarif. Tambahkan yang pertama.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  kelompokList.map((k: any) => (
                    <TableRow key={k._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={k.NamaKelompok} color="primary" size="small" />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatRupiah(k.TarifRendah)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatRupiah(k.TarifTinggi)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatRupiah(k.BiayaBeban)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {k.createdAt
                            ? new Date(isNaN(Number(k.createdAt)) ? k.createdAt : Number(k.createdAt)).toLocaleDateString('id-ID')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(k)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton size="small" onClick={() => handleOpenDelete(k._id)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Kelompok Tarif' : 'Tambah Kelompok Tarif Baru'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Kelompok"
                value={form.NamaKelompok}
                onChange={(e) => setForm(f => ({ ...f, NamaKelompok: e.target.value }))}
                placeholder="Contoh: Rumah Tangga, Komersial, Industri"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Harga di bawah 10m³ (Rp/m³)"
                type="number"
                value={form.TarifRendah}
                onChange={(e) => setForm(f => ({ ...f, TarifRendah: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Harga di atas 10m³ (Rp/m³)"
                type="number"
                value={form.TarifTinggi}
                onChange={(e) => setForm(f => ({ ...f, TarifTinggi: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biaya Beban (Rp/bulan)"
                type="number"
                value={form.BiayaBeban}
                onChange={(e) => setForm(f => ({ ...f, BiayaBeban: e.target.value }))}
                inputProps={{ min: 0 }}
                helperText="Biaya tetap per bulan di luar pemakaian air"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isMutating}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isMutating}>
            {isMutating ? <CircularProgress size={20} /> : editMode ? 'Simpan Perubahan' : 'Tambah Kelompok'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Menghapus kelompok tarif akan mempengaruhi meteran yang terhubung. Pastikan tidak ada meteran aktif yang menggunakan kelompok ini.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : 'Hapus'}
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
