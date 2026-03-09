'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  MoreVert,
  Visibility,
  AccountBalance,
  WaterDrop,
  Speed,
  Assignment,
  Refresh,
  TrendingUp,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { CustomerAccount } from '../../../types/admin.types';
import { useGetAllMeteran, useUpdateMeteran } from '../../../../lib/graphql/hooks/useMeteran';

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CustomerAccounts() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTariff, setFilterTariff] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { meteran: meteranData, loading, error: graphqlError, refetch } = useGetAllMeteran();
  const { updateMeteran, loading: updateLoading } = useUpdateMeteran();

  // Transform GraphQL meteran data ke CustomerAccount
  const accounts: CustomerAccount[] = useMemo(() => {
    return meteranData.map((meter: any) => ({
      id: meter._id,
      customerId: meter.idKoneksiData?.idPelanggan?._id || '',
      namaLengkap: meter.idKoneksiData?.idPelanggan?.namaLengkap || '-',
      accountNumber: meter.nomorAkun || '-',
      meterNumber: meter.nomorMeteran || '-',
      connectionType: 'existing' as const,
      serviceStatus: meter.statusAktif !== false ? 'active' : 'inactive',
      tariffCategory: meter.idKelompokPelanggan?.namaKelompok || '-',
      installationDate: meter.createdAt ? new Date(meter.createdAt) : new Date(),
      lastReading: meter.updatedAt ? new Date(meter.updatedAt) : undefined,
      currentReading: meter.totalPemakaian || 0,
      previousReading: 0,
      consumption: meter.pemakaianBelumTerbayar || 0,
    }));
  }, [meteranData]);

  // Opsi tarif dinamis dari data real
  const tariffOptions = useMemo(() => {
    return [...new Set(accounts.map(a => a.tariffCategory))].filter(t => t !== '-').sort();
  }, [accounts]);

  // Stats
  const stats = useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(a => a.serviceStatus === 'active').length;
    const inactiveAccounts = accounts.filter(a => a.serviceStatus === 'inactive').length;
    const totalConsumption = accounts.reduce((sum, a) => sum + (a.consumption || 0), 0);
    const avgConsumption = totalAccounts > 0 ? totalConsumption / totalAccounts : 0;
    const accountsByTariff = accounts.reduce((acc: Record<string, number>, a) => {
      if (a.tariffCategory !== '-') acc[a.tariffCategory] = (acc[a.tariffCategory] || 0) + 1;
      return acc;
    }, {});
    return { totalAccounts, activeAccounts, inactiveAccounts, avgConsumption, accountsByTariff };
  }, [accounts]);

  useEffect(() => {
    if (graphqlError) setError('Gagal memuat data: ' + graphqlError.message);
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
    setAnchorEl(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedAccount) return;
    const newStatus = selectedAccount.serviceStatus === 'active' ? false : true;
    try {
      await updateMeteran({ variables: { id: selectedAccount.id, statusAktif: newStatus } });
      setSuccess(newStatus ? 'Akun berhasil diaktifkan' : 'Akun berhasil ditangguhkan');
    } catch (err: any) {
      setError('Gagal mengubah status: ' + err.message);
    }
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

  const filterAccounts = (source: CustomerAccount[]) =>
    source.filter(account => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        account.accountNumber.toLowerCase().includes(q) ||
        account.meterNumber.toLowerCase().includes(q) ||
        account.namaLengkap.toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'all' || account.serviceStatus === filterStatus;
      const matchesTariff = filterTariff === 'all' || account.tariffCategory === filterTariff;
      return matchesSearch && matchesStatus && matchesTariff;
    });

  const allFiltered = filterAccounts(accounts);
  const attentionFiltered = filterAccounts(accounts.filter(a => a.serviceStatus === 'inactive'));

  const renderTable = (source: CustomerAccount[]) => {
    const paginated = source.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (source.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">Tidak ada data akun</Typography>
        </Box>
      );
    }

    return (
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Akun &amp; Pelanggan</TableCell>
                <TableCell>Meteran</TableCell>
                <TableCell>Tarif</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pemakaian Belum Bayar</TableCell>
                <TableCell>Total Pemakaian</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(account => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {account.accountNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.namaLengkap}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WaterDrop color="primary" sx={{ fontSize: 20 }} />
                      <Typography variant="body2">{account.meterNumber}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.tariffCategory}
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
                      <TrendingUp color={account.consumption > 0 ? 'warning' : 'disabled'} sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{account.consumption.toFixed(2)} m³</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(account.currentReading || 0).toFixed(2)} m³</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={e => handleMenuOpen(e, account)} size="small">
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
            count={Math.ceil(source.length / rowsPerPage)}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari nomor akun, meteran, atau nama pelanggan..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
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
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                label="Status"
              >
                <MenuItem value="all">Semua</MenuItem>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="inactive">Tidak Aktif</MenuItem>
                <MenuItem value="suspended">Ditangguhkan</MenuItem>
                <MenuItem value="disconnected">Putus</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tarif</InputLabel>
              <Select
                value={filterTariff}
                onChange={e => { setFilterTariff(e.target.value); setPage(1); }}
                label="Tarif"
              >
                <MenuItem value="all">Semua</MenuItem>
                {tariffOptions.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              sx={{ height: '56px' }}
              onClick={() => router.push('/operations/meteran/create')}
            >
              Buat Akun
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="Akun Pelanggan">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manajemen Akun Pelanggan
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()} disabled={loading}>
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
                    <Typography variant="body2" color="text.secondary">Total Akun</Typography>
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
                    <Typography variant="body2" color="text.secondary">Akun Aktif</Typography>
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
                    <Typography variant="body2" color="text.secondary">Rata-rata Pemakaian (m³)</Typography>
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
                      {stats.inactiveAccounts.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Akun Tidak Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setPage(1); }}>
            <Tab label="Semua Akun" />
            <Tab
              label={`Perlu Perhatian${stats.inactiveAccounts > 0 ? ` (${stats.inactiveAccounts})` : ''}`}
            />
            <Tab label="Statistik Tarif" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderFilters()}
          {renderTable(allFiltered)}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Akun dengan status tidak aktif — meter dinonaktifkan oleh admin
          </Alert>
          {renderFilters()}
          {renderTable(attentionFiltered)}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribusi Tarif
                  </Typography>
                  {Object.entries(stats.accountsByTariff).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Belum ada data</Typography>
                  ) : (
                    Object.entries(stats.accountsByTariff)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tariff, count]) => (
                        <Box
                          key={tariff}
                          sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <Typography variant="body2">{tariff}</Typography>
                          <Typography variant="body2" fontWeight="bold">{count as number} akun</Typography>
                        </Box>
                      ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          Lihat Detail
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedAccount) router.push(`/operations/meteran/${selectedAccount.id}`);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleToggleStatus}
          disabled={updateLoading}
          sx={{ color: selectedAccount?.serviceStatus === 'active' ? 'error.main' : 'success.main' }}
        >
          {selectedAccount?.serviceStatus === 'active' ? (
            <><Block sx={{ mr: 1 }} />Tangguhkan</>
          ) : (
            <><CheckCircle sx={{ mr: 1 }} />Aktifkan</>
          )}
        </MenuItem>
      </Menu>

      {/* Account Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Akun
          {selectedAccount && ` — ${selectedAccount.accountNumber}`}
        </DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Informasi Akun</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Nomor Akun:</strong> {selectedAccount.accountNumber}</Typography>
                  <Typography><strong>Nomor Meteran:</strong> {selectedAccount.meterNumber}</Typography>
                  <Typography><strong>Nama Pelanggan:</strong> {selectedAccount.namaLengkap}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography><strong>Status:</strong></Typography>
                    <Chip
                      label={getStatusLabel(selectedAccount.serviceStatus)}
                      size="small"
                      color={getStatusColor(selectedAccount.serviceStatus) as any}
                    />
                  </Box>
                  <Typography><strong>Tarif:</strong> {selectedAccount.tariffCategory}</Typography>
                  <Typography>
                    <strong>Tanggal Instalasi:</strong>{' '}
                    {new Date(selectedAccount.installationDate).toLocaleDateString('id-ID')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Data Pemakaian</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography>
                    <strong>Pemakaian Belum Terbayar:</strong> {selectedAccount.consumption.toFixed(2)} m³
                  </Typography>
                  <Typography>
                    <strong>Total Pemakaian:</strong> {(selectedAccount.currentReading || 0).toFixed(2)} m³
                  </Typography>
                  <Typography>
                    <strong>Terakhir Diperbarui:</strong>{' '}
                    {selectedAccount.lastReading
                      ? new Date(selectedAccount.lastReading).toLocaleDateString('id-ID')
                      : '-'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          {selectedAccount && (
            <Button
              variant="contained"
              color={selectedAccount.serviceStatus === 'active' ? 'error' : 'success'}
              onClick={() => {
                setOpenDialog(false);
                handleToggleStatus();
              }}
              disabled={updateLoading}
            >
              {selectedAccount.serviceStatus === 'active' ? 'Tangguhkan' : 'Aktifkan'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">{error}</Alert>
      </Snackbar>
    </AdminLayout>
  );
}
