// @ts-nocheck
'use client';

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries/workOrder';
import { UPDATE_WORK_ORDER_STATUS, APPROVE_WORK_ORDER, ASSIGN_WORK_ORDER } from '@/lib/graphql/mutations/workOrder';

const STATUS_LABELS: Record<string, string> = {
  Ditugaskan: 'Ditugaskan',
  SedangDikerjakan: 'Sedang Dikerjakan',
  Selesai: 'Selesai',
  Dibatalkan: 'Dibatalkan',
  Ditunda: 'Ditunda',
  DitinjauAdmin: 'Ditinjau Admin',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  Ditugaskan: 'info',
  SedangDikerjakan: 'primary',
  Selesai: 'success',
  Dibatalkan: 'error',
  Ditunda: 'warning',
  DitinjauAdmin: 'default',
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'Selesai': return <CheckCircle fontSize="small" />;
    case 'SedangDikerjakan': return <Build fontSize="small" />;
    case 'Ditugaskan': return <Schedule fontSize="small" />;
    case 'Dibatalkan': return <ErrorIcon fontSize="small" />;
    default: return <Warning fontSize="small" />;
  }
}

export default function WorkOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
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

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_WORK_ORDER_STATUS, {
    onCompleted: () => {
      refetch();
      setOpenStatusDialog(false);
      setCatatan('');
      showSnackbar('Status work order berhasil diperbarui');
    },
    onError: (err) => showSnackbar('Gagal memperbarui status: ' + err.message, 'error'),
  });

  const [approveWO, { loading: approving }] = useMutation(APPROVE_WORK_ORDER, {
    onCompleted: (data) => {
      refetch();
      setAnchorEl(null);
      const disetujui = data?.approveWorkOrder?.disetujui;
      showSnackbar(disetujui ? 'Work order berhasil disetujui' : 'Work order ditolak');
    },
    onError: (err) => showSnackbar('Gagal memproses approval: ' + err.message, 'error'),
  });

  const allWO: any[] = data?.getAllWorkOrders || [];

  const filtered = allWO.filter((wo) => {
    const matchStatus = filterStatus === 'all' || wo.status === filterStatus;
    const pelanggan = wo.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || '';
    const matchSearch = !searchTerm || pelanggan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Statistik
  const totalWO = allWO.length;
  const ditugaskan = allWO.filter(w => w.status === 'Ditugaskan').length;
  const sedangDikerjakan = allWO.filter(w => w.status === 'SedangDikerjakan').length;
  const selesai = allWO.filter(w => w.status === 'Selesai').length;

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

  const handleOpenStatusUpdate = () => {
    setNewStatus(selectedWO?.status || '');
    setCatatan(selectedWO?.catatan || '');
    setOpenStatusDialog(true);
    handleMenuClose();
  };

  const handleUpdateStatus = () => {
    if (!selectedWO) return;
    updateStatus({
      variables: { id: selectedWO._id, status: newStatus, catatan },
    });
  };

  const handleApprove = (disetujui: boolean) => {
    if (!selectedWO) return;
    approveWO({ variables: { id: selectedWO._id, disetujui, catatan: '' } });
    setSelectedWO(null);
  };

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
                      <TableCell>Tim Teknisi</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Disetujui</TableCell>
                      <TableCell>Catatan</TableCell>
                      <TableCell>Dibuat</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">Tidak ada data work order</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((wo, idx) => (
                      <TableRow key={wo._id} hover>
                        <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {wo.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {wo.tim && wo.tim.length > 0 ? (
                            wo.tim.map((t: any) => (
                              <Chip key={t._id} label={t.namaLengkap} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">Belum ditugaskan</Typography>
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
                        <TableCell align="center">
                          {wo.disetujui === true ? (
                            <Chip label="Disetujui" color="success" size="small" icon={<ThumbUp />} />
                          ) : wo.disetujui === false ? (
                            <Chip label="Ditolak" color="error" size="small" icon={<ThumbDown />} />
                          ) : (
                            <Chip label="Menunggu" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {wo.catatan || '-'}
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
        <MenuItem onClick={handleOpenStatusUpdate}>
          <Build sx={{ mr: 1 }} fontSize="small" /> Update Status
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleApprove(true)} disabled={approving}>
          <ThumbUp sx={{ mr: 1 }} fontSize="small" color="success" /> Setujui
        </MenuItem>
        <MenuItem onClick={() => handleApprove(false)} disabled={approving}>
          <ThumbDown sx={{ mr: 1 }} fontSize="small" color="error" /> Tolak
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
                  {selectedWO.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={STATUS_LABELS[selectedWO.status] || selectedWO.status} color={STATUS_COLORS[selectedWO.status] || 'default'} size="small" sx={{ mb: 1 }} />
                <br />
                <Typography variant="subtitle2" color="text.secondary">Disetujui</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedWO.disetujui === true ? 'Ya' : selectedWO.disetujui === false ? 'Tidak' : 'Belum ditentukan'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Catatan</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{selectedWO.catatan || '-'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">Total Biaya RAB</Typography>
                <Typography variant="body1">
                  {selectedWO.rabId?.totalBiaya
                    ? `Rp ${Number(selectedWO.rabId.totalBiaya).toLocaleString('id-ID')}`
                    : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Tim Teknisi</Typography>
                {selectedWO.tim && selectedWO.tim.length > 0 ? (
                  selectedWO.tim.map((t: any) => (
                    <Box key={t._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">{t.namaLengkap} — {t.email}</Typography>
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

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Status Work Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Status Baru</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Status Baru">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!newStatus || updatingStatus}
          >
            {updatingStatus ? <CircularProgress size={20} /> : 'Simpan'}
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
