'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { getWorkOrder, getProgresWorkOrder } from '@/lib/graphql/teknisiServer';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Person,
  Engineering,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';

const fmtDate = (v?: string) => {
  if (!v) return '-';
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const STATUS_WO: Record<
  string,
  { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }
> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: { xs: 110, sm: 160 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={500}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

export default function SurveyDataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  const [wo, setWo] = useState<any>(null);
  const [progres, setProgres] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const [woRes, progresRes] = await Promise.all([
        getWorkOrder(token, id),
        getProgresWorkOrder(token, id),
      ]);
      if (woRes.errors?.length) {
        setError(woRes.errors[0].message);
        return;
      }
      setWo((woRes.data as any)?.workOrder ?? null);
      setProgres((progresRes.data as any)?.progresWorkOrder ?? null);
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  if (authLoading || !isAuthenticated) return null;

  const s = wo ? STATUS_WO[wo.status] : null;

  return (
    <AdminLayout title='Detail Survei'>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            size='small'
          >
            Kembali
          </Button>
          <Typography variant='h5' fontWeight={700}>
            Detail Data Survei
          </Typography>
          {s && <Chip label={s.label} color={s.color} size='small' />}
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !wo ? (
          <Alert severity='warning'>Data tidak ditemukan</Alert>
        ) : (
          <Grid container spacing={2}>
            {/* Work Order Info */}
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Person color='primary' />
                    <Typography variant='h6' fontWeight={700}>
                      Informasi Work Order
                    </Typography>
                  </Box>
                  <InfoRow label='ID Work Order' value={wo.id} />
                  <InfoRow
                    label='Pelanggan'
                    value={wo.koneksiData?.pelanggan?.namaLengkap}
                  />
                  <InfoRow
                    label='No. HP'
                    value={wo.koneksiData?.pelanggan?.noHp}
                  />
                  <InfoRow label='Alamat' value={wo.koneksiData?.alamat} />
                  <InfoRow
                    label='Kelurahan / Kecamatan'
                    value={[
                      wo.koneksiData?.kelurahan,
                      wo.koneksiData?.kecamatan,
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  />
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 2,
                      mb: 1,
                    }}
                  >
                    <Engineering color='action' fontSize='small' />
                    <Typography variant='subtitle2'>Teknisi</Typography>
                  </Box>
                  <InfoRow
                    label='Nama'
                    value={wo.teknisiPenanggungJawab?.namaLengkap}
                  />
                  <InfoRow label='NIP' value={wo.teknisiPenanggungJawab?.nip} />
                  <InfoRow
                    label='Divisi'
                    value={wo.teknisiPenanggungJawab?.divisi}
                  />
                  <Divider sx={{ my: 1 }} />
                  <InfoRow
                    label='Disubmit pada'
                    value={fmtDate(wo.updatedAt)}
                  />
                  {wo.catatanReview && (
                    <InfoRow label='Catatan Review' value={wo.catatanReview} />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Progres Data Survei */}
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <LocationOn color='primary' />
                    <Typography variant='h6' fontWeight={700}>
                      Data Hasil Survei
                    </Typography>
                  </Box>
                  {!progres ? (
                    <Alert severity='info'>Data progres tidak tersedia</Alert>
                  ) : (
                    <>
                      <InfoRow
                        label='Diameter Pipa'
                        value={
                          progres.diameterPipa != null
                            ? `${progres.diameterPipa} mm`
                            : null
                        }
                      />
                      <InfoRow
                        label='Jumlah Penghuni'
                        value={
                          progres.jumlahPenghuni != null
                            ? `${progres.jumlahPenghuni} orang`
                            : null
                        }
                      />
                      <InfoRow
                        label='Standar'
                        value={
                          progres.standar != null ? (
                            <Chip
                              label={
                                progres.standar
                                  ? 'Sesuai Standar'
                                  : 'Tidak Sesuai'
                              }
                              color={progres.standar ? 'success' : 'warning'}
                              size='small'
                            />
                          ) : null
                        }
                      />
                      {progres.koordinat && (
                        <InfoRow
                          label='Koordinat'
                          value={
                            <Box>
                              <Typography variant='body2'>
                                Lat: {progres.koordinat.latitude}
                              </Typography>
                              <Typography variant='body2'>
                                Long: {progres.koordinat.longitude}
                              </Typography>
                              <Button
                                size='small'
                                variant='text'
                                sx={{ p: 0, mt: 0.5 }}
                                onClick={() =>
                                  window.open(
                                    `https://maps.google.com/?q=${progres.koordinat.latitude},${progres.koordinat.longitude}`,
                                    '_blank'
                                  )
                                }
                              >
                                Lihat di Google Maps
                              </Button>
                            </Box>
                          }
                        />
                      )}
                      <InfoRow label='Catatan' value={progres.catatan} />

                      {/* Photos */}
                      {(progres.urlJaringan || progres.urlPosisiBak) && (
                        <Box sx={{ mt: 2 }}>
                          {/* <InfoRow label='Posisi Meteran' value={progres.posisiMeteran} /> */}
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>
                            Foto / Dokumen
                          </Typography>
                          <Grid container spacing={1}>
                            {progres.posisiMeteran && (
                              <Grid item xs={12} sm={6}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Posisi Meteran
                                </Typography>
                                <Box
                                  component='img'
                                  src={progres.posisiMeteran}
                                  alt='Jaringan'
                                  sx={{
                                    width: '100%',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    mt: 0.5,
                                  }}
                                  onClick={() =>
                                    window.open(progres.posisiMeteran, '_blank')
                                  }
                                />
                              </Grid>
                            )}
                            {progres.urlJaringan && (
                              <Grid item xs={12} sm={6}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Jaringan
                                </Typography>
                                <Box
                                  component='img'
                                  src={progres.urlJaringan}
                                  alt='Jaringan'
                                  sx={{
                                    width: '100%',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    mt: 0.5,
                                  }}
                                  onClick={() =>
                                    window.open(progres.urlJaringan, '_blank')
                                  }
                                />
                              </Grid>
                            )}
                            {progres.urlPosisiBak && (
                              <Grid item xs={12} sm={6}>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Posisi Bak
                                </Typography>
                                <Box
                                  component='img'
                                  src={progres.urlPosisiBak}
                                  alt='Posisi Bak'
                                  sx={{
                                    width: '100%',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    mt: 0.5,
                                  }}
                                  onClick={() =>
                                    window.open(progres.urlPosisiBak, '_blank')
                                  }
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AdminLayout>
  );
}
