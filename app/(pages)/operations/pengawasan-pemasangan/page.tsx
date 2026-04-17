'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Tooltip, Pagination, CircularProgress, Alert, Snackbar,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Divider,
  IconButton, Badge,
} from '@mui/material';
import {
  Search, Visibility, Refresh, ThumbUp, ThumbDown, CheckCircle,
  HourglassEmpty, Cancel, Image as ImageIcon, Build,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_PENGAWASAN_PEMASANGAN } from '@/lib/graphql/queries/pengawasan';
import { REVIEW_PENGAWASAN_PEMASANGAN } from '@/lib/graphql/mutations/pemasangan';

function parseFlexDate(val: string | number | null | undefined): Date | null {
  if (!val) return null;
  const num = typeof val === 'number' ? val : (/^\d+$/.test(String(val)) ? Number(val) : NaN);
  if (!isNaN(num)) return new Date(num);
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}
const fmtDate = (v: string | number | null | undefined) => {
  const d = parseFlexDate(v);
  return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
};
const fmtDateTime = (v: string | number | null | undefined) => {
  const d = parseFlexDate(v);
  return d ? d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
};

const STATUS_LABEL: Record<string, string> = {
  menunggu_review: 'Menunggu Review',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};
const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  menunggu_review: 'warning',
  disetujui: 'success',
  ditolak: 'error',
};

export default function PengawasanPemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, userRole } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewApprove, setReviewApprove] = useState(true);
  const [catatanReview, setCatatanReview] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', ok: true });
  const toast = (msg: string, ok = true) => setSnackbar({ open: true, msg, ok });

  const { data, loading, error, refetch } = useQuery(GET_ALL_PENGAWASAN_PEMASANGAN, {
    fetchPolicy: 'network-only',
  });
  const allData: any[] = (data as any)?.getAllPengawasanPemasangan || [];

  const [reviewMutation, { loading: reviewing }] = useMutation(REVIEW_PENGAWASAN_PEMASANGAN, {
    onCompleted: () => {
      refetch();
      setReviewOpen(false);
      setCatatanReview('');
      toast(reviewApprove ? 'Pengawasan disetujui' : 'Pengawasan ditolak');
    },
    onError: (e) => toast(e.message, false),
  });

  const filtered = allData.filter(item => {
    const name = item.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap || '';
    const seri = item.idPemasangan?.seriMeteran || '';
    const alamat = item.idPemasangan?.idKoneksiData?.Alamat || '';
    return !search || [name, seri, alamat].some(s => s.toLowerCase().includes(search.toLowerCase()));
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    total: allData.length,
    menunggu: allData.filter(d => d.statusAdmin === 'menunggu_review' || !d.statusAdmin).length,
    disetujui: allData.filter(d => d.statusAdmin === 'disetujui').length,
    ditolak: allData.filter(d => d.statusAdmin === 'ditolak').length,
  };

  const openReview = (item: any, approve: boolean) => {
    setSelectedItem(item);
    setReviewApprove(approve);
    setCatatanReview('');
    setReviewOpen(true);
  };

  const handleReview = () => {
    if (!selectedItem) return;
    reviewMutation({ variables: { id: selectedItem._id, disetujui: reviewApprove, catatan: catatanReview || undefined } });
  };

  if (authLoading || !isAuthenticated) return null;
  const isAdmin = userRole === 'admin';

  return (
    <AdminLayout title="Pengawasan Pemasangan">
      <Box sx={{ mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Pengawasan Pemasangan</Typography>
            <Typography variant="body2" color="text.secondary">
              Review hasil pengawasan selama proses pemasangan meteran
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={() => refetch()} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat: {error.message}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total',          value: counts.total,    color: '#1976d2', icon: <Build /> },
            { label: 'Menunggu Review', value: counts.menunggu, color: counts.menunggu > 0 ? '#ed6c02' : '#9e9e9e', icon: <HourglassEmpty /> },
            { label: 'Disetujui',      value: counts.disetujui,color: '#2e7d32', icon: <CheckCircle /> },
            { label: 'Ditolak',        value: counts.ditolak,  color: '#d32f2f', icon: <Cancel /> },
          ].map(s => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderColor: s.label === 'Menunggu Review' && s.value > 0 ? 'warning.main' : 'divider' }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: s.color, width: 36, height: 36, fontSize: 18 }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <TextField fullWidth size="small"
              placeholder="Cari nama pelanggan, seri meteran, alamat..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell width={44} sx={{ fontWeight: 600 }}>No</TableCell>
                      <TableCell width={180} sx={{ fontWeight: 600 }}>Pelanggan</TableCell>
                      <TableCell width={130} sx={{ fontWeight: 600 }}>Seri Meteran</TableCell>
                      <TableCell width={80} sx={{ fontWeight: 600 }} align="center">Foto</TableCell>
                      <TableCell width={130} sx={{ fontWeight: 600 }} align="center">Status Review</TableCell>
                      <TableCell width={90} sx={{ fontWeight: 600 }}>Tanggal</TableCell>
                      <TableCell width={isAdmin ? 130 : 56} sx={{ fontWeight: 600 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">Tidak ada data</Typography>
                        </TableCell>
                      </TableRow>
                    ) : rows.map((item, idx) => {
                      const status = item.statusAdmin || 'menunggu_review';
                      const needsReview = status === 'menunggu_review';
                      const photoCount = item.urlGambar?.length || 0;

                      return (
                        <TableRow key={item._id} hover
                          sx={{
                            bgcolor: needsReview ? 'rgba(255,152,0,0.06)' : undefined,
                            borderLeft: `3px solid ${needsReview ? '#ed6c02' : 'transparent'}`,
                          }}
                        >
                          <TableCell>
                            {needsReview ? (
                              <Tooltip title="Perlu review" arrow>
                                <Badge color="warning" variant="dot">
                                  <Typography variant="body2" fontWeight={600}>{(page - 1) * PER_PAGE + idx + 1}</Typography>
                                </Badge>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">{(page - 1) * PER_PAGE + idx + 1}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {item.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                              {item.idPemasangan?.idKoneksiData?.Alamat || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" noWrap>
                              {item.idPemasangan?.seriMeteran || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {photoCount > 0 ? (
                              <Chip icon={<ImageIcon sx={{ fontSize: '14px !important' }} />}
                                label={`${photoCount} foto`} size="small" color="info" variant="outlined" sx={{ fontSize: 11 }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small"
                              label={STATUS_LABEL[status] || status}
                              color={STATUS_COLOR[status] || 'default'}
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{fmtDate(item.createdAt)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Lihat Detail">
                                <IconButton size="small" onClick={() => { setSelectedItem(item); setDetailOpen(true); }}>
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {isAdmin && status === 'menunggu_review' && (
                                <>
                                  <Tooltip title="Setujui">
                                    <IconButton size="small" color="success" onClick={() => openReview(item, true)}>
                                      <ThumbUp fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Tolak">
                                    <IconButton size="small" color="error" onClick={() => openReview(item, false)}>
                                      <ThumbDown fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" size="small" />
                </Box>
              )}
              <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Menampilkan {rows.length} dari {filtered.length} data
                </Typography>
              </Box>
            </>
          )}
        </Card>
      </Box>

      {/* ─── Detail Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Detail Pengawasan Pemasangan</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Stack spacing={2}>
              {selectedItem.statusAdmin && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">Status Review:</Typography>
                  <Chip size="small"
                    label={STATUS_LABEL[selectedItem.statusAdmin] || selectedItem.statusAdmin}
                    color={STATUS_COLOR[selectedItem.statusAdmin] || 'default'}
                  />
                </Box>
              )}
              {selectedItem.catatanAdmin && (
                <Alert severity={selectedItem.statusAdmin === 'ditolak' ? 'error' : 'info'} sx={{ py: 0.5 }}>
                  <strong>Catatan Admin:</strong> {selectedItem.catatanAdmin}
                </Alert>
              )}
              <Divider />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">Pelanggan</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedItem.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedItem.idPemasangan?.idKoneksiData?.IdPelanggan?.noHP || ''}</Typography>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Alamat</Typography>
                  <Typography variant="body2">{selectedItem.idPemasangan?.idKoneksiData?.Alamat || '—'}</Typography>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Seri Meteran</Typography>
                  <Typography variant="body1" fontFamily="monospace" fontWeight={600}>{selectedItem.idPemasangan?.seriMeteran || '—'}</Typography>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Tanggal</Typography>
                  <Typography variant="body2">{fmtDateTime(selectedItem.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedItem.catatan && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Catatan Teknisi</Typography>
                      <Typography variant="body2">{selectedItem.catatan}</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {selectedItem.urlGambar?.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">Dokumentasi Foto ({selectedItem.urlGambar.length})</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedItem.urlGambar.map((url: string, i: number) => (
                      <Box key={i} sx={{ textAlign: 'center' }}>
                        <Box component="img" src={url} alt={`foto-${i}`}
                          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                          onClick={() => window.open(url, '_blank')} />
                        <Typography variant="caption" color="text.secondary" display="block">Foto {i + 1}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {isAdmin && selectedItem?.statusAdmin === 'menunggu_review' && (
            <>
              <Button variant="contained" color="success" startIcon={<ThumbUp />}
                onClick={() => { setDetailOpen(false); openReview(selectedItem, true); }}>Setujui</Button>
              <Button variant="outlined" color="error" startIcon={<ThumbDown />}
                onClick={() => { setDetailOpen(false); openReview(selectedItem, false); }}>Tolak</Button>
            </>
          )}
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {reviewApprove ? 'Setujui Pengawasan' : 'Tolak Pengawasan'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Stack spacing={2.5} sx={{ pt: 0.5 }}>
              <Alert severity={reviewApprove ? 'success' : 'warning'} sx={{ py: 0.5 }}>
                {reviewApprove
                  ? 'Menyetujui pengawasan pemasangan ini.'
                  : 'Menolak pengawasan — teknisi perlu melakukan perbaikan.'}
              </Alert>
              <Box>
                <Typography variant="caption" color="text.secondary">Pelanggan</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedItem.idPemasangan?.idKoneksiData?.IdPelanggan?.namaLengkap || '—'}</Typography>
              </Box>
              <TextField
                label={reviewApprove ? 'Catatan (opsional)' : 'Alasan Penolakan *'}
                multiline minRows={3} fullWidth size="small"
                value={catatanReview}
                onChange={e => setCatatanReview(e.target.value)}
                required={!reviewApprove}
                error={!reviewApprove && !catatanReview}
                helperText={!reviewApprove && !catatanReview ? 'Catatan wajib diisi saat menolak' : ''}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color={reviewApprove ? 'success' : 'error'}
            onClick={handleReview}
            disabled={reviewing || (!reviewApprove && !catatanReview)}
            startIcon={reviewing ? <CircularProgress size={16} color="inherit" /> : (reviewApprove ? <ThumbUp /> : <ThumbDown />)}
          >
            {reviewing ? 'Menyimpan...' : (reviewApprove ? 'Setujui' : 'Tolak')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.ok ? 'success' : 'error'} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
