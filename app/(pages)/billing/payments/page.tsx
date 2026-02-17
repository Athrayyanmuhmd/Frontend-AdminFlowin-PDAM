'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Pagination,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  CheckCircle,
  Warning,
  Payment,
  Receipt,
  Download,
  Print,
  AttachMoney,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_TAGIHAN_BY_STATUS, GET_ALL_TAGIHAN } from '../../../../lib/graphql/queries/billing';

interface PaymentData {
  id: string;
  billingId: string;
  accountNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: 'success' | 'pending' | 'failed';
  transactionId: string;
  notes?: string;
}

const mockPayments: PaymentData[] = [
  {
    id: '1',
    billingId: 'BILL-001',
    accountNumber: 'ACC-001-2024',
    customerName: 'Ahmad Rizki',
    amount: 125000,
    paymentMethod: 'GoPay',
    paymentDate: new Date('2024-01-15'),
    status: 'success',
    transactionId: 'TRX-20240115-001',
  },
  {
    id: '2',
    billingId: 'BILL-002',
    accountNumber: 'ACC-002-2024',
    customerName: 'Siti Nurhaliza',
    amount: 800000,
    paymentMethod: 'Transfer Bank',
    paymentDate: new Date('2024-01-14'),
    status: 'success',
    transactionId: 'TRX-20240114-002',
  },
  {
    id: '3',
    billingId: 'BILL-003',
    accountNumber: 'ACC-003-2024',
    customerName: 'PT. Maju Jaya',
    amount: 480000,
    paymentMethod: 'Virtual Account',
    paymentDate: new Date('2024-01-13'),
    status: 'pending',
    transactionId: 'TRX-20240113-003',
  },
];

export default function PaymentsPage() {
  // ==================== GraphQL Query ====================
  // Get all settled/successful payments (statusPembayaran = Settlement)
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_TAGIHAN_BY_STATUS, {
    variables: { status: 'Settlement' },
    fetchPolicy: 'network-only',
  });

  // ==================== Local State ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // ==================== Data Mapping ====================
  // Map GraphQL Tagihan data to PaymentData format
  const payments = useMemo(() => {
    if (!data?.getTagihanByStatus) return [];

    return data.getTagihanByStatus.map((tagihan: any) => ({
      id: tagihan._id,
      billingId: tagihan._id,
      accountNumber: tagihan.idMeteran?.nomorAkun || '-',
      customerName: tagihan.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || '-',
      amount: tagihan.totalBiaya || 0,
      paymentMethod: tagihan.metodePembayaran || '-',
      paymentDate: tagihan.tanggalPembayaran ? new Date(tagihan.tanggalPembayaran) : new Date(),
      status: 'success' as const, // All Settlement = success
      transactionId: `TRX-${tagihan._id.slice(-8)}`,
      notes: tagihan.catatan,
    }));
  }, [data]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: PaymentData) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Berhasil';
      case 'pending': return 'Menunggu';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const successPayments = filteredPayments.filter(p => p.status === 'success');
  const successAmount = successPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // ==================== Error & Loading States ====================
  if (graphqlError) {
    return (
      <AdminLayout title="Manajemen Pembayaran">
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat data pembayaran: {graphqlError.message}
          </Alert>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Coba Lagi
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Pembayaran">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Manajemen Pembayaran
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {filteredPayments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Transaksi
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
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {successAmount.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pembayaran Sukses
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
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {filteredPayments.filter(p => p.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Menunggu Konfirmasi
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
                    <Payment />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Nilai
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Cari transaksi..."
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
                    <MenuItem value="success">Berhasil</MenuItem>
                    <MenuItem value="pending">Menunggu</MenuItem>
                    <MenuItem value="failed">Gagal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Metode Pembayaran</InputLabel>
                  <Select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    label="Metode Pembayaran"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="GoPay">GoPay</MenuItem>
                    <MenuItem value="Transfer Bank">Transfer Bank</MenuItem>
                    <MenuItem value="Virtual Account">Virtual Account</MenuItem>
                    <MenuItem value="QRIS">QRIS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetch()}
                  disabled={loading}
                  sx={{ height: '56px' }}
                  title="Refresh data"
                >
                  Refresh
                </Button>
              </Grid>

              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  sx={{ height: '56px' }}
                >
                  Export
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID Transaksi</TableCell>
                  <TableCell>Pelanggan</TableCell>
                  <TableCell>Jumlah</TableCell>
                  <TableCell>Metode</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {loading ? (
                            <>
                              <CircularProgress size={24} sx={{ mb: 2 }} />
                              <br />
                              Memuat data pembayaran...
                            </>
                          ) : (
                            <>Tidak ada data pembayaran</>
                          )}
                        </Typography>
                        {!loading && payments.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Belum ada pembayaran yang berhasil (Settlement).
                          </Typography>
                        )}
                        {!loading && payments.length > 0 && filteredPayments.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada pembayaran yang sesuai dengan filter Anda.
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {payment.transactionId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.billingId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {payment.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.accountNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>
                      {payment.paymentDate.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(payment.status)}
                        size="small"
                        color={getStatusColor(payment.status) as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, payment)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filteredPayments.length / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
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
        <MenuItem onClick={handleMenuClose}>
          <Receipt sx={{ mr: 1 }} />
          Cetak Bukti
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Download sx={{ mr: 1 }} />
          Download PDF
        </MenuItem>
      </Menu>

      {/* Payment Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Pembayaran</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informasi Transaksi
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>ID Transaksi:</strong> {selectedPayment.transactionId}</Typography>
                  <Typography><strong>ID Tagihan:</strong> {selectedPayment.billingId}</Typography>
                  <Typography><strong>Pelanggan:</strong> {selectedPayment.customerName}</Typography>
                  <Typography><strong>No. Akun:</strong> {selectedPayment.accountNumber}</Typography>
                  <Typography><strong>Jumlah:</strong> Rp {selectedPayment.amount.toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Metode:</strong> {selectedPayment.paymentMethod}</Typography>
                  <Typography><strong>Tanggal:</strong> {selectedPayment.paymentDate.toLocaleString('id-ID')}</Typography>
                  <Typography>
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={getStatusLabel(selectedPayment.status)}
                      size="small"
                      color={getStatusColor(selectedPayment.status) as any}
                    />
                  </Typography>
                  {selectedPayment.notes && (
                    <Typography><strong>Catatan:</strong> {selectedPayment.notes}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained" startIcon={<Print />}>
            Cetak Bukti
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
