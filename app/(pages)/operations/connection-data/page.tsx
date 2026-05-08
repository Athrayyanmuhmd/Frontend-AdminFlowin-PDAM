'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Pagination,
  Alert,
  SelectChangeEvent,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Refresh,
  FileDownload,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import { GET_ALL_CONNECTION_DATA } from '@/lib/graphql/queries/connectionData';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { useFilterPersist } from '../../../hooks/useFilterPersist';
import { useTableSort } from '../../../hooks/useTableSort';
import { useDebounce } from '../../../hooks/useDebounce';

// Status from Ahmad's GQL enum
const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'error' | 'warning'; icon: React.ReactElement }> = {
  APPROVED: { label: 'Disetujui', color: 'success', icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak',   color: 'error',   icon: <Cancel /> },
  PENDING:  { label: 'Menunggu',  color: 'warning',  icon: <HourglassEmpty /> },
};

export default function ConnectionDataManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery]   = useFilterPersist('connection-data-search', '');
  const [statusFilter, setStatusFilter] = useFilterPersist('connection-data-status', 'all');
  const [page, setPage]                 = useState(1);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const rowsPerPage                     = 10;
  const debouncedSearch                 = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_CONNECTION_DATA, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
  });

  const connectionData: any[] = (data as any)?.getAllKoneksiData ?? [];

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => refetch(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, refetch]);

  // Keyboard shortcut: press '/' to focus search
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

  // Client-side filtering — all field names match Ahmad's PascalCase GQL schema
  const filteredData = useMemo(() => {
    let filtered = [...connectionData];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item: any) => item.StatusPengajuan === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.IdPelanggan?.namaLengkap?.toLowerCase().includes(q) ||
        item.IdPelanggan?.email?.toLowerCase().includes(q) ||
        item.NIK?.toLowerCase().includes(q) ||
        item.Alamat?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [connectionData, statusFilter, debouncedSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);
  useEffect(() => { setSelectedIds(new Set()); }, [debouncedSearch, statusFilter]);

  const { sorted: sortedData, sortKey, sortOrder, handleSort } = useTableSort(filteredData);
  const onSort = (key: string) => { handleSort(key); setPage(1); };

  if (authLoading || !isAuthenticated) return null;

  const getStatusInfo = (item: any) =>
    STATUS_LABELS[item.StatusPengajuan] ?? STATUS_LABELS.PENDING;

  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const allPageSelected = paginatedData.length > 0 && paginatedData.every((item: any) => selectedIds.has(item._id));
  const somePageSelected = paginatedData.some((item: any) => selectedIds.has(item._id));

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginatedData.forEach((item: any) => next.delete(item._id));
      else paginatedData.forEach((item: any) => next.add(item._id));
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
    const toExport = selectedIds.size > 0 ? sortedData.filter((item: any) => selectedIds.has(item._id)) : sortedData;
    const rows = [
      ['No', 'Nama Pelanggan', 'Email', 'NIK', 'Alamat', 'Status Pengajuan', 'Tanggal Pengajuan'],
      ...toExport.map((item: any, i: number) => [
        i + 1,
        item.IdPelanggan?.namaLengkap ?? '-',
        item.IdPelanggan?.email ?? '-',
        item.NIK ?? '-',
        item.Alamat ?? '-',
        STATUS_LABELS[item.StatusPengajuan]?.label ?? item.StatusPengajuan ?? '-',
        item.createdAt ? new Date(Number(item.createdAt)).toLocaleDateString('id-ID') : '-',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `data-sambungan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5' gutterBottom>
              Data Sambungan Air
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Kelola data pengajuan sambungan air dari pelanggan
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {selectedIds.size > 0 && (
              <Typography variant='caption' color='text.secondary'>{selectedIds.size} baris dipilih</Typography>
            )}
            <Button variant='outlined' startIcon={<FileDownload />} onClick={exportCSV} disabled={loading || sortedData.length === 0} size='small'>
              {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export CSV'}
            </Button>
            <Button variant='outlined' startIcon={<Refresh />} onClick={() => refetch()} disabled={loading} size='small'>
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: '1 1 280px', minWidth: 200 }}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Cari NIK, Nama, Email, Alamat... (tekan / untuk fokus)'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  inputRef={searchRef}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Search />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: '0 1 220px', minWidth: 160 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status Pengajuan</InputLabel>
                  <Select
                    value={statusFilter}
                    label='Status Pengajuan'
                    onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='PENDING'>Menunggu</MenuItem>
                    <MenuItem value='APPROVED'>Disetujui</MenuItem>
                    <MenuItem value='REJECTED'>Ditolak</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {graphqlError && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {graphqlError.message}
          </Alert>
        )}

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filteredData.length === 0 ? (
              <EmptyState
                title='Tidak ada data sambungan'
                description={searchQuery || statusFilter !== 'all' ? 'Coba ubah filter atau kata kunci pencarian' : 'Belum ada pengajuan sambungan air dari pelanggan'}
              />
            ) : (
              <>
                <TableContainer component={Paper} variant='outlined' sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 700 }}>
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
                        <TableCell sortDirection={sortKey === 'IdPelanggan.namaLengkap' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'IdPelanggan.namaLengkap'} direction={sortKey === 'IdPelanggan.namaLengkap' ? sortOrder : 'asc'} onClick={() => onSort('IdPelanggan.namaLengkap')}>
                            Pelanggan
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>NIK / No KK</TableCell>
                        <TableCell>Alamat</TableCell>
                        <TableCell>Luas Bangunan</TableCell>
                        <TableCell sortDirection={sortKey === 'StatusPengajuan' ? sortOrder : false}>
                          <TableSortLabel active={sortKey === 'StatusPengajuan'} direction={sortKey === 'StatusPengajuan' ? sortOrder : 'asc'} onClick={() => onSort('StatusPengajuan')}>
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((item: any) => {
                        const statusInfo = getStatusInfo(item);
                        return (
                          <TableRow
                            key={item._id}
                            hover
                            onClick={() => router.push(`/operations/connection-data/${item._id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding='checkbox' onClick={e => e.stopPropagation()}>
                              <Checkbox size='small' checked={selectedIds.has(item._id)} onChange={() => toggleSelect(item._id)} />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight='bold'>
                                {item.IdPelanggan?.namaLengkap || 'N/A'}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {item.IdPelanggan?.email || ''}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant='body2'>{item.NIK || '-'}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                KK: {item.NoKK || '-'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>
                                {item.Alamat || '-'}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {[item.Kelurahan, item.Kecamatan].filter(Boolean).join(', ')}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              {item.LuasBangunan != null ? `${item.LuasBangunan} m²` : '-'}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size='small'
                                icon={statusInfo.icon}
                              />
                            </TableCell>

                            <TableCell align='center'>
                              <Tooltip title='Lihat Detail'>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() => router.push(`/operations/connection-data/${item._id}`)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(sortedData.length / rowsPerPage)}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                    color='primary'
                    size='small'
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
