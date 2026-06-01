'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  Chip, Stepper, Step, StepLabel, StepContent, Alert, CircularProgress,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Paper, TextField, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Checkbox, Select, MenuItem, FormControl, InputLabel,
  Stack,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, HourglassEmpty, Cancel, Description,
  Close, ZoomIn, ZoomOut, RestartAlt, Visibility, RadioButtonUnchecked,
  VerifiedUser, Build, Payment, AccountBalance,
  GroupAdd, Assignment, ThumbUp, ThumbDown, Image as ImageIcon,
  People, LocationOn, AccessTime, OpenInNew, Upload,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_DETAIL_SAMBUNGAN } from '../../../../../lib/graphql/queries/connectionData';
import { VERIFY_CONNECTION_DATA } from '../../../../../lib/graphql/mutations/connectionData';
import { GET_METERAN_BY_KONEKSI_DATA, CREATE_METERAN } from '../../../../../lib/graphql/queries/meteran';
import { AKTIVASI_PELANGGAN } from '../../../../../lib/graphql/queries/customers';
import { GET_ALL_KELOMPOK_PELANGGAN } from '../../../../../lib/graphql/queries/kelompokPelanggan';
import { BUAT_WORK_ORDER, REVIEW_HASIL } from '../../../../../lib/graphql/mutations/workOrder';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import {
  REVIEW_PEMASANGAN,
  REVIEW_PENGAWASAN_PEMASANGAN,
  REVIEW_PENGAWASAN_SETELAH_PEMASANGAN,
} from '../../../../../lib/graphql/mutations/pemasangan';
import { KONFIRMASI_PEMBAYARAN_RAB, TANDAI_LUNAS_RAB } from '../../../../../lib/graphql/mutations/survei';
import { resolveDocumentUrl } from '../../../../utils/documentUrl';

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

// ─── UI Helper Components ────────────────────────────────────────────────────

function SectionTitle({ icon, title, color = 'primary.main' }: {
  icon: React.ReactNode;
  title: string;
  color?: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5,
        bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'white', fontSize: 20,
        '& .MuiSvgIcon-root': { fontSize: 20, color: 'white' },
      }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
    </Box>
  );
}


function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={500}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value || '—'}
      </Typography>
    </Box>
  );
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

  // Aktivasi pelanggan dialog (jika meteran sudah ada)
  const [aktivasiDialogOpen, setAktifasiDialogOpen] = useState(false);

  // Dialog gabungan: daftarkan meteran + aktivasi sekaligus
  const [regAktivasiOpen, setRegAktivasiOpen] = useState(false);
  const [inputNomorMeteran, setInputNomorMeteran] = useState('');
  const [inputNomorAkun, setInputNomorAkun] = useState('');
  const [inputKelompokId, setInputKelompokId] = useState('');

  // Local flag: immediately hide activation button after success (Apollo cache may lag)
  const [localActivated, setLocalActivated] = useState(false);

  // Upload dokumen (walk-in)
  const [uploadingDoc, setUploadingDoc] = useState<'NIK' | 'KK' | 'IMB' | null>(null);
  const nikInputRef = React.useRef<HTMLInputElement | null>(null);
  const kkInputRef  = React.useRef<HTMLInputElement | null>(null);
  const imbInputRef = React.useRef<HTMLInputElement | null>(null);
  const docInputRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    NIK: nikInputRef,
    KK:  kkInputRef,
    IMB: imbInputRef,
  };

  const handleUploadDokumen = async (jenis: 'NIK' | 'KK' | 'IMB', file: File) => {
    setUploadingDoc(jenis);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('admin_token');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000/api';
      const res = await fetch(
        `${baseUrl}/connection-data/${id}/upload-dokumen?jenis=${jenis}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.pesan || 'Gagal mengupload dokumen');
      setSuccess(`Dokumen ${jenis} berhasil diupload`);
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengupload dokumen');
    } finally {
      setUploadingDoc(null);
    }
  };

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerType, setViewerType] = useState<'pdf' | 'image'>('image');
  const [zoom, setZoom] = useState(100);

  // ─── Queries ─────────────────────────────────────────────────────────────
  // Single combined query — eliminates waterfall: all sub-documents fetched in
  // parallel server-side, reducing 3+ client→server round trips to 1.
  const { data: detailResult, loading, error, refetch } = useQuery(GET_DETAIL_SAMBUNGAN, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const detail = (detailResult as any)?.getDetailSambungan;
  const data: any = detail?.koneksiData;
  const isApproved = data?.StatusPengajuan === 'APPROVED';
  const survei: any = detail?.survei;
  const rab: any = detail?.rab;
  const pemasangan: any = detail?.pemasangan;
  const pengawasan: any = detail?.pengawasan;
  const pengawasanSetelah: any = detail?.pengawasanSetelah;
  const workOrders: any[] = detail?.workOrders || [];

  // Meteran still uses its own query (needs IdKoneksiData uppercase, separate cache key)
  const { data: meteranResult, refetch: refetchMeteran } = useQuery(GET_METERAN_BY_KONEKSI_DATA, {
    variables: { IdKoneksiData: id },
    skip: !id || !isApproved,
    fetchPolicy: 'cache-and-network',
  });
  const meteran: any = (meteranResult as any)?.getMeteranByKoneksiData ?? detail?.meteran;

  // Unified refetch — all sub-docs refresh in one call
  const refetchAll = () => refetch();
  const refetchSurvei = refetchAll;
  const refetchRab = refetchAll;
  const refetchPemasangan = refetchAll;
  const refetchPengawasan = refetchAll;
  const refetchPengawasanSetelah = refetchAll;
  const refetchWO = refetchAll;

  const { data: teknisiResult, loading: teknisiLoading } = useQuery(GET_ALL_TEKNISI, {
    skip: !woCreateDialogOpen,
    fetchPolicy: 'cache-and-network',
  });
  const allTeknisi: any[] = (teknisiResult as any)?.getAllTeknisi || [];

  // Kelompok pelanggan untuk dropdown di dialog registrasi+aktivasi
  const { data: kelompokResult } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    skip: !regAktivasiOpen,
    fetchPolicy: 'cache-and-network',
  });
  const kelompokList: any[] = (kelompokResult as any)?.getAllKelompokPelanggan || [];

  // ─── Mutations ───────────────────────────────────────────────────────────
  const [verifyKoneksiData] = useMutation(VERIFY_CONNECTION_DATA);
  const [buatWorkOrder] = useMutation(BUAT_WORK_ORDER);
  const [reviewHasil] = useMutation(REVIEW_HASIL);
  const [aktivasiPelangganMut] = useMutation(AKTIVASI_PELANGGAN);
  const [createMeteranMut] = useMutation(CREATE_METERAN);
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
  // step9Done: cek accountStatus ATAU statusAktif meteran sebagai fallback
  // localActivated: immediate hide after click (reset on re-mount, tapi data sudah refetched)
  const alreadyActivated =
    data?.IdPelanggan?.accountStatus === 'active' ||
    meteran?.statusAktif === true;
  const step9Done = step8Done && (localActivated || alreadyActivated);

  // ─── Dialog helpers ───────────────────────────────────────────────────────
  const openDocumentViewer = (url: string, title: string, docType = 'UNKNOWN') => {
    const resolved = resolveDocumentUrl(url, docType, id);
    setViewerImage(resolved?.src ?? url);
    setViewerType(resolved?.type ?? (url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'));
    setViewerTitle(title); setZoom(100); setViewerOpen(true);
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
      const result = await aktivasiPelangganMut({ variables: { koneksiDataId: id } });
      if ((result as any).errors?.length) {
        throw new Error((result as any).errors.map((e: any) => e.message).join(', '));
      }
      setLocalActivated(true);
      await refetch();
      await refetchMeteran();
      setSuccess('Pelanggan berhasil diaktifkan. Sambungan air sudah aktif.');
      setAktifasiDialogOpen(false);
    } catch (err: any) { setErrorMsg(err.message || 'Gagal mengaktifkan pelanggan'); }
    finally { setActionLoading(false); }
  };

  const openRegAktivasi = () => {
    setInputNomorMeteran(pemasangan?.seriMeteran || '');
    setInputNomorAkun('');
    setInputKelompokId('');
    setRegAktivasiOpen(true);
  };

  const handleRegistrasiDanAktivasi = async () => {
    if (!inputNomorMeteran) { setErrorMsg('Nomor meteran wajib diisi'); return; }
    if (!inputNomorAkun) { setErrorMsg('No. Akun wajib diisi'); return; }
    if (!inputKelompokId) { setErrorMsg('Kelompok pelanggan wajib dipilih'); return; }
    setActionLoading(true); setErrorMsg(null);
    try {
      await createMeteranMut({
        variables: {
          IdKelompokPelanggan: inputKelompokId,
          NomorMeteran: inputNomorMeteran,
          NomorAkun: inputNomorAkun,
          IdKoneksiData: id,
        },
      });
      const aktivasiResult = await aktivasiPelangganMut({ variables: { koneksiDataId: id } });
      if ((aktivasiResult as any).errors?.length) {
        throw new Error((aktivasiResult as any).errors.map((e: any) => e.message).join(', '));
      }
      setLocalActivated(true);
      await refetch();
      await refetchMeteran();
      setSuccess('Pelanggan berhasil didaftarkan dan diaktifkan. Sambungan air sudah aktif.');
      setRegAktivasiOpen(false);
    } catch (err: any) { setErrorMsg(err.message || 'Gagal mendaftarkan atau mengaktifkan pelanggan'); }
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>

        {/* Header Card */}
        <Card sx={{
          mb: 3,
          borderLeft: '5px solid',
          borderColor: `${statusColor}.main`,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
        }}>
          <CardContent sx={{ py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <IconButton
                onClick={() => router.push('/operations/connection-data')}
                sx={{ mt: 0.25, bgcolor: 'action.hover', borderRadius: 1.5, flexShrink: 0 }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="h5" fontWeight={800}>Detail Sambungan</Typography>
                  <Chip label={statusLabel} color={statusColor} size="small" sx={{ fontWeight: 700 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {data.IdPelanggan?.namaLengkap || 'Pelanggan'} &middot; {data.Alamat || '—'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Alerts */}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>}
        {data.StatusPengajuan === 'REJECTED' && data.AlasanPenolakan && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>Ditolak:</strong> {data.AlasanPenolakan}
          </Alert>
        )}

        {/* ─── PROGRESS STEPPER ─────────────────────────────────────────────── */}
        <Card sx={{ mb: 3, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)' }}>
          <CardContent>
            <SectionTitle icon={<Assignment />} title="Progres Sambungan Baru" color="primary.main" />

            <Stepper orientation="vertical" activeStep={-1}>

              {/* Step 1 — Pengajuan */}
              <Step active completed={step1Done}>
                <StepLabel
                  icon={<CheckCircle color="success" />}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(data.createdAt)}
                    </Typography>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description fontSize="small" color="action" />
                    <Typography fontWeight={600}>Pengajuan Sambungan Baru</Typography>
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
                <StepLabel
                  icon={
                    step2Done ? <CheckCircle color="success" /> :
                    data.StatusPengajuan === 'REJECTED' ? <Cancel color="error" /> :
                    <HourglassEmpty color="warning" />
                  }
                  optional={
                    step2Done && data.TanggalVerifikasi ? (
                      <Typography variant="caption" color="text.secondary">
                        Diverifikasi pada {formatDate(data.TanggalVerifikasi)}
                      </Typography>
                    ) : undefined
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser fontSize="small" color="action" />
                    <Typography fontWeight={600} color={data.StatusPengajuan === 'REJECTED' ? 'error.main' : 'text.primary'}>
                      Verifikasi Admin
                    </Typography>
                    {!step2Done && (
                      <Chip size="small" variant="outlined"
                        label={data.StatusPengajuan === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi'}
                        color={data.StatusPengajuan === 'REJECTED' ? 'error' : 'warning'}
                      />
                    )}
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
                <StepLabel
                  icon={
                    !step2Done ? <RadioButtonUnchecked color="disabled" /> :
                    step3Done ? <CheckCircle color="success" /> :
                    <HourglassEmpty color={woSurvei ? 'info' : 'warning'} />
                  }
                  optional={step2Done ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          woSurvei?.teknisiPenanggungJawab?.namaLengkap && `Teknisi: ${woSurvei.teknisiPenanggungJawab.namaLengkap}`,
                          survei?.createdAt && `Data survei: ${formatDate(survei.createdAt)}`,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                      {woSurvei?.id && (
                        <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                          onClick={() => router.push(`/operations/work-orders/${woSurvei.id}`)}
                          sx={{ p: 0, fontSize: '0.7rem', color: 'text.secondary', minHeight: 0, height: 18, width: 'fit-content', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                          Lihat Work Order
                        </Button>
                      )}
                    </Box>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step2Done ? 'text.disabled' : 'text.primary'}>
                      Survei Lapangan
                    </Typography>
                    {step2Done && !step3Done && (
                      <Chip size="small" variant="outlined"
                        label={woSurvei?.status === 'dikirim' ? 'Menunggu Review' : woSurvei ? woSurvei.status?.replace(/_/g, ' ') : 'Belum Ada'}
                        color={woSurvei?.status === 'dikirim' ? 'warning' : woSurvei ? 'info' : 'default'}
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
                <StepLabel
                  icon={
                    !step3Done ? <RadioButtonUnchecked color="disabled" /> :
                    step4Done ? <CheckCircle color="success" /> :
                    <HourglassEmpty color={woRab ? 'info' : 'warning'} />
                  }
                  optional={step3Done ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          woRab?.teknisiPenanggungJawab?.namaLengkap && `Teknisi: ${woRab.teknisiPenanggungJawab.namaLengkap}`,
                          rab?.totalBiaya && `Total RAB: ${formatRupiah(rab.totalBiaya)}`,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                      {woRab?.id && (
                        <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                          onClick={() => router.push(`/operations/work-orders/${woRab.id}`)}
                          sx={{ p: 0, fontSize: '0.7rem', color: 'text.secondary', minHeight: 0, height: 18, width: 'fit-content', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                          Lihat Work Order
                        </Button>
                      )}
                    </Box>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step3Done ? 'text.disabled' : 'text.primary'}>
                      Dokumen DED / RAB
                    </Typography>
                    {step3Done && !step4Done && (
                      <Chip size="small" variant="outlined"
                        label={woRab?.status === 'dikirim' ? 'Menunggu Review' : woRab ? woRab.status?.replace(/_/g, ' ') : 'Belum Ada'}
                        color={woRab?.status === 'dikirim' ? 'warning' : woRab ? 'info' : 'default'}
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
                <StepLabel
                  icon={
                    !step4Done ? <RadioButtonUnchecked color="disabled" /> :
                    step5Done ? <CheckCircle color="success" /> :
                    <HourglassEmpty color="warning" />
                  }
                  optional={step4Done && rab ? (
                    <Typography variant="caption" color="text.secondary">
                      {[
                        `Total: ${formatRupiah(rab.totalBiaya)}`,
                        rab.statusPembayaran && `Status: ${rabPaid ? 'Lunas (Settlement)' : rab.statusPembayaran}`,
                      ].filter(Boolean).join(' · ')}
                    </Typography>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payment fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step4Done ? 'text.disabled' : 'text.primary'}>
                      Pembayaran RAB oleh Pelanggan
                    </Typography>
                    {step4Done && rab && !step5Done && (
                      <Chip size="small" variant="outlined"
                        label={rabPaid ? 'Menunggu Konfirmasi Admin' : rab.statusPembayaran || 'Pending'}
                        color={rabPaid ? 'warning' : 'default'}
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
                <StepLabel
                  icon={
                    !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                    step6Done ? <CheckCircle color="success" /> :
                    pemasangan ? <HourglassEmpty color="info" /> :
                    <HourglassEmpty color="warning" />
                  }
                  optional={step5Done ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          woPemasangan?.teknisiPenanggungJawab?.namaLengkap && `Teknisi: ${woPemasangan.teknisiPenanggungJawab.namaLengkap}`,
                          woPemasangan?.teknisiPenanggungJawab?.divisi && woPemasangan.teknisiPenanggungJawab.divisi,
                          pemasangan?.seriMeteran && `Meteran: ${pemasangan.seriMeteran}`,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                      {woPemasangan?.id && (
                        <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                          onClick={() => router.push(`/operations/work-orders/${woPemasangan.id}`)}
                          sx={{ p: 0, fontSize: '0.7rem', color: 'text.secondary', minHeight: 0, height: 18, width: 'fit-content', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                          Lihat Work Order
                        </Button>
                      )}
                    </Box>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pemasangan Meteran
                    </Typography>
                    {step5Done && !step6Done && (
                      pemasangan
                        ? <StatusAdminChip status={pemasangan.statusAdmin} />
                        : <Chip size="small" variant="outlined"
                            label={woPemasangan ? woPemasangan.status?.replace(/_/g, ' ') : 'Menunggu Data'}
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
                                  onClick={() => openDocumentViewer(pemasangan[key], key === 'fotoRumah' ? 'Foto Rumah' : key === 'fotoMeteran' ? 'Foto Meteran' : 'Foto Rumah & Meteran', 'SURVEI')}>
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
                <StepLabel
                  icon={
                    !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                    step7Done ? <CheckCircle color="success" /> :
                    pengawasan ? <HourglassEmpty color="info" /> :
                    <HourglassEmpty color={step6Done ? 'warning' : 'disabled'} />
                  }
                  optional={step5Done ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          woPemasangan?.teknisiPenanggungJawab?.namaLengkap && `Teknisi: ${woPemasangan.teknisiPenanggungJawab.namaLengkap}`,
                          pengawasan?.createdAt && `Diisi: ${formatDate(pengawasan.createdAt)}`,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                      {woPemasangan?.id && (
                        <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                          onClick={() => router.push(`/operations/work-orders/${woPemasangan.id}`)}
                          sx={{ p: 0, fontSize: '0.7rem', color: 'text.secondary', minHeight: 0, height: 18, width: 'fit-content', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                          Lihat Work Order
                        </Button>
                      )}
                    </Box>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pengawasan Pemasangan
                    </Typography>
                    {step5Done && !step7Done && (
                      pengawasan
                        ? <StatusAdminChip status={pengawasan.statusAdmin} />
                        : <Chip size="small" variant="outlined" label="Menunggu Data" color="warning" />
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
                                  onClick={() => openDocumentViewer(url, `Foto Pengawasan ${i + 1}`, 'SURVEI')}>
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
                <StepLabel
                  icon={
                    !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                    step8Done ? <CheckCircle color="success" /> :
                    pengawasanSetelah ? <HourglassEmpty color="info" /> :
                    <HourglassEmpty color={step7Done ? 'warning' : 'disabled'} />
                  }
                  optional={step5Done ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          woPemasangan?.teknisiPenanggungJawab?.namaLengkap && `Teknisi: ${woPemasangan.teknisiPenanggungJawab.namaLengkap}`,
                          pengawasanSetelah?.createdAt && `Diisi: ${formatDate(pengawasanSetelah.createdAt)}`,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                      {woPemasangan?.id && (
                        <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                          onClick={() => router.push(`/operations/work-orders/${woPemasangan.id}`)}
                          sx={{ p: 0, fontSize: '0.7rem', color: 'text.secondary', minHeight: 0, height: 18, width: 'fit-content', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                          Lihat Work Order
                        </Button>
                      )}
                    </Box>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pengawasan Setelah Pemasangan
                    </Typography>
                    {step5Done && !step8Done && (
                      pengawasanSetelah
                        ? <StatusAdminChip status={pengawasanSetelah.statusAdmin} />
                        : <Chip size="small" variant="outlined" label="Menunggu Data" color="warning" />
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
                                  onClick={() => openDocumentViewer(url, `Foto Setelah Pemasangan ${i + 1}`, 'SURVEI')}>
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
                <StepLabel
                  icon={
                    !step8Done ? <RadioButtonUnchecked color="disabled" /> :
                    step9Done ? <CheckCircle color="success" /> :
                    <HourglassEmpty color="warning" />
                  }
                  optional={step9Done ? (
                    <Typography variant="caption" color="text.secondary">
                      {[
                        (pemasangan?.seriMeteran || meteran?.NomorMeteran) && `Meteran: ${pemasangan?.seriMeteran || meteran?.NomorMeteran}`,
                        meteran?.NomorAkun && `No. Akun: ${meteran.NomorAkun}`,
                      ].filter(Boolean).join(' · ')}
                    </Typography>
                  ) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser fontSize="small" color="action" />
                    <Typography fontWeight={600} color={!step8Done ? 'text.disabled' : 'text.primary'}>
                      Aktivasi Pelanggan
                    </Typography>
                    {step8Done && !step9Done && (
                      <Chip size="small" variant="outlined" label="Menunggu Aktivasi" color="warning" />
                    )}
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
                          {(pemasangan?.seriMeteran || meteran?.NomorMeteran) && (
                            <> Seri meteran: <strong>{pemasangan?.seriMeteran || meteran?.NomorMeteran}</strong>.</>
                          )}
                        </Alert>
                      ) : userRole === 'admin' ? (
                        <Box>
                          {!meteran ? (
                            <Button variant="contained" color="success" startIcon={<CheckCircle />}
                              onClick={openRegAktivasi}
                              disabled={alreadyActivated || actionLoading}>
                              Daftarkan &amp; Aktifkan Pelanggan
                            </Button>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Seri Meteran:</strong> {pemasangan?.seriMeteran || meteran.NomorMeteran}
                              </Typography>
                              <Button variant="contained" color="success" startIcon={<CheckCircle />}
                                onClick={() => setAktifasiDialogOpen(true)}
                                disabled={alreadyActivated || actionLoading}>
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

        {/* Dialog Gabungan: Daftarkan Meteran + Aktivasi */}
        <Dialog open={regAktivasiOpen} onClose={() => setRegAktivasiOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Daftarkan &amp; Aktifkan Pelanggan</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Nomor Meteran"
              value={inputNomorMeteran}
              onChange={(e) => setInputNomorMeteran(e.target.value)}
              required
              helperText={pemasangan?.seriMeteran ? `Diisi dari data pemasangan teknisi — bisa diedit jika perlu` : 'Nomor fisik pada meteran'}
            />
            <TextField
              fullWidth
              label="No. Akun Pelanggan"
              value={inputNomorAkun}
              onChange={(e) => setInputNomorAkun(e.target.value)}
              required
              placeholder="Contoh: AKN-2025-0001"
              helperText="Nomor akun unik pelanggan — diisi manual sesuai sistem PDAM"
            />
            <FormControl fullWidth required>
              <InputLabel>Kelompok Tarif</InputLabel>
              <Select
                value={inputKelompokId}
                label="Kelompok Tarif"
                onChange={(e) => setInputKelompokId(e.target.value)}
              >
                <MenuItem value=""><em>-- Pilih Kelompok --</em></MenuItem>
                {kelompokList.map((k: any) => (
                  <MenuItem key={k._id} value={k._id}>
                    {k.NamaKelompok}
                    {k.BiayaBeban ? ` — Beban Rp ${k.BiayaBeban.toLocaleString('id-ID')}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegAktivasiOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleRegistrasiDanAktivasi}
              disabled={actionLoading || !inputNomorMeteran || !inputNomorAkun || !inputKelompokId}
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            >
              Daftarkan &amp; Aktifkan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Konfirmasi Aktivasi Pelanggan */}
        <Dialog open={aktivasiDialogOpen} onClose={() => setAktifasiDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Konfirmasi Aktivasi Pelanggan</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Sambungan air pelanggan <strong>{data?.IdPelanggan?.namaLengkap}</strong> akan segera
              diaktifkan. Tindakan ini tidak dapat dibatalkan.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAktifasiDialogOpen(false)} disabled={actionLoading}>
              Batal
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleAktifkanPelanggan}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            >
              Konfirmasi Aktivasi
            </Button>
          </DialogActions>
        </Dialog>

        {/* Info Pelanggan + Info Properti — side by side */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)' }}>
              <CardContent>
                <SectionTitle icon={<People />} title="Informasi Pelanggan" />
                <Stack spacing={2.5}>
                  <InfoField label="Nama Lengkap" value={data.IdPelanggan?.namaLengkap} />
                  <Divider />
                  <InfoField label="Email" value={data.IdPelanggan?.email} />
                  <Divider />
                  <InfoField label="Nomor HP" value={data.IdPelanggan?.noHP} />
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <InfoField label="NIK" value={data.NIK} />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoField label="Nomor KK" value={data.NoKK} />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)' }}>
              <CardContent>
                <SectionTitle icon={<LocationOn />} title="Informasi Properti" />
                <Stack spacing={2.5}>
                  <InfoField label="Alamat Lengkap" value={data.Alamat} />
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <InfoField label="Kelurahan" value={data.Kelurahan} />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoField label="Kecamatan" value={data.Kecamatan} />
                    </Grid>
                  </Grid>
                  <Divider />
                  <InfoField
                    label="Luas Bangunan"
                    value={data.LuasBangunan != null ? `${data.LuasBangunan} m²` : undefined}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dokumen Pengajuan */}
        <Card sx={{ mb: 3, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)' }}>
          <CardContent>
            <SectionTitle icon={<Description />} title="Dokumen Pengajuan" />

            {/* Hidden file inputs — satu per jenis dokumen */}
            {(['NIK', 'KK', 'IMB'] as const).map((jenis) => (
              <input
                key={jenis}
                ref={docInputRefs[jenis]}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadDokumen(jenis, file);
                  // reset input agar file yang sama bisa dipilih lagi
                  e.target.value = '';
                }}
              />
            ))}

            <Grid container spacing={2}>
              {[
                { label: 'Foto KTP (NIK)', url: data.NIKUrl, docType: 'NIK' as const },
                { label: 'Foto KK',        url: data.KKUrl,  docType: 'KK'  as const },
                { label: 'Foto IMB',       url: data.IMBUrl, docType: 'IMB' as const },
              ].map((doc) => {
                const isUploading = uploadingDoc === doc.docType;
                return (
                  <Grid item xs={12} sm={4} key={doc.label}>
                    <Box
                      sx={{
                        border: '1.5px solid',
                        borderColor: doc.url ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        p: 2.5,
                        textAlign: 'center',
                        cursor: doc.url ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        '&:hover': doc.url
                          ? { bgcolor: 'action.hover', transform: 'translateY(-2px)', boxShadow: 2 }
                          : {},
                      }}
                      onClick={() => doc.url && openDocumentViewer(doc.url, doc.label, doc.docType)}
                    >
                      <Box sx={{
                        width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5,
                        bgcolor: doc.url ? 'primary.50' : 'grey.100',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isUploading
                          ? <CircularProgress size={24} />
                          : <Description sx={{ fontSize: 26, color: doc.url ? 'primary.main' : 'text.disabled' }} />
                        }
                      </Box>

                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        {doc.label}
                      </Typography>

                      <Chip
                        size="small"
                        label={doc.url ? 'Tersedia' : 'Belum Upload'}
                        color={doc.url ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ mb: doc.url ? 0 : 1.5 }}
                      />

                      {/* Tombol upload — hanya muncul kalau belum ada dokumen & user adalah admin */}
                      {!doc.url && userRole === 'admin' && (
                        <Box sx={{ mt: 1.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={isUploading ? <CircularProgress size={14} /> : <Upload />}
                            disabled={isUploading || !!uploadingDoc}
                            onClick={(e) => {
                              e.stopPropagation();
                              docInputRefs[doc.docType].current?.click();
                            }}
                            sx={{ fontSize: '0.72rem' }}
                          >
                            {isUploading ? 'Mengupload...' : 'Upload Scan'}
                          </Button>
                        </Box>
                      )}

                      {/* Tombol ganti — muncul kalau sudah ada dokumen & user adalah admin */}
                      {doc.url && userRole === 'admin' && (
                        <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={isUploading ? <CircularProgress size={14} /> : <Upload />}
                            disabled={isUploading || !!uploadingDoc}
                            onClick={(e) => {
                              e.stopPropagation();
                              docInputRefs[doc.docType].current?.click();
                            }}
                            sx={{ fontSize: '0.7rem', color: 'text.secondary' }}
                          >
                            {isUploading ? 'Mengupload...' : 'Ganti'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Info walk-in */}
            {(!data.NIKUrl || !data.KKUrl || !data.IMBUrl) && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Dokumen yang belum tersedia dapat diupload oleh admin setelah scan berkas hardcopy dari pelanggan walk-in.
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card sx={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)' }}>
          <CardContent>
            <SectionTitle icon={<AccessTime />} title="Informasi Waktu" />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoField label="Tanggal Pengajuan" value={formatDate(data.createdAt)} />
              </Grid>
              {data.TanggalVerifikasi && (
                <Grid item xs={12} md={6}>
                  <InfoField label="Tanggal Verifikasi Admin" value={formatDate(data.TanggalVerifikasi)} />
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
              {viewerType === 'pdf' ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(viewerImage)}&embedded=true`}
                  title={viewerTitle}
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
