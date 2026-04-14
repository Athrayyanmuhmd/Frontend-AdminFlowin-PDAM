'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
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
  Divider,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Build,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Person,
  ThumbUp,
  ThumbDown,
  Cancel,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries/workOrder';
import { GET_ALL_TEKNISI } from '@/lib/graphql/queries/technicians';
import { BATALKAN_WORK_ORDER, REVIEW_HASIL } from '@/lib/graphql/mutations/workOrder';

const STATUS_LABELS: Record<string, string> = {
  menunggu_respon: 'Menunggu Respon',
  menunggu_tim: 'Menunggu Tim',
  tim_diajukan: 'Tim Diajukan',
  ditugaskan: 'Ditugaskan',
  sedang_dikerjakan: 'Sedang Dikerjakan',
  dikirim: 'Dikirim',
  revisi: 'Revisi',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  menunggu_respon: 'warning',
  menunggu_tim: 'warning',
  tim_diajukan: 'info',
  ditugaskan: 'info',
  sedang_dikerjakan: 'primary',
  dikirim: 'info',
  revisi: 'warning',
  selesai: 'success',
  dibatalkan: 'error',
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'selesai': return <CheckCircle fontSize="small" />;
    case 'sedang_dikerjakan': return <Build fontSize="small" />;
    case 'ditugaskan': return <Schedule fontSize="small" />;
    case 'dibatalkan': return <ErrorIcon fontSize="small" />;
    default: return <Warning fontSize="small" />;
  }
}

export default function WorkOrderManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const { data, loading, error, refetch } = useQuery(GET_WORK_ORDERS, {
    fetchPolicy: 'network-only',
  });

  const { data: teknisiData } = useQuery(GET_ALL_TEKNISI);

  const [batalkanWO, { loading: cancelling }] = useMutation(BATALKAN_WORK_ORDER, {
    onCompleted: () => {
      refetch();
      setOpenCancelDialog(false);
      setCatatan('');
      showSnackbar('Work order berhasil dibatalkan');
    },
    onError: (err) => showSnackbar('Gagal membatalkan work order: ' + err.message, 'error'),
  });

  const [reviewHasil, { loading: reviewing }] = useMutation(REVIEW_HASIL, {
    onCompleted: () => {
      refetch();
      setAnchorEl(null);
      showSnackbar('Review hasil berhasil disimpan');
    },
    onError: (err) => showSnackbar('Gagal memproses review: ' + err.message, 'error'),
  });

  const allWO: any[] = (data as any)?.workOrders?.data || [];
  const allTeknisi: any[] = (teknisiData as any)?.getAllTeknisi || [];

  const filtered = allWO.filter((wo) => {
    const matchStatus = filterStatus === 'all' || wo.status === filterStatus;
    const pelanggan = wo.koneksiData?.pelanggan?.namaLengkap || '';
    const matchSearch = !searchTerm ||
      pelanggan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Statistik
  const totalWO = allWO.length;
  const ditugaskan = allWO.filter(w => w.status === 'ditugaskan').length;
  const sedangDikerjakan = allWO.filter(w => w.status === 'sedang_dikerjakan').length;
  const selesai = allWO.filter(w => w.status === 'selesai').length;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, wo: any) => {
    setAnchorEl(e.currentTarget);
    setSelectedWO(wo);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenDetail = () => {
    setOpenDetail(true);
    handleMenuClose();
  };

  const handleOpenCancel = () => {
    setCatatan('');
    setOpenCancelDialog(true);
    handleMenuClose();
  };

  const handleCancelWO = () => {
    if (!selectedWO) return;
    batalkanWO({
      variables: { id: selectedWO.id, catatan },
    });
  };

  const handleReview = (disetujui: boolean) => {
    if (!selectedWO) return;
    reviewHasil({
      variables: { input: { workOrderId: selectedWO.id, disetujui, catatan: '' } },
    });
    setSelectedWO(null);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Manajemen Work Order">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
          Manajemen Work Order
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat data: {error.message}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total WO', value: totalWO, color: 'primary.main', icon: <Build /> },
            { label: 'Ditugaskan', value: ditugaskan, color: 'info.main', icon: <Schedule /> },
            { label: 'Dikerjakan', value: sedangDikerjakan, color: 'warning.main', icon: <Build /> },
            { label: 'Selesai', value: selesai, color: 'success.main', icon: <CheckCircle /> },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: s.color }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter & Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Cari nama pelanggan..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} label="Status">
                    <MenuItem value="all">Semua</MenuItem>
                    {Object.keys(STATUS_LABELS).map(s => (
                      <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="outlined" onClick={() => refetch()} disabled={loading}>
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Pelanggan</TableCell>
                      <TableCell>Jenis Pekerjaan</TableCell>
                      <TableCell>Penanggung Jawab</TableCell>
                      <TableCell>Tim Teknisi</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Catatan</TableCell>
                      <TableCell>Dibuat</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">Tidak ada data work order</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((wo, idx) => (
                      <TableRow key={wo.id} hover>
                        <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {wo.koneksiData?.pelanggan?.namaLengkap || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={wo.jenisPekerjaan?.replace(/_/g, ' ') || '-'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {wo.teknisiPenanggungJawab?.namaLengkap || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {wo.tim && wo.tim.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {wo.tim.map((t: any) => (
                                <Chip key={t.id} label={t.namaLengkap} size="small" sx={{ mb: 0.5 }} />
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                              Belum ada tim
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(wo.status)}
                            label={STATUS_LABELS[wo.status] || wo.status}
                            color={STATUS_COLORS[wo.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {wo.catatanReview || wo.catatanTim || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('id-ID') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, wo)}>
                            <MoreVert />
                          </IconButton>
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
            </>
          )}
        </Card>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenDetail}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> Lihat Detail
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleReview(true)} disabled={reviewing}>
          <ThumbUp sx={{ mr: 1 }} fontSize="small" color="success" /> Setujui Hasil
        </MenuItem>
        <MenuItem onClick={() => handleReview(false)} disabled={reviewing}>
          <ThumbDown sx={{ mr: 1 }} fontSize="small" color="error" /> Tolak Hasil
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleOpenCancel}
          disabled={selectedWO?.status === 'dibatalkan' || selectedWO?.status === 'selesai'}
        >
          <Cancel sx={{ mr: 1 }} fontSize="small" color="error" /> Batalkan WO
        </MenuItem>
      </Menu>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Work Order</DialogTitle>
        <DialogContent>
          {selectedWO && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Pelanggan</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedWO.koneksiData?.pelanggan?.namaLengkap || '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Alamat</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedWO.koneksiData?.alamat || '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Jenis Pekerjaan</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedWO.jenisPekerjaan?.replace(/_/g, ' ') || '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={STATUS_LABELS[selectedWO.status] || selectedWO.status} color={STATUS_COLORS[selectedWO.status] || 'default'} size="small" sx={{ mb: 1 }} />
                <br />
                <Typography variant="subtitle2" color="text.secondary">Catatan Review</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{selectedWO.catatanReview || '-'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Catatan Tim</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{selectedWO.catatanTim || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Penanggung Jawab</Typography>
                {selectedWO.teknisiPenanggungJawab ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      {selectedWO.teknisiPenanggungJawab.namaLengkap} — {selectedWO.teknisiPenanggungJawab.divisi}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Belum ditentukan</Typography>
                )}
                <Typography variant="subtitle2" color="text.secondary">Tim Teknisi</Typography>
                {selectedWO.tim && selectedWO.tim.length > 0 ? (
                  selectedWO.tim.map((t: any) => (
                    <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">{t.namaLengkap} — {t.divisi}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Belum ada tim ditugaskan</Typography>
                )}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Dibuat</Typography>
                <Typography variant="body1">
                  {selectedWO.createdAt ? new Date(selectedWO.createdAt).toLocaleString('id-ID') : '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Diperbarui</Typography>
                <Typography variant="body1">
                  {selectedWO.updatedAt ? new Date(selectedWO.updatedAt).toLocaleString('id-ID') : '-'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Work Order Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Batalkan Work Order</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
            Anda akan membatalkan work order ini. Tindakan ini tidak dapat dibatalkan.
          </Alert>
          <TextField
            fullWidth
            label="Catatan / Alasan Pembatalan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            multiline
            rows={3}
            placeholder="Masukkan alasan pembatalan..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelWO}
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={20} /> : 'Batalkan Work Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
