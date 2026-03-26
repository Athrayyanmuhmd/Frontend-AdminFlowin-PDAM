'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdmin } from '../../../../layouts/AdminProvider';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Phone,
  Email,
  LocationOn,
  WaterDrop,
  Receipt,
  History,
  Settings,
  CheckCircle,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import AdminLayout from '../../../../layouts/AdminLayout';
import { GET_CUSTOMER, UPDATE_CUSTOMER } from '../../../../../lib/graphql/queries/customers';
import { GET_TAGIHAN_BY_METERAN } from '../../../../../lib/graphql/queries/billing';
import { GET_METERAN_BY_PELANGGAN } from '../../../../../lib/graphql/queries/meteran';

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

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, hasPermission } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
    if (!authLoading && isAuthenticated && !hasPermission('customers', 'read')) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  const [tabValue, setTabValue] = useState(0);
  const [historyUsage, setHistoryUsage] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'hari' | 'minggu' | 'bulan' | 'tahun'>('minggu');

  // State untuk Pengaturan Akun
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'activate' | 'deactivate' | null }>({ open: false, action: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const [updateCustomer, { loading: updatingCustomer }] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomer();
      setSnackbar({ open: true, message: 'Status akun berhasil diperbarui', severity: 'success' });
      setConfirmDialog({ open: false, action: null });
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  const [konfirmasiLoket, { loading: konfirmasiLoading }] = useMutation(KONFIRMASI_PEMBAYARAN_LOKET, {
    onCompleted: () => {
      refetchCustomer();
      setSnackbar({ open: true, message: 'Akun berhasil diaktifkan dan tagihan dilunasi via loket', severity: 'success' });
      setConfirmDialog({ open: false, action: null });
    },
    onError: (err) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  // GraphQL Query - Get Customer Detail
  const {
    loading,
    error: graphqlError,
    data: customerData,
    refetch: refetchCustomer,
  } = useQuery(GET_CUSTOMER, {
    variables: { id: customerId },
    skip: !customerId,
    fetchPolicy: 'network-only',
  });

  // Memoized customer data mapping
  const customer = useMemo(() => {
    if (!(customerData as any)?.getPengguna) return null;
    const c = (customerData as any).getPengguna;
    return {
      id: c._id,
      NIK: c.nik || 'N/A',
      namaLengkap: c.namaLengkap || 'N/A',
      email: c.email || 'N/A',
      noHP: c.noHP || 'N/A',
      alamat: c.address || '-',
      customerType: c.customerType || 'rumah_tangga',
      accountStatus: c.accountStatus || 'active',
      isVerified: c.isVerified,
      registrationDate: new Date(c.createdAt),
    };
  }, [customerData]);

  // GraphQL Query - Get Meteran by Pelanggan ID
  const {
    data: meteranData,
    loading: loadingMeteran,
  } = useQuery(GET_METERAN_BY_PELANGGAN, {
    variables: { idPelanggan: customerId },
    skip: !customerId,
    fetchPolicy: 'network-only',
  });

  const meteranInfo = useMemo(() => {
    const list = (meteranData as any)?.getMeteranByPelanggan;
    if (!list || list.length === 0) return null;
    // Use the first (or most recent) meter
    const m = list[0];
    return {
      _id: m._id,
      meterNumber: m.nomorMeteran || 'N/A',
      accountNumber: m.nomorAkun || 'N/A',
      tariffCategory: m.idKelompokPelanggan?.namaKelompok || 'N/A',
      installationDate: m.createdAt ? new Date(m.createdAt) : null,
      totalUsage: m.totalPemakaian || 0,
      unpaidUsage: m.pemakaianBelumTerbayar || 0,
      alamat: m.idKoneksiData?.alamat || '-',
    };
  }, [meteranData]);

  const meteranId = meteranInfo?._id || null;

  // GraphQL Query - Get Billing History by Meteran ID
  const {
    loading: loadingBillings,
    error: billingError,
    data: billingData,
  } = useQuery(GET_TAGIHAN_BY_METERAN, {
    variables: { idMeteran: meteranId || '' },
    skip: !meteranId || tabValue !== 0,
    fetchPolicy: 'network-only',
  });

  const billings = useMemo(() => {
    if (!(billingData as any)?.getTagihanByMeteran) return [];
    return (billingData as any).getTagihanByMeteran.map((bill: any) => ({
      id: bill._id,
      period: bill.periode,
      usage: bill.totalPemakaian || 0,
      amount: bill.totalBiaya || 0,
      status:
        bill.statusPembayaran === 'Settlement' ||
        bill.statusPembayaran === 'Lunas'
          ? 'paid'
          : 'unpaid',
      paidDate: bill.tanggalPembayaran ? new Date(bill.tanggalPembayaran) : null,
      biayaAir: bill.biaya || 0,
      biayaBeban: bill.biayaBeban || 0,
      pemakaianAwal: bill.penggunaanSebelum || 0,
      pemakaianAkhir: bill.penggunaanSekarang || 0,
    }));
  }, [billingData]);

  useEffect(() => {
    if (meteranId && tabValue === 1) {
      fetchHistoryUsage();
    }
  }, [meteranId, tabValue, historyFilter]);

  const fetchHistoryUsage = async () => {
    if (!meteranId || !customerId) return;
    try {
      setLoadingHistory(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/history/getHistory/${customerId}/${meteranId}?filter=${historyFilter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.data) {
          const mappedHistory = data.data.map((item: any) => {
            let timeLabel = '';
            switch (historyFilter) {
              case 'hari':
                timeLabel = item._id.time || '-';
                break;
              case 'minggu':
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                timeLabel = days[item._id.day - 1] || '-';
                break;
              case 'bulan':
                timeLabel = `Minggu ${item._id.week}` || '-';
                break;
              case 'tahun':
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                timeLabel = months[item._id.month - 1] || '-';
                break;
            }
            return {
              time: timeLabel,
              usage: item.totalUsedWater || 0,
              count: item.count || 0,
            };
          });
          setHistoryUsage(mappedHistory);
        }
      }
    } catch (error: any) {
      console.error('Error fetching history usage:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading || loadingMeteran) {
    return (
      <AdminLayout title='Detail Pelanggan'>
        <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (graphqlError || !customer) {
    return (
      <AdminLayout title='Detail Pelanggan'>
        <Alert severity='error'>
          {graphqlError?.message || 'Pelanggan tidak ditemukan'}
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/customers')}>
            Kembali ke Daftar Pelanggan
          </Button>
          <Button startIcon={<Refresh />} variant='outlined' onClick={() => refetchCustomer()}>
            Coba Lagi
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  if (authLoading || !isAuthenticated) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <AdminLayout title={`Detail Pelanggan - ${customer.namaLengkap}`}>
      <Box sx={{ mb: 3 }}>
        {billingError && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Gagal memuat riwayat tagihan: {(billingError as any).message}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBack />} onClick={() => router.push('/customers')}>
              Kembali
            </Button>
            <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
              Detail Pelanggan
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Edit />}
            onClick={() => router.push(`/customers/registration?edit=${customerId}`)}
          >
            Edit Pelanggan
          </Button>
        </Box>

        {/* Customer Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                    {customer.namaLengkap?.charAt(0) || '?'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
                      {customer.namaLengkap}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      NIK: {customer.NIK}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Chip
                        icon={<Person />}
                        label={
                          customer.customerType === 'rumah_tangga'
                            ? 'Rumah Tangga'
                            : customer.customerType
                        }
                        color='primary'
                        variant='outlined'
                      />
                      <Chip
                        icon={customer.accountStatus === 'active' ? <CheckCircle /> : <Warning />}
                        label={customer.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        color={customer.accountStatus === 'active' ? 'success' : 'default'}
                      />
                      {customer.isVerified && (
                        <Chip icon={<CheckCircle />} label='Terverifikasi' color='info' size='small' />
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant='body2'>{customer.noHP}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant='body2'>{customer.email}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant='body2'>{customer.alamat}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant='outlined' sx={{ bgcolor: 'primary.50' }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WaterDrop color='primary' />
                      Info Meteran
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {meteranInfo ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant='caption' color='text.secondary'>No. Meteran</Typography>
                          <Typography variant='body1' sx={{ fontWeight: 600 }}>{meteranInfo.meterNumber}</Typography>
                        </Box>
                        <Box>
                          <Typography variant='caption' color='text.secondary'>No. Akun</Typography>
                          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {meteranInfo.accountNumber}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant='caption' color='text.secondary'>Kategori Tarif</Typography>
                          <Chip label={meteranInfo.tariffCategory} size='small' color='primary' sx={{ mt: 0.5 }} />
                        </Box>
                        <Box>
                          <Typography variant='caption' color='text.secondary'>Total Pemakaian</Typography>
                          <Typography variant='body1' sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {meteranInfo.totalUsage || 0} m³
                          </Typography>
                        </Box>
                        {meteranInfo.unpaidUsage > 0 && (
                          <Box>
                            <Typography variant='caption' color='text.secondary'>Belum Terbayar</Typography>
                            <Typography variant='body1' sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {meteranInfo.unpaidUsage} m³
                            </Typography>
                          </Box>
                        )}
                        <Divider />
                        {meteranInfo.installationDate && (
                          <Box>
                            <Typography variant='caption' color='text.secondary'>Tgl. Instalasi</Typography>
                            <Typography variant='body2'>
                              {meteranInfo.installationDate.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        )}
                        {meteranInfo.alamat && meteranInfo.alamat !== '-' && (
                          <Box>
                            <Typography variant='caption' color='text.secondary'>Alamat Instalasi</Typography>
                            <Typography variant='body2'>{meteranInfo.alamat}</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Alert severity='info' sx={{ mt: 1 }}>Belum ada meteran terpasang</Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab icon={<Receipt />} label='Riwayat Tagihan' iconPosition='start' />
              <Tab icon={<History />} label='Riwayat Pembacaan' iconPosition='start' />
              <Tab icon={<Settings />} label='Pengaturan Akun' iconPosition='start' />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {loadingBillings ? (
              <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
            ) : billings.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Periode</TableCell>
                      <TableCell align='right'>Pemakaian Awal</TableCell>
                      <TableCell align='right'>Pemakaian Akhir</TableCell>
                      <TableCell align='right'>Total (m³)</TableCell>
                      <TableCell align='right'>Biaya Air</TableCell>
                      <TableCell align='right'>Biaya Beban</TableCell>
                      <TableCell align='right'>Total Tagihan</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tanggal Bayar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billings.map((billing: any) => (
                      <TableRow key={billing.id}>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>{billing.period}</Typography>
                        </TableCell>
                        <TableCell align='right'>{billing.pemakaianAwal.toFixed(2)}</TableCell>
                        <TableCell align='right'>{billing.pemakaianAkhir.toFixed(2)}</TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {billing.usage.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(billing.biayaAir)}
                        </TableCell>
                        <TableCell align='right'>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(billing.biayaBeban)}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(billing.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={billing.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                            color={billing.status === 'paid' ? 'success' : 'warning'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          {billing.paidDate
                            ? billing.paidDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity='info'>
                {meteranInfo ? 'Belum ada riwayat tagihan untuk meteran ini' : 'Pelanggan belum memiliki meteran'}
              </Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant='h6' gutterBottom>Riwayat Pemakaian Air</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {(['hari', 'minggu', 'bulan', 'tahun'] as const).map(f => (
                  <Chip
                    key={f}
                    label={f === 'hari' ? 'Hari Ini' : f === 'minggu' ? 'Minggu Ini' : f === 'bulan' ? 'Bulan Ini' : 'Tahun Ini'}
                    color={historyFilter === f ? 'primary' : 'default'}
                    onClick={() => setHistoryFilter(f)}
                    clickable
                  />
                ))}
              </Box>
            </Box>
            {loadingHistory ? (
              <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
            ) : historyUsage.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        {historyFilter === 'hari' && 'Jam'}
                        {historyFilter === 'minggu' && 'Hari'}
                        {historyFilter === 'bulan' && 'Minggu'}
                        {historyFilter === 'tahun' && 'Bulan'}
                      </TableCell>
                      <TableCell align='right'>Pemakaian (Liter)</TableCell>
                      <TableCell align='right'>Jumlah Pembacaan</TableCell>
                      <TableCell align='right'>Rata-rata (L/pembacaan)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyUsage.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell><Typography variant='body2' sx={{ fontWeight: 600 }}>{item.time}</Typography></TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {item.usage.toFixed(2)} L
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>{item.count}</TableCell>
                        <TableCell align='right'>
                          {item.count > 0 ? (item.usage / item.count).toFixed(2) : '0.00'} L
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                      <TableCell><Typography variant='body2' sx={{ fontWeight: 700 }}>TOTAL</Typography></TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {historyUsage.reduce((sum, item) => sum + item.usage, 0).toFixed(2)} L
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {historyUsage.reduce((sum, item) => sum + item.count, 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {(() => {
                            const totalUsage = historyUsage.reduce((sum, item) => sum + item.usage, 0);
                            const totalCount = historyUsage.reduce((sum, item) => sum + item.count, 0);
                            return totalCount > 0 ? (totalUsage / totalCount).toFixed(2) : '0.00';
                          })()} L
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity='info'>
                {meteranInfo
                  ? `Belum ada data pemakaian untuk filter "${historyFilter}"`
                  : 'Pelanggan belum memiliki meteran'}
              </Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Status Akun */}
              <Grid item xs={12} md={6}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                      Status Akun
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>Status Saat Ini</Typography>
                        <Chip
                          label={customer.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          color={customer.accountStatus === 'active' ? 'success' : 'error'}
                          size='small'
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>Verifikasi</Typography>
                        <Chip
                          label={customer.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                          color={customer.isVerified ? 'info' : 'default'}
                          size='small'
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>Tanggal Daftar</Typography>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {customer.registrationDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>Tipe Pelanggan</Typography>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {customer.customerType === 'rumah_tangga' ? 'Rumah Tangga' : customer.customerType}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {customer.accountStatus === 'inactive' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Alert severity='warning' sx={{ mb: 1 }}>
                          Akun ini nonaktif. Aktifkan dengan konfirmasi pelunasan tagihan via loket, atau aktifkan langsung tanpa pelunasan.
                        </Alert>
                        <Button
                          variant='contained'
                          color='success'
                          fullWidth
                          onClick={() => setConfirmDialog({ open: true, action: 'activate' })}
                        >
                          Aktifkan Akun (Konfirmasi Loket)
                        </Button>
                        <Button
                          variant='outlined'
                          color='success'
                          fullWidth
                          onClick={() => updateCustomer({ variables: { id: customerId, input: { accountStatus: 'active' } } })}
                          disabled={updatingCustomer}
                        >
                          Aktifkan Langsung (Tanpa Pelunasan)
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Alert severity='info' sx={{ mb: 1 }}>
                          Pemutusan akun hanya dapat dilakukan jika pelanggan menunggak minimal 3 bulan. Gunakan halaman Pemutusan.
                        </Alert>
                        <Button
                          variant='outlined'
                          color='error'
                          fullWidth
                          onClick={() => router.push('/operations/pemutusan')}
                        >
                          Ke Halaman Pemutusan
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Verifikasi & Edit Cepat */}
              <Grid item xs={12} md={6}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                      Verifikasi & Info
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>Status Verifikasi</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {customer.isVerified ? 'Data pelanggan sudah diverifikasi admin' : 'Belum diverifikasi oleh admin'}
                          </Typography>
                        </Box>
                        <Button
                          size='small'
                          variant={customer.isVerified ? 'outlined' : 'contained'}
                          color={customer.isVerified ? 'warning' : 'info'}
                          disabled={updatingCustomer}
                          onClick={() => updateCustomer({ variables: { id: customerId, input: { isVerified: !customer.isVerified } } })}
                        >
                          {customer.isVerified ? 'Batalkan Verifikasi' : 'Verifikasi Sekarang'}
                        </Button>
                      </Box>
                      <Divider />
                      <Typography variant='body2' color='text.secondary'>
                        Untuk mengubah data profil (nama, nomor HP, alamat, NIK), gunakan tombol <strong>Edit Pelanggan</strong> di bagian atas halaman.
                      </Typography>
                      <Button
                        variant='contained'
                        startIcon={<Edit />}
                        onClick={() => router.push(`/customers/registration?edit=${customerId}`)}
                        fullWidth
                      >
                        Edit Data Pelanggan
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>

      {/* Dialog Konfirmasi Aktivasi */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null })}>
        <DialogTitle>Konfirmasi Aktivasi Akun</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            Aksi ini akan menandai <strong>semua tagihan pending</strong> milik pelanggan ini sebagai <strong>Lunas (via Loket)</strong> dan mengaktifkan kembali akunnya.
          </Typography>
          <Alert severity='warning' sx={{ mt: 2 }}>
            Pastikan pelanggan sudah membayar semua tunggakan secara tunai di loket sebelum melanjutkan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })}>Batal</Button>
          <Button
            variant='contained'
            color='success'
            disabled={konfirmasiLoading}
            onClick={() => konfirmasiLoket({ variables: { userId: customerId } })}
          >
            {konfirmasiLoading ? 'Memproses...' : 'Ya, Konfirmasi & Aktifkan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </AdminLayout>
  );
}
