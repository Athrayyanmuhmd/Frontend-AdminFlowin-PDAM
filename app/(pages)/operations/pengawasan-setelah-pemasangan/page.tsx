'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, Alert, IconButton,
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { useFilterPersist } from '../../../hooks/useFilterPersist';
import { useDebounce } from '../../../hooks/useDebounce';

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
  revisi: { label: 'Revisi', color: 'warning' },
};

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PengawasanSetelahPemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useFilterPersist('pengawasan-setelah-pemasangan-search', '');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLInputElement>(null);
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
      const res = await getWorkOrdersByJenis(token, 'pengawasan_setelah_pemasangan');
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      const all: any[] = (res.data as any)?.workOrders?.data ?? [];
      setData(all.filter(wo => wo.status === 'dikirim' || wo.status === 'selesai' || wo.status === 'revisi'));
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    const q = debouncedSearch.toLowerCase();
    return data.filter(wo =>
      wo.koneksiData?.pelanggan?.namaLengkap?.toLowerCase().includes(q) ||
      wo.koneksiData?.alamat?.toLowerCase().includes(q) ||
      wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(q)
    );
  }, [data, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title='Data Pengawasan Setelah Pemasangan'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Data Pengawasan Setelah Pemasangan</Typography>
            <Typography variant='body2' color='text.secondary'>
              Work order pengawasan setelah pemasangan yang telah disubmit oleh teknisi
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
              placeholder='Cari nama pelanggan, alamat, teknisi... (tekan / untuk fokus)'
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              inputRef={searchRef}
              InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title='Belum ada data pengawasan setelah pemasangan'
                description={search ? 'Tidak ada hasil yang cocok dengan pencarian Anda' : 'Belum ada work order pengawasan setelah pemasangan yang disubmit oleh teknisi'}
              />
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 600 }}>
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
                          <TableRow key={wo.id} hover onClick={() => router.push(`/operations/pengawasan-setelah-pemasangan/${wo.id}`)} sx={{ cursor: 'pointer' }}>
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
                                <IconButton size='small' color='primary' onClick={() => router.push(`/operations/pengawasan-setelah-pemasangan/${wo.id}`)}>
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
