'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  getWorkOrders,
  getWorkOrder,
  reviewTim as srvReviewTim,
  reviewPenolakan as srvReviewPenolakan,
  reviewHasil as srvReviewHasil,
  batalkanWorkOrder as srvBatalkan,
  getProgresWorkOrder,
  getLaporan,
  getWorkflowChain,
  buatWorkOrder as srvBuatWorkOrder,
  getTeknisiUsers,
  cekPrerequisitePekerjaan,
} from '@/lib/graphql/teknisiServer';
import { useQuery as useApolloQuery } from '@apollo/client/react';
import { GET_ALL_CONNECTION_DATA } from '@/lib/graphql/queries/connectionData';
import { GET_ALL_LAPORAN } from '@/lib/graphql/queries/reports';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  AvatarGroup,
  Pagination,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
  Stack,
  Tooltip,
  Badge,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Build,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Person,
  ThumbUp,
  ThumbDown,
  Cancel,
  Group,
  HourglassEmpty,
  Block,
  Refresh,
  InfoOutlined,
  Timeline,
  Description,
  Add,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import TableSkeleton from '../../../components/ui/TableSkeleton';

// ─── Label & Color Maps ───────────────────────────────────────────────────────

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
  diajukan: 'Menunggu Review Tim',
  disetujui: 'Tim Disetujui',
  ditolak: 'Tim Ditolak',
};

const TIM_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> =
  {
    belum_diajukan: 'default',
    diajukan: 'warning',
    disetujui: 'success',
    ditolak: 'error',
  };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFlexDate(v: string | number | null | undefined): Date | null {
  if (!v) return null;
  const n =
    typeof v === 'number' ? v : /^\d+$/.test(String(v)) ? Number(v) : NaN;
  if (!isNaN(n)) return new Date(n);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

const fmtDate = (v: string | number | null | undefined) => {
  const d = parseFlexDate(v);
  return d
    ? d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';
};

const fmtDateTime = (v: string | number | null | undefined) => {
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

function woActions(wo: any) {
  return {
    needsTim: wo.statusTim === 'diajukan',
    needsPenolakan: wo.statusRespon === 'penolakan_diajukan',
    needsHasil: wo.status === 'dikirim',
    // Penolakan diterima admin — WO ini dibatalkan, perlu teknisi pengganti
    canBuatPengganti:
      wo.statusRespon === 'penolakan_diterima' &&
      wo.status === 'dibatalkan',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrderManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // ─── State ───────────────────────────────────────────────────────────────
  const [allWO, setAllWO] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJenis, setFilterJenis] = useState('all');
  const [filterRespon, setFilterRespon] = useState('all');
  const [filterTeknisi, setFilterTeknisi] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Dialogs
  const [dlgDetail, setDlgDetail] = useState(false);
  const [dlgCancel, setDlgCancel] = useState(false);
  const [dlgTim, setDlgTim] = useState(false);
  const [dlgPenolakan, setDlgPenolakan] = useState(false);
  const [dlgHasil, setDlgHasil] = useState(false);
  const [actionApprove, setActionApprove] = useState(true);
  const [catatan, setCatatan] = useState('');
  const [mutating, setMutating] = useState(false);

  // Reassign teknisi saat penolakan diterima
  const [reassignTeknisiId, setReassignTeknisiId] = useState('');
  const [reassignTeknisiList, setReassignTeknisiList] = useState<any[]>([]);
  const [loadingReassignTeknisi, setLoadingReassignTeknisi] = useState(false);

  // Dialog buat WO pengganti (untuk penolakan yang sudah diterima sebelumnya)
  const [dlgBuatPengganti, setDlgBuatPengganti] = useState(false);

  // Detail dialog extra tabs
  const [detailTab, setDetailTab] = useState(0);
  const [detailFull, setDetailFull] = useState<any>(null);
  const [progres, setProgres] = useState<any[]>([]);
  const [laporan, setLaporan] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [dlgAlasan, setDlgAlasan] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, msg: '', ok: true });
  const toast = (msg: string, ok = true) =>
    setSnackbar({ open: true, msg, ok });

  // ─── Apollo: Connection Data ─────────────────────────────────────────────
  const {
    data: koneksiDataRaw,
    loading: koneksiQueryLoading,
    refetch: refetchKoneksi,
  } = useApolloQuery(GET_ALL_CONNECTION_DATA, {
    fetchPolicy: 'cache-first',
    skip: false,
  });
  const allKoneksiData: any[] =
    (koneksiDataRaw as any)?.getAllKoneksiData ?? [];

  // ─── Apollo: Laporan list (untuk dropdown penyelesaian_laporan) ──────────
  const { data: laporanDataRaw } = useApolloQuery(GET_ALL_LAPORAN, {
    fetchPolicy: 'cache-first',
  });
  const allLaporan: any[] = (laporanDataRaw as any)?.getAllLaporan ?? [];
  const laporanById = React.useMemo(() => {
    const map: Record<string, any> = {};
    allLaporan.forEach(l => { if (l._id) map[l._id] = l; });
    return map;
  }, [allLaporan]);

  // ─── Buat Work Order State ───────────────────────────────────────────────
  const [dlgBuat, setDlgBuat] = useState(false);
  const [buatLoading, setBuatLoading] = useState(false);
  const [koneksiList, setKoneksiList] = useState<any[]>([]);
  const [teknisiList, setTeknisiList] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [buatForm, setBuatForm] = useState({
    idKoneksiData: null as any,
    jenisPekerjaan: '',
    teknisiPenanggungJawab: null as any,
    idLaporan: null as any,
  });
  const [prerequisiteMsg, setPrerequisiteMsg] = useState<boolean | null>(null);
  const [checkingPrereq, setCheckingPrereq] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getWorkOrders(token, {
        pagination: { page: 1, limit: 500 },
      });
      if (res.errors?.length) throw new Error(res.errors[0].message);
      setAllWO((res.data as any)?.workOrders?.data || []);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  // ─── Fetch Detail ────────────────────────────────────────────────────────
  const fetchDetail = useCallback(
    async (woId: string, idKoneksiData: string) => {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      setLoadingDetail(true);
      try {
        const [fullRes, progresRes, laporanRes, workflowRes] =
          await Promise.all([
            getWorkOrder(token, woId),
            getProgresWorkOrder(token, woId),
            getLaporan(token, woId),
            getWorkflowChain(token, idKoneksiData),
          ]);
        setDetailFull((fullRes.data as any)?.workOrder || null);
        setProgres((progresRes.data as any)?.progresWorkOrder || []);
        setLaporan((laporanRes.data as any)?.laporan || []);
        setWorkflow((workflowRes.data as any)?.workflowChain || []);
      } catch {
        // silent
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  // ─── Mutation wrapper ────────────────────────────────────────────────────
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
      fetchData();
    } catch (e: any) {
      toast(e.message || 'Gagal', false);
    } finally {
      setMutating(false);
    }
  };

  // ─── Filter ──────────────────────────────────────────────────────────────
  const filtered = allWO.filter(wo => {
    const pelangganName = (
      wo.koneksiData?.pelanggan?.namaLengkap ||
      (wo.idLaporan && laporanById[wo.idLaporan]?.idPengguna?.namaLengkap) ||
      ''
    ).toLowerCase();
    const teknisiName = (wo.teknisiPenanggungJawab?.namaLengkap || '').toLowerCase();
    const woId = (wo.id || '').toLowerCase();
    const q = search.toLowerCase();

    const matchSearch = !search || pelangganName.includes(q) || teknisiName.includes(q) || woId.includes(q);
    const matchStatus = filterStatus === 'all' || wo.status === filterStatus;
    const matchJenis = filterJenis === 'all' || wo.jenisPekerjaan === filterJenis;
    const matchRespon = filterRespon === 'all' || wo.statusRespon === filterRespon;
    const matchTeknisi = !filterTeknisi || teknisiName.includes(filterTeknisi.toLowerCase());

    return matchSearch && matchStatus && matchJenis && matchRespon && matchTeknisi;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    total: allWO.length,
    ditugaskan: allWO.filter(w => w.status === 'ditugaskan').length,
    dikerjakan: allWO.filter(w => w.status === 'sedang_dikerjakan').length,
    selesai: allWO.filter(w => w.status === 'selesai').length,
    perluReview: allWO.filter(
      w =>
        w.statusTim === 'diajukan' ||
        w.statusRespon === 'penolakan_diajukan' ||
        w.statusRespon === 'penolakan_diterima' ||
        w.status === 'dikirim'
    ).length,
  };

  // ─── Action helpers ──────────────────────────────────────────────────────
  const closeMenu = () => setMenuAnchor(null);

  const openAction = (
    dlg: 'detail' | 'cancel' | 'tim' | 'penolakan' | 'hasil',
    approve = true
  ) => {
    closeMenu();
    setActionApprove(approve);
    setCatatan('');
    if (dlg === 'detail') {
      setDlgDetail(true);
      setDetailTab(0);
      setDetailFull(null);
      setProgres([]);
      setLaporan([]);
      setWorkflow([]);
      if (selectedWO) fetchDetail(selectedWO.id, selectedWO.idKoneksiData);
    } else if (dlg === 'cancel') setDlgCancel(true);
    else if (dlg === 'tim') setDlgTim(true);
    else if (dlg === 'penolakan') {
      setDlgPenolakan(true);
      setReassignTeknisiId('');
      // Load daftar teknisi hanya saat admin akan terima penolakan (perlu reassign)
      if (approve) {
        setLoadingReassignTeknisi(true);
        const tok = localStorage.getItem('admin_token') || '';
        getTeknisiUsers(tok)
          .then(res => {
            const list: any[] = (res.data as any)?.users ?? [];
            setReassignTeknisiList(list.filter((t: any) => t.isActive !== false));
          })
          .catch(() => {})
          .finally(() => setLoadingReassignTeknisi(false));
      }
    } else if (dlg === 'hasil') setDlgHasil(true);
  };

  const handleReviewTim = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () =>
        srvReviewTim(token, {
          workOrderId: selectedWO.id,
          disetujui: actionApprove,
          catatan: catatan || undefined,
        }),
      actionApprove ? 'Tim disetujui' : 'Tim ditolak',
      () => setDlgTim(false)
    );
  };

  const handleReviewPenolakan = async () => {
    const token = localStorage.getItem('admin_token') || '';

    // Tolak penolakan — teknisi tetap kerjakan, tidak perlu reassign
    if (!actionApprove) {
      runMutation(
        () => srvReviewPenolakan(token, { workOrderId: selectedWO.id, disetujui: false, catatan: catatan || undefined }),
        'Penolakan ditolak — teknisi harus mengerjakan WO',
        () => setDlgPenolakan(false)
      );
      return;
    }

    // Terima penolakan + buat WO baru dengan teknisi pengganti
    if (!reassignTeknisiId) {
      toast('Pilih teknisi pengganti terlebih dahulu', false);
      return;
    }

    setMutating(true);
    try {
      // Step 1: Terima penolakan dari teknisi
      const res1 = await srvReviewPenolakan(token, {
        workOrderId: selectedWO.id,
        disetujui: true,
        catatan: catatan || undefined,
      });
      if (res1.errors?.length) throw new Error(res1.errors[0].message);

      // Step 2: Buat WO baru dengan jenis & koneksi yang sama, teknisi berbeda
      const newInput: Parameters<typeof srvBuatWorkOrder>[1] = {
        jenisPekerjaan: selectedWO.jenisPekerjaan,
        teknisiPenanggungJawab: reassignTeknisiId,
      };
      if (selectedWO.jenisPekerjaan === 'penyelesaian_laporan') {
        if (selectedWO.idLaporan) newInput.idLaporan = selectedWO.idLaporan;
      } else {
        newInput.idKoneksiData = selectedWO.idKoneksiData;
      }

      const res2 = await srvBuatWorkOrder(token, newInput);
      if (res2.errors?.length) throw new Error(res2.errors[0].message);
      const r2 = (res2.data as any)?.buatWorkOrder;
      if (r2?.success === false) throw new Error(
        'Penolakan telah diterima dan WO lama sudah ditutup otomatis. ' +
        'Namun gagal membuat WO baru: ' + (r2.message || 'error tidak diketahui') +
        '. Silakan buat WO baru untuk teknisi pengganti secara manual.'
      );

      setDlgPenolakan(false);
      setCatatan('');
      setReassignTeknisiId('');
      toast('Penolakan diterima. WO baru telah dibuat untuk teknisi pengganti');
      fetchData();
    } catch (e: any) {
      toast(e.message || 'Gagal', false);
    } finally {
      setMutating(false);
    }
  };

  const handleReviewHasil = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () =>
        srvReviewHasil(token, {
          workOrderId: selectedWO.id,
          disetujui: actionApprove,
          catatan: catatan || undefined,
        }),
      actionApprove
        ? 'Hasil disetujui'
        : 'Hasil ditolak — teknisi perlu revisi',
      () => setDlgHasil(false)
    );
  };

  const handleBatalkan = () => {
    const token = localStorage.getItem('admin_token') || '';
    runMutation(
      () => srvBatalkan(token, selectedWO.id, catatan || undefined),
      'Work order dibatalkan',
      () => setDlgCancel(false)
    );
  };

  // Buka dialog "Buat WO Pengganti" — untuk WO yg sudah penolakan_diterima tapi belum di-reassign
  const openBuatPengganti = () => {
    closeMenu();
    setReassignTeknisiId('');
    setDlgBuatPengganti(true);
    setLoadingReassignTeknisi(true);
    const tok = localStorage.getItem('admin_token') || '';
    getTeknisiUsers(tok)
      .then(res => {
        const list: any[] = (res.data as any)?.users ?? [];
        setReassignTeknisiList(list.filter((t: any) => t.isActive !== false));
      })
      .catch(() => {})
      .finally(() => setLoadingReassignTeknisi(false));
  };

  const handleBuatWOPengganti = async () => {
    if (!reassignTeknisiId || !selectedWO) return;
    const token = localStorage.getItem('admin_token') || '';
    setMutating(true);
    try {
      const newInput: Parameters<typeof srvBuatWorkOrder>[1] = {
        jenisPekerjaan: selectedWO.jenisPekerjaan,
        teknisiPenanggungJawab: reassignTeknisiId,
      };
      if (selectedWO.jenisPekerjaan === 'penyelesaian_laporan') {
        if (selectedWO.idLaporan) newInput.idLaporan = selectedWO.idLaporan;
      } else {
        newInput.idKoneksiData = selectedWO.idKoneksiData;
      }

      const res = await srvBuatWorkOrder(token, newInput);
      if (res.errors?.length) throw new Error(res.errors[0].message);
      const r = (res.data as any)?.buatWorkOrder;
      if (r?.success === false) throw new Error(r.message || 'Gagal membuat WO pengganti');

      setDlgBuatPengganti(false);
      setReassignTeknisiId('');
      toast('WO pengganti berhasil dibuat');
      fetchData();
    } catch (e: any) {
      toast(e.message || 'Gagal', false);
    } finally {
      setMutating(false);
    }
  };

  // ─── Buat Work Order Handlers ────────────────────────────────────────────
  const JENIS_PEKERJAAN_OPTIONS = [
    { value: 'survei', label: 'Survei' },
    { value: 'rab', label: 'RAB' },
    { value: 'pemasangan', label: 'Pemasangan' },
    { value: 'pengawasan_pemasangan', label: 'Pengawasan Pemasangan' },
    {
      value: 'pengawasan_setelah_pemasangan',
      label: 'Pengawasan Setelah Pemasangan',
    },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'penyelesaian_laporan', label: 'Penyelesaian Laporan' },
  ];

  const handleOpenBuat = async () => {
    setBuatForm({
      idKoneksiData: null,
      jenisPekerjaan: '',
      teknisiPenanggungJawab: null,
      idLaporan: null,
    });
    setPrerequisiteMsg(null);
    setLoadingDropdowns(true);
    setDlgBuat(true);
    const token = localStorage.getItem('admin_token') || '';
    try {
      // Koneksi data sudah dimuat via Apollo useQuery di level komponen
      // Fetch teknisi dari teknisi GraphQL server
      const teknisiRes = await getTeknisiUsers(token);
      if (teknisiRes.errors?.length) {
        toast(`Gagal memuat teknisi: ${teknisiRes.errors[0].message}`, false);
        return;
      }
      const allTeknisi: any[] = (teknisiRes.data as any)?.users ?? [];
      setTeknisiList(
        allTeknisi.filter(t => t.isActive && !t.pekerjaanSekarang)
      );
      setKoneksiList(allKoneksiData);
    } catch (err: any) {
      console.error('[handleOpenBuat]', err);
      toast('Gagal memuat data dropdown', false);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleCheckPrereq = async (
    idKoneksiData: string,
    jenisPekerjaan: string
  ) => {
    if (!jenisPekerjaan) return;
    if (!idKoneksiData && jenisPekerjaan !== 'penyelesaian_laporan') return;
    const token = localStorage.getItem('admin_token') || '';
    setCheckingPrereq(true);
    setPrerequisiteMsg(null);
    try {
      const res = await cekPrerequisitePekerjaan(
        token,
        idKoneksiData || '',
        jenisPekerjaan
      );
      // Boolean!: true = boleh, false = tidak boleh
      const allowed: boolean | null =
        (res?.data as any)?.cekPrerequisitePekerjaan ?? null;
      setPrerequisiteMsg(allowed);
    } catch {
      /* silent */
    } finally {
      setCheckingPrereq(false);
    }
  };

  const handleBuatWorkOrder = () => {
    const token = localStorage.getItem('admin_token') || '';
    const { idKoneksiData, jenisPekerjaan, teknisiPenanggungJawab, idLaporan } = buatForm;
    if (!jenisPekerjaan || !teknisiPenanggungJawab) return;
    if (!idKoneksiData && jenisPekerjaan !== 'penyelesaian_laporan') return;
    setBuatLoading(true);
    runMutation(
      () =>
        srvBuatWorkOrder(token, {
          idKoneksiData: idKoneksiData?._id || '',
          jenisPekerjaan,
          teknisiPenanggungJawab: teknisiPenanggungJawab?.id,
          ...(jenisPekerjaan === 'penyelesaian_laporan' && idLaporan?._id
            ? { idLaporan: idLaporan._id }
            : {}),
        }),
      'Work order berhasil dibuat',
      () => {
        setDlgBuat(false);
        setBuatLoading(false);
      }
    );
  };

  const acts = selectedWO
    ? woActions(selectedWO)
    : { needsTim: false, needsPenolakan: false, needsHasil: false, canBuatPengganti: false };

  if (authLoading || !isAuthenticated) return null;

  const detailWO = detailFull || selectedWO;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout title='Manajemen Work Order'>
      <Box sx={{ mb: 3 }}>
        {/* Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant='h5' fontWeight={700}>
            Manajemen Work Order
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleOpenBuat}
              size='small'
            >
              Buat WO
            </Button>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={fetchData}
              disabled={loading}
              size='small'
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            Gagal memuat: {error}
          </Alert>
        )}

        {/* ─── Summary Cards ─────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: 'Total WO',
              value: counts.total,
              icon: <Build />,
              color: '#013494',
            },
            {
              label: 'Ditugaskan',
              value: counts.ditugaskan,
              icon: <Schedule />,
              color: '#013494',
            },
            {
              label: 'Dikerjakan',
              value: counts.dikerjakan,
              icon: <Build />,
              color: '#ed6c02',
            },
            {
              label: 'Selesai',
              value: counts.selesai,
              icon: <CheckCircle />,
              color: '#2e7d32',
            },
            {
              label: 'Perlu Review',
              value: counts.perluReview,
              icon: <HourglassEmpty />,
              color: counts.perluReview > 0 ? '#d32f2f' : '#9e9e9e',
            },
          ].map(s => (
            <Grid item xs={6} md={2.4} key={s.label}>
              <Card
                variant='outlined'
                sx={{
                  borderRadius: 2,
                  borderColor:
                    s.value > 0 && s.label === 'Perlu Review'
                      ? 'error.main'
                      : 'divider',
                }}
              >
                <CardContent
                  sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: s.color,
                        width: 36,
                        height: 36,
                        fontSize: 18,
                      }}
                    >
                      {s.icon}
                    </Avatar>
                    <Box>
                      <Typography
                        variant='h5'
                        fontWeight={700}
                        lineHeight={1.2}
                      >
                        {s.value}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {s.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ─── Filter ────────────────────────────────────────────────────── */}
        <Card variant='outlined' sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1.5} alignItems='center'>
              {/* Search */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Cari pelanggan, teknisi, atau ID WO...'
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search fontSize='small' />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Filter Jenis */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Jenis WO</InputLabel>
                  <Select value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setPage(1); }} label='Jenis WO'>
                    <MenuItem value='all'>Semua Jenis</MenuItem>
                    <Divider />
                    <MenuItem value='survei'>Survei</MenuItem>
                    <MenuItem value='rab'>RAB</MenuItem>
                    <MenuItem value='pemasangan'>Pemasangan</MenuItem>
                    <MenuItem value='pengawasan_pemasangan'>Pengawasan Pasang</MenuItem>
                    <MenuItem value='pengawasan_setelah_pemasangan'>Pengawasan Setelah</MenuItem>
                    <MenuItem value='penyelesaian_laporan'>Penyelesaian Laporan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Filter Status WO */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status WO</InputLabel>
                  <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} label='Status WO'>
                    <MenuItem value='all'>Semua Status</MenuItem>
                    <Divider />
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Filter Respon Teknisi */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Respon</InputLabel>
                  <Select value={filterRespon} onChange={e => { setFilterRespon(e.target.value); setPage(1); }} label='Respon'>
                    <MenuItem value='all'>Semua Respon</MenuItem>
                    <Divider />
                    <MenuItem value='menunggu'>Menunggu</MenuItem>
                    <MenuItem value='diterima'>Diterima</MenuItem>
                    <MenuItem value='penolakan_diajukan'>Penolakan Diajukan</MenuItem>
                    <MenuItem value='penolakan_diterima'>Penolakan Diterima</MenuItem>
                    <MenuItem value='penolakan_ditolak'>Penolakan Ditolak</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Filter Penanggung Jawab */}
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Cari teknisi...'
                  value={filterTeknisi}
                  onChange={e => { setFilterTeknisi(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Person fontSize='small' />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Reset */}
              <Grid item xs={12} sm={12} md='auto'>
                <Tooltip title='Reset semua filter'>
                  <IconButton
                    size='small'
                    onClick={() => { setSearch(''); setFilterStatus('all'); setFilterJenis('all'); setFilterRespon('all'); setFilterTeknisi(''); setPage(1); }}
                    disabled={!search && filterStatus === 'all' && filterJenis === 'all' && filterRespon === 'all' && !filterTeknisi}
                  >
                    <Refresh fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Active filter chips */}
            {(filterStatus !== 'all' || filterJenis !== 'all' || filterRespon !== 'all' || filterTeknisi) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {filterJenis !== 'all' && (
                  <Chip size='small' label={`Jenis: ${filterJenis.replace(/_/g, ' ')}`} onDelete={() => setFilterJenis('all')} />
                )}
                {filterStatus !== 'all' && (
                  <Chip size='small' label={`Status: ${STATUS_LABELS[filterStatus] ?? filterStatus}`} onDelete={() => setFilterStatus('all')} />
                )}
                {filterRespon !== 'all' && (
                  <Chip size='small' label={`Respon: ${filterRespon.replace(/_/g, ' ')}`} onDelete={() => setFilterRespon('all')} />
                )}
                {filterTeknisi && (
                  <Chip size='small' label={`Teknisi: ${filterTeknisi}`} onDelete={() => setFilterTeknisi('')} />
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ─── Table ─────────────────────────────────────────────────────── */}
        <Card variant='outlined' sx={{ borderRadius: 2 }}>
          {loading ? (
            <TableSkeleton rows={6} cols={9} />
          ) : (
            <>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size='small' sx={{ minWidth: 900 }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 44 }}>
                        No
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Pelanggan
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>
                        Jenis
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 150 }}>
                        Penanggung Jawab
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 150 }}>
                        Tim Teknisi
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, width: 120 }}
                        align='center'
                      >
                        Status WO
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, width: 130 }}
                        align='center'
                      >
                        Respon Teknisi
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 90 }}>
                        Dibuat
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, width: 56 }}
                        align='center'
                      >
                        Aksi
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ border: 0, py: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1, color: 'text.secondary' }}>
                            <Typography variant='h6' fontWeight={600} color='text.secondary'>Belum ada work order</Typography>
                            <Typography variant='body2' color='text.disabled'>Buat work order baru untuk menugaskan teknisi</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((wo, idx) => {
                        const { needsTim, needsPenolakan, needsHasil, canBuatPengganti } =
                          woActions(wo);
                        const needsAction =
                          needsTim || needsPenolakan || needsHasil || canBuatPengganti;
                        const hasPenolakan =
                          wo.statusRespon === 'penolakan_diajukan' ||
                          wo.statusRespon === 'penolakan_diterima';

                        return (
                          <TableRow
                            key={wo.id}
                            hover
                            sx={{
                              bgcolor: needsAction
                                ? 'rgba(255, 152, 0, 0.06)'
                                : undefined,
                              borderLeft: needsAction
                                ? '3px solid'
                                : '3px solid transparent',
                              borderLeftColor: needsAction
                                ? 'warning.main'
                                : 'transparent',
                            }}
                          >
                            <TableCell>
                              {needsAction ? (
                                <Tooltip title='Perlu tindakan admin' arrow>
                                  <Badge
                                    color='warning'
                                    variant='dot'
                                    sx={{
                                      '& .MuiBadge-dot': { top: -2, right: -2 },
                                    }}
                                  >
                                    <Typography
                                      variant='body2'
                                      fontWeight={600}
                                    >
                                      {(page - 1) * PER_PAGE + idx + 1}
                                    </Typography>
                                  </Badge>
                                </Tooltip>
                              ) : (
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {(page - 1) * PER_PAGE + idx + 1}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              {(() => {
                                const nama = wo.koneksiData?.pelanggan?.namaLengkap
                                  || (wo.idLaporan && laporanById[wo.idLaporan]?.idPengguna?.namaLengkap)
                                  || null;
                                if (nama) {
                                  return (
                                    <Box>
                                      <Typography variant='body2' fontWeight={600} noWrap>{nama}</Typography>
                                      {wo.idLaporan && laporanById[wo.idLaporan]?.namaLaporan && (
                                        <Typography variant='caption' color='text.secondary' noWrap>
                                          {laporanById[wo.idLaporan].namaLaporan}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                }
                                if (wo.idLaporan) {
                                  return (
                                    <Box>
                                      <Typography variant='caption' color='text.secondary'>Laporan:</Typography>
                                      <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                        …{wo.idLaporan.slice(-10)}
                                      </Typography>
                                    </Box>
                                  );
                                }
                                return (
                                  <Typography variant='caption' color='text.disabled'>—</Typography>
                                );
                              })()}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={
                                  wo.jenisPekerjaan?.replace(/_/g, ' ') || '—'
                                }
                                size='small'
                                color='primary'
                                variant='outlined'
                                sx={{ fontSize: 11 }}
                              />
                            </TableCell>

                            <TableCell>
                              <Typography variant='body2' noWrap>
                                {wo.teknisiPenanggungJawab?.namaLengkap || '—'}
                              </Typography>
                              {wo.teknisiPenanggungJawab?.divisi && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  noWrap
                                  sx={{ display: 'block' }}
                                >
                                  {wo.teknisiPenanggungJawab.divisi}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Tim Teknisi */}
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {wo.tim?.length > 0 ? (
                                  <Tooltip
                                    title={wo.tim.map((t: any) => `${t.namaLengkap}${t.divisi ? ` (${t.divisi})` : ''}`).join(' • ')}
                                    arrow
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'default', width: 'fit-content' }}>
                                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 10, borderWidth: 1 } }}>
                                        {wo.tim.map((t: any) => (
                                          <Avatar key={t.id} sx={{ bgcolor: 'primary.main', width: 22, height: 22, fontSize: 10 }}>
                                            {t.namaLengkap?.[0]?.toUpperCase()}
                                          </Avatar>
                                        ))}
                                      </AvatarGroup>
                                      <Typography variant='caption' color='text.secondary'>
                                        {wo.tim.length} org
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                ) : (
                                  <Typography variant='caption' color='text.disabled' fontStyle='italic'>
                                    Belum ada tim
                                  </Typography>
                                )}
                                {wo.statusTim && wo.statusTim !== 'belum_diajukan' && (
                                  <Chip
                                    size='small'
                                    label={TIM_LABELS[wo.statusTim]}
                                    color={TIM_COLORS[wo.statusTim]}
                                    icon={wo.statusTim === 'diajukan' ? <HourglassEmpty sx={{ fontSize: '12px !important' }} /> : undefined}
                                    sx={{ fontSize: 10, height: 20, alignSelf: 'flex-start' }}
                                  />
                                )}
                              </Box>
                            </TableCell>

                            {/* Status WO */}
                            <TableCell align='center'>
                              <Chip
                                icon={getStatusIcon(wo.status)}
                                label={STATUS_LABELS[wo.status] || wo.status}
                                color={STATUS_COLORS[wo.status] || 'default'}
                                size='small'
                                sx={{ fontSize: 11 }}
                              />
                            </TableCell>

                            {/* Respon Teknisi */}
                            <TableCell align='center'>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                {wo.statusRespon ? (
                                  <Chip
                                    size='small'
                                    label={RESPON_LABELS[wo.statusRespon] || wo.statusRespon}
                                    color={RESPON_COLORS[wo.statusRespon] || 'default'}
                                    sx={{ fontSize: 11 }}
                                  />
                                ) : (
                                  <Typography variant='caption' color='text.disabled'>—</Typography>
                                )}
                                {hasPenolakan && wo.alasanPenolakan && (
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    color='warning'
                                    startIcon={<InfoOutlined sx={{ fontSize: '12px !important' }} />}
                                    sx={{ fontSize: 10, py: 0.25, px: 0.75, minHeight: 0, lineHeight: 1.4 }}
                                    onClick={() => { setSelectedWO(wo); setDlgAlasan(wo.alasanPenolakan); }}
                                  >
                                    Lihat Alasan
                                  </Button>
                                )}
                                {needsPenolakan && (
                                  <Button
                                    size='small'
                                    variant='contained'
                                    color='warning'
                                    sx={{ fontSize: 10, py: 0.25, px: 0.75, minHeight: 0, lineHeight: 1.4 }}
                                    onClick={() => { setSelectedWO(wo); openAction('penolakan', true); }}
                                  >
                                    Review Penolakan
                                  </Button>
                                )}
                                {canBuatPengganti && (
                                  <Button
                                    size='small'
                                    variant='contained'
                                    color='info'
                                    startIcon={<Person sx={{ fontSize: '12px !important' }} />}
                                    sx={{ fontSize: 10, py: 0.25, px: 0.75, minHeight: 0, lineHeight: 1.4 }}
                                    onClick={() => { setSelectedWO(wo); openBuatPengganti(); }}
                                  >
                                    Re-assign
                                  </Button>
                                )}
                              </Box>
                            </TableCell>

                            {/* Dibuat */}
                            <TableCell>
                              <Typography variant='caption' color='text.secondary'>
                                {fmtDate(wo.createdAt)}
                              </Typography>
                            </TableCell>

                            {/* Aksi */}
                            <TableCell align='center'>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <IconButton
                                  size='small'
                                  onClick={e => {
                                    setMenuAnchor(e.currentTarget);
                                    setSelectedWO(wo);
                                  }}
                                >
                                  <MoreVert fontSize='small' />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                    color='primary'
                    size='small'
                  />
                </Box>
              )}
            </>
          )}
        </Card>
      </Box>

      {/* ─── Context Menu ────────────────────────────────────────────────────── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        PaperProps={{ elevation: 2, sx: { minWidth: 210, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            router.push(`/operations/work-orders/${selectedWO?.id}`);
          }}
        >
          <Visibility sx={{ mr: 1.5 }} fontSize='small' color='action' /> Lihat
          Detail
        </MenuItem>

        {acts.needsTim && <Divider sx={{ my: 0.5 }} />}
        {acts.needsTim && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography
              variant='caption'
              color='warning.dark'
              sx={{ px: 1, fontWeight: 600 }}
            >
              Review Tim Teknisi
            </Typography>
          </Box>
        )}
        {acts.needsTim && (
          <MenuItem
            onClick={() => openAction('tim', true)}
            sx={{ color: 'success.dark' }}
          >
            <Group sx={{ mr: 1.5 }} fontSize='small' /> Setujui Komposisi Tim
          </MenuItem>
        )}
        {acts.needsTim && (
          <MenuItem
            onClick={() => openAction('tim', false)}
            sx={{ color: 'error.main' }}
          >
            <Block sx={{ mr: 1.5 }} fontSize='small' /> Tolak Tim & Minta Revisi
          </MenuItem>
        )}

        {acts.needsPenolakan && <Divider sx={{ my: 0.5 }} />}
        {acts.needsPenolakan && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography
              variant='caption'
              color='error.dark'
              sx={{ px: 1, fontWeight: 600 }}
            >
              Teknisi Mengajukan Penolakan
            </Typography>
          </Box>
        )}
        {acts.needsPenolakan && (
          <MenuItem
            onClick={() => openAction('penolakan', true)}
            sx={{ color: 'warning.dark' }}
          >
            <CheckCircle sx={{ mr: 1.5 }} fontSize='small' /> Terima Penolakan
          </MenuItem>
        )}
        {acts.needsPenolakan && (
          <MenuItem
            onClick={() => openAction('penolakan', false)}
            sx={{ color: 'error.main' }}
          >
            <Cancel sx={{ mr: 1.5 }} fontSize='small' /> Tolak — Teknisi Tetap
            Kerjakan
          </MenuItem>
        )}

        {acts.canBuatPengganti && <Divider sx={{ my: 0.5 }} />}
        {acts.canBuatPengganti && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography
              variant='caption'
              color='warning.dark'
              sx={{ px: 1, fontWeight: 600 }}
            >
              Penolakan Diterima — Perlu Teknisi Baru
            </Typography>
          </Box>
        )}
        {acts.canBuatPengganti && (
          <MenuItem onClick={openBuatPengganti} sx={{ color: 'warning.dark' }}>
            <Add sx={{ mr: 1.5 }} fontSize='small' /> Buat WO Pengganti
          </MenuItem>
        )}

        {acts.needsHasil && <Divider sx={{ my: 0.5 }} />}
        {acts.needsHasil && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography
              variant='caption'
              color='info.dark'
              sx={{ px: 1, fontWeight: 600 }}
            >
              Review Hasil Pekerjaan
            </Typography>
          </Box>
        )}
        {acts.needsHasil && (
          <MenuItem
            onClick={() => openAction('hasil', true)}
            sx={{ color: 'success.dark' }}
          >
            <ThumbUp sx={{ mr: 1.5 }} fontSize='small' /> Setujui Hasil
          </MenuItem>
        )}
        {acts.needsHasil && (
          <MenuItem
            onClick={() => openAction('hasil', false)}
            sx={{ color: 'error.main' }}
          >
            <ThumbDown sx={{ mr: 1.5 }} fontSize='small' /> Tolak & Minta Revisi
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => openAction('cancel')}
          disabled={
            !selectedWO ||
            ['dibatalkan', 'selesai'].includes(selectedWO?.status)
          }
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1.5 }} fontSize='small' /> Batalkan WO
        </MenuItem>
      </Menu>

      {/* ─── Detail Dialog (with Tabs) ────────────────────────────────────────── */}
      <Dialog
        open={dlgDetail}
        onClose={() => setDlgDetail(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle sx={{ pb: 0 }}>
          Detail Work Order
          {detailWO && (
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              #{detailWO.id?.slice(-6)}
            </Typography>
          )}
        </DialogTitle>
        <Tabs
          value={detailTab}
          onChange={(_, v) => setDetailTab(v)}
          sx={{ px: 3 }}
        >
          <Tab
            label='Info'
            icon={<InfoOutlined />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            label='Progres'
            icon={<Timeline />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            label='Laporan'
            icon={<Description />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
          <Tab
            label='Workflow'
            icon={<Timeline />}
            iconPosition='start'
            sx={{ minHeight: 48 }}
          />
        </Tabs>
        <DialogContent dividers>
          {loadingDetail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Tab 0: Info */}
          {detailTab === 0 &&
            detailWO &&
            (() => {
              const { needsTim, needsPenolakan, needsHasil } =
                woActions(detailWO);
              return (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                >
                  {(needsTim || needsPenolakan || needsHasil) && (
                    <Alert severity='warning' sx={{ py: 0.5 }}>
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
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Pelanggan
                      </Typography>
                      <Typography variant='body2' fontWeight={600}>
                        {detailWO.koneksiData?.pelanggan?.namaLengkap || detailWO.pelangganLaporan?.namaLengkap || '—'}
                      </Typography>
                      {(detailWO.koneksiData?.pelanggan?.noHp || detailWO.pelangganLaporan?.noHp) && (
                        <Typography variant='caption' color='text.secondary'>
                          {detailWO.koneksiData?.pelanggan?.noHp || detailWO.pelangganLaporan?.noHp}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Alamat
                      </Typography>
                      <Typography variant='body2'>
                        {detailWO.koneksiData?.alamat || '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Jenis Pekerjaan
                      </Typography>
                      <Chip
                        label={
                          detailWO.jenisPekerjaan?.replace(/_/g, ' ') || '—'
                        }
                        size='small'
                        color='primary'
                        variant='outlined'
                        sx={{ display: 'block', width: 'fit-content', mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Status WO
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          icon={getStatusIcon(detailWO.status)}
                          label={
                            STATUS_LABELS[detailWO.status] || detailWO.status
                          }
                          color={STATUS_COLORS[detailWO.status] || 'default'}
                          size='small'
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Penanggung Jawab
                      </Typography>
                      <Typography variant='body2'>
                        {detailWO.teknisiPenanggungJawab?.namaLengkap || '—'}
                      </Typography>
                      {detailWO.teknisiPenanggungJawab?.divisi && (
                        <Typography variant='caption' color='text.secondary'>
                          {detailWO.teknisiPenanggungJawab.divisi}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Respon Teknisi
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          size='small'
                          label={
                            RESPON_LABELS[detailWO.statusRespon] ||
                            detailWO.statusRespon ||
                            '—'
                          }
                          color={
                            RESPON_COLORS[detailWO.statusRespon] || 'default'
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='caption' color='text.secondary'>
                        Tim Teknisi
                      </Typography>
                      {detailWO.tim?.length > 0 ? (
                        <Stack
                          direction='row'
                          flexWrap='wrap'
                          gap={0.5}
                          sx={{ mt: 0.5 }}
                        >
                          {detailWO.tim.map((t: any) => (
                            <Chip
                              key={t.id}
                              size='small'
                              icon={<Person fontSize='small' />}
                              label={`${t.namaLengkap}${t.divisi ? ` · ${t.divisi}` : ''}`}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 0.5 }}
                        >
                          Belum ada anggota tim
                        </Typography>
                      )}
                    </Grid>
                    {detailWO.alasanPenolakan && (
                      <Grid item xs={12}>
                        <Alert severity='warning' sx={{ py: 0.5 }}>
                          <strong>Alasan penolakan teknisi:</strong>{' '}
                          {detailWO.alasanPenolakan}
                        </Alert>
                      </Grid>
                    )}
                    {detailWO.catatanReview && (
                      <Grid item xs={12}>
                        <Alert severity='info' sx={{ py: 0.5 }}>
                          <strong>Catatan review terakhir:</strong>{' '}
                          {detailWO.catatanReview}
                        </Alert>
                      </Grid>
                    )}
                    {detailWO.catatanReviewPenolakan && (
                      <Grid item xs={12}>
                        <Alert severity='info' sx={{ py: 0.5 }}>
                          <strong>Catatan review penolakan:</strong>{' '}
                          {detailWO.catatanReviewPenolakan}
                        </Alert>
                      </Grid>
                    )}

                    {/* Riwayat Respon */}
                    {detailWO.riwayatRespon?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                        >
                          Riwayat Respon
                        </Typography>
                        <List dense disablePadding>
                          {detailWO.riwayatRespon.map((r: any, i: number) => (
                            <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <Person fontSize='small' color='action' />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant='body2'>
                                    <strong>{r.oleh || '—'}</strong> — {r.aksi}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    {r.alasan && <span>{r.alasan} · </span>}
                                    {fmtDateTime(r.tanggal)}
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {/* Riwayat Review */}
                    {detailWO.riwayatReview?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          fontWeight={600}
                        >
                          Riwayat Review
                        </Typography>
                        <List dense disablePadding>
                          {detailWO.riwayatReview.map((r: any, i: number) => (
                            <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircle fontSize='small' color='action' />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant='body2'>
                                    <strong>{r.oleh || '—'}</strong> —{' '}
                                    {r.status}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    {r.catatan && <span>{r.catatan} · </span>}
                                    {fmtDateTime(r.tanggal)}
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Dibuat
                      </Typography>
                      <Typography variant='body2'>
                        {fmtDateTime(detailWO.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Diperbarui
                      </Typography>
                      <Typography variant='body2'>
                        {fmtDateTime(detailWO.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              );
            })()}

          {/* Tab 1: Progres */}
          {detailTab === 1 && (
            <Box>
              {progres.length === 0 ? (
                <Typography
                  color='text.secondary'
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  Belum ada progres
                </Typography>
              ) : (
                <List dense>
                  {progres.map((p: any) => (
                    <ListItem
                      key={p.id}
                      sx={{ alignItems: 'flex-start', py: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        <Timeline fontSize='small' color='primary' />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant='body2'>
                            {p.catatan || 'Tanpa catatan'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {fmtDateTime(p.createdAt)}
                            </Typography>
                            {p.foto &&
                              (Array.isArray(p.foto) ? p.foto : [p.foto])
                                .length > 0 && (
                                <Stack direction='row' gap={1} sx={{ mt: 1 }}>
                                  {(Array.isArray(p.foto)
                                    ? p.foto
                                    : [p.foto]
                                  ).map((url: string, i: number) => (
                                    <Box
                                      key={i}
                                      component='img'
                                      src={url}
                                      alt={`foto-${i}`}
                                      sx={{
                                        width: 80,
                                        height: 80,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    />
                                  ))}
                                </Stack>
                              )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Tab 2: Laporan */}
          {detailTab === 2 && (
            <Box>
              {laporan.length === 0 ? (
                <Typography
                  color='text.secondary'
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  Belum ada laporan
                </Typography>
              ) : (
                <List dense>
                  {laporan.map((l: any) => (
                    <ListItem
                      key={l.id}
                      sx={{ alignItems: 'flex-start', py: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        <Description fontSize='small' color='info' />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant='body2'>
                            {l.catatan || 'Tanpa catatan'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {fmtDateTime(l.createdAt)}
                            </Typography>
                            {l.foto &&
                              (Array.isArray(l.foto) ? l.foto : [l.foto])
                                .length > 0 && (
                                <Stack direction='row' gap={1} sx={{ mt: 1 }}>
                                  {(Array.isArray(l.foto)
                                    ? l.foto
                                    : [l.foto]
                                  ).map((url: string, i: number) => (
                                    <Box
                                      key={i}
                                      component='img'
                                      src={url}
                                      alt={`foto-${i}`}
                                      sx={{
                                        width: 80,
                                        height: 80,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    />
                                  ))}
                                </Stack>
                              )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Tab 3: Workflow Chain */}
          {detailTab === 3 && (
            <Box>
              {workflow.length === 0 ? (
                <Typography
                  color='text.secondary'
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  Tidak ada data workflow
                </Typography>
              ) : (
                <List dense>
                  {workflow.map((w: any, i: number) => (
                    <ListItem key={i} sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 12,
                            bgcolor: w.workOrder ? 'primary.main' : 'grey.300',
                          }}
                        >
                          {i + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant='body2' fontWeight={600}>
                            {w.jenisPekerjaan?.replace(/_/g, ' ')}
                          </Typography>
                        }
                        secondary={
                          w.workOrder ? (
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                size='small'
                                label={
                                  STATUS_LABELS[w.workOrder.status] ||
                                  w.workOrder.status
                                }
                                color={
                                  STATUS_COLORS[w.workOrder.status] || 'default'
                                }
                                sx={{ fontSize: 10 }}
                              />
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {fmtDate(w.workOrder.createdAt)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant='caption'
                              color='text.disabled'
                              fontStyle='italic'
                            >
                              Belum dibuat
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
          {acts.needsTim && (
            <>
              <Button
                size='small'
                color='success'
                variant='contained'
                startIcon={<Group />}
                onClick={() => {
                  setDlgDetail(false);
                  openAction('tim', true);
                }}
              >
                Setujui Tim
              </Button>
              <Button
                size='small'
                color='error'
                variant='outlined'
                startIcon={<Block />}
                onClick={() => {
                  setDlgDetail(false);
                  openAction('tim', false);
                }}
              >
                Tolak Tim
              </Button>
            </>
          )}
          {acts.needsPenolakan && (
            <>
              <Button
                size='small'
                color='warning'
                variant='contained'
                onClick={() => {
                  setDlgDetail(false);
                  openAction('penolakan', true);
                }}
              >
                Terima Penolakan
              </Button>
              <Button
                size='small'
                color='error'
                variant='outlined'
                onClick={() => {
                  setDlgDetail(false);
                  openAction('penolakan', false);
                }}
              >
                Tolak Penolakan
              </Button>
            </>
          )}
          {acts.needsHasil && (
            <>
              <Button
                size='small'
                color='success'
                variant='contained'
                startIcon={<ThumbUp />}
                onClick={() => {
                  setDlgDetail(false);
                  openAction('hasil', true);
                }}
              >
                Setujui Hasil
              </Button>
              <Button
                size='small'
                color='error'
                variant='outlined'
                startIcon={<ThumbDown />}
                onClick={() => {
                  setDlgDetail(false);
                  openAction('hasil', false);
                }}
              >
                Tolak Hasil
              </Button>
            </>
          )}
          <Button size='small' onClick={() => setDlgDetail(false)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Tim Dialog ────────────────────────────────────────────────── */}
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
          {selectedWO?.tim?.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary' gutterBottom>
                Tim yang diajukan:
              </Typography>
              {selectedWO.tim.map((t: any) => (
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

      {/* ─── Review Penolakan Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={dlgPenolakan}
        onClose={() => !mutating && setDlgPenolakan(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {actionApprove
            ? 'Terima Penolakan & Tugaskan Teknisi Pengganti'
            : 'Tolak Penolakan — Wajib Dikerjakan'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {selectedWO?.alasanPenolakan && (
              <Alert severity='warning' sx={{ py: 0.5 }}>
                <strong>Alasan penolakan teknisi:</strong>{' '}
                {selectedWO.alasanPenolakan}
              </Alert>
            )}

            {actionApprove ? (
              <>
                <Alert severity='info' sx={{ py: 0.5 }}>
                  Penolakan akan diterima dan work order baru akan dibuat
                  otomatis untuk teknisi pengganti yang Anda pilih.
                </Alert>

                {loadingReassignTeknisi ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant='body2' color='text.secondary'>
                      Memuat daftar teknisi…
                    </Typography>
                  </Box>
                ) : (
                  <Autocomplete
                    options={reassignTeknisiList}
                    getOptionLabel={(opt: any) =>
                      `${opt.namaLengkap} — ${opt.divisi ?? ''}`
                    }
                    value={
                      reassignTeknisiList.find(
                        t => t.id === reassignTeknisiId
                      ) ?? null
                    }
                    onChange={(_e, val) =>
                      setReassignTeknisiId(val?.id ?? '')
                    }
                    isOptionEqualToValue={(opt: any, val: any) =>
                      opt.id === val?.id
                    }
                    getOptionDisabled={(opt: any) =>
                      opt.id === selectedWO?.teknisiPenanggungJawab?.id
                    }
                    renderOption={(props, opt: any) => (
                      <Box component='li' {...props}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 12,
                            mr: 1.5,
                            bgcolor:
                              opt.id ===
                              selectedWO?.teknisiPenanggungJawab?.id
                                ? 'grey.400'
                                : 'primary.main',
                          }}
                        >
                          {opt.namaLengkap?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight={600}>
                            {opt.namaLengkap}
                            {opt.id ===
                              selectedWO?.teknisiPenanggungJawab?.id &&
                              ' (teknisi sebelumnya)'}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                          >
                            {opt.divisi} · NIP {opt.nip}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size='small'
                        label='Teknisi Pengganti *'
                        error={!reassignTeknisiId && mutating}
                        helperText={
                          reassignTeknisiList.length === 0 &&
                          !loadingReassignTeknisi
                            ? 'Tidak ada teknisi aktif'
                            : ''
                        }
                      />
                    )}
                    noOptionsText='Tidak ada teknisi aktif'
                  />
                )}
              </>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Alasan penolakan tidak diterima. Teknisi tetap harus
                menjalankan work order ini.
              </Typography>
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              size='small'
              label='Catatan keputusan (opsional)'
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              disabled={mutating}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDlgPenolakan(false)}
            size='small'
            disabled={mutating}
          >
            Batal
          </Button>
          <Button
            variant='contained'
            color={actionApprove ? 'warning' : 'error'}
            size='small'
            onClick={handleReviewPenolakan}
            disabled={
              mutating ||
              (actionApprove &&
                (!reassignTeknisiId || loadingReassignTeknisi))
            }
            startIcon={mutating ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {mutating
              ? actionApprove
                ? 'Memproses…'
                : 'Menyimpan…'
              : actionApprove
                ? 'Terima & Buat WO Baru'
                : 'Tolak Penolakan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Hasil Dialog ─────────────────────────────────────────────── */}
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

      {/* ─── Batalkan Dialog ─────────────────────────────────────────────────── */}
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

      {/* ─── Dialog: Buat WO Pengganti ───────────────────────────────────────────── */}
      <Dialog
        open={dlgBuatPengganti}
        onClose={() => !mutating && setDlgBuatPengganti(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Buat Work Order Pengganti
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {selectedWO && (
              <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant='caption' color='text.secondary'>
                  WO yang akan digantikan
                </Typography>
                <Typography variant='body2' fontWeight={600}>
                  {selectedWO.jenisPekerjaan?.replace(/_/g, ' ')}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Pelanggan: {selectedWO.koneksiData?.pelanggan?.namaLengkap || selectedWO.pelangganLaporan?.namaLengkap || '—'}
                </Typography>
                {selectedWO.alasanPenolakan && (
                  <Alert severity='warning' sx={{ mt: 1, py: 0.5 }}>
                    <strong>Alasan penolakan sebelumnya:</strong>{' '}
                    {selectedWO.alasanPenolakan}
                  </Alert>
                )}
              </Box>
            )}

            <Alert severity='info' sx={{ py: 0.5 }}>
              WO baru akan dibuat dengan jenis pekerjaan yang sama. WO lama
              (status penolakan diterima) akan otomatis dibatalkan.
            </Alert>

            {loadingReassignTeknisi ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant='body2' color='text.secondary'>
                  Memuat daftar teknisi…
                </Typography>
              </Box>
            ) : (
              <Autocomplete
                options={reassignTeknisiList}
                getOptionLabel={(opt: any) =>
                  `${opt.namaLengkap} — ${opt.divisi ?? ''}`
                }
                value={reassignTeknisiList.find(t => t.id === reassignTeknisiId) ?? null}
                onChange={(_e, val) => setReassignTeknisiId(val?.id ?? '')}
                isOptionEqualToValue={(opt: any, val: any) => opt.id === val?.id}
                getOptionDisabled={(opt: any) =>
                  opt.id === selectedWO?.teknisiPenanggungJawab?.id
                }
                renderOption={(props, opt: any) => (
                  <Box component='li' {...props}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, mr: 1.5, bgcolor: opt.id === selectedWO?.teknisiPenanggungJawab?.id ? 'grey.400' : 'success.main' }}>
                      {opt.namaLengkap?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant='body2' fontWeight={600}>
                        {opt.namaLengkap}
                        {opt.id === selectedWO?.teknisiPenanggungJawab?.id && ' (teknisi sebelumnya)'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {opt.divisi} · NIP {opt.nip}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={params => (
                  <TextField {...params} size='small' label='Teknisi Pengganti *' />
                )}
                noOptionsText='Tidak ada teknisi aktif'
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgBuatPengganti(false)} size='small' disabled={mutating}>
            Batal
          </Button>
          <Button
            variant='contained'
            color='warning'
            size='small'
            onClick={handleBuatWOPengganti}
            disabled={mutating || !reassignTeknisiId || loadingReassignTeknisi}
            startIcon={mutating ? <CircularProgress size={14} color='inherit' /> : <Add />}
          >
            {mutating ? 'Membuat…' : 'Buat WO Pengganti'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Dialog: Alasan Penolakan ────────────────────────────────────────────── */}
      <Dialog open={Boolean(dlgAlasan)} onClose={() => setDlgAlasan('')} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color='warning' fontSize='small' />
          Alasan Penolakan Teknisi
        </DialogTitle>
        <DialogContent>
          {selectedWO && (
            <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>Work Order</Typography>
              <Typography variant='body2' fontWeight={600}>
                {selectedWO.jenisPekerjaan?.replace(/_/g, ' ')} —{' '}
                {selectedWO.teknisiPenanggungJawab?.namaLengkap || '—'}
              </Typography>
            </Box>
          )}
          <Alert severity='warning' sx={{ py: 1 }}>
            <Typography variant='body2'>{dlgAlasan}</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button size='small' onClick={() => setDlgAlasan('')}>Tutup</Button>
          {selectedWO && woActions(selectedWO).needsPenolakan && (
            <Button
              size='small'
              variant='contained'
              color='warning'
              onClick={() => { setDlgAlasan(''); openAction('penolakan', true); }}
            >
              Review Penolakan
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ──────────────────────────────────────────────────────────── */}
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

      {/* ─── Dialog: Buat Work Order ───────────────────────────────────────────── */}
      <Dialog
        open={dlgBuat}
        onClose={() => setDlgBuat(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Buat Work Order Baru</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}
        >
          {loadingDropdowns && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Jenis Pekerjaan */}
          <TextField
            select
            fullWidth
            size='small'
            label='Jenis Pekerjaan'
            value={buatForm.jenisPekerjaan}
            onChange={e => {
              const val = e.target.value;
              setBuatForm(f => ({
                ...f,
                jenisPekerjaan: val,
                idKoneksiData: null,
                idLaporan: null,
              }));
              setPrerequisiteMsg(null);
              if (val === 'penyelesaian_laporan') {
                handleCheckPrereq('', val);
              }
            }}
          >
            {JENIS_PEKERJAAN_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Koneksi Data — hidden for penyelesaian_laporan */}
          {buatForm.jenisPekerjaan &&
            buatForm.jenisPekerjaan !== 'penyelesaian_laporan' && (
              <Autocomplete
                options={allKoneksiData}
                loading={koneksiQueryLoading || loadingDropdowns}
                getOptionLabel={(opt: any) =>
                  `${opt.Alamat || ''} — ${opt.IdPelanggan?.namaLengkap || ''}`
                }
                value={buatForm.idKoneksiData}
                onChange={(_e, val) => {
                  setBuatForm(f => ({ ...f, idKoneksiData: val }));
                  setPrerequisiteMsg(null);
                  if (val && buatForm.jenisPekerjaan) {
                    handleCheckPrereq(val._id, buatForm.jenisPekerjaan);
                  }
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    size='small'
                    label='Koneksi Data (Pelanggan)'
                  />
                )}
                isOptionEqualToValue={(opt: any, val: any) =>
                  opt._id === val?._id
                }
              />
            )}

          {/* Laporan selector — hanya tampil untuk penyelesaian_laporan */}
          {buatForm.jenisPekerjaan === 'penyelesaian_laporan' && (
            <Autocomplete
              options={allLaporan}
              getOptionLabel={(opt: any) =>
                `${opt.namaLaporan || opt.masalah || ''} — ${opt.idPengguna?.namaLengkap || opt.alamat || ''}`
              }
              value={buatForm.idLaporan}
              onChange={(_e, val) =>
                setBuatForm(f => ({ ...f, idLaporan: val }))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  size='small'
                  label='Laporan Pelanggan'
                  placeholder='Pilih laporan yang akan diselesaikan'
                />
              )}
              isOptionEqualToValue={(opt: any, val: any) =>
                opt._id === val?._id
              }
              noOptionsText='Tidak ada laporan tersedia'
            />
          )}

          {/* Prerequisite indicator */}
          {checkingPrereq && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} />
              <Typography variant='caption' color='text.secondary'>
                Memeriksa prerequisite…
              </Typography>
            </Box>
          )}
          {!checkingPrereq && prerequisiteMsg !== null && (
            <Alert
              severity={prerequisiteMsg === true ? 'success' : 'error'}
              sx={{ py: 0.5 }}
            >
              {prerequisiteMsg === true
                ? 'Prerequisite terpenuhi ✓'
                : 'Prerequisite belum terpenuhi — pekerjaan sebelumnya belum selesai'}
            </Alert>
          )}

          {/* Teknisi Penanggung Jawab */}
          <Autocomplete
            options={teknisiList}
            loading={loadingDropdowns}
            getOptionLabel={(opt: any) => `${opt.namaLengkap} — ${opt.nip}`}
            value={buatForm.teknisiPenanggungJawab}
            onChange={(_e, val) =>
              setBuatForm(f => ({ ...f, teknisiPenanggungJawab: val }))
            }
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Teknisi Penanggung Jawab (tersedia)'
              />
            )}
            isOptionEqualToValue={(opt: any, val: any) => opt.id === val?.id}
            noOptionsText='Tidak ada teknisi yang tersedia'
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDlgBuat(false)}
            size='small'
            disabled={buatLoading}
          >
            Batal
          </Button>
          <Button
            variant='contained'
            size='small'
            onClick={handleBuatWorkOrder}
            disabled={
              buatLoading ||
              !buatForm.jenisPekerjaan ||
              !buatForm.teknisiPenanggungJawab ||
              (buatForm.jenisPekerjaan !== 'penyelesaian_laporan' &&
                !buatForm.idKoneksiData) ||
              (buatForm.jenisPekerjaan === 'penyelesaian_laporan' &&
                !buatForm.idLaporan) ||
              prerequisiteMsg === false
            }
          >
            {buatLoading ? <CircularProgress size={16} /> : 'Buat Work Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
