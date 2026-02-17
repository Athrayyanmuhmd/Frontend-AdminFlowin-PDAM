'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
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
import { useQuery } from '@apollo/client/react';
import AdminLayout from '../../../../layouts/AdminLayout';
import { GET_CUSTOMER } from '../../../../../lib/graphql/queries/customers';
import { GET_TAGIHAN_BY_METERAN } from '../../../../../lib/graphql/queries/billing';

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

  const [tabValue, setTabValue] = useState(0);
  const [historyUsage, setHistoryUsage] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<
    'hari' | 'minggu' | 'bulan' | 'tahun'
  >('minggu');

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

    const customerInfo = (customerData as any).getPengguna;
    console.log('✅ Customer GraphQL data:', customerInfo);

    return {
      id: customerInfo._id,
      NIK: customerInfo.nik || 'N/A',
      namaLengkap: customerInfo.namaLengkap || 'N/A',
      email: customerInfo.email || 'N/A',
      noHP: customerInfo.noHP || 'N/A',
      alamat: customerInfo.address || 'N/A',
      customerType: customerInfo.customerType || 'rumah_tangga',
      accountStatus: customerInfo.accountStatus || 'active',
      registrationDate: new Date(customerInfo.createdAt),
      meteran: null as any, // Will be populated from separate query if needed
    };
  }, [customerData]);

  // GraphQL Query - Get Billing History (only if we have meteranId from customer)
  // Note: We need meteranId from customer, but customer query doesn't populate meteranId
  // So we'll keep using REST for billing history for now (backend limitation)
  const [meteranId, setMeteranId] = useState<string | null>(null);


  useEffect(() => {
    if (meteranId && tabValue === 1) {
      fetchHistoryUsage();
    }
  }, [meteranId, tabValue, historyFilter]);

  // GraphQL Query - Get Billing History by Meteran ID
  const {
    loading: loadingBillings,
    error: billingError,
    data: billingData,
    refetch: refetchBillings,
  } = useQuery(GET_TAGIHAN_BY_METERAN, {
    variables: { idMeteran: meteranId || '' },
    skip: !meteranId || tabValue !== 0, // Only fetch when on billing tab and have meteranId
    fetchPolicy: 'network-only',
  });

  // Memoized billing data mapping
  const billings = useMemo(() => {
    if (!(billingData as any)?.getTagihanByMeteran) return [];

    console.log('✅ Billing GraphQL data:', (billingData as any).getTagihanByMeteran);

    return (billingData as any).getTagihanByMeteran.map((bill: any) => ({
      id: bill._id,
      period: bill.periode,
      usage: bill.totalPemakaian,
      amount: bill.totalBiaya,
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

  const fetchHistoryUsage = async () => {
    if (!meteranInfo) return;

    try {
      setLoadingHistory(true);
      console.log('🔄 Fetching history usage for customer:', customerId);
      console.log('Filter:', historyFilter);

      const currentMeteranId = meteranInfo.accountNumber; // This is the _id of meteran

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/history/getHistory/${customerId}/${currentMeteranId}?filter=${historyFilter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ History usage data:', data);

        if (data.status === 200 && data.data) {
          // Map the aggregated data
          const mappedHistory = data.data.map((item: any) => {
            let timeLabel = '';

            switch (historyFilter) {
              case 'hari':
                timeLabel = item._id.time || '-';
                break;
              case 'minggu':
                const days = [
                  'Minggu',
                  'Senin',
                  'Selasa',
                  'Rabu',
                  'Kamis',
                  'Jumat',
                  'Sabtu',
                ];
                timeLabel = days[item._id.day - 1] || '-';
                break;
              case 'bulan':
                timeLabel = `Minggu ${item._id.week}` || '-';
                break;
              case 'tahun':
                const months = [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'Mei',
                  'Jun',
                  'Jul',
                  'Agu',
                  'Sep',
                  'Okt',
                  'Nov',
                  'Des',
                ];
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
          console.log('✅ Mapped history usage:', mappedHistory);
        }
      } else {
        console.warn('⚠️ History API returned error');
      }
    } catch (error: any) {
      console.error('❌ Error fetching history usage:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // State untuk menyimpan meteran data yang di-fetch dari REST
  const [meteranInfo, setMeteranInfo] = useState<any>(null);

  // Update meteran info fetch
  useEffect(() => {
    const fetchMeteran = async () => {
      if (!customer?.id) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/customer/${customer.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.meteranId) {
            const meteranData = data.data.meteranId;
            setMeteranId(meteranData._id);
            setMeteranInfo({
              meterNumber: meteranData.noMeteran || 'N/A',
              accountNumber: meteranData._id || 'N/A',
              tariffCategory:
                meteranData.kelompokPelangganId?.namaKelompok ||
                meteranData.kelompokPelangganId?.tarif ||
                'N/A',
              installationDate: meteranData.createdAt
                ? new Date(meteranData.createdAt)
                : null,
              totalUsage: meteranData.totalPemakaian || 0,
              unpaidUsage: meteranData.pemakaianBelumTerbayar || 0,
              dueDate: meteranData.jatuhTempo
                ? new Date(meteranData.jatuhTempo)
                : null,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching meteran:', error);
      }
    };

    if (customer) {
      fetchMeteran();
    }
  }, [customer]);

  if (loading) {
    return (
      <AdminLayout title='Detail Pelanggan'>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/customers')}
          >
            Kembali ke Daftar Pelanggan
          </Button>
          <Button
            startIcon={<Refresh />}
            variant='outlined'
            onClick={() => refetchCustomer()}
          >
            Coba Lagi
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Detail Pelanggan - ${customer.namaLengkap}`}>
      <Box sx={{ mb: 3 }}>
        {graphqlError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(graphqlError as any).message}
          </Alert>
        )}
        {billingError && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Gagal memuat riwayat tagihan: {(billingError as any).message}
          </Alert>
        )}

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/customers')}
            >
              Kembali
            </Button>
            <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
              Detail Pelanggan
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Edit />}
            onClick={() =>
              router.push(`/customers/registration?edit=${customerId}`)
            }
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
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                    }}
                  >
                    {customer.namaLengkap?.charAt(0) || '?'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
                      {customer.namaLengkap}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      NIK: {customer.NIK}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}
                    >
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
                        icon={
                          customer.accountStatus === 'active' ? (
                            <CheckCircle />
                          ) : (
                            <Warning />
                          )
                        }
                        label={
                          customer.accountStatus === 'active'
                            ? 'Aktif'
                            : 'Tidak Aktif'
                        }
                        color={
                          customer.accountStatus === 'active'
                            ? 'success'
                            : 'default'
                        }
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Phone
                            sx={{ fontSize: 20, color: 'text.secondary' }}
                          />
                          <Typography variant='body2'>
                            {customer.noHP}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Email
                            sx={{ fontSize: 20, color: 'text.secondary' }}
                          />
                          <Typography variant='body2'>
                            {customer.email}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                          }}
                        >
                          <LocationOn
                            sx={{ fontSize: 20, color: 'text.secondary' }}
                          />
                          <Typography variant='body2'>
                            {customer.alamat}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant='outlined' sx={{ bgcolor: 'primary.50' }}>
                  <CardContent>
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <WaterDrop color='primary' />
                      Info Meteran
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {meteranInfo ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        <Box>
                          <Typography variant='caption' color='text.secondary'>
                            No. Meteran
                          </Typography>
                          <Typography variant='body1' sx={{ fontWeight: 600 }}>
                            {meteranInfo.meterNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant='caption' color='text.secondary'>
                            ID Meteran
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {meteranInfo.accountNumber}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant='caption' color='text.secondary'>
                            Kategori Tarif
                          </Typography>
                          <Chip
                            label={meteranInfo.tariffCategory}
                            size='small'
                            color='primary'
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant='caption' color='text.secondary'>
                            Total Pemakaian
                          </Typography>
                          <Typography
                            variant='body1'
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                          >
                            {meteranInfo.totalUsage || 0} m³
                          </Typography>
                        </Box>
                        {meteranInfo.unpaidUsage > 0 && (
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Belum Terbayar
                            </Typography>
                            <Typography
                              variant='body1'
                              sx={{ fontWeight: 600, color: 'warning.main' }}
                            >
                              {meteranInfo.unpaidUsage} m³
                            </Typography>
                          </Box>
                        )}
                        {meteranInfo.dueDate && (
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Jatuh Tempo
                            </Typography>
                            <Typography
                              variant='body1'
                              color={
                                new Date(meteranInfo.dueDate) < new Date()
                                  ? 'error.main'
                                  : 'text.primary'
                              }
                            >
                              {new Date(
                                meteranInfo.dueDate
                              ).toLocaleDateString('id-ID')}
                            </Typography>
                          </Box>
                        )}
                        <Divider />
                        {meteranInfo.installationDate && (
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Tgl. Instalasi
                            </Typography>
                            <Typography variant='body2'>
                              {meteranInfo.installationDate.toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Alert severity='info' sx={{ mt: 1 }}>
                        Belum ada meteran terpasang
                      </Alert>
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
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
            >
              <Tab
                icon={<Receipt />}
                label='Riwayat Tagihan'
                iconPosition='start'
              />
              <Tab
                icon={<History />}
                label='Riwayat Pembacaan'
                iconPosition='start'
              />
              <Tab
                icon={<Settings />}
                label='Pengaturan Akun'
                iconPosition='start'
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {loadingBillings ? (
              <Box display='flex' justifyContent='center' py={4}>
                <CircularProgress />
              </Box>
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
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {billing.period}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {billing.pemakaianAwal.toFixed(2)}
                        </TableCell>
                        <TableCell align='right'>
                          {billing.pemakaianAkhir.toFixed(2)}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                          >
                            {billing.usage.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(billing.biayaAir)}
                        </TableCell>
                        <TableCell align='right'>
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(billing.biayaBeban)}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(billing.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              billing.status === 'paid'
                                ? 'Lunas'
                                : 'Belum Bayar'
                            }
                            color={
                              billing.status === 'paid' ? 'success' : 'warning'
                            }
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          {billing.paidDate
                            ? billing.paidDate.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity='info'>
                {meteranInfo
                  ? 'Belum ada riwayat tagihan untuk meteran ini'
                  : 'Pelanggan belum memiliki meteran'}
              </Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant='h6' gutterBottom>
                Riwayat Pemakaian Air
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label='Hari Ini'
                  color={historyFilter === 'hari' ? 'primary' : 'default'}
                  onClick={() => setHistoryFilter('hari')}
                  clickable
                />
                <Chip
                  label='Minggu Ini'
                  color={historyFilter === 'minggu' ? 'primary' : 'default'}
                  onClick={() => setHistoryFilter('minggu')}
                  clickable
                />
                <Chip
                  label='Bulan Ini'
                  color={historyFilter === 'bulan' ? 'primary' : 'default'}
                  onClick={() => setHistoryFilter('bulan')}
                  clickable
                />
                <Chip
                  label='Tahun Ini'
                  color={historyFilter === 'tahun' ? 'primary' : 'default'}
                  onClick={() => setHistoryFilter('tahun')}
                  clickable
                />
              </Box>
            </Box>

            {loadingHistory ? (
              <Box display='flex' justifyContent='center' py={4}>
                <CircularProgress />
              </Box>
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
                      <TableCell align='right'>
                        Rata-rata (L/pembacaan)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyUsage.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {item.time}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='body2'
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                          >
                            {item.usage.toFixed(2)} L
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>{item.count}</TableCell>
                        <TableCell align='right'>
                          {item.count > 0
                            ? (item.usage / item.count).toFixed(2)
                            : '0.00'}{' '}
                          L
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                      <TableCell>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          TOTAL
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='body2'
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          {historyUsage
                            .reduce((sum, item) => sum + item.usage, 0)
                            .toFixed(2)}{' '}
                          L
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {historyUsage.reduce(
                            (sum, item) => sum + item.count,
                            0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {(() => {
                            const totalUsage = historyUsage.reduce(
                              (sum, item) => sum + item.usage,
                              0
                            );
                            const totalCount = historyUsage.reduce(
                              (sum, item) => sum + item.count,
                              0
                            );
                            return totalCount > 0
                              ? (totalUsage / totalCount).toFixed(2)
                              : '0.00';
                          })()}{' '}
                          L
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
            <Alert severity='info'>
              Fitur pengaturan akun akan segera tersedia
            </Alert>
          </TabPanel>
        </Card>
      </Box>
    </AdminLayout>
  );
}
