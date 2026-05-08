'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem, TableSortLabel,
} from '@mui/material';
import { Search, Visibility, Refresh, FilterAltOff } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useTableSort } from '../../../hooks/useTableSort';
import AdminLayout from '../../../layouts/AdminLayout';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { useFilterPersist } from '../../../hooks/useFilterPersist';
import { useDebounce } from '../../../hooks/useDebounce';

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
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
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
    return data.filter(wo => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !debouncedSearch.trim() ||
        wo.koneksiData?.pelanggan?.namaLengkap?.toLowerCase().includes(q) ||
        wo.koneksiData?.alamat?.toLowerCase().includes(q) ||
        wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || wo.status === filterStatus;
      let matchDate = true;
      if (dateFrom || dateTo) {
        const d = /^\d+$/.test(wo.updatedAt) ? new Date(Number(wo.updatedAt)) : new Date(wo.updatedAt);
        if (dateFrom) matchDate = matchDate && d >= dateFrom;
        if (dateTo) {
          const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
          matchDate = matchDate && d <= end;
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [data, debouncedSearch, filterStatus, dateFrom, dateTo]);

  const { sorted, sortKey, sortOrder, handleSort } = useTableSort(filtered);
  const onSort = (key: string) => { handleSort(key); setPage(1); };
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size='small'
                  sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
                  placeholder='Cari nama pelanggan, alamat, teknisi... (tekan / untuk fokus)'
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  inputRef={searchRef}
                  InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
                />
                <FormControl size='small' sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                  <InputLabel>Status WO</InputLabel>
                  <Select value={filterStatus} label='Status WO' onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <MenuItem value=''>Semua</MenuItem>
                    {Object.entries(STATUS_WO).map(([val, { label }]) => (
                      <MenuItem key={val} value={val}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <DatePicker
                  label='Dari Tanggal'
                  value={dateFrom}
                  onChange={v => { setDateFrom(v); setPage(1); }}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                />
                <DatePicker
                  label='Sampai Tanggal'
                  value={dateTo}
                  onChange={v => { setDateTo(v); setPage(1); }}
                  minDate={dateFrom ?? undefined}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                />
                {(dateFrom || dateTo) && (
                  <Tooltip title='Reset filter tanggal'>
                    <IconButton size='small' onClick={() => { setDateFrom(null); setDateTo(null); setPage(1); }}>
                      <FilterAltOff fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </LocalizationProvider>
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
                        <TableCell sortDirection={sortKey === 'koneksiData.pelanggan.namaLengkap' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'koneksiData.pelanggan.namaLengkap'} direction={sortKey === 'koneksiData.pelanggan.namaLengkap' ? sortOrder : 'asc'} onClick={() => onSort('koneksiData.pelanggan.namaLengkap')}>
                            Pelanggan / Alamat
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Teknisi</TableCell>
                        <TableCell sortDirection={sortKey === 'status' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'status'} direction={sortKey === 'status' ? sortOrder : 'asc'} onClick={() => onSort('status')}>
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Catatan Review</TableCell>
                        <TableCell sortDirection={sortKey === 'updatedAt' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'updatedAt'} direction={sortKey === 'updatedAt' ? sortOrder : 'asc'} onClick={() => onSort('updatedAt')}>
                            Tanggal Submit
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((wo, idx) => {
                        const s = STATUS_WO[wo.status];
                        return (
                          <TableRow key={wo.id} hover onClick={() => router.push(`/operations/maintenance/${wo.id}`)} sx={{ cursor: 'pointer' }}>
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
