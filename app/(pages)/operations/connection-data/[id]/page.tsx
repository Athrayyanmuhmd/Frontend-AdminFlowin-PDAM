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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
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
  Visibility,
  RadioButtonUnchecked,
  Person,
  Assignment,
  AccountBalance,
  Payment,
  ElectricMeter,
  Build,
  VerifiedUser,
  GroupAdd,
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
import { GET_METERAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/meteran';
import { GET_PEMASANGAN_BY_KONEKSI_DATA } from '../../../../../lib/graphql/queries/pemasangan';
import { GET_ALL_TEKNISI } from '../../../../../lib/graphql/queries/technicians';
import { AKTIVASI_PELANGGAN, ASSIGN_TEKNISI_SURVEI, ASSIGN_TEKNISI_RAB } from '../../../../../lib/graphql/mutations/survei';

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

const APPROVE_WORK_ORDER = gql`
  mutation ApproveWorkOrder($id: ID!, $disetujui: Boolean!, $catatan: String) {
    approveWorkOrder(id: $id, disetujui: $disetujui, catatan: $catatan) {
      _id
      disetujui
      catatan
      status
      updatedAt
    }
  }
`;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

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
  const [aktivasiDone, setAktivasiDone] = useState(false);

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  // Dialogs
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [tolakDialogOpen, setTolakDialogOpen] = useState(false);
  const [alasanPenolakanInput, setAlasanPenolakanInput] = useState('');

  // WO approval dialog
  const [woApprovalDialogOpen, setWoApprovalDialogOpen] = useState(false);
  const [woApprovalType, setWoApprovalType] = useState<'survei' | 'rab' | null>(null);
  const [woApprovalValue, setWoApprovalValue] = useState(true);
  const [woApprovalCatatan, setWoApprovalCatatan] = useState('');

  // WO assign teknisi dialog (inline — no navigate away)
  const [woAssignDialogOpen, setWoAssignDialogOpen] = useState(false);
  const [woAssignType, setWoAssignType] = useState<'survei' | 'rab' | null>(null);
  const [woAssignSelected, setWoAssignSelected] = useState<string[]>([]);

  // ─── GraphQL queries ─────────────────────────────────────────────────────
  const { connectionData: graphqlData, loading: graphqlLoading, error: graphqlError, refetch } = useGetConnectionData(id);

  const { data: surveiResult, refetch: refetchSurvei } = useQuery(GET_SURVEI_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const survei = (surveiResult as any)?.getSurveiByKoneksiData ?? null;

  const { data: rabResult, refetch: refetchRAB } = useQuery(GET_RAB_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const rab = (rabResult as any)?.getRABByKoneksiData ?? null;

  const { data: woSurveiResult, refetch: refetchWOSurvei } = useQuery(GET_WO_BY_SURVEI, {
    variables: { surveiId: survei?._id },
    fetchPolicy: 'network-only',
    skip: !survei?._id,
  });
  const woSurvei = (woSurveiResult as any)?.getWOBySurvei ?? null;

  const { data: woRabResult, refetch: refetchWORAB } = useQuery(GET_WO_BY_RAB, {
    variables: { rabId: rab?._id },
    fetchPolicy: 'network-only',
    skip: !rab?._id,
  });
  const woRab = (woRabResult as any)?.getWOByRAB ?? null;

  const { data: meteranResult, refetch: refetchMeteran } = useQuery(GET_METERAN_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const meteran = (meteranResult as any)?.getMeteranByKoneksiData ?? null;

  const { data: pemasanganResult } = useQuery(GET_PEMASANGAN_BY_KONEKSI_DATA, {
    variables: { idKoneksiData: id },
    fetchPolicy: 'network-only',
    skip: !id,
  });
  const pemasangan = (pemasanganResult as any)?.getPemasanganByKoneksiData ?? null;

  const { data: teknisiListResult } = useQuery(GET_ALL_TEKNISI, {
    fetchPolicy: 'network-only',
    skip: !woAssignDialogOpen,
  });
  const allTeknisi = (teknisiListResult as any)?.getAllTeknisi ?? [];

  // ─── Mutations ───────────────────────────────────────────────────────────
  const [verifyKoneksiData] = useMutation(VERIFY_KONEKSI_DATA);
  const [approveWorkOrder] = useMutation(APPROVE_WORK_ORDER);
  const [aktivasiPelanggan] = useMutation(AKTIVASI_PELANGGAN);
  const [assignTeknisiSurvei] = useMutation(ASSIGN_TEKNISI_SURVEI);
  const [assignTeknisiRAB] = useMutation(ASSIGN_TEKNISI_RAB);

  // ─── Transform GraphQL data ───────────────────────────────────────────────
  useEffect(() => {
    if (graphqlData) {
      setData({
        _id: graphqlData._id,
        userId: graphqlData.idPelanggan
          ? {
              _id: graphqlData.idPelanggan._id,
              namaLengkap: graphqlData.idPelanggan.namaLengkap,
              email: graphqlData.idPelanggan.email,
              noHP: graphqlData.idPelanggan.noHP,
            }
          : null,
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
        catatan: graphqlData.catatan ?? null,
        alasanPenolakan: graphqlData.alasanPenolakan ?? null,
        tanggalVerifikasi: graphqlData.tanggalVerifikasi ?? null,
        isVerifiedByData: graphqlData.statusVerifikasi === 'Disetujui',
        isVerifiedByTechnician: false,
        isAllProcedureDone: false,
        surveiId: null,
        rabConnectionId: null,
        catatanTeknisi: null,
        tanggalVerifikasiTeknisi: null,
        assignedTechnicianId: graphqlData.idTeknisi
          ? {
              _id: graphqlData.idTeknisi._id,
              namaLengkap: graphqlData.idTeknisi.namaLengkap,
              email: graphqlData.idTeknisi.email,
              noHP: graphqlData.idTeknisi.noHP,
            }
          : null,
        assignedAt: graphqlData.assignedAt ?? null,
        assignedBy: graphqlData.assignedBy
          ? {
              _id: graphqlData.assignedBy._id,
              namaLengkap: graphqlData.assignedBy.namaLengkap,
              email: graphqlData.assignedBy.email,
            }
          : null,
        createdAt: graphqlData.createdAt,
        updatedAt: graphqlData.updatedAt,
      } as ConnectionData);
    }
  }, [graphqlData]);

  useEffect(() => { if (graphqlError) setError(graphqlError.message); }, [graphqlError]);
  useEffect(() => { setLoading(graphqlLoading); }, [graphqlLoading]);

  // ─── Step conditions ──────────────────────────────────────────────────────
  const step1Done = data?.statusVerifikasi === 'Disetujui';
  const step2Done = !!data?.assignedTechnicianId;
  const step3Done = woSurvei?.disetujui === true;
  const step4Done = woRab?.disetujui === true;
  const step5Done = rab?.statusPembayaran === 'Settlement';
  const step6Done = !!meteran;
  const step7Done = pemasangan?.statusVerifikasi === 'Disetujui';
  const step8Done = aktivasiDone || (meteran?.statusAktif === true);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleVerifyAdmin = async () => {
    if (!data) return;
    setActionLoading(true);
    setError('');
    try {
      await verifyKoneksiData({
        variables: { id: data._id, status: 'Disetujui', catatan: 'Diverifikasi oleh Admin' },
      });
      setSuccess('Dokumen berhasil diverifikasi');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan verifikasi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTolak = async () => {
    if (!data || !alasanPenolakanInput.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await verifyKoneksiData({
        variables: { id: data._id, status: 'Ditolak', alasanPenolakan: alasanPenolakanInput.trim() },
      });
      setSuccess('Pengajuan berhasil ditolak');
      setTolakDialogOpen(false);
      setAlasanPenolakanInput('');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Gagal menolak pengajuan');
    } finally {
      setActionLoading(false);
    }
  };

  const openWoApprovalDialog = (type: 'survei' | 'rab', approve: boolean) => {
    setWoApprovalType(type);
    setWoApprovalValue(approve);
    setWoApprovalCatatan('');
    setWoApprovalDialogOpen(true);
  };

  const handleApproveWO = async () => {
    const woId = woApprovalType === 'survei' ? woSurvei?._id : woRab?._id;
    if (!woId) return;
    setActionLoading(true);
    setError('');
    try {
      await approveWorkOrder({
        variables: { id: woId, disetujui: woApprovalValue, catatan: woApprovalCatatan || null },
      });
      setSuccess(`Work order ${woApprovalValue ? 'disetujui' : 'ditolak'}`);
      setWoApprovalDialogOpen(false);
      if (woApprovalType === 'survei') refetchWOSurvei();
      else refetchWORAB();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses WO');
    } finally {
      setActionLoading(false);
    }
  };

  const openWoAssignDialog = (type: 'survei' | 'rab') => {
    setWoAssignType(type);
    setWoAssignSelected([]);
    setWoAssignDialogOpen(true);
  };

  const handleToggleTeknisi = (id: string) => {
    setWoAssignSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssignWO = async () => {
    if (!woAssignSelected.length) return;
    setActionLoading(true);
    setError('');
    try {
      if (woAssignType === 'survei' && survei?._id) {
        await assignTeknisiSurvei({
          variables: { surveiId: survei._id, teknisiIds: woAssignSelected },
        });
        refetchWOSurvei();
      } else if (woAssignType === 'rab' && rab?._id) {
        await assignTeknisiRAB({
          variables: { rabId: rab._id, teknisiIds: woAssignSelected },
        });
        refetchWORAB();
      }
      setSuccess('Teknisi berhasil ditugaskan ke work order');
      setWoAssignDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal assign teknisi ke WO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAktivasi = async () => {
    if (!data) return;
    setActionLoading(true);
    setError('');
    try {
      await aktivasiPelanggan({ variables: { koneksiDataId: data._id } });
      setSuccess('Pelanggan berhasil diaktifkan! Sambungan air sekarang aktif.');
      setAktivasiDone(true);
      refetchMeteran();
    } catch (err: any) {
      setError(err.message || 'Gagal mengaktifkan pelanggan');
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

  // ─── Loading / Error states ───────────────────────────────────────────────
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
          <Alert severity="error">Data tidak ditemukan</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4">Detail Data Sambungan</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.nik ? `NIK: ${data.nik}` : 'Data Sambungan'}
            </Typography>
          </Box>
          {step8Done ? (
            <Chip label="Aktif" color="success" icon={<VerifiedUser />} />
          ) : data.statusVerifikasi === 'Ditolak' ? (
            <Chip label="Ditolak" color="error" icon={<Cancel />} />
          ) : (
            <Chip label="Sedang Diproses" color="warning" icon={<HourglassEmpty />} />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* ─── STEPPER ─────────────────────────────────────────────────── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Alur Pengajuan Sambungan Air</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Setiap tahap harus selesai sebelum tahap berikutnya dapat dimulai.
            </Typography>

            <Stepper orientation="vertical" nonLinear>

              {/* Step 1 — Verifikasi Dokumen Admin */}
              <Step active={!step1Done && data.statusVerifikasi !== 'Ditolak'} completed={step1Done}>
                <StepLabel icon={
                  step1Done ? <CheckCircle color="success" /> :
                  data.statusVerifikasi === 'Ditolak' ? <Cancel color="error" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description fontSize="small" />
                    <Typography fontWeight={600}>Verifikasi Dokumen Admin</Typography>
                    <Chip size="small"
                      label={step1Done ? 'Disetujui' : data.statusVerifikasi === 'Ditolak' ? 'Ditolak' : 'Menunggu Verifikasi'}
                      color={step1Done ? 'success' : data.statusVerifikasi === 'Ditolak' ? 'error' : 'warning'}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Admin memeriksa kelengkapan dan keabsahan dokumen (KTP, KK, IMB).
                  </Typography>
                  {data.statusVerifikasi === 'Menunggu' && userRole === 'admin' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size="small" variant="contained" color="success"
                        startIcon={actionLoading ? <CircularProgress size={14} /> : <CheckCircle />}
                        onClick={handleVerifyAdmin} disabled={actionLoading}>
                        Setujui Dokumen
                      </Button>
                      <Button size="small" variant="outlined" color="error"
                        startIcon={<Cancel />} onClick={() => setTolakDialogOpen(true)} disabled={actionLoading}>
                        Tolak
                      </Button>
                    </Box>
                  )}
                  {data.statusVerifikasi === 'Ditolak' && data.alasanPenolakan && (
                    <Alert severity="error" sx={{ mt: 1 }}>Alasan penolakan: {data.alasanPenolakan}</Alert>
                  )}
                  {step1Done && data.tanggalVerifikasi && (
                    <Typography variant="caption" color="text.secondary">
                      Diverifikasi: {new Date(data.tanggalVerifikasi).toLocaleString('id-ID')}
                    </Typography>
                  )}
                </StepContent>
              </Step>

              {/* Step 2 — Penugasan Teknisi Survei */}
              <Step active={step1Done && !step2Done} completed={step2Done}>
                <StepLabel icon={
                  !step1Done ? <RadioButtonUnchecked color="disabled" /> :
                  step2Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    <Typography fontWeight={600} color={!step1Done ? 'text.disabled' : 'text.primary'}>
                      Penugasan Teknisi Survei
                    </Typography>
                    {step2Done && (
                      <Chip size="small" label={data.assignedTechnicianId?.namaLengkap || 'Ditugaskan'} color="success" />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step1Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Admin menugaskan teknisi untuk melakukan survei lapangan ke lokasi pelanggan.
                      </Typography>
                      {step2Done ? (
                        <Box>
                          <Typography variant="body2">
                            <strong>Teknisi:</strong> {data.assignedTechnicianId?.namaLengkap}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {data.assignedTechnicianId?.email} · {data.assignedTechnicianId?.noHP}
                          </Typography>
                          {userRole === 'admin' && (
                            <Button size="small" variant="text" sx={{ mt: 0.5 }}
                              onClick={() => setAssignDialogOpen(true)}>
                              Ganti Teknisi
                            </Button>
                          )}
                        </Box>
                      ) : userRole === 'admin' ? (
                        <Button size="small" variant="contained" startIcon={<Person />}
                          onClick={() => setAssignDialogOpen(true)}>
                          Tugaskan Teknisi Survei
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Menunggu admin menugaskan teknisi.
                        </Typography>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 3 — Survei Lapangan */}
              <Step active={step2Done && !step3Done} completed={step3Done}>
                <StepLabel icon={
                  !step2Done ? <RadioButtonUnchecked color="disabled" /> :
                  step3Done ? <CheckCircle color="success" /> :
                  woSurvei?.disetujui === false ? <Cancel color="error" /> :
                  survei ? <HourglassEmpty color="info" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment fontSize="small" />
                    <Typography fontWeight={600} color={!step2Done ? 'text.disabled' : 'text.primary'}>
                      Survei Lapangan
                    </Typography>
                    {step2Done && (
                      <Chip size="small"
                        label={
                          step3Done ? 'WO Disetujui' :
                          woSurvei?.disetujui === false ? 'WO Ditolak' :
                          woSurvei ? 'Menunggu Persetujuan WO' :
                          survei ? 'Data Survei Ada' :
                          'Belum Ada Data Survei'
                        }
                        color={step3Done ? 'success' : woSurvei?.disetujui === false ? 'error' : survei ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step2Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi melakukan survei lapangan dan mengisi data survei. Admin membuat work order, lalu mereview dan menyetujuinya.
                      </Typography>

                      {/* No survei yet */}
                      {!survei && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                            Menunggu data survei dari teknisi ({data.assignedTechnicianId?.namaLengkap}).
                          </Typography>
                          {userRole === 'admin' && (
                            <Button size="small" variant="outlined" startIcon={<Assignment />}
                              onClick={() => router.push(`/operations/survey-data/create?connectionId=${data._id}`)}>
                              Input Data Survei
                            </Button>
                          )}
                        </Box>
                      )}

                      {/* Survei exists */}
                      {survei && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Data survei sudah ada.{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/survey-data/${survei._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>

                          {/* No WO yet — assign teknisi inline */}
                          {!woSurvei && userRole === 'admin' && (
                            <Button size="small" variant="contained" startIcon={<GroupAdd />}
                              onClick={() => openWoAssignDialog('survei')} sx={{ mr: 1 }}>
                              Buat WO & Tugaskan Teknisi
                            </Button>
                          )}

                          {/* WO exists, pending approval */}
                          {woSurvei && !step3Done && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Teknisi WO:</strong>{' '}
                                {woSurvei.tim?.map((t: any) => t.namaLengkap).join(', ') || '—'}
                              </Typography>
                              {userRole === 'admin' && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Button size="small" variant="contained" color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => openWoApprovalDialog('survei', true)}>
                                    Setujui WO
                                  </Button>
                                  <Button size="small" variant="outlined" color="error"
                                    startIcon={<Cancel />}
                                    onClick={() => openWoApprovalDialog('survei', false)}>
                                    Tolak WO
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* WO approved */}
                          {step3Done && (
                            <Typography variant="body2" color="success.main">
                              ✓ Work order survei telah disetujui
                            </Typography>
                          )}

                          {woSurvei?.catatan && (
                            <Alert severity={woSurvei.disetujui === false ? 'error' : 'info'} sx={{ mt: 1 }}>
                              Catatan WO: {woSurvei.catatan}
                            </Alert>
                          )}
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
                  woRab?.disetujui === false ? <Cancel color="error" /> :
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
                        label={
                          step4Done ? 'WO Disetujui' :
                          woRab?.disetujui === false ? 'WO Ditolak' :
                          woRab ? 'Menunggu Persetujuan WO' :
                          rab ? 'RAB Ada' :
                          'Belum Ada RAB'
                        }
                        color={step4Done ? 'success' : woRab?.disetujui === false ? 'error' : rab ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step3Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi membuat dokumen DED dan Rancangan Anggaran Biaya (RAB). Admin membuat work order lalu mereview dan menyetujuinya.
                      </Typography>

                      {/* No RAB yet */}
                      {!rab && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Menunggu teknisi membuat dokumen DED dan RAB.
                          </Typography>
                          {userRole === 'admin' && (
                            <Button size="small" variant="outlined" startIcon={<AccountBalance />}
                              onClick={() => router.push(`/operations/rab-connection/create?connectionId=${data._id}`)}>
                              Buat RAB
                            </Button>
                          )}
                        </Box>
                      )}

                      {/* RAB exists */}
                      {rab && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total Biaya RAB:</strong> {formatRupiah(rab.totalBiaya)}{' '}
                            <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textDecoration: 'underline' }}
                              onClick={() => router.push(`/operations/rab-connection/${rab._id}`)}>
                              Lihat detail
                            </Button>
                          </Typography>

                          {/* No WO yet — assign inline */}
                          {!woRab && userRole === 'admin' && (
                            <Button size="small" variant="contained" startIcon={<GroupAdd />}
                              onClick={() => openWoAssignDialog('rab')} sx={{ mr: 1 }}>
                              Buat WO & Tugaskan Teknisi
                            </Button>
                          )}

                          {/* WO pending approval */}
                          {woRab && !step4Done && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Teknisi WO:</strong>{' '}
                                {woRab.tim?.map((t: any) => t.namaLengkap).join(', ') || '—'}
                              </Typography>
                              {userRole === 'admin' && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Button size="small" variant="contained" color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={() => openWoApprovalDialog('rab', true)}>
                                    Setujui WO
                                  </Button>
                                  <Button size="small" variant="outlined" color="error"
                                    startIcon={<Cancel />}
                                    onClick={() => openWoApprovalDialog('rab', false)}>
                                    Tolak WO
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* WO approved */}
                          {step4Done && (
                            <Typography variant="body2" color="success.main">
                              ✓ Work order RAB telah disetujui
                            </Typography>
                          )}

                          {woRab?.catatan && (
                            <Alert severity={woRab.disetujui === false ? 'error' : 'info'} sx={{ mt: 1 }}>
                              Catatan WO: {woRab.catatan}
                            </Alert>
                          )}
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
                        Pelanggan melakukan pembayaran biaya pemasangan sesuai RAB yang telah disetujui melalui aplikasi.
                        Status akan otomatis diperbarui setelah konfirmasi payment gateway.
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

              {/* Step 6 — Pendaftaran Meteran */}
              <Step active={step5Done && !step6Done} completed={step6Done}>
                <StepLabel icon={
                  !step5Done ? <RadioButtonUnchecked color="disabled" /> :
                  step6Done ? <CheckCircle color="success" /> :
                  <HourglassEmpty color="warning" />
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ElectricMeter fontSize="small" />
                    <Typography fontWeight={600} color={!step5Done ? 'text.disabled' : 'text.primary'}>
                      Pendaftaran Meteran (Penerbitan ID Pelanggan)
                    </Typography>
                    {step6Done && <Chip size="small" label={`No. ${meteran.nomorMeteran}`} color="success" />}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step5Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Admin mendaftarkan meteran baru untuk pelanggan dan menerbitkan nomor akun (ID) resmi.
                      </Typography>
                      {step6Done ? (
                        <Box>
                          <Typography variant="body2"><strong>Nomor Meteran:</strong> {meteran.nomorMeteran}</Typography>
                          <Typography variant="body2"><strong>Nomor Akun:</strong> {meteran.nomorAkun}</Typography>
                          <Typography variant="body2"><strong>Kelompok:</strong> {meteran.idKelompokPelanggan?.namaKelompok || '—'}</Typography>
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

              {/* Step 7 — Pemasangan Meteran */}
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
                      Pemasangan & Pengawasan Meteran
                    </Typography>
                    {step6Done && (
                      <Chip size="small"
                        label={step7Done ? 'Terverifikasi' : pemasangan ? `Status: ${pemasangan.statusVerifikasi}` : 'Belum Dipasang'}
                        color={step7Done ? 'success' : pemasangan ? 'info' : 'warning'}
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  {step6Done && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Teknisi melakukan pemasangan meteran di lokasi. Admin dan supervisor melakukan pengawasan, lalu memverifikasi hasilnya.
                      </Typography>
                      {pemasangan ? (
                        <Box>
                          <Typography variant="body2"><strong>Teknisi:</strong> {pemasangan.teknisiId?.namaLengkap || '—'}</Typography>
                          <Typography variant="body2"><strong>Seri Meteran:</strong> {pemasangan.seriMeteran}</Typography>
                          {pemasangan.tanggalPemasangan && (
                            <Typography variant="body2">
                              <strong>Tanggal:</strong> {new Date(pemasangan.tanggalPemasangan).toLocaleDateString('id-ID')}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button size="small" variant="outlined"
                              onClick={() => router.push(`/operations/pemasangan`)}>
                              Halaman Pemasangan
                            </Button>
                            <Button size="small" variant="outlined"
                              onClick={() => router.push(`/operations/pengawasan-pemasangan`)}>
                              Halaman Pengawasan
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Menunggu teknisi melakukan pemasangan meteran fisik.
                          </Typography>
                          <Button size="small" variant="outlined"
                            onClick={() => router.push(`/operations/pemasangan`)}>
                            Halaman Pemasangan
                          </Button>
                        </Box>
                      )}
                    </>
                  )}
                </StepContent>
              </Step>

              {/* Step 8 — Aktivasi Pelanggan */}
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
                        Admin mengaktifkan akun pelanggan dan meteran. Pelanggan akan mendapat notifikasi bahwa sambungan air sudah aktif.
                      </Typography>
                      {step8Done ? (
                        <Alert severity="success">
                          Sambungan air pelanggan telah aktif. Meteran <strong>{meteran?.nomorMeteran}</strong> sudah berjalan.
                        </Alert>
                      ) : userRole === 'admin' ? (
                        <Button variant="contained" color="success"
                          startIcon={actionLoading ? <CircularProgress size={20} /> : <VerifiedUser />}
                          onClick={handleAktivasi} disabled={actionLoading}>
                          Aktivasi Pelanggan
                        </Button>
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

        {/* ─── Info Pelanggan ───────────────────────────────────────────── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Pelanggan</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Nama Lengkap', value: data.userId?.namaLengkap },
                { label: 'Email', value: data.userId?.email },
                { label: 'Nomor HP', value: data.userId?.noHP },
                { label: 'NIK', value: data.nik },
                { label: 'Nomor KK', value: data.noKK },
              ].map(({ label, value }) => (
                <Grid item xs={12} md={6} key={label}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body1">{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Info Properti ────────────────────────────────────────────── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Properti</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Alamat Lengkap</Typography>
                <Typography variant="body1">{data.alamat}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Kelurahan</Typography>
                <Typography variant="body1">{data.kelurahan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Kecamatan</Typography>
                <Typography variant="body1">{data.kecamatan}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Luas Bangunan</Typography>
                <Typography variant="body1">{data.luasBangunan} m²</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Dokumen ──────────────────────────────────────────────────── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Dokumen Pengajuan</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Foto KTP (NIK)', url: data.nikUrl },
                { label: 'Foto KK', url: data.kkUrl },
                { label: 'Foto IMB', url: data.imbUrl },
              ].map(({ label, url }) => (
                <Grid item xs={12} md={4} key={label}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Description sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" gutterBottom>{label}</Typography>
                    <Button size="small" variant="outlined" disabled={!url}
                      onClick={() => url && openDocumentViewer(url, label)}>
                      {url ? 'Lihat Dokumen' : 'Belum Upload'}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Timestamps ───────────────────────────────────────────────── */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Informasi Waktu</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Tanggal Pengajuan</Typography>
                <Typography variant="body1">
                  {data.createdAt ? new Date(data.createdAt).toLocaleString('id-ID') : '—'}
                </Typography>
              </Grid>
              {data.tanggalVerifikasi && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Tanggal Verifikasi Admin</Typography>
                  <Typography variant="body1">
                    {new Date(data.tanggalVerifikasi).toLocaleString('id-ID')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* ═══════════════ DIALOGS ═══════════════ */}

        {/* Tolak Dialog */}
        <Dialog open={tolakDialogOpen} onClose={() => setTolakDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tolak Pengajuan Sambungan Air</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Masukkan alasan penolakan untuk <strong>{data?.userId?.namaLengkap}</strong>.
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

        {/* WO Approval Dialog */}
        <Dialog open={woApprovalDialogOpen} onClose={() => setWoApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {woApprovalValue ? 'Setujui' : 'Tolak'} Work Order {woApprovalType === 'survei' ? 'Survei' : 'RAB'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {woApprovalValue
                ? 'Konfirmasi persetujuan. Proses akan berlanjut ke tahap berikutnya.'
                : 'Masukkan alasan penolakan work order.'}
            </Typography>
            <TextField fullWidth multiline rows={3}
              label={woApprovalValue ? 'Catatan (opsional)' : 'Alasan Penolakan *'}
              value={woApprovalCatatan}
              onChange={e => setWoApprovalCatatan(e.target.value)}
              required={!woApprovalValue}
              error={!woApprovalValue && !woApprovalCatatan.trim()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWoApprovalDialogOpen(false)}>Batal</Button>
            <Button variant="contained" color={woApprovalValue ? 'success' : 'error'}
              onClick={handleApproveWO}
              disabled={actionLoading || (!woApprovalValue && !woApprovalCatatan.trim())}
              startIcon={actionLoading ? <CircularProgress size={20} /> : woApprovalValue ? <CheckCircle /> : <Cancel />}>
              {woApprovalValue ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* WO Assign Teknisi Dialog */}
        <Dialog open={woAssignDialogOpen} onClose={() => setWoAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Tugaskan Teknisi ke Work Order {woAssignType === 'survei' ? 'Survei' : 'RAB'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pilih satu atau lebih teknisi yang akan menangani pekerjaan ini.
            </Typography>
            {allTeknisi.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {allTeknisi.map((t: any) => (
                  <ListItem key={t._id} disablePadding>
                    <ListItemButton onClick={() => handleToggleTeknisi(t._id)}>
                      <ListItemIcon>
                        <Checkbox edge="start" checked={woAssignSelected.includes(t._id)} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={t.namaLengkap}
                        secondary={`${t.divisi} · ${t.noHP}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWoAssignDialogOpen(false)}>Batal</Button>
            <Button variant="contained" onClick={handleAssignWO}
              disabled={actionLoading || woAssignSelected.length === 0}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <GroupAdd />}>
              Tugaskan ({woAssignSelected.length} dipilih)
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
              <img src={viewerImage} alt={viewerTitle}
                style={{ width: `${zoom}%`, height: 'auto', transition: 'width 0.3s ease' }} />
            </Box>
          </DialogContent>
        </Dialog>

        {/* Assign Technician Dialog (step 2 — KoneksiData) */}
        <AssignTechnicianDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          connectionDataId={data._id}
          currentTechnicianId={data.assignedTechnicianId?._id}
          currentTechnicianName={data.assignedTechnicianId?.namaLengkap}
          onSuccess={() => {
            setSuccess('Teknisi berhasil ditugaskan');
            refetch();
          }}
        />

      </Box>
    </AdminLayout>
  );
}
