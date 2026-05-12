'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  InputAdornment,
  Divider,
  Stack,
  Fade,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Refresh,
  Close,
  Search,
  WaterDrop,
  Category,
  LocalOffer,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
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
  { value: 'Sosial', label: 'Sosial', color: '#4caf50', bg: '#e8f5e9' },
  { value: 'Non Niaga', label: 'Non Niaga (Rumah Tangga)', color: '#2196f3', bg: '#e3f2fd' },
  { value: 'Niaga', label: 'Niaga (Komersial)', color: '#ff9800', bg: '#fff3e0' },
  { value: 'Instansi Pemerintah', label: 'Instansi Pemerintah', color: '#9c27b0', bg: '#f3e5f5' },
  { value: 'Khusus', label: 'Khusus', color: '#f44336', bg: '#ffebee' },
];

const KATEGORI_COLORS: Record<string, string> = {
  'Sosial': '#4caf50',
  'Non Niaga': '#2196f3',
  'Niaga': '#ff9800',
  'Instansi Pemerintah': '#9c27b0',
  'Khusus': '#f44336',
};

// Helper untuk format tanggal Indonesia
const formatTanggal = (date: Date) => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

export default function TariffsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');

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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const refetchListSafe = async () => {
    try { await refetch(); } catch { /* silent */ }
  };

  const [createKelompok] = useMutation(CREATE_KELOMPOK_PELANGGAN, {
    onCompleted: async () => {
      showSnack('Kelompok tarif berhasil ditambahkan');
      setOpenDialog(false);
      await refetchListSafe();
    },
    onError: (err) => setFormError(err.message || 'Operasi gagal. Coba lagi.'),
  });

  const [updateKelompok] = useMutation(UPDATE_KELOMPOK_PELANGGAN, {
    onCompleted: async () => {
      showSnack('Kelompok tarif berhasil diperbarui');
      setOpenDialog(false);
      await refetchListSafe();
    },
    onError: (err) => setFormError(err.message || 'Operasi gagal. Coba lagi.'),
  });

  const [deleteKelompok] = useMutation(DELETE_KELOMPOK_PELANGGAN, {
    onCompleted: async () => {
      showSnack('Kelompok tarif berhasil dihapus');
      setOpenDeleteDialog(false);
      setSelectedId(null);
      setSelectedItem(null);
      await refetchListSafe();
    },
    onError: (err) => showSnack(err.message || 'Gagal menghapus. Coba lagi.', 'error'),
  });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnack = () => setSnackbar(s => ({ ...s, open: false }));

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
      if (editMode && selectedId) await updateKelompok({ variables: { id: selectedId, input } });
      else await createKelompok({ variables: { input } });
    } catch (e: any) { setFormError(e.message || 'Operasi gagal. Coba lagi.'); }
    finally { setSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try { await deleteKelompok({ variables: { id: selectedId } }); }
    catch (e: any) { showSnack(e.message || 'Gagal menghapus. Coba lagi.', 'error'); }
    finally { setDeleting(false); }
  };

  const formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  const kelompokList = (data as any)?.getAllKelompokPelanggan || [];

  // Filter data berdasarkan search dan kategori
  const filteredList = useMemo(() => {
    return kelompokList.filter((k: any) => {
      const matchesSearch = searchQuery === '' ||
        k.KodeKelompok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.NamaKelompok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.Kategori?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesKategori = filterKategori === 'all' || k.Kategori === filterKategori;
      return matchesSearch && matchesKategori;
    });
  }, [kelompokList, searchQuery, filterKategori]);

  // Stats
  const stats = useMemo(() => {
    const totalKelompok = kelompokList.length;
    const minTarif = Math.min(...kelompokList.map((k: any) => k.TarifRendah || 0));
    const maxTarif = Math.max(...kelompokList.map((k: any) => k.TarifRendah || 0));
    const avgTarif = totalKelompok > 0
      ? Math.round(kelompokList.reduce((acc: number, k: any) => acc + (k.TarifRendah || 0), 0) / totalKelompok)
      : 0;
    return { totalKelompok, minTarif, maxTarif, avgTarif };
  }, [kelompokList]);

  if (authLoading || !isAuthenticated) return null;

  if (loading) {
    return (
      <AdminLayout title="Struktur Tarif">
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
          <CircularProgress size={48} />
          <Typography color="text.secondary">Memuat data struktur tarif...</Typography>
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

  const today = new Date();

  return (
    <AdminLayout title="Struktur Tarif">
      <Fade in timeout={400}>
        <Box>
          {/* ─── Header Section ────────────────────────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>Struktur Tarif Air</Typography>
                  <Chip
                    icon={<WaterDrop />}
                    label={`${stats.totalKelompok} Kelompok`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatTanggal(today)} · Pengelolaan tarif dan kelompok pelanggan PDAM Tirta Daroy
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Tooltip title="Segarkan Data">
                  <IconButton onClick={() => refetch()} sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ px: 3 }}>
                  Tambah Tarif
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* ─── Stats Cards ────────────────────────────────────────────── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.25)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Total Kelompok
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {stats.totalKelompok}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Kelompok tarif aktif
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Category sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(56, 142, 60, 0.25)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Tarif Terendah
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {formatRupiah(stats.minTarif)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Per meter kubik
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingDown sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(245, 124, 0, 0.25)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Tarif Tertinggi
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {formatRupiah(stats.maxTarif)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Per meter kubik
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingUp sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(123, 31, 162, 0.25)',
              }}>
                <CardContent sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Rata-rata Tarif
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {formatRupiah(stats.avgTarif)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Per meter kubik
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingUp sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Search & Filter ─────────────────────────────────────────── */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Cari kode, nama, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label="Semua"
                  variant={filterKategori === 'all' ? 'filled' : 'outlined'}
                  color="primary"
                  onClick={() => setFilterKategori('all')}
                  sx={{ minWidth: 70 }}
                />
                {KATEGORI_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.value}
                    variant={filterKategori === opt.value ? 'filled' : 'outlined'}
                    onClick={() => setFilterKategori(opt.value)}
                    sx={{
                      minWidth: 70,
                      bgcolor: filterKategori === opt.value ? opt.color : 'transparent',
                      color: filterKategori === opt.value ? 'white' : opt.color,
                      borderColor: opt.color,
                      '&:hover': { bgcolor: filterKategori === opt.value ? opt.color : opt.bg }
                    }}
                  />
                ))}
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Menampilkan {filteredList.length} dari {kelompokList.length} kelompok
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* ─── Table ───────────────────────────────────────────────────── */}
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5, pl: 3, width: 50 }}>#</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Kode</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Nama Kelompok</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>Kategori</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="right">Tarif ≤ Batas</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="right">Tarif &gt; Batas</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="right">Biaya Beban</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }} align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Box sx={{ mb: 2 }}>
                          <LocalOffer sx={{ fontSize: 64, color: 'grey.300' }} />
                        </Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {kelompokList.length === 0 ? 'Belum Ada Kelompok Tarif' : 'Tidak Ditemukan'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          {kelompokList.length === 0
                            ? 'Tambahkan kelompok tarif pertama untuk memulai'
                            : 'Coba ubah kata kunci pencarian atau filter'}
                        </Typography>
                        {kelompokList.length === 0 && (
                          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
                            Tambah Kelompok Tarif
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredList.map((k: any, index: number) => (
                      <TableRow key={k._id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell sx={{ pl: 3, color: 'text.secondary', fontSize: 13 }}>
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{
                            fontFamily: 'monospace', fontWeight: 700,
                            color: KATEGORI_COLORS[k.Kategori] || 'primary.main',
                            bgcolor: `${KATEGORI_COLORS[k.Kategori] || '#1976d2'}15`,
                            px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block'
                          }}>
                            {k.KodeKelompok ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{k.NamaKelompok}</Typography>
                          {k.Deskripsi && (
                            <Typography variant="caption" color="text.secondary">
                              {k.Deskripsi.length > 40 ? k.Deskripsi.substring(0, 40) + '...' : k.Deskripsi}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={k.Kategori ?? '-'}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              fontWeight: 600,
                              bgcolor: KATEGORI_COLORS[k.Kategori] ? `${KATEGORI_COLORS[k.Kategori]}20` : 'grey.100',
                              color: KATEGORI_COLORS[k.Kategori] || 'text.secondary',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                            {formatRupiah(k.TarifRendah)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">/m³</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                            {formatRupiah(k.TarifTinggi)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">/m³</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatRupiah(k.BiayaBeban)}</Typography>
                          <Typography variant="caption" color="text.secondary">/bulan</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenEdit(k)} sx={{ color: 'primary.main' }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hapus">
                              <IconButton size="small" onClick={() => handleOpenDelete(k)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Box>
      </Fade>

      {/* ─── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: editMode ? 'warning.light' : 'primary.light',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {editMode ? <Edit color="warning" /> : <Add color="primary" />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {editMode ? 'Edit Kelompok Tarif' : 'Tambah Kelompok Tarif Baru'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editMode ? `Mengedit: ${selectedItem?.NamaKelompok}` : 'Formulir penambahan tarif baru'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => !submitting && setOpenDialog(false)} disabled={submitting}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} icon={<Close />}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Kode Kelompok" value={form.KodeKelompok}
                onChange={(e) => setForm(f => ({ ...f, KodeKelompok: e.target.value.toUpperCase() }))}
                placeholder="Contoh: RT01" disabled={editMode || submitting}
                helperText={editMode ? 'Kode tidak bisa diubah' : 'Contoh: RT01, KOM1'}
                InputProps={{ sx: { fontFamily: 'monospace', fontWeight: 600 } }}
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
                helperText="Batas bawah konsumsi (kosongkan = 10 m³)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Deskripsi" value={form.Deskripsi}
                onChange={(e) => setForm(f => ({ ...f, Deskripsi: e.target.value }))}
                multiline rows={2} placeholder="Deskripsi tambahan (opsional)" disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Detail Tarif
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Tarif ≤ Batas" type="number" value={form.TarifRendah}
                onChange={(e) => setForm(f => ({ ...f, TarifRendah: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/m³</InputAdornment>
                }}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Tarif > Batas" type="number" value={form.TarifTinggi}
                onChange={(e) => setForm(f => ({ ...f, TarifTinggi: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/m³</InputAdornment>
                }}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Biaya Beban" type="number" value={form.BiayaBeban}
                onChange={(e) => setForm(f => ({ ...f, BiayaBeban: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/bln</InputAdornment>
                }}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '50%',
            bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Delete sx={{ color: 'error.dark', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Konfirmasi Hapus</Typography>
            <Typography variant="caption" color="text.secondary">
              Tindakan ini tidak dapat dibatalkan
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>Menghapus kelompok tarif dapat mempengaruhi meteran yang terhubung.</Alert>
          {selectedItem && (
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 1,
                  bgcolor: KATEGORI_COLORS[selectedItem.Kategori] || 'grey.300',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white'
                }}>
                  <LocalOffer />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700}>{selectedItem.NamaKelompok}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Kode: {selectedItem.KodeKelompok} · Kategori: {selectedItem.Kategori}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tarif ≤ Batas</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.dark">
                    {formatRupiah(selectedItem.TarifRendah)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tarif &gt; Batas</Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.dark">
                    {formatRupiah(selectedItem.TarifTinggi)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Biaya Beban</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatRupiah(selectedItem.BiayaBeban)}
                  </Typography>
                </Box>
              </Box>
            </Card>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting} color="inherit">Batal</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleting} sx={{ minWidth: 120 }}>
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
        <Alert severity={snackbar.severity} onClose={handleCloseSnack} variant="filled" sx={{ minWidth: 300, boxShadow: 6 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}