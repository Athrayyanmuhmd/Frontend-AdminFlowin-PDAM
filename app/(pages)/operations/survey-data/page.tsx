'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, Alert, IconButton, TableSortLabel, Checkbox,
} from '@mui/material';
import { Search, Visibility, Refresh, FileDownload } from '@mui/icons-material';
import { useTableSort } from '../../../hooks/useTableSort';
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

export default function SurveyDataPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useFilterPersist('survey-data-search', '');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const PER_PAGE = 10;
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getWorkOrdersByJenis(token, 'survei');
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

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchData]);

  // Keyboard shortcut: '/' focuses search
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

  const { sorted, sortKey, sortOrder, handleSort } = useTableSort(filtered);
  const onSort = (key: string) => { handleSort(key); setPage(1); };
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset selection when search/filter changes
  useEffect(() => { setSelectedIds(new Set()); }, [debouncedSearch]);

  const allPageSelected = paginated.length > 0 && paginated.every(wo => selectedIds.has(wo.id));
  const somePageSelected = paginated.some(wo => selectedIds.has(wo.id));

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach(wo => next.delete(wo.id));
      else paginated.forEach(wo => next.add(wo.id));
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const toExport = selectedIds.size > 0 ? sorted.filter(wo => selectedIds.has(wo.id)) : sorted;
    const rows = [
      ['No', 'Pelanggan', 'Alamat', 'Teknisi', 'NIP Teknisi', 'Status', 'Catatan Review', 'Tanggal Submit'],
      ...toExport.map((wo, i) => [
        i + 1,
        wo.koneksiData?.pelanggan?.namaLengkap ?? '-',
        wo.koneksiData?.alamat ?? '-',
        wo.teknisiPenanggungJawab?.namaLengkap ?? '-',
        wo.teknisiPenanggungJawab?.nip ?? '-',
        wo.status ?? '-',
        wo.catatanReview ?? '-',
        fmtDate(wo.updatedAt),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `data-survei-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title='Data Survei'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Data Survei</Typography>
            <Typography variant='body2' color='text.secondary'>
              Work order survei yang telah disubmit oleh teknisi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {selectedIds.size > 0 && (
              <Typography variant='caption' color='text.secondary'>{selectedIds.size} baris dipilih</Typography>
            )}
            <Button variant='outlined' startIcon={<FileDownload />} onClick={exportCSV} disabled={loading || sorted.length === 0} size='small'>
              {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export CSV'}
            </Button>
            <Button variant='outlined' startIcon={<Refresh />} onClick={fetchData} disabled={loading} size='small'>
              Refresh
            </Button>
          </Box>
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
                title='Belum ada data survei'
                description={search ? 'Tidak ada hasil yang cocok dengan pencarian Anda' : 'Belum ada work order survei yang disubmit oleh teknisi'}
              />
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'>
                          <Checkbox
                            indeterminate={somePageSelected && !allPageSelected}
                            checked={allPageSelected}
                            onChange={toggleSelectAll}
                            size='small'
                          />
                        </TableCell>
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
                          <TableRow key={wo.id} hover onClick={() => router.push(`/operations/survey-data/${wo.id}`)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding='checkbox' onClick={e => e.stopPropagation()}>
                              <Checkbox size='small' checked={selectedIds.has(wo.id)} onChange={() => toggleSelect(wo.id)} />
                            </TableCell>
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
                                <IconButton size='small' color='primary' onClick={() => router.push(`/operations/survey-data/${wo.id}`)}>
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
