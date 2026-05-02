'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  buatWorkOrder as srvBuatWorkOrder,
  getTeknisiUsers as srvGetTeknisiUsers,
} from '@/lib/graphql/teknisiServer';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Divider,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Search,
  Visibility,
  Person,
  LocationOn,
  AssignmentTurnedIn,
  Engineering,
  Warning,
  AddTask,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_ALL_LAPORAN,
  UPDATE_LAPORAN_STATUS,
} from '@/lib/graphql/queries/reports';

// ─── Technician queries (inline — simple enough) ─────────────────────────────
const GET_ALL_TEKNISI = gql`
  query GetAllTeknisi {
    getAllTeknisi {
      id
      namaLengkap
      nip
      divisi
      noHp
      isActive
    }
  }
`;

// Query active work orders to determine busy technicians
const GET_BUSY_TEKNISI = gql`
  query GetBusyTeknisi {
    workOrders(filter: { status: sedang_dikerjakan }) {
      data {
        teknisiPenanggungJawab {
          id
        }
      }
    }
  }
`;

// ─── Ahmad's enum values (via GQL SCREAMING_SNAKE_CASE) ──────────────────────
const JENIS_LAPORAN_LABELS: Record<string, string> = {
  AIR_TIDAK_MENGALIR: 'Air Tidak Mengalir',
  AIR_KERUH: 'Air Keruh',
  KEBOCORAN_PIPA: 'Kebocoran Pipa',
  METERAN_BERMASALAH: 'Meteran Bermasalah',
  KENDALA_LAINNYA: 'Kendala Lainnya',
};

const STATUS_LABELS: Record<string, string> = {
  DIAJUKAN: 'Diajukan',
  DITUGASKAN: 'Ditugaskan',
  DITINJAU_ADMIN: 'Ditinjau Admin',
  SEDANG_DIKERJAKAN: 'Sedang Dikerjakan',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const STATUS_COLORS: Record<
  string,
  'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'
> = {
  DIAJUKAN: 'warning',
  DITUGASKAN: 'primary',
  DITINJAU_ADMIN: 'info',
  SEDANG_DIKERJAKAN: 'info',
  SELESAI: 'success',
  DIBATALKAN: 'error',
};

const DIVISI_LABELS: Record<string, string> = {
  INSTALASI: 'Instalasi',
  PEMELIHARAAN: 'Pemeliharaan',
  PERBAIKAN: 'Perbaikan',
  PENGAWASAN: 'Pengawasan',
  LAINNYA: 'Lainnya',
};

function parseFlexDate(val: string | number | null | undefined): Date | null {
  if (!val) return null;
  const num =
    typeof val === 'number'
      ? val
      : /^\d+$/.test(String(val))
        ? Number(val)
        : NaN;
  if (!isNaN(num)) return new Date(num);
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val: string | number | null | undefined): string {
  const d = parseFlexDate(val);
  return d
    ? d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';
}

function fmtDateTime(val: string | number | null | undefined): string {
  const d = parseFlexDate(val);
  return d
    ? d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';
}

const JENIS_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  AIR_TIDAK_MENGALIR: 'error',
  AIR_KERUH: 'warning',
  KEBOCORAN_PIPA: 'error',
  METERAN_BERMASALAH: 'warning',
  KENDALA_LAINNYA: 'default',
};

// Status transitions yang diizinkan admin
const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  DIAJUKAN: [
    { value: 'DITUGASKAN', label: 'Tugaskan ke Teknisi' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  DITUGASKAN: [
    { value: 'SEDANG_DIKERJAKAN', label: 'Tandai Sedang Dikerjakan' },
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  DITINJAU_ADMIN: [
    { value: 'SEDANG_DIKERJAKAN', label: 'Tandai Sedang Dikerjakan' },
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  SEDANG_DIKERJAKAN: [
    { value: 'SELESAI', label: 'Tandai Selesai' },
    { value: 'DIBATALKAN', label: 'Batalkan' },
  ],
  SELESAI: [],
  DIBATALKAN: [],
};

export default function LaporanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedTeknisiId, setSelectedTeknisiId] = useState('');
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // ── Assign WO for penyelesaian laporan ──────────────────────────────────────
  const [assignWOOpen, setAssignWOOpen] = useState(false);
  const [assignWOTeknisiId, setAssignWOTeknisiId] = useState('');
  const [assignWOLoading, setAssignWOLoading] = useState(false);
  const [teknisiListWO, setTeknisiListWO] = useState<any[]>([]);
  const [teknisiListWOLoading, setTeknisiListWOLoading] = useState(false);

  const handleOpenAssignWO = async (laporan: any) => {
    setSelectedLaporan(laporan);
    setAssignWOTeknisiId('');
    setAssignWOOpen(true);
    setTeknisiListWOLoading(true);
    try {
      const token = localStorage.getItem('admin_token') ?? '';
      const res = await srvGetTeknisiUsers(token);
      const list: any[] = (res.data as any)?.users ?? [];
      setTeknisiListWO(list.filter((t: any) => t.isActive !== false));
    } catch {
      /* ignore */
    } finally {
      setTeknisiListWOLoading(false);
    }
  };

  const handleSubmitAssignWO = async () => {
    if (!selectedLaporan || !assignWOTeknisiId) return;
    setAssignWOLoading(true);
    try {
      const token = localStorage.getItem('admin_token') ?? '';
      const res = await srvBuatWorkOrder(token, {
        jenisPekerjaan: 'penyelesaian_laporan',
        teknisiPenanggungJawab: assignWOTeknisiId,
        idLaporan: selectedLaporan._id,
      });
      if ((res.data as any)?.buatWorkOrder?.success) {
        setSnackbar({
          open: true,
          message: 'Work Order penyelesaian laporan berhasil dibuat!',
          severity: 'success',
        });
        setAssignWOOpen(false);
      } else {
        const msg =
          res.errors?.[0]?.message ??
          (res.data as any)?.buatWorkOrder?.message ??
          'Gagal membuat Work Order';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message ?? 'Gagal membuat Work Order',
        severity: 'error',
      });
    } finally {
      setAssignWOLoading(false);
    }
  };

  const { data, loading, error, refetch } = useQuery(GET_ALL_LAPORAN, {
    fetchPolicy: 'cache-and-network',
  });

  // Teknisi list — loaded lazily when "Ditugaskan" dialog opens
  const [fetchTeknisi, { data: teknisiData, loading: teknisiLoading }] =
    useLazyQuery(GET_ALL_TEKNISI, {
      fetchPolicy: 'cache-and-network',
    });
  const [fetchBusyTeknisi, { data: busyData }] = useLazyQuery(
    GET_BUSY_TEKNISI,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  // Set of busy teknisi IDs (currently sedang_dikerjakan)
  const busyTeknisiIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    const orders = (busyData as any)?.workOrders?.data ?? [];
    for (const wo of orders) {
      if (wo.teknisiPenanggungJawab?.id) ids.add(wo.teknisiPenanggungJawab.id);
    }
    return ids;
  }, [busyData]);

  const [updateStatus, { loading: updatingStatus }] = useMutation(
    UPDATE_LAPORAN_STATUS,
    {
      onCompleted: () => {
        refetch();
        setUpdateDialogOpen(false);
        setDetailOpen(false);
        setNewStatus('');
        setSelectedTeknisiId('');
        setCatatanAdmin('');
        setSnackbar({
          open: true,
          message: 'Status laporan berhasil diperbarui',
          severity: 'success',
        });
      },
      onError: err => {
        setSnackbar({ open: true, message: err.message, severity: 'error' });
      },
    }
  );

  const laporanList: any[] = (data as any)?.getAllLaporan || [];

  const filtered = laporanList.filter(l => {
    const matchSearch =
      !search ||
      l.namaLaporan?.toLowerCase().includes(search.toLowerCase()) ||
      l.idPengguna?.namaLengkap?.toLowerCase().includes(search.toLowerCase()) ||
      l.alamat?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalMenunggu = laporanList.filter(l => l.status === 'DIAJUKAN').length;
  const totalDiproses = laporanList.filter(l =>
    ['DITUGASKAN', 'DITINJAU_ADMIN', 'SEDANG_DIKERJAKAN'].includes(l.status)
  ).length;
  const totalSelesai = laporanList.filter(l => l.status === 'SELESAI').length;

  const handleOpenUpdateDialog = (laporan: any) => {
    setSelectedLaporan(laporan);
    const nextOptions = NEXT_STATUSES[laporan.status] || [];
    const firstStatus = nextOptions[0]?.value || '';
    setNewStatus(firstStatus);
    setSelectedTeknisiId('');
    setCatatanAdmin('');
    setUpdateDialogOpen(true);
    // If going to DITUGASKAN, prefetch teknisi list
    if (firstStatus === 'DITUGASKAN') {
      fetchTeknisi();
      fetchBusyTeknisi();
    }
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setSelectedTeknisiId('');
    if (status === 'DITUGASKAN') {
      fetchTeknisi();
      fetchBusyTeknisi();
    }
  };

  const requiresTeknisi = newStatus === 'DITUGASKAN';

  const handleUpdateStatus = () => {
    if (!selectedLaporan || !newStatus) return;
    if (requiresTeknisi && !selectedTeknisiId) {
      setSnackbar({
        open: true,
        message: 'Pilih teknisi yang akan ditugaskan',
        severity: 'error',
      });
      return;
    }
    updateStatus({
      variables: {
        id: selectedLaporan._id,
        status: newStatus,
        idTeknisi: requiresTeknisi ? selectedTeknisiId : undefined,
        catatanAdmin: catatanAdmin || undefined,
      },
    });
  };

  const canUpdateStatus = (laporan: any) =>
    (NEXT_STATUSES[laporan.status] || []).length > 0;

  const teknisiList: any[] =
    (teknisiData as any)?.getAllTeknisi?.filter(
      (t: any) => t.isActive !== false
    ) ?? [];

  if (authLoading || !isAuthenticated) return null;

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant='h5' fontWeight={700}>
              Laporan Pelanggan
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Kelola laporan masalah dari pelanggan PDAM
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Menunggu Tindakan
                </Typography>
                <Typography variant='h4' fontWeight={700} color='warning.main'>
                  {totalMenunggu}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #3b82f6' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Sedang Diproses
                </Typography>
                <Typography variant='h4' fontWeight={700} color='info.main'>
                  {totalDiproses}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Card sx={{ borderLeft: '4px solid #22c55e' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Selesai
                </Typography>
                <Typography variant='h4' fontWeight={700} color='success.main'>
                  {totalSelesai}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Filter Bar */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction='row' spacing={2} alignItems='center'>
              <TextField
                size='small'
                placeholder='Cari laporan, nama pelanggan, alamat...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search fontSize='small' />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label='Status'
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <MenuItem value=''>Semua</MenuItem>
                  <MenuItem value='DIAJUKAN'>Diajukan</MenuItem>
                  <MenuItem value='DITUGASKAN'>Ditugaskan</MenuItem>
                  <MenuItem value='DITINJAU_ADMIN'>Ditinjau Admin</MenuItem>
                  <MenuItem value='SEDANG_DIKERJAKAN'>
                    Sedang Dikerjakan
                  </MenuItem>
                  <MenuItem value='SELESAI'>Selesai</MenuItem>
                  <MenuItem value='DIBATALKAN'>Dibatalkan</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity='error'>Gagal memuat laporan: {error.message}</Alert>
        ) : (
          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Jenis Masalah
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Alamat</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Teknisi</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align='center'>
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align='center'
                        sx={{ py: 4, color: 'text.secondary' }}
                      >
                        Tidak ada laporan ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((laporan: any) => (
                      <TableRow key={laporan._id} hover>
                        <TableCell>
                          <Typography variant='body2'>
                            {fmtDate(laporan.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: 12,
                                bgcolor: 'primary.main',
                              }}
                            >
                              {laporan.idPengguna?.namaLengkap?.[0] || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant='body2' fontWeight={600}>
                                {laporan.idPengguna?.namaLengkap || '-'}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {laporan.idPengguna?.noHP || ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              label={
                                JENIS_LAPORAN_LABELS[laporan.jenisLaporan] ||
                                laporan.jenisLaporan
                              }
                              size='small'
                              color={
                                JENIS_COLORS[laporan.jenisLaporan] || 'default'
                              }
                              variant='outlined'
                            />
                            <Typography
                              variant='caption'
                              display='block'
                              color='text.secondary'
                              sx={{ mt: 0.5 }}
                            >
                              {laporan.namaLaporan}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant='body2'
                            sx={{
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {laporan.alamat || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              STATUS_LABELS[laporan.status] || laporan.status
                            }
                            size='small'
                            color={STATUS_COLORS[laporan.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {laporan.idTeknisi ? (
                            <Box>
                              <Typography
                                variant='body2'
                                fontWeight={600}
                                noWrap
                                sx={{ maxWidth: 120 }}
                              >
                                {laporan.idTeknisi.namaLengkap}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {DIVISI_LABELS[laporan.idTeknisi.divisi] ||
                                  laporan.idTeknisi.divisi ||
                                  '-'}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant='body2' color='text.disabled'>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <Stack
                            direction='row'
                            spacing={0.5}
                            justifyContent='center'
                          >
                            <Tooltip title='Lihat Detail'>
                              <IconButton
                                size='small'
                                onClick={() => {
                                  setSelectedLaporan(laporan);
                                  setDetailOpen(true);
                                }}
                              >
                                <Visibility fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            {canUpdateStatus(laporan) && (
                              <Tooltip title='Perbarui Status'>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() =>
                                    handleOpenUpdateDialog(laporan)
                                  }
                                >
                                  <Engineering fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!['SELESAI', 'DIBATALKAN'].includes(
                              laporan.status
                            ) && (
                              <Tooltip title='Buat Work Order Penyelesaian'>
                                <IconButton
                                  size='small'
                                  color='success'
                                  onClick={() => handleOpenAssignWO(laporan)}
                                >
                                  <AddTask fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant='caption' color='text.secondary'>
                Menampilkan {filtered.length} dari {laporanList.length} laporan
              </Typography>
            </Box>
          </Card>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Detail Laporan</DialogTitle>
          <DialogContent dividers>
            {selectedLaporan && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Judul Laporan
                  </Typography>
                  <Typography variant='body1' fontWeight={600}>
                    {selectedLaporan.namaLaporan}
                  </Typography>
                </Box>
                <Box>
                  <Chip
                    label={
                      JENIS_LAPORAN_LABELS[selectedLaporan.jenisLaporan] ||
                      selectedLaporan.jenisLaporan
                    }
                    color={
                      JENIS_COLORS[selectedLaporan.jenisLaporan] || 'default'
                    }
                    size='small'
                  />
                  <Chip
                    label={
                      STATUS_LABELS[selectedLaporan.status] ||
                      selectedLaporan.status
                    }
                    color={STATUS_COLORS[selectedLaporan.status] || 'default'}
                    size='small'
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Person fontSize='small' color='action' />
                  <Box>
                    <Typography variant='body2' fontWeight={600}>
                      {selectedLaporan.idPengguna?.namaLengkap}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {selectedLaporan.idPengguna?.noHP} ·{' '}
                      {selectedLaporan.idPengguna?.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LocationOn fontSize='small' color='action' />
                  <Typography variant='body2'>
                    {selectedLaporan.alamat || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Deskripsi Masalah
                  </Typography>
                  <Typography variant='body2'>
                    {selectedLaporan.masalah}
                  </Typography>
                </Box>
                {selectedLaporan.idTeknisi && (
                  <Box
                    sx={{
                      bgcolor: 'primary.50',
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Teknisi Ditugaskan
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      {selectedLaporan.idTeknisi.namaLengkap}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {DIVISI_LABELS[selectedLaporan.idTeknisi.divisi] ||
                        selectedLaporan.idTeknisi.divisi}
                      {selectedLaporan.idTeknisi.nip
                        ? ` · NIP ${selectedLaporan.idTeknisi.nip}`
                        : ''}
                    </Typography>
                    {selectedLaporan.catatanAdmin && (
                      <Typography
                        variant='caption'
                        display='block'
                        sx={{ mt: 0.5, fontStyle: 'italic' }}
                      >
                        Catatan: {selectedLaporan.catatanAdmin}
                      </Typography>
                    )}
                  </Box>
                )}
                {selectedLaporan.catatan && (
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Catatan Pelanggan
                    </Typography>
                    <Typography variant='body2'>
                      {selectedLaporan.catatan}
                    </Typography>
                  </Box>
                )}
                {selectedLaporan.imageURL?.length > 0 && (
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                      sx={{ mb: 1 }}
                    >
                      Foto Laporan
                    </Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap'>
                      {selectedLaporan.imageURL.map(
                        (url: string, i: number) => (
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
                              cursor: 'pointer',
                            }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        )
                      )}
                    </Stack>
                  </Box>
                )}
                <Typography variant='caption' color='text.secondary'>
                  Dilaporkan: {fmtDateTime(selectedLaporan.createdAt)}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {selectedLaporan && canUpdateStatus(selectedLaporan) && (
              <Button
                variant='contained'
                startIcon={<Engineering />}
                onClick={() => {
                  setDetailOpen(false);
                  handleOpenUpdateDialog(selectedLaporan);
                }}
              >
                Perbarui Status
              </Button>
            )}
            {selectedLaporan &&
              !['SELESAI', 'DIBATALKAN'].includes(selectedLaporan.status) && (
                <Button
                  variant='outlined'
                  color='success'
                  startIcon={<AddTask />}
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenAssignWO(selectedLaporan);
                  }}
                >
                  Buat Work Order
                </Button>
              )}
            <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Perbarui Status Laporan
          </DialogTitle>
          <DialogContent dividers>
            {selectedLaporan && (
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Laporan
                  </Typography>
                  <Typography variant='body2' fontWeight={600}>
                    {selectedLaporan.namaLaporan}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Pelanggan: {selectedLaporan.idPengguna?.namaLengkap || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Status saat ini:
                  </Typography>
                  <Chip
                    label={
                      STATUS_LABELS[selectedLaporan.status] ||
                      selectedLaporan.status
                    }
                    size='small'
                    color={STATUS_COLORS[selectedLaporan.status] || 'default'}
                  />
                </Box>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status Baru</InputLabel>
                  <Select
                    value={newStatus}
                    label='Status Baru'
                    onChange={e => handleStatusChange(e.target.value)}
                  >
                    {(NEXT_STATUSES[selectedLaporan.status] || []).map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Teknisi Picker — only shown when status = DITUGASKAN */}
                {requiresTeknisi && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant='subtitle2'
                        fontWeight={700}
                        gutterBottom
                      >
                        Pilih Teknisi
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        display='block'
                        sx={{ mb: 1.5 }}
                      >
                        Teknisi bertanda{' '}
                        <Warning
                          sx={{
                            fontSize: 12,
                            color: 'warning.main',
                            verticalAlign: 'middle',
                          }}
                        />{' '}
                        sedang menangani pekerjaan aktif.
                      </Typography>
                      {teknisiLoading ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 2,
                          }}
                        >
                          <CircularProgress size={16} />
                          <Typography variant='body2' color='text.secondary'>
                            Memuat daftar teknisi...
                          </Typography>
                        </Box>
                      ) : (
                        <FormControl fullWidth size='small' required>
                          <InputLabel>Teknisi *</InputLabel>
                          <Select
                            value={selectedTeknisiId}
                            label='Teknisi *'
                            onChange={e => setSelectedTeknisiId(e.target.value)}
                            renderValue={val => {
                              const t = teknisiList.find(
                                (tk: any) => tk.id === val
                              );
                              return t
                                ? `${t.namaLengkap} — ${DIVISI_LABELS[t.divisi] || t.divisi}`
                                : '';
                            }}
                          >
                            {teknisiList.length === 0 ? (
                              <MenuItem disabled>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  Tidak ada teknisi aktif
                                </Typography>
                              </MenuItem>
                            ) : (
                              teknisiList.map((t: any) => {
                                const isBusy = busyTeknisiIds.has(t.id);
                                return (
                                  <MenuItem key={t.id} value={t.id}>
                                    <ListItemAvatar sx={{ minWidth: 40 }}>
                                      <Avatar
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          fontSize: 13,
                                          bgcolor: isBusy
                                            ? 'warning.main'
                                            : 'primary.main',
                                        }}
                                      >
                                        {t.namaLengkap[0]}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant='body2'
                                            fontWeight={600}
                                          >
                                            {t.namaLengkap}
                                          </Typography>
                                          {isBusy && (
                                            <Tooltip title='Sedang menangani pekerjaan aktif'>
                                              <Warning
                                                sx={{
                                                  fontSize: 14,
                                                  color: 'warning.main',
                                                }}
                                              />
                                            </Tooltip>
                                          )}
                                        </Box>
                                      }
                                      secondary={`${DIVISI_LABELS[t.divisi] || t.divisi}${t.nip ? ` · NIP ${t.nip}` : ''}`}
                                    />
                                  </MenuItem>
                                );
                              })
                            )}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  </>
                )}

                {/* Catatan Admin — optional for any status change */}
                <TextField
                  label='Catatan Admin (opsional)'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  value={catatanAdmin}
                  onChange={e => setCatatanAdmin(e.target.value)}
                  placeholder='Catatan tambahan untuk teknisi atau rekam internal...'
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setUpdateDialogOpen(false);
                setNewStatus('');
                setSelectedTeknisiId('');
                setCatatanAdmin('');
              }}
            >
              Batal
            </Button>
            <Button
              variant='contained'
              onClick={handleUpdateStatus}
              disabled={
                !newStatus ||
                updatingStatus ||
                (requiresTeknisi && !selectedTeknisiId)
              }
              startIcon={
                updatingStatus ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <AssignmentTurnedIn />
                )
              }
            >
              {updatingStatus ? 'Menyimpan...' : 'Simpan Status'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign WO Dialog */}
        <Dialog
          open={assignWOOpen}
          onClose={() => setAssignWOOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddTask color='success' />
              Buat Work Order Penyelesaian Laporan
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedLaporan && (
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Box
                  sx={{
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Laporan
                  </Typography>
                  <Typography variant='body2' fontWeight={600}>
                    {selectedLaporan.namaLaporan}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {selectedLaporan.idPengguna?.namaLengkap} ·{' '}
                    {selectedLaporan.alamat}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={
                        JENIS_LAPORAN_LABELS[selectedLaporan.jenisLaporan] ||
                        selectedLaporan.jenisLaporan
                      }
                      size='small'
                      variant='outlined'
                    />
                  </Box>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  Work order akan dibuat dengan jenis pekerjaan{' '}
                  <strong>Penyelesaian Laporan</strong> dan ditugaskan ke
                  teknisi yang dipilih.
                </Typography>
                <FormControl fullWidth size='small' required>
                  <InputLabel>Teknisi Penanggung Jawab *</InputLabel>
                  <Select
                    value={assignWOTeknisiId}
                    label='Teknisi Penanggung Jawab *'
                    onChange={e => setAssignWOTeknisiId(e.target.value)}
                    disabled={teknisiListWOLoading}
                    renderValue={val => {
                      const t = teknisiListWO.find((tk: any) => tk.id === val);
                      return t
                        ? `${t.namaLengkap} — ${DIVISI_LABELS[t.divisi] || t.divisi}`
                        : '';
                    }}
                  >
                    {teknisiListWOLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={16} sx={{ mr: 1 }} /> Memuat...
                      </MenuItem>
                    ) : teknisiListWO.length === 0 ? (
                      <MenuItem disabled>Tidak ada teknisi aktif</MenuItem>
                    ) : (
                      teknisiListWO.map((t: any) => (
                        <MenuItem key={t.id} value={t.id}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 13,
                                bgcolor: 'success.main',
                              }}
                            >
                              {t.namaLengkap[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant='body2' fontWeight={600}>
                                {t.namaLengkap}
                              </Typography>
                            }
                            secondary={`${DIVISI_LABELS[t.divisi] || t.divisi}${t.nip ? ` · NIP ${t.nip}` : ''}`}
                          />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignWOOpen(false)}>Batal</Button>
            <Button
              variant='contained'
              color='success'
              startIcon={
                assignWOLoading ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <AddTask />
                )
              }
              onClick={handleSubmitAssignWO}
              disabled={!assignWOTeknisiId || assignWOLoading}
            >
              {assignWOLoading ? 'Membuat...' : 'Buat Work Order'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
}
