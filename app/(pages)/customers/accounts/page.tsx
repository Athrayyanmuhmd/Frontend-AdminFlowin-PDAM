// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Pagination,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AccountBalance,
  WaterDrop,
  Speed,
  LocationOn,
  Refresh,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { CustomerAccount } from '../../../types/admin.types';
import { useGetAllMeteran } from '../../../../lib/graphql/hooks/useMeteran';
import { useMemo } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CustomerAccounts() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTariff, setFilterTariff] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ GraphQL Query - Replace REST API
  const { meteran: meteranData, loading, error: graphqlError, refetch } = useGetAllMeteran();

  // Transform GraphQL meteran data to CustomerAccount format
  const accounts = useMemo(() => {
    return meteranData.map((meter: any) => ({
      id: meter._id,
      customerId: meter.idKoneksiData?.idPelanggan?._id || '',
      accountNumber: meter.nomorAkun || '-',
      meterNumber: meter.nomorMeteran || '-',
      connectionType: 'existing' as const,
      serviceStatus: 'active' as const, // Assume active if meter exists
      tariffCategory: meter.idKelompokPelanggan?.namaKelompok || '-',
      installationDate: new Date(meter.createdAt),
      lastReading: new Date(meter.updatedAt),
      currentReading: 0, // Not available in meteran schema
      previousReading: 0,
      consumption: 0,
    }));
  }, [meteranData]);

  // Calculate stats from meteran data
  const stats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(acc => acc.serviceStatus === 'active').length;
    const suspendedAccounts = accounts.filter(acc => acc.serviceStatus === 'suspended').length;
    const avgConsumption = 0; // Not available in current schema

    const accountsByTariff = accounts.reduce((acc, account) => {
      acc[account.tariffCategory] = (acc[account.tariffCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      avgConsumption,
      accountsByTariff
    };
  }, [accounts]);

  const handleRefresh = () => {
    refetch();
  };

  // Handle GraphQL errors
  useEffect(() => {
    if (graphqlError) {
      setError('Gagal memuat data: ' + graphqlError.message);
    }
  }, [graphqlError]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, account: CustomerAccount) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'disconnected': return 'default';
      case 'inactive': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'suspended': return 'Ditangguhkan';
      case 'disconnected': return 'Putus';
      case 'inactive': return 'Tidak Aktif';
      default: return status;
    }
  };

  const getTariffLabel = (tariff: string) => {
    switch (tariff) {
      case '2A2': return 'Rumah Tangga 2A2';
      case '2A3': return 'Rumah Tangga 2A3';
      case 'komersial': return 'Komersial';
      case 'industri': return 'Industri';
      case 'sosial': return 'Sosial';
      default: return tariff;
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.meterNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || account.serviceStatus === filterStatus;
    const matchesTariff = filterTariff === 'all' || account.tariffCategory === filterTariff;

    return matchesSearch && matchesStatus && matchesTariff;
  });

  const renderAccountsTable = () => (
    <Card>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Akun</TableCell>
                  <TableCell>Meteran</TableCell>
                  <TableCell>Tarif</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Konsumsi</TableCell>
                  <TableCell>Pembacaan Terakhir</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {account.accountNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.connectionType === 'new' ? 'Sambungan Baru' :
                           account.connectionType === 'existing' ? 'Sambungan Lama' : 'Transfer'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterDrop color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="body2">
                          {account.meterNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTariffLabel(account.tariffCategory)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(account.serviceStatus)}
                        size="small"
                        color={getStatusColor(account.serviceStatus) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="success" sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {account.consumption} m³
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {account.lastReading ? new Date(account.lastReading).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, account)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filteredAccounts.length / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Card>
  );

  return (
    <AdminLayout title="Akun Pelanggan">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manajemen Akun Pelanggan
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AccountBalance />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.totalAccounts.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Akun
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <WaterDrop />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.activeAccounts.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Akun Aktif
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Speed />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.avgConsumption.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rata-rata Konsumsi (m³)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Assignment />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.suspendedAccounts.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Akun Ditangguhkan
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Semua Akun" />
            <Tab label="Perlu Perhatian" />
            <Tab label="Statistik" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Cari nomor akun atau meteran..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">Semua</MenuItem>
                      <MenuItem value="active">Aktif</MenuItem>
                      <MenuItem value="suspended">Ditangguhkan</MenuItem>
                      <MenuItem value="disconnected">Putus</MenuItem>
                      <MenuItem value="inactive">Tidak Aktif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tarif</InputLabel>
                    <Select
                      value={filterTariff}
                      onChange={(e) => setFilterTariff(e.target.value)}
                      label="Tarif"
                    >
                      <MenuItem value="all">Semua</MenuItem>
                      <MenuItem value="2A2">Rumah Tangga 2A2</MenuItem>
                      <MenuItem value="2A3">Rumah Tangga 2A3</MenuItem>
                      <MenuItem value="komersial">Komersial</MenuItem>
                      <MenuItem value="industri">Industri</MenuItem>
                      <MenuItem value="sosial">Sosial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    sx={{ height: '56px' }}
                    onClick={() => setSuccess('Fitur tambah akun akan segera tersedia')}
                  >
                    Buat Akun
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {renderAccountsTable()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Daftar akun yang memerlukan perhatian khusus
          </Alert>
          {renderAccountsTable()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribusi Tarif
                  </Typography>
                  {Object.entries(stats.accountsByTariff).map(([tariff, count]) => (
                    <Box key={tariff} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{getTariffLabel(tariff)}</Typography>
                      <Typography variant="body2" fontWeight="bold">{count}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          Lihat Detail
        </MenuItem>
        <MenuItem onClick={() => { setSuccess('Fitur edit akan segera tersedia'); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { setSuccess('Fitur suspend akan segera tersedia'); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Tangguhkan
        </MenuItem>
      </Menu>

      {/* Account Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Akun
          {selectedAccount && ` - ${selectedAccount.accountNumber}`}
        </DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Akun
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Nomor Akun:</strong> {selectedAccount.accountNumber}</Typography>
                  <Typography><strong>Nomor Meteran:</strong> {selectedAccount.meterNumber}</Typography>
                  <Typography><strong>Jenis Koneksi:</strong> {selectedAccount.connectionType}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedAccount.serviceStatus)}</Typography>
                  <Typography><strong>Tarif:</strong> {getTariffLabel(selectedAccount.tariffCategory)}</Typography>
                  <Typography><strong>Tanggal Instalasi:</strong> {new Date(selectedAccount.installationDate).toLocaleDateString('id-ID')}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Data Meteran
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Pembacaan Saat Ini:</strong> {selectedAccount.currentReading} m³</Typography>
                  <Typography><strong>Pembacaan Sebelumnya:</strong> {selectedAccount.previousReading} m³</Typography>
                  <Typography><strong>Konsumsi:</strong> {selectedAccount.consumption} m³</Typography>
                  <Typography><strong>Pembacaan Terakhir:</strong> {selectedAccount.lastReading ? new Date(selectedAccount.lastReading).toLocaleDateString('id-ID') : '-'}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained">Edit Akun</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
