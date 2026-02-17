'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, CheckCircle, Speed } from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import {
  getConnectionDataById,
  ConnectionData,
} from '../../../../services/connectionData.service';
import API from '../../../../utils/API';

interface KelompokPelanggan {
  _id: string;
  namaKelompok: string;
  hargaPenggunaanDibawah10: number;
  hargaPenggunaanDiatas10: number;
  biayaBeban: number;
}

export default function CreateMeteran() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole } = useAdmin();
  const connectionId = searchParams.get('connectionId');

  const [connectionData, setConnectionData] = useState<ConnectionData | null>(
    null
  );
  const [kelompokList, setKelompokList] = useState<KelompokPelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [noMeteran, setNoMeteran] = useState('');
  const [kelompokPelangganId, setKelompokPelangganId] = useState('');

  useEffect(() => {
    if (!connectionId) {
      setError('Connection ID tidak ditemukan');
      setLoading(false);
      return;
    }

    fetchData();
  }, [connectionId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch connection data
      const connResponse = await getConnectionDataById(connectionId!);
      let detailData: ConnectionData | null = null;

      if (connResponse.data) {
        const responseData: any = connResponse.data;
        if (responseData.data) {
          detailData = responseData.data;
        } else if (responseData._id) {
          detailData = responseData;
        }
      }

      if (detailData) {
        setConnectionData(detailData);

        // Validations
        if (!detailData.rabConnectionId) {
          setError('RAB belum dibuat');
        }

        if (!detailData.isVerifiedByData) {
          setError('Connection data belum diverifikasi oleh admin');
        }
      } else {
        setError('Data tidak ditemukan');
      }

      // Fetch kelompok pelanggan list
      const kelompokResponse = await API.get('/kelompok-pelanggan');
      const kelompokData =
        kelompokResponse.data.data || kelompokResponse.data || [];
      setKelompokList(kelompokData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!noMeteran) {
        setError('Nomor meteran wajib diisi');
        setSubmitting(false);
        return;
      }

      if (!kelompokPelangganId) {
        setError('Kelompok pelanggan wajib dipilih');
        setSubmitting(false);
        return;
      }

      // Prepare data
      const submitData = {
        connectionDataId: connectionId!,
        userId: connectionData!.userId._id,
        noMeteran: noMeteran,
        kelompokPelangganId: kelompokPelangganId,
      };

      console.log('Submitting meteran data...', submitData);
      const response = await API.post('/meteran', submitData);
      console.log('Meteran created:', response);

      setSuccess(
        'Meteran berhasil dibuat dan pelanggan berhasil di-assign ke kelompok'
      );
      setTimeout(() => {
        router.push(`/operations/connection-data/${connectionId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating meteran:', err);
      setError(err.response?.data?.message || 'Gagal membuat meteran');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error && !connectionData) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{error}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>
              Tambah Meteran & Assign Kelompok
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              NIK: {connectionData?.nik} - {connectionData?.userId?.namaLengkap}
            </Typography>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Meteran Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Informasi Meteran
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label='Nomor Meteran'
                        value={noMeteran}
                        onChange={e => setNoMeteran(e.target.value)}
                        required
                        placeholder='Contoh: MTR-2024-0001'
                        helperText='Masukkan nomor unik meteran'
                        InputProps={{
                          startAdornment: (
                            <Speed sx={{ mr: 1, color: 'action.active' }} />
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Kelompok Pelanggan */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Kelompok Pelanggan
                  </Typography>
                  <Typography variant='body2' color='text.secondary' paragraph>
                    Pilih kelompok pelanggan yang sesuai. Tarif akan mengikuti
                    kelompok yang dipilih.
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Pilih Kelompok Pelanggan</InputLabel>
                    <Select
                      value={kelompokPelangganId}
                      label='Pilih Kelompok Pelanggan'
                      onChange={e => setKelompokPelangganId(e.target.value)}
                    >
                      <MenuItem value=''>
                        <em>-- Pilih Kelompok --</em>
                      </MenuItem>
                      {kelompokList.map(kelompok => (
                        <MenuItem key={kelompok._id} value={kelompok._id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant='body1' fontWeight='bold'>
                              {kelompok.namaKelompok}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {'<'}10m³:{' '}
                              {formatCurrency(
                                kelompok.hargaPenggunaanDibawah10
                              )}
                              /m³
                              {' | '}
                              {'>'}10m³:{' '}
                              {formatCurrency(kelompok.hargaPenggunaanDiatas10)}
                              /m³
                              {kelompok.biayaBeban &&
                                ` | Biaya Beban: ${formatCurrency(kelompok.biayaBeban)}`}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Show selected kelompok details */}
                  {kelompokPelangganId && (
                    <Box
                      sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}
                    >
                      {kelompokList
                        .filter(k => k._id === kelompokPelangganId)
                        .map(kelompok => (
                          <Grid container spacing={2} key={kelompok._id}>
                            <Grid item xs={12}>
                              <Typography
                                variant='subtitle2'
                                color='text.secondary'
                              >
                                Tarif Kelompok:
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                Pemakaian {'<'} 10m³:
                              </Typography>
                              <Typography variant='body1' fontWeight='bold'>
                                {formatCurrency(
                                  kelompok.hargaPenggunaanDibawah10
                                )}
                                /m³
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                Pemakaian {'>'} 10m³:
                              </Typography>
                              <Typography variant='body1' fontWeight='bold'>
                                {formatCurrency(
                                  kelompok.hargaPenggunaanDiatas10
                                )}
                                /m³
                              </Typography>
                            </Grid>
                            {kelompok.biayaBeban && (
                              <Grid item xs={12} md={4}>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  Biaya Beban:
                                </Typography>
                                <Typography variant='body1' fontWeight='bold'>
                                  {formatCurrency(kelompok.biayaBeban)}/bulan
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant='outlined'
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={submitting || !noMeteran || !kelompokPelangganId}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CheckCircle />
                    )
                  }
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Meteran'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </AdminLayout>
  );
}
