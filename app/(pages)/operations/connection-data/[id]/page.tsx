'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  Chip, Stepper, Step, StepLabel, StepContent, Alert, CircularProgress,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Paper, TextField, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Checkbox,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, HourglassEmpty, Cancel, Description,
  Close, ZoomIn, ZoomOut, RestartAlt, Visibility, RadioButtonUnchecked,
  VerifiedUser, Build, ElectricMeter, Payment, AccountBalance,
  GroupAdd, Assignment,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CONNECTION_DATA_BY_ID } from '../../../../../lib/graphql/queries/connectionData';
import { VERIFY_CONNECTION_DATA } from '../../../../../lib/graphql/mutations/connectionData';
import { GET_SURVEI_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/surveyData';
import { GET_RAB_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/rabConnection';
import { GET_METERAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/meteran';
import { GET_PEMASANGAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/pemasangan';
import { GET_WORK_ORDERS_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/workOrder';
import { BUAT_WORK_ORDER, REVIEW_HASIL } from '../../../../../lib/graphql/mutations/workOrder';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';

// Helpers
function formatRupiah(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('id-ID');
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ConnectionDataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userRole, isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params?.id as string;

  // UI state
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject dialog
  const [tolakDialogOpen, setTolakDialogOpen] = useState(false);
  const [alasanPenolakanInput, setAlasanPenolakanInput] = useState('');

  // WO review dialog
  const [woReviewDialogOpen, setWoReviewDialogOpen] = useState(false);
  const [woReviewId, setWoReviewId] = useState<string | null>(null);
  const [woReviewApprove, setWoReviewApprove] = useState(true);
  const [woReviewCatatan, setWoReviewCatatan] = useState('');
  const [woReviewType, setWoReviewType] = useState('');

  // WO create dialog (assign teknisi)
  const [woCreateDialogOpen, setWoCreateDialogOpen] = useState(false);
  const [woCreateType, setWoCreateType] = useState<string>('survei');
  const [woCreateSelected, setWoCreateSelected] = useState<string>('');

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  // Queries
  const { data: koneksiResult, loading, error, refetch } = useQuery(GET_CONNECTION_DATA_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });
  const data: any = (koneksiResult as any)?.getKoneksiData;

  const isApproved = data?.StatusPengajuan === 'APPROVED';

  const { data: surveiResult, refetch: refetchSurvei } = useQuery(GET_SURVEI_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    skip: !id || !isApproved,
    fetchPolicy: 'network-only',
  });
  const survei: any = (surveiResult as any)?.getSurveiByKoneksiData;

  const { data: rabResult, refetch: refetchRab } = useQuery(GET_RAB_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    skip: !id || !isApproved,
    fetchPolicy: 'network-only',
  });
  const rab: any = (rabResult as any)?.getRABByKoneksiData;

  const { data: meteranResult, refetch: refetchMeteran } = useQuery(GET_METERAN_BY_KONEKSI_DATA, {
    variables: { IdKoneksiData: id },
    skip: !id || !isApproved,
    fetchPolicy: 'network-only',
  });
  const meteran: any = (meteranResult as any)?.getMeteranByKoneksiData;

  const { data: pemasanganResult, refetch: refetchPemasangan } = useQuery(GET_PEMASANGAN_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    skip: !id || !meteran,
    fetchPolicy: 'network-only',
  });
  const pemasangan: any = (pemasanganResult as any)?.getPemasanganByKoneksiData;

  const { data: woResult, refetch: refetchWO } = useQuery(GET_WORK_ORDERS_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    skip: !id || !isApproved,
    fetchPolicy: 'network-only',
  });
  const workOrders: any[] = (woResult as any)?.workOrdersByKoneksiData || [];

  const { data: teknisiResult, loading: teknisiLoading } = useQuery(GET_ALL_TEKNISI, {
    skip: !woCreateDialogOpen,
    fetchPolicy: 'network-only',
  });
  const allTeknisi: any[] = (teknisiResult as any)?.getAllTeknisi || [];

  // Mutations
  const [verifyKoneksiData] = useMutation(VERIFY_CONNECTION_DATA);
  const [buatWorkOrder] = useMutation(BUAT_WORK_ORDER);
  const [reviewHasil] = useMutation(REVIEW_HASIL);

  // Derived WO data
  const woSurvei = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'survei'), [workOrders]);
  const woRab = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'rab'), [workOrders]);
  const woPemasangan = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'pemasangan'), [workOrders]);

  // Step conditions
  const step1Done = !!data;
  const step2Done = isApproved;
  const step3Done = step2Done && !!survei;
  const step4Done = step3Done && !!rab;
  const step5Done = step4Done && rab?.statusPembayaran === 'SETTLEMENT';
  const step6Done = step5Done && !!meteran;
  const step7Done = step6Done && !!pemasangan;
  const step8Done = step7Done && !!meteran?.statusAktif;

  // Dialog helpers
  const openDocumentViewer = (url: string, title: string) => {
    setViewerImage(url);
    setViewerTitle(title);
    setZoom(100);
    setViewerOpen(true);
  };

  const openWoReviewDialog = (type: string, approve: boolean, woId: string) => {
    setWoReviewType(type);
    setWoReviewApprove(approve);
    setWoReviewId(woId);
    setWoReviewCatatan('');
    setWoReviewDialogOpen(true);
  };

  const openWoCreateDialog = (type: string) => {
    setWoCreateType(type);
    setWoCreateSelected('');
    setWoCreateDialogOpen(true);
  };

  // Handlers
  const handleVerifyAdmin = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await verifyKoneksiData({ variables: { id, status: 'APPROVED' } });
      setSuccess('Pengajuan berhasil diverifikasi');
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTolak = async () => {
    if (!alasanPenolakanInput.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await verifyKoneksiData({
        variables: { id, status: 'REJECTED', alasanPenolakan: alasanPenolakanInput.trim() },
      });
      setSuccess('Pengajuan ditolak');
      setTolakDialogOpen(false);
      setAlasanPenolakanInput('');
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menolak');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWO = async () => {
    if (!woCreateSelected) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await buatWorkOrder({
        variables: {
          input: {
            idKoneksiData: id,
            jenisPekerjaan: woCreateType,
            teknisiPenanggungJawab: woCreateSelected,
          },
        },
      });
      setSuccess(`Work order ${woCreateType} berhasil dibuat`);
      setWoCreateDialogOpen(false);
      refetchWO();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat work order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewWO = async () => {
    if (!woReviewId) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await reviewHasil({
        variables: {
          input: {
            workOrderId: woReviewId,
            disetujui: woReviewApprove,
            catatan: woReviewCatatan || undefined,
          },
        },
      });
      setSuccess(`Work order berhasil ${woReviewApprove ? 'disetujui' : 'ditolak'}`);
      setWoReviewDialogOpen(false);
      refetchWO();
      refetchSurvei();
      refetchRab();
      refetchPemasangan();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal review work order');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading / Error / Auth checks
  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  if (error) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Error: {error.message}</Alert>
          <Button sx={{ mt: 2 }} onClick={() => router.back()}>Kembali</Button>
        </Box>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">Data sambungan tidak ditemukan.</Alert>
          <Button sx={{ mt: 2 }} onClick={() => router.back()}>Kembali</Button>
        </Box>
      </AdminLayout>
    );
  }

  // Status helpers
  const statusColor: 'success' | 'error' | 'warning' = data.StatusPengajuan === 'APPROVED' ? 'success'
    : data.StatusPengajuan === 'REJECTED' ? 'error' : 'warning';
  const statusLabel = data.StatusPengajuan === 'APPROVED' ? 'Disetujui'
    : data.StatusPengajuan === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi';

  const getWoStatusChip = (wo: any) => {
    if (!wo) return null;
    const color: 'success' | 'error' | 'info' = wo.status === 'selesai' ? 'success'
      : wo.status === 'dibatalkan' ? 'error' : 'info';
    return <Chip size="small" label={wo.status?.replace(/_/g, ' ')} color={color} />;
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton onClick={() => router.push('/operations/connection-data')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>Detail Sambungan</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.IdPelanggan?.namaLengkap || 'Pelanggan'} &middot; {data.Alamat || '—'}
            </Typography>
          </Box>
          <Chip label={statusLabel} color={statusColor} />
        </Box>

        {/* Alerts */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}
        {data.StatusPengajuan === 'REJECTED' && data.AlasanPenolakan && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Ditolak:</strong> {data.AlasanPenolakan}
          </Alert>
        )}

        {/* PROGRESS STEPPER */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Progres Sambungan Baru
            </Typography>

            <Stepper orientation="vertical" activeStep={-1}>
              {/* Step 1 - Pengajuan */}
              <Step active completed={step1Done}>
                <StepLabel icon={<CheckCircle color="success" />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description fontSize="small" />
                    <Typography fontWeight={600}>Pengajuan Sambungan Baru</Typography>
                    <Chip size="small" label="Selesai" color="success" />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Pelanggan telah mengajukan permohonan sambungan air baru pada {formatDate(data.createdAt)}.
                  </Typography>
                </StepContent>
              </Step>

              {/* Step 2 - Verifikasi Admin */}
              <Step active={step1Done && !step2Done} completed={step2Done}>
                <StepLabel icon={
                  step2Done ? <CheckCircle color="success" /> :
                  data.StatusPengajuan === 'REJECTED' ? <Cancel color="error" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser fontSize="small" />
                    <Typography fontWeight={600} color={data.StatusPengajuan === 'REJECTED' ? 'error.main' : 'text.primary'}>
                      Verifikasi Admin
                    </Typography>
                    <Chip size="small"
                      label={step2Done ? 'Disetujui' : data.StatusPengajuan === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                      color={step2Done ? 'success' : data.StatusPengajuan === 'REJECTED' ? 'error' : 'warning'}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Admin memverifikasi dokumen dan kelayakan pengajuan sambungan air baru.
                  </Typography>
                  {data.StatusPengajuan === 'PENDING' && userRole === 'admin' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" color="success"
                        startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircle />}
                        onClick={handleVerifyAdmin} disabled={actionLoading}>
                        Setujui
                      </Button>
                      <Button size="small" variant="outlined" color="error"
                        startIcon={<Cancel />}
                        onClick={() => setTolakDialogOpen(true)} disabled={actionLoading}>
                        Tolak
                      </Button>
                    </Box>
                  )}
                  {data.TanggalVerifikasi && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Tanggal Verifikasi:</strong> {formatDate(data.TanggalVerifikasi)}
                    </Typography>
                  )}
                </StepContent>
              </Step>

              {/* Step 3 - Survei Lapangan */}
              <Step active={step2Done && !step3Done} completed={step3Done}>
                <StepLabel icon={
                  !step2Done ? <RadioButtonUnchecked color="disabled" /> :
                  step3Done ? <CheckCircle color="success" /> :
                  survei ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" />
                    <Typography fontWeight={600} color={!step2Done ? 'text.disabled' : 'text.primary'}>
                      Survei Lapangan
                    </Typography>
                    {step2Done && (
                      <Chip size="small"
                        label={step3Done ? 'Selesai' : woSurvei ? `WO: ${woSurvei.status?.replace(/_/g, ' ')}` : 'Belum Ada'}
                        color={step3Done ? 'success' : woSurvei ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step2Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi melakukan survei lapangan untuk memeriksa kelayakan lokasi pemasangan.
                      </Typography>
                      {!survei && (
                        <Box>
                          {woSurvei && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Work Order Survei:</strong> {getWoStatusChip(woSurvei)}
                              </Typography>
                              {woSurvei.teknisiPenanggungJawab && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Teknisi:</strong> {woSurvei.teknisiPenanggungJawab.namaLengkap}
                                </Typography>
                              )}
                              {woSurvei.tim?.length > 0 && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Tim:</strong> {woSurvei.tim.map((t: any) => t.namaLengkap).join(', ')}
                                </Typography>
                              )}
                              {woSurvei.status === 'dikirim' && userRole === 'admin' && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button size="small" variant="contained" color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => openWoReviewDialog('survei', true, woSurvei.id)}>
                                    Setujui Hasil
                                  </Button>
                                  <Button size="small" variant="outlined" color="error"
                                    startIcon={<Cancel />}
                                    onClick={() => openWoReviewDialog('survei', false, woSurvei.id)}>
                                    Tolak Hasil
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          {!woSurvei && userRole === 'admin' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" variant="contained" startIcon={<GroupAdd />}
                                onClick={() => openWoCreateDialog('survei')}>
                                Buat Work Order Survei
                              </Button>
                              <Button size="small" variant="outlined"
                                onClick={() => router.push(`/operations/survey-data/create?connectionId=${data._id}`)}>
                                Input Data Survei
                              </Button>
                            </Box>
                          )}
                          {!woSurvei && userRole !== 'admin' && (
                            <Typography variant="body2" color="text.secondary">
                              Menunggu admin membuat work order survei.
                            </Typography>
                          )}
                        </Box>
                      )}
                      {survei && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Data survei sudah ada.{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/survey-data/${survei._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>
                          {woSurvei && (
                            <Typography variant="body2" color="text.secondary">
                              Work Order: {getWoStatusChip(woSurvei)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 4 - Dokumen DED / RAB */}
              <Step active={step3Done && !step4Done} completed={step4Done}>
                <StepLabel icon={
                  !step3Done ? <RadioButtonUnchecked color="disabled" /> :
                  step4Done ? <CheckCircle color="success" /> :
                  rab ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance fontSize="small" />
                    <Typography fontWeight={600} color={!step3Done ? 'text.disabled' : 'text.primary'}>
                      Dokumen DED / RAB
                    </Typography>
                    {step3Done && (
                      <Chip size="small"
                        label={step4Done ? 'RAB Ada' : woRab ? `WO: ${woRab.status?.replace(/_/g, ' ')}` : 'Belum Ada'}
                        color={step4Done ? 'success' : woRab ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step3Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi membuat dokumen DED dan Rancangan Anggaran Biaya (RAB).
                      </Typography>
                      {!rab && (
                        <Box>
                          {woRab && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Work Order RAB:</strong> {getWoStatusChip(woRab)}
                              </Typography>
                              {woRab.teknisiPenanggungJawab && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Teknisi:</strong> {woRab.teknisiPenanggungJawab.namaLengkap}
                                </Typography>
                              )}
                              {woRab.status === 'dikirim' && userRole === 'admin' && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button size="small" variant="contained" color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => openWoReviewDialog('rab', true, woRab.id)}>
                                    Setujui Hasil
                                  </Button>
                                  <Button size="small" variant="outlined" color="error"
                                    startIcon={<Cancel />}
                                    onClick={() => openWoReviewDialog('rab', false, woRab.id)}>
                                    Tolak Hasil
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          {!woRab && userRole === 'admin' && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button size="small" variant="contained" startIcon={<GroupAdd />}
                                onClick={() => openWoCreateDialog('rab')}>
                                Buat Work Order RAB
                              </Button>
                              <Button size="small" variant="outlined" startIcon={<AccountBalance />}
                                onClick={() => router.push(`/operations/rab-connection/create?connectionId=${data._id}`)}>
                                Buat RAB Manual
                              </Button>
                            </Box>
                          )}
                          {!woRab && userRole !== 'admin' && (
                            <Typography variant="body2" color="text.secondary">
                              Menunggu admin membuat work order RAB.
                            </Typography>
                          )}
                        </Box>
                      )}
                      {rab && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total Biaya RAB:</strong> {formatRupiah(rab.totalBiaya)}{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/rab-connection/${rab._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>
                          {woRab && (
                            <Typography variant="body2" color="text.secondary">
                              Work Order: {getWoStatusChip(woRab)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 5 - Pembayaran RAB */}
              <Step active={step4Done && !step5Done} completed={step5Done}>
                <StepLabel icon={
                  !step4Done ? <RadioButtonUnchecked color="disabled" /> :
                  step5Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payment fontSize="small" />
                    <Typography fontWeight={600} color={!step4Done ? 'text.disabled' : 'text.primary'}>
                      Pembayaran RAB oleh Pelanggan
                    </Typography>
                    {step4Done && rab && (
                      <Chip size="small"
                        label={step5Done ? 'Lunas' : 'Menunggu Pembayaran'}
                        color={step5Done ? 'success' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step4Done && rab && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Pelanggan melakukan pembayaran biaya pemasangan sesuai RAB melalui aplikasi.
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Tagihan:</strong> {formatRupiah(rab.totalBiaya)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>Status Pembayaran:</strong>{' '}
                        <Chip size="small"
                          label={step5Done ? 'Settlement (Lunas)' : rab.statusPembayaran || 'Pending'}
                          color={step5Done ? 'success' : 'warning'}
                        />
                      </Typography>
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 6 - Pendaftaran Meteran */}
              <Step active={step5Done && !step6Done} completed={step6Done}>
                <StepLabel icon={
                  !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                  step6Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ElectricMeter fontSize="small" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pendaftaran Meteran
                    </Typography>
                    {step6Done && <Chip size="small" label={`No. ${meteran.NomorMeteran}`} color="success" />}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step5Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Admin mendaftarkan meteran baru untuk pelanggan.
                      </Typography>
                      {step6Done ? (
                        <Box>
                          <Typography variant="body2"><strong>Nomor Meteran:</strong> {meteran.NomorMeteran}</Typography>
                          <Typography variant="body2"><strong>Nomor Akun:</strong> {meteran.NomorAkun}</Typography>
                          <Typography variant="body2"><strong>Kelompok:</strong> {meteran.IdKelompokPelanggan?.NamaKelompok || '—'}</Typography>
                          <Button size="small" variant="text" sx={{ mt: 0.5, textDecoration: 'underline', p: 0, minWidth: 0 }}
                            onClick={() => router.push(`/operations/meteran/${meteran._id}`)}>
                            Lihat detail meteran
                          </Button>
                        </Box>
                      ) : userRole === 'admin' ? (
                        <Button size="small" variant="contained" startIcon={<ElectricMeter />}
                          onClick={() => router.push(`/operations/meteran/create?connectionId=${data._id}`)}>
                          Daftarkan Meteran Baru
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu admin mendaftarkan meteran.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 7 - Pemasangan */}
              <Step active={step6Done && !step7Done} completed={step7Done}>
                <StepLabel icon={
                  !step6Done ? <RadioButtonUnchecked color="disabled" /> :
                  step7Done ? <CheckCircle color="success" /> :
                  pemasangan ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build fontSize="small" />
                    <Typography fontWeight={600} color={!step6Done ? 'text.disabled' : 'text.primary'}>
                      Pemasangan Meteran
                    </Typography>
                    {step6Done && (
                      <Chip size="small"
                        label={step7Done ? 'Selesai' : woPemasangan ? `WO: ${woPemasangan.status?.replace(/_/g, ' ')}` : 'Belum Dipasang'}
                        color={step7Done ? 'success' : woPemasangan ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step6Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi melakukan pemasangan meteran di lokasi pelanggan.
                      </Typography>
                      {!pemasangan && (
                        <Box>
                          {woPemasangan && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Work Order Pemasangan:</strong> {getWoStatusChip(woPemasangan)}
                              </Typography>
                              {woPemasangan.teknisiPenanggungJawab && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Teknisi:</strong> {woPemasangan.teknisiPenanggungJawab.namaLengkap}
                                </Typography>
                              )}
                            </Box>
                          )}
                          {!woPemasangan && userRole === 'admin' && (
                            <Button size="small" variant="contained" startIcon={<GroupAdd />}
                              onClick={() => openWoCreateDialog('pemasangan')}>
                              Buat Work Order Pemasangan
                            </Button>
                          )}
                          {!woPemasangan && userRole !== 'admin' && (
                            <Typography variant="body2" color="text.secondary">
                              Menunggu admin membuat work order pemasangan.
                            </Typography>
                          )}
                        </Box>
                      )}
                      {pemasangan && (
                        <Box>
                          <Typography variant="body2"><strong>Seri Meteran:</strong> {pemasangan.seriMeteran || '—'}</Typography>
                          {pemasangan.catatan && (
                            <Typography variant="body2"><strong>Catatan:</strong> {pemasangan.catatan}</Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button size="small" variant="outlined"
                              onClick={() => router.push('/operations/pemasangan')}>
                              Halaman Pemasangan
                            </Button>
                            <Button size="small" variant="outlined"
                              onClick={() => router.push('/operations/pengawasan-pemasangan')}>
                              Halaman Pengawasan
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 8 - Aktivasi */}
              <Step active={step7Done && !step8Done} completed={step8Done}>
                <StepLabel icon={
                  !step7Done ? <RadioButtonUnchecked color="disabled" /> :
                  step8Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser fontSize="small" />
                    <Typography fontWeight={600} color={!step7Done ? 'text.disabled' : 'text.primary'}>
                      Aktivasi Pelanggan
                    </Typography>
                    {step8Done && <Chip size="small" label="Aktif" color="success" />}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step7Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Sambungan air pelanggan diaktifkan setelah semua proses selesai.
                      </Typography>
                      {step8Done ? (
                        <Alert severity="success">
                          Sambungan air pelanggan telah aktif. Meteran <strong>{meteran?.NomorMeteran}</strong> sudah berjalan.
                        </Alert>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu aktivasi meteran setelah proses pengawasan selesai.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>
            </Stepper>
          </CardContent>
        </Card>

        {/* Info Pelanggan */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Pelanggan</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Nama Lengkap', value: data.IdPelanggan?.namaLengkap },
                { label: 'Email', value: data.IdPelanggan?.email },
                { label: 'Nomor HP', value: data.IdPelanggan?.noHP },
                { label: 'NIK', value: data.NIK },
                { label: 'Nomor KK', value: data.NoKK },
              ].map((item: { label: string; value: string }) => (
                <Grid item xs={12} md={6} key={item.label}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body1">{item.value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Info Properti */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Properti</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Alamat Lengkap</Typography>
                <Typography variant="body1">{data.Alamat}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Kelurahan</Typography>
                <Typography variant="body1">{data.Kelurahan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Kecamatan</Typography>
                <Typography variant="body1">{data.Kecamatan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Luas Bangunan</Typography>
                <Typography variant="body1">{data.LuasBangunan != null ? `${data.LuasBangunan} m²` : '—'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Dokumen */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Dokumen Pengajuan</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Foto KTP (NIK)', url: data.NIKUrl },
                { label: 'Foto KK', url: data.KKUrl },
                { label: 'Foto IMB', url: data.IMBUrl },
              ].map((doc: { label: string; url: string }) => (
                <Grid item xs={12} md={4} key={doc.label}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Description sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" gutterBottom>{doc.label}</Typography>
                    <Button size="small" variant="outlined" disabled={!doc.url}
                      onClick={() => doc.url && openDocumentViewer(doc.url, doc.label)}>
                      {doc.url ? 'Lihat Dokumen' : 'Belum Upload'}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Waktu</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Tanggal Pengajuan</Typography>
                <Typography variant="body1">{formatDate(data.createdAt)}</Typography>
              </Grid>
              {data.TanggalVerifikasi && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Tanggal Verifikasi Admin</Typography>
                  <Typography variant="body1">{formatDate(data.TanggalVerifikasi)}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* DIALOGS */}

        {/* Tolak Dialog */}
        <Dialog open={tolakDialogOpen} onClose={() => setTolakDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tolak Pengajuan Sambungan Air</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Masukkan alasan penolakan untuk <strong>{data?.IdPelanggan?.namaLengkap}</strong>.
            </Typography>
            <TextField fullWidth multiline rows={4}
              label="Alasan Penolakan" value={alasanPenolakanInput}
              onChange={e => setAlasanPenolakanInput(e.target.value)}
              required error={!alasanPenolakanInput.trim()}
              helperText={!alasanPenolakanInput.trim() ? 'Alasan penolakan wajib diisi' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setTolakDialogOpen(false); setAlasanPenolakanInput(''); }}>Batal</Button>
            <Button variant="contained" color="error" onClick={handleTolak}
              disabled={actionLoading || !alasanPenolakanInput.trim()}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <Cancel />}>
              Tolak Pengajuan
            </Button>
          </DialogActions>
        </Dialog>

        {/* WO Review Dialog */}
        <Dialog open={woReviewDialogOpen} onClose={() => setWoReviewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {woReviewApprove ? 'Setujui' : 'Tolak'} Hasil Work Order {woReviewType}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {woReviewApprove
                ? 'Konfirmasi persetujuan hasil pekerjaan. Proses akan berlanjut ke tahap berikutnya.'
                : 'Masukkan alasan penolakan hasil pekerjaan.'}
            </Typography>
            <TextField fullWidth multiline rows={3}
              label={woReviewApprove ? 'Catatan (opsional)' : 'Alasan Penolakan *'}
              value={woReviewCatatan}
              onChange={e => setWoReviewCatatan(e.target.value)}
              required={!woReviewApprove}
              error={!woReviewApprove && !woReviewCatatan.trim()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWoReviewDialogOpen(false)}>Batal</Button>
            <Button variant="contained" color={woReviewApprove ? 'success' : 'error'}
              onClick={handleReviewWO}
              disabled={actionLoading || (!woReviewApprove && !woReviewCatatan.trim())}
              startIcon={actionLoading ? <CircularProgress size={20} /> : woReviewApprove ? <CheckCircle /> : <Cancel />}>
              {woReviewApprove ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* WO Create (Assign Teknisi) Dialog */}
        <Dialog open={woCreateDialogOpen} onClose={() => setWoCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Buat Work Order: {woCreateType}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pilih teknisi penanggung jawab untuk work order {woCreateType}.
            </Typography>
            {teknisiLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : allTeknisi.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Tidak ada teknisi tersedia.
              </Typography>
            ) : (
              <List dense>
                {allTeknisi.map((t: any) => (
                  <ListItem key={t.id} disablePadding>
                    <ListItemButton onClick={() => setWoCreateSelected(t.id)}>
                      <ListItemIcon>
                        <Checkbox edge="start" checked={woCreateSelected === t.id} disableRipple />
                      </ListItemIcon>
                      <ListItemText primary={t.namaLengkap} secondary={`${t.divisi} · ${t.noHp}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWoCreateDialogOpen(false)}>Batal</Button>
            <Button variant="contained" onClick={handleCreateWO}
              disabled={actionLoading || !woCreateSelected}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <GroupAdd />}>
              Buat Work Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Document Viewer Dialog */}
        <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">{viewerTitle}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => setZoom(p => Math.max(p - 25, 50))} disabled={zoom <= 50}><ZoomOut /></IconButton>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>{zoom}%</Typography>
                <IconButton size="small" onClick={() => setZoom(p => Math.min(p + 25, 300))} disabled={zoom >= 300}><ZoomIn /></IconButton>
                <IconButton size="small" onClick={() => setZoom(100)}><RestartAlt /></IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <IconButton onClick={() => setViewerOpen(false)}><Close /></IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, overflow: 'auto' }}>
              {viewerImage.toLowerCase().includes('.pdf') || viewerImage.includes('/raw/upload/') ? (
                <iframe
                  src={viewerImage}
                  title={viewerTitle}
                  style={{ width: `${zoom}%`, height: 600, border: 'none', transition: 'width 0.3s ease' }}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={viewerImage} alt={viewerTitle}
                  style={{ width: `${zoom}%`, height: 'auto', transition: 'width 0.3s ease' }} />
              )}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
