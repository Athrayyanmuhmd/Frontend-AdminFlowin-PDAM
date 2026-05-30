'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery } from '@apollo/client/react';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries/workOrder';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem, Stack, TableSortLabel,
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

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' }> = {
  menunggu_penugasan: { label: 'Menunggu Penugasan', color: 'warning' },
  ditolak: { label: 'Ditolak Teknisi', color: 'error' },
  sedang_dikerjakan: { label: 'Sedang Dikerjakan', color: 'info' },
  dikirim: { label: 'Dikirim', color: 'primary' },
  revisi: { label: 'Perlu Revisi', color: 'warning' },
  selesai: { label: 'Selesai', color: 'success' },
  dibatalkan: { label: 'Dibatalkan', color: 'error' },
};

const STATUS_RESPON: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  belum_direspon:     { label: 'Belum Direspon',    color: 'default'  },
  diterima:           { label: 'Diterima',           color: 'success'  },
  penolakan_diajukan: { label: 'Penolakan Diajukan', color: 'warning'  },
  penolakan_diterima: { label: 'Penolakan Diterima', color: 'error'    },
  penolakan_ditolak:  { label: 'Penolakan Ditolak',  color: 'warning'  },
};

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PenyelesaianLaporanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [search, setSearch] = useFilterPersist('penyelesaian-laporan-search', '');
  const [filterStatus, setFilterStatus] = useFilterPersist('penyelesaian-laporan-status', '');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { data: queryData, loading, error: queryError, refetch } = useQuery(GET_WORK_ORDERS, {
    variables: { filter: { jenisPekerjaan: 'penyelesaian_laporan' }, pagination: { page: 1, limit: 500 } },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const data: any[] = (queryData as any)?.workOrders?.data ?? [];
  const error = queryError?.message ?? '';

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
      const pelangganName = (wo.koneksiData?.pelanggan?.namaLengkap || wo.pelangganLaporan?.namaLengkap || '').toLowerCase();
      const matchSearch = !debouncedSearch.trim() ||
        pelangganName.includes(q) ||
        wo.koneksiData?.alamat?.toLowerCase().includes(q) ||
        wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(q) ||
        wo.idLaporan?.toLowerCase().includes(q);
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

  // Stats
  const totalProses = data.filter(wo => ['menunggu_penugasan', 'sedang_dikerjakan', 'dikirim'].includes(wo.status)).length;
  const totalSelesai = data.filter(wo => wo.status === 'selesai').length;
  const totalDitolak = data.filter(wo => wo.status === 'ditolak').length;

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title='Penyelesaian Laporan'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Work Order Penyelesaian Laporan</Typography>
            <Typography variant='body2' color='text.secondary'>
              Daftar work order yang dibuat untuk menyelesaikan laporan pelanggan
            </Typography>
          </Box>
          <Button variant='outlined' startIcon={<Refresh />} onClick={() => refetch()} disabled={loading} size='small'>
            Refresh
          </Button>
        </Box>

        {/* Stats */}
        <Stack direction='row' spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }} useFlexGap>
          {[
            { label: 'Sedang Diproses', value: totalProses, color: '#3b82f6' },
            { label: 'Selesai', value: totalSelesai, color: '#22c55e' },
            { label: 'Ditolak', value: totalDitolak, color: '#ef4444' },
          ].map(s => (
            <Card key={s.label} sx={{ flex: '1 1 140px', minWidth: 0, borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant='body2' color='text.secondary'>{s.label}</Typography>
                <Typography variant='h5' fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size='small'
                  sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
                  placeholder='Cari teknisi, pelanggan, ID laporan... (tekan / untuk fokus)'
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
              <TableSkeleton rows={5} cols={8} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title='Belum ada work order penyelesaian laporan'
                description={search || filterStatus ? 'Tidak ada hasil yang cocok dengan filter Anda' : 'Belum ada work order penyelesaian laporan yang tersedia'}
              />
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>No</TableCell>
                        <TableCell sortDirection={sortKey === 'koneksiData.pelanggan.namaLengkap' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'koneksiData.pelanggan.namaLengkap'} direction={sortKey === 'koneksiData.pelanggan.namaLengkap' ? sortOrder : 'asc'} onClick={() => onSort('koneksiData.pelanggan.namaLengkap')}>
                            Pelanggan / Laporan
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Teknisi PJ</TableCell>
                        <TableCell sortDirection={sortKey === 'status' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'status'} direction={sortKey === 'status' ? sortOrder : 'asc'} onClick={() => onSort('status')}>
                            Status WO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Respon Teknisi</TableCell>
                        <TableCell>Catatan Review</TableCell>
                        <TableCell sortDirection={sortKey === 'updatedAt' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'updatedAt'} direction={sortKey === 'updatedAt' ? sortOrder : 'asc'} onClick={() => onSort('updatedAt')}>
                            Tanggal Update
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((wo, idx) => {
                        const st = STATUS_WO[wo.status];
                        const sr = STATUS_RESPON[wo.statusRespon];
                        return (
                          <TableRow key={wo.id} hover onClick={() => router.push(`/operations/penyelesaian-laporan/${wo.id}`)} sx={{ cursor: 'pointer' }}>
                            <TableCell>{(page - 1) * PER_PAGE + idx + 1}</TableCell>
                            <TableCell>
                              {(() => {
                                const nama = wo.koneksiData?.pelanggan?.namaLengkap || wo.pelangganLaporan?.namaLengkap || null;
                                const alamat = wo.koneksiData?.alamat || null;
                                if (nama) return (
                                  <>
                                    <Typography variant='body2' fontWeight={600}>{nama}</Typography>
                                    {alamat && <Typography variant='caption' color='text.secondary'>{alamat}</Typography>}
                                  </>
                                );
                                return (
                                  <>
                                    <Typography variant='caption' color='text.secondary'>Laporan:</Typography>
                                    <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                      {wo.idLaporan ? `…${wo.idLaporan.slice(-10)}` : '-'}
                                    </Typography>
                                  </>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight={600}>{wo.teknisiPenanggungJawab?.namaLengkap || '-'}</Typography>
                              <Typography variant='caption' color='text.secondary'>{wo.teknisiPenanggungJawab?.divisi || ''}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={st?.label ?? wo.status} color={(st?.color ?? 'default') as any} size='small' />
                            </TableCell>
                            <TableCell>
                              <Chip label={sr?.label ?? wo.statusRespon ?? '-'} color={sr?.color ?? 'default'} size='small' variant='outlined' />
                            </TableCell>
                            <TableCell><Typography variant='caption'>{wo.catatanReview || '-'}</Typography></TableCell>
                            <TableCell>{fmtDate(wo.updatedAt)}</TableCell>
                            <TableCell align='center'>
                              <Tooltip title='Lihat Detail'>
                                <IconButton size='small' color='primary' onClick={() => router.push(`/operations/penyelesaian-laporan/${wo.id}`)}>
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
                <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Menampilkan {paginated.length} dari {filtered.length} work order
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
