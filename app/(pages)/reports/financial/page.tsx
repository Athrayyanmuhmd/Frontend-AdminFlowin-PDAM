'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Assessment,
  Receipt,
  Warning,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 125000000, target: 120000000, collection: 115000000 },
  { month: 'Feb', revenue: 135000000, target: 130000000, collection: 128000000 },
  { month: 'Mar', revenue: 145000000, target: 140000000, collection: 140000000 },
  { month: 'Apr', revenue: 138000000, target: 135000000, collection: 130000000 },
  { month: 'Mei', revenue: 155000000, target: 150000000, collection: 148000000 },
  { month: 'Jun', revenue: 165000000, target: 160000000, collection: 160000000 },
];

const paymentMethodData = [
  { name: 'Transfer Bank', value: 45, amount: 74250000, color: '#2196F3' },
  { name: 'Virtual Account', value: 30, amount: 49500000, color: '#4CAF50' },
  { name: 'E-Wallet', value: 15, amount: 24750000, color: '#FF9800' },
  { name: 'Tunai', value: 10, amount: 16500000, color: '#9C27B0' },
];

const outstandingBills = [
  { category: 'Rumah Tangga', amount: 25000000, count: 450, percentage: 12.5, status: 'warning' },
  { category: 'Komersial', amount: 15000000, count: 120, percentage: 8.3, status: 'good' },
  { category: 'Industri', amount: 8000000, count: 35, percentage: 5.1, status: 'good' },
  { category: 'Sosial', amount: 2000000, count: 25, percentage: 15.2, status: 'critical' },
];

const collectionStats = [
  { period: '0-30 hari', amount: 160000000, percentage: 97.0, color: '#4CAF50' },
  { period: '31-60 hari', amount: 3500000, percentage: 2.1, color: '#FF9800' },
  { period: '61-90 hari', amount: 1000000, percentage: 0.6, color: '#F44336' },
  { period: '>90 hari', amount: 500000, percentage: 0.3, color: '#D32F2F' },
];

const topCustomers = [
  { name: 'PT. Industri Manufaktur A', category: 'Industri', revenue: 12500000, consumption: 8500 },
  { name: 'Mall Banda Aceh', category: 'Komersial', revenue: 8750000, consumption: 5200 },
  { name: 'Hotel Grand Aceh', category: 'Komersial', revenue: 6500000, consumption: 4100 },
  { name: 'RSUD Dr. Zainoel Abidin', category: 'Sosial', revenue: 5200000, consumption: 3800 },
  { name: 'PT. Pengolahan Makanan B', category: 'Industri', revenue: 4800000, consumption: 3200 },
];

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState('summary');
  const [currentTab, setCurrentTab] = useState(0);

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    // Implementation for PDF export
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
    // Implementation for Excel export
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCollection = revenueData.reduce((sum, item) => sum + item.collection, 0);
  const collectionRate = ((totalCollection / totalRevenue) * 100).toFixed(1);
  const totalOutstanding = outstandingBills.reduce((sum, item) => sum + item.amount, 0);

  return (
    <AdminLayout title="Laporan Keuangan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Laporan Keuangan
        </Typography>

        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Tanggal Mulai"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Tanggal Akhir"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Jenis Laporan</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Jenis Laporan"
                  >
                    <MenuItem value="summary">Ringkasan</MenuItem>
                    <MenuItem value="detailed">Detail</MenuItem>
                    <MenuItem value="comparative">Komparatif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Export PDF">
                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdf />}
                      onClick={handleExportPDF}
                      fullWidth
                    >
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export Excel">
                    <Button
                      variant="outlined"
                      startIcon={<TableChart />}
                      onClick={handleExportExcel}
                      fullWidth
                    >
                      Excel
                    </Button>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Pendapatan
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +8.5% dari bulan lalu
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tingkat Penagihan
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {collectionRate}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +2.3% dari target
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Receipt sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tagihan Tertunggak
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Rp {totalOutstanding.toLocaleString('id-ID')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingDown sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    -5.2% dari bulan lalu
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Download sx={{ fontSize: 40, color: 'info.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Transaksi
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {paymentMethodData.reduce((sum, item) => sum + item.value, 0)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Bulan ini
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Grafik Pendapatan" />
            <Tab label="Metode Pembayaran" />
            <Tab label="Tunggakan" />
            <Tab label="Top Pelanggan" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tren Pendapatan dan Penagihan
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2196F3"
                          strokeWidth={3}
                          name="Pendapatan"
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#FF9800"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Target"
                        />
                        <Line
                          type="monotone"
                          dataKey="collection"
                          stroke="#4CAF50"
                          strokeWidth={3}
                          name="Penagihan"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Distribusi Metode Pembayaran
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Detail Metode Pembayaran
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Metode</TableCell>
                          <TableCell align="right">Transaksi (%)</TableCell>
                          <TableCell align="right">Jumlah (Rp)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentMethodData.map((row) => (
                          <TableRow key={row.name}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: row.color,
                                    mr: 1,
                                  }}
                                />
                                {row.name}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{row.value}%</TableCell>
                            <TableCell align="right">
                              Rp {row.amount.toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tunggakan per Kategori Pelanggan
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Kategori</TableCell>
                          <TableCell align="right">Jumlah</TableCell>
                          <TableCell align="right">Pelanggan</TableCell>
                          <TableCell align="right">Persentase</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {outstandingBills.map((row) => (
                          <TableRow key={row.category}>
                            <TableCell>{row.category}</TableCell>
                            <TableCell align="right">
                              Rp {row.amount.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell align="right">{row.count}</TableCell>
                            <TableCell align="right">{row.percentage}%</TableCell>
                            <TableCell>
                              <Chip
                                label={row.status === 'good' ? 'Baik' : row.status === 'warning' ? 'Perhatian' : 'Kritis'}
                                size="small"
                                color={row.status === 'good' ? 'success' : row.status === 'warning' ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Aging Tunggakan
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {collectionStats.map((stat, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{stat.period}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {stat.percentage}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: 8,
                              backgroundColor: stat.color,
                              borderRadius: 4,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Rp {stat.amount.toLocaleString('id-ID')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Top 5 Pelanggan Berdasarkan Pendapatan
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nama Pelanggan</TableCell>
                          <TableCell>Kategori</TableCell>
                          <TableCell align="right">Konsumsi (m³)</TableCell>
                          <TableCell align="right">Pendapatan (Rp)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topCustomers.map((customer, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {customer.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={customer.category} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              {customer.consumption.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell align="right">
                              Rp {customer.revenue.toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AdminLayout>
  );
}
