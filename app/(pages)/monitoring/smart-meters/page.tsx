'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
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
  Tooltip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Speed,
  CheckCircle,
  Error as ErrorIcon,
  Settings,
  Warning,
  WaterDrop,
  LocationOn,
  Visibility,
  DeviceHub,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../layouts/AdminLayout';

const GET_ALL_METERAN_LIST = gql`
  query GetAllMeteranList {
    getAllMeteran {
      _id
      nomorMeteran
      nomorAkun
      statusAktif
      pemakaianBelumTerbayar
      totalPemakaian
      idKelompokPelanggan {
        _id
        namaKelompok
        hargaDiBawah10mKubik
        hargaDiAtas10mKubik
        biayaBeban
      }
      idKoneksiData {
        _id
        alamat
        idPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_METERAN_STATS = gql`
  query GetMeteranStatsForList {
    getDashboardStats {
      totalMeteran
      totalPelanggan
    }
  }
`;

export default function SmartMetersListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const { data, loading, error, refetch } = useQuery(GET_ALL_METERAN_LIST, {
    fetchPolicy: 'network-only',
  });

  const { data: statsData } = useQuery(GET_METERAN_STATS, {
    fetchPolicy: 'cache-first',
  });

  const allMeteran = (data as any)?.getAllMeteran || [];
  const stats = (statsData as any)?.getDashboardStats;

  const totalAktif = allMeteran.filter((m: any) => m.statusAktif).length;
  const totalNonaktif = allMeteran.filter((m: any) => !m.statusAktif).length;
  const totalPemakaian = allMeteran.reduce((sum: number, m: any) => sum + (m.pemakaianBelumTerbayar || 0), 0);

  const filtered = allMeteran.filter((m: any) => {
    const nama = m.idKoneksiData?.idPelanggan?.namaLengkap || '';
    const nomorMeteran = m.nomorMeteran || '';
    const nomorAkun = m.nomorAkun || '';
    const matchSearch =
      !searchTerm ||
      nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorMeteran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorAkun.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'aktif' && m.statusAktif) ||
      (filterStatus === 'nonaktif' && !m.statusAktif);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value);
    setPage(1);
  };

  if (loading) {
    return (
      <AdminLayout title="Smart Meter">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Smart Meter">
        <Alert severity="error" sx={{ mb: 2 }}>
          Gagal memuat data meteran: {error.message}
        </Alert>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>
          Coba Lagi
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Smart Meter">
      <Box sx={{ mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Monitoring Smart Meter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pantau status dan konsumsi semua smart water meter terdaftar
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton onClick={() => refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/monitoring/smart-meters/register')}
            >
              Daftarkan Meteran
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DeviceHub sx={{ color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {allMeteran.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Meteran</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {totalAktif}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Meteran Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {totalNonaktif}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Tidak Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WaterDrop sx={{ color: 'info.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {totalPemakaian.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Pemakaian Belum Bayar (m³)</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter & Search Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Cari nomor meteran, nomor akun, atau nama pelanggan..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => handleFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">Semua Status</MenuItem>
                    <MenuItem value="aktif">Aktif</MenuItem>
                    <MenuItem value="nonaktif">Tidak Aktif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Menampilkan {filtered.length} dari {allMeteran.length} meteran
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Meteran Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nomor Meteran</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nomor Akun</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pelanggan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Alamat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kelompok Tarif</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Pemakaian Belum Bayar</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total Pemakaian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Speed sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography color="text.secondary">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Tidak ada meteran yang cocok dengan filter'
                            : 'Belum ada meteran terdaftar'}
                        </Typography>
                        {!searchTerm && filterStatus === 'all' && (
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => router.push('/monitoring/smart-meters/register')}
                          >
                            Daftarkan Meteran Pertama
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((m: any) => {
                    const pelanggan = m.idKoneksiData?.idPelanggan;
                    const pemakaian = m.pemakaianBelumTerbayar || 0;
                    return (
                      <TableRow key={m._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Speed sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                              {m.nomorMeteran}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {m.nomorAkun}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {pelanggan ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {pelanggan.namaLengkap}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pelanggan.noHP}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.idKoneksiData?.alamat ? (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 14, color: 'text.secondary', mt: 0.3 }} />
                              <Typography variant="body2" sx={{ maxWidth: 160 }} noWrap title={m.idKoneksiData.alamat}>
                                {m.idKoneksiData.alamat}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.idKelompokPelanggan?.namaKelompok || '—'}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: pemakaian > 0 ? 'warning.main' : 'text.secondary' }}>
                              {pemakaian.toFixed(2)} m³
                            </Typography>
                            {pemakaian > 0 && (
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((pemakaian / 20) * 100, 100)}
                                color={pemakaian > 15 ? 'error' : pemakaian > 10 ? 'warning' : 'primary'}
                                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {(m.totalPemakaian || 0).toFixed(2)} m³
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.statusAktif ? 'Aktif' : 'Nonaktif'}
                            color={m.statusAktif ? 'success' : 'default'}
                            size="small"
                            icon={m.statusAktif ? <CheckCircle /> : <ErrorIcon />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/operations/meteran/${m._id}`)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </Card>
      </Box>
    </AdminLayout>
  );
}
