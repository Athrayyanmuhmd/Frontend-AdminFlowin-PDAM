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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  GroupAdd,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetSurveyData } from '../../../../../lib/graphql/hooks/useSurveyData';
import { useMutation, useQuery } from '@apollo/client/react';
import { ASSIGN_TEKNISI_SURVEI } from '../../../../../lib/graphql/mutations/survei';
import { APPROVE_WORK_ORDER } from '../../../../../lib/graphql/mutations/workOrder';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import { GET_WO_BY_SURVEI } from '../../../../../lib/graphql/queries/surveyData';

export default function SurveyDataDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { surveyData: graphqlSurvey, loading, error: graphqlError, refetch } = useGetSurveyData(id);

  const { data: woData, loading: woLoading, refetch: refetchWO } = useQuery(GET_WO_BY_SURVEI, {
    variables: { surveiId: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const wo = (woData as any)?.getWOBySurvei || null;

  const data = graphqlSurvey ? {
    _id: graphqlSurvey._id,
    connectionDataId: graphqlSurvey.idKoneksiData ? {
      _id: graphqlSurvey.idKoneksiData._id,
      nik: graphqlSurvey.idKoneksiData.NIK || graphqlSurvey.idKoneksiData.alamat || '',
      alamat: graphqlSurvey.idKoneksiData.alamat || '',
      userId: graphqlSurvey.idKoneksiData.idPelanggan ? {
        namaLengkap: graphqlSurvey.idKoneksiData.idPelanggan.namaLengkap,
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

  // Assign teknisi WO
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);

  const { data: teknisiData, loading: loadingTeknisi } = useQuery(GET_ALL_TEKNISI, {
    skip: !assignOpen,
    fetchPolicy: 'network-only',
  });
  const teknisiList = (teknisiData as any)?.getAllTeknisi || [];

  const [assignTeknisiSurvei, { loading: assigning }] = useMutation(ASSIGN_TEKNISI_SURVEI, {
    onCompleted: () => {
      refetchWO();
      setAssignOpen(false);
      setSelectedTeknisiIds([]);
      setSnackbar({ open: true, message: 'Teknisi berhasil di-assign ke work order survei.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

  // Approve / reject WO
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [catatanWO, setCatatanWO] = useState('');

  const [approveWorkOrder, { loading: approving }] = useMutation(APPROVE_WORK_ORDER, {
    onCompleted: () => {
      refetchWO();
      setApproveOpen(false);
      setRejectOpen(false);
      setCatatanWO('');
      setSnackbar({ open: true, message: 'Status work order berhasil diperbarui.', severity: 'success' });
    },
    onError: (err) => setSnackbar({ open: true, message: 'Gagal: ' + err.message, severity: 'error' }),
  });

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

  const getWOStatusColor = (disetujui: boolean | null) => {
    if (disetujui === true) return 'success';
    if (disetujui === false) return 'error';
    return 'default';
  };

  const getWOStatusLabel = (disetujui: boolean | null) => {
    if (disetujui === true) return 'Disetujui';
    if (disetujui === false) return 'Ditolak';
    return 'Menunggu Verifikasi';
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

        {/* Work Order Status Card */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: wo?.disetujui === true ? 'success.main' : wo?.disetujui === false ? 'error.main' : 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant='h6' gutterBottom>Work Order Survei</Typography>
                {woLoading ? (
                  <CircularProgress size={20} />
                ) : wo ? (
                  <>
                    <Chip
                      label={getWOStatusLabel(wo.disetujui)}
                      color={getWOStatusColor(wo.disetujui)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant='body2' color='text.secondary'>
                      Status: {wo.status}
                    </Typography>
                    {wo.tim?.length > 0 && (
                      <Typography variant='body2'>
                        Tim: {wo.tim.map((t: any) => t.namaLengkap).join(', ')}
                      </Typography>
                    )}
                    {wo.catatan && (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        Catatan: {wo.catatan}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Alert severity='info' sx={{ mt: 1 }}>Belum ada work order untuk survei ini. Assign teknisi untuk membuat WO.</Alert>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={wo ? 'outlined' : 'contained'}
                  startIcon={<GroupAdd />}
                  onClick={() => {
                    if (wo?.tim) setSelectedTeknisiIds(wo.tim.map((t: any) => t._id));
                    setAssignOpen(true);
                  }}
                  size="small"
                >
                  {wo ? 'Ubah Tim' : 'Assign Teknisi'}
                </Button>
                {wo && wo.disetujui === null && (
                  <>
                    <Button
                      variant='contained'
                      color='success'
                      size='small'
                      startIcon={<ThumbUp />}
                      onClick={() => setApproveOpen(true)}
                    >
                      Setujui
                    </Button>
                    <Button
                      variant='outlined'
                      color='error'
                      size='small'
                      startIcon={<ThumbDown />}
                      onClick={() => setRejectOpen(true)}
                    >
                      Tolak
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Survey Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Detail Survei</Typography>
            <Grid container spacing={3}>
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
                <Typography variant='body1'>{new Date(data.createdAt).toLocaleString('id-ID')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Diperbarui pada:</Typography>
                <Typography variant='body1'>{new Date(data.updatedAt).toLocaleString('id-ID')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Dialog Assign Teknisi */}
        <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Teknisi Survei</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pilih teknisi yang akan melaksanakan pekerjaan survei. Work order akan dibuat di menu Manajemen WO.
            </Typography>
            {loadingTeknisi ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress /></Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Pilih Teknisi</InputLabel>
                <Select
                  multiple
                  value={selectedTeknisiIds}
                  onChange={(e) => setSelectedTeknisiIds(e.target.value as string[])}
                  label="Pilih Teknisi"
                  renderValue={(selected) =>
                    teknisiList
                      .filter((t: any) => selected.includes(t._id))
                      .map((t: any) => t.namaLengkap)
                      .join(', ')
                  }
                >
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
            <Button onClick={() => { setAssignOpen(false); setSelectedTeknisiIds([]); }}>Batal</Button>
            <Button
              variant="contained"
              disabled={selectedTeknisiIds.length === 0 || assigning}
              onClick={() => assignTeknisiSurvei({ variables: { surveiId: id, teknisiIds: selectedTeknisiIds } })}
            >
              {assigning ? <CircularProgress size={20} /> : 'Simpan'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Setujui WO */}
        <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Setujui Work Order Survei</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Menyetujui WO berarti survei telah selesai dan hasilnya diterima. Admin dapat melanjutkan ke proses RAB.
            </Typography>
            <TextField
              fullWidth
              label="Catatan (opsional)"
              value={catatanWO}
              onChange={(e) => setCatatanWO(e.target.value)}
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveOpen(false)}>Batal</Button>
            <Button
              variant="contained"
              color="success"
              disabled={approving}
              onClick={() => approveWorkOrder({ variables: { id: wo?._id, disetujui: true, catatan: catatanWO || undefined } })}
            >
              {approving ? <CircularProgress size={20} /> : 'Setujui'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Tolak WO */}
        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tolak Work Order Survei</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Berikan catatan alasan penolakan. Teknisi perlu melakukan perbaikan.
            </Typography>
            <TextField
              fullWidth
              label="Catatan Penolakan"
              value={catatanWO}
              onChange={(e) => setCatatanWO(e.target.value)}
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
              disabled={!catatanWO.trim() || approving}
              onClick={() => approveWorkOrder({ variables: { id: wo?._id, disetujui: false, catatan: catatanWO } })}
            >
              {approving ? <CircularProgress size={20} /> : 'Tolak'}
            </Button>
          </DialogActions>
        </Dialog>

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
