'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdmin } from '../../../../layouts/AdminProvider';
import {
  Grid, Card, CardContent, Typography, Box, Button, Chip, Avatar, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, TextField, FormControl, InputLabel, Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack, Edit, Person, Phone, Email, LocationOn, WaterDrop, Receipt,
  History, CheckCircle, Warning, Refresh, Badge, OpenInNew, Assignment,
  Save, Close, LinkOff,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import AdminLayout from '../../../../layouts/AdminLayout';
import { GET_CUSTOMER, UPDATE_CUSTOMER } from '../../../../../lib/graphql/queries/customers';
import { GET_TAGIHAN_BY_METERAN } from '../../../../../lib/graphql/queries/billing';
import { GET_METERAN_BY_PELANGGAN } from '../../../../../lib/graphql/queries/meteran';
import { GET_KONEKSI_DATA_BY_PELANGGAN } from '../../../../../lib/graphql/queries/connectionData';

const KONFIRMASI_PEMBAYARAN_LOKET = gql`
  mutation KonfirmasiPembayaranLoket($userId: ID!) {
    konfirmasiPembayaranLoket(userId: $userId) {
      _id
      accountStatus
    }
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const customerTypeLabel = (type: string) => {
  switch (type) {
    case 'rumah_tangga': return 'Rumah Tangga';
    case 'komersial': return 'Komersial';
    case 'industri': return 'Industri';
    case 'sosial': return 'Sosial';
    default: return type || '—';
  }
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const [tabValue, setTabValue] = useState(0);
  const [historyUsage, setHistoryUsage] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'hari' | 'minggu' | 'bulan' | 'tahun'>('minggu');

  // Edit inline state
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    namaLengkap: '', nik: '', email: '', noHP: '', address: '',
    customerType: 'rumah_tangga', gender: '', birthDate: '', occupation: '',
  });

  // Dialog state
  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [updateCustomer, { loading: updatingCustomer }] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomer();
      setSnackbar({ open: true, message: 'Data berhasil diperbarui', severity: 'success' });
      setEditMode(false);
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  const [konfirmasiLoket, { loading: konfirmasiLoading }] = useMutation(KONFIRMASI_PEMBAYARAN_LOKET, {
    onCompleted: () => {
      refetchCustomer();
      setSnackbar({ open: true, message: 'Akun berhasil diaktifkan', severity: 'success' });
      setConfirmActivateOpen(false);
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { loading, error: graphqlError, data: customerData, refetch: refetchCustomer } = useQuery(GET_CUSTOMER, {
    variables: { id: customerId },
    skip: !customerId,
    fetchPolicy: 'network-only',
  });

  const { data: koneksiDataResult, loading: loadingKoneksiData } = useQuery(GET_KONEKSI_DATA_BY_PELANGGAN, {
    variables: { idPelanggan: customerId },
    skip: !customerId,
    fetchPolicy: 'network-only',
  });

  const koneksiData = useMemo(() => (koneksiDataResult as any)?.getKoneksiDataByPelanggan ?? null, [koneksiDataResult]);

  const customer = useMemo(() => {
    if (!(customerData as any)?.getPengguna) return null;
    const c = (customerData as any).getPengguna;
    const nikFromKoneksi = (koneksiDataResult as any)?.getKoneksiDataByPelanggan?.NIK;
    const alamatFromKoneksi = (koneksiDataResult as any)?.getKoneksiDataByPelanggan?.Alamat;
    return {
      id: c._id,
      NIK: c.nik || nikFromKoneksi || 'N/A',
      namaLengkap: c.namaLengkap || 'N/A',
      email: c.email || 'N/A',
      noHP: c.noHP || 'N/A',
      alamat: c.address || alamatFromKoneksi || '—',
      customerType: c.customerType || 'rumah_tangga',
      gender: c.gender || '',
      birthDate: c.birthDate || '',
      occupation: c.occupation || '',
      accountStatus: c.accountStatus || 'inactive',
      isVerified: c.isVerified,
      registrationDate: new Date(c.createdAt),
    };
  }, [customerData, koneksiDataResult]);

  const { data: meteranData, loading: loadingMeteran } = useQuery(GET_METERAN_BY_PELANGGAN, {
    variables: { idPelanggan: customerId },
    skip: !customerId,
    fetchPolicy: 'network-only',
  });

  const meteranInfo = useMemo(() => {
    const list = (meteranData as any)?.getMeteranByPelanggan;
    if (!list || list.length === 0) return null;
    const m = list[0];
    return {
      _id: m._id,
      meterNumber: m.NomorMeteran || 'N/A',
      accountNumber: m.NomorAkun || 'N/A',
      tariffCategory: m.IdKelompokPelanggan?.NamaKelompok || 'N/A',
      installationDate: m.createdAt ? new Date(m.createdAt) : null,
      totalUsage: m.totalPemakaian || 0,
      unpaidUsage: m.pemakaianBelumTerbayar || 0,
      alamat: m.IdKoneksiData?.Alamat || '—',
    };
  }, [meteranData]);

  const meteranId = meteranInfo?._id || null;

  const { loading: loadingBillings, error: billingError, data: billingData } = useQuery(GET_TAGIHAN_BY_METERAN, {
    variables: { IdMeteran: meteranId || '' },
    skip: !meteranId || tabValue !== 0,
    fetchPolicy: 'network-only',
  });

  const billings = useMemo(() => {
    if (!(billingData as any)?.getTagihanByMeteran) return [];
    return (billingData as any).getTagihanByMeteran.map((bill: any) => ({
      id: bill._id,
      period: bill.Periode,
      usage: bill.TotalPemakaian || 0,
      amount: bill.TotalBiaya || 0,
      status: ['SETTLEMENT', 'Settlement', 'Lunas'].includes(bill.StatusPembayaran) ? 'paid' : 'unpaid',
      paidDate: bill.TanggalPembayaran ? new Date(bill.TanggalPembayaran) : null,
      biayaAir: bill.Biaya || 0,
      biayaBeban: bill.BiayaBeban || 0,
      pemakaianAwal: bill.PenggunaanSebelum || 0,
      pemakaianAkhir: bill.PenggunaanSekarang || 0,
    }));
  }, [billingData]);

  useEffect(() => {
    if (meteranId && tabValue === 1) fetchHistoryUsage();
  }, [meteranId, tabValue, historyFilter]);

  const fetchHistoryUsage = async () => {
    if (!meteranId || !customerId) return;
    try {
      setLoadingHistory(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/history/getHistory/${customerId}/${meteranId}?filter=${historyFilter}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.data) {
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          setHistoryUsage(data.data.map((item: any) => ({
            time: historyFilter === 'hari' ? item._id.time
              : historyFilter === 'minggu' ? (days[item._id.day - 1] || '-')
              : historyFilter === 'bulan' ? `Minggu ${item._id.week}`
              : (months[item._id.month - 1] || '-'),
            usage: item.totalUsedWater || 0,
            count: item.count || 0,
          })));
        }
      }
    } catch { /* silent */ } finally { setLoadingHistory(false); }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!customer) return;
    setEditFormData({
      namaLengkap: customer.namaLengkap !== 'N/A' ? customer.namaLengkap : '',
      nik: customer.NIK !== 'N/A' ? customer.NIK : '',
      email: customer.email !== 'N/A' ? customer.email : '',
      noHP: customer.noHP !== 'N/A' ? customer.noHP : '',
      address: customer.alamat !== '—' ? customer.alamat : '',
      customerType: customer.customerType,
      gender: customer.gender,
      birthDate: customer.birthDate ? customer.birthDate.split('T')[0] : '',
      occupation: customer.occupation,
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    updateCustomer({
      variables: {
        id: customerId,
        input: {
          namaLengkap: editFormData.namaLengkap || undefined,
          nik: editFormData.nik || undefined,
          email: editFormData.email || undefined,
          noHP: editFormData.noHP || undefined,
          address: editFormData.address || undefined,
          customerType: editFormData.customerType || undefined,
          gender: editFormData.gender || undefined,
          birthDate: editFormData.birthDate || undefined,
          occupation: editFormData.occupation || undefined,
        },
      },
    });
  };

  const handleDeactivate = () => {
    updateCustomer({
      variables: { id: customerId, input: { accountStatus: 'inactive' } },
    });
    setConfirmDeactivateOpen(false);
  };

  // ── Loading / Error guards ─────────────────────────────────────────────────
  if (authLoading || !isAuthenticated) return null;

  if (loading || loadingMeteran) {
    return (
      <AdminLayout title="Detail Pelanggan">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (graphqlError || !customer) {
    return (
      <AdminLayout title="Detail Pelanggan">
        <Alert severity="error">{graphqlError?.message || 'Pelanggan tidak ditemukan'}</Alert>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/customers')}>Kembali</Button>
          <Button startIcon={<Refresh />} variant="outlined" onClick={() => refetchCustomer()}>Coba Lagi</Button>
        </Box>
      </AdminLayout>
    );
  }

  const isActive = customer.accountStatus === 'active';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title={`Detail Pelanggan - ${customer.namaLengkap}`}>
      <Box>
        {billingError && (
          <Alert severity="warning" sx={{ mb: 2 }}>Gagal memuat riwayat tagihan: {(billingError as any).message}</Alert>
        )}

        {/* ── Top bar ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/customers')}>
            Kembali
          </Button>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!editMode ? (
              <Button variant="outlined" startIcon={<Edit />} onClick={openEdit}>
                Edit Data
              </Button>
            ) : (
              <>
                <Button variant="contained" startIcon={<Save />} onClick={handleSaveEdit}
                  disabled={updatingCustomer}>
                  {updatingCustomer ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button variant="outlined" startIcon={<Close />} onClick={() => setEditMode(false)}
                  disabled={updatingCustomer}>
                  Batal
                </Button>
              </>
            )}
            {isActive ? (
              <Button variant="outlined" color="error" startIcon={<LinkOff />}
                onClick={() => setConfirmDeactivateOpen(true)} disabled={editMode}>
                Nonaktifkan
              </Button>
            ) : (
              <Button variant="contained" color="success" startIcon={<CheckCircle />}
                onClick={() => setConfirmActivateOpen(true)} disabled={editMode}>
                Aktifkan Kembali
              </Button>
            )}
          </Box>
        </Box>

        {/* ── Main card ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>

              {/* ── Kiri: Profil pelanggan ── */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.75rem', flexShrink: 0 }}>
                    {customer.namaLengkap?.charAt(0) || '?'}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    {!editMode ? (
                      /* ── View mode ── */
                      <>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {customer.namaLengkap}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          NIK: {customer.NIK}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip size="small" label={customerTypeLabel(customer.customerType)}
                            color="primary" variant="outlined" icon={<Person />} />
                          <Chip size="small"
                            icon={isActive ? <CheckCircle /> : <Warning />}
                            label={isActive ? 'Aktif' : 'Tidak Aktif'}
                            color={isActive ? 'success' : 'default'}
                          />
                          {customer.isVerified && (
                            <Chip size="small" icon={<CheckCircle />} label="Terverifikasi" color="info" />
                          )}
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.noHP}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                              <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.email}</Typography>
                            </Box>
                            {(customer.gender || customer.occupation) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {[
                                    customer.gender === 'L' ? 'Laki-laki' : customer.gender === 'P' ? 'Perempuan' : customer.gender || null,
                                    customer.occupation || null,
                                  ].filter(Boolean).join(' · ')}
                                </Typography>
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                              <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                              <Typography variant="body2">{customer.alamat}</Typography>
                            </Box>
                            {customer.birthDate && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Lahir: {customer.birthDate.split('T')[0]}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Terdaftar: {customer.registrationDate.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    ) : (
                      /* ── Edit mode ── */
                      <>
                        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                          Mode Edit — ubah data lalu klik Simpan
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Nama Lengkap"
                              value={editFormData.namaLengkap}
                              onChange={e => setEditFormData(p => ({ ...p, namaLengkap: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="NIK"
                              value={editFormData.nik}
                              onChange={e => setEditFormData(p => ({ ...p, nik: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="No. HP"
                              value={editFormData.noHP}
                              onChange={e => setEditFormData(p => ({ ...p, noHP: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Email"
                              value={editFormData.email}
                              onChange={e => setEditFormData(p => ({ ...p, email: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth size="small" label="Alamat"
                              value={editFormData.address}
                              onChange={e => setEditFormData(p => ({ ...p, address: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Jenis Pelanggan</InputLabel>
                              <Select value={editFormData.customerType} label="Jenis Pelanggan"
                                onChange={e => setEditFormData(p => ({ ...p, customerType: e.target.value }))}>
                                <MenuItem value="rumah_tangga">Rumah Tangga</MenuItem>
                                <MenuItem value="komersial">Komersial</MenuItem>
                                <MenuItem value="industri">Industri</MenuItem>
                                <MenuItem value="sosial">Sosial</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Jenis Kelamin</InputLabel>
                              <Select value={editFormData.gender} label="Jenis Kelamin"
                                onChange={e => setEditFormData(p => ({ ...p, gender: e.target.value }))}>
                                <MenuItem value="">— Belum diisi —</MenuItem>
                                <MenuItem value="L">Laki-laki</MenuItem>
                                <MenuItem value="P">Perempuan</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="Pekerjaan" placeholder="Opsional"
                              value={editFormData.occupation}
                              onChange={e => setEditFormData(p => ({ ...p, occupation: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="Tanggal Lahir" type="date"
                              InputLabelProps={{ shrink: true }}
                              value={editFormData.birthDate}
                              onChange={e => setEditFormData(p => ({ ...p, birthDate: e.target.value }))}
                            />
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* ── Kanan: Info Meteran ── */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'primary.50', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WaterDrop color="primary" />
                      Info Meteran
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {meteranInfo ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">No. Meteran</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{meteranInfo.meterNumber}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">No. Akun</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {meteranInfo.accountNumber}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Kategori Tarif</Typography>
                          <Chip label={meteranInfo.tariffCategory} size="small" color="primary" sx={{ mt: 0.5, display: 'flex', width: 'fit-content' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Total Pemakaian</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {meteranInfo.totalUsage} m³
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Belum Terbayar</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: meteranInfo.unpaidUsage > 0 ? 'warning.main' : 'text.secondary' }}>
                            {meteranInfo.unpaidUsage} m³
                          </Typography>
                        </Box>
                        <Divider />
                        {meteranInfo.installationDate && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Tgl. Instalasi</Typography>
                            <Typography variant="body2">
                              {meteranInfo.installationDate.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        )}
                        {meteranInfo.alamat && meteranInfo.alamat !== '—' && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Alamat Instalasi</Typography>
                            <Typography variant="body2">{meteranInfo.alamat}</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ mt: 1 }}>Belum ada meteran terpasang</Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ── Tabs ── */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab icon={<Receipt />} label="Riwayat Tagihan" iconPosition="start" />
              <Tab icon={<History />} label="Riwayat Pembacaan" iconPosition="start" />
              <Tab icon={<Assignment />} label="Data Sambungan" iconPosition="start" />
            </Tabs>
          </Box>

          {/* ── Tab 0: Riwayat Tagihan ── */}
          <TabPanel value={tabValue} index={0}>
            {loadingBillings ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : billings.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Periode</TableCell>
                      <TableCell align="right">Pemakaian Awal</TableCell>
                      <TableCell align="right">Pemakaian Akhir</TableCell>
                      <TableCell align="right">Total (m³)</TableCell>
                      <TableCell align="right">Biaya Air</TableCell>
                      <TableCell align="right">Biaya Beban</TableCell>
                      <TableCell align="right">Total Tagihan</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tanggal Bayar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{b.period}</Typography></TableCell>
                        <TableCell align="right">{b.pemakaianAwal.toFixed(2)}</TableCell>
                        <TableCell align="right">{b.pemakaianAkhir.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {b.usage.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatIDR(b.biayaAir)}</TableCell>
                        <TableCell align="right">{formatIDR(b.biayaBeban)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatIDR(b.amount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={b.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                            color={b.status === 'paid' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell>
                          {b.paidDate ? b.paidDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                {meteranInfo ? 'Belum ada riwayat tagihan untuk meteran ini' : 'Pelanggan belum memiliki meteran'}
              </Alert>
            )}
          </TabPanel>

          {/* ── Tab 1: Riwayat Pembacaan ── */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Riwayat Pemakaian Air</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {(['hari', 'minggu', 'bulan', 'tahun'] as const).map(f => (
                  <Chip key={f}
                    label={f === 'hari' ? 'Hari Ini' : f === 'minggu' ? 'Minggu Ini' : f === 'bulan' ? 'Bulan Ini' : 'Tahun Ini'}
                    color={historyFilter === f ? 'primary' : 'default'}
                    onClick={() => setHistoryFilter(f)} clickable
                  />
                ))}
              </Box>
            </Box>
            {loadingHistory ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : historyUsage.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        {historyFilter === 'hari' ? 'Jam' : historyFilter === 'minggu' ? 'Hari' : historyFilter === 'bulan' ? 'Minggu' : 'Bulan'}
                      </TableCell>
                      <TableCell align="right">Pemakaian (Liter)</TableCell>
                      <TableCell align="right">Jumlah Pembacaan</TableCell>
                      <TableCell align="right">Rata-rata (L/pembacaan)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyUsage.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.time}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {item.usage.toFixed(2)} L
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                        <TableCell align="right">{item.count > 0 ? (item.usage / item.count).toFixed(2) : '0.00'} L</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>TOTAL</Typography></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {historyUsage.reduce((s, i) => s + i.usage, 0).toFixed(2)} L
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {historyUsage.reduce((s, i) => s + i.count, 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {(() => {
                            const tu = historyUsage.reduce((s, i) => s + i.usage, 0);
                            const tc = historyUsage.reduce((s, i) => s + i.count, 0);
                            return tc > 0 ? (tu / tc).toFixed(2) : '0.00';
                          })()} L
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                {meteranInfo ? `Belum ada data pemakaian untuk filter "${historyFilter}"` : 'Pelanggan belum memiliki meteran'}
              </Alert>
            )}
          </TabPanel>

          {/* ── Tab 2: Data Sambungan ── */}
          <TabPanel value={tabValue} index={2}>
            {loadingKoneksiData ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : !koneksiData ? (
              <Alert severity="info">
                Pelanggan belum mengajukan data verifikasi sambungan air (NIK, KK, IMB, Alamat).
              </Alert>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Status Pengajuan Sambungan</Typography>
                    <Chip
                      label={koneksiData.StatusPengajuan === 'APPROVED' ? 'Disetujui' : koneksiData.StatusPengajuan === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi'}
                      color={koneksiData.StatusPengajuan === 'APPROVED' ? 'success' : koneksiData.StatusPengajuan === 'REJECTED' ? 'error' : 'warning'}
                      icon={koneksiData.StatusPengajuan === 'APPROVED' ? <CheckCircle /> : <Warning />}
                    />
                    {koneksiData.TanggalVerifikasi && (
                      <Typography variant="caption" color="text.secondary">
                        Diverifikasi: {new Date(koneksiData.TanggalVerifikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Typography>
                    )}
                  </Box>
                  {koneksiData.AlasanPenolakan && (
                    <Alert severity="error" sx={{ mb: 2 }}>Alasan Penolakan: {koneksiData.AlasanPenolakan}</Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge color="primary" />
                        Dokumen Identitas
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">NIK (KTP)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                            {koneksiData.NIK || '-'}
                          </Typography>
                          {koneksiData.NIKUrl && (
                            <Button size="small" startIcon={<OpenInNew />} href={koneksiData.NIKUrl} target="_blank" sx={{ mt: 0.5, p: 0 }}>
                              Lihat Foto KTP
                            </Button>
                          )}
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">No. Kartu Keluarga (KK)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                            {koneksiData.NoKK || '-'}
                          </Typography>
                          {koneksiData.KKUrl && (
                            <Button size="small" startIcon={<OpenInNew />} href={koneksiData.KKUrl} target="_blank" sx={{ mt: 0.5, p: 0 }}>
                              Lihat Foto KK
                            </Button>
                          )}
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">No. IMB (Izin Mendirikan Bangunan)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                            {koneksiData.IMB || '-'}
                          </Typography>
                          {koneksiData.IMBUrl && (
                            <Button size="small" startIcon={<OpenInNew />} href={koneksiData.IMBUrl} target="_blank" sx={{ mt: 0.5, p: 0 }}>
                              Lihat Dokumen IMB
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="primary" />
                        Alamat & Properti
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Alamat Lengkap</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{koneksiData.Alamat || '-'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Kelurahan</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{koneksiData.Kelurahan || '-'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Kecamatan</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{koneksiData.Kecamatan || '-'}</Typography>
                          </Box>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Luas Bangunan</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {koneksiData.LuasBangunan ? `${koneksiData.LuasBangunan} m²` : '-'}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Tanggal Pengajuan</Typography>
                          <Typography variant="body2">
                            {koneksiData.createdAt
                              ? new Date(koneksiData.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => router.push(`/operations/connection-data/${koneksiData._id}`)}>
                    Buka Halaman Detail Sambungan Lengkap
                  </Button>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Card>
      </Box>

      {/* ── Dialog: Aktifkan Kembali ── */}
      <Dialog open={confirmActivateOpen} onClose={() => setConfirmActivateOpen(false)}>
        <DialogTitle>Aktifkan Kembali Akun</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Aksi ini akan menandai <strong>semua tagihan pending</strong> sebagai <strong>Lunas (via Loket)</strong> dan mengaktifkan kembali akun pelanggan.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Pastikan pelanggan sudah membayar semua tunggakan secara tunai di loket sebelum melanjutkan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmActivateOpen(false)}>Batal</Button>
          <Button variant="contained" color="success" disabled={konfirmasiLoading}
            onClick={() => konfirmasiLoket({ variables: { userId: customerId } })}>
            {konfirmasiLoading ? 'Memproses...' : 'Ya, Konfirmasi & Aktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Nonaktifkan ── */}
      <Dialog open={confirmDeactivateOpen} onClose={() => setConfirmDeactivateOpen(false)}>
        <DialogTitle>Nonaktifkan Akun</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Akun pelanggan <strong>{customer.namaLengkap}</strong> akan dinonaktifkan.
            Pelanggan tidak dapat menggunakan layanan hingga diaktifkan kembali.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Untuk pemutusan resmi dengan denda (tunggakan ≥ 3 bulan), gunakan menu Pemutusan Sambungan di halaman Pelanggan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeactivateOpen(false)}>Batal</Button>
          <Button variant="contained" color="error" disabled={updatingCustomer} onClick={handleDeactivate}>
            {updatingCustomer ? 'Memproses...' : 'Ya, Nonaktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
