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
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Upload,
  Close,
  CheckCircle,
  AttachFile,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../../layouts/AdminLayout';
import { GET_CONNECTION_DATA_BY_ID } from '../../../../../lib/graphql/queries/connectionData';
import API from '../../../../utils/API';

export default function CreateRabConnection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connectionId');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [totalBiaya, setTotalBiaya] = useState('');
  const [catatan, setCatatan] = useState('');
  const [rabFile, setRabFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const { data: connResult, loading, error: queryError } = useQuery(GET_CONNECTION_DATA_BY_ID, {
    variables: { id: connectionId },
    skip: !connectionId,
    fetchPolicy: 'network-only',
  });

  const connectionData = connResult?.getKoneksiData || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Hanya file PDF yang diperbolehkan');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }
      setRabFile(file);
      setFilePreview(file.name);
      setError('');
    }
  };

  const handleRemoveFile = () => {
    setRabFile(null);
    setFilePreview(null);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTotalBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setTotalBiaya(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!rabFile) {
        setError('File RAB (PDF) wajib diupload');
        setSubmitting(false);
        return;
      }
      if (!totalBiaya) {
        setError('Total biaya wajib diisi');
        setSubmitting(false);
        return;
      }
      const totalBiayaNumber = parseInt(totalBiaya.replace(/\./g, ''));
      if (isNaN(totalBiayaNumber) || totalBiayaNumber <= 0) {
        setError('Total biaya harus lebih dari 0');
        setSubmitting(false);
        return;
      }

      const submitData = new FormData();
      submitData.append('connectionDataId', connectionId!);
      submitData.append('rabFile', rabFile);
      submitData.append('totalBiaya', totalBiayaNumber.toString());
      if (catatan) submitData.append('catatan', catatan);

      await API.post('/rab-connection', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('RAB berhasil dibuat');
      setTimeout(() => {
        router.push(`/operations/connection-data/${connectionId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating RAB:', err);
      setError(err.response?.data?.message || 'Gagal membuat RAB');
    } finally {
      setSubmitting(false);
    }
  };

  if (!connectionId) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>Connection ID tidak ditemukan</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (queryError || !connectionData) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{queryError?.message || 'Data tidak ditemukan'}</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>Buat RAB (Rencana Anggaran Biaya)</Typography>
            <Typography variant='body2' color='text.secondary'>
              {connectionData.NIK ? `NIK: ${connectionData.NIK} — ` : ''}
              {connectionData.idPelanggan?.namaLengkap || '—'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Upload File RAB
                  </Typography>
                  <Typography variant='body2' color='text.secondary' paragraph>
                    Upload dokumen RAB dalam format PDF (maksimal 10MB)
                  </Typography>
                  <input
                    accept='application/pdf'
                    style={{ display: 'none' }}
                    id='rab-file'
                    type='file'
                    onChange={handleFileChange}
                  />
                  <label htmlFor='rab-file'>
                    <Button variant='outlined' component='span' startIcon={<Upload />} fullWidth>
                      Upload RAB (PDF)
                    </Button>
                  </label>
                  {filePreview && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFile />
                        <Typography variant='body2'>{filePreview}</Typography>
                      </Box>
                      <IconButton size='small' onClick={handleRemoveFile}>
                        <Close />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Detail RAB
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label='Total Biaya'
                        value={totalBiaya}
                        onChange={handleTotalBiayaChange}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>Rp</InputAdornment>
                          ),
                        }}
                        helperText='Masukkan total biaya pemasangan'
                        placeholder='0'
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label='Catatan Tambahan'
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        multiline
                        rows={4}
                        placeholder='Catatan tambahan mengenai RAB (opsional)...'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant='outlined' onClick={() => router.back()} disabled={submitting}>
                  Batal
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan RAB'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </AdminLayout>
  );
}
