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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  CheckCircle,
  Warning,
  Error,
  WaterDrop,
  Science,
  Speed,
  Assessment,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';

// Mock data
const waterQualityCompliance = [
  { parameter: 'pH', value: 7.2, standard: '6.5-8.5', min: 6.5, max: 8.5, status: 'compliant', unit: '' },
  { parameter: 'Kekeruhan', value: 0.8, standard: '< 1.0 NTU', min: 0, max: 1.0, status: 'compliant', unit: 'NTU' },
  { parameter: 'Klorin Bebas', value: 0.5, standard: '0.2-0.8 mg/L', min: 0.2, max: 0.8, status: 'compliant', unit: 'mg/L' },
  { parameter: 'Suhu', value: 28, standard: '< 30°C', min: 0, max: 30, status: 'compliant', unit: '°C' },
  { parameter: 'Total Coliform', value: 0, standard: '0 MPN/100mL', min: 0, max: 0, status: 'compliant', unit: 'MPN/100mL' },
  { parameter: 'E. Coli', value: 0, standard: '0 MPN/100mL', min: 0, max: 0, status: 'compliant', unit: 'MPN/100mL' },
  { parameter: 'Kesadahan', value: 85, standard: '< 500 mg/L', min: 0, max: 500, status: 'compliant', unit: 'mg/L' },
  { parameter: 'TDS', value: 120, standard: '< 1000 mg/L', min: 0, max: 1000, status: 'compliant', unit: 'mg/L' },
];

const slaMetrics = [
  { metric: 'Waktu Respons Pengaduan', target: '< 4 jam', actual: 2.4, unit: 'jam', achievement: 140, status: 'excellent' },
  { metric: 'Penyelesaian Work Order', target: '< 48 jam', actual: 36, unit: 'jam', achievement: 133, status: 'excellent' },
  { metric: 'Uptime Sistem Distribusi', target: '> 98%', actual: 99.2, unit: '%', achievement: 101, status: 'excellent' },
  { metric: 'Akurasi Meter Reading', target: '> 95%', actual: 97.5, unit: '%', achievement: 103, status: 'excellent' },
  { metric: 'Tingkat Air Tidak Berekening', target: '< 20%', actual: 18.2, unit: '%', achievement: 109, status: 'good' },
];

const regulatoryCompliance = [
  { regulation: 'Permenkes No. 492/2010', topic: 'Kualitas Air Minum', compliance: 98.5, status: 'compliant', lastAudit: '2024-01-15' },
  { regulation: 'Perpres No. 122/2015', topic: 'Sistem Penyediaan Air Minum', compliance: 95.2, status: 'compliant', lastAudit: '2024-01-10' },
  { regulation: 'Permen PUPR No. 27/2016', topic: 'Penyelenggaraan SPAM', compliance: 96.8, status: 'compliant', lastAudit: '2024-01-12' },
  { regulation: 'ISO 9001:2015', topic: 'Sistem Manajemen Mutu', compliance: 92.3, status: 'minor-findings', lastAudit: '2023-12-20' },
  { regulation: 'ISO 14001:2015', topic: 'Sistem Manajemen Lingkungan', compliance: 94.7, status: 'compliant', lastAudit: '2023-12-18' },
];

const complianceHistory = [
  { month: 'Jan', waterQuality: 98.5, sla: 96.2, regulatory: 94.8 },
  { month: 'Feb', waterQuality: 98.8, sla: 97.1, regulatory: 95.5 },
  { month: 'Mar', waterQuality: 99.1, sla: 97.8, regulatory: 96.2 },
  { month: 'Apr', waterQuality: 98.9, sla: 96.9, regulatory: 95.8 },
  { month: 'Mei', waterQuality: 99.2, sla: 98.5, regulatory: 96.5 },
  { month: 'Jun', waterQuality: 99.0, sla: 97.2, regulatory: 95.9 },
];

const complianceRadarData = [
  { category: 'Kualitas Air', value: 98.5 },
  { category: 'SLA Layanan', value: 96.8 },
  { category: 'Regulasi', value: 95.5 },
  { category: 'Keselamatan', value: 97.2 },
  { category: 'Lingkungan', value: 94.3 },
  { category: 'Operasional', value: 96.5 },
];

export default function ComplianceReports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [complianceType, setComplianceType] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    // Implementation for PDF export
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
    // Implementation for Excel export
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'excellent':
        return 'success';
      case 'good':
      case 'minor-findings':
        return 'warning';
      case 'non-compliant':
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'excellent':
        return <CheckCircle color="success" />;
      case 'good':
      case 'minor-findings':
        return <Warning color="warning" />;
      case 'non-compliant':
      case 'poor':
        return <Error color="error" />;
      default:
        return <CheckCircle />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      compliant: 'Sesuai',
      'minor-findings': 'Temuan Minor',
      'non-compliant': 'Tidak Sesuai',
      excellent: 'Sangat Baik',
      good: 'Baik',
      poor: 'Kurang',
    };
    return labels[status] || status;
  };

  const overallCompliance = (
    (waterQualityCompliance.filter((w) => w.status === 'compliant').length /
      waterQualityCompliance.length) *
    100
  ).toFixed(1);

  return (
    <AdminLayout title="Laporan Kepatuhan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Laporan Kepatuhan & Regulasi
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
                  <InputLabel>Jenis Kepatuhan</InputLabel>
                  <Select
                    value={complianceType}
                    onChange={(e) => setComplianceType(e.target.value)}
                    label="Jenis Kepatuhan"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="water-quality">Kualitas Air</MenuItem>
                    <MenuItem value="sla">Service Level Agreement</MenuItem>
                    <MenuItem value="regulatory">Regulasi</MenuItem>
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
                  <WaterDrop sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Kualitas Air
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {overallCompliance}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main">
                    Sesuai Standar
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Speed sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    SLA Achievement
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  117%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main">
                    Melampaui target
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: 'info.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Kepatuhan Regulasi
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  95.5%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main">
                    Compliant
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Science sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Audit Terakhir
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  5 hari
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    yang lalu
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Kualitas Air" />
            <Tab label="SLA Metrics" />
            <Tab label="Regulasi" />
            <Tab label="Tren Kepatuhan" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Parameter Kualitas Air
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell align="right">Nilai</TableCell>
                          <TableCell>Standar</TableCell>
                          <TableCell>Compliance</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {waterQualityCompliance.map((param) => (
                          <TableRow key={param.parameter}>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {param.parameter}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {param.value} {param.unit}
                            </TableCell>
                            <TableCell>{param.standard}</TableCell>
                            <TableCell>
                              <LinearProgress
                                variant="determinate"
                                value={100}
                                color="success"
                                sx={{ width: 100, height: 8, borderRadius: 4 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(param.status)}
                                <Chip
                                  label={getStatusLabel(param.status)}
                                  size="small"
                                  color={getStatusColor(param.status) as any}
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
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Ringkasan Kepatuhan
                  </Typography>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Semua parameter kualitas air sesuai dengan standar Permenkes No. 492/2010
                  </Alert>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tingkat Kepatuhan
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
                      100%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      8 dari 8 parameter memenuhi standar
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Service Level Agreement Metrics
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Metrik</TableCell>
                          <TableCell>Target</TableCell>
                          <TableCell align="right">Aktual</TableCell>
                          <TableCell align="right">Achievement</TableCell>
                          <TableCell>Performance</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slaMetrics.map((metric) => (
                          <TableRow key={metric.metric}>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {metric.metric}
                              </Typography>
                            </TableCell>
                            <TableCell>{metric.target}</TableCell>
                            <TableCell align="right">
                              {metric.actual} {metric.unit}
                            </TableCell>
                            <TableCell align="right">{metric.achievement}%</TableCell>
                            <TableCell>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(metric.achievement, 100)}
                                color={metric.achievement >= 100 ? 'success' : 'warning'}
                                sx={{ width: 150, height: 8, borderRadius: 4 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(metric.status)}
                                <Chip
                                  label={getStatusLabel(metric.status)}
                                  size="small"
                                  color={getStatusColor(metric.status) as any}
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
            </Grid>
          </Grid>
        )}

        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Status Kepatuhan Regulasi
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Regulasi</TableCell>
                          <TableCell>Topik</TableCell>
                          <TableCell align="right">Compliance (%)</TableCell>
                          <TableCell>Audit Terakhir</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {regulatoryCompliance.map((reg) => (
                          <TableRow key={reg.regulation}>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {reg.regulation}
                              </Typography>
                            </TableCell>
                            <TableCell>{reg.topic}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={reg.compliance}
                                  color={reg.compliance >= 95 ? 'success' : 'warning'}
                                  sx={{ width: 100, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2">{reg.compliance}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {new Date(reg.lastAudit).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(reg.status)}
                                <Chip
                                  label={getStatusLabel(reg.status)}
                                  size="small"
                                  color={getStatusColor(reg.status) as any}
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
            </Grid>
          </Grid>
        )}

        {currentTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Tren Kepatuhan (6 Bulan Terakhir)
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={complianceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[90, 100]} />
                        <RechartsTooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="waterQuality"
                          stroke="#2196F3"
                          strokeWidth={3}
                          name="Kualitas Air"
                        />
                        <Line
                          type="monotone"
                          dataKey="sla"
                          stroke="#4CAF50"
                          strokeWidth={3}
                          name="SLA"
                        />
                        <Line
                          type="monotone"
                          dataKey="regulatory"
                          stroke="#FF9800"
                          strokeWidth={3}
                          name="Regulasi"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Radar Kepatuhan
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={complianceRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Compliance"
                          dataKey="value"
                          stroke="#2196F3"
                          fill="#2196F3"
                          fillOpacity={0.6}
                        />
                        <RechartsTooltip formatter={(value) => `${value}%`} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AdminLayout>
  );
}
