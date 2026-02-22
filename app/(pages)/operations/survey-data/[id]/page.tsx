// @ts-nocheck
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
  const { userRole } = useAdmin();
  const id = params.id as string;

  // ✅ GraphQL Query - Replace REST API
  const { surveyData: graphqlSurvey, loading, error: graphqlError, refetch } = useGetSurveyData(id);

  // Transform GraphQL data — map semua field ke nama yang dipakai di render
  const data = graphqlSurvey ? {
    _id: graphqlSurvey._id,
    // Nested objects untuk header subtitle
    connectionDataId: graphqlSurvey.idKoneksiData ? {
      _id: graphqlSurvey.idKoneksiData._id,
      nik: graphqlSurvey.idKoneksiData.NIK || graphqlSurvey.idKoneksiData.alamat || '',
      userId: graphqlSurvey.idKoneksiData.idPelanggan ? {
        namaLengkap: graphqlSurvey.idKoneksiData.idPelanggan.namaLengkap,
      } : { namaLengkap: '—' },
    } : { _id: '', nik: '', userId: { namaLengkap: '—' } },
    // Teknisi
    technicianId: graphqlSurvey.idTeknisi ? {
      _id: graphqlSurvey.idTeknisi._id,
      namaLengkap: graphqlSurvey.idTeknisi.namaLengkap,
      email: graphqlSurvey.idTeknisi.email,
    } : null,
    // URL foto — pakai nama field GraphQL langsung
    jaringanUrl: graphqlSurvey.urlJaringan || '',
    posisiBakUrl: graphqlSurvey.urlPosisiBak || '',
    posisiMeteranUrl: graphqlSurvey.posisiMeteran || '',
    // Koordinat — GraphQL pakai latitude/longitude, render pakai .lat/.long
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

  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (graphqlError) {
      setError(graphqlError.message);
    }
  }, [graphqlError]);

  const handleOpenViewer = (imageUrl: string, title: string) => {
    setViewerImage(imageUrl);
    setViewerTitle(title);
    setViewerOpen(true);
    setZoom(100);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const openGoogleMaps = () => {
    if (data?.koordinat?.lat != null && data?.koordinat?.long != null) {
      const url = `https://www.google.com/maps?q=${data.koordinat.lat},${data.koordinat.long}`;
      window.open(url, '_blank');
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

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
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

        {/* Survey Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Detail Survei
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Diameter Pipa:
                </Typography>
                <Typography variant='h6'>{data.diameterPipa} inch</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Jumlah Penghuni:
                </Typography>
                <Typography variant='h6'>
                  {data.jumlahPenghuni} orang
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Koordinat Lokasi:
                </Typography>
                {data.koordinat?.lat != null ? (
                  <>
                    <Typography variant='body1'>
                      Lat: {data.koordinat.lat}
                      <br />
                      Long: {data.koordinat.long}
                    </Typography>
                    <Button
                      size='small'
                      startIcon={<LocationOn />}
                      onClick={openGoogleMaps}
                      sx={{ mt: 1 }}
                    >
                      Buka di Google Maps
                    </Button>
                  </>
                ) : (
                  <Typography variant='body1' color='text.secondary'>Tidak tersedia</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Status Standar:
                </Typography>
                <Chip
                  label={data.standar ? 'Sesuai Standar' : 'Tidak Standar'}
                  color={data.standar ? 'success' : 'warning'}
                  size='small'
                  sx={{ mt: 1 }}
                />
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

        {/* Photos */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Dokumentasi Foto
            </Typography>
            <Grid container spacing={2}>
              {/* Foto Jaringan */}
              <Grid item xs={12} md={4}>
                <Typography variant='body2' gutterBottom>
                  Foto Jaringan
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() =>
                    handleOpenViewer(data.jaringanUrl, 'Foto Jaringan')
                  }
                >
                  <img
                    src={data.jaringanUrl}
                    alt='Jaringan'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Grid>

              {/* Foto Posisi Bak */}
              <Grid item xs={12} md={4}>
                <Typography variant='body2' gutterBottom>
                  Foto Posisi Bak
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() =>
                    handleOpenViewer(data.posisiBakUrl, 'Foto Posisi Bak')
                  }
                >
                  <img
                    src={data.posisiBakUrl}
                    alt='Posisi Bak'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Grid>

              {/* Foto Posisi Meteran */}
              <Grid item xs={12} md={4}>
                <Typography variant='body2' gutterBottom>
                  Foto Posisi Meteran
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() =>
                    handleOpenViewer(
                      data.posisiMeteranUrl,
                      'Foto Posisi Meteran'
                    )
                  }
                >
                  <img
                    src={data.posisiMeteranUrl}
                    alt='Posisi Meteran'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </Grid>
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

        {/* Image Viewer Dialog */}
        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth='lg'
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='h6'>{viewerTitle}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut />
                </IconButton>
                <Typography
                  variant='body2'
                  sx={{ minWidth: 60, textAlign: 'center' }}
                >
                  {zoom}%
                </Typography>
                <IconButton
                  size='small'
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                >
                  <ZoomIn />
                </IconButton>
                <IconButton size='small' onClick={handleResetZoom}>
                  <RestartAlt />
                </IconButton>
                <IconButton onClick={() => setViewerOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400,
                overflow: 'auto',
              }}
            >
              <img
                src={viewerImage}
                alt={viewerTitle}
                style={{
                  width: `${zoom}%`,
                  height: 'auto',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
