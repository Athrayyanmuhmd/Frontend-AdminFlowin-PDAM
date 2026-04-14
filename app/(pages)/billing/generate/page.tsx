'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ExpandMore,
  ErrorOutline,
  ReportProblem,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AdminLayout from '../../../layouts/AdminLayout';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import dayjs from 'dayjs';
import { GET_ALL_KELOMPOK_PELANGGAN } from '@/lib/graphql/queries/kelompokPelanggan';

const GET_ALL_METERAN = gql`
  query GetAllMeteranForBilling {
    getAllMeteran {
      _id
      NomorMeteran
      NomorAkun
      IdKelompokPelanggan {
        _id
        NamaKelompok
      }
      IdKoneksiData {
        IdPelanggan {
          _id
          namaLengkap
          email
        }
      }
    }
  }
`;

const GENERATE_TAGIHAN = gql`
  mutation GenerateTagihanBulanan($Periode: String!, $IdMeteranList: [ID!]!) {
    generateTagihanBulanan(Periode: $Periode, IdMeteranList: $IdMeteranList) {
      berhasil
      gagal
      pesan
      detailGagal {
        IdMeteran
        NomorMeteran
        NomorAkun
        namaLengkap
        alasan
      }
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
  kelompokId: string;
  selected: boolean;
}

export default function GenerateBills() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    periode: dayjs().format('YYYY-MM'),
    kelompokId: 'all',
  });

  // Fetch kelompok pelanggan untuk dropdown filter
  const { data: kelompokData } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'cache-first',
  });
  const kelompokList: Array<{ _id: string; NamaKelompok: string }> =
    (kelompokData as any)?.getAllKelompokPelanggan || [];

  interface DetailGagal {
    IdMeteran: string;
    NomorMeteran?: string;
    NomorAkun?: string;
    namaLengkap?: string;
    alasan: string;
  }

  const [generationResults, setGenerationResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
    detailGagal: [] as DetailGagal[],
  });

  // Fetch real meteran data
  const { data: meteranData, loading: loadingMeteran } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
    skip: activeStep < 1,
  });

  const [generateTagihanMutation, { loading: generating }] = useMutation(GENERATE_TAGIHAN);

  // Build accounts list from real meteran data
  const allAccounts: AccountForBilling[] = ((meteranData as any)?.getAllMeteran || []).map((m: any) => ({
    id: m._id,
    accountNumber: m.NomorAkun,
    customerName: m.IdKoneksiData?.IdPelanggan?.namaLengkap || '-',
    meterNumber: m.NomorMeteran,
    tariffCategory: m.IdKelompokPelanggan?.NamaKelompok || '-',
    kelompokId: m.IdKelompokPelanggan?._id || '',
    selected: selectedIds.has(m._id),
  }));

  const filteredAccounts = allAccounts.filter((a) =>
    formData.kelompokId === 'all' || a.kelompokId === formData.kelompokId
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
        variables: { Periode: formData.periode, IdMeteranList: idMeteranList },
      });
      setGenerationProgress(100);
      const res = (result.data as any)?.generateTagihanBulanan;
      setGenerationResults({
        total: idMeteranList.length,
        success: res?.berhasil ?? idMeteranList.length,
        failed: res?.gagal ?? 0,
        errors: res?.pesan ? [res.pesan] : [],
        detailGagal: res?.detailGagal ?? [],
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
                    value={formData.kelompokId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kelompokId: e.target.value }))}
                    label="Filter Kelompok Pelanggan"
                  >
                    <MenuItem value="all">Semua Kelompok</MenuItem>
                    {kelompokList.map((k) => (
                      <MenuItem key={k._id} value={k._id}>{k.NamaKelompok}</MenuItem>
                    ))}
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

            {/* Info periode + ringkasan angka */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Konfigurasi Generate</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Periode</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.periode}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Kelompok</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: 140 }}>
                      {formData.kelompokId === 'all' ? 'Semua Kelompok' : (kelompokList.find((k) => k._id === formData.kelompokId)?.NamaKelompok || '-')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Total Meteran</Typography>
                    <Chip label={`${selectedIds.size} meteran`} size="small" color="primary" />
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Tabel daftar akun terpilih */}
            <Grid item xs={12} md={8}>
              <Paper>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Daftar Meteran yang Akan Digenerate ({selectedIds.size})
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 280 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>No. Akun / Meteran</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Nama Pelanggan</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Kelompok</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedAccounts.map((account, index) => (
                        <TableRow key={account.id} hover>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{index + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{account.accountNumber}</Typography>
                            <Typography variant="caption" color="text.secondary">{account.meterNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{account.customerName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={account.tariffCategory} size="small" variant="outlined" color="primary" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>Perhatian:</strong> Proses generate akan membuat tagihan baru untuk <strong>{selectedIds.size} meteran</strong> pada periode <strong>{formData.periode}</strong>.
                Pastikan tagihan untuk periode ini belum pernah digenerate sebelumnya.
              </Alert>
            </Grid>

            {generating && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" gutterBottom>Sedang generate tagihan...</Typography>
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

            {generationResults.failed > 0 && (
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'error.light' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportProblem sx={{ color: 'error.dark' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'error.dark' }}>
                        Detail Kegagalan ({generationResults.failed} item gagal)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell sx={{ fontWeight: 600 }}>No. Akun</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>No. Meteran</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Nama Pelanggan</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Alasan Gagal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {generationResults.detailGagal.map((item, index) => (
                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'error.50' } }}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.NomorAkun || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {item.NomorMeteran || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>{item.namaLengkap || '-'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ErrorOutline sx={{ fontSize: 16, color: 'error.main' }} />
                                  <Typography variant="body2" color="error.main">
                                    {item.alasan}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: generationResults.failed === 0 ? 'success.light' : 'warning.light', color: generationResults.failed === 0 ? 'success.contrastText' : 'warning.contrastText' }}>
                <Typography variant="body1">
                  {generationResults.failed === 0
                    ? '✅ Proses generate tagihan selesai! Semua tagihan berhasil dibuat.'
                    : `⚠️ Proses selesai dengan ${generationResults.failed} kegagalan. Periksa detail di atas dan perbaiki data sebelum generate ulang.`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  if (authLoading || !isAuthenticated) return null;

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
                      setGenerationResults({ total: 0, success: 0, failed: 0, errors: [], detailGagal: [] });
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
