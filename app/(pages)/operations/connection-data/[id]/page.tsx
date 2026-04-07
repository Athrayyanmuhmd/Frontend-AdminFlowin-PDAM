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
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Description,
  Close,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  Assignment,
  Visibility,
  Speed,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { ConnectionData } from '../../../../services/connectionData.service';
import AssignTechnicianDialog from '../../../../components/AssignTechnicianDialog';
import { useGetConnectionData } from '../../../../../lib/graphql/hooks/useConnectionData';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { GET_SURVEI_BY_KONEKSI_DATA, GET_WO_BY_SURVEI } from '../../../../../lib/graphql/queries/surveyData';
import { GET_RAB_BY_KONEKSI_DATA, GET_WO_BY_RAB } from '../../../../../lib/graphql/queries/rabConnection';

const VERIFY_KONEKSI_DATA = gql`
  mutation VerifyKoneksiData($id: ID!, $status: String!, $catatan: String, $alasanPenolakan: String) {
    verifyKoneksiData(id: $id, status: $status, catatan: $catatan, alasanPenolakan: $alasanPenolakan) {
      _id
      statusVerifikasi
      alasanPenolakan
      tanggalVerifikasi
      catatan
    }
  }
`;

export default function ConnectionDataDetail() {
  const params = useParams();
  const router = useRouter();
  const { userRole } = useAdmin();

  const id = params.id as string;

  const [data, setData] = useState<ConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  // Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Tolak dialog state
  const [tolakDialogOpen, setTolakDialogOpen] = useState(false);
  const [alasanPenolakanInput, setAlasanPenolakanInput] = useState('');

  // ✅ GraphQL Query - Replace REST API
  const { connectionData: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useGetConnectionData(id);

  // Query survei & RAB yang terhubung ke koneksi ini
  const { data: surveiResult, refetch: refetchSurvei } = useQuery(GET_SURVEI_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const survei = (surveiResult as any)?.getSurveiByKoneksiData || null;

  const { data: rabResult, refetch: refetchRAB } = useQuery(GET_RAB_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const rab = (rabResult as any)?.getRABByKoneksiData || null;

  const { data: woSurveiResult, refetch: refetchWOSurvei } = useQuery(GET_WO_BY_SURVEI, {
    variables: { surveiId: survei?._id },
    fetchPolicy: 'network-only',
    skip: !survei?._id,
  });
  const woSurvei = (woSurveiResult as any)?.getWOBySurvei || null;

  const { data: woRabResult, refetch: refetchWORAB } = useQuery(GET_WO_BY_RAB, {
    variables: { rabId: rab?._id },
    fetchPolicy: 'network-only',
    skip: !rab?._id,
  });
  const woRab = (woRabResult as any)?.getWOByRAB || null;

  const [verifyKoneksiDataMutation] = useMutation(VERIFY_KONEKSI_DATA);

  // Transform and set data when GraphQL loads
  useEffect(() => {
    if (graphqlData) {
      const transformedData: ConnectionData = {
        _id: graphqlData._id,
        // Map idPelanggan object to userId object (matches interface shape)
        userId: graphqlData.idPelanggan ? {
          _id: graphqlData.idPelanggan._id,
          namaLengkap: graphqlData.idPelanggan.namaLengkap,
          email: graphqlData.idPelanggan.email,
          noHP: graphqlData.idPelanggan.noHP,
        } : null,
        // Map ERD uppercase fields to lowercase interface fields
        nik: graphqlData.NIK || '',
        nikUrl: graphqlData.NIKUrl || '',
        noKK: graphqlData.noKK || '',
        kkUrl: graphqlData.KKUrl || '',
        noImb: graphqlData.IMB || '',
        imbUrl: graphqlData.IMBUrl || '',
        alamat: graphqlData.alamat,
        kelurahan: graphqlData.kelurahan,
        kecamatan: graphqlData.kecamatan,
        luasBangunan: graphqlData.luasBangunan,
        statusVerifikasi: graphqlData.statusVerifikasi,
        catatan: graphqlData.catatan || null,
        alasanPenolakan: graphqlData.alasanPenolakan || null,
        tanggalVerifikasi: graphqlData.tanggalVerifikasi || null,
        isVerifiedByData: graphqlData.statusVerifikasi === 'Disetujui',
        isVerifiedByTechnician: false,
        isAllProcedureDone: graphqlData.statusVerifikasi === 'Disetujui',
        surveiId: null,
        rabConnectionId: null,
        catatanTeknisi: null,
        tanggalVerifikasiTeknisi: null,
        // Map assign fields
        assignedTechnicianId: graphqlData.idTeknisi ? {
          _id: graphqlData.idTeknisi._id,
          namaLengkap: graphqlData.idTeknisi.namaLengkap,
          email: graphqlData.idTeknisi.email,
          noHP: graphqlData.idTeknisi.noHP,
        } : null,
        assignedAt: graphqlData.assignedAt || null,
        assignedBy: graphqlData.assignedBy ? {
          _id: graphqlData.assignedBy._id,
          namaLengkap: graphqlData.assignedBy.namaLengkap,
          email: graphqlData.assignedBy.email,
        } : null,
        createdAt: graphqlData.createdAt,
        updatedAt: graphqlData.updatedAt,
      };
      setData(transformedData);
    }
  }, [graphqlData]);

  useEffect(() => {
    if (graphqlError) {
      setError(graphqlError.message);
    }
  }, [graphqlError]);

  useEffect(() => {
    setLoading(graphqlLoading);
  }, [graphqlLoading]);

  const fetchData = async () => {
    // Use GraphQL refetch instead
    refetch();
  };

  const handleVerifyAdmin = async () => {
    if (!data) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyKoneksiDataMutation({
        variables: { id: data._id, status: 'Disetujui', catatan: 'Diverifikasi oleh Admin' },
      });
      setSuccess('Data berhasil diverifikasi oleh admin');
      setData(prev => prev ? { ...prev, isVerifiedByData: true, statusVerifikasi: 'Disetujui' } : prev);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan verifikasi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteProcedure = async () => {
    if (!data) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyKoneksiDataMutation({
        variables: { id: data._id, status: 'Disetujui', catatan: 'Semua prosedur selesai' },
      });
      setSuccess('Semua prosedur berhasil diselesaikan');
      setData(prev => prev ? { ...prev, isAllProcedureDone: true } : prev);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal menyelesaikan prosedur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTolak = async () => {
    if (!data || !alasanPenolakanInput.trim()) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyKoneksiDataMutation({
        variables: { id: data._id, status: 'Ditolak', alasanPenolakan: alasanPenolakanInput.trim() },
      });
      setSuccess('Pengajuan berhasil ditolak');
      setTolakDialogOpen(false);
      setAlasanPenolakanInput('');
      setData(prev => prev ? { ...prev, isVerifiedByData: false, statusVerifikasi: 'Ditolak' } : prev);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal menolak pengajuan');
    } finally {
      setActionLoading(false);
    }
  };

  const openDocumentViewer = (url: string, title: string) => {
    setViewerImage(url);
    setViewerTitle(title);
    setZoom(100);
    setViewerOpen(true);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
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
          <Alert severity='error'>Data tidak ditemukan</Alert>
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
            <Typography variant='h4'>Detail Data Sambungan</Typography>
            <Typography variant='body2' color='text.secondary'>
              {data.nik ? `NIK: ${data.nik}` : 'Data Sambungan'}
            </Typography>
          </Box>
          {data.isAllProcedureDone ? (
            <Chip label='Selesai' color='success' icon={<CheckCircle />} />
          ) : (
            <Chip label='Proses' color='warning' icon={<HourglassEmpty />} />
          )}
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Alur Pengajuan Sequential */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Alur Pengajuan Sambungan</Typography>
            <Stepper orientation='vertical' nonLinear>

              {/* Step 1: Verifikasi Admin */}
              <Step active completed={data.statusVerifikasi === 'Disetujui'}>
                <StepLabel
                  icon={
                    data.statusVerifikasi === 'Disetujui' ? <CheckCircle color='success' /> :
                    data.statusVerifikasi === 'Ditolak' ? <Cancel color='error' /> :
                    <HourglassEmpty color='warning' />
                  }
                >
                  <Typography fontWeight={600}>Verifikasi Admin</Typography>
                  <Chip
                    size='small'
                    label={data.statusVerifikasi === 'Disetujui' ? 'Disetujui' : data.statusVerifikasi === 'Ditolak' ? 'Ditolak' : 'Menunggu'}
                    color={data.statusVerifikasi === 'Disetujui' ? 'success' : data.statusVerifikasi === 'Ditolak' ? 'error' : 'warning'}
                    sx={{ ml: 1 }}
                  />
                </StepLabel>
                <StepContent>
                  {data.statusVerifikasi === 'Menunggu' && userRole === 'admin' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size='small' variant='contained' color='success'
                        startIcon={actionLoading ? <CircularProgress size={14} /> : <CheckCircle />}
                        onClick={handleVerifyAdmin} disabled={actionLoading}>
                        Setujui
                      </Button>
                      <Button size='small' variant='outlined' color='error'
                        startIcon={<Cancel />} onClick={() => setTolakDialogOpen(true)} disabled={actionLoading}>
                        Tolak
                      </Button>
                    </Box>
                  )}
                  {data.statusVerifikasi === 'Ditolak' && data.alasanPenolakan && (
                    <Alert severity='error' sx={{ mt: 1 }}>Alasan: {data.alasanPenolakan}</Alert>
                  )}
                </StepContent>
              </Step>

              {/* Step 2: Survei Lapangan */}
              <Step active={data.statusVerifikasi === 'Disetujui'} completed={!!survei && woSurvei?.disetujui === true}>
                <StepLabel
                  icon={
                    !survei ? <RadioButtonUnchecked color={data.statusVerifikasi === 'Disetujui' ? 'warning' : 'disabled'} /> :
                    woSurvei?.disetujui === true ? <CheckCircle color='success' /> :
                    woSurvei?.disetujui === false ? <Cancel color='error' /> :
                    <HourglassEmpty color='warning' />
                  }
                >
                  <Typography fontWeight={600} color={data.statusVerifikasi !== 'Disetujui' ? 'text.disabled' : 'text.primary'}>
                    Survei Lapangan
                  </Typography>
                  {survei && (
                    <Chip size='small' sx={{ ml: 1 }}
                      label={woSurvei?.disetujui === true ? 'WO Disetujui' : woSurvei?.disetujui === false ? 'WO Ditolak' : survei ? 'Survei Ada' : 'Belum Ada'}
                      color={woSurvei?.disetujui === true ? 'success' : woSurvei?.disetujui === false ? 'error' : 'warning'}
                    />
                  )}
                </StepLabel>
                <StepContent>
                  {data.statusVerifikasi === 'Disetujui' && (
                    survei ? (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button size='small' variant='outlined' startIcon={<Visibility />}
                          onClick={() => router.push(`/operations/survey-data/${survei._id}`)}>
                          Lihat & Kelola WO Survei
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant='caption' color='text.secondary'>
                        Menunggu teknisi lapangan melakukan survei
                      </Typography>
                    )
                  )}
                </StepContent>
              </Step>

              {/* Step 3: Dokumen DED / RAB */}
              <Step active={woSurvei?.disetujui === true} completed={!!rab && woRab?.disetujui === true && rab.statusPembayaran === 'Settlement'}>
                <StepLabel
                  icon={
                    !rab ? <RadioButtonUnchecked color={woSurvei?.disetujui === true ? 'warning' : 'disabled'} /> :
                    rab.statusPembayaran === 'Settlement' ? <CheckCircle color='success' /> :
                    woRab?.disetujui === true ? <HourglassEmpty color='info' /> :
                    woRab?.disetujui === false ? <Cancel color='error' /> :
                    <HourglassEmpty color='warning' />
                  }
                >
                  <Typography fontWeight={600} color={woSurvei?.disetujui !== true ? 'text.disabled' : 'text.primary'}>
                    Dokumen DED / RAB
                  </Typography>
                  {rab && (
                    <Chip size='small' sx={{ ml: 1 }}
                      label={
                        rab.statusPembayaran === 'Settlement' ? 'Lunas' :
                        woRab?.disetujui === true ? 'Menunggu Bayar' :
                        woRab?.disetujui === false ? 'WO Ditolak' :
                        'Menunggu Persetujuan'
                      }
                      color={rab.statusPembayaran === 'Settlement' ? 'success' : woRab?.disetujui === false ? 'error' : 'warning'}
                    />
                  )}
                </StepLabel>
                <StepContent>
                  {woSurvei?.disetujui === true && (
                    rab ? (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Button size='small' variant='outlined' startIcon={<Visibility />}
                          onClick={() => router.push(`/operations/rab-connection/${rab._id}`)}>
                          Lihat & Kelola WO RAB
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant='caption' color='text.secondary'>
                        Menunggu teknisi membuat dokumen DED dan RAB
                      </Typography>
                    )
                  )}
                </StepContent>
              </Step>

              {/* Step 4: Pemasangan */}
              <Step active={rab?.statusPembayaran === 'Settlement'} completed={false}>
                <StepLabel
                  icon={<RadioButtonUnchecked color={rab?.statusPembayaran === 'Settlement' ? 'warning' : 'disabled'} />}
                >
                  <Typography fontWeight={600} color={rab?.statusPembayaran !== 'Settlement' ? 'text.disabled' : 'text.primary'}>
                    Pemasangan Meteran
                  </Typography>
                </StepLabel>
                <StepContent>
                  {rab?.statusPembayaran === 'Settlement' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size='small' variant='outlined' startIcon={<Speed />}
                        onClick={() => router.push(`/operations/pemasangan?koneksiId=${data._id}`)}>
                        Lihat Pemasangan
                      </Button>
                    </Box>
                  )}
                </StepContent>
              </Step>

            </Stepper>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Informasi Pelanggan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Nama Lengkap
                </Typography>
                <Typography variant='body1'>
                  {data.userId?.namaLengkap || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Email
                </Typography>
                <Typography variant='body1'>
                  {data.userId?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Nomor HP
                </Typography>
                <Typography variant='body1'>
                  {data.userId?.noHP || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  NIK
                </Typography>
                <Typography variant='body1'>{data.nik || '—'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Nomor KK
                </Typography>
                <Typography variant='body1'>{data.noKK}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Informasi Properti
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>
                  Alamat Lengkap
                </Typography>
                <Typography variant='body1'>{data.alamat}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Kelurahan
                </Typography>
                <Typography variant='body1'>{data.kelurahan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Kecamatan
                </Typography>
                <Typography variant='body1'>{data.kecamatan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Luas Bangunan
                </Typography>
                <Typography variant='body1'>{data.luasBangunan} m²</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Dokumen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Description
                    sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                  />
                  <Typography variant='body2' gutterBottom>
                    Foto KTP (NIK)
                  </Typography>
                  <Button
                    size='small'
                    variant='outlined'
                    disabled={!data.nikUrl}
                    onClick={() => openDocumentViewer(data.nikUrl, 'Foto KTP')}
                  >
                    {data.nikUrl ? 'Lihat Dokumen' : 'Belum Upload'}
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Description
                    sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                  />
                  <Typography variant='body2' gutterBottom>
                    Foto KK
                  </Typography>
                  <Button
                    size='small'
                    variant='outlined'
                    disabled={!data.kkUrl}
                    onClick={() => openDocumentViewer(data.kkUrl, 'Foto KK')}
                  >
                    {data.kkUrl ? 'Lihat Dokumen' : 'Belum Upload'}
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Description
                    sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
                  />
                  <Typography variant='body2' gutterBottom>
                    Foto IMB
                  </Typography>
                  <Button
                    size='small'
                    variant='outlined'
                    disabled={!data.imbUrl}
                    onClick={() => openDocumentViewer(data.imbUrl, 'Foto IMB')}
                  >
                    {data.imbUrl ? 'Lihat Dokumen' : 'Belum Upload'}
                  </Button>
                </Paper>
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
                <Typography variant='body2' color='text.secondary'>Tanggal Pengajuan:</Typography>
                <Typography variant='body1'>
                  {data.createdAt ? new Date(data.createdAt).toLocaleString('id-ID') : '—'}
                </Typography>
              </Grid>
              {data.tanggalVerifikasi && (
                <Grid item xs={12} md={6}>
                  <Typography variant='body2' color='text.secondary'>Tanggal Verifikasi Admin:</Typography>
                  <Typography variant='body1'>
                    {new Date(data.tanggalVerifikasi).toLocaleString('id-ID')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Tolak Dialog */}
        <Dialog open={tolakDialogOpen} onClose={() => setTolakDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Tolak Pengajuan Sambungan Air</DialogTitle>
          <DialogContent>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Masukkan alasan penolakan pengajuan dari <strong>{data?.userId?.namaLengkap}</strong>.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label='Alasan Penolakan'
              value={alasanPenolakanInput}
              onChange={e => setAlasanPenolakanInput(e.target.value)}
              required
              error={!alasanPenolakanInput.trim()}
              helperText={!alasanPenolakanInput.trim() ? 'Alasan penolakan wajib diisi' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setTolakDialogOpen(false); setAlasanPenolakanInput(''); }}>Batal</Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleTolak}
              disabled={actionLoading || !alasanPenolakanInput.trim()}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <Cancel />}
            >
              Tolak Pengajuan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Document Viewer Dialog */}
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
                <IconButton size='small' onClick={handleZoomReset}>
                  <RestartAlt />
                </IconButton>
                <Divider orientation='vertical' flexItem sx={{ mx: 1 }} />
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

        {/* Assignment Dialog */}
        <AssignTechnicianDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          connectionDataId={data._id}
          currentTechnicianId={data.assignedTechnicianId?._id}
          currentTechnicianName={data.assignedTechnicianId?.namaLengkap}
          onSuccess={() => {
            setSuccess('Teknisi berhasil di-assign');
            refetch();
          }}
        />
      </Box>
    </AdminLayout>
  );
}
