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
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  HourglassEmpty,
  Description,
  Close,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  Assignment,
  AddCircle,
  Visibility,
  AttachMoney,
  Speed,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { ConnectionData } from '../../../../services/connectionData.service';
import AssignTechnicianDialog from '../../../../components/AssignTechnicianDialog';
import { useGetConnectionData } from '../../../../../lib/graphql/hooks/useConnectionData';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

const VERIFY_KONEKSI_DATA = gql`
  mutation VerifyKoneksiData($id: ID!, $verified: Boolean!, $catatan: String) {
    verifyKoneksiData(id: $id, verified: $verified, catatan: $catatan) {
      _id
      statusVerifikasi
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

  // ✅ GraphQL Query - Replace REST API
  const { connectionData: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useGetConnectionData(id);

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
        isVerifiedByData: graphqlData.statusVerifikasi,
        isVerifiedByTechnician: false, // Not available in GraphQL
        isAllProcedureDone: false, // Not available in GraphQL
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
        variables: { id: data._id, verified: true, catatan: 'Diverifikasi oleh Admin' },
      });
      setSuccess('Data berhasil diverifikasi oleh admin');
      setData(prev => prev ? { ...prev, isVerifiedByData: true, statusVerifikasi: true } : prev);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan verifikasi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyTechnician = async () => {
    if (!data) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyKoneksiDataMutation({
        variables: { id: data._id, verified: true, catatan: 'Diverifikasi oleh Teknisi' },
      });
      setSuccess('Data berhasil diverifikasi oleh teknisi');
      setData(prev => prev ? { ...prev, isVerifiedByTechnician: true } : prev);
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
        variables: { id: data._id, verified: true, catatan: 'Semua prosedur selesai' },
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

        {/* Action Buttons */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Aksi
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {userRole === 'admin' && !data.isVerifiedByData && (
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleVerifyAdmin}
                  disabled={actionLoading}
                  startIcon={
                    actionLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CheckCircle />
                    )
                  }
                >
                  Verifikasi sebagai Admin
                </Button>
              )}

              {/* Assignment Button - Show if verified by admin */}
              {userRole === 'admin' &&
                data.isVerifiedByData &&
                !data.surveiId && (
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() => setAssignDialogOpen(true)}
                    disabled={actionLoading}
                    startIcon={<Assignment />}
                  >
                    {data.assignedTechnicianId
                      ? 'Ubah Teknisi'
                      : 'Assign Teknisi'}
                  </Button>
                )}

              {userRole === 'technician' &&
                !data.isVerifiedByTechnician &&
                data.isVerifiedByData && (
                  <Button
                    variant='contained'
                    color='info'
                    onClick={handleVerifyTechnician}
                    disabled={actionLoading}
                    startIcon={
                      actionLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <CheckCircle />
                      )
                    }
                  >
                    Verifikasi sebagai Teknisi
                  </Button>
                )}

              {/* Create Survey Button - Show for admin or technician if verified and no survey yet */}
              {(userRole === 'technician' || userRole === 'admin') &&
                data.isVerifiedByData &&
                !data.surveiId && (
                  <Button
                    variant='contained'
                    color='success'
                    onClick={() =>
                      router.push(
                        `/operations/survey-data/create?connectionId=${data._id}`
                      )
                    }
                    disabled={actionLoading}
                    startIcon={<AddCircle />}
                  >
                    Buat Survei
                  </Button>
                )}

              {/* View Survey Button - Show if survey exists */}
              {data.surveiId && (
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={() =>
                    router.push(`/operations/survey-data/${data.surveiId}`)
                  }
                  startIcon={<Visibility />}
                >
                  Lihat Survei
                </Button>
              )}

              {/* Create RAB Button - Show for admin or technician if survey exists and no RAB yet */}
              {(userRole === 'technician' || userRole === 'admin') &&
                data.surveiId &&
                !data.rabConnectionId && (
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() =>
                      router.push(
                        `/operations/rab-connection/create?connectionId=${data._id}`
                      )
                    }
                    disabled={actionLoading}
                    startIcon={<AttachMoney />}
                  >
                    Buat RAB
                  </Button>
                )}

              {/* View RAB Button - Show if RAB exists */}
              {data.rabConnectionId && (
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={() =>
                    router.push(
                      `/operations/rab-connection/${data.rabConnectionId}`
                    )
                  }
                  startIcon={<Visibility />}
                >
                  Lihat RAB
                </Button>
              )}

              {/* Assign Meteran Button - Show for admin if RAB exists and no meteran yet */}
              {userRole === 'admin' &&
                data.rabConnectionId &&
                !data.meteranId && (
                  <Button
                    variant='contained'
                    color='info'
                    onClick={() =>
                      router.push(
                        `/operations/meteran/create?connectionId=${data._id}`
                      )
                    }
                    disabled={actionLoading}
                    startIcon={<Speed />}
                  >
                    Assign Meteran
                  </Button>
                )}

              {/* View Meteran Button - Show if meteran exists */}
              {data.meteranId && (
                <Button
                  variant='outlined'
                  color='info'
                  onClick={() =>
                    router.push(`/operations/meteran/${data.meteranId}`)
                  }
                  startIcon={<Speed />}
                >
                  Lihat Meteran
                </Button>
              )}

              {userRole === 'admin' &&
                data.isVerifiedByTechnician &&
                !data.isAllProcedureDone && (
                  <Button
                    variant='contained'
                    color='success'
                    onClick={handleCompleteProcedure}
                    disabled={actionLoading}
                    startIcon={
                      actionLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <CheckCircle />
                      )
                    }
                  >
                    Selesaikan Semua Prosedur
                  </Button>
                )}
            </Box>
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

        {/* Assignment Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Status Penugasan
            </Typography>
            {data.assignedTechnicianId ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Teknisi Ditugaskan:
                    </Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {data.assignedTechnicianId.namaLengkap}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {data.assignedTechnicianId.email}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {data.assignedTechnicianId.noHP}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Ditugaskan pada:
                    </Typography>
                    <Typography variant='body1'>
                      {data.assignedAt
                        ? new Date(data.assignedAt).toLocaleString('id-ID')
                        : 'N/A'}
                    </Typography>
                    {data.assignedBy && (
                      <>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 1 }}
                        >
                          Ditugaskan oleh:
                        </Typography>
                        <Typography variant='body1'>
                          {data.assignedBy.namaLengkap}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Alert severity='warning'>
                Teknisi belum ditugaskan. Silakan assign teknisi terlebih
                dahulu.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Status Verifikasi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {data.isVerifiedByData ? (
                    <>
                      <CheckCircle color='success' />
                      <Typography variant='body2'>
                        Terverifikasi Admin
                      </Typography>
                    </>
                  ) : (
                    <>
                      <HourglassEmpty color='disabled' />
                      <Typography variant='body2' color='text.secondary'>
                        Belum Verifikasi Admin
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {data.isVerifiedByTechnician ? (
                    <>
                      <CheckCircle color='success' />
                      <Typography variant='body2'>
                        Terverifikasi Teknisi
                      </Typography>
                    </>
                  ) : (
                    <>
                      <HourglassEmpty color='disabled' />
                      <Typography variant='body2' color='text.secondary'>
                        Belum Verifikasi Teknisi
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {data.isAllProcedureDone ? (
                    <>
                      <CheckCircle color='success' />
                      <Typography variant='body2'>
                        Semua Prosedur Selesai
                      </Typography>
                    </>
                  ) : (
                    <>
                      <HourglassEmpty color='disabled' />
                      <Typography variant='body2' color='text.secondary'>
                        Proses Berlangsung
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
            fetchData();
          }}
        />
      </Box>
    </AdminLayout>
  );
}
