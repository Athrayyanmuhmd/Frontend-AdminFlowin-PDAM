'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '../../../../layouts/AdminProvider';
import {
  getWorkOrder,
  getWorkflowChain,
  getProgresWorkOrder,
  getLaporan,
  reviewTim as srvReviewTim,
  reviewPenolakan as srvReviewPenolakan,
  reviewHasil as srvReviewHasil,
  batalkanWorkOrder as srvBatalkan,
} from '@/lib/graphql/teknisiServer';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Breadcrumbs,
  Paper,
  Tooltip,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Build,
  Schedule,
  Warning,
  Error as ErrorIcon,
  HourglassEmpty,
  Person,
  Group,
  Block,
  ThumbUp,
  ThumbDown,
  Cancel,
  LocationOn,
  Phone,
  Email,
  Badge as BadgeIcon,
  Home,
  Description,
  OpenInNew,
  Refresh,
  NavigateNext,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';

// ─── Labels & Colors ──────────────────────────────────────────────────────────

const JENIS_LABELS: Record<string, string> = {
  survei: 'Survei',
  rab: 'RAB',
  pemasangan: 'Pemasangan',
  pengawasan_pemasangan: 'Pengawasan Pemasangan',
  pengawasan_setelah_pemasangan: 'Pengawasan Setelah Pemasangan',
  penyelesaian_laporan: 'Penyelesaian Laporan',
  maintenance: 'Maintenance',
};

const STATUS_LABELS: Record<string, string> = {
  menunggu_respon: 'Menunggu Respon',
  menunggu_tim: 'Menunggu Tim',
  tim_diajukan: 'Tim Diajukan',
  ditugaskan: 'Ditugaskan',
  sedang_dikerjakan: 'Sedang Dikerjakan',
  dikirim: 'Dikirim',
  revisi: 'Revisi',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const STATUS_COLORS: Record<
  string,
  'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'
> = {
  menunggu_respon: 'warning',
  menunggu_tim: 'warning',
  tim_diajukan: 'info',
  ditugaskan: 'info',
  sedang_dikerjakan: 'primary',
  dikirim: 'info',
  revisi: 'warning',
  selesai: 'success',
  dibatalkan: 'error',
};

const RESPON_LABELS: Record<string, string> = {
  belum_direspon: 'Belum Direspon',
  diterima: 'Diterima',
  penolakan_diajukan: 'Penolakan Diajukan',
  penolakan_diterima: 'Penolakan Diterima',
  penolakan_ditolak: 'Penolakan Ditolak',
};

const RESPON_COLORS: Record<
  string,
  'warning' | 'success' | 'error' | 'default' | 'info'
> = {
  belum_direspon: 'default',
  diterima: 'success',
  penolakan_diajukan: 'error',
  penolakan_diterima: 'warning',
  penolakan_ditolak: 'info',
};

const TIM_LABELS: Record<string, string> = {
  belum_diajukan: 'Belum Ada Tim',
  diajukan: 'Menunggu Review',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};

const TIM_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> =
  {
    belum_diajukan: 'default',
    diajukan: 'warning',
    disetujui: 'success',
    ditolak: 'error',
  };

const CHAIN_COLORS: Record<string, string> = {
  selesai: '#2e7d32',
  aktif: '#013494',
  belum_dibuat: '#9e9e9e',
  dibatalkan: '#d32f2f',
};

const CHAIN_LABELS: Record<string, string> = {
  selesai: 'Selesai',
  aktif: 'Aktif',
  belum_dibuat: 'Belum Dibuat',
  dibatalkan: 'Dibatalkan',
};

const PENGAJUAN_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Verifikasi',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

const PENGAJUAN_COLORS: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const JENIS_LAPORAN_LABELS: Record<string, string> = {
  AirTidakMengalir: 'Air Tidak Mengalir',
  AirKeruh: 'Air Keruh',
  KebocoranPipa: 'Kebocoran Pipa',
  MeteranBermasalah: 'Meteran Bermasalah',
  KendalaLainnya: 'Kendala Lainnya',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFlexDate(v: string | number | null | undefined): Date | null {
  if (!v) return null;
  const n =
    typeof v === 'number' ? v : /^\d+$/.test(String(v)) ? Number(v) : NaN;
  if (!isNaN(n)) return new Date(n);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

const fmtDate = (v: any) => {
  const d = parseFlexDate(v);
  return d
    ? d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';
};

const fmtDateTime = (v: any) => {
  const d = parseFlexDate(v);
  return d
    ? d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';
};

function getStatusIcon(s: string) {
  if (s === 'selesai') return <CheckCircle fontSize='small' />;
  if (s === 'sedang_dikerjakan') return <Build fontSize='small' />;
  if (s === 'ditugaskan') return <Schedule fontSize='small' />;
  if (s === 'dibatalkan') return <ErrorIcon fontSize='small' />;
  if (s === 'dikirim') return <HourglassEmpty fontSize='small' />;
  return <Warning fontSize='small' />;
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
        {icon}
        {typeof value === 'string' ? (
          <Typography variant='body2'>{value || '—'}</Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // State
  const [wo, setWO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workflow, setWorkflow] = useState<any[]>([]);
  const [progresData, setProgresData] = useState<any>(null);
  const [laporanData, setLaporanData] = useState<any>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Dialogs
  const [dlgTim, setDlgTim] = useState(false);
  const [dlgPenolakan, setDlgPenolakan] = useState(false);
  const [dlgHasil, setDlgHasil] = useState(false);
  const [dlgCancel, setDlgCancel] = useState(false);
  const [actionApprove, setActionApprove] = useState(true);
  const [catatan, setCatatan] = useState('');
  const [mutating, setMutating] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, msg: '', ok: true });
  const toast = (msg: string, ok = true) =>
    setSnackbar({ open: true, msg, ok });

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getWorkOrder(token, id);
      if (res.errors?.length) throw new Error(res.errors[0].message);
      const data = (res.data as any)?.workOrder;
      if (!data) throw new Error('Work order tidak ditemukan');
      setWO(data);

      // Fetch extra data in parallel
      setLoadingExtra(true);
      const promises: Promise<any>[] = [];

      if (data.idKoneksiData) {
        promises.push(
          getWorkflowChain(token, data.idKoneksiData)
            .then(r => setWorkflow((r.data as any)?.workflowChain || []))
            .catch(() => {})
        );
      }

      promises.push(
        getProgresWorkOrder(token, id)
          .then(r => setProgresData((r.data as any)?.progresWorkOrder || null))
          .catch(() => {})
      );

      if (data.idLaporan) {
        promises.push(
          getLaporan(token, data.idLaporan)
            .then(r => setLaporanData((r.data as any)?.laporan || null))
            .catch(() => {})
        );
      }

      await Promise.all(promises);
      setLoadingExtra(false);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, fetchAll]);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const runMutation = async (
    fn: () => Promise<any>,
    successMsg: string,
    closeFn: () => void
  ) => {
    setMutating(true);
    try {
      const res = await fn();
      if (res.errors?.length) throw new Error(res.errors[0].message);
      const key = Object.keys(res.data || {})[0];
      const r = (res.data as any)?.[key];
      if (r?.success === false) throw new Error(r.message || 'Gagal');
      closeFn();
      setCatatan('');
      toast(successMsg);
      fetchAll();
    } catch (e: any) {
      toast(e.message || 'Gagal', false);
    } finally {
      setMutating(false);
    }
  };

  const openDlg = (
    type: 'tim' | 'penolakan' | 'hasil' | 'cancel',
    approve = true
  ) => {
    setActionApprove(approve);
    setCatatan('');
    if (type === 'tim') setDlgTim(true);
    else if (type === 'penolakan') setDlgPenolakan(true);
    else if (type === 'hasil') setDlgHasil(true);
    else setDlgCancel(true);
  };

  const handleReviewTim = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () =>
        srvReviewTim(token, {
          workOrderId: id,
          disetujui: actionApprove,
          catatan: catatan || undefined,
        }),
      actionApprove ? 'Tim disetujui' : 'Tim ditolak',
      () => setDlgTim(false)
    );
  };

  const handleReviewPenolakan = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () =>
        srvReviewPenolakan(token, {
          workOrderId: id,
          disetujui: actionApprove,
          catatan: catatan || undefined,
        }),
      actionApprove ? 'Penolakan diterima' : 'Penolakan ditolak',
      () => setDlgPenolakan(false)
    );
  };

  const handleReviewHasil = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () =>
        srvReviewHasil(token, {
          workOrderId: id,
          disetujui: actionApprove,
          catatan: catatan || undefined,
        }),
      actionApprove ? 'Hasil disetujui' : 'Hasil ditolak',
      () => setDlgHasil(false)
    );
  };

  const handleBatalkan = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () => srvBatalkan(token, id, catatan || undefined),
      'Work order dibatalkan',
      () => setDlgCancel(false)
    );
  };

  if (authLoading || !isAuthenticated) return null;

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout title='Detail Work Order'>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error || !wo) {
    return (
      <AdminLayout title='Detail Work Order'>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Alert severity='error' sx={{ mb: 2, display: 'inline-flex' }}>
            {error || 'Work order tidak ditemukan'}
          </Alert>
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/operations/work-orders')}
            >
              Kembali ke Daftar
            </Button>
          </Box>
        </Box>
      </AdminLayout>
    );
  }

  const needsTim = wo.statusTim === 'diajukan';
  const needsPenolakan = wo.statusRespon === 'penolakan_diajukan';
  const needsHasil = wo.status === 'dikirim';
  const needsAction = needsTim || needsPenolakan || needsHasil;
  const koneksi = wo.koneksiData;

  return (
    <AdminLayout
      title={`WO: ${JENIS_LABELS[wo.jenisPekerjaan] || wo.jenisPekerjaan}`}
    >
      <Box sx={{ mb: 3 }}>
        {/* ─── Breadcrumb ──────────────────────────────────────────────────── */}
        <Breadcrumbs
          separator={<NavigateNext fontSize='small' />}
          sx={{ mb: 2 }}
        >
          <Link
            href='/operations/work-orders'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              Work Orders
            </Typography>
          </Link>
          <Typography variant='body2' color='text.primary' fontWeight={600}>
            {JENIS_LABELS[wo.jenisPekerjaan] || wo.jenisPekerjaan}
          </Typography>
        </Breadcrumbs>

        {/* ─── Header Card ─────────────────────────────────────────────────── */}
        <Card variant='outlined' sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant='h5' fontWeight={700}>
                  {JENIS_LABELS[wo.jenisPekerjaan] || wo.jenisPekerjaan}
                </Typography>
                {koneksi && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 0.5 }}
                  >
                    📍 {koneksi.alamat}
                    {koneksi.kelurahan ? `, ${koneksi.kelurahan}` : ''}
                    {koneksi.kecamatan ? `, ${koneksi.kecamatan}` : ''}
                  </Typography>
                )}
                {wo.jenisPekerjaan === 'penyelesaian_laporan' && !koneksi && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 0.5 }}
                  >
                    📋 Penyelesaian laporan pelanggan
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  icon={getStatusIcon(wo.status)}
                  label={STATUS_LABELS[wo.status] || wo.status}
                  color={STATUS_COLORS[wo.status] || 'default'}
                  size='small'
                />
                <Tooltip title='Refresh data'>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={fetchAll}
                    sx={{ minWidth: 36, p: 0.5 }}
                  >
                    <Refresh fontSize='small' />
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <InfoItem
                  label='Status Respon'
                  value={
                    <Chip
                      size='small'
                      label={RESPON_LABELS[wo.statusRespon] || wo.statusRespon}
                      color={RESPON_COLORS[wo.statusRespon] || 'default'}
                    />
                  }
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <InfoItem
                  label='Penanggung Jawab'
                  value={wo.teknisiPenanggungJawab?.namaLengkap || '—'}
                  icon={
                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  }
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <InfoItem label='Dibuat' value={fmtDateTime(wo.createdAt)} />
              </Grid>
              <Grid item xs={6} md={3}>
                <InfoItem
                  label='Diperbarui'
                  value={fmtDateTime(wo.updatedAt)}
                />
              </Grid>
              {wo.workOrderSebelumnya && (
                <Grid item xs={6} md={3}>
                  <InfoItem
                    label='WO Sebelumnya'
                    value={
                      <Link
                        href={`/operations/work-orders/${wo.workOrderSebelumnya.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Chip
                          size='small'
                          label={
                            JENIS_LABELS[
                              wo.workOrderSebelumnya.jenisPekerjaan
                            ] || wo.workOrderSebelumnya.id.slice(-8)
                          }
                          color='primary'
                          variant='outlined'
                          clickable
                          icon={
                            <OpenInNew sx={{ fontSize: '14px !important' }} />
                          }
                        />
                      </Link>
                    }
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Action Alert ────────────────────────────────────────────────── */}
        {needsAction && (
          <Alert
            severity='warning'
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Stack direction='row' gap={1} flexWrap='wrap'>
                {needsPenolakan && (
                  <>
                    <Button
                      size='small'
                      color='warning'
                      variant='contained'
                      onClick={() => openDlg('penolakan', true)}
                    >
                      Terima Penolakan
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      onClick={() => openDlg('penolakan', false)}
                    >
                      Tolak Penolakan
                    </Button>
                  </>
                )}
                {needsTim && (
                  <>
                    <Button
                      size='small'
                      color='success'
                      variant='contained'
                      startIcon={<Group />}
                      onClick={() => openDlg('tim', true)}
                    >
                      Setujui Tim
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      startIcon={<Block />}
                      onClick={() => openDlg('tim', false)}
                    >
                      Tolak Tim
                    </Button>
                  </>
                )}
                {needsHasil && (
                  <>
                    <Button
                      size='small'
                      color='success'
                      variant='contained'
                      startIcon={<ThumbUp />}
                      onClick={() => openDlg('hasil', true)}
                    >
                      Setujui Hasil
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      startIcon={<ThumbDown />}
                      onClick={() => openDlg('hasil', false)}
                    >
                      Tolak Hasil
                    </Button>
                  </>
                )}
              </Stack>
            }
          >
            {needsPenolakan &&
              'Teknisi mengajukan penolakan — perlu keputusan admin.'}
            {needsTim &&
              !needsPenolakan &&
              'Tim teknisi diajukan — menunggu persetujuan admin.'}
            {needsHasil &&
              !needsTim &&
              !needsPenolakan &&
              'Teknisi sudah mengirim hasil — menunggu review admin.'}
          </Alert>
        )}

        {/* ─── Two Column Layout ───────────────────────────────────────────── */}
        <Grid container spacing={3}>
          {/* ─── Left Column (Main Content) ──────────────────────────────── */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Tim Kerja */}
              <Card variant='outlined' sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant='subtitle1' fontWeight={700}>
                      Tim Kerja
                    </Typography>
                    <Chip
                      size='small'
                      label={TIM_LABELS[wo.statusTim]}
                      color={TIM_COLORS[wo.statusTim]}
                    />
                  </Box>

                  {wo.tim?.length > 0 ? (
                    <Stack spacing={1}>
                      {wo.tim.map((t: any) => (
                        <Paper
                          key={t.id}
                          variant='outlined'
                          sx={{
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            borderRadius: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 14,
                              bgcolor: 'primary.light',
                            }}
                          >
                            {t.namaLengkap?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {t.namaLengkap}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {t.nip}
                              {t.divisi ? ` · ${t.divisi}` : ''}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      fontStyle='italic'
                    >
                      Belum ada anggota tim
                    </Typography>
                  )}

                  {wo.catatanTim && (
                    <Alert severity='info' sx={{ mt: 2, py: 0.5 }}>
                      <strong>Catatan Admin:</strong> {wo.catatanTim}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Progres Data */}
              {progresData && (
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant='subtitle1' fontWeight={700}>
                        Data Pengerjaan (
                        {JENIS_LABELS[wo.jenisPekerjaan] || wo.jenisPekerjaan})
                      </Typography>
                      {wo.status === 'selesai' && (
                        <Chip size='small' label='Selesai' color='success' />
                      )}
                      {wo.status === 'dikirim' && (
                        <Chip
                          size='small'
                          label='Menunggu Review'
                          color='info'
                        />
                      )}
                      {wo.status === 'sedang_dikerjakan' && (
                        <Chip size='small' label='Draft' color='default' />
                      )}
                      {wo.status === 'revisi' && (
                        <Chip size='small' label='Revisi' color='warning' />
                      )}
                    </Box>
                    <ProgresDataView
                      data={progresData}
                      jenis={wo.jenisPekerjaan}
                    />
                  </CardContent>
                </Card>
              )}
              {!progresData &&
                !loadingExtra &&
                [
                  'sedang_dikerjakan',
                  'ditugaskan',
                  'dikirim',
                  'selesai',
                  'revisi',
                ].includes(wo.status) && (
                  <Card variant='outlined' sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography
                        variant='subtitle1'
                        fontWeight={700}
                        sx={{ mb: 1 }}
                      >
                        Data Pengerjaan (
                        {JENIS_LABELS[wo.jenisPekerjaan] || wo.jenisPekerjaan})
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        fontStyle='italic'
                      >
                        Teknisi belum mengisi data pengerjaan.
                      </Typography>
                    </CardContent>
                  </Card>
                )}

              {/* Riwayat */}
              {(wo.riwayatRespon?.length > 0 ||
                wo.riwayatReview?.length > 0) && (
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant='subtitle1'
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      Riwayat
                    </Typography>

                    {wo.riwayatRespon?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Respon
                        </Typography>
                        <Stack spacing={1}>
                          {wo.riwayatRespon.map((r: any, i: number) => (
                            <Paper
                              key={i}
                              variant='outlined'
                              sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                bgcolor: 'grey.50',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: 'grey.500',
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant='body2'
                                  fontWeight={600}
                                  sx={{ textTransform: 'capitalize' }}
                                >
                                  {r.aksi?.replace(/_/g, ' ')}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  oleh {r.oleh || '—'}
                                </Typography>
                              </Box>
                              {r.alasan && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{ ml: 2, display: 'block' }}
                                >
                                  {r.alasan}
                                </Typography>
                              )}
                              <Typography
                                variant='caption'
                                color='text.disabled'
                                sx={{ ml: 2, display: 'block' }}
                              >
                                {fmtDateTime(r.tanggal)}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {wo.riwayatReview?.length > 0 && (
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Review Admin
                        </Typography>
                        <Stack spacing={1}>
                          {wo.riwayatReview.map((r: any, i: number) => {
                            const approved = r.status === 'disetujui';
                            return (
                              <Paper
                                key={i}
                                variant='outlined'
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: approved ? 'success.50' : 'error.50',
                                  borderColor: approved
                                    ? 'success.light'
                                    : 'error.light',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: approved
                                        ? 'success.main'
                                        : 'error.main',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant='body2'
                                    fontWeight={600}
                                    color={
                                      approved ? 'success.dark' : 'error.dark'
                                    }
                                    sx={{ textTransform: 'capitalize' }}
                                  >
                                    {r.status?.replace(/_/g, ' ')}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    oleh {r.oleh || '—'}
                                  </Typography>
                                </Box>
                                {r.catatan && (
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{ ml: 2, display: 'block' }}
                                  >
                                    {r.catatan}
                                  </Typography>
                                )}
                                <Typography
                                  variant='caption'
                                  color='text.disabled'
                                  sx={{ ml: 2, display: 'block' }}
                                >
                                  {fmtDateTime(r.tanggal)}
                                </Typography>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Alasan Penolakan */}
              {wo.alasanPenolakan && (
                <Alert severity='warning' sx={{ borderRadius: 2 }}>
                  <Typography variant='body2'>
                    <strong>Alasan Penolakan Teknisi:</strong>{' '}
                    {wo.alasanPenolakan}
                  </Typography>
                  {wo.catatanReviewPenolakan && (
                    <Typography variant='body2' sx={{ mt: 0.5 }}>
                      <strong>Review:</strong> {wo.catatanReviewPenolakan}
                    </Typography>
                  )}
                </Alert>
              )}

              {wo.catatanReview && (
                <Alert severity='info' sx={{ borderRadius: 2 }}>
                  <strong>Catatan Review Terakhir:</strong> {wo.catatanReview}
                </Alert>
              )}
            </Stack>
          </Grid>

          {/* ─── Right Column (Sidebar) ──────────────────────────────────── */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Admin Actions */}
              <Card variant='outlined' sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    fontWeight={700}
                    sx={{ mb: 1.5 }}
                  >
                    Aksi Admin
                  </Typography>
                  <Stack spacing={1}>
                    {needsTim && (
                      <>
                        <Button
                          fullWidth
                          size='small'
                          variant='contained'
                          color='success'
                          startIcon={<Group />}
                          onClick={() => openDlg('tim', true)}
                        >
                          Setujui Tim
                        </Button>
                        <Button
                          fullWidth
                          size='small'
                          variant='outlined'
                          color='error'
                          startIcon={<Block />}
                          onClick={() => openDlg('tim', false)}
                        >
                          Tolak Tim
                        </Button>
                      </>
                    )}
                    {needsPenolakan && (
                      <>
                        <Button
                          fullWidth
                          size='small'
                          variant='contained'
                          color='warning'
                          onClick={() => openDlg('penolakan', true)}
                        >
                          Terima Penolakan
                        </Button>
                        <Button
                          fullWidth
                          size='small'
                          variant='outlined'
                          color='error'
                          onClick={() => openDlg('penolakan', false)}
                        >
                          Tolak Penolakan
                        </Button>
                      </>
                    )}
                    {needsHasil && (
                      <>
                        <Button
                          fullWidth
                          size='small'
                          variant='contained'
                          color='success'
                          startIcon={<ThumbUp />}
                          onClick={() => openDlg('hasil', true)}
                        >
                          Setujui Hasil
                        </Button>
                        <Button
                          fullWidth
                          size='small'
                          variant='outlined'
                          color='error'
                          startIcon={<ThumbDown />}
                          onClick={() => openDlg('hasil', false)}
                        >
                          Tolak Hasil
                        </Button>
                      </>
                    )}
                    <Divider />
                    <Button
                      fullWidth
                      size='small'
                      variant='outlined'
                      color='error'
                      startIcon={<Cancel />}
                      disabled={['dibatalkan', 'selesai'].includes(wo.status)}
                      onClick={() => openDlg('cancel')}
                    >
                      Batalkan WO
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Laporan (penyelesaian_laporan) */}
              {wo.jenisPekerjaan === 'penyelesaian_laporan' && laporanData && (
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant='subtitle1'
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      📋 Detail Laporan
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1.5 }}
                    >
                      {laporanData.NamaLaporan}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <InfoItem
                          label='Jenis'
                          value={
                            JENIS_LAPORAN_LABELS[laporanData.JenisLaporan] ||
                            laporanData.JenisLaporan
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoItem label='Status' value={laporanData.Status} />
                      </Grid>
                      <Grid item xs={12}>
                        <InfoItem label='Alamat' value={laporanData.Alamat} />
                      </Grid>
                      <Grid item xs={12}>
                        <InfoItem label='Masalah' value={laporanData.Masalah} />
                      </Grid>
                      {laporanData.Catatan && (
                        <Grid item xs={12}>
                          <InfoItem
                            label='Catatan'
                            value={laporanData.Catatan}
                          />
                        </Grid>
                      )}
                      <Grid item xs={6}>
                        <InfoItem
                          label='Dilaporkan'
                          value={fmtDate(laporanData.createdAt)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoItem
                          label='Diperbarui'
                          value={fmtDate(laporanData.updatedAt)}
                        />
                      </Grid>
                    </Grid>
                    {laporanData.imageUrl?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                        >
                          Foto Laporan
                        </Typography>
                        <ImageList cols={3} gap={8} sx={{ mt: 1 }}>
                          {laporanData.imageUrl.map(
                            (url: string, i: number) => (
                              <ImageListItem key={i}>
                                <a
                                  href={url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                >
                                  <Box
                                    component='img'
                                    src={url}
                                    alt={`Foto ${i + 1}`}
                                    sx={{
                                      width: '100%',
                                      height: 80,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                    }}
                                  />
                                </a>
                              </ImageListItem>
                            )
                          )}
                        </ImageList>
                      </Box>
                    )}
                    {laporanData.pengguna && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Pelapor
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <InfoItem
                              label='Nama'
                              value={laporanData.pengguna.namaLengkap || '—'}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <InfoItem
                              label='Email'
                              value={laporanData.pengguna.email || '—'}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <InfoItem
                              label='No. HP'
                              value={laporanData.pengguna.noHp || '—'}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                    {laporanData.Kordinat && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant='caption' color='text.disabled'>
                          Koordinat: {laporanData.Kordinat.latitude},{' '}
                          {laporanData.Kordinat.longitude}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Koneksi Data */}
              {koneksi && (
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: 'grey.50',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant='subtitle2' fontWeight={700}>
                      Data Sambungan Baru
                    </Typography>
                    <Chip
                      size='small'
                      label={PENGAJUAN_LABELS[koneksi.statusPengajuan]}
                      color={PENGAJUAN_COLORS[koneksi.statusPengajuan]}
                    />
                  </Box>
                  <CardContent sx={{ pt: 2 }}>
                    {koneksi.statusPengajuan === 'REJECTED' &&
                      koneksi.alasanPenolakan && (
                        <Alert severity='error' sx={{ mb: 2, py: 0.5 }}>
                          <strong>Alasan Penolakan:</strong>{' '}
                          {koneksi.alasanPenolakan}
                        </Alert>
                      )}

                    {koneksi.pelanggan && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                          sx={{
                            mb: 1,
                            display: 'block',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            pb: 0.5,
                          }}
                        >
                          Data Pelanggan
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <InfoItem
                              label='Nama'
                              value={koneksi.pelanggan.namaLengkap}
                              icon={
                                <Person
                                  sx={{ fontSize: 14, color: 'text.secondary' }}
                                />
                              }
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <InfoItem
                              label='Email'
                              value={koneksi.pelanggan.email}
                              icon={
                                <Email
                                  sx={{ fontSize: 14, color: 'text.secondary' }}
                                />
                              }
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <InfoItem
                              label='No. HP'
                              value={koneksi.pelanggan.noHp}
                              icon={
                                <Phone
                                  sx={{ fontSize: 14, color: 'text.secondary' }}
                                />
                              }
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          display: 'block',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          pb: 0.5,
                        }}
                      >
                        Identitas
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <InfoItem
                            label='NIK'
                            value={koneksi.nik}
                            icon={
                              <BadgeIcon
                                sx={{ fontSize: 14, color: 'text.secondary' }}
                              />
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoItem label='No. KK' value={koneksi.noKK} />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoItem label='No. IMB' value={koneksi.imb} />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoItem
                            label='Luas Bangunan'
                            value={
                              koneksi.luasBangunan
                                ? `${koneksi.luasBangunan} m²`
                                : '—'
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          display: 'block',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          pb: 0.5,
                        }}
                      >
                        Lokasi
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <InfoItem
                            label='Alamat'
                            value={koneksi.alamat}
                            icon={
                              <LocationOn
                                sx={{ fontSize: 14, color: 'text.secondary' }}
                              />
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoItem
                            label='Kelurahan'
                            value={koneksi.kelurahan}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <InfoItem
                            label='Kecamatan'
                            value={koneksi.kecamatan}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          display: 'block',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          pb: 0.5,
                        }}
                      >
                        Dokumen
                      </Typography>
                      <Stack direction='row' spacing={1} flexWrap='wrap'>
                        {koneksi.nikUrl && (
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<Description />}
                            href={koneksi.nikUrl}
                            target='_blank'
                            rel='noopener'
                          >
                            KTP
                          </Button>
                        )}
                        {koneksi.kkUrl && (
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<Description />}
                            href={koneksi.kkUrl}
                            target='_blank'
                            rel='noopener'
                          >
                            KK
                          </Button>
                        )}
                        {koneksi.imbUrl && (
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<Description />}
                            href={koneksi.imbUrl}
                            target='_blank'
                            rel='noopener'
                          >
                            IMB
                          </Button>
                        )}
                      </Stack>
                    </Box>

                    <Grid
                      container
                      spacing={1}
                      sx={{
                        pt: 1,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Grid item xs={6}>
                        <InfoItem
                          label='Tgl Pengajuan'
                          value={fmtDate(koneksi.createdAt)}
                        />
                      </Grid>
                      {koneksi.tanggalVerifikasi && (
                        <Grid item xs={6}>
                          <InfoItem
                            label='Tgl Verifikasi'
                            value={fmtDate(koneksi.tanggalVerifikasi)}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Workflow Chain */}
              {workflow.length > 0 && (
                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant='subtitle1'
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      Rantai Workflow
                    </Typography>
                    <Stepper orientation='vertical' activeStep={-1}>
                      {workflow
                        .filter(
                          (item: any) =>
                            item.jenisPekerjaan !== 'penyelesaian_laporan'
                        )
                        .map((item: any, index: number) => {
                          const color =
                            CHAIN_COLORS[item.chainStatus] || '#9e9e9e';
                          const isThis = item.workOrder?.id === id;
                          return (
                            <Step key={index} active expanded>
                              <StepLabel
                                StepIconComponent={() => (
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      bgcolor: color,
                                      border: isThis ? '2px solid' : 'none',
                                      borderColor: 'primary.main',
                                      boxShadow: isThis
                                        ? '0 0 0 3px rgba(25,118,210,0.3)'
                                        : 'none',
                                    }}
                                  />
                                )}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Typography
                                    variant='body2'
                                    fontWeight={isThis ? 700 : 500}
                                    color={
                                      item.chainStatus === 'aktif'
                                        ? 'primary.main'
                                        : 'text.primary'
                                    }
                                  >
                                    {item.urutan}.{' '}
                                    {JENIS_LABELS[item.jenisPekerjaan] ||
                                      item.jenisPekerjaan}
                                  </Typography>
                                  <Chip
                                    size='small'
                                    label={
                                      CHAIN_LABELS[item.chainStatus] ||
                                      item.chainStatus
                                    }
                                    sx={{
                                      fontSize: 10,
                                      height: 20,
                                      bgcolor: `${color}22`,
                                      color,
                                    }}
                                  />
                                  {isThis && (
                                    <Chip
                                      size='small'
                                      label='Saat ini'
                                      color='primary'
                                      variant='outlined'
                                      sx={{ fontSize: 10, height: 20 }}
                                    />
                                  )}
                                </Box>
                              </StepLabel>
                              {item.workOrder && (
                                <StepContent>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    PJ:{' '}
                                    {item.workOrder.teknisiPenanggungJawab
                                      ?.namaLengkap || '—'}
                                  </Typography>
                                  {item.workOrder.id !== id && (
                                    <Link
                                      href={`/operations/work-orders/${item.workOrder.id}`}
                                      style={{
                                        textDecoration: 'none',
                                        display: 'block',
                                      }}
                                    >
                                      <Typography
                                        variant='caption'
                                        color='primary'
                                        sx={{
                                          '&:hover': {
                                            textDecoration: 'underline',
                                          },
                                        }}
                                      >
                                        Lihat detail →
                                      </Typography>
                                    </Link>
                                  )}
                                </StepContent>
                              )}
                            </Step>
                          );
                        })}
                    </Stepper>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ─── Dialogs ──────────────────────────────────────────────────────────── */}

      {/* Review Tim */}
      <Dialog
        open={dlgTim}
        onClose={() => setDlgTim(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          {actionApprove ? 'Setujui Komposisi Tim' : 'Tolak Komposisi Tim'}
        </DialogTitle>
        <DialogContent>
          {wo.tim?.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary' gutterBottom>
                Tim yang diajukan:
              </Typography>
              {wo.tim.map((t: any) => (
                <Typography key={t.id} variant='body2'>
                  • {t.namaLengkap}
                  {t.divisi ? ` (${t.divisi})` : ''}
                </Typography>
              ))}
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={2}
            size='small'
            label={
              actionApprove ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'
            }
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            error={!actionApprove && !catatan.trim()}
            helperText={
              !actionApprove && !catatan.trim()
                ? 'Wajib diisi saat menolak'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgTim(false)} size='small'>
            Batal
          </Button>
          <Button
            variant='contained'
            color={actionApprove ? 'success' : 'error'}
            size='small'
            onClick={handleReviewTim}
            disabled={mutating || (!actionApprove && !catatan.trim())}
          >
            {mutating ? (
              <CircularProgress size={16} />
            ) : actionApprove ? (
              'Setujui Tim'
            ) : (
              'Tolak Tim'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Penolakan */}
      <Dialog
        open={dlgPenolakan}
        onClose={() => setDlgPenolakan(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          {actionApprove
            ? 'Terima Penolakan Teknisi'
            : 'Tolak Penolakan — Wajib Dikerjakan'}
        </DialogTitle>
        <DialogContent>
          {wo.alasanPenolakan && (
            <Alert severity='warning' sx={{ mb: 2, py: 0.5 }}>
              <strong>Alasan teknisi:</strong> {wo.alasanPenolakan}
            </Alert>
          )}
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {actionApprove
              ? 'Penolakan diterima. Work order ini perlu di-reassign ke teknisi lain.'
              : 'Alasan penolakan tidak diterima. Teknisi tetap harus menjalankan WO ini.'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            size='small'
            label='Catatan keputusan (opsional)'
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgPenolakan(false)} size='small'>
            Batal
          </Button>
          <Button
            variant='contained'
            color={actionApprove ? 'warning' : 'error'}
            size='small'
            onClick={handleReviewPenolakan}
            disabled={mutating}
          >
            {mutating ? (
              <CircularProgress size={16} />
            ) : actionApprove ? (
              'Terima Penolakan'
            ) : (
              'Tolak Penolakan'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Hasil */}
      <Dialog
        open={dlgHasil}
        onClose={() => setDlgHasil(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          {actionApprove
            ? 'Setujui Hasil Pekerjaan'
            : 'Tolak Hasil & Minta Revisi'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {actionApprove
              ? 'Pekerjaan ditandai selesai dan proses berikutnya dilanjutkan.'
              : 'Hasil ditolak. Teknisi perlu melakukan revisi dan submit ulang.'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size='small'
            label={
              actionApprove ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'
            }
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            error={!actionApprove && !catatan.trim()}
            helperText={
              !actionApprove && !catatan.trim()
                ? 'Wajib diisi saat menolak'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgHasil(false)} size='small'>
            Batal
          </Button>
          <Button
            variant='contained'
            color={actionApprove ? 'success' : 'error'}
            size='small'
            onClick={handleReviewHasil}
            disabled={mutating || (!actionApprove && !catatan.trim())}
          >
            {mutating ? (
              <CircularProgress size={16} />
            ) : actionApprove ? (
              'Setujui'
            ) : (
              'Tolak'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batalkan */}
      <Dialog
        open={dlgCancel}
        onClose={() => setDlgCancel(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Batalkan Work Order</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2, py: 0.5 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            size='small'
            label='Alasan pembatalan (opsional)'
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgCancel(false)} size='small'>
            Batal
          </Button>
          <Button
            variant='contained'
            color='error'
            size='small'
            onClick={handleBatalkan}
            disabled={mutating}
          >
            {mutating ? <CircularProgress size={16} /> : 'Batalkan WO'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.ok ? 'success' : 'error'}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}

// ─── Progres Data Viewer ──────────────────────────────────────────────────────
// Menampilkan data progres berdasarkan jenis pekerjaan (read-only admin view)

function ProgresDataView({ data, jenis }: { data: any; jenis: string }) {
  if (!data)
    return (
      <Typography variant='body2' color='text.secondary'>
        Belum ada data progres
      </Typography>
    );

  const items: { label: string; value: React.ReactNode }[] = [];

  // Common catatan
  const addCatatan = () => {
    if (data.catatan) items.push({ label: 'Catatan', value: data.catatan });
  };

  if (jenis === 'survei') {
    if (data.koordinat)
      items.push({
        label: 'Koordinat',
        value: `${data.koordinat.latitude}, ${data.koordinat.longitude}`,
      });
    if (data.urlJaringan)
      items.push({
        label: 'Foto Jaringan',
        value: <ImageLink url={data.urlJaringan} />,
      });
    if (data.diameterPipa != null)
      items.push({ label: 'Diameter Pipa', value: `${data.diameterPipa} mm` });
    if (data.urlPosisiBak)
      items.push({
        label: 'Foto Posisi Bak',
        value: <ImageLink url={data.urlPosisiBak} />,
      });
    if (data.posisiMeteran)
      items.push({
        label: 'Posisi Meteran',
        value: <ImageLink url={data.posisiMeteran} />,
      });
    if (data.jumlahPenghuni != null)
      items.push({
        label: 'Jumlah Penghuni',
        value: `${data.jumlahPenghuni} orang`,
      });
    if (data.standar != null)
      items.push({
        label: 'Standar',
        value: data.standar ? 'Standar' : 'Tidak Standar',
      });
    addCatatan();
  } else if (jenis === 'rab') {
    if (data.totalBiaya != null)
      items.push({
        label: 'Total Biaya',
        value: `Rp ${Number(data.totalBiaya).toLocaleString('id-ID')}`,
      });
    if (data.urlRab)
      items.push({
        label: 'Dokumen RAB',
        value: <ImageLink url={data.urlRab} />,
      });
    addCatatan();
  } else if (jenis === 'pemasangan') {
    if (data.seriMeteran)
      items.push({ label: 'Seri Meteran', value: data.seriMeteran });
    if (data.fotoRumah)
      items.push({
        label: 'Foto Rumah',
        value: <ImageLink url={data.fotoRumah} />,
      });
    if (data.fotoMeteran)
      items.push({
        label: 'Foto Meteran',
        value: <ImageLink url={data.fotoMeteran} />,
      });
    if (data.fotoMeteranDanRumah)
      items.push({
        label: 'Foto Meteran & Rumah',
        value: <ImageLink url={data.fotoMeteranDanRumah} />,
      });
    addCatatan();
  } else if (
    jenis === 'pengawasan_pemasangan' ||
    jenis === 'pengawasan_setelah_pemasangan' ||
    jenis === 'penyelesaian_laporan'
  ) {
    if (data.urlGambar?.length > 0) {
      items.push({
        label: 'Foto',
        value: (
          <Stack direction='row' gap={1} flexWrap='wrap'>
            {data.urlGambar.map((url: string, i: number) => (
              <a key={i} href={url} target='_blank' rel='noopener noreferrer'>
                <Box
                  component='img'
                  src={url}
                  alt={`Foto ${i + 1}`}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              </a>
            ))}
          </Stack>
        ),
      });
    }
    addCatatan();
  } else if (jenis === 'maintenance') {
    const kondisiDayaLabel = (v: string | null) =>
      v === 'menyala' ? 'Menyala' : v === 'mati' ? 'Mati' : null;
    const kondisiKoneksiLabel = (v: string | null) =>
      v === 'terkoneksi' ? 'Terkoneksi' : v === 'tidak_terkoneksi' ? 'Tidak Terkoneksi' : null;

    items.push({
      label: 'Kondisi Sebelum',
      value: (
        <Stack direction='row' spacing={1} flexWrap='wrap' alignItems='center'>
          {kondisiDayaLabel(data.kondisiSebelumDaya) ? (
            <Chip size='small' variant='outlined' label={`Daya: ${kondisiDayaLabel(data.kondisiSebelumDaya)}`}
              color={data.kondisiSebelumDaya === 'menyala' ? 'success' : 'error'} />
          ) : <Typography variant='body2' color='text.secondary'>Daya: —</Typography>}
          {kondisiKoneksiLabel(data.kondisiSebelumKoneksi) ? (
            <Chip size='small' variant='outlined' label={`Koneksi: ${kondisiKoneksiLabel(data.kondisiSebelumKoneksi)}`}
              color={data.kondisiSebelumKoneksi === 'terkoneksi' ? 'success' : 'error'} />
          ) : <Typography variant='body2' color='text.secondary'>Koneksi: —</Typography>}
        </Stack>
      ),
    });

    if (data.fotoSebelum?.length > 0) {
      items.push({
        label: `Foto Sebelum (${data.fotoSebelum.length})`,
        value: (
          <Stack direction='row' gap={1} flexWrap='wrap'>
            {data.fotoSebelum.map((url: string, i: number) => (
              <a key={i} href={url} target='_blank' rel='noopener noreferrer'>
                <Box component='img' src={url} alt={`Sebelum ${i + 1}`}
                  sx={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 1,
                    border: '1px solid', borderColor: 'divider', '&:hover': { opacity: 0.8 } }} />
              </a>
            ))}
          </Stack>
        ),
      });
    }

    items.push({
      label: 'Kondisi Sesudah',
      value: (
        <Stack direction='row' spacing={1} flexWrap='wrap' alignItems='center'>
          {kondisiDayaLabel(data.kondisiSetelahDaya) ? (
            <Chip size='small' variant='outlined' label={`Daya: ${kondisiDayaLabel(data.kondisiSetelahDaya)}`}
              color={data.kondisiSetelahDaya === 'menyala' ? 'success' : 'error'} />
          ) : <Typography variant='body2' color='text.secondary'>Daya: —</Typography>}
          {kondisiKoneksiLabel(data.kondisiSetelahKoneksi) ? (
            <Chip size='small' variant='outlined' label={`Koneksi: ${kondisiKoneksiLabel(data.kondisiSetelahKoneksi)}`}
              color={data.kondisiSetelahKoneksi === 'terkoneksi' ? 'success' : 'error'} />
          ) : <Typography variant='body2' color='text.secondary'>Koneksi: —</Typography>}
        </Stack>
      ),
    });

    if (data.fotoSetelah?.length > 0) {
      items.push({
        label: `Foto Sesudah (${data.fotoSetelah.length})`,
        value: (
          <Stack direction='row' gap={1} flexWrap='wrap'>
            {data.fotoSetelah.map((url: string, i: number) => (
              <a key={i} href={url} target='_blank' rel='noopener noreferrer'>
                <Box component='img' src={url} alt={`Sesudah ${i + 1}`}
                  sx={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 1,
                    border: '1px solid', borderColor: 'divider', '&:hover': { opacity: 0.8 } }} />
              </a>
            ))}
          </Stack>
        ),
      });
    }

    addCatatan();
  } else {
    addCatatan();
  }

  if (items.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary' fontStyle='italic'>
        Belum ada data progres tersimpan
      </Typography>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {items.map((item, i) => (
        <Grid item xs={12} key={i}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {item.label}
          </Typography>
          <Box sx={{ mt: 0.3 }}>
            {typeof item.value === 'string' ? (
              <Typography variant='body2'>{item.value}</Typography>
            ) : (
              item.value
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

function ImageLink({ url }: { url: string }) {
  return (
    <a href={url} target='_blank' rel='noopener noreferrer'>
      <Box
        component='img'
        src={url}
        alt='foto'
        sx={{
          width: 120,
          height: 90,
          objectFit: 'cover',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': { opacity: 0.8 },
        }}
      />
    </a>
  );
}
