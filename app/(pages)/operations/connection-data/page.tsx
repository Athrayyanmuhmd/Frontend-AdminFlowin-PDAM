// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Grid,
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
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  FilterList,
  Refresh,
  Description,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import { GET_ALL_CONNECTION_DATA } from '@/lib/graphql/queries/connectionData';

// Import interface from service for type compatibility
import type { ConnectionData } from '../../../services/connectionData.service';

export default function ConnectionDataManagement() {
  const router = useRouter();
  const { userRole } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [adminVerifyFilter, setAdminVerifyFilter] = useState<string>('all');
  const [technicianVerifyFilter, setTechnicianVerifyFilter] = useState<string>('all');
  const [procedureFilter, setProcedureFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // ✅ GraphQL Query - Replace REST API
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_CONNECTION_DATA, {
    fetchPolicy: 'network-only',
  });

  const connectionData = data?.getAllKoneksiData || [];

  // Handle errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error loading connection data:', graphqlError);
    }
  }, [graphqlError]);

  // Client-side filtering based on statusVerifikasi
  const filteredData = useMemo(() => {
    let filtered = [...connectionData];

    // Filter by admin verification
    if (adminVerifyFilter === 'verified') {
      filtered = filtered.filter((item: any) => item.statusVerifikasi === true);
    } else if (adminVerifyFilter === 'unverified') {
      filtered = filtered.filter((item: any) => item.statusVerifikasi === false);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.idPelanggan?.namaLengkap?.toLowerCase().includes(query) ||
        item.alamat?.toLowerCase().includes(query) ||
        item.idPelanggan?.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [connectionData, adminVerifyFilter, searchQuery]);

  const error = graphqlError?.message || '';

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, adminVerifyFilter]);

  const getVerificationStatus = (data: any) => {
    if (data.statusVerifikasi === true) {
      return { label: 'Terverifikasi', color: 'success' as const };
    }
    return { label: 'Pending', color: 'warning' as const };
  };

  const handleViewDetail = (id: string) => {
    router.push(`/operations/connection-data/${id}`);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  // Paginated data
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant='h4' gutterBottom>
              Data Sambungan Air
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Kelola data pengajuan sambungan air dari pelanggan
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder='Cari NIK, KK, Nama, Email, Alamat...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Verifikasi Admin</InputLabel>
                  <Select
                    value={adminVerifyFilter}
                    label='Verifikasi Admin'
                    onChange={(e: SelectChangeEvent) =>
                      setAdminVerifyFilter(e.target.value)
                    }
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='verified'>Terverifikasi</MenuItem>
                    <MenuItem value='pending'>Belum Verifikasi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Verifikasi Teknisi</InputLabel>
                  <Select
                    value={technicianVerifyFilter}
                    label='Verifikasi Teknisi'
                    onChange={(e: SelectChangeEvent) =>
                      setTechnicianVerifyFilter(e.target.value)
                    }
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='verified'>Terverifikasi</MenuItem>
                    <MenuItem value='pending'>Belum Verifikasi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={procedureFilter}
                    label='Status'
                    onChange={(e: SelectChangeEvent) =>
                      setProcedureFilter(e.target.value)
                    }
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='done'>Selesai</MenuItem>
                    <MenuItem value='pending'>Proses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                }}
              >
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant='h6' color='text.secondary'>
                  Tidak ada data sambungan
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {searchQuery
                    ? 'Coba kata kunci pencarian yang berbeda'
                    : 'Belum ada pengajuan sambungan'}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>NIK / KK</TableCell>
                        <TableCell>Alamat</TableCell>
                        <TableCell>Luas Bangunan</TableCell>
                        <TableCell>Teknisi Ditugaskan</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map(data => {
                        const status = getVerificationStatus(data);
                        return (
                          <TableRow key={data._id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant='body2' fontWeight='bold'>
                                  {data.idPelanggan?.namaLengkap || 'N/A'}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {data.idPelanggan?.email || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>
                                {data.NIK}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                KK: {data.noKK}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant='body2'
                                noWrap
                                sx={{ maxWidth: 200 }}
                              >
                                {data.alamat}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {data.kelurahan}, {data.kecamatan}
                              </Typography>
                            </TableCell>
                            <TableCell>{data.luasBangunan} m²</TableCell>
                            <TableCell>
                              {data.idPelanggan?.noHP ? (
                                <Box>
                                  <Typography variant='body2' fontWeight='bold'>
                                    {data.idPelanggan.namaLengkap}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {data.idPelanggan.noHP}
                                  </Typography>
                                </Box>
                              ) : (
                                <Chip
                                  label='Belum Ditugaskan'
                                  size='small'
                                  variant='outlined'
                                  color='default'
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size='small'
                                icon={
                                  data.statusVerifikasi ? (
                                    <CheckCircle />
                                  ) : (
                                    <HourglassEmpty />
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Tooltip title='Lihat Detail'>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() => handleViewDetail(data._id)}
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

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(filteredData.length / rowsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color='primary'
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
