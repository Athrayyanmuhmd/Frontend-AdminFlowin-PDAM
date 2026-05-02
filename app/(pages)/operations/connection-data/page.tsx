'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
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
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Pagination,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import { GET_ALL_CONNECTION_DATA } from '@/lib/graphql/queries/connectionData';

// Status from Ahmad's GQL enum
const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'error' | 'warning'; icon: React.ReactElement }> = {
  APPROVED: { label: 'Disetujui', color: 'success', icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak',   color: 'error',   icon: <Cancel /> },
  PENDING:  { label: 'Menunggu',  color: 'warning',  icon: <HourglassEmpty /> },
};

export default function ConnectionDataManagement() {
  const router = useRouter();

  const [searchQuery, setSearchQuery]           = useState('');
  const [statusFilter, setStatusFilter]         = useState<string>('all');
  const [page, setPage]                         = useState(1);
  const rowsPerPage                             = 10;

  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_CONNECTION_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  const connectionData: any[] = (data as any)?.getAllKoneksiData ?? [];

  useEffect(() => {
    if (graphqlError) console.error('GraphQL Error loading connection data:', graphqlError);
  }, [graphqlError]);

  // Client-side filtering — all field names match Ahmad's PascalCase GQL schema
  const filteredData = useMemo(() => {
    let filtered = [...connectionData];

    // Filter by StatusPengajuan enum (PENDING | APPROVED | REJECTED)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item: any) => item.StatusPengajuan === statusFilter);
    }

    // Search: nama, email, NIK, alamat
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.IdPelanggan?.namaLengkap?.toLowerCase().includes(q) ||
        item.IdPelanggan?.email?.toLowerCase().includes(q) ||
        item.NIK?.toLowerCase().includes(q) ||
        item.Alamat?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [connectionData, statusFilter, searchQuery]);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const getStatusInfo = (item: any) =>
    STATUS_LABELS[item.StatusPengajuan] ?? STATUS_LABELS.PENDING;

  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
          <Button variant='contained' startIcon={<Refresh />} onClick={() => refetch()} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: '1 1 280px', minWidth: 200 }}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Cari NIK, Nama, Email, Alamat...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant='h6' color='text.secondary'>
                  Tidak ada data sambungan
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {searchQuery ? 'Coba kata kunci pencarian yang berbeda' : 'Belum ada pengajuan sambungan'}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant='outlined' sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>NIK / No KK</TableCell>
                        <TableCell>Alamat</TableCell>
                        <TableCell>Luas Bangunan</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((item: any) => {
                        const statusInfo = getStatusInfo(item);
                        return (
                          <TableRow key={item._id} hover>
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
                    count={Math.ceil(filteredData.length / rowsPerPage)}
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
