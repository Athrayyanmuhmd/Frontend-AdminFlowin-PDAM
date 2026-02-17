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
  LinearProgress,
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
  Download,
  Print,
  Email,
  Schedule,
  Assessment,
  WaterDrop,
  Speed,
  Build,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';
import { Report, DashboardKPI } from '../../../types/admin.types';

// Mock data untuk demo
const mockReports: Report[] = [
  {
    id: '1',
    type: 'operational',
    title: 'Laporan Operasional Harian',
    description: 'Ringkasan operasional harian sistem distribusi air',
    parameters: [
      { name: 'Tanggal', type: 'date', value: new Date(), required: true },
      { name: 'Zona', type: 'select', value: 'Semua', required: false, options: ['Semua', 'Zona A', 'Zona B', 'Zona C'] },
    ],
    schedule: {
      frequency: 'daily',
      time: '08:00',
      timezone: 'Asia/Jakarta',
    },
    recipients: ['admin@pdam-tirtadaroy.ac.id', 'manager@pdam-tirtadaroy.ac.id'],
    format: 'pdf',
    status: 'generated',
    createdAt: new Date('2024-01-15'),
    generatedAt: new Date('2024-01-15T08:00:00'),
  },
  {
    id: '2',
    type: 'financial',
    title: 'Laporan Keuangan Bulanan',
    description: 'Analisis pendapatan dan efisiensi penagihan',
    parameters: [
      { name: 'Bulan', type: 'date', value: new Date(), required: true },
      { name: 'Format', type: 'select', value: 'PDF', required: false, options: ['PDF', 'Excel', 'CSV'] },
    ],
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'Asia/Jakarta',
    },
    recipients: ['finance@pdam-tirtadaroy.ac.id'],
    format: 'excel',
    status: 'scheduled',
    createdAt: new Date('2024-01-10'),
  },
];

const operationalKPIs: DashboardKPI[] = [
  {
    id: '1',
    name: 'Efisiensi Produksi',
    value: 87.5,
    unit: '%',
    target: 85,
    trend: 'up',
    changePercentage: 2.3,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '2',
    name: 'Air Tidak Berekening',
    value: 18.2,
    unit: '%',
    target: 20,
    trend: 'down',
    changePercentage: -1.8,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Waktu Respons Layanan',
    value: 2.4,
    unit: 'jam',
    target: 4,
    trend: 'down',
    changePercentage: -15.2,
    status: 'good',
    lastUpdated: new Date(),
  },
  {
    id: '4',
    name: 'Uptime Aset',
    value: 98.7,
    unit: '%',
    target: 95,
    trend: 'up',
    changePercentage: 0.5,
    status: 'good',
    lastUpdated: new Date(),
  },
];

const consumptionData = [
  { month: 'Jan', consumption: 45000, production: 48000, efficiency: 93.8 },
  { month: 'Feb', consumption: 48000, production: 51000, efficiency: 94.1 },
  { month: 'Mar', consumption: 52000, production: 55000, efficiency: 94.5 },
  { month: 'Apr', consumption: 49000, production: 52000, efficiency: 94.2 },
  { month: 'Mei', consumption: 55000, production: 58000, efficiency: 94.8 },
  { month: 'Jun', consumption: 58000, production: 61000, efficiency: 95.1 },
];

const waterQualityData = [
  { parameter: 'pH', value: 7.2, standard: '6.5-8.5', status: 'good' },
  { parameter: 'Kekeruhan', value: 0.8, standard: '<1.0', status: 'good' },
  { parameter: 'Klorin', value: 0.5, standard: '0.2-0.8', status: 'good' },
  { parameter: 'Suhu', value: 28, standard: '<30', status: 'good' },
  { parameter: 'Konduktivitas', value: 150, standard: '<200', status: 'good' },
];

const maintenanceData = [
  { equipment: 'Pompa Utama A', status: 'Normal', lastMaintenance: '2024-01-10', nextMaintenance: '2024-02-10', efficiency: 95 },
  { equipment: 'Pompa Utama B', status: 'Warning', lastMaintenance: '2024-01-05', nextMaintenance: '2024-01-25', efficiency: 87 },
  { equipment: 'Filter Sand', status: 'Normal', lastMaintenance: '2024-01-12', nextMaintenance: '2024-02-12', efficiency: 92 },
  { equipment: 'Chlorinator', status: 'Normal', lastMaintenance: '2024-01-08', nextMaintenance: '2024-02-08', efficiency: 98 },
];

export default function OperationalReports() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [kpis, setKpis] = useState<DashboardKPI[]>(operationalKPIs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [currentTab, setCurrentTab] = useState(0);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, report: Report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleGenerateReport = () => {
    if (selectedReport) {
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: 'generated', generatedAt: new Date() }
          : r
      ));
    }
    handleMenuClose();
  };

  const handleScheduleReport = () => {
    if (selectedReport) {
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: 'scheduled' }
          : r
      ));
    }
    handleMenuClose();
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'operational': return 'Operasional';
      case 'financial': return 'Keuangan';
      case 'compliance': return 'Kepatuhan';
      case 'custom': return 'Kustom';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'scheduled': return 'info';
      case 'generated': return 'success';
      case 'sent': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'scheduled': return 'Terjadwal';
      case 'generated': return 'Dihasilkan';
      case 'sent': return 'Terkirim';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit color="default" />;
      case 'scheduled': return <Schedule color="info" />;
      case 'generated': return <CheckCircle color="success" />;
      case 'sent': return <Email color="success" />;
      default: return <Assessment />;
    }
  };

  const getStatusColor2 = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon2 = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Warning color="error" />;
      default: return <CheckCircle />;
    }
  };

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const renderKPIDashboard = () => (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {kpi.name}
                  </Typography>
                  {getStatusIcon2(kpi.status)}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {kpi.value.toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {kpi.unit}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {kpi.trend === 'up' ? <Typography color="success.main">↗</Typography> : <Typography color="error.main">↘</Typography>}
                  <Typography 
                    variant="body2" 
                    color={kpi.trend === 'up' ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 500 }}
                  >
                    {kpi.changePercentage > 0 ? '+' : ''}{kpi.changePercentage}%
                  </Typography>
                </Box>

                {kpi.target && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {kpi.target}{kpi.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((kpi.value / kpi.target) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((kpi.value / kpi.target) * 100, 100)}
                      color={kpi.value >= kpi.target ? 'success' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Konsumsi vs Produksi Air (6 Bulan Terakhir)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString('id-ID')} m³`,
                        name === 'consumption' ? 'Konsumsi' : name === 'production' ? 'Produksi' : 'Efisiensi'
                      ]}
                    />
                    <Area type="monotone" dataKey="consumption" stackId="1" stroke="#2196F3" fill="#2196F3" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="production" stackId="2" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Kualitas Air Saat Ini
              </Typography>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {waterQualityData.map((param, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">{param.parameter}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon2(param.status)}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {param.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Standar: {param.standard}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={param.status === 'good' ? 100 : 70}
                      color={getStatusColor2(param.status) as any}
                      sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Maintenance Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Status Pemeliharaan Aset
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Peralatan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pemeliharaan Terakhir</TableCell>
                  <TableCell>Pemeliharaan Berikutnya</TableCell>
                  <TableCell>Efisiensi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.equipment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon2(item.status.toLowerCase())}
                        <Chip 
                          label={item.status}
                          size="small"
                          color={getStatusColor2(item.status.toLowerCase()) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{item.lastMaintenance}</TableCell>
                    <TableCell>{item.nextMaintenance}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{item.efficiency}%</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={item.efficiency}
                          color={item.efficiency >= 90 ? 'success' : item.efficiency >= 80 ? 'warning' : 'error'}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderReportsList = () => (
    <Box>
      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Cari laporan..."
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
                <InputLabel>Jenis Laporan</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Jenis Laporan"
                >
                  <MenuItem value="all">Semua</MenuItem>
                  <MenuItem value="operational">Operasional</MenuItem>
                  <MenuItem value="financial">Keuangan</MenuItem>
                  <MenuItem value="compliance">Kepatuhan</MenuItem>
                  <MenuItem value="custom">Kustom</MenuItem>
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
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Terjadwal</MenuItem>
                  <MenuItem value="generated">Dihasilkan</MenuItem>
                  <MenuItem value="sent">Terkirim</MenuItem>
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
                Buat Laporan
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Judul Laporan</TableCell>
                <TableCell>Jenis</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Dibuat</TableCell>
                <TableCell>Dihasilkan</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeLabel(report.type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(report.status)}
                      <Chip 
                        label={getStatusLabel(report.status)}
                        size="small"
                        color={getStatusColor(report.status) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={report.format.toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {report.createdAt.toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    {report.generatedAt ? report.generatedAt.toLocaleDateString('id-ID') : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, report)}
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
            count={Math.ceil(filteredReports.length / rowsPerPage)}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </Card>
    </Box>
  );

  return (
    <AdminLayout title="Laporan Operasional">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Laporan & Analitik Operasional
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Dashboard KPI" />
            <Tab label="Daftar Laporan" />
          </Tabs>
        </Box>

        {currentTab === 0 && renderKPIDashboard()}
        {currentTab === 1 && renderReportsList()}
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
        <MenuItem onClick={handleGenerateReport}>
          <Assessment sx={{ mr: 1 }} />
          Generate Laporan
        </MenuItem>
        <MenuItem onClick={handleScheduleReport}>
          <Schedule sx={{ mr: 1 }} />
          Jadwalkan
        </MenuItem>
        <MenuItem>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem>
          <Email sx={{ mr: 1 }} />
          Kirim Email
        </MenuItem>
      </Menu>

      {/* Report Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Laporan
          {selectedReport && ` - ${selectedReport.title}`}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Laporan
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Judul:</strong> {selectedReport.title}</Typography>
                  <Typography><strong>Deskripsi:</strong> {selectedReport.description}</Typography>
                  <Typography><strong>Jenis:</strong> {getTypeLabel(selectedReport.type)}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedReport.status)}</Typography>
                  <Typography><strong>Format:</strong> {selectedReport.format.toUpperCase()}</Typography>
                  <Typography><strong>Dibuat:</strong> {selectedReport.createdAt.toLocaleDateString('id-ID')}</Typography>
                  {selectedReport.generatedAt && (
                    <Typography><strong>Dihasilkan:</strong> {selectedReport.generatedAt.toLocaleDateString('id-ID')}</Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Parameter & Pengaturan
                </Typography>
                {selectedReport.parameters && selectedReport.parameters.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Parameter:
                    </Typography>
                    {selectedReport.parameters.map((param, index) => (
                      <Typography key={index} variant="body2">
                        • {param.name}: {param.value}
                      </Typography>
                    ))}
                  </Box>
                )}
                
                {selectedReport.schedule && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Jadwal:
                    </Typography>
                    <Typography variant="body2">
                      Frekuensi: {selectedReport.schedule.frequency}
                    </Typography>
                    <Typography variant="body2">
                      Waktu: {selectedReport.schedule.time}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Penerima:
                  </Typography>
                  {selectedReport.recipients.map((recipient, index) => (
                    <Typography key={index} variant="body2">
                      • {recipient}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained">Generate Laporan</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
