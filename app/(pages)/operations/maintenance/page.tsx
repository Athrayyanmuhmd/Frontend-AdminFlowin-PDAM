'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { useFilterPersist } from '../../../hooks/useFilterPersist';

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' | 'primary' }> = {
  menunggu_penugasan: { label: 'Menunggu Penugasan', color: 'warning' },
  ditolak:            { label: 'Ditolak Teknisi',    color: 'error' },
  sedang_dikerjakan:  { label: 'Sedang Dikerjakan',  color: 'info' },
  dikirim:            { label: 'Dikirim',             color: 'primary' },
  revisi:             { label: 'Perlu Revisi',        color: 'warning' },
  selesai:            { label: 'Selesai',             color: 'success' },
  dibatalkan:         { label: 'Dibatalkan',          color: 'error' },
};

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MaintenancePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useFilterPersist('maintenance-search', '');
  const [filterStatus, setFilterStatus] = useFilterPersist('maintenance-status', '');
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
      const res = await getWorkOrdersByJenis(token, 'maintenance');
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setData((res.data as any)?.workOrders?.data ?? []);
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

  const filtered = useMemo(() => {
    return data.filter(wo => {
      const q = search.toLowerCase();
      const matchSearch = !search.trim() ||
        wo.koneksiData?.pelanggan?.namaLengkap?.toLowerCase().includes(q) ||
        wo.koneksiData?.alamat?.toLowerCase().includes(q) ||
        wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || wo.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title='Data Maintenance'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Data Maintenance</Typography>
            <Typography variant='body2' color='text.secondary'>
              Work order maintenance yang telah disubmit oleh teknisi
            </Typography>
          </Box>
          <Button variant='outlined' startIcon={<Refresh />} onClick={fetchData} disabled={loading} size='small'>
            Refresh
          </Button>
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size='small'
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
                placeholder='Cari nama pelanggan, alamat, teknisi...'
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
              />
              <FormControl size='small' sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <InputLabel>Status WO</InputLabel>
                <Select value={filterStatus} label='Status WO' onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                  <MenuItem value=''>Semua</MenuItem>
                  {Object.entries(STATUS_WO).map(([val, { label }]) => (
                    <MenuItem key={val} value={val}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title='Belum ada data maintenance'
                description={search || filterStatus ? 'Tidak ada hasil yang cocok dengan filter Anda' : 'Belum ada work order maintenance yang disubmit oleh teknisi'}
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
                                <IconButton size='small' color='primary' onClick={() => router.push(`/operations/maintenance/${wo.id}`)}>
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
