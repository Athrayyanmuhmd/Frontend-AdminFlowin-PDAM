'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
} from '@mui/material';
import {
  Add,
  Visibility,
  Send,
  Notifications,
  Person,
  People,
  Search,
  FilterList,
  Refresh,
  Campaign,
  Info,
  Warning,
  Receipt,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdmin } from '../../layouts/AdminProvider';
import { GET_ALL_NOTIFIKASI_ADMIN, GET_ALL_PENGGUNA_FOR_NOTIF } from '@/lib/graphql/queries/notifikasi';
import { CREATE_NOTIFIKASI, BROADCAST_NOTIFIKASI } from '@/lib/graphql/mutations/notifikasi';

interface Pengguna {
  _id: string;
  namaLengkap: string;
  email: string;
  noHP?: string;
}

interface NotifikasiItem {
  _id: string;
  judul: string;
  pesan: string;
  kategori: 'Transaksi' | 'Informasi' | 'Peringatan';
  link?: string;
  isRead: boolean;
  idPelanggan?: { _id: string; namaLengkap: string; email: string };
  idAdmin?: { _id: string; namaLengkap: string };
  idTeknisi?: { _id: string; namaLengkap: string };
  createdAt: string;
}

const kategoriColor = (k: string) => {
  if (k === 'Transaksi') return 'info';
  if (k === 'Peringatan') return 'warning';
  return 'success';
};

const kategoriIcon = (k: string) => {
  if (k === 'Transaksi') return <Receipt fontSize="small" />;
  if (k === 'Peringatan') return <Warning fontSize="small" />;
  return <Info fontSize="small" />;
};

const formatDate = (ts: string) => {
  const d = new Date(isNaN(Number(ts)) ? ts : Number(ts));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const BROADCAST_TEMPLATES = [
  {
    label: 'Pengingat Tagihan',
    judul: 'Pengingat Pembayaran Tagihan Air',
    pesan: 'Kami mengingatkan Anda untuk segera melakukan pembayaran tagihan air sebelum jatuh tempo. Pembayaran dapat dilakukan melalui aplikasi Aqualink.',
    kategori: 'Transaksi',
  },
  {
    label: 'Pemeliharaan Jaringan',
    judul: 'Pemberitahuan Pemeliharaan Jaringan Air',
    pesan: 'Akan dilakukan pemeliharaan jaringan distribusi air pada waktu yang telah ditentukan. Mohon maaf atas ketidaknyamanan yang ditimbulkan.',
    kategori: 'Informasi',
  },
  {
    label: 'Potensi Kebocoran',
    judul: 'Peringatan Potensi Kebocoran Pipa',
    pesan: 'Sistem mendeteksi potensi kebocoran pada jaringan pipa di area Anda. Tim teknisi kami akan segera melakukan pengecekan.',
    kategori: 'Peringatan',
  },
  {
    label: 'Kenaikan Tarif',
    judul: 'Pemberitahuan Penyesuaian Tarif Air',
    pesan: 'Kami menginformasikan adanya penyesuaian tarif air mulai bulan depan sesuai dengan kebijakan perusahaan. Informasi lengkap dapat dilihat di aplikasi.',
    kategori: 'Informasi',
  },
];

export default function NotifikasiPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterKategori, setFilterKategori] = useState('');
  const [filterPenerima, setFilterPenerima] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail dialog
  const [selectedNotif, setSelectedNotif] = useState<NotifikasiItem | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Kirim notifikasi dialog
  const [openSend, setOpenSend] = useState(false);
  const [sendTarget, setSendTarget] = useState<'personal' | 'broadcast'>('personal');
  const [selectedPengguna, setSelectedPengguna] = useState<Pengguna | null>(null);
  const [formJudul, setFormJudul] = useState('');
  const [formPesan, setFormPesan] = useState('');
  const [formKategori, setFormKategori] = useState<'Transaksi' | 'Informasi' | 'Peringatan'>('Informasi');
  const [formLink, setFormLink] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  const { data, loading, error, refetch } = useQuery(GET_ALL_NOTIFIKASI_ADMIN, {
    fetchPolicy: 'network-only',
    skip: !isAuthenticated,
  });

  const { data: penggunaData } = useQuery(GET_ALL_PENGGUNA_FOR_NOTIF, {
    fetchPolicy: 'network-only',
    skip: !isAuthenticated,
  });

  const [createNotifikasi, { loading: sendingPersonal }] = useMutation(CREATE_NOTIFIKASI, {
    onCompleted: () => {
      setSnackMsg('Notifikasi berhasil dikirim');
      setSnackSeverity('success');
      setOpenSend(false);
      resetForm();
      refetch();
    },
    onError: (err) => {
      setSnackMsg('Gagal mengirim notifikasi: ' + err.message);
      setSnackSeverity('error');
    },
  });

  const [broadcastNotifikasi, { loading: sendingBroadcast }] = useMutation(BROADCAST_NOTIFIKASI, {
    onCompleted: (result) => {
      const count = (result as any)?.broadcastNotifikasi?.length ?? allPengguna.length;
      setSnackMsg(`Broadcast berhasil dikirim ke ${count} pelanggan`);
      setSnackSeverity('success');
      setOpenSend(false);
      resetForm();
      refetch();
    },
    onError: (err) => {
      setSnackMsg('Gagal broadcast: ' + err.message);
      setSnackSeverity('error');
    },
  });

  const sending = sendingPersonal || sendingBroadcast;

  if (authLoading || !isAuthenticated) return null;

  const allNotif: NotifikasiItem[] = (data as any)?.getAllNotifikasiAdmin ?? [];
  const allPengguna: Pengguna[] = (penggunaData as any)?.getAllPengguna ?? [];

  const filtered = allNotif.filter((item) => {
    const matchKategori = !filterKategori || item.kategori === filterKategori;
    const matchPenerima =
      !filterPenerima ||
      (filterPenerima === 'pelanggan' && !!item.idPelanggan) ||
      (filterPenerima === 'admin' && !!item.idAdmin) ||
      (filterPenerima === 'teknisi' && !!item.idTeknisi);
    const matchSearch =
      !searchTerm ||
      item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pesan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.idPelanggan?.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '';
    return matchKategori && matchPenerima && matchSearch;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const statsTotal = allNotif.length;
  const statsTransaksi = allNotif.filter((n) => n.kategori === 'Transaksi').length;
  const statsInformasi = allNotif.filter((n) => n.kategori === 'Informasi').length;
  const statsPeringatan = allNotif.filter((n) => n.kategori === 'Peringatan').length;

  const resetForm = () => {
    setSendTarget('personal');
    setSelectedPengguna(null);
    setFormJudul('');
    setFormPesan('');
    setFormKategori('Informasi');
    setFormLink('');
    setSelectedTemplate('');
  };

  const applyTemplate = (templateLabel: string) => {
    const tmpl = BROADCAST_TEMPLATES.find((t) => t.label === templateLabel);
    if (!tmpl) return;
    setFormJudul(tmpl.judul);
    setFormPesan(tmpl.pesan);
    setFormKategori(tmpl.kategori as 'Transaksi' | 'Informasi' | 'Peringatan');
    setSelectedTemplate(templateLabel);
  };

  const handleSend = () => {
    if (!formJudul.trim() || !formPesan.trim()) {
      setSnackMsg('Judul dan pesan wajib diisi');
      setSnackSeverity('error');
      return;
    }
    if (sendTarget === 'personal' && !selectedPengguna) {
      setSnackMsg('Pilih penerima terlebih dahulu');
      setSnackSeverity('error');
      return;
    }

    const input: Record<string, string> = {
      judul: formJudul,
      pesan: formPesan,
      kategori: formKategori,
      ...(formLink.trim() && { link: formLink.trim() }),
    };

    if (sendTarget === 'personal' && selectedPengguna) {
      // Kirim ke satu pelanggan
      createNotifikasi({ variables: { input: { ...input, idPelanggan: selectedPengguna._id } } });
    } else {
      // Broadcast ke semua pelanggan via backend bulk mutation
      broadcastNotifikasi({ variables: { input } });
    }
  };

  const getPenerima = (item: NotifikasiItem) => {
    if (item.idPelanggan) return { label: item.idPelanggan.namaLengkap, type: 'Pelanggan' };
    if (item.idAdmin) return { label: item.idAdmin.namaLengkap, type: 'Admin' };
    if (item.idTeknisi) return { label: item.idTeknisi.namaLengkap, type: 'Teknisi' };
    return { label: '-', type: '-' };
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Manajemen Notifikasi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kirim dan kelola notifikasi ke pelanggan, teknisi, atau admin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setOpenSend(true)}
            sx={{ minWidth: 160 }}
          >
            Kirim Notifikasi
          </Button>
        </Box>

        {snackMsg && (
          <Alert severity={snackSeverity} onClose={() => setSnackMsg('')} sx={{ mb: 2 }}>
            {snackMsg}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total Terkirim', value: statsTotal, color: '#1976d2', icon: <Notifications /> },
            { label: 'Transaksi', value: statsTransaksi, color: '#0288d1', icon: <Receipt /> },
            { label: 'Informasi', value: statsInformasi, color: '#2e7d32', icon: <Info /> },
            { label: 'Peringatan', value: statsPeringatan, color: '#ed6c02', icon: <Warning /> },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderLeft: `4px solid ${s.color}` }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color={s.color}>
                  {s.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Cari judul / pesan / penerima"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Kategori"
                size="small"
                fullWidth
                value={filterKategori}
                onChange={(e) => { setFilterKategori(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} /> }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="Transaksi">Transaksi</MenuItem>
                <MenuItem value="Informasi">Informasi</MenuItem>
                <MenuItem value="Peringatan">Peringatan</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                select
                label="Penerima"
                size="small"
                fullWidth
                value={filterPenerima}
                onChange={(e) => { setFilterPenerima(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="pelanggan">Pelanggan</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teknisi">Teknisi</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Gagal memuat notifikasi: {error.message}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.50' }}>
                      <TableCell>No</TableCell>
                      <TableCell>Judul</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell>Penerima</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Waktu</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Belum ada notifikasi
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item, idx) => {
                        const penerima = getPenerima(item);
                        return (
                          <TableRow key={item._id} hover>
                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                {item.judul}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                                {item.pesan.substring(0, 60)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.kategori}
                                color={kategoriColor(item.kategori) as 'info' | 'warning' | 'success'}
                                size="small"
                                icon={kategoriIcon(item.kategori)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{penerima.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{penerima.type}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.isRead ? 'Dibaca' : 'Belum Dibaca'}
                                color={item.isRead ? 'default' : 'primary'}
                                size="small"
                                variant={item.isRead ? 'outlined' : 'filled'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{formatDate(item.createdAt)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Lihat Detail">
                                <IconButton
                                  size="small"
                                  onClick={() => { setSelectedNotif(item); setOpenDetail(true); }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                labelRowsPerPage="Baris per halaman:"
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detail Notifikasi</DialogTitle>
        <DialogContent dividers>
          {selectedNotif && (
            <Box>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={selectedNotif.kategori}
                  color={kategoriColor(selectedNotif.kategori) as 'info' | 'warning' | 'success'}
                  icon={kategoriIcon(selectedNotif.kategori)}
                />
                <Chip
                  label={selectedNotif.isRead ? 'Sudah Dibaca' : 'Belum Dibaca'}
                  color={selectedNotif.isRead ? 'default' : 'primary'}
                  variant={selectedNotif.isRead ? 'outlined' : 'filled'}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                {selectedNotif.judul}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedNotif.pesan}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Penerima</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {getPenerima(selectedNotif).label}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({getPenerima(selectedNotif).type})
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Waktu Kirim</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatDate(selectedNotif.createdAt)}
                  </Typography>
                </Grid>
                {selectedNotif.link && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Link</Typography>
                    <Typography variant="body2" color="primary.main">
                      {selectedNotif.link}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Kirim Notifikasi Dialog */}
      <Dialog open={openSend} onClose={() => { setOpenSend(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Send color="primary" />
            Kirim Notifikasi
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" gap={1} mb={2}>
            <Button
              variant={sendTarget === 'personal' ? 'contained' : 'outlined'}
              startIcon={<Person />}
              onClick={() => { setSendTarget('personal'); setSelectedPengguna(null); }}
              size="small"
            >
              Personal
            </Button>
            <Button
              variant={sendTarget === 'broadcast' ? 'contained' : 'outlined'}
              startIcon={<Campaign />}
              onClick={() => setSendTarget('broadcast')}
              size="small"
              color="warning"
            >
              Broadcast Semua ({allPengguna.length} pelanggan)
            </Button>
          </Box>

          {sendTarget === 'broadcast' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Notifikasi akan dikirim ke <b>semua {allPengguna.length} pelanggan</b> terdaftar.
            </Alert>
          )}

          {sendTarget === 'personal' && (
            <Autocomplete
              options={allPengguna}
              getOptionLabel={(o) => `${o.namaLengkap} (${o.email})`}
              value={selectedPengguna}
              onChange={(_, val) => setSelectedPengguna(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Pelanggan *"
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{ ...params.InputProps, startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} /> }}
                />
              )}
            />
          )}

          {/* Template */}
          <TextField
            select
            label="Gunakan Template (opsional)"
            size="small"
            fullWidth
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">— Pilih template —</MenuItem>
            {BROADCAST_TEMPLATES.map((t) => (
              <MenuItem key={t.label} value={t.label}>{t.label}</MenuItem>
            ))}
          </TextField>

          <Divider sx={{ mb: 2 }} />

          <TextField
            label="Judul Notifikasi *"
            size="small"
            fullWidth
            value={formJudul}
            onChange={(e) => setFormJudul(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Kategori *"
            size="small"
            fullWidth
            value={formKategori}
            onChange={(e) => setFormKategori(e.target.value as 'Transaksi' | 'Informasi' | 'Peringatan')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Informasi">Informasi</MenuItem>
            <MenuItem value="Transaksi">Transaksi</MenuItem>
            <MenuItem value="Peringatan">Peringatan</MenuItem>
          </TextField>

          <TextField
            label="Isi Pesan *"
            size="small"
            fullWidth
            multiline
            rows={4}
            value={formPesan}
            onChange={(e) => setFormPesan(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Link (opsional)"
            size="small"
            fullWidth
            value={formLink}
            onChange={(e) => setFormLink(e.target.value)}
            placeholder="Contoh: /billing"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenSend(false); resetForm(); }}>Batal</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <Send />}
            onClick={handleSend}
            disabled={sending}
            color={sendTarget === 'broadcast' ? 'warning' : 'primary'}
          >
            {sending ? 'Mengirim...' : sendTarget === 'broadcast' ? `Broadcast (${allPengguna.length})` : 'Kirim'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
