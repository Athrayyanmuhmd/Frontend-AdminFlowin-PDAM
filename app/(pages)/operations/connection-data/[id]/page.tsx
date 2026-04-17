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
  VerifiedUser, Build, Payment, AccountBalance,
  GroupAdd, Assignment, ThumbUp, ThumbDown, Image as ImageIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CONNECTION_DATA_BY_ID } from '../../../../../lib/graphql/queries/connectionData';
import { VERIFY_CONNECTION_DATA } from '../../../../../lib/graphql/mutations/connectionData';
import { GET_SURVEI_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/surveyData';
import { GET_RAB_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/rabConnection';
import { GET_METERAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/meteran';
import { AKTIVASI_PELANGGAN } from '../../../../../lib/graphql/queries/customers';
import { GET_PEMASANGAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/pemasangan';
import {
  GET_PENGAWASAN_BY_PEMASANGAN_ID,
  GET_PENGAWASAN_SETELAH_BY_PEMASANGAN_ID,
} from '../../../../../lib/graphql/queries/pengawasan';
import { GET_WORK_ORDERS_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/workOrder';
import { BUAT_WORK_ORDER, REVIEW_HASIL } from '../../../../../lib/graphql/mutations/workOrder';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import {
  REVIEW_PEMASANGAN,
  REVIEW_PENGAWASAN_PEMASANGAN,
  REVIEW_PENGAWASAN_SETELAH_PEMASANGAN,
} from '../../../../../lib/graphql/mutations/pemasangan';
import { KONFIRMASI_PEMBAYARAN_RAB, TANDAI_LUNAS_RAB } from '../../../../../lib/graphql/mutations/survei';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | number | undefined | null): string {
  if (!dateStr) return '—';
  const num = typeof dateStr === 'number' ? dateStr : (/^\d+$/.test(String(dateStr)) ? Number(dateStr) : NaN);
  const d = !isNaN(num) ? new Date(num) : new Date(dateStr as string);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusAdminChip({ status }: { status?: string }) {
  if (!status || status === 'menunggu_review') return <Chip size="small" label="Menunggu Review" color="warning" />;
  if (status === 'disetujui') return <Chip size="small" label="Disetujui" color="success" icon={<CheckCircle sx={{ fontSize: 14 }} />} />;
  return <Chip size="small" label="Ditolak" color="error" icon={<Cancel sx={{ fontSize: 14 }} />} />;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ConnectionDataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userRole, isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params?.id as string;

  // ─── UI State ────────────────────────────────────────────────────────────
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject dialog (pengajuan)
  const [tolakDialogOpen, setTolakDialogOpen] = useState(false);
  const [alasanPenolakanInput, setAlasanPenolakanInput] = useState('');

  // WO review dialog (survei / rab)
  const [woReviewDialogOpen, setWoReviewDialogOpen] = useState(false);
  const [woReviewId, setWoReviewId] = useState<string | null>(null);
  const [woReviewApprove, setWoReviewApprove] = useState(true);
  const [woReviewCatatan, setWoReviewCatatan] = useState('');
  const [woReviewType, setWoReviewType] = useState('');

  // WO create dialog (assign teknisi)
  const [woCreateDialogOpen, setWoCreateDialogOpen] = useState(false);
  const [woCreateType, setWoCreateType] = useState<string>('survei');
  const [woCreateSelected, setWoCreateSelected] = useState<string>('');

  // Installation review dialog (pemasangan / pengawasan / setelah)
  const [instReviewOpen, setInstReviewOpen] = useState(false);
  const [instReviewConfig, setInstReviewConfig] = useState<{
    type: 'pemasangan' | 'pengawasan' | 'setelah';
    id: string;
    disetujui: boolean;
    label: string;
  } | null>(null);
  const [instReviewCatatan, setInstReviewCatatan] = useState('');

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  // ─── Queries ─────────────────────────────────────────────────────────────
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
    skip: !id || !isApproved,
    fetchPolicy: 'network-only',
  });
  const pemasangan: any = (pemasanganResult as any)?.getPemasanganByKoneksiData;

  const { data: pengawasanResult, refetch: refetchPengawasan } = useQuery(GET_PENGAWASAN_BY_PEMASANGAN_ID, {
    variables: { idPemasangan: pemasangan?._id },
    skip: !pemasangan?._id,
    fetchPolicy: 'network-only',
  });
  const pengawasanList: any[] = (pengawasanResult as any)?.getPengawasanPemasanganByPemasangan || [];
  const pengawasan: any = pengawasanList[0];

  const { data: pengawasanSetelahResult, refetch: refetchPengawasanSetelah } = useQuery(GET_PENGAWASAN_SETELAH_BY_PEMASANGAN_ID, {
    variables: { idPemasangan: pemasangan?._id },
    skip: !pemasangan?._id,
    fetchPolicy: 'network-only',
  });
  const pengawasanSetelahList: any[] = (pengawasanSetelahResult as any)?.getPengawasanSetelahPemasanganByPemasangan || [];
  const pengawasanSetelah: any = pengawasanSetelahList[0];

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

  // ─── Mutations ───────────────────────────────────────────────────────────
  const [verifyKoneksiData] = useMutation(VERIFY_CONNECTION_DATA);
  const [buatWorkOrder] = useMutation(BUAT_WORK_ORDER);
  const [reviewHasil] = useMutation(REVIEW_HASIL);
  const [aktivasiPelangganMut] = useMutation(AKTIVASI_PELANGGAN);
  const [reviewPemasanganMut] = useMutation(REVIEW_PEMASANGAN);
  const [reviewPengawasanMut] = useMutation(REVIEW_PENGAWASAN_PEMASANGAN);
  const [reviewSetelahMut] = useMutation(REVIEW_PENGAWASAN_SETELAH_PEMASANGAN);
  const [konfirmasiPembayaranMut] = useMutation(KONFIRMASI_PEMBAYARAN_RAB);
  const [tandaiLunasMut] = useMutation(TANDAI_LUNAS_RAB);

  // ─── Derived WO data ─────────────────────────────────────────────────────
  const woSurvei = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'survei'), [workOrders]);
  const woRab = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'rab'), [workOrders]);
  const woPemasangan = useMemo(() => workOrders.find((wo: any) => wo.jenisPekerjaan === 'pemasangan'), [workOrders]);

  // ─── Step conditions ─────────────────────────────────────────────────────
  const step1Done = !!data;
  const step2Done = isApproved;
  // Survei: data harus ada DAN WO (jika ada) harus disetujui admin (status 'selesai')
  const step3Done = step2Done && !!survei && (!woSurvei || woSurvei.status === 'selesai');
  // RAB: data harus ada DAN WO (jika ada) harus disetujui admin (status 'selesai')
  const step4Done = step3Done && !!rab && (!woRab || woRab.status === 'selesai');
  // Fix: RAB payment status normalized to UPPERCASE by fieldResolver — compare case-insensitively
  // step5 requires both settlement AND admin confirmation
  const rabPaid = rab?.statusPembayaran?.toUpperCase() === 'SETTLEMENT';
  const step5Done = step4Done && rabPaid && rab?.statusKonfirmasiPembayaran === 'dikonfirmasi';
  // All 3 installation data docs must exist before pemasangan can be approved
  const hasAllInstData = !!pemasangan && !!pengawasan && !!pengawasanSetelah;
  const step6Done = step5Done && pemasangan?.statusAdmin === 'disetujui';
  const step7Done = step6Done && pengawasan?.statusAdmin === 'disetujui';
  const step8Done = step7Done && pengawasanSetelah?.statusAdmin === 'disetujui';
  const step9Done = step8Done && !!meteran?.statusAktif;

  // ─── Dialog helpers ───────────────────────────────────────────────────────
  const openDocumentViewer = (url: string, title: string) => {
    setViewerImage(url); setViewerTitle(title); setZoom(100); setViewerOpen(true);
  };

  const openWoReviewDialog = (type: string, approve: boolean, woId: string) => {
    setWoReviewType(type); setWoReviewApprove(approve); setWoReviewId(woId);
    setWoReviewCatatan(''); setWoReviewDialogOpen(true);
  };

  const openWoCreateDialog = (type: string) => {
    setWoCreateType(type); setWoCreateSelected(''); setWoCreateDialogOpen(true);
  };

  const openInstReview = (type: 'pemasangan' | 'pengawasan' | 'setelah', docId: string, disetujui: boolean) => {
    const labels = { pemasangan: 'Pemasangan Meteran', pengawasan: 'Pengawasan Pemasangan', setelah: 'Pengawasan Setelah Pemasangan' };
    setInstReviewConfig({ type, id: docId, disetujui, label: labels[type] });
    setInstReviewCatatan('');
    setInstReviewOpen(true);
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleVerifyAdmin = async () => {
    setActionLoading(true); setErrorMsg(null);
    try {
      await verifyKoneksiData({ variables: { id, status: 'APPROVED' } });
      setSuccess('Pengajuan berhasil diverifikasi'); refetch();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal memverifikasi'); }
    finally { setActionLoading(false); }
  };

  const handleTolak = async () => {
    if (!alasanPenolakanInput.trim()) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      await verifyKoneksiData({ variables: { id, status: 'REJECTED', alasanPenolakan: alasanPenolakanInput.trim() } });
      setSuccess('Pengajuan ditolak'); setTolakDialogOpen(false); setAlasanPenolakanInput(''); refetch();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal menolak'); }
    finally { setActionLoading(false); }
  };

  const handleCreateWO = async () => {
    if (!woCreateSelected) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      const result = await buatWorkOrder({
        variables: { input: { idKoneksiData: id, jenisPekerjaan: woCreateType, teknisiPenanggungJawab: woCreateSelected } },
      });
      const wo = (result?.data as any)?.buatWorkOrder;
      if (wo?.success === false) { setErrorMsg(wo.message || 'Gagal membuat work order'); return; }
      setSuccess(`Work order ${woCreateType} berhasil dibuat`); setWoCreateDialogOpen(false); refetchWO();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal membuat work order'); }
    finally { setActionLoading(false); }
  };

  const handleReviewWO = async () => {
    if (!woReviewId) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      const result = await reviewHasil({ variables: { input: { workOrderId: woReviewId, disetujui: woReviewApprove, catatan: woReviewCatatan || undefined } } });
      const wo = (result?.data as any)?.reviewHasil;
      if (wo?.success === false) { setErrorMsg(wo.message || 'Gagal review work order'); return; }
      setSuccess(`Work order berhasil ${woReviewApprove ? 'disetujui' : 'ditolak'}`);
      setWoReviewDialogOpen(false); refetchWO(); refetchSurvei(); refetchRab();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal review work order'); }
    finally { setActionLoading(false); }
  };

  const handleInstReview = async () => {
    if (!instReviewConfig) return;
    if (!instReviewConfig.disetujui && !instReviewCatatan.trim()) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      const vars = { variables: { id: instReviewConfig.id, disetujui: instReviewConfig.disetujui, catatan: instReviewCatatan || undefined } };
      if (instReviewConfig.type === 'pemasangan') await reviewPemasanganMut(vars);
      else if (instReviewConfig.type === 'pengawasan') await reviewPengawasanMut(vars);
      else await reviewSetelahMut(vars);
      setSuccess(`${instReviewConfig.label} berhasil ${instReviewConfig.disetujui ? 'disetujui' : 'ditolak'}`);
      setInstReviewOpen(false);
      refetchPemasangan(); refetchPengawasan(); refetchPengawasanSetelah();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal mereview'); }
    finally { setActionLoading(false); }
  };

  const handleKonfirmasiPembayaran = async () => {
    if (!rab?._id) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      await konfirmasiPembayaranMut({ variables: { id: rab._id } });
      setSuccess('Pembayaran RAB berhasil dikonfirmasi'); refetchRab();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal mengkonfirmasi pembayaran'); }
    finally { setActionLoading(false); }
  };

  const handleTandaiLunas = async () => {
    if (!rab?._id) return;
    setActionLoading(true); setErrorMsg(null);
    try {
      await tandaiLunasMut({ variables: { id: rab._id, catatan: 'Dibayar tunai di loket' } });
      setSuccess('RAB ditandai lunas (loket)'); refetchRab();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal menandai lunas'); }
    finally { setActionLoading(false); }
  };

  const handleAktifkanPelanggan = async () => {
    setActionLoading(true); setErrorMsg(null);
    try {
      await aktivasiPelangganMut({ variables: { koneksiDataId: id } });
      setSuccess('Pelanggan berhasil diaktifkan. Sambungan air sudah aktif.'); refetchMeteran(); refetch();
    } catch (err: any) { setErrorMsg(err.message || 'Gagal mengaktifkan pelanggan'); }
    finally { setActionLoading(false); }
  };

  // ─── Auth / Loading checks ────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }
  if (!isAuthenticated) { router.push('/auth/login'); return null; }
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

  // ─── Helpers ─────────────────────────────────────────────────────────────
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

  // Renders admin approve/reject buttons for installation data docs
  const InstReviewButtons = ({ type, docId, currentStatus }: {
    type: 'pemasangan' | 'pengawasan' | 'setelah';
    docId: string;
    currentStatus?: string;
  }) => {
    if (userRole !== 'admin') return null;
    const isApprovedStatus = currentStatus === 'disetujui';
    const isRejected = currentStatus === 'ditolak';
    // Pemasangan: only allow review when all 3 docs exist
    if (type === 'pemasangan' && !hasAllInstData) {
      return (
        <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
          Semua data (pemasangan, pengawasan, pengawasan setelah) harus diisi teknisi terlebih dahulu sebelum dapat direview.
        </Alert>
      );
    }
    return (
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        {!isApprovedStatus && (
          <Button size="small" variant="contained" color="success" startIcon={<ThumbUp />}
            onClick={() => openInstReview(type, docId, true)}>
            Setujui
          </Button>
        )}
        {!isRejected && (
          <Button size="small" variant="outlined" color="error" startIcon={<ThumbDown />}
            onClick={() => openInstReview(type, docId, false)}>
            Tolak
          </Button>
        )}
      </Box>
    );
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
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>}
        {data.StatusPengajuan === 'REJECTED' && data.AlasanPenolakan && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Ditolak:</strong> {data.AlasanPenolakan}
          </Alert>
        )}

        {/* ─── PROGRESS STEPPER ─────────────────────────────────────────────── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Progres Sambungan Baru
            </Typography>

            <Stepper orientation="vertical" activeStep={-1}>

              {/* Step 1 — Pengajuan */}
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

              {/* Step 2 — Verifikasi Admin */}
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
                      <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
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

              {/* Step 3 — Survei Lapangan */}
              <Step active={step2Done && !step3Done} completed={step3Done}>
                <StepLabel icon={
                  !step2Done ? <RadioButtonUnchecked color="disabled" /> :
                  step3Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color={woSurvei ? 'info' : 'warning'} />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" />
                    <Typography fontWeight={600} color={!step2Done ? 'text.disabled' : 'text.primary'}>
                      Survei Lapangan
                    </Typography>
                    {step2Done && (
                      <Chip size="small"
                        label={
                          step3Done ? 'Disetujui' :
                          woSurvei?.status === 'dikirim' ? 'Menunggu Review' :
                          woSurvei ? `WO: ${woSurvei.status?.replace(/_/g, ' ')}` : 'Belum Ada'
                        }
                        color={
                          step3Done ? 'success' :
                          woSurvei?.status === 'dikirim' ? 'warning' :
                          woSurvei ? 'info' : 'default'
                        }
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

                      {/* WO info — selalu tampil jika ada WO */}
                      {woSurvei && (
                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                            <strong>Work Order Survei:</strong> {getWoStatusChip(woSurvei)}
                          </Typography>
                          {woSurvei.teknisiPenanggungJawab && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Teknisi:</strong> {woSurvei.teknisiPenanggungJawab.namaLengkap}
                            </Typography>
                          )}
                          {/* Tombol review — muncul kapanpun WO status 'dikirim', terlepas dari ada/tidaknya data survei */}
                          {woSurvei.status === 'dikirim' && userRole === 'admin' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />}
                                onClick={() => openWoReviewDialog('survei', true, woSurvei.id)}>
                                Setujui Hasil Survei
                              </Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
                                onClick={() => openWoReviewDialog('survei', false, woSurvei.id)}>
                                Tolak & Minta Ulang
                              </Button>
                            </Box>
                          )}
                          {woSurvei.status === 'ditolak' && (
                            <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                              Hasil survei ditolak. Teknisi perlu mengulang survei.
                              {woSurvei.catatanReview && <> <strong>Catatan:</strong> {woSurvei.catatanReview}</>}
                            </Alert>
                          )}
                        </Box>
                      )}

                      {/* Data survei */}
                      {survei && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                            Data survei tersedia.{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/survey-data/${survei._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>
                          {woSurvei?.status === 'dikirim' && (
                            <Alert severity="warning" sx={{ mt: 0.5, py: 0.5 }}>
                              Menunggu review admin sebelum lanjut ke tahap berikutnya.
                            </Alert>
                          )}
                        </Box>
                      )}

                      {/* Buat WO / input manual — hanya jika belum ada WO */}
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
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 4 — Dokumen DED / RAB */}
              <Step active={step3Done && !step4Done} completed={step4Done}>
                <StepLabel icon={
                  !step3Done ? <RadioButtonUnchecked color="disabled" /> :
                  step4Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color={woRab ? 'info' : 'warning'} />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance fontSize="small" />
                    <Typography fontWeight={600} color={!step3Done ? 'text.disabled' : 'text.primary'}>
                      Dokumen DED / RAB
                    </Typography>
                    {step3Done && (
                      <Chip size="small"
                        label={
                          step4Done ? 'Disetujui' :
                          woRab?.status === 'dikirim' ? 'Menunggu Review' :
                          woRab ? `WO: ${woRab.status?.replace(/_/g, ' ')}` : 'Belum Ada'
                        }
                        color={
                          step4Done ? 'success' :
                          woRab?.status === 'dikirim' ? 'warning' :
                          woRab ? 'info' : 'default'
                        }
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

                      {/* WO RAB info — selalu tampil jika ada WO */}
                      {woRab && (
                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                            <strong>Work Order RAB:</strong> {getWoStatusChip(woRab)}
                          </Typography>
                          {woRab.teknisiPenanggungJawab && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Teknisi:</strong> {woRab.teknisiPenanggungJawab.namaLengkap}
                            </Typography>
                          )}
                          {/* Tombol review — muncul kapanpun WO status 'dikirim' */}
                          {woRab.status === 'dikirim' && userRole === 'admin' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />}
                                onClick={() => openWoReviewDialog('rab', true, woRab.id)}>
                                Setujui Dokumen RAB
                              </Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
                                onClick={() => openWoReviewDialog('rab', false, woRab.id)}>
                                Tolak & Minta Revisi
                              </Button>
                            </Box>
                          )}
                          {woRab.status === 'ditolak' && (
                            <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                              Dokumen RAB ditolak. Teknisi perlu merevisi RAB.
                              {woRab.catatanReview && <> <strong>Catatan:</strong> {woRab.catatanReview}</>}
                            </Alert>
                          )}
                        </Box>
                      )}

                      {/* Data RAB */}
                      {rab && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Total Biaya RAB:</strong> {formatRupiah(rab.totalBiaya)}{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/rab-connection/${rab._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>
                          {woRab?.status === 'dikirim' && (
                            <Alert severity="warning" sx={{ mt: 0.5, py: 0.5 }}>
                              Menunggu review admin sebelum pelanggan dapat membayar.
                            </Alert>
                          )}
                        </Box>
                      )}

                      {/* Buat WO / input manual — hanya jika belum ada WO */}
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
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 5 — Pembayaran RAB */}
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
                        label={
                          step5Done ? 'Dikonfirmasi' :
                          rabPaid ? 'Menunggu Konfirmasi Admin' :
                          rab.statusPembayaran || 'Pending'
                        }
                        color={step5Done ? 'success' : rabPaid ? 'warning' : 'default'}
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
                      <Typography variant="body2" component="div" sx={{ mt: 0.5, mb: 1 }}>
                        <strong>Status Pembayaran:</strong>{' '}
                        <Chip size="small"
                          label={rabPaid ? 'Settlement (Lunas)' : rab.statusPembayaran || 'Pending'}
                          color={rabPaid ? 'success' : 'warning'}
                        />
                      </Typography>
                      {/* Admin confirmation buttons */}
                      {userRole === 'admin' && !step5Done && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {rabPaid ? (
                            <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />}
                              onClick={handleKonfirmasiPembayaran} disabled={actionLoading}>
                              Konfirmasi Pembayaran
                            </Button>
                          ) : (
                            <Button size="small" variant="outlined" color="warning" startIcon={<Payment />}
                              onClick={handleTandaiLunas} disabled={actionLoading}>
                              Tandai Lunas (Loket/Tunai)
                            </Button>
                          )}
                        </Box>
                      )}
                      {step5Done && (
                        <Alert severity="success" sx={{ mt: 1, py: 0.5 }}>
                          Pembayaran telah dikonfirmasi admin. Lanjut ke pemasangan meteran.
                        </Alert>
                      )}
                      {rabPaid && !step5Done && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                          Pembayaran sudah settlement. Menunggu konfirmasi admin sebelum lanjut ke pemasangan.
                        </Alert>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 6 — Pemasangan Meteran */}
              <Step active={step5Done && !step6Done} completed={step6Done}>
                <StepLabel icon={
                  !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                  step6Done ? <CheckCircle color="success" /> :
                  pemasangan ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Build fontSize="small" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pemasangan Meteran
                    </Typography>
                    {step5Done && pemasangan && <StatusAdminChip status={pemasangan.statusAdmin} />}
                    {step5Done && !pemasangan && (
                      <Chip size="small"
                        label={woPemasangan ? `WO: ${woPemasangan.status?.replace(/_/g, ' ')}` : 'Menunggu Data'}
                        color={woPemasangan ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step5Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi melakukan pemasangan meteran. Semua 3 tahap (pemasangan, pengawasan, pengawasan setelah) harus terisi sebelum admin dapat menyetujui.
                      </Typography>

                      {/* WO info */}
                      {woPemasangan && (
                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                            <strong>Work Order:</strong> {getWoStatusChip(woPemasangan)}
                          </Typography>
                          {woPemasangan.teknisiPenanggungJawab && (
                            <Typography variant="body2">
                              <strong>Teknisi:</strong> {woPemasangan.teknisiPenanggungJawab.namaLengkap}
                              {woPemasangan.teknisiPenanggungJawab.divisi && ` · ${woPemasangan.teknisiPenanggungJawab.divisi}`}
                            </Typography>
                          )}
                        </Box>
                      )}
                      {!woPemasangan && userRole === 'admin' && (
                        <Button size="small" variant="contained" startIcon={<GroupAdd />} sx={{ mb: 1.5 }}
                          onClick={() => openWoCreateDialog('pemasangan')}>
                          Tugaskan Teknisi (Buat WO Pemasangan)
                        </Button>
                      )}

                      {/* Pemasangan data */}
                      {pemasangan ? (
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Data Pemasangan — diisi {formatDate(pemasangan.createdAt)}
                          </Typography>
                          {pemasangan.seriMeteran && (
                            <Typography variant="body2"><strong>Seri Meteran:</strong> {pemasangan.seriMeteran}</Typography>
                          )}
                          {pemasangan.catatan && (
                            <Typography variant="body2"><strong>Catatan:</strong> {pemasangan.catatan}</Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {['fotoRumah', 'fotoMeteran', 'fotoMeteranDanRumah'].map((key) =>
                              pemasangan[key] ? (
                                <Button key={key} size="small" variant="outlined" startIcon={<ImageIcon />}
                                  onClick={() => openDocumentViewer(pemasangan[key], key === 'fotoRumah' ? 'Foto Rumah' : key === 'fotoMeteran' ? 'Foto Meteran' : 'Foto Rumah & Meteran')}>
                                  {key === 'fotoRumah' ? 'Foto Rumah' : key === 'fotoMeteran' ? 'Foto Meteran' : 'Foto Rumah & Meteran'}
                                </Button>
                              ) : null
                            )}
                          </Box>
                          {pemasangan.catatanAdmin && (
                            <Alert severity={pemasangan.statusAdmin === 'ditolak' ? 'error' : 'info'} sx={{ mt: 1, py: 0.5 }}>
                              <strong>Catatan Admin:</strong> {pemasangan.catatanAdmin}
                            </Alert>
                          )}
                          <InstReviewButtons type="pemasangan" docId={pemasangan._id} currentStatus={pemasangan.statusAdmin} />
                        </Paper>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu teknisi mengisi data pemasangan.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 7 — Pengawasan Pemasangan */}
              <Step active={step6Done && !step7Done} completed={step7Done}>
                <StepLabel icon={
                  !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                  step7Done ? <CheckCircle color="success" /> :
                  pengawasan ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color={step6Done ? 'warning' : 'disabled'} />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Visibility fontSize="small" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pengawasan Pemasangan
                    </Typography>
                    {step5Done && pengawasan && <StatusAdminChip status={pengawasan.statusAdmin} />}
                    {step5Done && !pengawasan && (
                      <Chip size="small" label="Menunggu Data" color="warning" />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step5Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi mendokumentasikan hasil pengawasan selama proses pemasangan berlangsung.
                      </Typography>
                      {pengawasan ? (
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Data Pengawasan — diisi {formatDate(pengawasan.createdAt)}
                          </Typography>
                          {pengawasan.catatan && (
                            <Typography variant="body2"><strong>Catatan:</strong> {pengawasan.catatan}</Typography>
                          )}
                          {pengawasan.urlGambar?.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              {pengawasan.urlGambar.map((url: string, i: number) => (
                                <Button key={i} size="small" variant="outlined" startIcon={<ImageIcon />}
                                  onClick={() => openDocumentViewer(url, `Foto Pengawasan ${i + 1}`)}>
                                  Foto {i + 1}
                                </Button>
                              ))}
                            </Box>
                          )}
                          {pengawasan.catatanAdmin && (
                            <Alert severity={pengawasan.statusAdmin === 'ditolak' ? 'error' : 'info'} sx={{ mt: 1, py: 0.5 }}>
                              <strong>Catatan Admin:</strong> {pengawasan.catatanAdmin}
                            </Alert>
                          )}
                          {step6Done && (
                            <InstReviewButtons type="pengawasan" docId={pengawasan._id} currentStatus={pengawasan.statusAdmin} />
                          )}
                          {!step6Done && (
                            <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                              Selesaikan review tahap Pemasangan terlebih dahulu.
                            </Alert>
                          )}
                        </Paper>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu teknisi mengisi data pengawasan pemasangan.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 8 — Pengawasan Setelah Pemasangan */}
              <Step active={step7Done && !step8Done} completed={step8Done}>
                <StepLabel icon={
                  !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                  step8Done ? <CheckCircle color="success" /> :
                  pengawasanSetelah ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color={step7Done ? 'warning' : 'disabled'} />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <CheckCircle fontSize="small" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pengawasan Setelah Pemasangan
                    </Typography>
                    {step5Done && pengawasanSetelah && <StatusAdminChip status={pengawasanSetelah.statusAdmin} />}
                    {step5Done && !pengawasanSetelah && (
                      <Chip size="small" label="Menunggu Data" color="warning" />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step5Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi mendokumentasikan kondisi setelah pemasangan selesai dilakukan.
                      </Typography>
                      {pengawasanSetelah ? (
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Data Pengawasan Setelah — diisi {formatDate(pengawasanSetelah.createdAt)}
                          </Typography>
                          {pengawasanSetelah.catatan && (
                            <Typography variant="body2"><strong>Catatan:</strong> {pengawasanSetelah.catatan}</Typography>
                          )}
                          {pengawasanSetelah.urlGambar?.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              {pengawasanSetelah.urlGambar.map((url: string, i: number) => (
                                <Button key={i} size="small" variant="outlined" startIcon={<ImageIcon />}
                                  onClick={() => openDocumentViewer(url, `Foto Setelah Pemasangan ${i + 1}`)}>
                                  Foto {i + 1}
                                </Button>
                              ))}
                            </Box>
                          )}
                          {pengawasanSetelah.catatanAdmin && (
                            <Alert severity={pengawasanSetelah.statusAdmin === 'ditolak' ? 'error' : 'info'} sx={{ mt: 1, py: 0.5 }}>
                              <strong>Catatan Admin:</strong> {pengawasanSetelah.catatanAdmin}
                            </Alert>
                          )}
                          {step7Done && (
                            <InstReviewButtons type="setelah" docId={pengawasanSetelah._id} currentStatus={pengawasanSetelah.statusAdmin} />
                          )}
                          {!step7Done && (
                            <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                              Selesaikan review tahap Pengawasan Pemasangan terlebih dahulu.
                            </Alert>
                          )}
                        </Paper>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu teknisi mengisi data pengawasan setelah pemasangan.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 9 — Aktivasi Pelanggan */}
              <Step active={step8Done && !step9Done} completed={step9Done}>
                <StepLabel icon={
                  !step8Done ? <RadioButtonUnchecked color="disabled" /> :
                  step9Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser fontSize="small" />
                    <Typography fontWeight={600} color={!step8Done ? 'text.disabled' : 'text.primary'}>
                      Aktivasi Pelanggan
                    </Typography>
                    {step9Done && <Chip size="small" label="Aktif" color="success" />}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step8Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Aktifkan akun pelanggan setelah semua tahap pemasangan disetujui. Meteran harus sudah terdaftar.
                      </Typography>
                      {step9Done ? (
                        <Alert severity="success">
                          Pelanggan telah aktif. Sambungan air sudah berjalan.
                          {meteran?.NomorMeteran && <> Nomor meteran: <strong>{meteran.NomorMeteran}</strong>.</>}
                        </Alert>
                      ) : userRole === 'admin' ? (
                        <Box>
                          {!meteran ? (
                            <>
                              <Alert severity="warning" sx={{ mb: 1 }}>
                                Meteran belum terdaftar. Daftarkan meteran terlebih dahulu sebelum mengaktifkan pelanggan.
                              </Alert>
                              <Button size="small" variant="outlined"
                                onClick={() => router.push(`/operations/meteran/create?connectionId=${data._id}`)}>
                                Daftarkan Meteran
                              </Button>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Meteran:</strong> {meteran.NomorMeteran} · {meteran.NomorAkun}
                              </Typography>
                              <Button variant="contained" color="success" startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                                onClick={handleAktifkanPelanggan} disabled={actionLoading}>
                                Aktifkan Pelanggan
                              </Button>
                            </>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Menunggu admin mengaktifkan pelanggan.
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

        {/* ─── DIALOGS ────────────────────────────────────────────────────────── */}

        {/* Tolak Pengajuan */}
        <Dialog open={tolakDialogOpen} onClose={() => setTolakDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tolak Pengajuan Sambungan Air</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Masukkan alasan penolakan untuk <strong>{data?.IdPelanggan?.namaLengkap}</strong>.
            </Typography>
            <TextField fullWidth multiline rows={4} label="Alasan Penolakan" value={alasanPenolakanInput}
              onChange={e => setAlasanPenolakanInput(e.target.value)} required
              error={!alasanPenolakanInput.trim()}
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

        {/* WO Review (survei / rab) */}
        <Dialog open={woReviewDialogOpen} onClose={() => setWoReviewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{woReviewApprove ? 'Setujui' : 'Tolak'} Hasil Work Order {woReviewType}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {woReviewApprove
                ? 'Konfirmasi persetujuan hasil pekerjaan. Proses akan berlanjut ke tahap berikutnya.'
                : 'Masukkan alasan penolakan hasil pekerjaan.'}
            </Typography>
            <TextField fullWidth multiline rows={3}
              label={woReviewApprove ? 'Catatan (opsional)' : 'Alasan Penolakan *'}
              value={woReviewCatatan} onChange={e => setWoReviewCatatan(e.target.value)}
              required={!woReviewApprove} error={!woReviewApprove && !woReviewCatatan.trim()}
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

        {/* Installation Review (pemasangan / pengawasan / setelah) */}
        <Dialog open={instReviewOpen} onClose={() => setInstReviewOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {instReviewConfig?.disetujui ? 'Setujui' : 'Tolak'} — {instReviewConfig?.label}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {instReviewConfig?.disetujui
                ? 'Konfirmasi bahwa data sudah diperiksa dan dapat dilanjutkan ke tahap berikutnya.'
                : 'Masukkan catatan penolakan. Teknisi harus mengulang tahap ini.'}
            </Typography>
            <TextField fullWidth multiline rows={3}
              label={instReviewConfig?.disetujui ? 'Catatan Admin (opsional)' : 'Alasan Penolakan *'}
              value={instReviewCatatan} onChange={e => setInstReviewCatatan(e.target.value)}
              required={!instReviewConfig?.disetujui}
              error={!instReviewConfig?.disetujui && !instReviewCatatan.trim()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInstReviewOpen(false)}>Batal</Button>
            <Button variant="contained" color={instReviewConfig?.disetujui ? 'success' : 'error'}
              onClick={handleInstReview}
              disabled={actionLoading || (!instReviewConfig?.disetujui && !instReviewCatatan.trim())}
              startIcon={actionLoading ? <CircularProgress size={20} /> : instReviewConfig?.disetujui ? <ThumbUp /> : <ThumbDown />}>
              {instReviewConfig?.disetujui ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* WO Create (assign teknisi) */}
        <Dialog open={woCreateDialogOpen} onClose={() => setWoCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Buat Work Order: {woCreateType}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pilih teknisi penanggung jawab untuk work order {woCreateType}.
              Work order ini akan masuk ke menu Manajemen Pekerjaan.
            </Typography>
            {teknisiLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
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

        {/* Document Viewer */}
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
                <iframe src={viewerImage} title={viewerTitle}
                  style={{ width: `${zoom}%`, height: 600, border: 'none', transition: 'width 0.3s ease' }} />
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
