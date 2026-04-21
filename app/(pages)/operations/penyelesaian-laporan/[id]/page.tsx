import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getWorkOrder, getProgresWorkOrder, getLaporan } from '@/lib/graphql/teknisiServer';
import Link from 'next/link';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Divider, Button,
} from '@mui/material';
import { ArrowBack, OpenInNew, LocationOn } from '@mui/icons-material';

const fmtDate = (v: string) => {
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' | 'primary' }> = {
  menunggu_penugasan: { label: 'Menunggu Penugasan', color: 'warning' },
  ditolak: { label: 'Ditolak Teknisi', color: 'error' },
  sedang_dikerjakan: { label: 'Sedang Dikerjakan', color: 'info' },
  dikirim: { label: 'Dikirim', color: 'primary' },
  revisi: { label: 'Perlu Revisi', color: 'warning' },
  selesai: { label: 'Selesai', color: 'success' },
  dibatalkan: { label: 'Dibatalkan', color: 'error' },
};

const JENIS_LAPORAN: Record<string, string> = {
  AIR_TIDAK_MENGALIR: 'Air Tidak Mengalir',
  AIR_KERUH: 'Air Keruh',
  KEBOCORAN_PIPA: 'Kebocoran Pipa',
  METERAN_BERMASALAH: 'Meteran Bermasalah',
  KENDALA_LAINNYA: 'Kendala Lainnya',
};

const STATUS_LAPORAN: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  DITUNDA: { label: 'Ditunda', color: 'warning' },
  DITUGASKAN: { label: 'Ditugaskan', color: 'info' },
  DITINJAU_ADMIN: { label: 'Ditinjau Admin', color: 'info' },
  SEDANG_DIKERJAKAN: { label: 'Sedang Dikerjakan', color: 'info' },
  SELESAI: { label: 'Selesai', color: 'success' },
  DIBATALKAN: { label: 'Dibatalkan', color: 'error' },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body2'>{value || '-'}</Typography>
    </Box>
  );
}

export default async function PenyelesaianLaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const st = STATUS_WO[wo.status];

  // Fetch laporan if idLaporan is available
  let laporan: any = null;
  if (wo.idLaporan) {
    const lRes = await getLaporan(token, wo.idLaporan);
    laporan = (lRes.data as any)?.laporan;
  }

  const urlGambar: string[] = progres?.urlGambar ?? [];
  const laporanStatus = laporan ? STATUS_LAPORAN[laporan.Status] : null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button component={Link} href='/operations/penyelesaian-laporan' startIcon={<ArrowBack />} variant='text' size='small'>
          Kembali
        </Button>
        <Typography variant='h6' fontWeight={700}>Detail Work Order Penyelesaian Laporan</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: WO Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' fontWeight={700}>Informasi Work Order</Typography>
                <Chip label={st?.label ?? wo.status} color={(st?.color ?? 'default') as any} size='small' />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Row label='ID Work Order' value={<Typography variant='caption' sx={{ fontFamily: 'monospace' }}>{wo.id}</Typography>} />
              <Row label='Jenis Pekerjaan' value='Penyelesaian Laporan' />
              <Row label='Status Respon' value={wo.statusRespon} />
              {wo.alasanPenolakan && <Row label='Alasan Penolakan' value={wo.alasanPenolakan} />}
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
              <Row label='Dibuat' value={fmtDate(wo.createdAt)} />
              <Row label='Diperbarui' value={fmtDate(wo.updatedAt)} />
              {wo.catatanReview && <Row label='Catatan Review Admin' value={wo.catatanReview} />}
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

        {/* Middle: Laporan Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle1' fontWeight={700}>Data Laporan</Typography>
                {laporanStatus && (
                  <Chip label={laporanStatus.label} color={laporanStatus.color} size='small' />
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {!laporan ? (
                <Box>
                  <Typography color='text.secondary' variant='body2'>Data laporan tidak ditemukan</Typography>
                  {wo.idLaporan && (
                    <Row label='ID Laporan' value={<Typography variant='caption' sx={{ fontFamily: 'monospace' }}>{wo.idLaporan}</Typography>} />
                  )}
                </Box>
              ) : (
                <>
                  <Row label='Judul Laporan' value={laporan.NamaLaporan} />
                  <Row label='Jenis Masalah' value={JENIS_LAPORAN[laporan.JenisLaporan] || laporan.JenisLaporan} />
                  <Divider sx={{ my: 2 }} />
                  <Row label='Nama Pelapor' value={laporan.pengguna?.namaLengkap} />
                  <Row label='No HP' value={laporan.pengguna?.noHp} />
                  <Row label='Email' value={laporan.pengguna?.email} />
                  <Divider sx={{ my: 2 }} />
                  <Row label='Alamat Kejadian' value={laporan.Alamat} />
                  {laporan.Kordinat && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant='caption' color='text.secondary'>Koordinat</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant='body2'>
                          {laporan.Kordinat.latitude}, {laporan.Kordinat.longitude}
                        </Typography>
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<LocationOn fontSize='small' />}
                          sx={{ py: 0, px: 1, fontSize: 11 }}
                          onClick={() => {
                            // @ts-ignore
                            if (typeof window !== 'undefined') window.open(`https://maps.google.com/?q=${laporan.Kordinat.latitude},${laporan.Kordinat.longitude}`, '_blank');
                          }}
                        >
                          Maps
                        </Button>
                      </Box>
                    </Box>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant='caption' color='text.secondary'>Deskripsi Masalah</Typography>
                    <Typography variant='body2'>{laporan.Masalah || '-'}</Typography>
                  </Box>
                  {laporan.Catatan && (
                    <Row label='Catatan Pelanggan' value={laporan.Catatan} />
                  )}
                  <Row label='Dilaporkan' value={fmtDate(laporan.createdAt)} />
                  {laporan.imageUrl?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                        Foto dari Pelanggan ({laporan.imageUrl.length} foto)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {laporan.imageUrl.map((url: string, i: number) => (
                          <Box
                            key={i}
                            component='a'
                            href={url}
                            target='_blank'
                            rel='noopener noreferrer'
                            sx={{ display: 'block' }}
                          >
                            <Box
                              component='img'
                              src={url}
                              alt={`Foto ${i + 1}`}
                              sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Progres Penyelesaian */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>Progres Penyelesaian</Typography>
              <Divider sx={{ mb: 2 }} />
              {!progres ? (
                <Typography color='text.secondary' variant='body2'>Teknisi belum mengisi data progres</Typography>
              ) : (
                <>
                  {progres.catatan && <Row label='Catatan Teknisi' value={progres.catatan} />}
                  {urlGambar.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                        Foto Dokumentasi Pekerjaan ({urlGambar.length} foto)
                      </Typography>
                      <Grid container spacing={1.5}>
                        {urlGambar.map((url, i) => (
                          <Grid item xs={6} key={i}>
                            <Box
                              component='a'
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{ display: 'block', textDecoration: 'none' }}
                            >
                              <Box
                                component='img'
                                src={url}
                                alt={`Foto ${i + 1}`}
                                sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
                              />
                              <Typography variant='caption' color='primary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                Foto {i + 1} <OpenInNew sx={{ fontSize: 12 }} />
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    !progres.catatan && (
                      <Typography color='text.secondary' variant='body2'>Belum ada dokumentasi</Typography>
                    )
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
