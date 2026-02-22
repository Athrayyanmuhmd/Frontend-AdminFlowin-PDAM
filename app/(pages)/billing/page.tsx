// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
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
  LinearProgress,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  Chip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Receipt,
  Payment,
  Warning,
  CheckCircle,
  Schedule,
  Download,
  Print,
  Autorenew,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import { GET_BILLINGS, GET_BILLING_STATS, GET_BILLING_CHART } from '@/lib/graphql/queries/billing';

const UPDATE_STATUS_PEMBAYARAN = gql`
  mutation UpdateStatusPembayaran($id: ID!, $status: EnumPaymentStatus!) {
    updateStatusPembayaran(id: $id, status: $status) {
      _id
      statusPembayaran
      tanggalPembayaran
    }
  }
`;

const GENERATE_TAGIHAN_BULANAN = gql`
  mutation GenerateTagihanBulanan($periode: String!, $idMeteranList: [ID!]!) {
    generateTagihanBulanan(periode: $periode, idMeteranList: $idMeteranList) {
      berhasil
      gagal
      pesan
    }
  }
`;

const GET_ALL_METERAN_IDS = gql`
  query GetAllMeteranIds {
    getAllMeteran {
      _id
    }
  }
`;

export default function BillingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('current');
  const [selectedBilling, setSelectedBilling] = useState<any | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [generatePeriode, setGeneratePeriode] = useState(
    new Date().toISOString().slice(0, 7) // default: bulan ini YYYY-MM
  );
  const [generateResult, setGenerateResult] = useState<{berhasil: number; gagal: number; pesan: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success'|'error'}>({
    open: false, message: '', severity: 'success',
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // GraphQL queries
  const { data, loading, error, refetch } = useQuery(GET_BILLINGS, {
    fetchPolicy: 'network-only',
  });

  const { data: statsData, refetch: refetchStats } = useQuery(GET_BILLING_STATS, {
    fetchPolicy: 'network-only',
  });

  const { data: chartData } = useQuery(GET_BILLING_CHART, {
    fetchPolicy: 'network-only',
  });

  const { data: meteranData } = useQuery(GET_ALL_METERAN_IDS, {
    fetchPolicy: 'cache-first',
  });

  // Mutations
  const [updateStatusPembayaran] = useMutation(UPDATE_STATUS_PEMBAYARAN);
  const [generateTagihanBulanan] = useMutation(GENERATE_TAGIHAN_BULANAN);

  const allTagihan = data?.getAllTagihan || [];
  const billingStats = statsData?.getRingkasanStatusTagihan;
  const revenueData = (chartData?.getLaporanKeuanganBulanan || []).map((d: any) => ({
    month: d.bulan,
    revenue: d.totalTagihan,
    bills: d.jumlahTagihan,
    collected: d.totalLunas,
  }));

  // Client-side filter & paginate
  const filtered = allTagihan.filter((bill: any) => {
    const namaLengkap = bill.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || '';
    const nomorMeteran = bill.idMeteran?.nomorMeteran || '';
    const nomorAkun = bill.idMeteran?.nomorAkun || '';
    const matchSearch = !searchTerm ||
      namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorMeteran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomorAkun.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || bill.statusPembayaran === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const billing = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, billing: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedBilling(billing);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBilling(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleGenerateBills = () => {
    setGenerateResult(null);
    setOpenGenerateDialog(true);
    handleMenuClose();
  };

  const handleConfirmGenerate = async () => {
    const allMeteranIds = (meteranData?.getAllMeteran || []).map((m: any) => m._id);
    if (allMeteranIds.length === 0) {
      setSnackbar({ open: true, message: 'Tidak ada meteran terdaftar', severity: 'error' });
      setOpenGenerateDialog(false);
      return;
    }
    setActionLoading(true);
    try {
      const result = await generateTagihanBulanan({
        variables: { periode: generatePeriode, idMeteranList: allMeteranIds },
      });
      setGenerateResult(result.data.generateTagihanBulanan);
      refetch();
      refetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal generate tagihan', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayment = () => {
    setOpenPaymentDialog(true);
    handleMenuClose();
  };

  const handleConfirmPayment = async () => {
    if (!selectedBilling) return;
    setActionLoading(true);
    try {
      await updateStatusPembayaran({
        variables: { id: selectedBilling._id, status: 'Settlement' },
      });
      setSnackbar({ open: true, message: 'Status pembayaran berhasil diperbarui', severity: 'success' });
      setOpenPaymentDialog(false);
      setOpenDialog(false);
      refetch();
      refetchStats();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal memproses pembayaran', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };


  // Status mapping dari ERD enum: Pending | Settlement | Cancel | Expire | Refund | Chargeback | Fraud
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Settlement': return 'success';
      case 'Pending': return 'warning';
      case 'Expire': return 'error';
      case 'Cancel': return 'default';
      case 'Refund': return 'info';
      default: return 'default';
    }
  };

  // Format periode dari epoch ms atau YYYY-MM string
  const formatPeriode = (periode: string) => {
    if (!periode) return '-';
    const num = Number(periode);
    if (!isNaN(num) && num > 1000000000000) {
      const d = new Date(num);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    }
    // YYYY-MM format
    const parts = periode.split('-');
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    }
    return periode;
  };

  // Format tanggal dari epoch ms atau ISO string
  const formatTanggal = (tgl: string | null) => {
    if (!tgl) return '-';
    const num = Number(tgl);
    const d = !isNaN(num) && num > 1000000000000 ? new Date(num) : new Date(tgl);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Settlement': return 'Lunas';
      case 'Pending': return 'Belum Bayar';
      case 'Expire': return 'Jatuh Tempo';
      case 'Cancel': return 'Dibatalkan';
      case 'Refund': return 'Refund';
      default: return status || '-';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Settlement': return <CheckCircle color="success" />;
      case 'Pending': return <Schedule color="warning" />;
      case 'Expire': return <Warning color="error" />;
      default: return <Schedule />;
    }
  };

  const totalRevenue = billingStats?.nilaiTotal || 0;
  const totalCollected = billingStats?.nilaiLunas || 0;
  const paidBillings = billingStats?.totalLunas || 0;
  const totalBillings = billingStats?.totalTagihan || 1;
  const collectionRate = totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0;
  const overdueAmount = billingStats?.nilaiTunggakan || 0;

  if (loading) {
    return (
      <AdminLayout title="Manajemen Penagihan">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Manajemen Penagihan">
        <Alert severity="error" sx={{ mt: 2 }}>
          Gagal memuat data tagihan: {error.message}
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Penagihan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Manajemen Penagihan & Keuangan
        </Typography>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Receipt />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {totalRevenue.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tagihan
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
                    <Payment />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {totalCollected.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Terkumpul
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
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {collectionRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Efisiensi Penagihan
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
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {overdueAmount.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tunggakan
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Revenue Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Tren Pendapatan (6 Bulan Terakhir)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? `Rp ${value.toLocaleString('id-ID')}` :
                          name === 'collected' ? `Rp ${value.toLocaleString('id-ID')}` :
                          `${value.toLocaleString('id-ID')}`,
                          name === 'revenue' ? 'Target' :
                          name === 'collected' ? 'Terkumpul' : 'Jumlah Tagihan'
                        ]}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2196F3" strokeWidth={3} />
                      <Line yAxisId="left" type="monotone" dataKey="collected" stroke="#4CAF50" strokeWidth={3} />
                      <Bar yAxisId="right" dataKey="bills" fill="#FF9800" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Status Penagihan
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Lunas</Typography>
                      <Typography variant="body2">
                        {billingStats?.totalLunas || 0} / {billingStats?.totalTagihan || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Belum Bayar</Typography>
                      <Typography variant="body2">
                        {billingStats?.totalPending || 0} / {billingStats?.totalTagihan || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalBillings > 0 ? ((billingStats?.totalPending || 0) / totalBillings) * 100 : 0}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Terlambat</Typography>
                      <Typography variant="body2">
                        {billingStats?.totalTunggakan || 0} / {billingStats?.totalTagihan || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalBillings > 0 ? ((billingStats?.totalTunggakan || 0) / totalBillings) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
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
                  placeholder="Cari nomor akun..."
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
                    <MenuItem value="Settlement">Lunas</MenuItem>
                    <MenuItem value="Pending">Belum Bayar</MenuItem>
                    <MenuItem value="Expire">Jatuh Tempo</MenuItem>
                    <MenuItem value="Cancel">Dibatalkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Periode</InputLabel>
                  <Select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    label="Periode"
                  >
                    <MenuItem value="current">Bulan Ini</MenuItem>
                    <MenuItem value="last">Bulan Lalu</MenuItem>
                    <MenuItem value="all">Semua</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Autorenew />}
                  onClick={handleGenerateBills}
                  sx={{ height: '56px' }}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Billing Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pelanggan</TableCell>
                  <TableCell>Periode</TableCell>
                  <TableCell>Konsumsi</TableCell>
                  <TableCell>Jumlah Tagihan</TableCell>
                  <TableCell>Jatuh Tempo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billing.map((bill: any) => (
                  <TableRow key={bill._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {bill.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bill.idMeteran?.nomorMeteran || bill.idMeteran?.nomorAkun || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatPeriode(bill.periode)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {bill.totalPemakaian} m³
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Rp {(bill.totalBiaya || 0).toLocaleString('id-ID')}
                      </Typography>
                      {bill.denda > 0 && (
                        <Typography variant="caption" color="error">
                          + Denda: Rp {bill.denda.toLocaleString('id-ID')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTanggal(bill.tenggatWaktu)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(bill.statusPembayaran)}
                        <Chip
                          label={getStatusLabel(bill.statusPembayaran)}
                          size="small"
                          color={getStatusColor(bill.statusPembayaran) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, bill)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {billing.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Tidak ada data tagihan
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages || 1}
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
        <MenuItem onClick={handleProcessPayment}>
          <Payment sx={{ mr: 1 }} />
          Proses Pembayaran
        </MenuItem>
        <MenuItem onClick={handleGenerateBills}>
          <Receipt sx={{ mr: 1 }} />
          Cetak Tagihan
        </MenuItem>
        <MenuItem>
          <Download sx={{ mr: 1 }} />
          Download PDF
        </MenuItem>
      </Menu>

      {/* Billing Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Tagihan
          {selectedBilling && ` - ${selectedBilling.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || ''}`}
        </DialogTitle>
        <DialogContent>
          {selectedBilling && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Tagihan
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Pelanggan:</strong> {selectedBilling.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}</Typography>
                  <Typography><strong>No. Meteran:</strong> {selectedBilling.idMeteran?.nomorMeteran || '-'}</Typography>
                  <Typography><strong>No. Akun:</strong> {selectedBilling.idMeteran?.nomorAkun || '-'}</Typography>
                  <Typography><strong>Periode:</strong> {formatPeriode(selectedBilling.periode)}</Typography>
                  <Typography><strong>Pemakaian:</strong> {selectedBilling.totalPemakaian} m³</Typography>
                  <Typography><strong>Biaya Air:</strong> Rp {(selectedBilling.biaya || 0).toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Biaya Beban:</strong> Rp {(selectedBilling.biayaBeban || 0).toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Jatuh Tempo:</strong> {formatTanggal(selectedBilling.tenggatWaktu)}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Rincian Pembayaran
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Total Tagihan:</strong> Rp {(selectedBilling.totalBiaya || 0).toLocaleString('id-ID')}</Typography>
                  {selectedBilling.denda > 0 && (
                    <Typography color="error"><strong>Denda:</strong> Rp {selectedBilling.denda.toLocaleString('id-ID')}</Typography>
                  )}
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedBilling.statusPembayaran)}</Typography>
                  {selectedBilling.metodePembayaran && (
                    <Typography><strong>Metode Pembayaran:</strong> {selectedBilling.metodePembayaran}</Typography>
                  )}
                  {selectedBilling.tanggalPembayaran && (
                    <Typography><strong>Tanggal Bayar:</strong> {new Date(selectedBilling.tanggalPembayaran).toLocaleDateString('id-ID')}</Typography>
                  )}
                  {selectedBilling.catatan && (
                    <Typography><strong>Catatan:</strong> {selectedBilling.catatan}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          {selectedBilling?.statusPembayaran === 'Pending' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Payment />}
              onClick={handleProcessPayment}
            >
              Proses Pembayaran
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: Generate Tagihan Bulanan */}
      <Dialog open={openGenerateDialog} onClose={() => { if (!actionLoading) { setOpenGenerateDialog(false); setGenerateResult(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Tagihan Bulanan</DialogTitle>
        <DialogContent>
          {!generateResult ? (
            <Box sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Sistem akan membuat tagihan untuk <strong>semua meteran aktif</strong> pada periode yang dipilih.
                Tagihan yang sudah ada pada periode tersebut akan dilewati.
              </Alert>
              <TextField
                fullWidth
                label="Periode (Bulan - Tahun)"
                type="month"
                value={generatePeriode}
                onChange={(e) => setGeneratePeriode(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Total meteran terdaftar: {meteranData?.getAllMeteran?.length || 0}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Alert severity={generateResult.gagal === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {generateResult.pesan}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip label={`Berhasil: ${generateResult.berhasil}`} color="success" />
                <Chip label={`Dilewati/Gagal: ${generateResult.gagal}`} color={generateResult.gagal > 0 ? 'warning' : 'default'} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenGenerateDialog(false); setGenerateResult(null); }} disabled={actionLoading}>
            {generateResult ? 'Tutup' : 'Batal'}
          </Button>
          {!generateResult && (
            <Button
              variant="contained"
              onClick={handleConfirmGenerate}
              disabled={actionLoading || !generatePeriode}
              startIcon={actionLoading ? <CircularProgress size={18} /> : <Autorenew />}
            >
              {actionLoading ? 'Memproses...' : 'Generate Tagihan'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: Konfirmasi Proses Pembayaran Manual */}
      <Dialog open={openPaymentDialog} onClose={() => { if (!actionLoading) setOpenPaymentDialog(false); }} maxWidth="xs" fullWidth>
        <DialogTitle>Konfirmasi Pembayaran Manual</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tindakan ini menandai tagihan sebagai <strong>Lunas (Settlement)</strong> secara manual.
            Gunakan hanya jika pembayaran sudah terkonfirmasi di luar sistem.
          </Alert>
          {selectedBilling && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Pelanggan:</strong> {selectedBilling.idMeteran?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}</Typography>
              <Typography><strong>Periode:</strong> {formatPeriode(selectedBilling.periode)}</Typography>
              <Typography><strong>Jumlah:</strong> Rp {(selectedBilling.totalBiaya || 0).toLocaleString('id-ID')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)} disabled={actionLoading}>Batal</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPayment}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={18} /> : <CheckCircle />}
          >
            {actionLoading ? 'Memproses...' : 'Konfirmasi Lunas'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
