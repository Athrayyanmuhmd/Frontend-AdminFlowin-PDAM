// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box, Card, CardContent, Typography, Chip, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Tooltip, Pagination,
  CircularProgress, Alert, Snackbar, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider, Paper,
} from '@mui/material';
import {
  Visibility, CheckCircle, Cancel, Build, Schedule, VerifiedUser, Person,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_PEMASANGAN } from '@/lib/graphql/queries/pemasangan';
import { VERIFY_PEMASANGAN } from '@/lib/graphql/mutations/pemasangan';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Menunggu Verifikasi',
  Disetujui: 'Disetujui',
  Ditolak: 'Ditolak',
};

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error'> = {
  Pending: 'warning',
  Disetujui: 'success',
  Ditolak: 'error',
};

export default function PemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [verifyCatatan, setVerifyCatatan] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_PEMASANGAN, { fetchPolicy: 'network-only' });

  const [verifyPemasangan, { loading: verifying }] = useMutation(VERIFY_PEMASANGAN, {
    onCompleted: () => {
      refetch();
      setVerifyOpen(false);
      setVerifyCatatan('');
      setSnackbar({ open: true, message: `Pemasangan berhasil ${verifyStatus === 'Disetujui' ? 'disetujui' : 'ditolak'}`, severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  const allData: any[] = data?.getAllPemasangan || [];
  const filtered = filterStatus === 'all' ? allData : allData.filter(p => p.statusVerifikasi === filterStatus);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalPending = allData.filter(p => p.statusVerifikasi === 'Pending').length;
  const totalDisetujui = allData.filter(p => p.statusVerifikasi === 'Disetujui').length;
  const totalDitolak = allData.filter(p => p.statusVerifikasi === 'Ditolak').length;

  const handleVerify = (item: any, status: string) => {
    setSelectedItem(item);
    setVerifyStatus(status);
    setVerifyCatatan('');
    setVerifyOpen(true);
  };

  const handleConfirmVerify = () => {
    if (!selectedItem) return;
    verifyPemasangan({ variables: { id: selectedItem._id, statusVerifikasi: verifyStatus, catatan: verifyCatatan || undefined } });
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Pemasangan Meter">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
          Pemasangan Meter
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat data: {error.message}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Menunggu Verifikasi', value: totalPending, color: 'warning.main', icon: <Schedule /> },
            { label: 'Disetujui', value: totalDisetujui, color: 'success.main', icon: <CheckCircle /> },
            { label: 'Ditolak', value: totalDitolak, color: 'error.main', icon: <Cancel /> },
          ].map((s) => (
            <Grid item xs={12} md={4} key={s.label}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: s.color }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filter */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status Verifikasi</InputLabel>
                <Select value={filterStatus} label="Status Verifikasi" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="all">Semua</MenuItem>
                  <MenuItem value="Pending">Menunggu Verifikasi</MenuItem>
                  <MenuItem value="Disetujui">Disetujui</MenuItem>
                  <MenuItem value="Ditolak">Ditolak</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" onClick={() => refetch()} disabled={loading}>Refresh</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Seri Meteran</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Teknisi</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tanggal Pasang</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada data pemasangan
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((item: any, idx: number) => (
                      <TableRow key={item._id} hover>
                        <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.idKoneksiData?.alamat || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{item.seriMeteran}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.teknisiId?.namaLengkap || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.teknisiId?.divisi || ''}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {item.tanggalPemasangan ? new Date(item.tanggalPemasangan).toLocaleDateString('id-ID') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={STATUS_LABELS[item.statusVerifikasi] || item.statusVerifikasi}
                            color={STATUS_COLORS[item.statusVerifikasi] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Lihat Detail">
                              <IconButton size="small" onClick={() => { setSelectedItem(item); setDetailOpen(true); }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {item.statusVerifikasi === 'Pending' && (
                              <>
                                <Tooltip title="Setujui">
                                  <IconButton size="small" color="success" onClick={() => handleVerify(item, 'Disetujui')}>
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Tolak">
                                  <IconButton size="small" color="error" onClick={() => handleVerify(item, 'Ditolak')}>
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
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
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Menampilkan {paginated.length} dari {filtered.length} pemasangan
                </Typography>
              </Box>
            </>
          )}
        </Card>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build color="primary" />
            Detail Pemasangan Meter
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Pelanggan</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                  {selectedItem.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedItem.idKoneksiData?.idPelanggan?.noHP || ''}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Alamat</Typography>
                <Typography variant="body2">{selectedItem.idKoneksiData?.alamat || '-'}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Seri Meteran</Typography>
                <Typography variant="body1" fontFamily="monospace" fontWeight={600}>{selectedItem.seriMeteran}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Tanggal Pemasangan</Typography>
                <Typography variant="body2">
                  {selectedItem.tanggalPemasangan ? new Date(selectedItem.tanggalPemasangan).toLocaleString('id-ID') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Teknisi</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person fontSize="small" />
                  <Typography variant="body2">{selectedItem.teknisiId?.namaLengkap || '-'} · {selectedItem.teknisiId?.divisi || ''}</Typography>
                </Box>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Status Verifikasi</Typography>
                <Chip
                  label={STATUS_LABELS[selectedItem.statusVerifikasi] || selectedItem.statusVerifikasi}
                  color={STATUS_COLORS[selectedItem.statusVerifikasi] || 'default'}
                  size="small"
                  icon={<VerifiedUser />}
                  sx={{ mt: 0.5 }}
                />

                {selectedItem.diverifikasiOleh && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Diverifikasi oleh</Typography>
                    <Typography variant="body2">{selectedItem.diverifikasiOleh.namaLengkap}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedItem.tanggalVerifikasi ? new Date(selectedItem.tanggalVerifikasi).toLocaleString('id-ID') : ''}
                    </Typography>
                  </>
                )}

                {selectedItem.catatan && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Catatan</Typography>
                    <Typography variant="body2">{selectedItem.catatan}</Typography>
                  </>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Foto Pemasangan</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {['fotoRumah', 'fotoMeteran', 'fotoMeteranDanRumah'].map((key) =>
                    selectedItem[key] ? (
                      <Box key={key}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          {key === 'fotoRumah' ? 'Foto Rumah' : key === 'fotoMeteran' ? 'Foto Meteran' : 'Foto Rumah & Meteran'}
                        </Typography>
                        <Box
                          component="img"
                          src={selectedItem[key]}
                          alt={key}
                          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                          onClick={() => window.open(selectedItem[key], '_blank')}
                        />
                      </Box>
                    ) : null
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedItem?.statusVerifikasi === 'Pending' && (
            <>
              <Button color="success" variant="outlined" startIcon={<CheckCircle />} onClick={() => { setDetailOpen(false); handleVerify(selectedItem, 'Disetujui'); }}>
                Setujui
              </Button>
              <Button color="error" variant="outlined" startIcon={<Cancel />} onClick={() => { setDetailOpen(false); handleVerify(selectedItem, 'Ditolak'); }}>
                Tolak
              </Button>
            </>
          )}
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyOpen} onClose={() => setVerifyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {verifyStatus === 'Disetujui' ? 'Setujui Pemasangan' : 'Tolak Pemasangan'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Seri Meteran</Typography>
              <Typography variant="body2" fontWeight={600} fontFamily="monospace">{selectedItem.seriMeteran}</Typography>
              <Typography variant="caption" color="text.secondary">Pelanggan</Typography>
              <Typography variant="body2">{selectedItem.idKoneksiData?.idPelanggan?.namaLengkap || '-'}</Typography>
            </Paper>
          )}
          <TextField
            fullWidth
            label="Catatan (opsional)"
            multiline
            rows={3}
            value={verifyCatatan}
            onChange={(e) => setVerifyCatatan(e.target.value)}
            placeholder={verifyStatus === 'Ditolak' ? 'Alasan penolakan...' : 'Catatan verifikasi...'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color={verifyStatus === 'Disetujui' ? 'success' : 'error'}
            startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : verifyStatus === 'Disetujui' ? <CheckCircle /> : <Cancel />}
            onClick={handleConfirmVerify}
            disabled={verifying}
          >
            {verifying ? 'Memproses...' : verifyStatus === 'Disetujui' ? 'Setujui' : 'Tolak'}
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
