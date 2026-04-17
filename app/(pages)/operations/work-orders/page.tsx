'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Grid, Card, CardContent, Typography, Box, Button, TextField,
  InputAdornment, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, Avatar, Pagination,
  CircularProgress, Alert, Divider, Snackbar, Stack, Tooltip,
  Badge,
} from '@mui/material';
import {
  Search, MoreVert, Visibility, Build, Schedule, CheckCircle,
  Warning, Error as ErrorIcon, Person, ThumbUp, ThumbDown,
  Cancel, Group, HourglassEmpty, Block, Refresh, InfoOutlined,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries/workOrder';
import { BATALKAN_WORK_ORDER, REVIEW_HASIL, REVIEW_TIM, REVIEW_PENOLAKAN } from '@/lib/graphql/mutations/workOrder';

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

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
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

const RESPON_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
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

const TIM_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  belum_diajukan: 'default',
  diajukan: 'warning',
  disetujui: 'success',
  ditolak: 'error',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFlexDate(v: string | number | null | undefined): Date | null {
  if (!v) return null;
  const n = typeof v === 'number' ? v : (/^\d+$/.test(String(v)) ? Number(v) : NaN);
  if (!isNaN(n)) return new Date(n);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}
const fmtDate = (v: string | number | null | undefined) => {
  const d = parseFlexDate(v);
  return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
};
const fmtDateTime = (v: string | number | null | undefined) => {
  const d = parseFlexDate(v);
  return d ? d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
};

function getStatusIcon(s: string) {
  if (s === 'selesai') return <CheckCircle fontSize="small" />;
  if (s === 'sedang_dikerjakan') return <Build fontSize="small" />;
  if (s === 'ditugaskan') return <Schedule fontSize="small" />;
  if (s === 'dibatalkan') return <ErrorIcon fontSize="small" />;
  if (s === 'dikirim') return <HourglassEmpty fontSize="small" />;
  return <Warning fontSize="small" />;
}

// Determines what actions are needed for a WO
function woActions(wo: any) {
  return {
    needsTim: wo.statusTim === 'diajukan',
    needsPenolakan: wo.statusRespon === 'penolakan_diajukan',
    needsHasil: wo.status === 'dikirim',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrderManagement() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  const [snackbar, setSnackbar] = useState({ open: false, msg: '', ok: true });
  const toast = (msg: string, ok = true) => setSnackbar({ open: true, msg, ok });

  // ─── Data ────────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useQuery(GET_WORK_ORDERS, { fetchPolicy: 'network-only' });
  const allWO: any[] = (data as any)?.workOrders?.data || [];

  // ─── Mutations ────────────────────────────────────────────────────────────
  const afterMutation = (msg: string, closeFn: () => void) => ({
    onCompleted: (d: any) => {
      const key = Object.keys(d || {})[0];
      const r = d?.[key];
      if (r?.success === false) { toast(r.message || 'Gagal', false); return; }
      refetch(); closeFn(); setCatatan(''); toast(msg);
    },
    onError: (e: any) => toast(e.message, false),
  });

  const [batalkan, { loading: cancelling }] = useMutation(BATALKAN_WORK_ORDER,
    afterMutation('Work order dibatalkan', () => setDlgCancel(false)));
  const [reviewTim, { loading: rvTim }] = useMutation(REVIEW_TIM,
    afterMutation(actionApprove ? 'Tim disetujui' : 'Tim ditolak', () => setDlgTim(false)));
  const [reviewPenolakan, { loading: rvPnlk }] = useMutation(REVIEW_PENOLAKAN,
    afterMutation(
      actionApprove ? 'Penolakan diterima — WO perlu di-reassign' : 'Penolakan ditolak — teknisi harus mengerjakan WO',
      () => setDlgPenolakan(false)
    ));
  const [reviewHasil, { loading: rvHasil }] = useMutation(REVIEW_HASIL,
    afterMutation(actionApprove ? 'Hasil disetujui' : 'Hasil ditolak — teknisi perlu revisi', () => setDlgHasil(false)));

  // ─── Filter ──────────────────────────────────────────────────────────────
  const filtered = allWO.filter(wo => {
    const name = wo.koneksiData?.pelanggan?.namaLengkap || '';
    return (filterStatus === 'all' || wo.status === filterStatus)
      && (!search || name.toLowerCase().includes(search.toLowerCase()));
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Summary counts
  const counts = {
    total: allWO.length,
    ditugaskan: allWO.filter(w => w.status === 'ditugaskan').length,
    dikerjakan: allWO.filter(w => w.status === 'sedang_dikerjakan').length,
    selesai: allWO.filter(w => w.status === 'selesai').length,
    perluReview: allWO.filter(w => w.statusTim === 'diajukan' || w.statusRespon === 'penolakan_diajukan' || w.status === 'dikirim').length,
  };

  // ─── Action helpers ──────────────────────────────────────────────────────
  const closeMenu = () => setMenuAnchor(null);

  const openAction = (dlg: 'detail' | 'cancel' | 'tim' | 'penolakan' | 'hasil', approve = true) => {
    closeMenu();
    setActionApprove(approve);
    setCatatan('');
    if (dlg === 'detail') setDlgDetail(true);
    else if (dlg === 'cancel') setDlgCancel(true);
    else if (dlg === 'tim') setDlgTim(true);
    else if (dlg === 'penolakan') setDlgPenolakan(true);
    else if (dlg === 'hasil') setDlgHasil(true);
  };

  const handleReviewTim = () =>
    reviewTim({ variables: { input: { workOrderId: selectedWO.id, disetujui: actionApprove, catatan: catatan || undefined } } });
  const handleReviewPenolakan = () =>
    reviewPenolakan({ variables: { input: { workOrderId: selectedWO.id, disetujui: actionApprove, catatan: catatan || undefined } } });
  const handleReviewHasil = () =>
    reviewHasil({ variables: { input: { workOrderId: selectedWO.id, disetujui: actionApprove, catatan: catatan || undefined } } });
  const handleBatalkan = () =>
    batalkan({ variables: { id: selectedWO.id, catatan } });

  // per-selected WO flags
  const acts = selectedWO ? woActions(selectedWO) : { needsTim: false, needsPenolakan: false, needsHasil: false };

  if (authLoading || !isAuthenticated) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Manajemen Work Order">
      <Box sx={{ mb: 3 }}>

        {/* Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Manajemen Work Order</Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} disabled={loading} size="small">
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Gagal memuat: {error.message}</Alert>}

        {/* ─── Summary Cards ─────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total WO',    value: counts.total,       icon: <Build />,         color: '#1976d2' },
            { label: 'Ditugaskan',  value: counts.ditugaskan,  icon: <Schedule />,      color: '#0288d1' },
            { label: 'Dikerjakan',  value: counts.dikerjakan,  icon: <Build />,         color: '#ed6c02' },
            { label: 'Selesai',     value: counts.selesai,     icon: <CheckCircle />,   color: '#2e7d32' },
            { label: 'Perlu Review',value: counts.perluReview, icon: <HourglassEmpty />,color: counts.perluReview > 0 ? '#d32f2f' : '#9e9e9e' },
          ].map(s => (
            <Grid item xs={6} md={2.4} key={s.label}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderColor: s.value > 0 && s.label === 'Perlu Review' ? 'error.main' : 'divider' }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: s.color, width: 36, height: 36, fontSize: 18 }}>{s.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ─── Filter ────────────────────────────────────────────────────── */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField fullWidth size="small" placeholder="Cari nama pelanggan..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} label="Status">
                    <MenuItem value="all">Semua Status</MenuItem>
                    <Divider />
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Table ─────────────────────────────────────────────────────── */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell width={44} sx={{ fontWeight: 600 }}>No</TableCell>
                      <TableCell width={180} sx={{ fontWeight: 600 }}>Pelanggan</TableCell>
                      <TableCell width={120} sx={{ fontWeight: 600 }}>Jenis</TableCell>
                      <TableCell width={150} sx={{ fontWeight: 600 }}>Penanggung Jawab</TableCell>
                      <TableCell width={180} sx={{ fontWeight: 600 }}>Tim Teknisi</TableCell>
                      <TableCell width={130} sx={{ fontWeight: 600 }} align="center">Status WO</TableCell>
                      <TableCell width={150} sx={{ fontWeight: 600 }} align="center">Respon Teknisi</TableCell>
                      <TableCell width={90} sx={{ fontWeight: 600 }}>Dibuat</TableCell>
                      <TableCell width={56} sx={{ fontWeight: 600 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">Tidak ada data</Typography>
                        </TableCell>
                      </TableRow>
                    ) : rows.map((wo, idx) => {
                      const { needsTim, needsPenolakan, needsHasil } = woActions(wo);
                      const needsAction = needsTim || needsPenolakan || needsHasil;
                      const hasPenolakan = wo.statusRespon === 'penolakan_diajukan' || wo.statusRespon === 'penolakan_diterima';

                      return (
                        <TableRow key={wo.id} hover
                          sx={{
                            bgcolor: needsAction ? 'rgba(255, 152, 0, 0.06)' : undefined,
                            borderLeft: needsAction ? '3px solid' : '3px solid transparent',
                            borderLeftColor: needsAction ? 'warning.main' : 'transparent',
                          }}
                        >
                          {/* No */}
                          <TableCell>
                            {needsAction ? (
                              <Tooltip title="Perlu tindakan admin" arrow>
                                <Badge color="warning" variant="dot" sx={{ '& .MuiBadge-dot': { top: -2, right: -2 } }}>
                                  <Typography variant="body2" fontWeight={600}>{(page - 1) * PER_PAGE + idx + 1}</Typography>
                                </Badge>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">{(page - 1) * PER_PAGE + idx + 1}</Typography>
                            )}
                          </TableCell>

                          {/* Pelanggan */}
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {wo.koneksiData?.pelanggan?.namaLengkap || (
                                <Typography component="span" variant="caption" color="text.disabled">—</Typography>
                              )}
                            </Typography>
                          </TableCell>

                          {/* Jenis */}
                          <TableCell>
                            <Chip
                              label={wo.jenisPekerjaan?.replace(/_/g, ' ') || '—'}
                              size="small" color="primary" variant="outlined"
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>

                          {/* Penanggung Jawab */}
                          <TableCell>
                            <Typography variant="body2" noWrap>{wo.teknisiPenanggungJawab?.namaLengkap || '—'}</Typography>
                            {wo.teknisiPenanggungJawab?.divisi && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {wo.teknisiPenanggungJawab.divisi}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Tim Teknisi */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {/* Anggota tim */}
                              {wo.tim && wo.tim.length > 0 ? (
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {wo.tim.map((t: any) => (
                                    <Chip key={t.id} label={t.namaLengkap} size="small"
                                      sx={{ fontSize: 11, height: 22 }} />
                                  ))}
                                </Stack>
                              ) : null}
                              {/* Status tim — hanya tampil jika bukan 'belum_diajukan' */}
                              {wo.statusTim && wo.statusTim !== 'belum_diajukan' ? (
                                <Chip
                                  size="small"
                                  label={TIM_LABELS[wo.statusTim]}
                                  color={TIM_COLORS[wo.statusTim]}
                                  icon={wo.statusTim === 'diajukan' ? <HourglassEmpty sx={{ fontSize: '14px !important' }} /> : undefined}
                                  sx={{ fontSize: 11, height: 22, alignSelf: 'flex-start' }}
                                />
                              ) : (
                                !wo.tim?.length ? (
                                  <Typography variant="caption" color="text.disabled" fontStyle="italic">Belum ada tim</Typography>
                                ) : null
                              )}
                            </Box>
                          </TableCell>

                          {/* Status WO */}
                          <TableCell align="center">
                            <Chip
                              icon={getStatusIcon(wo.status)}
                              label={STATUS_LABELS[wo.status] || wo.status}
                              color={STATUS_COLORS[wo.status] || 'default'}
                              size="small"
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>

                          {/* Respon Teknisi */}
                          <TableCell align="center">
                            {wo.statusRespon ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={RESPON_LABELS[wo.statusRespon] || wo.statusRespon}
                                  color={RESPON_COLORS[wo.statusRespon] || 'default'}
                                  sx={{ fontSize: 11 }}
                                />
                                {/* Tampilkan alasan hanya saat penolakan aktif/relevan */}
                                {hasPenolakan && wo.alasanPenolakan && (
                                  <Tooltip
                                    title={<Box><strong>Alasan penolakan:</strong><br />{wo.alasanPenolakan}</Box>}
                                    arrow placement="left"
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'help', color: 'warning.dark' }}>
                                      <InfoOutlined sx={{ fontSize: 13 }} />
                                      <Typography variant="caption" sx={{ fontSize: 11 }}>Lihat alasan</Typography>
                                    </Box>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Dibuat */}
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{fmtDate(wo.createdAt)}</Typography>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell align="center">
                            <IconButton size="small" onClick={e => { setMenuAnchor(e.currentTarget); setSelectedWO(wo); }}>
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" size="small" />
                </Box>
              )}
            </>
          )}
        </Card>
      </Box>

      {/* ─── Context Menu ────────────────────────────────────────────────────── */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
        PaperProps={{ elevation: 2, sx: { minWidth: 210, borderRadius: 2 } }}
      >
        <MenuItem onClick={() => openAction('detail')}>
          <Visibility sx={{ mr: 1.5 }} fontSize="small" color="action" /> Lihat Detail
        </MenuItem>

        {/* Review Tim — muncul saat statusTim === 'diajukan' */}
        {acts.needsTim && <Divider sx={{ my: 0.5 }} />}
        {acts.needsTim && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography variant="caption" color="warning.dark" sx={{ px: 1, fontWeight: 600 }}>Review Tim Teknisi</Typography>
          </Box>
        )}
        {acts.needsTim && (
          <MenuItem onClick={() => openAction('tim', true)} sx={{ color: 'success.dark' }}>
            <Group sx={{ mr: 1.5 }} fontSize="small" /> Setujui Komposisi Tim
          </MenuItem>
        )}
        {acts.needsTim && (
          <MenuItem onClick={() => openAction('tim', false)} sx={{ color: 'error.main' }}>
            <Block sx={{ mr: 1.5 }} fontSize="small" /> Tolak Tim & Minta Revisi
          </MenuItem>
        )}

        {/* Review Penolakan — muncul saat teknisi ajukan penolakan */}
        {acts.needsPenolakan && <Divider sx={{ my: 0.5 }} />}
        {acts.needsPenolakan && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography variant="caption" color="error.dark" sx={{ px: 1, fontWeight: 600 }}>Teknisi Mengajukan Penolakan</Typography>
          </Box>
        )}
        {acts.needsPenolakan && (
          <MenuItem onClick={() => openAction('penolakan', true)} sx={{ color: 'warning.dark' }}>
            <CheckCircle sx={{ mr: 1.5 }} fontSize="small" /> Terima Penolakan
          </MenuItem>
        )}
        {acts.needsPenolakan && (
          <MenuItem onClick={() => openAction('penolakan', false)} sx={{ color: 'error.main' }}>
            <Cancel sx={{ mr: 1.5 }} fontSize="small" /> Tolak — Teknisi Tetap Kerjakan
          </MenuItem>
        )}

        {/* Review Hasil — muncul saat teknisi submit hasil */}
        {acts.needsHasil && <Divider sx={{ my: 0.5 }} />}
        {acts.needsHasil && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <Typography variant="caption" color="info.dark" sx={{ px: 1, fontWeight: 600 }}>Review Hasil Pekerjaan</Typography>
          </Box>
        )}
        {acts.needsHasil && (
          <MenuItem onClick={() => openAction('hasil', true)} sx={{ color: 'success.dark' }}>
            <ThumbUp sx={{ mr: 1.5 }} fontSize="small" /> Setujui Hasil
          </MenuItem>
        )}
        {acts.needsHasil && (
          <MenuItem onClick={() => openAction('hasil', false)} sx={{ color: 'error.main' }}>
            <ThumbDown sx={{ mr: 1.5 }} fontSize="small" /> Tolak & Minta Revisi
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => openAction('cancel')}
          disabled={!selectedWO || ['dibatalkan', 'selesai'].includes(selectedWO?.status)}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1.5 }} fontSize="small" /> Batalkan WO
        </MenuItem>
      </Menu>

      {/* ─── Detail Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={dlgDetail} onClose={() => setDlgDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Detail Work Order</DialogTitle>
        <DialogContent dividers>
          {selectedWO && (() => {
            const { needsTim, needsPenolakan, needsHasil } = woActions(selectedWO);
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(needsTim || needsPenolakan || needsHasil) && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    {needsPenolakan && 'Teknisi mengajukan penolakan — perlu keputusan admin.'}
                    {needsTim && !needsPenolakan && 'Tim teknisi diajukan — menunggu persetujuan admin.'}
                    {needsHasil && !needsTim && !needsPenolakan && 'Teknisi sudah mengirim hasil — menunggu review admin.'}
                  </Alert>
                )}
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedWO.koneksiData?.pelanggan?.namaLengkap || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Alamat</Typography>
                    <Typography variant="body2">{selectedWO.koneksiData?.alamat || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Jenis Pekerjaan</Typography>
                    <Chip label={selectedWO.jenisPekerjaan?.replace(/_/g, ' ') || '—'} size="small" color="primary" variant="outlined" sx={{ display: 'block', width: 'fit-content', mt: 0.5 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Status WO</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip icon={getStatusIcon(selectedWO.status)} label={STATUS_LABELS[selectedWO.status] || selectedWO.status} color={STATUS_COLORS[selectedWO.status] || 'default'} size="small" />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Penanggung Jawab</Typography>
                    <Typography variant="body2">{selectedWO.teknisiPenanggungJawab?.namaLengkap || '—'}</Typography>
                    {selectedWO.teknisiPenanggungJawab?.divisi && (
                      <Typography variant="caption" color="text.secondary">{selectedWO.teknisiPenanggungJawab.divisi}</Typography>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Respon Teknisi</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip size="small" label={RESPON_LABELS[selectedWO.statusRespon] || selectedWO.statusRespon || '—'} color={RESPON_COLORS[selectedWO.statusRespon] || 'default'} />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Tim Teknisi</Typography>
                    {selectedWO.tim?.length > 0 ? (
                      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                        {selectedWO.tim.map((t: any) => (
                          <Chip key={t.id} size="small" icon={<Person fontSize="small" />}
                            label={`${t.namaLengkap}${t.divisi ? ` · ${t.divisi}` : ''}`} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Belum ada anggota tim</Typography>
                    )}
                  </Grid>
                  {selectedWO.alasanPenolakan && (
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ py: 0.5 }}>
                        <strong>Alasan penolakan teknisi:</strong> {selectedWO.alasanPenolakan}
                      </Alert>
                    </Grid>
                  )}
                  {selectedWO.catatanReview && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        <strong>Catatan review terakhir:</strong> {selectedWO.catatanReview}
                      </Alert>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Dibuat</Typography>
                    <Typography variant="body2">{fmtDateTime(selectedWO.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Diperbarui</Typography>
                    <Typography variant="body2">{fmtDateTime(selectedWO.updatedAt)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
          {acts.needsTim && <>
            <Button size="small" color="success" variant="contained" startIcon={<Group />} onClick={() => { setDlgDetail(false); openAction('tim', true); }}>Setujui Tim</Button>
            <Button size="small" color="error" variant="outlined" startIcon={<Block />} onClick={() => { setDlgDetail(false); openAction('tim', false); }}>Tolak Tim</Button>
          </>}
          {acts.needsPenolakan && <>
            <Button size="small" color="warning" variant="contained" onClick={() => { setDlgDetail(false); openAction('penolakan', true); }}>Terima Penolakan</Button>
            <Button size="small" color="error" variant="outlined" onClick={() => { setDlgDetail(false); openAction('penolakan', false); }}>Tolak Penolakan</Button>
          </>}
          {acts.needsHasil && <>
            <Button size="small" color="success" variant="contained" startIcon={<ThumbUp />} onClick={() => { setDlgDetail(false); openAction('hasil', true); }}>Setujui Hasil</Button>
            <Button size="small" color="error" variant="outlined" startIcon={<ThumbDown />} onClick={() => { setDlgDetail(false); openAction('hasil', false); }}>Tolak Hasil</Button>
          </>}
          <Button size="small" onClick={() => setDlgDetail(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Tim Dialog ────────────────────────────────────────────────── */}
      <Dialog open={dlgTim} onClose={() => setDlgTim(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{actionApprove ? 'Setujui Komposisi Tim' : 'Tolak Komposisi Tim'}</DialogTitle>
        <DialogContent>
          {selectedWO?.tim?.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>Tim yang diajukan:</Typography>
              {selectedWO.tim.map((t: any) => (
                <Typography key={t.id} variant="body2">• {t.namaLengkap}{t.divisi ? ` (${t.divisi})` : ''}</Typography>
              ))}
            </Box>
          )}
          <TextField fullWidth multiline rows={2} size="small"
            label={actionApprove ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'}
            value={catatan} onChange={e => setCatatan(e.target.value)}
            error={!actionApprove && !catatan.trim()}
            helperText={!actionApprove && !catatan.trim() ? 'Wajib diisi saat menolak' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgTim(false)} size="small">Batal</Button>
          <Button variant="contained" color={actionApprove ? 'success' : 'error'} size="small"
            onClick={handleReviewTim}
            disabled={rvTim || (!actionApprove && !catatan.trim())}
          >
            {rvTim ? <CircularProgress size={16} /> : actionApprove ? 'Setujui Tim' : 'Tolak Tim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Penolakan Dialog ──────────────────────────────────────────── */}
      <Dialog open={dlgPenolakan} onClose={() => setDlgPenolakan(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{actionApprove ? 'Terima Penolakan Teknisi' : 'Tolak Penolakan — Wajib Dikerjakan'}</DialogTitle>
        <DialogContent>
          {selectedWO?.alasanPenolakan && (
            <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
              <strong>Alasan teknisi:</strong> {selectedWO.alasanPenolakan}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {actionApprove
              ? 'Penolakan diterima. Work order ini perlu di-reassign ke teknisi lain.'
              : 'Alasan penolakan tidak diterima. Teknisi tetap harus menjalankan WO ini.'
            }
          </Typography>
          <TextField fullWidth multiline rows={2} size="small"
            label="Catatan keputusan (opsional)"
            value={catatan} onChange={e => setCatatan(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgPenolakan(false)} size="small">Batal</Button>
          <Button variant="contained" color={actionApprove ? 'warning' : 'error'} size="small"
            onClick={handleReviewPenolakan} disabled={rvPnlk}
          >
            {rvPnlk ? <CircularProgress size={16} /> : actionApprove ? 'Terima Penolakan' : 'Tolak Penolakan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Review Hasil Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dlgHasil} onClose={() => setDlgHasil(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{actionApprove ? 'Setujui Hasil Pekerjaan' : 'Tolak Hasil & Minta Revisi'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {actionApprove
              ? 'Pekerjaan ditandai selesai dan proses berikutnya dilanjutkan.'
              : 'Hasil ditolak. Teknisi perlu melakukan revisi dan submit ulang.'
            }
          </Typography>
          <TextField fullWidth multiline rows={3} size="small"
            label={actionApprove ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'}
            value={catatan} onChange={e => setCatatan(e.target.value)}
            error={!actionApprove && !catatan.trim()}
            helperText={!actionApprove && !catatan.trim() ? 'Wajib diisi saat menolak' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgHasil(false)} size="small">Batal</Button>
          <Button variant="contained" color={actionApprove ? 'success' : 'error'} size="small"
            onClick={handleReviewHasil}
            disabled={rvHasil || (!actionApprove && !catatan.trim())}
          >
            {rvHasil ? <CircularProgress size={16} /> : actionApprove ? 'Setujui' : 'Tolak'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Batalkan Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dlgCancel} onClose={() => setDlgCancel(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Batalkan Work Order</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>Tindakan ini tidak dapat dibatalkan.</Alert>
          <TextField fullWidth multiline rows={3} size="small"
            label="Alasan pembatalan (opsional)"
            value={catatan} onChange={e => setCatatan(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgCancel(false)} size="small">Batal</Button>
          <Button variant="contained" color="error" size="small" onClick={handleBatalkan} disabled={cancelling}>
            {cancelling ? <CircularProgress size={16} /> : 'Batalkan WO'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ──────────────────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.ok ? 'success' : 'error'}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
