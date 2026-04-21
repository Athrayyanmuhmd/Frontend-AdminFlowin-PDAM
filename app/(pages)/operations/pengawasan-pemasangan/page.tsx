export const dynamic = 'force-dynamic';
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
};

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PengawasanPemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getWorkOrdersByJenis(token, 'pengawasan_pemasangan');
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      const all: any[] = (res.data as any)?.workOrders?.data ?? [];
      setData(all.filter(wo => wo.status === 'dikirim' || wo.status === 'selesai'));
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(wo =>
      wo.koneksiData?.pelanggan?.namaLengkap?.toLowerCase().includes(q) ||
      wo.koneksiData?.alamat?.toLowerCase().includes(q) ||
      wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title='Data Pengawasan Pemasangan'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Data Pengawasan Pemasangan</Typography>
            <Typography variant='body2' color='text.secondary'>
              Work order pengawasan pemasangan yang telah disubmit oleh teknisi
            </Typography>
          </Box>
          <Button variant='outlined' startIcon={<Refresh />} onClick={fetchData} disabled={loading} size='small'>
            Refresh
          </Button>
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <TextField
              fullWidth size='small'
              placeholder='Cari nama pelanggan, alamat, teknisi...'
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography color='text.secondary'>Belum ada data pengawasan pemasangan yang disubmit teknisi</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>No</TableCell>
                        <TableCell>Pelanggan / Alamat</TableCell>
                        <TableCell>Teknisi</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Catatan Review</TableCell>
                        <TableCell>Tanggal Submit</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((wo, idx) => {
                        const s = STATUS_WO[wo.status];
                        return (
                          <TableRow key={wo.id} hover>
                            <TableCell>{(page - 1) * PER_PAGE + idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight={600}>{wo.koneksiData?.alamat || '-'}</Typography>
                              <Typography variant='caption' color='text.secondary'>{wo.koneksiData?.pelanggan?.namaLengkap || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{wo.teknisiPenanggungJawab?.namaLengkap || '-'}</Typography>
                              <Typography variant='caption' color='text.secondary'>{wo.teknisiPenanggungJawab?.nip || ''}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={s?.label ?? wo.status} color={s?.color ?? 'default'} size='small' />
                            </TableCell>
                            <TableCell><Typography variant='caption'>{wo.catatanReview || '-'}</Typography></TableCell>
                            <TableCell>{fmtDate(wo.updatedAt)}</TableCell>
                            <TableCell align='center'>
                              <Tooltip title='Lihat Detail'>
                                <IconButton size='small' color='primary' onClick={() => router.push(`/operations/pengawasan-pemasangan/${wo.id}`)}>
                                  <Visibility fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color='primary' size='small' />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
