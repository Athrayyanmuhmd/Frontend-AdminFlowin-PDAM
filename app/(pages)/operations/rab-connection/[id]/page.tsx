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
  HourglassEmpty,
  AttachFile,
  Download,
  ThumbUp,
  ThumbDown,
  OpenInNew,
  GroupAdd,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useGetRABConnection } from '../../../../../lib/graphql/hooks/useRABConnection';
import { useMutation, useQuery } from '@apollo/client/react';
import { ASSIGN_TEKNISI_RAB } from '../../../../../lib/graphql/mutations/survei';
import { APPROVE_WORK_ORDER } from '../../../../../lib/graphql/mutations/workOrder';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import { GET_WO_BY_RAB } from '../../../../../lib/graphql/queries/rabConnection';

export default function RabConnectionDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const { rabConnection: rabData, loading, error: graphqlError, refetch } = useGetRABConnection(id);

  const { data: woData, loading: woLoading, refetch: refetchWO } = useQuery(GET_WO_BY_RAB, {
    variables: { rabId: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const wo = (woData as any)?.getWOByRAB || null;

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
    totalBiaya: rabData.totalBiaya,
    isPaid: rabData.statusPembayaran === 'Settlement',
    statusPembayaran: rabData.statusPembayaran,
    urlRab: rabData.urlRab || '',
    catatan: rabData.catatan,
    createdAt: rabData.createdAt,
    updatedAt: rabData.updatedAt,
  } : null;

  const [error, setError] = useState(graphqlError?.message || '');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Assign teknisi WO
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);

  const { data: teknisiData, loading: loadingTeknisi } = useQuery(GET_ALL_TEKNISI, {
    skip: !assignOpen,
    fetchPolicy: 'network-only',
  });
  const teknisiList = (teknisiData as any)?.getAllTeknisi || [];

  const [assignTeknisiRAB, { loading: assigning }] = useMutation(ASSIGN_TEKNISI_RAB, {
    onCompleted: () => {
      refetchWO();
      setAssignOpen(false);
      setSelectedTeknisiIds([]);
      setSnackbar({ open: true, message: 'Teknisi berhasil di-assign ke work order DED/RAB.', severity: 'success' });
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

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

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}

        {data.isPaid && (
          <Alert severity='success' sx={{ mb: 3 }}>
            Pembayaran RAB telah dikonfirmasi. Proses instalasi dapat dilanjutkan.
          </Alert>
        )}

        {/* Work Order DED/RAB */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: wo?.disetujui === true ? 'success.main' : wo?.disetujui === false ? 'error.main' : 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant='h6' gutterBottom>Work Order DED / RAB</Typography>
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
                    <Typography variant='body2' color='text.secondary'>Status: {wo.status}</Typography>
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
                  <Alert severity='info' sx={{ mt: 1 }}>
                    Belum ada work order untuk RAB ini. Assign teknisi untuk membuat dokumen DED dan RAB.
                  </Alert>
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
                  {wo ? 'Ubah Tim' : 'Assign Teknisi DED'}
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
                      Setujui RAB
                    </Button>
                    <Button
                      variant='outlined'
                      color='error'
                      size='small'
                      startIcon={<ThumbDown />}
                      onClick={() => setRejectOpen(true)}
                    >
                      Tolak RAB
                    </Button>
                  </>
                )}
              </Box>
            </Box>
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
                  {formatCurrency(data.totalBiaya)}
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

        {/* Payment Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>Status Pembayaran</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>Status:</Typography>
                <Chip
                  label={data.statusPembayaran}
                  color={data.isPaid ? 'success' : 'warning'}
                  size='medium'
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                {data.isPaid ? (
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

      {/* Dialog Assign Teknisi DED */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Teknisi DED / RAB</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pilih teknisi yang akan membuat dokumen DED dan tabel RAB. Work order akan tercatat di menu Manajemen WO.
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
            onClick={() => assignTeknisiRAB({ variables: { rabId: id, teknisiIds: selectedTeknisiIds } })}
          >
            {assigning ? <CircularProgress size={20} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Setujui WO RAB */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setujui Work Order RAB</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Menyetujui WO berarti dokumen DED/RAB telah diperiksa dan diterima. Pelanggan akan ditagih sesuai total biaya.
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

      {/* Dialog Tolak WO RAB */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tolak Work Order RAB</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Berikan catatan alasan penolakan. Teknisi perlu merevisi dokumen DED/RAB.
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
    </AdminLayout>
  );
}
