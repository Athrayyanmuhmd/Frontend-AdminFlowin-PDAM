'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
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
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import { GET_BILLINGS, GET_BILLING_STATS } from '@/lib/graphql/queries/billing';

const revenueData = [
  { month: 'Jan', revenue: 125000000, bills: 1250, collected: 115000000 },
  { month: 'Feb', revenue: 135000000, bills: 1300, collected: 128000000 },
  { month: 'Mar', revenue: 145000000, bills: 1400, collected: 140000000 },
  { month: 'Apr', revenue: 138000000, bills: 1350, collected: 135000000 },
  { month: 'Mei', revenue: 155000000, bills: 1500, collected: 150000000 },
  { month: 'Jun', revenue: 165000000, bills: 1600, collected: 160000000 },
];

export default function BillingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('current');
  const [selectedBilling, setSelectedBilling] = useState<any | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // GraphQL queries
  const { data, loading, error } = useQuery(GET_BILLINGS, {
    variables: {
      filter: {
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm }),
        page,
        limit: rowsPerPage,
      },
    },
  });

  const { data: statsData } = useQuery(GET_BILLING_STATS);

  const billing = data?.billings?.data || [];
  const pagination = data?.billings?.pagination;
  const billingStats = statsData?.billingStats;

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
    // Implement generate bills functionality
    handleMenuClose();
  };

  const handleProcessPayment = () => {
    // Implement process payment functionality
    handleMenuClose();
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'disputed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Belum Bayar';
      case 'overdue': return 'Terlambat';
      case 'disputed': return 'Dispute';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle color="success" />;
      case 'pending': return <Schedule color="warning" />;
      case 'overdue': return <Warning color="error" />;
      case 'disputed': return <Warning color="info" />;
      default: return <CheckCircle />;
    }
  };

  const totalRevenue = billingStats?.totalRevenue || 0;
  const totalPending = billingStats?.totalPending || 0;
  const totalCollected = (billingStats?.totalRevenue || 0) - (billingStats?.totalPending || 0); // Amount actually collected (paid)
  const paidBillings = billingStats?.paidBillings || 0;
  const totalBillings = billingStats?.totalBillings || 1;
  const collectionRate = totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0;
  const overdueAmount = totalPending;

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
                        {billingStats?.paidBillings || 0} / {billingStats?.totalBillings || 0}
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
                        {billingStats?.unpaidBillings || 0} / {billingStats?.totalBillings || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalBillings > 0 ? ((billingStats?.unpaidBillings || 0) / totalBillings) * 100 : 0}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Terlambat</Typography>
                      <Typography variant="body2">
                        {billingStats?.overdueBillings || 0} / {billingStats?.totalBillings || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalBillings > 0 ? ((billingStats?.overdueBillings || 0) / totalBillings) * 100 : 0}
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
                    <MenuItem value="paid">Lunas</MenuItem>
                    <MenuItem value="pending">Belum Bayar</MenuItem>
                    <MenuItem value="overdue">Terlambat</MenuItem>
                    <MenuItem value="disputed">Dispute</MenuItem>
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
                  startIcon={<Add />}
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
                {billing.map((bill: any) => {
                  const status = bill.isPaid ? 'paid' : bill.isOverdue ? 'overdue' : 'pending';
                  return (
                  <TableRow key={bill._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {bill.userId?.fullName || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bill.meteranId?.noMeteran || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {bill.periode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {bill.totalPemakaian} m³
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Rp {(bill.totalTagihan || 0).toLocaleString('id-ID')}
                      </Typography>
                      {bill.denda > 0 && (
                        <Typography variant="caption" color="error">
                          + Denda: Rp {bill.denda.toLocaleString('id-ID')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('id-ID') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(status)}
                        <Chip
                          label={getStatusLabel(status)}
                          size="small"
                          color={getStatusColor(status) as any}
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
                  );
                })}
                {billing.length === 0 && (
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
              count={pagination?.totalPages || 1}
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
          {selectedBilling && ` - ${selectedBilling.userId?.fullName || ''}`}
        </DialogTitle>
        <DialogContent>
          {selectedBilling && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Tagihan
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Pelanggan:</strong> {selectedBilling.userId?.fullName || '-'}</Typography>
                  <Typography><strong>No. Meteran:</strong> {selectedBilling.meteranId?.noMeteran || '-'}</Typography>
                  <Typography><strong>Periode:</strong> {selectedBilling.periode}</Typography>
                  <Typography><strong>Pemakaian:</strong> {selectedBilling.totalPemakaian} m³</Typography>
                  <Typography><strong>Biaya Air:</strong> Rp {(selectedBilling.biayaAir || 0).toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Biaya Beban:</strong> Rp {(selectedBilling.biayaBeban || 0).toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Jatuh Tempo:</strong> {selectedBilling.dueDate ? new Date(selectedBilling.dueDate).toLocaleDateString('id-ID') : '-'}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Rincian Pembayaran
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Total Tagihan:</strong> Rp {(selectedBilling.totalTagihan || 0).toLocaleString('id-ID')}</Typography>
                  {selectedBilling.denda > 0 && (
                    <Typography color="error"><strong>Denda:</strong> Rp {selectedBilling.denda.toLocaleString('id-ID')}</Typography>
                  )}
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedBilling.isPaid ? 'paid' : selectedBilling.isOverdue ? 'overdue' : 'pending')}</Typography>
                  {selectedBilling.paymentMethod && (
                    <Typography><strong>Metode Pembayaran:</strong> {selectedBilling.paymentMethod}</Typography>
                  )}
                  {selectedBilling.paidAt && (
                    <Typography><strong>Tanggal Bayar:</strong> {new Date(selectedBilling.paidAt).toLocaleDateString('id-ID')}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained">Proses Pembayaran</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
