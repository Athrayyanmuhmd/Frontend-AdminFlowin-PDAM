'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { getWorkOrder, getProgresWorkOrder } from '@/lib/graphql/teknisiServer';
import AdminLayout from '../../../../layouts/AdminLayout';
import PageBreadcrumb from '../../../../components/ui/PageBreadcrumb';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Divider, Button,
  CircularProgress, Alert,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';

const fmtDate = (v?: string) => {
  if (!v) return '-';
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' | 'primary' }> = {
  menunggu_penugasan: { label: 'Menunggu Penugasan', color: 'warning' },
  ditolak:            { label: 'Ditolak Teknisi',    color: 'error' },
  sedang_dikerjakan:  { label: 'Sedang Dikerjakan',  color: 'info' },
  dikirim:            { label: 'Dikirim',             color: 'primary' },
  revisi:             { label: 'Perlu Revisi',        color: 'warning' },
  selesai:            { label: 'Selesai',             color: 'success' },
  dibatalkan:         { label: 'Dibatalkan',          color: 'error' },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body2'>{value || '-'}</Typography>
    </Box>
  );
}

function KondisiChip({ nilai, type }: { nilai?: string; type: 'daya' | 'koneksi' }) {
  if (!nilai) return <Typography variant='body2'>-</Typography>;
  if (type === 'daya') {
    return (
      <Chip size='small' variant='outlined'
        label={nilai === 'menyala' ? 'Menyala' : 'Mati'}
        color={nilai === 'menyala' ? 'success' : 'error'}
      />
    );
  }
  return (
    <Chip size='small' variant='outlined'
      label={nilai === 'terkoneksi' ? 'Terkoneksi' : 'Tidak Terkoneksi'}
      color={nilai === 'terkoneksi' ? 'success' : 'error'}
    />
  );
}

function FotoGrid({ urls, label }: { urls: string[]; label: string }) {
  if (!urls || urls.length === 0) {
    return <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>Tidak ada foto</Typography>;
  }
  return (
    <Box>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
        {label} ({urls.length} foto)
      </Typography>
      <Grid container spacing={1}>
        {urls.map((url, i) => (
          <Grid item xs={6} key={i}>
            <Box component='a' href={url} target='_blank' rel='noopener noreferrer' sx={{ display: 'block', textDecoration: 'none' }}>
              <Box
                component='img' src={url} alt={`Foto ${i + 1}`}
                sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
              />
              <Typography variant='caption' color='primary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                Foto {i + 1} <OpenInNew sx={{ fontSize: 12 }} />
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function MaintenanceDetailPage() {
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
    const token = localStorage.getItem('admin_token') ?? '';
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [woRes, progresRes] = await Promise.all([
        getWorkOrder(token, id),
        getProgresWorkOrder(token, id),
      ]);
      if (woRes.errors?.length) setError(woRes.errors[0].message);
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

  const st = wo ? STATUS_WO[wo.status] : null;
  const fotoSebelum: string[] = progres?.fotoSebelum ?? [];
  const fotoSetelah: string[] = progres?.fotoSetelah ?? [];

  return (
    <AdminLayout title='Detail Maintenance'>
      <PageBreadcrumb crumbs={[
        { label: 'Operasi' },
        { label: 'Data Maintenance', href: '/operations/maintenance' },
        { label: 'Detail' },
      ]} />
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button component={Link} href='/operations/maintenance' startIcon={<ArrowBack />} variant='text' size='small'>
            Kembali
          </Button>
          <Typography variant='h6' fontWeight={700}>Detail Work Order Maintenance</Typography>
          {st && <Chip label={st.label} color={st.color as any} size='small' />}
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : !wo ? (
          !error && <Alert severity='warning'>Data tidak ditemukan</Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Kiri: Info WO */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>Informasi Work Order</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Row label='Pelanggan' value={wo.koneksiData?.pelanggan?.namaLengkap} />
                  <Row label='No HP'     value={wo.koneksiData?.pelanggan?.noHp} />
                  <Row label='Alamat'    value={wo.koneksiData?.alamat} />
                  <Row label='Kelurahan' value={wo.koneksiData?.kelurahan} />
                  <Row label='Kecamatan' value={wo.koneksiData?.kecamatan} />
                  <Divider sx={{ my: 2 }} />
                  <Row label='Teknisi PJ' value={wo.teknisiPenanggungJawab?.namaLengkap} />
                  <Row label='NIP'        value={wo.teknisiPenanggungJawab?.nip} />
                  <Row label='Divisi'     value={wo.teknisiPenanggungJawab?.divisi} />
                  {wo.tim?.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>Tim</Typography>
                      {wo.tim.map((t: any) => (
                        <Typography key={t.id} variant='body2'>{t.namaLengkap} ({t.nip})</Typography>
                      ))}
                    </>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Row label='Dibuat'     value={fmtDate(wo.createdAt)} />
                  <Row label='Diperbarui' value={fmtDate(wo.updatedAt)} />
                  {wo.catatanReview && <Row label='Catatan Review' value={wo.catatanReview} />}
                  {wo.riwayatRespon?.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>Riwayat Respon</Typography>
                      {wo.riwayatRespon.map((r: any, i: number) => (
                        <Box key={i} sx={{ mb: 0.5, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                          <Typography variant='caption' fontWeight={600}>{r.aksi}</Typography>
                          {r.alasan && <Typography variant='caption' color='text.secondary' display='block'>{r.alasan}</Typography>}
                          <Typography variant='caption' color='text.disabled'>{r.oleh} · {fmtDate(r.tanggal)}</Typography>
                        </Box>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Kanan: Data Maintenance */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>Data Maintenance</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {!progres ? (
                    <Typography color='text.secondary'>Teknisi belum mengisi data progres maintenance</Typography>
                  ) : (
                    <Grid container spacing={3}>
                      {/* Kondisi Sebelum */}
                      <Grid item xs={12} sm={6}>
                        <Typography variant='overline' color='text.secondary' sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}>
                          Kondisi Sebelum
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>Daya</Typography>
                            <KondisiChip nilai={progres.kondisiSebelumDaya} type='daya' />
                          </Box>
                          <Box>
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>Koneksi</Typography>
                            <KondisiChip nilai={progres.kondisiSebelumKoneksi} type='koneksi' />
                          </Box>
                        </Box>
                        <FotoGrid urls={fotoSebelum} label='Foto Sebelum' />
                      </Grid>

                      {/* Kondisi Sesudah */}
                      <Grid item xs={12} sm={6}>
                        <Typography variant='overline' color='text.secondary' sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}>
                          Kondisi Sesudah
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>Daya</Typography>
                            <KondisiChip nilai={progres.kondisiSetelahDaya} type='daya' />
                          </Box>
                          <Box>
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>Koneksi</Typography>
                            <KondisiChip nilai={progres.kondisiSetelahKoneksi} type='koneksi' />
                          </Box>
                        </Box>
                        <FotoGrid urls={fotoSetelah} label='Foto Sesudah' />
                      </Grid>

                      {/* Catatan */}
                      {progres.catatan && (
                        <Grid item xs={12}>
                          <Divider sx={{ mb: 2 }} />
                          <Row label='Catatan Teknisi' value={progres.catatan} />
                        </Grid>
                      )}
                    </Grid>
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
