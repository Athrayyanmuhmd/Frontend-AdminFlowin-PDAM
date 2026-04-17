'use client';

import React, { useEffect, useState } from 'react';
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
  OpenInNew,
  VerifiedUser,
  MoneyOff,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useMutation } from '@apollo/client/react';
import { useGetRABConnection } from '../../../../../lib/graphql/hooks/useRABConnection';
import { KONFIRMASI_PEMBAYARAN_RAB, TANDAI_LUNAS_RAB } from '../../../../../lib/graphql/mutations/survei';

export default function RabConnectionDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, userRole } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { rabConnection: data, loading, error: graphqlError, refetch } = useGetRABConnection(id);

  const [konfirmasiMut, { loading: konfirmasiLoading }] = useMutation(KONFIRMASI_PEMBAYARAN_RAB);
  const [tandaiLunasMut, { loading: tandaiLoading }] = useMutation(TANDAI_LUNAS_RAB);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'konfirmasi' | 'lunas'>('konfirmasi');
  const [confirmCatatan, setConfirmCatatan] = useState('');

  const isPaid = data?.statusPembayaran?.toLowerCase() === 'settlement';
  const isKonfirmasi = data?.statusKonfirmasiPembayaran === 'dikonfirmasi';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const openConfirmDialog = (type: 'konfirmasi' | 'lunas') => {
    setConfirmType(type);
    setConfirmCatatan('');
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      if (confirmType === 'konfirmasi') {
        await konfirmasiMut({ variables: { id, catatan: confirmCatatan || undefined } });
        setSnackbar({ open: true, message: 'Pembayaran berhasil dikonfirmasi', severity: 'success' });
      } else {
        await tandaiLunasMut({ variables: { id, catatan: confirmCatatan || 'Dibayar tunai di loket' } });
        setSnackbar({ open: true, message: 'Pembayaran berhasil ditandai lunas', severity: 'success' });
      }
      setConfirmDialogOpen(false);
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal memproses', severity: 'error' });
    }
  };

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
                <Typography variant='body2' color='text.secondary'>Status Pembayaran:</Typography>
                <Chip
                  label={isPaid ? 'Settlement (Lunas)' : data.statusPembayaran || 'Pending'}
                  color={isPaid ? 'success' : 'warning'}
                  size='medium'
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Konfirmasi Admin:</Typography>
                <Chip
                  label={isKonfirmasi ? 'Dikonfirmasi' : 'Belum Dikonfirmasi'}
                  color={isKonfirmasi ? 'success' : 'default'}
                  icon={isKonfirmasi ? <CheckCircle /> : <HourglassEmpty />}
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
              {data.catatanKonfirmasi && (
                <Grid item xs={12}>
                  <Alert severity='info'>
                    <strong>Catatan Konfirmasi:</strong> {data.catatanKonfirmasi}
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                {isKonfirmasi ? (
                  <Alert severity='success'>Pembayaran telah dikonfirmasi admin. Proses instalasi dapat dilanjutkan.</Alert>
                ) : isPaid ? (
                  <Alert severity='warning'>Pembayaran sudah settlement. Menunggu konfirmasi admin.</Alert>
                ) : (
                  <Alert severity='warning'>Pelanggan harus melakukan pembayaran sebelum proses instalasi dapat dilanjutkan.</Alert>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Admin Payment Confirmation */}
        {userRole === 'admin' && !isKonfirmasi && (
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>Aksi Admin</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {isPaid ? (
                  <Button
                    variant='contained' color='success' startIcon={<VerifiedUser />}
                    onClick={() => openConfirmDialog('konfirmasi')}
                    disabled={konfirmasiLoading}
                  >
                    Konfirmasi Pembayaran
                  </Button>
                ) : (
                  <Button
                    variant='contained' color='warning' startIcon={<MoneyOff />}
                    onClick={() => openConfirmDialog('lunas')}
                    disabled={tandaiLoading}
                  >
                    Tandai Lunas (Loket/Tunai)
                  </Button>
                )}
              </Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                {isPaid
                  ? 'Konfirmasi bahwa pembayaran Midtrans telah diterima dan sah.'
                  : 'Gunakan jika pelanggan membayar tunai di loket (di luar Midtrans).'
                }
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Confirm Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>
            {confirmType === 'konfirmasi' ? 'Konfirmasi Pembayaran RAB' : 'Tandai Lunas (Loket/Tunai)'}
          </DialogTitle>
          <DialogContent>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              {confirmType === 'konfirmasi'
                ? 'Anda mengkonfirmasi bahwa pembayaran RAB dari Midtrans telah diterima dengan benar.'
                : 'Anda menandai RAB ini sebagai lunas melalui pembayaran tunai di loket.'
              }
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              label='Catatan (opsional)'
              value={confirmCatatan}
              onChange={(e) => setConfirmCatatan(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Batal</Button>
            <Button
              variant='contained'
              color='success'
              onClick={handleConfirm}
              disabled={konfirmasiLoading || tandaiLoading}
            >
              {(konfirmasiLoading || tandaiLoading) ? <CircularProgress size={20} /> : 'Konfirmasi'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Timestamps */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>Informasi Waktu</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Dibuat pada:</Typography>
                <Typography variant='body1'>{new Date(data.createdAt).toLocaleString('id-ID')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Diperbarui pada:</Typography>
                <Typography variant='body1'>{new Date(data.updatedAt).toLocaleString('id-ID')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}
