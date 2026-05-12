'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Pagination,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Speed,
  CheckCircle,
  Cancel,
  WaterDrop,
  Refresh,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  useGetAllMeteran,
  useUpdateMeteran,
  useDeleteMeteran,
} from '../../../../lib/graphql/hooks/useMeteran';
import { useGetAllKelompokPelanggan } from '../../../../lib/graphql/hooks/useKelompokPelanggan';

export default function MeteranListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTariff, setFilterTariff] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Action menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMeteran, setSelectedMeteran] = useState<any | null>(null);

  // Edit dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ nomorMeteran: '', nomorAkun: '', idKelompokPelanggan: '', statusAktif: true });
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // GraphQL hooks
  const { meteran: allMeteran, loading, error, refetch } = useGetAllMeteran();
  const { kelompokPelanggan } = useGetAllKelompokPelanggan();
  const { updateMeteran } = useUpdateMeteran();
  const { deleteMeteran } = useDeleteMeteran();

  // Unique tariff options derived from loaded data
  const tariffOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [];
    (allMeteran as any[]).forEach((m: any) => {
      const k = m.IdKelompokPelanggan;
      if (k?._id && !seen.has(k._id)) {
        seen.add(k._id);
        opts.push({ id: k._id, name: k.NamaKelompok });
      }
    });
    return opts;
  }, [allMeteran]);

  // Filter
  const filtered = (allMeteran as any[]).filter((m: any) => {
    const namaLengkap = m.IdKoneksiData?.IdPelanggan?.namaLengkap || '';
    const nomorMeteran = m.NomorMeteran || '';
    const nomorAkun = m.NomorAkun || '';
    const matchSearch = !searchTerm ||
      namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorMeteran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorAkun.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'aktif' && m.statusAktif) ||
      (filterStatus === 'nonaktif' && !m.statusAktif);
    const matchTariff =
      filterTariff === 'all' ||
      m.IdKelompokPelanggan?._id === filterTariff;
    return matchSearch && matchStatus && matchTariff;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Stats
  const totalAktif = (allMeteran as any[]).filter((m: any) => m.statusAktif).length;
  const totalNonaktif = (allMeteran as any[]).length - totalAktif;

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, meteran: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedMeteran(meteran);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetail = () => {
    router.push(`/operations/meteran/${selectedMeteran._id}`);
    handleMenuClose();
  };

  const handleOpenEdit = () => {
    setEditForm({
      nomorMeteran: selectedMeteran.NomorMeteran,
      nomorAkun: selectedMeteran.NomorAkun,
      idKelompokPelanggan: selectedMeteran.IdKelompokPelanggan?._id || '',
      statusAktif: selectedMeteran.statusAktif,
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleConfirmEdit = async () => {
    if (!selectedMeteran) return;
    setEditLoading(true);
    try {
      await updateMeteran({
        variables: {
          id: selectedMeteran._id,
          NomorMeteran: editForm.nomorMeteran,
          NomorAkun: editForm.nomorAkun,
          IdKelompokPelanggan: editForm.idKelompokPelanggan || undefined,
          statusAktif: editForm.statusAktif,
        },
      });
      setSnackbar({ open: true, message: 'Data meteran berhasil diperbarui', severity: 'success' });
      setOpenEditDialog(false);
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal memperbarui meteran', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = () => {
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!selectedMeteran) return;
    setDeleteLoading(true);
    try {
      await deleteMeteran({ variables: { id: selectedMeteran._id } });
      setSnackbar({ open: true, message: 'Meteran berhasil dihapus', severity: 'success' });
      setOpenDeleteDialog(false);
      setSelectedMeteran(null);
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal menghapus meteran', severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (loading) {
    return (
      <AdminLayout title="Manajemen Meteran">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Manajemen Meteran">
        <Alert severity="error" sx={{ mt: 2 }}>
          Gagal memuat data meteran: {error.message}
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Meteran">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Manajemen Meteran
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => refetch()} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><Speed /></Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{(allMeteran as any[]).length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Meteran</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}><CheckCircle /></Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalAktif}</Typography>
                  <Typography variant="body2" color="text.secondary">Meteran Aktif</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}><Cancel /></Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalNonaktif}</Typography>
                  <Typography variant="body2" color="text.secondary">Meteran Nonaktif</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter & Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cari nomor meteran, nomor akun, atau nama pelanggan..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><Search /></InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    label="Status"
                  >
                    <MenuItem value="all">Semua Status</MenuItem>
                    <MenuItem value="aktif">Aktif</MenuItem>
                    <MenuItem value="nonaktif">Nonaktif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kelompok Tarif</InputLabel>
                  <Select
                    value={filterTariff}
                    onChange={(e) => { setFilterTariff(e.target.value); setPage(1); }}
                    label="Kelompok Tarif"
                  >
                    <MenuItem value="all">Semua Tarif</MenuItem>
                    {tariffOptions.map(opt => (
                      <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Menampilkan {filtered.length} dari {(allMeteran as any[]).length} meteran
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nomor Meteran / Akun</TableCell>
                  <TableCell>Pelanggan</TableCell>
                  <TableCell>Kelompok Tarif</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Total pemakaian kumulatif sejak meteran aktif, bukan hanya bulan ini" arrow placement="top">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'default', borderBottom: '1px dashed', borderColor: 'text.secondary' }}>
                        Total Pemakaian (Kumulatif)
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">Belum Terbayar</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((m: any) => (
                  <TableRow key={m._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {m.NomorMeteran}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Akun: {m.NomorAkun}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {m.IdKoneksiData?.IdPelanggan ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {m.IdKoneksiData.IdPelanggan.namaLengkap}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.IdKoneksiData.IdPelanggan.email}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Belum terhubung
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {m.IdKelompokPelanggan?.NamaKelompok || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {(m.totalPemakaian ?? 0).toFixed(2)} m³
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <WaterDrop fontSize="small" color={m.pemakaianBelumTerbayar > 0 ? 'warning' : 'disabled'} />
                        <Typography variant="body2" color={m.pemakaianBelumTerbayar > 0 ? 'warning.main' : 'text.secondary'}>
                          {(m.pemakaianBelumTerbayar ?? 0).toFixed(2)} m³
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.statusAktif ? 'Aktif' : 'Nonaktif'}
                        size="small"
                        color={m.statusAktif ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, m)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchTerm || filterStatus !== 'all' || filterTariff !== 'all'
                          ? 'Tidak ada meteran yang sesuai filter'
                          : 'Belum ada meteran terdaftar'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages || 1}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="small"
            />
          </Box>
        </Card>
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewDetail}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          Lihat Detail
        </MenuItem>
        <MenuItem onClick={handleOpenEdit}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Meteran
        </MenuItem>
        <MenuItem onClick={handleOpenDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Hapus Meteran
        </MenuItem>
      </Menu>

      {/* Dialog: Edit Meteran */}
      <Dialog open={openEditDialog} onClose={() => { if (!editLoading) setOpenEditDialog(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Meteran</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Nomor Meteran"
              value={editForm.nomorMeteran}
              onChange={(e) => setEditForm(f => ({ ...f, nomorMeteran: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Nomor Akun"
              value={editForm.nomorAkun}
              onChange={(e) => setEditForm(f => ({ ...f, nomorAkun: e.target.value }))}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Kelompok Tarif</InputLabel>
              <Select
                value={editForm.idKelompokPelanggan}
                onChange={(e) => setEditForm(f => ({ ...f, idKelompokPelanggan: e.target.value }))}
                label="Kelompok Tarif"
              >
                {(kelompokPelanggan as any[]).map((k: any) => (
                  <MenuItem key={k._id} value={k._id}>
                    {k.NamaKelompok} - {k.KodeKelompok}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.statusAktif ? 'aktif' : 'nonaktif'}
                onChange={(e) => setEditForm(f => ({ ...f, statusAktif: e.target.value === 'aktif' }))}
                label="Status"
              >
                <MenuItem value="aktif">Aktif</MenuItem>
                <MenuItem value="nonaktif">Nonaktif</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={editLoading}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleConfirmEdit}
            disabled={editLoading || !editForm.nomorMeteran || !editForm.nomorAkun}
            startIcon={editLoading ? <CircularProgress size={18} /> : <Edit />}
          >
            {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus */}
      <Dialog open={openDeleteDialog} onClose={() => { if (!deleteLoading) setOpenDeleteDialog(false); }} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Meteran</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Tindakan ini tidak dapat dibatalkan. Meteran yang memiliki tagihan pending tidak dapat dihapus.
          </Alert>
          {selectedMeteran && (
            <Typography>
              Yakin ingin menghapus meteran <strong>{selectedMeteran.NomorMeteran}</strong>
              {selectedMeteran.IdKoneksiData?.IdPelanggan?.namaLengkap
                ? ` milik ${selectedMeteran.IdKoneksiData.IdPelanggan.namaLengkap}`
                : ''}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={18} /> : <Delete />}
          >
            {deleteLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
