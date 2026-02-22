// @ts-nocheck
'use client';

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetRABConnection } from '../../../../../lib/graphql/hooks/useRABConnection';

interface RabConnection {
  _id: string;
  connectionDataId: {
    _id: string;
    nik: string;
    userId: {
      _id: string;
      namaLengkap: string;
      email: string;
    };
  };
  userId: string;
  technicianId?: {
    _id: string;
    namaLengkap: string;
    email: string;
  };
  totalBiaya: number;
  isPaid: boolean;
  urlRab: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RabConnectionDetail() {
  const params = useParams();
  const router = useRouter();
  const { userRole } = useAdmin();
  const id = params.id as string;

  // ✅ GraphQL Query - Replace REST API
  const { rabConnection: rabData, loading, error: graphqlError, refetch } = useGetRABConnection(id);

  // Transform GraphQL data to match component interface
  const data = rabData ? {
    _id: rabData._id,
    connectionDataId: rabData.idKoneksiData ? {
      _id: rabData.idKoneksiData._id,
      nik: rabData.idKoneksiData.NIK || '',
      userId: rabData.idKoneksiData.idPelanggan ? {
        _id: rabData.idKoneksiData.idPelanggan._id,
        namaLengkap: rabData.idKoneksiData.idPelanggan.namaLengkap,
        email: rabData.idKoneksiData.idPelanggan.email,
      } : null,
    } : null,
    userId: '',
    technicianId: undefined,
    totalBiaya: rabData.totalBiaya,
    isPaid: rabData.statusPembayaran === 'Settlement',
    urlRab: rabData.urlRab || '',
    catatan: rabData.catatan,
    createdAt: rabData.createdAt,
    updatedAt: rabData.updatedAt,
  } : null;

  const [error, setError] = useState(graphqlError?.message || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadRAB = () => {
    if (data?.urlRab) {
      window.open(data.urlRab, '_blank');
    }
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

  if (!data) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{error || 'Data tidak ditemukan'}</Alert>
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
            <Typography variant='h4'>Detail RAB</Typography>
            <Typography variant='body2' color='text.secondary'>
              {data.connectionDataId?.nik ? `NIK: ${data.connectionDataId.nik} — ` : ''}
              {data.connectionDataId?.userId?.namaLengkap || '—'}
            </Typography>
          </Box>
          <Chip
            label={data.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
            color={data.isPaid ? 'success' : 'warning'}
            icon={data.isPaid ? <CheckCircle /> : <HourglassEmpty />}
          />
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!data.isPaid && userRole === 'admin' && (
          <Alert severity='info' sx={{ mb: 3 }}>
            RAB belum dibayar oleh pelanggan. Silakan tunggu pembayaran sebelum
            melanjutkan proses instalasi.
          </Alert>
        )}

        {/* Technician Info */}
        {data.technicianId && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Informasi Teknisi
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Nama Teknisi:
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    {data.technicianId.namaLengkap}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Email:
                  </Typography>
                  <Typography variant='body1'>
                    {data.technicianId.email}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* RAB Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Detail Anggaran
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>
                  Total Biaya:
                </Typography>
                <Typography variant='h4' color='primary' fontWeight='bold'>
                  {formatCurrency(data.totalBiaya)}
                </Typography>
              </Grid>
              {data.catatan && (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>
                    Catatan:
                  </Typography>
                  <Typography variant='body1'>{data.catatan}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* RAB Document */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Dokumen RAB
            </Typography>
            <Box
              sx={{
                p: 3,
                bgcolor: 'grey.100',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachFile fontSize='large' color='action' />
                <Box>
                  <Typography variant='body1' fontWeight='bold'>
                    Dokumen RAB.pdf
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Klik tombol download untuk melihat dokumen
                  </Typography>
                </Box>
              </Box>
              <Button
                variant='contained'
                startIcon={<Download />}
                onClick={handleDownloadRAB}
              >
                Download RAB
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Status Pembayaran
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Status:
                </Typography>
                <Chip
                  label={data.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                  color={data.isPaid ? 'success' : 'warning'}
                  size='medium'
                  sx={{ mt: 1 }}
                />
              </Grid>
              {!data.isPaid && (
                <Grid item xs={12}>
                  <Alert severity='warning'>
                    Pelanggan harus melakukan pembayaran terlebih dahulu sebelum
                    proses instalasi dapat dilanjutkan.
                  </Alert>
                </Grid>
              )}
              {data.isPaid && (
                <Grid item xs={12}>
                  <Alert severity='success'>
                    Pembayaran telah dikonfirmasi. Proses instalasi dapat
                    dilanjutkan.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Informasi Waktu
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Dibuat pada:
                </Typography>
                <Typography variant='body1'>
                  {new Date(data.createdAt).toLocaleString('id-ID')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Diperbarui pada:
                </Typography>
                <Typography variant='body1'>
                  {new Date(data.updatedAt).toLocaleString('id-ID')}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
