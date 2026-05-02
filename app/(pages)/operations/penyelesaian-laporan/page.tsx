'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { getWorkOrdersByJenis } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, Pagination, CircularProgress, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem, Stack,
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

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
  menunggu: { label: 'Menunggu', color: 'default' },
  diterima: { label: 'Diterima', color: 'success' },
  ditolak: { label: 'Ditolak', color: 'error' },
};

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PenyelesaianLaporanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
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
      const res = await getWorkOrdersByJenis(token, 'penyelesaian_laporan');
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setData((res.data as any)?.workOrders?.data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  const filtered = useMemo(() => {
    return data.filter(wo => {
      const matchSearch = !search.trim() ||
        wo.koneksiData?.pelanggan?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
        wo.koneksiData?.alamat?.toLowerCase().includes(search.toLowerCase()) ||
        wo.teknisiPenanggungJawab?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
        wo.idLaporan?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || wo.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
          <Button variant='outlined' startIcon={<Refresh />} onClick={fetchData} disabled={loading} size='small'>
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

        {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size='small'
                sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
                placeholder='Cari teknisi, pelanggan, ID laporan...'
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography color='text.secondary'>Belum ada work order penyelesaian laporan</Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>No</TableCell>
                        <TableCell>ID Laporan</TableCell>
                        <TableCell>Teknisi PJ</TableCell>
                        <TableCell>Status WO</TableCell>
                        <TableCell>Respon Teknisi</TableCell>
                        <TableCell>Catatan Review</TableCell>
                        <TableCell>Tanggal Update</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((wo, idx) => {
                        const st = STATUS_WO[wo.status];
                        const sr = STATUS_RESPON[wo.statusRespon];
                        return (
                          <TableRow key={wo.id} hover>
                            <TableCell>{(page - 1) * PER_PAGE + idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                {wo.idLaporan ? `…${wo.idLaporan.slice(-10)}` : '-'}
                              </Typography>
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
