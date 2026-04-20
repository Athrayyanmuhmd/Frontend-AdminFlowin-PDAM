'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Home,
  Badge,
  Work,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  useGetCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '../../../../lib/graphql/hooks/useCustomers';
import { useQuery } from '@apollo/client/react';
import { GET_KONEKSI_DATA_BY_PELANGGAN } from '../../../../lib/graphql/queries/connectionData';

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

export default function CustomerRegistration() {
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

  const { data: koneksiDataResult } = useQuery(GET_KONEKSI_DATA_BY_PELANGGAN, {
    variables: { idPelanggan: editId || '' },
    skip: !editId,
    fetchPolicy: 'network-only',
  });
  const koneksiDataFallback = (koneksiDataResult as any)?.getKoneksiDataByPelanggan;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const loading = creating || updating;

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
    accountStatus: 'active',
  });

  useEffect(() => {
    if (!graphqlCustomer || !isEditMode) return;
    setFormData({
      nik: graphqlCustomer.nik || koneksiDataFallback?.NIK || '',
      name: graphqlCustomer.namaLengkap || '',
      email: graphqlCustomer.email || '',
      phone: graphqlCustomer.noHP || '',
      address: graphqlCustomer.address || koneksiDataFallback?.Alamat || '',
      customerType: graphqlCustomer.customerType || 'rumah_tangga',
      gender: graphqlCustomer.gender || '',
      birthDate: graphqlCustomer.birthDate ? graphqlCustomer.birthDate.split('T')[0] : '',
      occupation: graphqlCustomer.occupation || '',
      accountStatus: graphqlCustomer.accountStatus || 'active',
    });
  }, [graphqlCustomer, koneksiDataFallback, isEditMode]);

  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    if (!formData.nik || formData.nik.length !== 16) {
      setError('NIK harus 16 digit'); return false;
    }
    if (!formData.name || formData.name.length < 3) {
      setError('Nama lengkap minimal 3 karakter'); return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Format email tidak valid'); return false;
    }
    if (!formData.phone || !/^(\+62|62|0)[0-9]{9,12}$/.test(formData.phone)) {
      setError('Format nomor telepon tidak valid'); return false;
    }
    if (!formData.address || formData.address.length < 10) {
      setError('Alamat minimal 10 karakter'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;
    try {
      const inputData = {
        nik: formData.nik,
        namaLengkap: formData.name,
        email: formData.email,
        noHP: formData.phone,
        address: formData.address,
        customerType: formData.customerType,
        gender: formData.gender || null,
        birthDate: formData.birthDate || undefined,
        occupation: formData.occupation || undefined,
        accountStatus: formData.accountStatus,
      };

      if (isEditMode && editId) {
        await updateCustomer({ variables: { id: editId, input: inputData } });
        setSuccess('Data pelanggan berhasil diperbarui!');
      } else {
        const result = await createCustomer({ variables: { input: inputData } });
        setSuccess(`Pelanggan berhasil didaftarkan! ID: ${(result.data as any)?.createPelanggan?._id}`);
      }
      setTimeout(() => router.push('/customers'), 1200);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (loadingCustomer) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan'}>
      {/* ─── Top bar ─── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
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
            {isEditMode && graphqlCustomer && (
              <Typography variant="body2" color="text.secondary">
                {graphqlCustomer.namaLengkap}
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          {isEditMode && (
            <Chip
              size="small"
              label={formData.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
              color={formData.accountStatus === 'active' ? 'success' : 'default'}
              icon={formData.accountStatus === 'active' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
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
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* ─── Informasi Pribadi ─── */}
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
                    label="NIK *"
                    value={formData.nik}
                    onChange={e => handleChange('nik', e.target.value)}
                    inputProps={{ maxLength: 16 }}
                    helperText="Nomor Induk Kependudukan (16 digit)"
                    placeholder="Contoh: 1234567890987654"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nama Lengkap *"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Sesuai KTP"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="contoh@email.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nomor Telepon *"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    helperText="Contoh: 081234567890 atau +6281234567890"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Alamat Lengkap *"
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                    helperText="Alamat lengkap sesuai KTP (minimal 10 karakter)"
                    placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ─── Data Tambahan ─── */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Home color="primary" />
                <Typography variant="h6" fontWeight={600}>Data Tambahan</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Jenis Kelamin</InputLabel>
                    <Select
                      value={formData.gender}
                      onChange={e => handleChange('gender', e.target.value)}
                      label="Jenis Kelamin"
                    >
                      <MenuItem value="">Belum diisi</MenuItem>
                      <MenuItem value="L">Laki-laki</MenuItem>
                      <MenuItem value="P">Perempuan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Jenis Pelanggan *</InputLabel>
                    <Select
                      value={formData.customerType}
                      onChange={e => handleChange('customerType', e.target.value)}
                      label="Jenis Pelanggan *"
                    >
                      <MenuItem value="rumah_tangga">Rumah Tangga</MenuItem>
                      <MenuItem value="komersial">Komersial</MenuItem>
                      <MenuItem value="industri">Industri</MenuItem>
                      <MenuItem value="sosial">Sosial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tanggal Lahir"
                    type="date"
                    value={formData.birthDate}
                    onChange={e => handleChange('birthDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Opsional"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pekerjaan"
                    value={formData.occupation}
                    onChange={e => handleChange('occupation', e.target.value)}
                    helperText="Opsional"
                    placeholder="Contoh: PNS, Wiraswasta, dll."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ─── Sidebar: Ringkasan & Status ─── */}
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
                  <Typography fontWeight={600}>{formData.name || '—'}</Typography>
                </InfoRow>
                <InfoRow label="NIK">
                  <Typography variant="body2" fontFamily="monospace">{formData.nik || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Email">
                  <Typography variant="body2">{formData.email || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Telepon">
                  <Typography variant="body2">{formData.phone || '—'}</Typography>
                </InfoRow>
                <InfoRow label="Jenis Pelanggan">
                  <Chip
                    size="small"
                    label={
                      formData.customerType === 'rumah_tangga' ? 'Rumah Tangga' :
                      formData.customerType === 'komersial' ? 'Komersial' :
                      formData.customerType === 'industri' ? 'Industri' : 'Sosial'
                    }
                    color="info"
                    variant="outlined"
                  />
                </InfoRow>
              </Box>
            </CardContent>
          </Card>

          {/* Status Akun (hanya edit mode) */}
          {isEditMode && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Work color="primary" />
                  <Typography variant="h6" fontWeight={600}>Status Akun</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.accountStatus}
                    onChange={e => handleChange('accountStatus', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Tidak Aktif</MenuItem>
                    <MenuItem value="suspended">Ditangguhkan</MenuItem>
                  </Select>
                </FormControl>
                <Paper
                  sx={{
                    mt: 2, p: 1.5,
                    bgcolor: formData.accountStatus === 'active' ? 'success.50' : 'warning.50',
                    border: 1,
                    borderColor: formData.accountStatus === 'active' ? 'success.200' : 'warning.200',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {formData.accountStatus === 'active'
                      ? 'Pelanggan dapat mengakses layanan dan menerima tagihan.'
                      : 'Pelanggan tidak dapat mengakses layanan.'}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}

          {!isEditMode && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                💡 Setelah pendaftaran, pelanggan perlu mengajukan <strong>Data Sambungan</strong> (KTP, KK, IMB) untuk proses aktivasi koneksi air.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </AdminLayout>
  );
}
