'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CircularProgress as SuspenseFallback } from '@mui/material';
import { useAdmin } from '../../../layouts/AdminProvider';
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
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Person,
  Home,
  Badge,
  Cancel,
  CheckCircle,
  Assignment,
  InfoOutlined,
  PersonAdd,
  Key,
  NavigateNext,
  Visibility,
  ContentCopy,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  useGetCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '../../../../lib/graphql/hooks/useCustomers';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_KONEKSI_DATA_BY_PELANGGAN } from '../../../../lib/graphql/queries/connectionData';
import { CREATE_KONEKSI_DATA, VERIFY_CONNECTION_DATA } from '../../../../lib/graphql/mutations/connectionData';

const STEPS = ['Data Pelanggan', 'Data Sambungan'];

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Box mt={0.5}>{children}</Box>
    </Box>
  );
}

function CustomerRegistrationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const { customer: graphqlCustomer, loading: loadingCustomer } = useGetCustomer(editId || '');
  const { createCustomer, loading: creating } = useCreateCustomer();
  const { updateCustomer, loading: updating } = useUpdateCustomer();
  const [createKoneksiData, { loading: creatingKoneksi }] = useMutation(CREATE_KONEKSI_DATA);
  const [verifyKoneksiData, { loading: verifying }] = useMutation(VERIFY_CONNECTION_DATA);

  const { data: koneksiDataResult } = useQuery(GET_KONEKSI_DATA_BY_PELANGGAN, {
    variables: { idPelanggan: editId || '' },
    skip: !editId,
    fetchPolicy: 'cache-and-network',
  });
  const koneksiDataFallback = (koneksiDataResult as any)?.getKoneksiDataByPelanggan;

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{
    pelangganId: string;
    koneksiId: string | null;
    namaLengkap: string;
    email: string;
    nik: string;
    verifikasiLangsung: boolean;
  } | null>(null);

  // Step 1: Data Pelanggan
  const [pelangganForm, setPelangganForm] = useState({
    nik: '',
    name: '',
    email: '',
    phone: '',
    customerType: '',
    birthDate: '',
    accountStatus: 'inactive',
  });

  // Step 2: Data Sambungan
  const [sambunganForm, setSambunganForm] = useState({
    noKK: '',
    imb: '',
    alamat: '',
    kelurahan: '',
    kecamatan: '',
    luasBangunan: '',
    catatan: '',
    verifikasiLangsung: false,
  });

  useEffect(() => {
    if (!graphqlCustomer || !isEditMode) return;
    setPelangganForm({
      nik: graphqlCustomer.nik || koneksiDataFallback?.NIK || '',
      name: graphqlCustomer.namaLengkap || '',
      email: graphqlCustomer.email || '',
      phone: graphqlCustomer.noHP || '',
      customerType: graphqlCustomer.customerType || 'rumah_tangga',
      birthDate: graphqlCustomer.birthDate ? graphqlCustomer.birthDate.split('T')[0] : '',
      accountStatus: graphqlCustomer.accountStatus || 'inactive',
    });
    if (koneksiDataFallback) {
      setSambunganForm(prev => ({
        ...prev,
        noKK: koneksiDataFallback.NoKK || '',
        imb: koneksiDataFallback.IMB || '',
        alamat: koneksiDataFallback.Alamat || '',
        kelurahan: koneksiDataFallback.Kelurahan || '',
        kecamatan: koneksiDataFallback.Kecamatan || '',
        luasBangunan: koneksiDataFallback.LuasBangunan?.toString() || '',
      }));
    }
  }, [graphqlCustomer, koneksiDataFallback, isEditMode]);

  const handlePelangganChange = (field: string, value: string) =>
    setPelangganForm(prev => ({ ...prev, [field]: value }));

  const handleSambunganChange = (field: string, value: string | boolean) =>
    setSambunganForm(prev => ({ ...prev, [field]: value }));

  const validateStep1 = (): boolean => {
    if (!pelangganForm.nik || pelangganForm.nik.length !== 16) {
      setError('NIK harus 16 digit'); return false;
    }
    if (!pelangganForm.name || pelangganForm.name.length < 3) {
      setError('Nama lengkap minimal 3 karakter'); return false;
    }
    if (!pelangganForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pelangganForm.email)) {
      setError('Format email tidak valid'); return false;
    }
    if (!pelangganForm.phone || !/^(\+62|62|0)[0-9]{9,12}$/.test(pelangganForm.phone)) {
      setError('Format nomor telepon tidak valid'); return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!sambunganForm.noKK || sambunganForm.noKK.trim().length !== 16) {
      setError('Nomor KK harus 16 digit'); return false;
    }
    if (!sambunganForm.imb) {
      setError('Nomor IMB wajib diisi'); return false;
    }
    if (!sambunganForm.alamat || sambunganForm.alamat.length < 5) {
      setError('Alamat lengkap wajib diisi'); return false;
    }
    if (!sambunganForm.kelurahan) {
      setError('Kelurahan wajib diisi'); return false;
    }
    if (!sambunganForm.kecamatan) {
      setError('Kecamatan wajib diisi'); return false;
    }
    if (!sambunganForm.luasBangunan || isNaN(Number(sambunganForm.luasBangunan))) {
      setError('Luas bangunan harus berupa angka'); return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (activeStep === 0 && !validateStep1()) return;
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      // Edit mode — hanya update data pelanggan, skip validasi sambungan
      if (isEditMode && editId) {
        await updateCustomer({
          variables: {
            id: editId,
            input: {
              nik: pelangganForm.nik,
              namaLengkap: pelangganForm.name,
              email: pelangganForm.email,
              noHP: pelangganForm.phone,
              customerType: pelangganForm.customerType,
              birthDate: pelangganForm.birthDate || undefined,
              accountStatus: pelangganForm.accountStatus,
            },
          },
        });
        setSuccess('Data pelanggan berhasil diperbarui!');
        setTimeout(() => router.push(`/customers/detail/${editId}`), 1200);
        return;
      }

      // Create mode — validasi sambungan dulu, lalu buat Pengguna + KoneksiData
      if (!validateStep2()) return;

      const pelangganResult = await createCustomer({
        variables: {
          input: {
            nik: pelangganForm.nik,
            namaLengkap: pelangganForm.name,
            email: pelangganForm.email,
            noHP: pelangganForm.phone,
            customerType: pelangganForm.customerType,
            birthDate: pelangganForm.birthDate || undefined,
            accountStatus: pelangganForm.accountStatus,
          },
        },
      });

      const pelangganId = (pelangganResult.data as any)?.createPelanggan?._id;
      if (!pelangganId) throw new Error('Gagal mendapatkan ID pelanggan baru');

      // Buat KoneksiData dengan IdPelanggan
      const koneksiResult = await createKoneksiData({
        variables: {
          input: {
            IdPelanggan: pelangganId,
            NIK: pelangganForm.nik.trim(),
            NoKK: sambunganForm.noKK.trim(),
            IMB: sambunganForm.imb.trim(),
            Alamat: sambunganForm.alamat,
            Kelurahan: sambunganForm.kelurahan,
            Kecamatan: sambunganForm.kecamatan,
            LuasBangunan: Number(sambunganForm.luasBangunan),
            catatan: sambunganForm.catatan || null,
          },
        },
      });

      const koneksiId = (koneksiResult.data as any)?.createKoneksiData?._id;

      // Sync alamat dari sambungan ke User.address agar tampil di list pelanggan
      const userUpdateInput: Record<string, any> = { address: sambunganForm.alamat };

      // Jika admin centang "Verifikasi Langsung" — auto-approve koneksidatas + set isVerified
      if (sambunganForm.verifikasiLangsung && koneksiId) {
        await verifyKoneksiData({
          variables: {
            id: koneksiId,
            status: 'APPROVED',
            catatan: 'Verifikasi langsung — pelanggan hadir membawa dokumen asli ke kantor PERUMDAM.',
          },
        });
        userUpdateInput.isVerified = true;
      }

      await updateCustomer({
        variables: { id: pelangganId, input: userUpdateInput },
      });

      setRegistrationResult({
        pelangganId,
        koneksiId: koneksiId || null,
        namaLengkap: pelangganForm.name,
        email: pelangganForm.email,
        nik: pelangganForm.nik,
        verifikasiLangsung: sambunganForm.verifikasiLangsung,
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  const loading = creating || updating || creatingKoneksi || verifying;

  if (authLoading || !isAuthenticated) return null;

  // ─── Sukses Screen ───
  if (registrationResult) {
    return (
      <AdminLayout title="Registrasi Berhasil">
        <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4 }}>
          {/* Header sukses */}
          <Card sx={{ mb: 3, border: 2, borderColor: 'success.main' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
                Pelanggan Berhasil Didaftarkan!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {registrationResult.namaLengkap} telah terdaftar sebagai pelanggan baru.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={registrationResult.verifikasiLangsung ? 'Pengajuan: Langsung Disetujui' : 'Pengajuan: Menunggu Verifikasi'}
                  color={registrationResult.verifikasiLangsung ? 'success' : 'warning'}
                  size="small"
                />
                {registrationResult.verifikasiLangsung && (
                  <Chip label="Identitas Terverifikasi" color="info" size="small" icon={<CheckCircle />} />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Kredensial login */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Key color="primary" />
                <Typography variant="h6" fontWeight={600}>Kredensial Login Pelanggan</Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Sampaikan informasi berikut kepada pelanggan untuk login ke aplikasi Aqualink. Minta pelanggan mengganti password setelah login pertama.
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                      {registrationResult.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Password sementara</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                        {registrationResult.nik}
                      </Typography>
                      <Tooltip title="NIK digunakan sebagai password sementara">
                        <Key sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Langkah Selanjutnya</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {registrationResult.verifikasiLangsung
                  ? 'Pengajuan sambungan sudah disetujui. Lanjutkan ke penjadwalan survei lapangan.'
                  : 'Verifikasi dokumen pelanggan terlebih dahulu sebelum menjadwalkan survei.'}
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {registrationResult.verifikasiLangsung && registrationResult.koneksiId && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    endIcon={<NavigateNext />}
                    onClick={() => router.push(`/operations/survey-data/create?connectionId=${registrationResult.koneksiId}`)}
                  >
                    Jadwalkan Survei Lapangan
                  </Button>
                )}
                {!registrationResult.verifikasiLangsung && registrationResult.koneksiId && (
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    size="large"
                    endIcon={<NavigateNext />}
                    onClick={() => router.push(`/operations/connection-data/${registrationResult.koneksiId}`)}
                  >
                    Verifikasi Dokumen Pengajuan
                  </Button>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Visibility />}
                  onClick={() => router.push(`/customers/detail/${registrationResult.pelangganId}`)}
                >
                  Lihat Detail Pelanggan
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    setRegistrationResult(null);
                    setActiveStep(0);
                    setPelangganForm({ nik: '', name: '', email: '', phone: '', customerType: 'rumah_tangga', birthDate: '', accountStatus: 'active' });
                    setSambunganForm({ noKK: '', imb: '', alamat: '', kelurahan: '', kecamatan: '', luasBangunan: '', catatan: '', verifikasiLangsung: false });
                  }}
                >
                  Daftarkan Pelanggan Lain
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  fullWidth
                  onClick={() => router.push('/customers')}
                >
                  Kembali ke Daftar Pelanggan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </AdminLayout>
    );
  }

  if (loadingCustomer) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}>
      {/* ─── Top bar ─── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            onClick={() => router.push(isEditMode ? `/customers/detail/${editId}` : '/customers')}
          >
            Kembali
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? graphqlCustomer?.namaLengkap : 'Pendaftaran pelanggan datang langsung ke kantor'}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          {isEditMode && (
            <Chip
              size="small"
              label={pelangganForm.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
              color={pelangganForm.accountStatus === 'active' ? 'success' : 'default'}
              icon={pelangganForm.accountStatus === 'active' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
            />
          )}
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Cancel />}
            onClick={() => router.push(isEditMode ? `/customers/detail/${editId}` : '/customers')}
          >
            Batal
          </Button>
          {activeStep === 0 && !isEditMode ? (
            <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
              Selanjutnya
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
            </Button>
          )}
        </Box>
      </Box>

      {/* ─── Stepper (hanya create mode) ─── */}
      {!isEditMode && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep}>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* ─── STEP 1: Data Pelanggan ─── */}
        {(activeStep === 0 || isEditMode) && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <Person color="primary" />
                  <Typography variant="h6" fontWeight={600}>Informasi Pribadi</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="NIK (KTP) *"
                      value={pelangganForm.nik}
                      onChange={e => handlePelangganChange('nik', e.target.value)}
                      inputProps={{ maxLength: 16 }}
                      helperText="Nomor Induk Kependudukan — 16 digit"
                      placeholder="1234567890987654"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nama Lengkap *"
                      value={pelangganForm.name}
                      onChange={e => handlePelangganChange('name', e.target.value)}
                      placeholder="Sesuai KTP"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      type="email"
                      value={pelangganForm.email}
                      onChange={e => handlePelangganChange('email', e.target.value)}
                      placeholder="contoh@email.com"
                      helperText="Digunakan untuk login aplikasi pelanggan"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nomor Telepon *"
                      value={pelangganForm.phone}
                      onChange={e => handlePelangganChange('phone', e.target.value)}
                      helperText="Contoh: 081234567890"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Jenis Pelanggan (opsional)</InputLabel>
                      <Select
                        value={pelangganForm.customerType}
                        onChange={e => handlePelangganChange('customerType', e.target.value)}
                        label="Jenis Pelanggan (opsional)"
                      >
                        <MenuItem value=''>Belum Ditentukan — ditentukan setelah survei</MenuItem>
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
                      label="Tanggal Lahir"
                      type="date"
                      value={pelangganForm.birthDate}
                      onChange={e => handlePelangganChange('birthDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="Opsional"
                    />
                  </Grid>
                  {isEditMode && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status Akun</InputLabel>
                        <Select
                          value={pelangganForm.accountStatus}
                          onChange={e => handlePelangganChange('accountStatus', e.target.value)}
                          label="Status Akun"
                        >
                          <MenuItem value="active">Aktif</MenuItem>
                          <MenuItem value="inactive">Tidak Aktif</MenuItem>
                          <MenuItem value="suspended">Ditangguhkan</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ─── STEP 2: Data Sambungan ─── */}
        {activeStep === 1 && !isEditMode && (
          <Grid item xs={12} md={8}>
            {/* Dokumen Identitas */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <Assignment color="primary" />
                  <Typography variant="h6" fontWeight={600}>Dokumen Identitas</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="NIK (KTP) *"
                      value={pelangganForm.nik}
                      disabled
                      helperText="Diambil dari data pelanggan"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="No. Kartu Keluarga (KK) *"
                      value={sambunganForm.noKK}
                      onChange={e => handleSambunganChange('noKK', e.target.value)}
                      inputProps={{ maxLength: 16 }}
                      helperText="Nomor KK — 16 digit"
                      placeholder="3215469780879465"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="No. IMB (Izin Mendirikan Bangunan) *"
                      value={sambunganForm.imb}
                      onChange={e => handleSambunganChange('imb', e.target.value)}
                      helperText="Nomor IMB bangunan"
                      placeholder="Contoh: 345"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Alamat & Properti */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <Home color="primary" />
                  <Typography variant="h6" fontWeight={600}>Alamat & Properti</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Alamat Lengkap *"
                      multiline
                      rows={3}
                      value={sambunganForm.alamat}
                      onChange={e => handleSambunganChange('alamat', e.target.value)}
                      placeholder="Jl. Contoh No. 1"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Kelurahan *"
                      value={sambunganForm.kelurahan}
                      onChange={e => handleSambunganChange('kelurahan', e.target.value)}
                      placeholder="Prada"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Kecamatan *"
                      value={sambunganForm.kecamatan}
                      onChange={e => handleSambunganChange('kecamatan', e.target.value)}
                      placeholder="Syiah Kuala"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Luas Bangunan (m²) *"
                      type="number"
                      value={sambunganForm.luasBangunan}
                      onChange={e => handleSambunganChange('luasBangunan', e.target.value)}
                      inputProps={{ min: 1 }}
                      placeholder="128"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Catatan Tambahan"
                      multiline
                      rows={2}
                      value={sambunganForm.catatan}
                      onChange={e => handleSambunganChange('catatan', e.target.value)}
                      placeholder="Catatan khusus jika ada (opsional)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Verifikasi Langsung */}
            <Paper
              variant="outlined"
              sx={{
                mt: 3, p: 2.5, borderRadius: 2,
                borderColor: sambunganForm.verifikasiLangsung ? 'success.main' : 'divider',
                bgcolor: sambunganForm.verifikasiLangsung ? 'success.50' : 'background.paper',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sambunganForm.verifikasiLangsung}
                    onChange={e => handleSambunganChange('verifikasiLangsung', e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Verifikasi Langsung (Walk-in)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Centang jika pelanggan hadir membawa dokumen asli. Pengajuan akan langsung berstatus Disetujui tanpa menunggu antrean verifikasi.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Grid>
        )}

        {/* ─── Sidebar Ringkasan ─── */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Badge color="primary" />
                <Typography variant="h6" fontWeight={600}>Ringkasan</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Box display="flex" flexDirection="column" gap={2.5}>
                <InfoRow label="Nama">
                  <Typography fontWeight={600}>{pelangganForm.name || '—'}</Typography>
                </InfoRow>
                <InfoRow label="NIK">
                  <Typography variant="body2" fontFamily="monospace">{pelangganForm.nik || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Email">
                  <Typography variant="body2">{pelangganForm.email || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Telepon">
                  <Typography variant="body2">{pelangganForm.phone || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Jenis Pelanggan">
                  <Chip
                    size="small"
                    label={
                      pelangganForm.customerType === 'rumah_tangga' ? 'Rumah Tangga' :
                      pelangganForm.customerType === 'komersial' ? 'Komersial' :
                      pelangganForm.customerType === 'industri' ? 'Industri' : 'Sosial'
                    }
                    color="info"
                    variant="outlined"
                  />
                </InfoRow>
                {activeStep === 1 && !isEditMode && (
                  <>
                    <Divider />
                    <InfoRow label="No. KK">
                      <Typography variant="body2" fontFamily="monospace">{sambunganForm.noKK || '—'}</Typography>
                    </InfoRow>
                    <InfoRow label="IMB">
                      <Typography variant="body2">{sambunganForm.imb || '—'}</Typography>
                    </InfoRow>
                    <InfoRow label="Alamat">
                      <Typography variant="body2">{sambunganForm.alamat || '—'}</Typography>
                    </InfoRow>
                    <InfoRow label="Kelurahan / Kecamatan">
                      <Typography variant="body2">
                        {sambunganForm.kelurahan && sambunganForm.kecamatan
                          ? `${sambunganForm.kelurahan}, ${sambunganForm.kecamatan}`
                          : '—'}
                      </Typography>
                    </InfoRow>
                    <InfoRow label="Luas Bangunan">
                      <Typography variant="body2">
                        {sambunganForm.luasBangunan ? `${sambunganForm.luasBangunan} m²` : '—'}
                      </Typography>
                    </InfoRow>
                    <InfoRow label="Status Pengajuan">
                      <Chip
                        size="small"
                        label={sambunganForm.verifikasiLangsung ? 'Akan Langsung Disetujui' : 'Menunggu Verifikasi'}
                        color={sambunganForm.verifikasiLangsung ? 'success' : 'warning'}
                      />
                    </InfoRow>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Info walk-in */}
          {!isEditMode && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1 }}>
              <Box display="flex" gap={1} alignItems="flex-start">
                <InfoOutlined sx={{ fontSize: 18, color: 'info.main', mt: 0.2 }} />
                <Typography variant="body2" color="text.secondary">
                  {activeStep === 0
                    ? 'Langkah berikutnya: isi data dokumen sambungan (KK, IMB, alamat lokasi pemasangan).'
                    : 'Setelah disimpan, data sambungan akan diteruskan ke alur survei dan pemasangan meteran.'}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Tombol Kembali step (hanya step 2) */}
          {activeStep === 1 && !isEditMode && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ mt: 2 }}
              onClick={() => { setError(null); setActiveStep(0); }}
            >
              Kembali ke Data Pelanggan
            </Button>
          )}
        </Grid>
      </Grid>
    </AdminLayout>
  );
}

export default function CustomerRegistration() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <CustomerRegistrationInner />
    </Suspense>
  );
}
