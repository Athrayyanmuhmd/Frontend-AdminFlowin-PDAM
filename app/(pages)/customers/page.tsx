'use client';

import React, { useState, useEffect } from 'react';
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
  Badge,
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
  Person,
  Phone,
  Email,
  LocationOn,
  AccountBalance,
  WaterDrop,
  CheckCircle,
  Cancel,
  Warning,
  FilterList,
  Download,
  Upload,
  Refresh,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { User, CustomerAccount } from '../../types/admin.types';
import { Checkbox } from '@mui/material';
import {
  useGetAllCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../../../lib/graphql/hooks/useCustomers';

// Mock data untuk demo
const mockCustomers: User[] = [
  {
    id: '1',
    nik: '1101010101010001',
    name: 'Ahmad Rizki',
    email: 'ahmad.rizki@email.com',
    phone: '081234567890',
    address: 'Jl. Teuku Umar No. 123, Banda Aceh',
    customerType: 'rumah_tangga',
    accountStatus: 'active',
    registrationDate: new Date('2023-01-15'),
    lastLogin: new Date('2024-01-15'),
    location: {
      latitude: 5.5483,
      longitude: 95.3238,
      address: 'Jl. Teuku Umar No. 123, Banda Aceh',
    },
  },
  {
    id: '2',
    nik: '1101010101010002',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@email.com',
    phone: '081234567891',
    address: 'Jl. Cut Nyak Dien No. 456, Banda Aceh',
    customerType: 'komersial',
    accountStatus: 'active',
    registrationDate: new Date('2023-02-20'),
    lastLogin: new Date('2024-01-14'),
    location: {
      latitude: 5.5483,
      longitude: 95.3238,
      address: 'Jl. Cut Nyak Dien No. 456, Banda Aceh',
    },
  },
  {
    id: '3',
    nik: '1101010101010003',
    name: 'PT. Maju Jaya',
    email: 'info@majujaya.com',
    phone: '0651-123456',
    address: 'Jl. Industri No. 789, Banda Aceh',
    customerType: 'industri',
    accountStatus: 'active',
    registrationDate: new Date('2023-03-10'),
    lastLogin: new Date('2024-01-13'),
    location: {
      latitude: 5.5483,
      longitude: 95.3238,
      address: 'Jl. Industri No. 789, Banda Aceh',
    },
  },
];

const mockAccounts: CustomerAccount[] = [
  {
    id: '1',
    customerId: '1',
    accountNumber: 'ACC-001-2024',
    meterNumber: 'MTR-001-2024',
    connectionType: 'existing',
    serviceStatus: 'active',
    tariffCategory: '2A2',
    installationDate: new Date('2023-01-15'),
    lastReading: new Date('2024-01-01'),
    currentReading: 1250,
    previousReading: 1200,
    consumption: 50,
  },
  {
    id: '2',
    customerId: '2',
    accountNumber: 'ACC-002-2024',
    meterNumber: 'MTR-002-2024',
    connectionType: 'new',
    serviceStatus: 'active',
    tariffCategory: 'komersial',
    installationDate: new Date('2023-02-20'),
    lastReading: new Date('2024-01-01'),
    currentReading: 2500,
    previousReading: 2300,
    consumption: 200,
  },
];

export default function CustomerManagement() {
  const router = useRouter();

  // ==================== GraphQL Hooks ====================
  const {
    customers: graphqlCustomers,
    loading: loadingCustomers,
    error: customerError,
    refetch: refetchCustomers,
  } = useGetAllCustomers();

  const { deleteCustomer: deleteCustomerMutation } = useDeleteCustomer();

  // ==================== Local State ====================
  const [accounts, setAccounts] = useState<CustomerAccount[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });

  // Map GraphQL data to component format
  const customers = graphqlCustomers.map((customer: any) => ({
    ...customer,
    id: customer._id,
    name: customer.namaLengkap,
    phone: customer.noHP,
    registrationDate: new Date(customer.createdAt),
  }));

  const loading = loadingCustomers;
  const error = customerError?.message || null;

  const handleAddCustomer = () => {
    router.push('/customers/registration');
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    customer: User
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleViewDetails = () => {
    if (selectedCustomer) {
      router.push(`/customers/detail/${selectedCustomer.id}`);
    }
    handleMenuClose();
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      router.push(`/customers/registration?edit=${selectedCustomer.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteCustomer = async () => {
    if (
      selectedCustomer &&
      window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')
    ) {
      try {
        await deleteCustomerMutation({
          variables: { id: selectedCustomer.id },
        });
        // refetchCustomers will be called automatically by Apollo
        setSnackbar({
          open: true,
          message: 'Pelanggan berhasil dihapus',
          severity: 'success',
        });
        handleMenuClose();
      } catch (error) {
        console.error('Error deleting customer:', error);
        setSnackbar({
          open: true,
          message: 'Gagal menghapus pelanggan',
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleExportData = () => {
    try {
      // Convert data to CSV
      const headers = [
        'NIK',
        'Nama',
        'Email',
        'Telepon',
        'Alamat',
        'Jenis',
        'Status',
        'Tgl Registrasi',
      ];
      const csvData = filteredCustomers.map(customer => [
        customer.nik,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        getCustomerTypeLabel(customer.customerType),
        getStatusLabel(customer.accountStatus),
        customer.registrationDate.toLocaleDateString('id-ID'),
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `data-pelanggan-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: 'Data berhasil di-export',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: 'Gagal export data',
        severity: 'error',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Pilih pelanggan terlebih dahulu',
        severity: 'warning',
      });
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus ${selectedCustomers.length} pelanggan?`
      )
    ) {
      try {
        await Promise.all(
          selectedCustomers.map(id =>
            deleteCustomerMutation({ variables: { id } })
          )
        );
        // refetchCustomers will be called automatically by Apollo
        setSelectedCustomers([]);
        setSnackbar({
          open: true,
          message: 'Pelanggan berhasil dihapus',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error bulk deleting:', error);
        setSnackbar({
          open: true,
          message: 'Gagal menghapus pelanggan',
          severity: 'error',
        });
      }
    }
  };

  const toggleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.nik.includes(searchTerm);

    const matchesType =
      filterType === 'all' || customer.customerType === filterType;
    const matchesStatus =
      filterStatus === 'all' || customer.accountStatus === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'rumah_tangga':
        return 'Rumah Tangga';
      case 'komersial':
        return 'Komersial';
      case 'industri':
        return 'Industri';
      case 'sosial':
        return 'Sosial';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'; // Green for active
      case 'inactive':
        return 'error'; // Red for inactive
      case 'suspended':
        return 'warning'; // Yellow/orange for suspended
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Tidak Aktif';
      case 'suspended':
        return 'Ditangguhkan';
      default:
        return status;
    }
  };

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminLayout title='Manajemen Pelanggan'>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Manajemen Pelanggan'>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 600, mb: 2 }}>
          Sistem Informasi Pelanggan (SIP)
        </Typography>

        {error && (
          <Alert
            severity='warning'
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

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
                    <Typography variant='h4' sx={{ fontWeight: 600 }}>
                      {customers.length.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
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
                    <Typography variant='h4' sx={{ fontWeight: 600 }}>
                      {customers
                        .filter(c => c.accountStatus === 'active')
                        .length.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
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
                    <Typography variant='h4' sx={{ fontWeight: 600 }}>
                      {customers
                        .filter(c => c.customerType === 'rumah_tangga')
                        .length.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
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
                    <Typography variant='h4' sx={{ fontWeight: 600 }}>
                      {customers
                        .filter(c => c.customerType === 'komersial')
                        .length.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Komersial
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder='Cari NIK, Nama, Email, atau Telepon...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Jenis Pelanggan</InputLabel>
                  <Select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    label='Jenis Pelanggan'
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='rumah_tangga'>Rumah Tangga</MenuItem>
                    <MenuItem value='komersial'>Komersial</MenuItem>
                    <MenuItem value='industri'>Industri</MenuItem>
                    <MenuItem value='sosial'>Sosial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    label='Status'
                  >
                    <MenuItem value='all'>Semua</MenuItem>
                    <MenuItem value='active'>Aktif</MenuItem>
                    <MenuItem value='inactive'>Tidak Aktif</MenuItem>
                    <MenuItem value='suspended'>Ditangguhkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant='contained'
                    startIcon={<Add />}
                    onClick={handleAddCustomer}
                  >
                    Tambah
                  </Button>
                  <Tooltip title='Export Data'>
                    <IconButton
                      color='primary'
                      onClick={handleExportData}
                      sx={{ border: 1, borderColor: 'primary.main' }}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Refresh Data'>
                    <IconButton
                      color='primary'
                      onClick={() => refetchCustomers()}
                      sx={{ border: 1, borderColor: 'primary.main' }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>

            {/* Bulk Actions */}
            {selectedCustomers.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant='body2'>
                    <strong>{selectedCustomers.length}</strong> pelanggan
                    dipilih
                  </Typography>
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    startIcon={<Delete />}
                    onClick={handleBulkDelete}
                  >
                    Hapus Terpilih
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      indeterminate={
                        selectedCustomers.length > 0 &&
                        selectedCustomers.length < filteredCustomers.length
                      }
                      checked={
                        filteredCustomers.length > 0 &&
                        selectedCustomers.length === filteredCustomers.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Pelanggan</TableCell>
                  <TableCell>Kontak</TableCell>
                  <TableCell>Jenis</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tanggal Daftar</TableCell>
                  <TableCell align='right'>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCustomers.map(customer => (
                  <TableRow
                    key={customer.id}
                    hover
                    selected={selectedCustomers.includes(customer.id)}
                  >
                    <TableCell padding='checkbox'>
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleSelectCustomer(customer.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {customer.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            variant='subtitle2'
                            sx={{ fontWeight: 600 }}
                          >
                            {customer.name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            NIK: {customer.nik}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant='body2'>
                          <Phone
                            sx={{
                              fontSize: 14,
                              mr: 1,
                              verticalAlign: 'middle',
                            }}
                          />
                          {customer.phone}
                        </Typography>
                        <Typography variant='body2'>
                          <Email
                            sx={{
                              fontSize: 14,
                              mr: 1,
                              verticalAlign: 'middle',
                            }}
                          />
                          {customer.email}
                        </Typography>
                        <Typography variant='body2'>
                          <LocationOn
                            sx={{
                              fontSize: 14,
                              mr: 1,
                              verticalAlign: 'middle',
                            }}
                          />
                          {customer.address}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCustomerTypeLabel(customer.customerType)}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={customer.accountStatus === 'active' ? <CheckCircle /> : <Cancel />}
                        label={getStatusLabel(customer.accountStatus)}
                        size='small'
                        color={getStatusColor(customer.accountStatus) as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {customer.registrationDate.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        onClick={e => handleMenuOpen(e, customer)}
                        size='small'
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
              count={Math.ceil(filteredCustomers.length / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color='primary'
            />
          </Box>
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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Detail Pelanggan
          {selectedCustomer && ` - ${selectedCustomer.name}`}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' gutterBottom>
                  Informasi Pribadi
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography>
                    <strong>Nama:</strong> {selectedCustomer.name}
                  </Typography>
                  <Typography>
                    <strong>NIK:</strong> {selectedCustomer.nik}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {selectedCustomer.email}
                  </Typography>
                  <Typography>
                    <strong>Telepon:</strong> {selectedCustomer.phone}
                  </Typography>
                  <Typography>
                    <strong>Alamat:</strong> {selectedCustomer.address}
                  </Typography>
                  <Typography>
                    <strong>Jenis:</strong>{' '}
                    {getCustomerTypeLabel(selectedCustomer.customerType)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <strong>Status:</strong>
                    <Chip
                      icon={selectedCustomer.accountStatus === 'active' ? <CheckCircle /> : <Cancel />}
                      label={getStatusLabel(selectedCustomer.accountStatus)}
                      size='small'
                      color={getStatusColor(selectedCustomer.accountStatus) as any}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='h6' gutterBottom>
                  Akun Layanan
                </Typography>
                {accounts
                  .filter(acc => acc.customerId === selectedCustomer.id)
                  .map(account => (
                    <Card key={account.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant='subtitle2' gutterBottom>
                          {account.accountNumber}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Meter: {account.meterNumber}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Konsumsi: {account.consumption} m³
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Tarif: {account.tariffCategory}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button
            variant='contained'
            onClick={() => {
              if (selectedCustomer) {
                router.push(
                  `/customers/registration?edit=${selectedCustomer.id}`
                );
              }
            }}
          >
            Edit Pelanggan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
