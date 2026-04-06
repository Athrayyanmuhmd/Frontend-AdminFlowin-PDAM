'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  HourglassEmpty,
  AttachFile,
  Download,
  ThumbUp,
  ThumbDown,
  OpenInNew,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetRABConnection } from '../../../../../lib/graphql/hooks/useRABConnection';
import { useMutation } from '@apollo/client/react';
import { APPROVE_RAB, REJECT_RAB } from '../../../../../lib/graphql/queries/rabConnection';

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
  const { userRole, isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

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
    statusVerifikasiAdmin: (rabData as any).statusVerifikasiAdmin || 'Menunggu',
    alasanPenolakan: (rabData as any).alasanPenolakan || null,
    tanggalVerifikasiAdmin: (rabData as any).tanggalVerifikasiAdmin || null,
    urlRab: rabData.urlRab || '',
    catatan: rabData.catatan,
    createdAt: rabData.createdAt,
    updatedAt: rabData.updatedAt,
  } : null;

  const [error, setError] = useState(graphqlError?.message || '');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [alasanInput, setAlasanInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [approveRAB, { loading: approving }] = useMutation(APPROVE_RAB, {
    onCompleted: () => {
      refetch();
      setSnackbar({ open: true, message: 'RAB disetujui. Admin dapat membuat tagihan ke pelanggan.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

  const [rejectRAB, { loading: rejecting }] = useMutation(REJECT_RAB, {
    onCompleted: () => {
      refetch();
      setRejectOpen(false);
      setAlasanInput('');
      setSnackbar({ open: true, message: 'RAB ditolak. Teknisi perlu merevisi RAB.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

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

  if (authLoading || !isAuthenticated) return null;

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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={
                data.statusVerifikasiAdmin === 'Disetujui' ? 'RAB Disetujui' :
                data.statusVerifikasiAdmin === 'Ditolak' ? 'RAB Ditolak' : 'Menunggu Verifikasi'
              }
              color={
                data.statusVerifikasiAdmin === 'Disetujui' ? 'success' :
                data.statusVerifikasiAdmin === 'Ditolak' ? 'error' : 'default'
              }
              size="small"
            />
            <Chip
              label={data.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
              color={data.isPaid ? 'success' : 'warning'}
              icon={data.isPaid ? <CheckCircle /> : <HourglassEmpty />}
            />
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Admin Verifikasi RAB */}
        {data.statusVerifikasiAdmin === 'Menunggu' && (
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>Verifikasi RAB oleh Admin</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Periksa dokumen RAB yang diupload teknisi. Jika sesuai, setujui untuk lanjut ke tagihan pelanggan.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='contained'
                  color='success'
                  startIcon={approving ? <CircularProgress size={16} /> : <ThumbUp />}
                  onClick={() => approveRAB({ variables: { id } })}
                  disabled={approving || rejecting}
                >
                  Setujui RAB
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<ThumbDown />}
                  onClick={() => setRejectOpen(true)}
                  disabled={approving || rejecting}
                >
                  Tolak RAB
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {data.statusVerifikasiAdmin === 'Disetujui' && !data.isPaid && (
          <Alert severity='success' sx={{ mb: 3 }}>
            RAB telah disetujui admin. Buat tagihan ke pelanggan dari menu <strong>Penagihan &gt; Generate Tagihan</strong>, lalu tunggu pembayaran sebelum lanjut ke instalasi.
          </Alert>
        )}

        {data.statusVerifikasiAdmin === 'Ditolak' && (
          <Alert severity='error' sx={{ mb: 3 }}>
            RAB ditolak. Alasan: <strong>{data.alasanPenolakan}</strong>. Teknisi perlu merevisi dan upload ulang RAB.
          </Alert>
        )}

        {data.isPaid && (
          <Alert severity='success' sx={{ mb: 3 }}>
            Pembayaran RAB telah dikonfirmasi. Proses instalasi dapat dilanjutkan.
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
                    {(data.technicianId as any)?.namaLengkap}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Email:
                  </Typography>
                  <Typography variant='body1'>
                    {(data.technicianId as any)?.email}
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='outlined'
                  startIcon={<OpenInNew />}
                  onClick={handleDownloadRAB}
                >
                  Buka
                </Button>
                <Button
                  variant='contained'
                  startIcon={<Download />}
                  onClick={handleDownloadRAB}
                >
                  Download
                </Button>
              </Box>
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

      {/* Dialog Tolak RAB */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tolak RAB</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Berikan alasan penolakan. Teknisi perlu merevisi dan upload ulang RAB.
          </Typography>
          <TextField
            fullWidth
            label="Alasan Penolakan"
            value={alasanInput}
            onChange={(e) => setAlasanInput(e.target.value)}
            multiline
            rows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRejectOpen(false); setAlasanInput(''); }}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!alasanInput.trim() || rejecting}
            onClick={() => rejectRAB({ variables: { id, alasanPenolakan: alasanInput } })}
          >
            {rejecting ? <CircularProgress size={20} /> : 'Tolak RAB'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
