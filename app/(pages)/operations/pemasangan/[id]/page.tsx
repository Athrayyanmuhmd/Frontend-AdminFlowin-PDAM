export const dynamic = 'force-dynamic';
import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getWorkOrder, getProgresWorkOrder } from '@/lib/graphql/teknisiServer';
import Link from 'next/link';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Divider, Button,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body2'>{value || '-'}</Typography>
    </Box>
  );
}

export default async function PemasanganDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value ?? '';

  const [woRes, progresRes] = await Promise.all([
    getWorkOrder(token, id),
    getProgresWorkOrder(token, id),
  ]);

  const wo = (woRes.data as any)?.workOrder;
  if (!wo) notFound();

  const progres = (progresRes.data as any)?.progresWorkOrder;
  const s = STATUS_WO[wo.status];
  const photos = [
    { label: 'Foto Rumah', url: progres?.fotoRumah },
    { label: 'Foto Meteran', url: progres?.fotoMeteran },
    { label: 'Foto Meteran & Rumah', url: progres?.fotoMeteranDanRumah },
  ].filter(p => p.url);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button component={Link} href='/operations/pemasangan' startIcon={<ArrowBack />} variant='text' size='small'>
          Kembali
        </Button>
        <Typography variant='h6' fontWeight={700}>Detail Pemasangan</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: WO Info */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' fontWeight={700}>Informasi Work Order</Typography>
                <Chip label={s?.label ?? wo.status} color={s?.color ?? 'default'} size='small' />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Row label='Pelanggan' value={wo.koneksiData?.pelanggan?.namaLengkap} />
              <Row label='No HP' value={wo.koneksiData?.pelanggan?.noHp} />
              <Row label='Alamat' value={wo.koneksiData?.alamat} />
              <Row label='Kelurahan' value={wo.koneksiData?.kelurahan} />
              <Row label='Kecamatan' value={wo.koneksiData?.kecamatan} />
              <Divider sx={{ my: 2 }} />
              <Row label='Teknisi PJ' value={wo.teknisiPenanggungJawab?.namaLengkap} />
              <Row label='NIP' value={wo.teknisiPenanggungJawab?.nip} />
              <Row label='Divisi' value={wo.teknisiPenanggungJawab?.divisi} />
              {wo.tim?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='caption' color='text.secondary'>Tim</Typography>
                  {wo.tim.map((t: any) => (
                    <Typography key={t.id} variant='body2'>{t.namaLengkap} ({t.nip})</Typography>
                  ))}
                </>
              )}
              <Divider sx={{ my: 2 }} />
              <Row label='Tanggal Update' value={fmtDate(wo.updatedAt)} />
              {wo.catatanReview && <Row label='Catatan Review' value={wo.catatanReview} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Progres Pemasangan */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>Data Pemasangan</Typography>
              <Divider sx={{ mb: 2 }} />
              {!progres ? (
                <Typography color='text.secondary'>Belum ada data progres pemasangan</Typography>
              ) : (
                <>
                  <Row label='Seri Meteran' value={progres.seriMeteran} />
                  {progres.catatan && <Row label='Catatan Teknisi' value={progres.catatan} />}
                  {photos.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>Foto Dokumentasi</Typography>
                      <Grid container spacing={2}>
                        {photos.map(p => (
                          <Grid item xs={12} sm={4} key={p.label}>
                            <Box
                              component='a'
                              href={p.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{ display: 'block', textDecoration: 'none' }}
                            >
                              <Box
                                component='img'
                                src={p.url}
                                alt={p.label}
                                sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
                              />
                              <Typography variant='caption' color='primary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                {p.label} <OpenInNew sx={{ fontSize: 12 }} />
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
