'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery } from '@apollo/client/react';
import {
  Box, Card, CardContent, Typography, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Tooltip, Pagination,
  CircularProgress, Alert, Snackbar, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid, Divider,
} from '@mui/material';
import { Visibility, Build } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_ALL_PEMASANGAN } from '@/lib/graphql/queries/pemasangan';

export default function PemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, loading, error, refetch } = useQuery(GET_ALL_PEMASANGAN, { fetchPolicy: 'network-only' });

  const allData: any[] = (data as any)?.getAllPemasangan || [];
  const totalPages = Math.ceil(allData.length / rowsPerPage);
  const paginated = allData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><Build /></Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{allData.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Pemasangan</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Toolbar */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
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
                      <TableCell sx={{ fontWeight: 700 }}>Alamat</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Seri Meteran</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada data pemasangan
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((item: any, idx: number) => (
                      <TableRow key={item._id} hover>
                        <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.idKoneksiData?.IdPelanggan?.namaLengkap || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {item.idKoneksiData?.Alamat || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{item.seriMeteran || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {item.createdAt ? new Date(Number(item.createdAt)).toLocaleDateString('id-ID') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton size="small" onClick={() => { setSelectedItem(item); setDetailOpen(true); }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                  Menampilkan {paginated.length} dari {allData.length} pemasangan
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
                  {selectedItem.idKoneksiData?.IdPelanggan?.namaLengkap || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedItem.idKoneksiData?.IdPelanggan?.noHP || ''}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Alamat</Typography>
                <Typography variant="body2">{selectedItem.idKoneksiData?.Alamat || '-'}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Seri Meteran</Typography>
                <Typography variant="body1" fontFamily="monospace" fontWeight={600}>{selectedItem.seriMeteran}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Tanggal Dibuat</Typography>
                <Typography variant="body2">
                  {selectedItem.createdAt ? new Date(Number(selectedItem.createdAt)).toLocaleString('id-ID') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedItem.catatan && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">Catatan</Typography>
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
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
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
