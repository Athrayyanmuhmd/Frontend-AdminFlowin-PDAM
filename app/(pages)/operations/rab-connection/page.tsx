'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Pagination,
} from '@mui/material';
import {
  Search,
  Refresh,
  Visibility,
  CheckCircle,
  HourglassEmpty,
  AttachMoney,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_RAB_CONNECTIONS } from '../../../../lib/graphql/queries/rabConnection';

export default function RabConnectionManagement() {
  const router = useRouter();

  // GraphQL Query
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_RAB_CONNECTIONS, {
    fetchPolicy: 'network-only',
  });

  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Handle GraphQL errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      setError('Gagal memuat data RAB: ' + graphqlError.message);
    }
  }, [graphqlError]);

  // Get RAB data from GraphQL response
  const rabData = data?.getAllRABConnections || [];

  // Filter data using useMemo for reactive updates
  const filteredData = useMemo(() => {
    let filtered = [...rabData];

    // Filter by payment status
    if (paymentFilter === 'paid') {
      filtered = filtered.filter((item: any) => item.statusPembayaran === 'Settlement');
    } else if (paymentFilter === 'unpaid') {
      filtered = filtered.filter((item: any) => item.statusPembayaran !== 'Settlement');
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.idKoneksiData?.NIK?.toLowerCase().includes(query) ||
        item.idKoneksiData?.idPelanggan?.namaLengkap?.toLowerCase().includes(query) ||
        item.idKoneksiData?.alamat?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rabData, searchQuery, paymentFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleViewDetail = (id: string) => {
    router.push(`/operations/rab-connection/${id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
              RAB Sambungan
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Rencana Anggaran Biaya sambungan air
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

        {/* Alert */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder='Cari NIK, Nama Pelanggan, atau Alamat...'
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status Pembayaran</InputLabel>
                  <Select
                    value={paymentFilter}
                    label='Status Pembayaran'
                    onChange={(e: SelectChangeEvent) => {
                      setPaymentFilter(e.target.value); setPage(1);
                    }}
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='paid'>Lunas</MenuItem>
                    <MenuItem value='unpaid'>Belum Lunas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant='h6' color='text.secondary'>
                  Tidak ada data RAB
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>NIK / Pelanggan</TableCell>
                        <TableCell>Alamat</TableCell>
                        <TableCell align='right'>Total Biaya</TableCell>
                        <TableCell>Status Pembayaran</TableCell>
                        <TableCell>Tanggal Dibuat</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight='bold'>
                              {item.idKoneksiData?.NIK || 'N/A'}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {item.idKoneksiData?.idPelanggan?.namaLengkap || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {item.idKoneksiData?.alamat || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography
                              variant='body2'
                              fontWeight='bold'
                              color='primary'
                            >
                              {formatCurrency(item.totalBiaya)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.statusPembayaran === 'Settlement' ? (
                              <Chip
                                label='Lunas'
                                color='success'
                                size='small'
                                icon={<CheckCircle />}
                              />
                            ) : (
                              <Chip
                                label='Belum Lunas'
                                color='warning'
                                size='small'
                                icon={<HourglassEmpty />}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString(
                              'id-ID'
                            )}
                          </TableCell>
                          <TableCell align='center'>
                            <Tooltip title='Lihat Detail'>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => handleViewDetail(item._id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
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
