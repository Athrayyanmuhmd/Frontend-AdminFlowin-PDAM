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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Receipt,
  Calculate,
  Send,
  Preview,
  CheckCircle,
  Error,
  Warning,
  Info,
  WaterDrop,
  AttachMoney,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AdminLayout from '../../../layouts/AdminLayout';
import { billingAPI, customerAPI } from '../../../utils/API';
import dayjs from 'dayjs';

const steps = ['Pilih Periode', 'Pilih Akun', 'Review & Generate', 'Hasil'];

interface AccountForBilling {
  id: string;
  accountNumber: string;
  customerName: string;
  meterNumber: string;
  tariffCategory: string;
  lastReading: number;
  currentReading: number;
  consumption: number;
  estimatedAmount: number;
  selected: boolean;
}

export default function GenerateBills() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewDialog, setPreviewDialog] = useState(false);

  const [formData, setFormData] = useState({
    billingPeriod: {
      start: dayjs().startOf('month'),
      end: dayjs().endOf('month')
    },
    tariffCategory: 'all',
    accountType: 'all',
    includeArrears: true,
    autoSend: false
  });

  const [accountsForBilling, setAccountsForBilling] = useState<AccountForBilling[]>([]);
  const [generationResults, setGenerationResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[]
  });

  // Mock data for demonstration
  const mockAccounts: AccountForBilling[] = [
    {
      id: '1',
      accountNumber: 'ACC-001-2024',
      customerName: 'Ahmad Rizki',
      meterNumber: 'MTR-001',
      tariffCategory: '2A2',
      lastReading: 1200,
      currentReading: 1250,
      consumption: 50,
      estimatedAmount: 125000,
      selected: true
    },
    {
      id: '2',
      accountNumber: 'ACC-002-2024',
      customerName: 'Siti Nurhaliza',
      meterNumber: 'MTR-002',
      tariffCategory: 'komersial',
      lastReading: 2300,
      currentReading: 2500,
      consumption: 200,
      estimatedAmount: 800000,
      selected: true
    },
    {
      id: '3',
      accountNumber: 'ACC-003-2024',
      customerName: 'PT. Maju Jaya',
      meterNumber: 'MTR-003',
      tariffCategory: 'industri',
      lastReading: 4500,
      currentReading: 5000,
      consumption: 500,
      estimatedAmount: 2250000,
      selected: false
    }
  ];

  useEffect(() => {
    if (activeStep === 1) {
      loadAccountsForBilling();
    }
  }, [activeStep]);

  const loadAccountsForBilling = async () => {
    try {
      setLoading(true);
      // For demo, use mock data
      setAccountsForBilling(mockAccounts);
    } catch (err: any) {
      setError('Gagal memuat data akun: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setAccountsForBilling(prev =>
      prev.map(account =>
        account.id === accountId
          ? { ...account, selected: !account.selected }
          : account
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = accountsForBilling.every(account => account.selected);
    setAccountsForBilling(prev =>
      prev.map(account => ({ ...account, selected: !allSelected }))
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.billingPeriod.start && formData.billingPeriod.end);
      case 1:
        return accountsForBilling.some(account => account.selected);
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      setError('Mohon lengkapi semua field yang diperlukan');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerateBills = async () => {
    try {
      setLoading(true);
      setGenerationProgress(0);

      const selectedAccounts = accountsForBilling.filter(account => account.selected);
      const total = selectedAccounts.length;
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < selectedAccounts.length; i++) {
        const account = selectedAccounts[i];

        try {
          // Simulate API call for each bill generation
          await new Promise(resolve => setTimeout(resolve, 500));

          const billData = {
            accountId: account.id,
            billingPeriod: formData.billingPeriod,
            meterReading: {
              previous: account.lastReading,
              current: account.currentReading
            },
            tariffCategory: account.tariffCategory
          };

          // await billingAPI.generateBill(billData);
          success++;
        } catch (err: any) {
          failed++;
          errors.push(`${account.accountNumber}: ${err.message}`);
        }

        setGenerationProgress(((i + 1) / total) * 100);
      }

      setGenerationResults({ total, success, failed, errors });
      setActiveStep(3);

      if (success > 0) {
        setSuccess(`Berhasil generate ${success} tagihan dari ${total} akun`);
      }

    } catch (err: any) {
      setError('Gagal generate tagihan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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

  const selectedAccounts = accountsForBilling.filter(account => account.selected);
  const totalEstimatedAmount = selectedAccounts.reduce((sum, account) => sum + account.estimatedAmount, 0);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt color="primary" />
                  Konfigurasi Periode Tagihan
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Tanggal Mulai"
                  value={formData.billingPeriod.start}
                  onChange={(date) => handleInputChange('billingPeriod.start', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Tanggal Akhir"
                  value={formData.billingPeriod.end}
                  onChange={(date) => handleInputChange('billingPeriod.end', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Filter Tarif</InputLabel>
                  <Select
                    value={formData.tariffCategory}
                    onChange={(e) => handleInputChange('tariffCategory', e.target.value)}
                    label="Filter Tarif"
                  >
                    <MenuItem value="all">Semua Tarif</MenuItem>
                    <MenuItem value="2A2">Rumah Tangga 2A2</MenuItem>
                    <MenuItem value="2A3">Rumah Tangga 2A3</MenuItem>
                    <MenuItem value="komersial">Komersial</MenuItem>
                    <MenuItem value="industri">Industri</MenuItem>
                    <MenuItem value="sosial">Sosial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status Akun</InputLabel>
                  <Select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    label="Status Akun"
                  >
                    <MenuItem value="all">Semua Akun</MenuItem>
                    <MenuItem value="active">Hanya Aktif</MenuItem>
                    <MenuItem value="new">Sambungan Baru</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="body2">
                    💡 <strong>Info:</strong> Sistem akan mengambil pembacaan meteran terakhir untuk perhitungan konsumsi.
                    Pastikan data pembacaan meteran sudah up-to-date.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calculate color="primary" />
                  Pilih Akun untuk Generate Tagihan
                </Typography>
                <Button onClick={handleSelectAll} variant="outlined">
                  {accountsForBilling.every(account => account.selected) ? 'Batalkan Semua' : 'Pilih Semua'}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={accountsForBilling.length > 0 && accountsForBilling.every(account => account.selected)}
                            indeterminate={accountsForBilling.some(account => account.selected) && !accountsForBilling.every(account => account.selected)}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Akun</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell>Tarif</TableCell>
                        <TableCell>Konsumsi</TableCell>
                        <TableCell>Est. Tagihan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accountsForBilling.map((account) => (
                        <TableRow key={account.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={account.selected}
                              onChange={() => handleAccountToggle(account.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {account.accountNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {account.meterNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{account.customerName}</TableCell>
                          <TableCell>
                            <Chip
                              label={getTariffLabel(account.tariffCategory)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <WaterDrop color="primary" sx={{ fontSize: 16 }} />
                              <Typography>{account.consumption} m³</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachMoney color="success" sx={{ fontSize: 16 }} />
                              <Typography>Rp {account.estimatedAmount.toLocaleString('id-ID')}</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {selectedAccounts.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="subtitle1">
                    <strong>Ringkasan:</strong> {selectedAccounts.length} akun dipilih •
                    Total estimasi tagihan: Rp {totalEstimatedAmount.toLocaleString('id-ID')}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Preview color="primary" />
                Review & Konfirmasi
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Periode Tagihan</Typography>
                <Typography><strong>Mulai:</strong> {formData.billingPeriod.start.toLocaleDateString('id-ID')}</Typography>
                <Typography><strong>Akhir:</strong> {formData.billingPeriod.end.toLocaleDateString('id-ID')}</Typography>
                <Typography><strong>Filter Tarif:</strong> {formData.tariffCategory === 'all' ? 'Semua' : getTariffLabel(formData.tariffCategory)}</Typography>
                <Typography><strong>Status Akun:</strong> {formData.accountType === 'all' ? 'Semua' : formData.accountType}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Ringkasan Generate</Typography>
                <Typography><strong>Jumlah Akun:</strong> {selectedAccounts.length}</Typography>
                <Typography><strong>Total Estimasi:</strong> Rp {totalEstimatedAmount.toLocaleString('id-ID')}</Typography>
                <Typography><strong>Auto Send:</strong> {formData.autoSend ? 'Ya' : 'Tidak'}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>Perhatian:</strong> Proses generate tagihan akan membuat tagihan baru untuk semua akun yang dipilih.
                Pastikan data pembacaan meteran sudah benar sebelum melanjutkan.
              </Alert>
            </Grid>

            {loading && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Generating tagihan... {generationProgress.toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={generationProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Hasil Generate Tagihan
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {generationResults.success}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Berhasil
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Error sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {generationResults.failed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gagal
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Info sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {generationResults.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {generationResults.errors.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>Error Details:</Typography>
                  {generationResults.errors.map((error, index) => (
                    <Typography key={index} variant="body2">• {error}</Typography>
                  ))}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="body1">
                  ✅ Proses generate tagihan selesai! Tagihan yang berhasil dibuat dapat dilihat di halaman daftar tagihan.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <AdminLayout title="Generate Tagihan">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Generate Tagihan Bulanan
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Kembali
              </Button>

              {activeStep === steps.length - 1 ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setActiveStep(0);
                      setGenerationResults({ total: 0, success: 0, failed: 0, errors: [] });
                    }}
                  >
                    Generate Lagi
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => window.location.href = '/billing'}
                  >
                    Lihat Tagihan
                  </Button>
                </Box>
              ) : activeStep === 2 ? (
                <Button
                  variant="contained"
                  onClick={handleGenerateBills}
                  disabled={loading || !validateStep(activeStep)}
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                >
                  {loading ? 'Generating...' : 'Generate Tagihan'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validateStep(activeStep)}
                >
                  Selanjutnya
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
