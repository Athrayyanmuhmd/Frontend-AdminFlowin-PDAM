// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Person, Home, Save, Cancel, CheckCircle } from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  useGetCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '../../../../lib/graphql/hooks/useCustomers';

const steps = ['Informasi Pribadi', 'Data Tambahan', 'Konfirmasi'];

export default function CustomerRegistration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  // ==================== GraphQL Hooks ====================
  const { customer: graphqlCustomer, loading: loadingCustomer } = useGetCustomer(
    editId || ''
  );
  const { createCustomer, loading: creating } = useCreateCustomer();
  const { updateCustomer, loading: updating } = useUpdateCustomer();

  // ==================== Local State ====================
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loading = creating || updating;
  const loadingData = loadingCustomer;

  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    customerType: 'rumah_tangga',
    gender: '',
    birthDate: '',
    occupation: '',
    accountStatus: 'active', // Status: 'active', 'inactive', 'suspended'
  });

  // Pre-populate form when GraphQL data is loaded (edit mode)
  useEffect(() => {
    if (!graphqlCustomer || !isEditMode) return;

    console.log('📥 GraphQL Customer Data:', graphqlCustomer);

    // Pre-populate form with existing data from GraphQL
    setFormData({
      nik: graphqlCustomer.nik || '',
      name: graphqlCustomer.namaLengkap || '',
      email: graphqlCustomer.email || '',
      phone: graphqlCustomer.noHP || '',
      address: graphqlCustomer.address || '',
      customerType: graphqlCustomer.customerType || 'rumah_tangga',
      gender: graphqlCustomer.gender || '',
      birthDate: graphqlCustomer.birthDate
        ? graphqlCustomer.birthDate.split('T')[0]
        : '',
      occupation: graphqlCustomer.occupation || '',
      accountStatus: graphqlCustomer.accountStatus || 'active',
    });

    console.log('✅ Form pre-populated from GraphQL:', {
      nik: graphqlCustomer.nik,
      name: graphqlCustomer.namaLengkap,
      email: graphqlCustomer.email,
      phone: graphqlCustomer.noHP,
      address: graphqlCustomer.address,
    });
  }, [graphqlCustomer, isEditMode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    switch (step) {
      case 0:
        if (!formData.nik || formData.nik.length !== 16) {
          setError('NIK harus 16 digit');
          return false;
        }
        if (!formData.name || formData.name.length < 3) {
          setError('Nama lengkap minimal 3 karakter');
          return false;
        }
        if (
          !formData.email ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
          setError('Format email tidak valid');
          return false;
        }
        if (
          !formData.phone ||
          !/^(\+62|62|0)[0-9]{9,12}$/.test(formData.phone)
        ) {
          setError('Format nomor telepon tidak valid');
          return false;
        }
        return true;
      case 1:
        if (!formData.address || formData.address.length < 10) {
          setError('Alamat minimal 10 karakter');
          return false;
        }
        if (!formData.gender) {
          setError('Jenis kelamin harus dipilih');
          return false;
        }
        if (!formData.customerType) {
          setError('Jenis pelanggan harus dipilih');
          return false;
        }
        return true;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setError('Mohon lengkapi semua field yang diperlukan');
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleSubmit = async (shouldRedirect: boolean = true) => {
    try {
      setError(null);

      // Create request data matching GraphQL schema
      const inputData = {
        nik: formData.nik,
        namaLengkap: formData.name,
        email: formData.email,
        noHP: formData.phone,
        address: formData.address,
        customerType: formData.customerType,
        gender: formData.gender,
        birthDate: formData.birthDate || undefined,
        occupation: formData.occupation || undefined,
        accountStatus: formData.accountStatus,
      };

      console.log(
        isEditMode ? '📝 GraphQL Update:' : '📤 GraphQL Create:',
        inputData
      );

      let result;
      if (isEditMode && editId) {
        // Update existing customer via GraphQL
        result = await updateCustomer({
          variables: {
            id: editId,
            input: inputData,
          },
        });
        console.log('✅ Customer updated via GraphQL:', result);
        setSuccess(
          shouldRedirect
            ? `Pelanggan berhasil diperbarui! Mengalihkan...`
            : `Data berhasil disimpan!`
        );
      } else {
        // Create new customer via GraphQL
        result = await createCustomer({
          variables: {
            input: inputData,
          },
        });
        console.log('✅ Customer created via GraphQL:', result);
        setSuccess(
          `Pelanggan berhasil didaftarkan! ID: ${result.data?.createPelanggan?._id}`
        );
      }

      // Only redirect if requested (final submit)
      if (shouldRedirect) {
        setTimeout(() => {
          router.push('/customers');
        }, 2000);
      } else {
        // Clear success message after 3 seconds for intermediate saves
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }

      // Reset form if creating new (not editing)
      if (!isEditMode && shouldRedirect) {
        setTimeout(() => {
          setFormData({
            nik: '',
            name: '',
            email: '',
            phone: '',
            address: '',
            customerType: 'rumah_tangga',
            gender: '',
            birthDate: '',
            occupation: '',
            accountStatus: 'active',
          });
          setActiveStep(0);
          setSuccess(null);
        }, 5000);
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('📋 Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      });

      const errorMsg = err.response?.data?.message || err.message;
      const statusCode = err.response?.status ? ` (${err.response.status})` : '';
      setError(`Gagal mendaftarkan pelanggan${statusCode}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Person color='primary' />
                Informasi Pribadi
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='NIK'
                value={formData.nik}
                onChange={e => handleInputChange('nik', e.target.value)}
                required
                inputProps={{ maxLength: 16 }}
                helperText='Nomor Induk Kependudukan (16 digit)'
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Nama Lengkap'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Nomor Telepon'
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                required
                helperText='Contoh: 081234567890 atau +6281234567890'
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ display: 'flex', alignments: 'center', gap: 1 }}
              >
                <Home color='primary' />
                Data Tambahan
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Alamat Lengkap'
                multiline
                rows={3}
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                required
                helperText='Alamat lengkap sesuai KTP (minimal 10 karakter)'
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Jenis Kelamin</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  label='Jenis Kelamin'
                >
                  <MenuItem value='L'>Laki-laki</MenuItem>
                  <MenuItem value='P'>Perempuan</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Jenis Pelanggan</InputLabel>
                <Select
                  value={formData.customerType}
                  onChange={e =>
                    handleInputChange('customerType', e.target.value)
                  }
                  label='Jenis Pelanggan'
                >
                  <MenuItem value='rumah_tangga'>Rumah Tangga</MenuItem>
                  <MenuItem value='komersial'>Komersial</MenuItem>
                  <MenuItem value='industri'>Industri</MenuItem>
                  <MenuItem value='sosial'>Sosial</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Tanggal Lahir'
                type='date'
                value={formData.birthDate}
                onChange={e => handleInputChange('birthDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText='Opsional'
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Pekerjaan'
                value={formData.occupation}
                onChange={e => handleInputChange('occupation', e.target.value)}
                helperText='Opsional'
              />
            </Grid>

            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: formData.accountStatus === 'active' ? 'success.light' : 'error.light',
                  border: 3,
                  borderColor: formData.accountStatus === 'active' ? '#2e7d32' : '#d32f2f',
                  transition: 'all 0.3s ease',
                  opacity: 0.95
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.accountStatus === 'active'}
                      onChange={e => handleInputChange('accountStatus', e.target.checked ? 'active' : 'inactive')}
                      color='success'
                    />
                  }
                  label={
                    <Box>
                      <Typography variant='body1' sx={{ fontWeight: 500 }}>
                        Status Pelanggan: {formData.accountStatus === 'active' ? '✅ Aktif' : '❌ Tidak Aktif'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formData.accountStatus === 'active'
                          ? 'Pelanggan dapat menggunakan layanan'
                          : 'Pelanggan tidak dapat menggunakan layanan'}
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper
                sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}
              >
                <Typography variant='body2'>
                  💡 <strong>Catatan:</strong> Data pelanggan hanya mencakup
                  informasi dasar. Untuk aktivasi koneksi, pelanggan perlu
                  mengajukan Connection Data (dokumen KTP, KK, IMB, dll) melalui
                  sistem terpisah.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CheckCircle color='primary' />
                Konfirmasi Data
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Data Pelanggan
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      NIK:
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {formData.nik}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Nama Lengkap:
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {formData.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Email:
                    </Typography>
                    <Typography variant='body1'>{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Nomor Telepon:
                    </Typography>
                    <Typography variant='body1'>{formData.phone}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Alamat:
                    </Typography>
                    <Typography variant='body1'>{formData.address}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Jenis Pelanggan:
                    </Typography>
                    <Typography variant='body1'>
                      {formData.customerType === 'rumah_tangga' &&
                        'Rumah Tangga'}
                      {formData.customerType === 'komersial' && 'Komersial'}
                      {formData.customerType === 'industri' && 'Industri'}
                      {formData.customerType === 'sosial' && 'Sosial'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Jenis Kelamin:
                    </Typography>
                    <Typography variant='body1'>
                      {formData.gender === 'L' && 'Laki-laki'}
                      {formData.gender === 'P' && 'Perempuan'}
                      {!formData.gender && '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Tanggal Lahir:
                    </Typography>
                    <Typography variant='body1'>
                      {formData.birthDate || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Pekerjaan:
                    </Typography>
                    <Typography variant='body1'>
                      {formData.occupation || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Status Pelanggan:
                    </Typography>
                    <Typography
                      variant='body1'
                      sx={{
                        fontWeight: 600,
                        color: formData.accountStatus === 'active' ? 'success.main' : 'error.main'
                      }}
                    >
                      {formData.accountStatus === 'active' ? '✅ Aktif' : '❌ Tidak Aktif'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity='info'>
                Pelanggan akan didaftarkan dengan status <strong>active</strong>
                . Untuk aktivasi koneksi air, pelanggan perlu mengajukan{' '}
                <strong>Connection Data</strong> (dokumen KTP, KK, IMB, dll)
                melalui sistem terpisah.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Alert severity='warning'>
                Pastikan semua data sudah benar sebelum menyimpan. Data yang
                sudah disimpan dapat diubah melalui menu Edit Pelanggan.
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  // Show loading indicator while fetching data in edit mode
  if (loadingData) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Pelanggan' : 'Registrasi Pelanggan'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Pelanggan' : 'Registrasi Pelanggan'}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' sx={{ fontWeight: 600, mb: 2 }}>
          {isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>{renderStepContent(activeStep)}</Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              {/* Left side buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Batal - Always visible */}
                <Button
                  onClick={() => router.push('/customers')}
                  startIcon={<Cancel />}
                  color="error"
                  variant="outlined"
                >
                  Batal
                </Button>

                {/* Kembali - Only visible if not on first step */}
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Kembali
                  </Button>
                )}
              </Box>

              {/* Right side buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Simpan - Visible in edit mode on all steps except last (since last step has final submit) */}
                {isEditMode && activeStep < steps.length - 1 && (
                  <Button
                    variant="outlined"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                )}

                {/* Selanjutnya or Final Submit */}
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant='contained'
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  >
                    {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan & Daftar'}
                  </Button>
                ) : (
                  <Button
                    variant='contained'
                    onClick={handleNext}
                    endIcon={<CheckCircle />}
                  >
                    Selanjutnya
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
