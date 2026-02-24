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
  Rating,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Warning,
  CheckCircle,
  Search,
  FilterList,
  Refresh,
  Star,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  GET_ALL_PENGAWASAN_SETELAH_PEMASANGAN,
  GET_AVERAGE_CUSTOMER_RATING,
} from '@/lib/graphql/queries/pengawasan';
import {
  DELETE_PENGAWASAN_SETELAH_PEMASANGAN,
} from '@/lib/graphql/mutations/pengawasan';

interface ChecklistSetelah {
  meteranBacaCorrect?: boolean;
  tidakAdaKebocoran?: boolean;
  sambunganAman?: boolean;
  mudahDibaca?: boolean;
  pelangganPuas?: boolean;
  dokumentasiLengkap?: boolean;
}

interface FeedbackPelanggan {
  rating?: number;
  komentar?: string;
}

interface PengawasanSetelah {
  _id: string;
  idPemasangan: {
    _id: string;
    seriMeteran: string;
    idKoneksiData?: {
      _id: string;
      alamat: string;
      idPelanggan?: {
        namaLengkap: string;
        noHP: string;
      };
    };
    teknisiId?: {
      _id: string;
      namaLengkap: string;
    };
  };
  urlGambar: string[];
  catatan: string;
  supervisorId: {
    _id: string;
    namaLengkap: string;
    divisi?: string;
  };
  tanggalPengawasan?: string;
  hariSetelahPemasangan?: number;
  hasilPengawasan: string;
  statusMeteran: string;
  bacaanAwal?: number;
  masalahDitemukan?: string[];
  tindakan?: string;
  rekomendasi?: string;
  perluTindakLanjut: boolean;
  checklist?: ChecklistSetelah;
  feedbackPelanggan?: FeedbackPelanggan;
  createdAt: string;
  updatedAt: string;
}

const hasilColor = (hasil: string) => {
  if (hasil === 'Baik') return 'success';
  if (hasil === 'Perlu Perbaikan') return 'warning';
  if (hasil === 'Bermasalah') return 'error';
  return 'default';
};

const statusMeteranColor = (status: string) => {
  if (status === 'Berfungsi Normal') return 'success';
  if (status === 'Perlu Kalibrasi') return 'warning';
  if (status === 'Bermasalah') return 'error';
  return 'default';
};

const formatDate = (ts?: string) => {
  if (!ts) return '-';
  const d = new Date(isNaN(Number(ts)) ? ts : Number(ts));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const ChecklistBadge = ({ val, label }: { val?: boolean; label: string }) => (
  <Grid item xs={6}>
    <Typography variant="body2">
      <b>{label}:</b>{' '}
      <Chip
        label={val ? 'Ya' : 'Tidak'}
        size="small"
        color={val ? 'success' : 'error'}
        icon={val ? <CheckCircle /> : <Warning />}
      />
    </Typography>
  </Grid>
);

export default function PengawasanSetelahPemasanganPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterHasil, setFilterHasil] = useState('');
  const [filterStatusMeteran, setFilterStatusMeteran] = useState('');
  const [filterTindakLanjut, setFilterTindakLanjut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<PengawasanSetelah | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PengawasanSetelah | null>(null);
  const [snackMsg, setSnackMsg] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_ALL_PENGAWASAN_SETELAH_PEMASANGAN, {
    fetchPolicy: 'network-only',
    skip: !isAuthenticated,
  });

  const { data: ratingData } = useQuery(GET_AVERAGE_CUSTOMER_RATING, {
    fetchPolicy: 'network-only',
    skip: !isAuthenticated,
  });

  const [deletePengawasan, { loading: deleting }] = useMutation(DELETE_PENGAWASAN_SETELAH_PEMASANGAN, {
    onCompleted: () => {
      setSnackMsg('Data pengawasan berhasil dihapus');
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => setSnackMsg('Gagal menghapus: ' + err.message),
  });

  if (authLoading || !isAuthenticated) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allData: PengawasanSetelah[] = (data as any)?.getAllPengawasanSetelahPemasangan ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgRating: number = (ratingData as any)?.getAverageCustomerRating?.averageRating ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalResponden: number = (ratingData as any)?.getAverageCustomerRating?.totalResponden ?? 0;

  const filtered = allData.filter((item) => {
    const matchHasil = !filterHasil || item.hasilPengawasan === filterHasil;
    const matchStatus = !filterStatusMeteran || item.statusMeteran === filterStatusMeteran;
    const matchTL =
      !filterTindakLanjut ||
      (filterTindakLanjut === 'ya' ? item.perluTindakLanjut : !item.perluTindakLanjut);
    const pelanggan = item.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '';
    const seri = item.idPemasangan?.seriMeteran ?? '';
    const supervisor = item.supervisorId?.namaLengkap ?? '';
    const matchSearch =
      !searchTerm ||
      pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchHasil && matchStatus && matchTL && matchSearch;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const statsBaik = allData.filter((d) => d.hasilPengawasan === 'Baik').length;
  const statsPerbaikan = allData.filter((d) => d.hasilPengawasan === 'Perlu Perbaikan').length;
  const statsBermasalah = allData.filter((d) => d.hasilPengawasan === 'Bermasalah').length;
  const statsTindakLanjut = allData.filter((d) => d.perluTindakLanjut).length;

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Pengawasan Setelah Pemasangan
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Rekap hasil pengawasan pasca pemasangan meteran air dan feedback pelanggan
        </Typography>

        {snackMsg && (
          <Alert severity="info" onClose={() => setSnackMsg('')} sx={{ mb: 2 }}>
            {snackMsg}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Baik', value: statsBaik, color: '#4caf50' },
            { label: 'Perlu Perbaikan', value: statsPerbaikan, color: '#ff9800' },
            { label: 'Bermasalah', value: statsBermasalah, color: '#f44336' },
            { label: 'Perlu Tindak Lanjut', value: statsTindakLanjut, color: '#2196f3' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Paper sx={{ p: 2, borderLeft: `4px solid ${s.color}` }}>
                <Typography variant="h4" fontWeight={700} color={s.color}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Rating summary */}
        {totalResponden > 0 && (
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Star color="warning" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {avgRating.toFixed(1)} / 5.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rata-rata rating pelanggan dari {totalResponden} responden
              </Typography>
            </Box>
            <Rating value={avgRating} precision={0.1} readOnly />
          </Paper>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Cari pelanggan / seri / supervisor"
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
                label="Hasil Pengawasan"
                size="small"
                fullWidth
                value={filterHasil}
                onChange={(e) => { setFilterHasil(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} /> }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="Baik">Baik</MenuItem>
                <MenuItem value="Perlu Perbaikan">Perlu Perbaikan</MenuItem>
                <MenuItem value="Bermasalah">Bermasalah</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Status Meteran"
                size="small"
                fullWidth
                value={filterStatusMeteran}
                onChange={(e) => { setFilterStatusMeteran(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="Berfungsi Normal">Berfungsi Normal</MenuItem>
                <MenuItem value="Perlu Kalibrasi">Perlu Kalibrasi</MenuItem>
                <MenuItem value="Bermasalah">Bermasalah</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Tindak Lanjut"
                size="small"
                fullWidth
                value={filterTindakLanjut}
                onChange={(e) => { setFilterTindakLanjut(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="ya">Perlu Tindak Lanjut</MenuItem>
                <MenuItem value="tidak">Tidak Perlu</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
                fullWidth
              >
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
              Gagal memuat data: {error.message}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.50' }}>
                      <TableCell>No</TableCell>
                      <TableCell>Pelanggan</TableCell>
                      <TableCell>Seri Meteran</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>Hari ke-</TableCell>
                      <TableCell>Hasil</TableCell>
                      <TableCell>Status Meteran</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Tindak Lanjut</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Tidak ada data pengawasan setelah pemasangan
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item, idx) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.idPemasangan?.idKoneksiData?.alamat ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.idPemasangan?.seriMeteran ?? '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.supervisorId?.namaLengkap ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.hariSetelahPemasangan != null ? `H+${item.hariSetelahPemasangan}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.hasilPengawasan}
                              color={hasilColor(item.hasilPengawasan) as 'success' | 'warning' | 'error' | 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.statusMeteran}
                              color={statusMeteranColor(item.statusMeteran) as 'success' | 'warning' | 'error' | 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.feedbackPelanggan?.rating != null ? (
                              <Rating
                                value={item.feedbackPelanggan.rating}
                                readOnly
                                size="small"
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.perluTindakLanjut ? (
                              <Chip label="Perlu" color="warning" size="small" icon={<Warning />} />
                            ) : (
                              <Chip label="Tidak" color="success" size="small" icon={<CheckCircle />} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Detail">
                              <IconButton
                                size="small"
                                onClick={() => { setSelectedItem(item); setOpenDetail(true); }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hapus">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => { setDeleteTarget(item); setOpenDeleteDialog(true); }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
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
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Pengawasan Setelah Pemasangan</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Info Pemasangan
                  </Typography>
                  <Typography variant="body2">
                    <b>Seri Meteran:</b> {selectedItem.idPemasangan?.seriMeteran ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Pelanggan:</b>{' '}
                    {selectedItem.idPemasangan?.idKoneksiData?.idPelanggan?.namaLengkap ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Alamat:</b> {selectedItem.idPemasangan?.idKoneksiData?.alamat ?? '-'}
                  </Typography>
                  <Typography variant="body2">
                    <b>Teknisi Pemasang:</b>{' '}
                    {selectedItem.idPemasangan?.teknisiId?.namaLengkap ?? '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Hasil Pengawasan
                  </Typography>
                  <Typography variant="body2">
                    <b>Supervisor:</b> {selectedItem.supervisorId?.namaLengkap ?? '-'}
                    {selectedItem.supervisorId?.divisi && ` (${selectedItem.supervisorId.divisi})`}
                  </Typography>
                  <Typography variant="body2">
                    <b>Tanggal:</b> {formatDate(selectedItem.tanggalPengawasan ?? selectedItem.createdAt)}
                  </Typography>
                  {selectedItem.hariSetelahPemasangan != null && (
                    <Typography variant="body2">
                      <b>Hari setelah pasang:</b> H+{selectedItem.hariSetelahPemasangan}
                    </Typography>
                  )}
                  {selectedItem.bacaanAwal != null && (
                    <Typography variant="body2">
                      <b>Bacaan Awal:</b> {selectedItem.bacaanAwal} m³
                    </Typography>
                  )}
                  <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={selectedItem.hasilPengawasan}
                      color={hasilColor(selectedItem.hasilPengawasan) as 'success' | 'warning' | 'error' | 'default'}
                    />
                    <Chip
                      label={selectedItem.statusMeteran}
                      color={statusMeteranColor(selectedItem.statusMeteran) as 'success' | 'warning' | 'error' | 'default'}
                    />
                    {selectedItem.perluTindakLanjut && (
                      <Chip label="Perlu Tindak Lanjut" color="warning" icon={<Warning />} />
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Checklist */}
              {selectedItem.checklist && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Checklist Pasca Pemasangan
                    </Typography>
                    <Grid container spacing={1}>
                      <ChecklistBadge val={selectedItem.checklist.meteranBacaCorrect} label="Meteran Baca Correct" />
                      <ChecklistBadge val={selectedItem.checklist.tidakAdaKebocoran} label="Tidak Ada Kebocoran" />
                      <ChecklistBadge val={selectedItem.checklist.sambunganAman} label="Sambungan Aman" />
                      <ChecklistBadge val={selectedItem.checklist.mudahDibaca} label="Mudah Dibaca" />
                      <ChecklistBadge val={selectedItem.checklist.pelangganPuas} label="Pelanggan Puas" />
                      <ChecklistBadge val={selectedItem.checklist.dokumentasiLengkap} label="Dokumentasi Lengkap" />
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Feedback Pelanggan */}
              {selectedItem.feedbackPelanggan && (
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Feedback Pelanggan
                    </Typography>
                    {selectedItem.feedbackPelanggan.rating != null && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Rating value={selectedItem.feedbackPelanggan.rating} readOnly />
                        <Typography variant="body2" fontWeight={600}>
                          {selectedItem.feedbackPelanggan.rating}/5
                        </Typography>
                      </Box>
                    )}
                    {selectedItem.feedbackPelanggan.komentar && (
                      <Typography variant="body2" fontStyle="italic">
                        "{selectedItem.feedbackPelanggan.komentar}"
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Masalah & Tindakan */}
              {(selectedItem.masalahDitemukan?.length || selectedItem.tindakan || selectedItem.rekomendasi) && (
                <Grid item xs={12} md={selectedItem.feedbackPelanggan ? 6 : 12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Masalah & Tindakan
                    </Typography>
                    {selectedItem.masalahDitemukan && selectedItem.masalahDitemukan.length > 0 && (
                      <>
                        <Typography variant="body2" fontWeight={600}>Masalah Ditemukan:</Typography>
                        <List dense disablePadding>
                          {selectedItem.masalahDitemukan.map((m, i) => (
                            <ListItem key={i} disablePadding>
                              <ListItemText primary={`• ${m}`} />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    {selectedItem.tindakan && (
                      <Typography variant="body2" mt={1}>
                        <b>Tindakan:</b> {selectedItem.tindakan}
                      </Typography>
                    )}
                    {selectedItem.rekomendasi && (
                      <Typography variant="body2" mt={1}>
                        <b>Rekomendasi:</b> {selectedItem.rekomendasi}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Catatan */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Catatan
                  </Typography>
                  <Typography variant="body2">{selectedItem.catatan}</Typography>
                </Paper>
              </Grid>

              {/* Foto */}
              {selectedItem.urlGambar?.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Dokumentasi Foto ({selectedItem.urlGambar.length})
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {selectedItem.urlGambar.map((url, i) => (
                        <Button
                          key={i}
                          variant="outlined"
                          size="small"
                          onClick={() => window.open(url, '_blank')}
                        >
                          Foto {i + 1}
                        </Button>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs">
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Hapus data pengawasan setelah pemasangan untuk seri meteran{' '}
            <b>{deleteTarget?.idPemasangan?.seriMeteran}</b>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTarget) deletePengawasan({ variables: { id: deleteTarget._id } });
            }}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={18} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
