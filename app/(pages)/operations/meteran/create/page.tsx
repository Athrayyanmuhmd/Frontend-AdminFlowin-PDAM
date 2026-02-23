// @ts-nocheck
'use client';

import React, { useState } from 'react';
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
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '../../../../layouts/AdminLayout';
import { GET_CONNECTION_DATA_BY_ID } from '../../../../../lib/graphql/queries/connectionData';
import { GET_ALL_KELOMPOK_PELANGGAN } from '../../../../../lib/graphql/queries/kelompokPelanggan';
import { CREATE_METERAN, GET_ALL_METERAN } from '../../../../../lib/graphql/queries/meteran';

export default function CreateMeteran() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connectionId');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nomorMeteran, setNomorMeteran] = useState('');
  const [nomorAkun, setNomorAkun] = useState('');
  const [kelompokId, setKelompokId] = useState('');

  // Fetch connection data
  const { data: connResult, loading: loadingConn, error: connError } = useQuery(GET_CONNECTION_DATA_BY_ID, {
    variables: { id: connectionId },
    skip: !connectionId,
    fetchPolicy: 'network-only',
  });

  // Fetch kelompok pelanggan list
  const { data: kelompokResult, loading: loadingKelompok } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'network-only',
  });

  const connectionData = connResult?.getKoneksiData || null;
  const kelompokList = kelompokResult?.getAllKelompokPelanggan || [];

  const [createMeteranMutation] = useMutation(CREATE_METERAN, {
    refetchQueries: [{ query: GET_ALL_METERAN }],
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorMeteran) { setError('Nomor meteran wajib diisi'); return; }
    if (!nomorAkun) { setError('Nomor akun wajib diisi'); return; }
    if (!kelompokId) { setError('Kelompok pelanggan wajib dipilih'); return; }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createMeteranMutation({
        variables: {
          idKelompokPelanggan: kelompokId,
          nomorMeteran,
          nomorAkun,
          idKoneksiData: connectionId || undefined,
        },
      });
      setSuccess('Meteran berhasil dibuat');
      setTimeout(() => {
        router.push(connectionId ? `/operations/connection-data/${connectionId}` : '/operations/meteran');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating meteran:', err);
      setError(err.message || 'Gagal membuat meteran');
    } finally {
      setSubmitting(false);
    }
  };

  if (!connectionId) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>Connection ID tidak ditemukan</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>Kembali</Button>
        </Box>
      </AdminLayout>
    );
  }

  if (loadingConn || loadingKelompok) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (connError || !connectionData) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{connError?.message || 'Data koneksi tidak ditemukan'}</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>Kembali</Button>
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
            <Typography variant='h4'>Tambah Meteran & Assign Kelompok</Typography>
            <Typography variant='body2' color='text.secondary'>
              {connectionData.NIK ? `NIK: ${connectionData.NIK} — ` : ''}
              {connectionData.idPelanggan?.namaLengkap || '—'}
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Meteran Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>Informasi Meteran</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Nomor Meteran'
                        value={nomorMeteran}
                        onChange={e => setNomorMeteran(e.target.value)}
                        required
                        placeholder='Contoh: MTR-2024-0001'
                        helperText='Nomor fisik pada meteran'
                        InputProps={{ startAdornment: <Speed sx={{ mr: 1, color: 'action.active' }} /> }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Nomor Akun'
                        value={nomorAkun}
                        onChange={e => setNomorAkun(e.target.value)}
                        required
                        placeholder='Contoh: AKN-2024-0001'
                        helperText='Nomor akun unik pelanggan'
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
                  <Typography variant='h6' gutterBottom>Kelompok Pelanggan</Typography>
                  <Typography variant='body2' color='text.secondary' paragraph>
                    Pilih kelompok pelanggan yang sesuai. Tarif akan mengikuti kelompok yang dipilih.
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Pilih Kelompok Pelanggan</InputLabel>
                    <Select
                      value={kelompokId}
                      label='Pilih Kelompok Pelanggan'
                      onChange={e => setKelompokId(e.target.value)}
                    >
                      <MenuItem value=''><em>-- Pilih Kelompok --</em></MenuItem>
                      {kelompokList.map((k: any) => (
                        <MenuItem key={k._id} value={k._id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant='body1' fontWeight='bold'>{k.namaKelompok}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {'<'}10m³: {formatCurrency(k.hargaDiBawah10mKubik)}/m³
                              {' | '}
                              {'>'}10m³: {formatCurrency(k.hargaDiAtas10mKubik)}/m³
                              {k.biayaBeban ? ` | Biaya Beban: ${formatCurrency(k.biayaBeban)}` : ''}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Selected kelompok details */}
                  {kelompokId && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      {kelompokList.filter((k: any) => k._id === kelompokId).map((k: any) => (
                        <Grid container spacing={2} key={k._id}>
                          <Grid item xs={12}>
                            <Typography variant='subtitle2' color='text.secondary'>Tarif Kelompok:</Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant='body2' color='text.secondary'>Pemakaian {'<'} 10m³:</Typography>
                            <Typography variant='body1' fontWeight='bold'>{formatCurrency(k.hargaDiBawah10mKubik)}/m³</Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant='body2' color='text.secondary'>Pemakaian {'>'} 10m³:</Typography>
                            <Typography variant='body1' fontWeight='bold'>{formatCurrency(k.hargaDiAtas10mKubik)}/m³</Typography>
                          </Grid>
                          {k.biayaBeban && (
                            <Grid item xs={12} md={4}>
                              <Typography variant='body2' color='text.secondary'>Biaya Beban:</Typography>
                              <Typography variant='body1' fontWeight='bold'>{formatCurrency(k.biayaBeban)}/bulan</Typography>
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
                <Button variant='outlined' onClick={() => router.back()} disabled={submitting}>
                  Batal
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={submitting || !nomorMeteran || !nomorAkun || !kelompokId}
                  startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
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
