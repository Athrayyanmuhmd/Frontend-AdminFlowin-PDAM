// @ts-nocheck
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
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dayjs from 'dayjs';

const GET_ALL_METERAN = gql`
  query GetAllMeteranForBilling {
    getAllMeteran {
      _id
      nomorMeteran
      nomorAkun
      idKelompokPelanggan {
        _id
        namaKelompok
      }
      idKoneksiData {
        idPelanggan {
          _id
          namaLengkap
          email
        }
      }
    }
  }
`;

const GENERATE_TAGIHAN = gql`
  mutation GenerateTagihanBulanan($periode: String!, $idMeteranList: [ID!]!) {
    generateTagihanBulanan(periode: $periode, idMeteranList: $idMeteranList) {
      berhasil
      gagal
      pesan
    }
  }
`;

const steps = ['Pilih Periode', 'Pilih Akun', 'Review & Generate', 'Hasil'];

interface AccountForBilling {
  id: string;
  accountNumber: string;
  customerName: string;
  meterNumber: string;
  tariffCategory: string;
  selected: boolean;
}

export default function GenerateBills() {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    periode: dayjs().format('YYYY-MM'),
    tariffCategory: 'all',
  });

  const [generationResults, setGenerationResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[]
  });

  // Fetch real meteran data
  const { data: meteranData, loading: loadingMeteran } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
    skip: activeStep < 1,
  });

  const [generateTagihanMutation, { loading: generating }] = useMutation(GENERATE_TAGIHAN);

  // Build accounts list from real meteran data
  const allAccounts: AccountForBilling[] = (meteranData?.getAllMeteran || []).map((m: any) => ({
    id: m._id,
    accountNumber: m.nomorAkun,
    customerName: m.idKoneksiData?.idPelanggan?.namaLengkap || '-',
    meterNumber: m.nomorMeteran,
    tariffCategory: m.idKelompokPelanggan?.namaKelompok || '-',
    selected: selectedIds.has(m._id),
  }));

  const filteredAccounts = allAccounts.filter((a) =>
    formData.tariffCategory === 'all' || a.tariffCategory === formData.tariffCategory
  );

  const selectedAccounts = filteredAccounts.filter((a) => selectedIds.has(a.id));

  const handleAccountToggle = (accountId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(accountId) ? next.delete(accountId) : next.add(accountId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.id)));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return !!formData.periode;
      case 1: return selectedIds.size > 0;
      case 2: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    } else {
      setError('Mohon lengkapi semua field yang diperlukan');
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleGenerateBills = async () => {
    try {
      setGenerationProgress(10);
      const idMeteranList = Array.from(selectedIds);
      const result = await generateTagihanMutation({
        variables: { periode: formData.periode, idMeteranList },
      });
      setGenerationProgress(100);
      const res = result.data?.generateTagihanBulanan;
      setGenerationResults({
        total: idMeteranList.length,
        success: res?.berhasil ?? idMeteranList.length,
        failed: res?.gagal ?? 0,
        errors: res?.pesan ? [res.pesan] : [],
      });
      setActiveStep(3);
      setSuccess(`Generate tagihan selesai untuk periode ${formData.periode}`);
    } catch (err: any) {
      setError('Gagal generate tagihan: ' + err.message);
    }
  };

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
                {/* MUI v6 DatePicker API: gunakan slotProps, bukan renderInput */}
                <DatePicker
                  label="Periode Tagihan (Bulan)"
                  views={['year', 'month']}
                  value={dayjs(formData.periode + '-01')}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, periode: date ? date.format('YYYY-MM') : prev.periode }))
                  }
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Filter Kelompok Pelanggan</InputLabel>
                  <Select
                    value={formData.tariffCategory}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tariffCategory: e.target.value }))}
                    label="Filter Kelompok Pelanggan"
                  >
                    <MenuItem value="all">Semua Kelompok</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="body2">
                    <strong>Info:</strong> Sistem akan membuat tagihan baru berdasarkan data pemakaian meteran pada periode yang dipilih.
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
                  Pilih Meteran untuk Generate Tagihan
                </Typography>
                <Button onClick={handleSelectAll} variant="outlined" disabled={loadingMeteran}>
                  {selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              {loadingMeteran ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Card>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={filteredAccounts.length > 0 && selectedIds.size === filteredAccounts.length}
                              indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAccounts.length}
                              onChange={handleSelectAll}
                            />
                          </TableCell>
                          <TableCell>No. Akun / Meteran</TableCell>
                          <TableCell>Pelanggan</TableCell>
                          <TableCell>Kelompok</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAccounts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                              <Typography color="text.secondary">Tidak ada data meteran</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredAccounts.map((account) => (
                          <TableRow key={account.id} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedIds.has(account.id)}
                                onChange={() => handleAccountToggle(account.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {account.accountNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {account.meterNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>{account.customerName}</TableCell>
                            <TableCell>
                              <Chip label={account.tariffCategory} size="small" color="primary" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
            </Grid>

            {selectedIds.size > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="subtitle1">
                    <strong>Ringkasan:</strong> {selectedIds.size} meteran dipilih untuk generate tagihan periode {formData.periode}
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
                <Typography><strong>Periode:</strong> {formData.periode}</Typography>
                <Typography><strong>Kelompok:</strong> {formData.tariffCategory === 'all' ? 'Semua' : formData.tariffCategory}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Ringkasan Generate</Typography>
                <Typography><strong>Jumlah Meteran:</strong> {selectedIds.size}</Typography>
                <Typography><strong>Pelanggan terpilih:</strong> {selectedAccounts.map((a) => a.customerName).slice(0, 3).join(', ')}{selectedIds.size > 3 ? '...' : ''}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>Perhatian:</strong> Proses generate tagihan akan membuat tagihan baru untuk semua meteran yang dipilih pada periode {formData.periode}.
                Pastikan tagihan untuk periode ini belum pernah digenerate sebelumnya.
              </Alert>
            </Grid>

            {generating && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Sedang generate tagihan...
                  </Typography>
                  <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
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
                      setSelectedIds(new Set());
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
                  disabled={generating || !validateStep(activeStep)}
                  startIcon={generating ? <CircularProgress size={20} /> : <Send />}
                >
                  {generating ? 'Generating...' : 'Generate Tagihan'}
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
