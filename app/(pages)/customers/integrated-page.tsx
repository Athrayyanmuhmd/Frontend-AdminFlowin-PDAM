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
  Paper,
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
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Person,
  Phone,
  Email,
  LocationOn,
  AccountBalance,
  WaterDrop,
  Refresh,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { User, CustomerAccount } from '../../types/admin.types';
import { customerAPI } from '../../utils/API';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    customersByType: {},
    newCustomersThisMonth: 0
  });

  // Load customers from API
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        customerType: filterType !== 'all' ? filterType : undefined,
        accountStatus: filterStatus !== 'all' ? filterStatus : undefined,
      };

      const response = await customerAPI.getAll(params);
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError('Gagal memuat data pelanggan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Load customer statistics
  const loadStats = async () => {
    try {
      const response = await customerAPI.getStats();
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  // Load customer details with accounts
  const loadCustomerDetails = async (customerId: string) => {
    try {
      const response = await customerAPI.getById(customerId);
      return response.data.data;
    } catch (err: any) {
      setError('Gagal memuat detail pelanggan: ' + (err.response?.data?.message || err.message));
      return null;
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, searchTerm, filterType, filterStatus]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    loadCustomers();
    loadStats();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleViewDetails = async () => {
    if (selectedCustomer) {
      const details = await loadCustomerDetails(selectedCustomer.id);
      if (details) {
        setSelectedCustomer(details.customer);
        setAccounts(details.accounts);
        setOpenDialog(true);
      }
    }
    handleMenuClose();
  };

  const handleEditCustomer = () => {
    // Implement edit functionality
    setSuccess('Fitur edit akan segera tersedia');
    handleMenuClose();
  };

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      try {
        await customerAPI.delete(selectedCustomer.id);
        setSuccess('Pelanggan berhasil dihapus');
        loadCustomers();
        loadStats();
      } catch (err: any) {
        setError('Gagal menghapus pelanggan: ' + (err.response?.data?.message || err.message));
      }
    }
    handleMenuClose();
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'rumah_tangga': return 'Rumah Tangga';
      case 'komersial': return 'Komersial';
      case 'industri': return 'Industri';
      case 'sosial': return 'Sosial';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Tidak Aktif';
      case 'suspended': return 'Ditangguhkan';
      default: return status;
    }
  };

  return (
    <AdminLayout title="Manajemen Pelanggan">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Sistem Informasi Pelanggan (SIP)
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
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.totalCustomers.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Pelanggan
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
                    <AccountBalance />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.activeCustomers.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pelanggan Aktif
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
                    <WaterDrop />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.customersByType?.rumah_tangga || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rumah Tangga
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
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Phone />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.customersByType?.komersial || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Komersial
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Cari pelanggan..."
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
                  <InputLabel>Jenis Pelanggan</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Jenis Pelanggan"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="rumah_tangga">Rumah Tangga</MenuItem>
                    <MenuItem value="komersial">Komersial</MenuItem>
                    <MenuItem value="industri">Industri</MenuItem>
                    <MenuItem value="sosial">Sosial</MenuItem>
                  </Select>
                </FormControl>
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
                    <MenuItem value="inactive">Tidak Aktif</MenuItem>
                    <MenuItem value="suspended">Ditangguhkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ height: '56px' }}
                  onClick={() => setSuccess('Fitur tambah pelanggan akan segera tersedia')}
                >
                  Tambah
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Customer Table */}
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
                      <TableCell>Pelanggan</TableCell>
                      <TableCell>Kontak</TableCell>
                      <TableCell>Jenis</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tanggal Daftar</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {customer.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {customer.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                NIK: {customer.nik}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              <Phone sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                              {customer.phone}
                            </Typography>
                            <Typography variant="body2">
                              <Email sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                              {customer.email}
                            </Typography>
                            <Typography variant="body2">
                              <LocationOn sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                              {customer.address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getCustomerTypeLabel(customer.customerType)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(customer.accountStatus)}
                            size="small"
                            color={getStatusColor(customer.accountStatus) as any}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(customer.registrationDate).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, customer)}
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
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </Card>
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
        <MenuItem onClick={handleEditCustomer}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteCustomer} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Hapus
        </MenuItem>
      </Menu>

      {/* Customer Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Pelanggan
          {selectedCustomer && ` - ${selectedCustomer.name}`}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Pribadi
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Nama:</strong> {selectedCustomer.name}</Typography>
                  <Typography><strong>NIK:</strong> {selectedCustomer.nik}</Typography>
                  <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>
                  <Typography><strong>Telepon:</strong> {selectedCustomer.phone}</Typography>
                  <Typography><strong>Alamat:</strong> {selectedCustomer.address}</Typography>
                  <Typography><strong>Jenis:</strong> {getCustomerTypeLabel(selectedCustomer.customerType)}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedCustomer.accountStatus)}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Akun Layanan
                </Typography>
                {accounts.length > 0 ? accounts.map(account => (
                  <Card key={account.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {account.accountNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Meter: {account.meterNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Konsumsi: {account.consumption} m³
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tarif: {account.tariffCategory}
                      </Typography>
                    </CardContent>
                  </Card>
                )) : (
                  <Typography variant="body2" color="text.secondary">
                    Belum ada akun layanan
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained">Edit Pelanggan</Button>
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