'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  HourglassEmpty,
  AttachFile,
  Download,
  OpenInNew,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetRABConnection } from '../../../../../lib/graphql/hooks/useRABConnection';

export default function RabConnectionDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { rabConnection: data, loading, error: graphqlError } = useGetRABConnection(id);

  const isPaid = data?.statusPembayaran === 'SETTLEMENT';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (authLoading || !isAuthenticated) return null;

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{graphqlError?.message || 'Data tidak ditemukan'}</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>Kembali</Button>
        </Box>
      </AdminLayout>
    );
  }

  const koneksi = data.idKoneksiData;
  const pelanggan = koneksi?.IdPelanggan;

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>Detail RAB</Typography>
            <Typography variant='body2' color='text.secondary'>
              {koneksi?.NIK ? `NIK: ${koneksi.NIK} — ` : ''}
              {pelanggan?.namaLengkap || '—'}
            </Typography>
          </Box>
          <Chip
            label={isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
            color={isPaid ? 'success' : 'warning'}
            icon={isPaid ? <CheckCircle /> : <HourglassEmpty />}
          />
        </Box>

        {isPaid && (
          <Alert severity='success' sx={{ mb: 3 }}>
            Pembayaran RAB telah dikonfirmasi. Proses instalasi dapat dilanjutkan.
          </Alert>
        )}

        {/* Informasi Pelanggan */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Informasi Pelanggan</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Nama Lengkap:</Typography>
                <Typography variant='body1'>{pelanggan?.namaLengkap || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Email:</Typography>
                <Typography variant='body1'>{pelanggan?.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>No. HP:</Typography>
                <Typography variant='body1'>{pelanggan?.noHP || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>NIK:</Typography>
                <Typography variant='body1'>{koneksi?.NIK || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>Alamat:</Typography>
                <Typography variant='body1'>
                  {[koneksi?.Alamat, koneksi?.Kelurahan, koneksi?.Kecamatan].filter(Boolean).join(', ') || '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Budget Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Detail Anggaran</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>Total Biaya:</Typography>
                <Typography variant='h4' color='primary' fontWeight='bold'>
                  {formatCurrency(data.totalBiaya || 0)}
                </Typography>
              </Grid>
              {data.catatan && (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>Catatan:</Typography>
                  <Typography variant='body1'>{data.catatan}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* RAB Document */}
        {data.urlRab && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>Dokumen RAB</Typography>
              <Box sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachFile fontSize='large' color='action' />
                  <Box>
                    <Typography variant='body1' fontWeight='bold'>Dokumen RAB.pdf</Typography>
                    <Typography variant='caption' color='text.secondary'>Klik untuk melihat atau mengunduh dokumen</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant='outlined' startIcon={<OpenInNew />} onClick={() => window.open(data.urlRab, '_blank')}>
                    Buka
                  </Button>
                  <Button variant='contained' startIcon={<Download />} onClick={() => window.open(data.urlRab, '_blank')}>
                    Download
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Payment Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Status Pembayaran</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Status:</Typography>
                <Chip
                  label={data.statusPembayaran || 'PENDING'}
                  color={isPaid ? 'success' : 'warning'}
                  size='medium'
                  sx={{ mt: 1 }}
                />
              </Grid>
              {data.orderId && (
                <Grid item xs={12} md={6}>
                  <Typography variant='body2' color='text.secondary'>Order ID:</Typography>
                  <Typography variant='body1'>{data.orderId}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                {isPaid ? (
                  <Alert severity='success'>Pembayaran telah dikonfirmasi. Proses instalasi dapat dilanjutkan.</Alert>
                ) : (
                  <Alert severity='warning'>Pelanggan harus melakukan pembayaran sebelum proses instalasi dapat dilanjutkan.</Alert>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>Informasi Waktu</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Dibuat pada:</Typography>
                <Typography variant='body1'>{new Date(Number(data.createdAt)).toLocaleString('id-ID')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Diperbarui pada:</Typography>
                <Typography variant='body1'>{new Date(Number(data.updatedAt)).toLocaleString('id-ID')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
