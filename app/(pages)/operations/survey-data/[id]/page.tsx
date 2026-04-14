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
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Close,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  LocationOn,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetSurveyData } from '../../../../../lib/graphql/hooks/useSurveyData';

export default function SurveyDataDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { surveyData: graphqlSurvey, loading, error: graphqlError } = useGetSurveyData(id);

  const data = graphqlSurvey ? {
    _id: graphqlSurvey._id,
    connectionDataId: graphqlSurvey.idKoneksiData ? {
      _id: graphqlSurvey.idKoneksiData._id,
      nik: graphqlSurvey.idKoneksiData.NIK || '',
      alamat: graphqlSurvey.idKoneksiData.Alamat || '',
      userId: graphqlSurvey.idKoneksiData.IdPelanggan ? {
        namaLengkap: graphqlSurvey.idKoneksiData.IdPelanggan.namaLengkap,
      } : { namaLengkap: '—' },
    } : { _id: '', nik: '', alamat: '', userId: { namaLengkap: '—' } },
    jaringanUrl: graphqlSurvey.urlJaringan || '',
    posisiBakUrl: graphqlSurvey.urlPosisiBak || '',
    posisiMeteranUrl: graphqlSurvey.posisiMeteran || '',
    koordinat: graphqlSurvey.koordinat ? {
      lat: graphqlSurvey.koordinat.latitude,
      long: graphqlSurvey.koordinat.longitude,
    } : null,
    diameterPipa: graphqlSurvey.diameterPipa,
    jumlahPenghuni: graphqlSurvey.jumlahPenghuni,
    standar: graphqlSurvey.standar,
    catatan: graphqlSurvey.catatan,
    createdAt: graphqlSurvey.createdAt,
    updatedAt: graphqlSurvey.updatedAt,
  } : null;

  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (graphqlError) setError(graphqlError.message);
  }, [graphqlError]);

  const handleOpenViewer = (imageUrl: string, title: string) => {
    setViewerImage(imageUrl);
    setViewerTitle(title);
    setViewerOpen(true);
    setZoom(100);
  };

  const openGoogleMaps = () => {
    if (data?.koordinat?.lat != null && data?.koordinat?.long != null) {
      window.open(`https://www.google.com/maps?q=${data.koordinat.lat},${data.koordinat.long}`, '_blank');
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
          <Alert severity='error'>{error || 'Data tidak ditemukan'}</Alert>
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
            <Typography variant='h4'>Detail Survei</Typography>
            <Typography variant='body2' color='text.secondary'>
              {data.connectionDataId.nik ? `NIK: ${data.connectionDataId.nik} — ` : ''}
              {data.connectionDataId.userId.namaLengkap}
            </Typography>
          </Box>
          <Chip
            label={data.standar ? 'Standar' : 'Non-Standar'}
            color={data.standar ? 'success' : 'warning'}
            icon={<CheckCircle />}
          />
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}

        {/* Survey Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Detail Survei</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Pelanggan:</Typography>
                <Typography variant='h6'>{data.connectionDataId.userId.namaLengkap}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Alamat:</Typography>
                <Typography variant='body1'>{data.connectionDataId.alamat || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Diameter Pipa:</Typography>
                <Typography variant='h6'>{data.diameterPipa} inch</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Jumlah Penghuni:</Typography>
                <Typography variant='h6'>{data.jumlahPenghuni} orang</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Koordinat Lokasi:</Typography>
                {data.koordinat?.lat != null ? (
                  <>
                    <Typography variant='body1'>
                      Lat: {data.koordinat.lat}<br />Long: {data.koordinat.long}
                    </Typography>
                    <Button size='small' startIcon={<LocationOn />} onClick={openGoogleMaps} sx={{ mt: 1 }}>
                      Buka di Google Maps
                    </Button>
                  </>
                ) : (
                  <Typography variant='body1' color='text.secondary'>Tidak tersedia</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Status Standar:</Typography>
                <Chip
                  label={data.standar ? 'Sesuai Standar' : 'Tidak Standar'}
                  color={data.standar ? 'success' : 'warning'}
                  size='small'
                  sx={{ mt: 1 }}
                />
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

        {/* Photos */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Dokumentasi Foto</Typography>
            <Grid container spacing={2}>
              {[
                { url: data.jaringanUrl, label: 'Foto Jaringan' },
                { url: data.posisiBakUrl, label: 'Foto Posisi Bak' },
                { url: data.posisiMeteranUrl, label: 'Foto Posisi Meteran' },
              ].map(({ url, label }) => (
                <Grid item xs={12} md={4} key={label}>
                  <Typography variant='body2' gutterBottom>{label}</Typography>
                  {url ? (
                    <Box
                      sx={{ position: 'relative', paddingTop: '75%', overflow: 'hidden', borderRadius: 1, bgcolor: 'grey.200', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      onClick={() => handleOpenViewer(url, label)}
                    >
                      <img
                        src={url}
                        alt={label}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ paddingTop: '75%', borderRadius: 1, bgcolor: 'grey.200', position: 'relative' }}>
                      <Typography variant='caption' color='text.secondary' sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        Tidak tersedia
                      </Typography>
                    </Box>
                  )}
                </Grid>
              ))}
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
                <Typography variant='body1'>{data.createdAt ? new Date(Number(data.createdAt)).toLocaleString('id-ID') : '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Diperbarui pada:</Typography>
                <Typography variant='body1'>{data.updatedAt ? new Date(Number(data.updatedAt)).toLocaleString('id-ID') : '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Image Viewer */}
        <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth='lg' fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='h6'>{viewerTitle}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size='small' onClick={() => setZoom(p => Math.max(p - 25, 50))} disabled={zoom <= 50}><ZoomOut /></IconButton>
                <Typography variant='body2' sx={{ minWidth: 60, textAlign: 'center' }}>{zoom}%</Typography>
                <IconButton size='small' onClick={() => setZoom(p => Math.min(p + 25, 300))} disabled={zoom >= 300}><ZoomIn /></IconButton>
                <IconButton size='small' onClick={() => setZoom(100)}><RestartAlt /></IconButton>
                <IconButton onClick={() => setViewerOpen(false)}><Close /></IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, overflow: 'auto' }}>
              <img src={viewerImage} alt={viewerTitle} style={{ width: `${zoom}%`, height: 'auto', transition: 'width 0.3s ease' }} />
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
