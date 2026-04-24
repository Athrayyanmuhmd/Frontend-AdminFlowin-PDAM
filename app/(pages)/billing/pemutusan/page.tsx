'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useAdmin } from '../../../layouts/AdminProvider';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const GET_DAFTAR_PEMUTUSAN = gql`
  query GetDaftarPemutusan {
    getDaftarPemutusan {
      user {
        _id
        namaLengkap
        email
        noHP
        accountStatus
      }
      tagihanTunggakan {
        _id
        Periode
        TotalBiaya
        StatusPembayaran
        bulanCakupan
        isMergedBilling
        jenisBilling
        Catatan
      }
      jumlahBulanTunggak
      totalTunggakan
      denda
      sudahDiputus
    }
  }
`;

const DEACTIVATE_CUSTOMER = gql`
  mutation DeactivateCustomer($userId: ID!) {
    deactivateCustomer(userId: $userId) {
      _id
      accountStatus
    }
  }
`;

const KONFIRMASI_LOKET = gql`
  mutation KonfirmasiPembayaranLoket($userId: ID!) {
    konfirmasiPembayaranLoket(userId: $userId) {
      _id
      accountStatus
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (val: number) =>
  `Rp${val.toLocaleString('id-ID')}`;

const formatPeriode = (periode: string) => {
  const d = new Date(Number(periode));
  return isNaN(d.getTime())
    ? new Date(periode).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PemutusanPage() {
  const { isAuthenticated } = useAdmin();
  const { data, loading, error, refetch } = useQuery(GET_DAFTAR_PEMUTUSAN, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  });

  const [deactivate, { loading: deactivating }] = useMutation(DEACTIVATE_CUSTOMER, {
    onCompleted: () => { setConfirmDialog(null); refetch(); },
    onError: (e) => setErrorMsg(e.message),
  });

  const [konfirmasi, { loading: konfirming }] = useMutation(KONFIRMASI_LOKET, {
    onCompleted: () => { setLoketDialog(null); refetch(); },
    onError: (e) => setErrorMsg(e.message),
  });

  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [loketDialog, setLoketDialog]     = useState<any>(null);
  const [errorMsg, setErrorMsg]           = useState('');

  if (loading) return (
    <AdminLayout>
      <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
    </AdminLayout>
  );
  if (error) return (
    <AdminLayout>
      <Alert severity="error" sx={{ m: 3 }}>Gagal memuat data: {error.message}</Alert>
    </AdminLayout>
  );

  const daftar = (data as any)?.getDaftarPemutusan ?? [];
  const belumDiputus = daftar.filter((d: any) => !d.sudahDiputus);
  const sudahDiputus = daftar.filter((d: any) => d.sudahDiputus);

  return (
    <AdminLayout>
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <PersonOffIcon color="error" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Daftar Pemutusan</Typography>
          <Typography variant="body2" color="text.secondary">
            Pelanggan dengan tunggakan 3+ bulan yang memerlukan pemutusan layanan
          </Typography>
        </Box>
      </Stack>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Ringkasan */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ minWidth: 180, flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Perlu Diputus</Typography>
            <Typography variant="h4" color="warning.main" fontWeight={700}>{belumDiputus.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 180, flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Sudah Non-aktif</Typography>
            <Typography variant="h4" color="error.main" fontWeight={700}>{sudahDiputus.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ── Tabel: Belum Diputus ───────────────────────────────── */}
      {belumDiputus.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <WarningAmberIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>Menunggu Pemutusan</Typography>
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Pelanggan</b></TableCell>
                    <TableCell><b>Tunggakan</b></TableCell>
                    <TableCell><b>Total Tagihan</b></TableCell>
                    <TableCell><b>Denda</b></TableCell>
                    <TableCell><b>Total Bayar</b></TableCell>
                    <TableCell align="center"><b>Aksi</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {belumDiputus.map((item: any) => (
                    <TableRow key={item.user._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.user.namaLengkap}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${item.jumlahBulanTunggak} Bulan`} color="warning" size="small" />
                      </TableCell>
                      <TableCell>{formatRupiah(item.totalTunggakan)}</TableCell>
                      <TableCell>{formatRupiah(item.denda)}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color="error.main">
                          {formatRupiah(item.totalTunggakan + item.denda)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<PersonOffIcon />}
                          onClick={() => setConfirmDialog(item)}
                        >
                          Putuskan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Tabel: Sudah Diputus ───────────────────────────────── */}
      {sudahDiputus.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <ReceiptLongIcon color="error" />
              <Typography variant="h6" fontWeight={600}>Sudah Non-aktif — Menunggu Pembayaran</Typography>
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Pelanggan</b></TableCell>
                    <TableCell><b>Tagihan Tertunggak</b></TableCell>
                    <TableCell><b>Total Tagihan</b></TableCell>
                    <TableCell><b>Denda</b></TableCell>
                    <TableCell><b>Total Bayar</b></TableCell>
                    <TableCell align="center"><b>Aksi</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sudahDiputus.map((item: any) => (
                    <TableRow key={item.user._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.user.namaLengkap}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.user.email}</Typography>
                        <br />
                        <Chip label="Non-aktif" color="error" size="small" sx={{ mt: 0.5 }} />
                      </TableCell>
                      <TableCell>
                        {item.tagihanTunggakan.map((t: any) => (
                          <Box key={t._id} mb={0.5}>
                            <Typography variant="caption">
                              {t.jenisBilling === 'denda'
                                ? 'Denda Pemutusan'
                                : t.isMergedBilling
                                  ? `Gabungan: ${t.Catatan}`
                                  : `Periode: ${formatPeriode(t.Periode)}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatRupiah(t.TotalBiaya)}
                            </Typography>
                          </Box>
                        ))}
                      </TableCell>
                      <TableCell>{formatRupiah(item.totalTunggakan)}</TableCell>
                      <TableCell>{formatRupiah(item.denda)}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color="error.main">
                          {formatRupiah(item.totalTunggakan + item.denda)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setLoketDialog(item)}
                        >
                          Konfirmasi Loket
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {daftar.length === 0 && (
        <Alert severity="success">Tidak ada pelanggan yang memerlukan pemutusan saat ini.</Alert>
      )}

      {/* ── Dialog Konfirmasi Pemutusan ──────────────────────────── */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Konfirmasi Pemutusan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Anda akan menonaktifkan ID pelanggan <b>{confirmDialog?.user?.namaLengkap}</b>.
          </DialogContentText>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Jumlah Bulan Tunggak</Typography>
              <Typography variant="body2" fontWeight={700}>{confirmDialog?.jumlahBulanTunggak} bulan</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Total Tagihan</Typography>
              <Typography variant="body2">{formatRupiah(confirmDialog?.totalTunggakan ?? 0)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Denda yang Akan Ditambahkan</Typography>
              <Typography variant="body2" color="error.main" fontWeight={700}>
                {formatRupiah(confirmDialog?.denda ?? 0)}
              </Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total yang Harus Dibayar</Typography>
              <Typography variant="body2" fontWeight={700} color="error.main">
                {formatRupiah((confirmDialog?.totalTunggakan ?? 0) + (confirmDialog?.denda ?? 0))}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={deactivating}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deactivating}
            onClick={() => deactivate({ variables: { userId: confirmDialog.user._id } })}
          >
            {deactivating ? <CircularProgress size={18} /> : 'Ya, Putuskan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Konfirmasi Pembayaran Loket ──────────────────── */}
      <Dialog open={!!loketDialog} onClose={() => setLoketDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Konfirmasi Pembayaran Loket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Konfirmasi bahwa pelanggan <b>{loketDialog?.user?.namaLengkap}</b> telah membayar
            semua tunggakan beserta denda secara tunai di loket.
          </DialogContentText>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Total Tagihan</Typography>
              <Typography variant="body2">{formatRupiah(loketDialog?.totalTunggakan ?? 0)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Denda</Typography>
              <Typography variant="body2" color="error.main">{formatRupiah(loketDialog?.denda ?? 0)}</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total Diterima Loket</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">
                {formatRupiah((loketDialog?.totalTunggakan ?? 0) + (loketDialog?.denda ?? 0))}
              </Typography>
            </Box>
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Setelah dikonfirmasi, ID pelanggan akan otomatis aktif kembali.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoketDialog(null)} disabled={konfirming}>Batal</Button>
          <Button
            variant="contained"
            color="success"
            disabled={konfirming}
            onClick={() => konfirmasi({ variables: { userId: loketDialog.user._id } })}
          >
            {konfirming ? <CircularProgress size={18} /> : 'Konfirmasi Pembayaran'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </AdminLayout>
  );
}
