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
  Close,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  LocationOn,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetSurveyData } from '../../../../../lib/graphql/hooks/useSurveyData';
import { useMutation, useQuery } from '@apollo/client/react';
import { APPROVE_SURVEI, REJECT_SURVEI, ASSIGN_TEKNISI_DED } from '../../../../../lib/graphql/mutations/survei';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

export default function SurveyDataDetail() {
  const params = useParams();
  const router = useRouter();
  const { userRole, isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

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
      idTeknisiDED: (graphqlSurvey.idKoneksiData as any).idTeknisiDED || null,
      assignedDEDAt: (graphqlSurvey.idKoneksiData as any).assignedDEDAt || null,
    } : { _id: '', nik: '', userId: { namaLengkap: '—' }, idTeknisiDED: null, assignedDEDAt: null },
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
    statusSurvei: graphqlSurvey.statusSurvei || 'Menunggu',
    alasanPenolakan: graphqlSurvey.alasanPenolakan || '',
    tanggalVerifikasiAdmin: graphqlSurvey.tanggalVerifikasiAdmin || null,
    createdAt: graphqlSurvey.createdAt,
    updatedAt: graphqlSurvey.updatedAt,
  } : null;

  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [approveSurvei, { loading: approving }] = useMutation(APPROVE_SURVEI, {
    onCompleted: () => {
      refetch();
      setSnackbar({ open: true, message: 'Survei disetujui. Work order akan dibuat.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

  const [assignDEDOpen, setAssignDEDOpen] = useState(false);
  const [selectedTeknisiDED, setSelectedTeknisiDED] = useState('');

  const { data: teknisiData, loading: loadingTeknisi } = useQuery(GET_ALL_TEKNISI, {
    skip: !assignDEDOpen,
    fetchPolicy: 'network-only',
  });
  const teknisiList = (teknisiData as any)?.getAllTeknisi || [];

  const [assignTeknisiDED, { loading: assigning }] = useMutation(ASSIGN_TEKNISI_DED, {
    onCompleted: () => {
      refetch();
      setAssignDEDOpen(false);
      setSelectedTeknisiDED('');
      setSnackbar({ open: true, message: 'Teknisi DED berhasil di-assign. Teknisi akan membuat dokumen DED dan RAB.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

  const [rejectSurvei, { loading: rejecting }] = useMutation(REJECT_SURVEI, {
    onCompleted: () => {
      refetch();
      setRejectOpen(false);
      setAlasanPenolakan('');
      setSnackbar({ open: true, message: 'Survei ditolak. Teknisi akan melakukan survei ulang.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

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
            <Typography variant='h4'>Detail Survei</Typography>
            <Typography variant='body2' color='text.secondary'>
              {data.connectionDataId.nik ? `NIK: ${data.connectionDataId.nik} — ` : ''}
              {data.connectionDataId.userId.namaLengkap}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={data.standar ? 'Standar' : 'Non-Standar'}
              color={data.standar ? 'success' : 'warning'}
              icon={<CheckCircle />}
            />
            <Chip
              label={data.statusSurvei === 'Menunggu' ? 'Menunggu Verifikasi' : data.statusSurvei === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
              color={data.statusSurvei === 'Disetujui' ? 'success' : data.statusSurvei === 'Ditolak' ? 'error' : 'default'}
              size="small"
            />
            {data.statusSurvei === 'Menunggu' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={approving ? <CircularProgress size={16} /> : <ThumbUp />}
                  onClick={() => approveSurvei({ variables: { id } })}
                  disabled={approving || rejecting}
                >
                  Setujui
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<ThumbDown />}
                  onClick={() => setRejectOpen(true)}
                  disabled={approving || rejecting}
                >
                  Tolak
                </Button>
              </>
            )}
            {data.statusSurvei === 'Disetujui' && (
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => setAssignDEDOpen(true)}
              >
                {data.connectionDataId?.idTeknisiDED ? 'Ganti Teknisi DED' : 'Assign Teknisi DED'}
              </Button>
            )}
          </Box>
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

        {/* Teknisi DED */}
        {data.statusSurvei === 'Disetujui' && (
          <Card sx={{ mb: 3, border: '1px solid', borderColor: data.connectionDataId?.idTeknisiDED ? 'success.main' : 'warning.main' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>Teknisi DED / RAB</Typography>
              {data.connectionDataId?.idTeknisiDED ? (
                <>
                  <Typography variant='body2' color='text.secondary'>Ditugaskan:</Typography>
                  <Typography variant='body1' fontWeight={600}>{data.connectionDataId.idTeknisiDED.namaLengkap}</Typography>
                  <Typography variant='body2' color='text.secondary'>{data.connectionDataId.idTeknisiDED.email}</Typography>
                  {data.connectionDataId.assignedDEDAt && (
                    <Typography variant='caption' color='text.secondary'>
                      Assign: {new Date(data.connectionDataId.assignedDEDAt).toLocaleString('id-ID')}
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity='warning' sx={{ mt: 1 }}>
                  Survei disetujui. Assign teknisi untuk membuat dokumen DED dan RAB.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Dialog Assign Teknisi DED */}
        <Dialog open={assignDEDOpen} onClose={() => setAssignDEDOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Teknisi DED / RAB</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pilih teknisi yang akan membuat dokumen DED dan tabel RAB berdasarkan hasil survei.
            </Typography>
            {loadingTeknisi ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Pilih Teknisi</InputLabel>
                <Select
                  value={selectedTeknisiDED}
                  onChange={(e) => setSelectedTeknisiDED(e.target.value)}
                  label="Pilih Teknisi"
                >
                  <MenuItem value=""><em>-- Pilih Teknisi --</em></MenuItem>
                  {teknisiList.map((t: any) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.namaLengkap} — {t.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAssignDEDOpen(false); setSelectedTeknisiDED(''); }}>Batal</Button>
            <Button
              variant="contained"
              disabled={!selectedTeknisiDED || assigning}
              onClick={() => assignTeknisiDED({
                variables: { id: data.connectionDataId?._id, technicianId: selectedTeknisiDED },
              })}
            >
              {assigning ? <CircularProgress size={20} /> : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tolak Survei</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Berikan alasan penolakan. Teknisi akan melakukan survei ulang.
            </Typography>
            <TextField
              fullWidth
              label="Alasan Penolakan"
              value={alasanPenolakan}
              onChange={(e) => setAlasanPenolakan(e.target.value)}
              multiline
              rows={3}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Batal</Button>
            <Button
              variant="contained"
              color="error"
              disabled={!alasanPenolakan.trim() || rejecting}
              onClick={() => rejectSurvei({ variables: { id, alasanPenolakan } })}
            >
              {rejecting ? <CircularProgress size={20} /> : 'Tolak Survei'}
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
