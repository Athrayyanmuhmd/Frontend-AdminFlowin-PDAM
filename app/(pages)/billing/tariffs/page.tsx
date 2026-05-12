'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Grid,
  Card,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  TrendingUp,
  CheckCircle,
  Refresh,
  Close,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import StatCard from '../../../components/ui/StatCard';
import {
  GET_ALL_KELOMPOK_PELANGGAN,
  CREATE_KELOMPOK_PELANGGAN,
  UPDATE_KELOMPOK_PELANGGAN,
  DELETE_KELOMPOK_PELANGGAN,
} from '@/lib/graphql/queries/kelompokPelanggan';

interface KelompokForm {
  KodeKelompok: string;
  NamaKelompok: string;
  Kategori: string;
  Deskripsi: string;
  BatasRendah: string;
  TarifRendah: string;
  TarifTinggi: string;
  BiayaBeban: string;
  IsKesepakatan: boolean;
}

const defaultForm: KelompokForm = {
  KodeKelompok: '',
  NamaKelompok: '',
  Kategori: 'Non Niaga',
  Deskripsi: '',
  BatasRendah: '',
  TarifRendah: '',
  TarifTinggi: '',
  BiayaBeban: '',
  IsKesepakatan: false,
};

const KATEGORI_OPTIONS = [
  { value: 'Sosial', label: 'Sosial' },
  { value: 'Non Niaga', label: 'Non Niaga (Rumah Tangga)' },
  { value: 'Niaga', label: 'Niaga (Komersial)' },
  { value: 'Instansi Pemerintah', label: 'Instansi Pemerintah' },
  { value: 'Khusus', label: 'Khusus' },
];

export default function TariffsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<KelompokForm>(defaultForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Query untuk baca data — cache-first + refetch on demand (via refresh button)
  const { data, loading, error, refetch } = useQuery(GET_ALL_KELOMPOK_PELANGGAN);

  // ─── Mutations: sinkronisasi list lewat cache (tanpa refetchQueries) ───

  // Tanpa refetchQueries: query yang sama sedang aktif di useQuery (cache-and-network) +
  // BatchHttpLink sering membatalkan fetch refetch → "signal is aborted without reason"
  // meski mutasi di server sudah sukses. Sinkronisasi UI lewat cache.update saja.
  const [createKelompok] = useMutation(CREATE_KELOMPOK_PELANGGAN, {
    update(cache, res, { variables }) {
      const created = (res.data as { createKelompokPelanggan?: Record<string, unknown> } | undefined)
        ?.createKelompokPelanggan;
      if (!created) return;
      const existing = cache.readQuery<{ getAllKelompokPelanggan: Record<string, unknown>[] }>({
        query: GET_ALL_KELOMPOK_PELANGGAN,
      });
      const list = existing?.getAllKelompokPelanggan ?? [];
      const deskripsi = (variables?.input as { Deskripsi?: string } | undefined)?.Deskripsi ?? '';
      cache.writeQuery({
        query: GET_ALL_KELOMPOK_PELANGGAN,
        data: {
          getAllKelompokPelanggan: [...list, { ...created, Deskripsi: deskripsi }],
        },
      });
    },
    onCompleted: () => {
      showSnack('Kelompok tarif berhasil ditambahkan');
      setOpenDialog(false);
    },
    onError: (err) => {
      setFormError(err.message || 'Operasi gagal. Coba lagi.');
    },
  });

  const [updateKelompok] = useMutation(UPDATE_KELOMPOK_PELANGGAN, {
    update(cache, res) {
      const updated = (res.data as { updateKelompokPelanggan?: Record<string, unknown> } | undefined)
        ?.updateKelompokPelanggan;
      if (!updated) return;
      const existing = cache.readQuery<{ getAllKelompokPelanggan: Record<string, unknown>[] }>({
        query: GET_ALL_KELOMPOK_PELANGGAN,
      });
      if (!existing?.getAllKelompokPelanggan) return;
      cache.writeQuery({
        query: GET_ALL_KELOMPOK_PELANGGAN,
        data: {
          getAllKelompokPelanggan: existing.getAllKelompokPelanggan.map((k) =>
            k._id === updated._id ? { ...k, ...updated } : k
          ),
        },
      });
    },
    onCompleted: () => {
      showSnack('Kelompok tarif berhasil diperbarui');
      setOpenDialog(false);
    },
    onError: (err) => {
      setFormError(err.message || 'Operasi gagal. Coba lagi.');
    },
  });

  const [deleteKelompok] = useMutation(DELETE_KELOMPOK_PELANGGAN, {
    update(cache, _, { variables }) {
      const id = variables?.id as string | undefined;
      if (!id) return;
      const existing = cache.readQuery<{ getAllKelompokPelanggan: Record<string, unknown>[] }>({
        query: GET_ALL_KELOMPOK_PELANGGAN,
      });
      if (!existing?.getAllKelompokPelanggan) return;
      cache.writeQuery({
        query: GET_ALL_KELOMPOK_PELANGGAN,
        data: {
          getAllKelompokPelanggan: existing.getAllKelompokPelanggan.filter((k) => k._id !== id),
        },
      });
    },
    onCompleted: () => {
      showSnack('Kelompok tarif berhasil dihapus');
      setOpenDeleteDialog(false);
      setSelectedId(null);
      setSelectedItem(null);
    },
    onError: (err) => {
      showSnack(err.message || 'Gagal menghapus. Coba lagi.', 'error');
    },
  });

  // ─── Helper ────────────────────────────────────────────────────────────────

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnack = () => setSnackbar(s => ({ ...s, open: false }));

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setForm(defaultForm);
    setFormError('');
    setEditMode(false);
    setSelectedId(null);
    setOpenDialog(true);
  }, []);

  const handleOpenEdit = useCallback((k: any) => {
    setForm({
      KodeKelompok: k.KodeKelompok || '',
      NamaKelompok: k.NamaKelompok || '',
      Kategori: k.Kategori || 'Non Niaga',
      Deskripsi: k.Deskripsi || '',
      BatasRendah: k.BatasRendah != null ? String(k.BatasRendah) : '',
      TarifRendah: String(k.TarifRendah ?? ''),
      TarifTinggi: String(k.TarifTinggi ?? ''),
      BiayaBeban: String(k.BiayaBeban ?? ''),
      IsKesepakatan: k.IsKesepakatan ?? false,
    });
    setFormError('');
    setEditMode(true);
    setSelectedId(k._id);
    setOpenDialog(true);
  }, []);

  const handleOpenDelete = useCallback((k: any) => {
    setSelectedId(k._id);
    setSelectedItem(k);
    setOpenDeleteDialog(true);
  }, []);

  const validateForm = () => {
    if (!editMode && !form.KodeKelompok.trim()) return 'Kode kelompok wajib diisi';
    if (!form.NamaKelompok.trim()) return 'Nama kelompok wajib diisi';
    if (!form.Kategori.trim()) return 'Kategori wajib diisi';
    const tr = Number(form.TarifRendah);
    const tt = Number(form.TarifTinggi);
    const bb = Number(form.BiayaBeban);
    if (!form.TarifRendah || isNaN(tr) || tr < 0) return 'Tarif di bawah batas harus angka positif';
    if (!form.TarifTinggi || isNaN(tt) || tt < 0) return 'Tarif di atas batas harus angka positif';
    if (!form.BiayaBeban || isNaN(bb) || bb < 0) return 'Biaya beban harus angka positif';
    return '';
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setFormError('');
    setSubmitting(true);

    const input = {
      KodeKelompok: form.KodeKelompok.trim().toUpperCase(),
      NamaKelompok: form.NamaKelompok.trim(),
      Kategori: form.Kategori.trim(),
      Deskripsi: form.Deskripsi.trim(),
      BatasRendah: form.BatasRendah ? Number(form.BatasRendah) : null,
      TarifRendah: Number(form.TarifRendah),
      TarifTinggi: Number(form.TarifTinggi),
      BiayaBeban: Number(form.BiayaBeban),
      IsKesepakatan: form.IsKesepakatan,
    };

    try {
      if (editMode && selectedId) {
        await updateKelompok({ variables: { id: selectedId, input } });
      } else {
        await createKelompok({ variables: { input } });
      }
    } catch (e: any) {
      setFormError(e.message || 'Operasi gagal. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await deleteKelompok({ variables: { id: selectedId } });
    } catch (e: any) {
      showSnack(e.message || 'Gagal menghapus. Coba lagi.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  if (authLoading || !isAuthenticated) return null;

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
        <Alert severity="error" sx={{ mb: 2 }}>
          Gagal memuat data tarif.
        </Alert>
        <Button startIcon={<Refresh />} onClick={() => refetch()}>Coba Lagi</Button>
      </AdminLayout>
    );
  }

  const kelompokList = (data as any)?.getAllKelompokPelanggan || [];
  const minHarga = kelompokList.length > 0
    ? Math.min(...kelompokList.map((k: any) => k.TarifRendah || 0))
    : 0;

  return (
    <AdminLayout title="Struktur Tarif">
      <Box sx={{ mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Struktur Tarif Air</Typography>
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

        <Alert severity="info" sx={{ mb: 3, py: 0.75 }} icon={false}>
          <Typography variant="caption">
            Tarif air menggunakan sistem dua tingkat: di bawah dan di atas batas konsumsi (m³).
            Perubahan tarif akan langsung mempengaruhi perhitungan tagihan berikutnya.
          </Typography>
        </Alert>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard color="primary" icon={<AttachMoney />} title="Total Kelompok" count={kelompokList.length} subtitle="Kelompok terdaftar" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard color="success" icon={<CheckCircle />} title="Kelompok Aktif" count={kelompokList.length} subtitle="Status normal" subtitleColor="success.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard color="info" icon={<TrendingUp />} title="Tarif Terendah (≤Batas)" count={formatRupiah(minHarga)} subtitle="Per meter kubik" />
          </Grid>
        </Grid>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Kode</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Nama Kelompok</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Tarif ≤ Batas</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Tarif &gt; Batas</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="right">Biaya Beban</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kelompokList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Belum ada kelompok tarif. Tambahkan yang pertama.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  kelompokList.map((k: any) => (
                    <TableRow key={k._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                          {k.KodeKelompok ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{k.NamaKelompok}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={k.Kategori ?? '-'}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 22,
                            bgcolor: k.Kategori === 'Sosial' ? 'success.50' : k.Kategori === 'Niaga' ? 'warning.50' : 'grey.100',
                            color: k.Kategori === 'Sosial' ? 'success.dark' : k.Kategori === 'Niaga' ? 'warning.dark' : 'text.secondary',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupiah(k.TarifRendah)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupiah(k.TarifTinggi)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{formatRupiah(k.BiayaBeban)}</Typography></TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(k)} color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton size="small" onClick={() => handleOpenDelete(k)} color="error">
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
        </Card>
      </Box>

      {/* ─── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            {editMode ? 'Edit Kelompok Tarif' : 'Tambah Kelompok Tarif Baru'}
          </Typography>
          <IconButton size="small" onClick={() => !submitting && setOpenDialog(false)} disabled={submitting}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} icon={<Close />}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Kode Kelompok" value={form.KodeKelompok}
                onChange={(e) => setForm(f => ({ ...f, KodeKelompok: e.target.value }))}
                placeholder="Contoh: RT01" disabled={editMode || submitting}
                helperText={editMode ? 'Kode tidak bisa diubah' : 'Contoh: RT01, KOM1'}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth label="Nama Kelompok" value={form.NamaKelompok}
                onChange={(e) => setForm(f => ({ ...f, NamaKelompok: e.target.value }))}
                placeholder="Contoh: Rumah Tangga A" disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Kategori" value={form.Kategori}
                onChange={(e) => setForm(f => ({ ...f, Kategori: e.target.value }))}
                SelectProps={{ native: true }} disabled={submitting}
              >
                {KATEGORI_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Batas m³" type="number" value={form.BatasRendah}
                onChange={(e) => setForm(f => ({ ...f, BatasRendah: e.target.value }))}
                inputProps={{ min: 0 }} disabled={submitting}
                helperText="Batas bawah konsumsi (kosongkan = 10)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Deskripsi" value={form.Deskripsi}
                onChange={(e) => setForm(f => ({ ...f, Deskripsi: e.target.value }))}
                multiline rows={2} placeholder="Deskripsi tambahan (opsional)" disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Tarif ≤ Batas (Rp/m³)" type="number" value={form.TarifRendah}
                onChange={(e) => setForm(f => ({ ...f, TarifRendah: e.target.value }))}
                inputProps={{ min: 0 }} disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Tarif > Batas (Rp/m³)" type="number" value={form.TarifTinggi}
                onChange={(e) => setForm(f => ({ ...f, TarifTinggi: e.target.value }))}
                inputProps={{ min: 0 }} disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Biaya Beban (Rp/bulan)" type="number" value={form.BiayaBeban}
                onChange={(e) => setForm(f => ({ ...f, BiayaBeban: e.target.value }))}
                inputProps={{ min: 0 }} disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting} color="inherit">Batal</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ minWidth: 160 }}>
            {submitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>{editMode ? 'Menyimpan...' : 'Menambahkan...'}</span>
              </Box>
            ) : editMode ? 'Simpan Perubahan' : 'Tambah Kelompok'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Delete sx={{ color: 'error.dark', fontSize: 22 }} />
          </Box>
          Konfirmasi Hapus
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Tindakan ini tidak dapat dibatalkan.</Alert>
          {selectedItem && (
            <Card variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" fontWeight={700}>{selectedItem.NamaKelompok}</Typography>
              <Typography variant="caption" color="text.secondary">
                Kode: {selectedItem.KodeKelompok} &nbsp;·&nbsp; Kategori: {selectedItem.Kategori}
              </Typography>
            </Card>
          )}
          <Typography variant="body2" color="text.secondary">
            Menghapus kelompok tarif dapat mempengaruhi meteran yang terhubung.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting} color="inherit">Batal</Button>
          <Button
            variant="contained" color="error" onClick={handleConfirmDelete}
            disabled={deleting} sx={{ minWidth: 120 }}
          >
            {deleting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Menghapus...</span>
              </Box>
            ) : 'Ya, Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ──────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2 }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnack} variant="filled" sx={{ minWidth: 280, boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}