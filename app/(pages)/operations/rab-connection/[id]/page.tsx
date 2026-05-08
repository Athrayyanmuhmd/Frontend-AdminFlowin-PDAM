'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { getWorkOrder, getProgresWorkOrder } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { ArrowBack, Receipt, Person, Engineering } from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import PageBreadcrumb from '../../../../components/ui/PageBreadcrumb';

const fmtDate = (v?: string) => {
  if (!v) return '-';
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', py: 0.75, borderBottom: '1px solid', borderColor: 'divider', gap: 0.5 }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: { xs: 120, sm: 180 }, flexShrink: 0 }}>{label}</Typography>
      <Typography variant='body2' fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

export default function RabDetailPage() {
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
      if (woRes.errors?.length) { setError(woRes.errors[0].message); return; }
      setWo((woRes.data as any)?.workOrder ?? null);
      setProgres((progresRes.data as any)?.progresWorkOrder ?? null);
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  if (authLoading || !isAuthenticated) return null;
  const s = wo ? STATUS_WO[wo.status] : null;

  return (
    <AdminLayout title='Detail RAB'>
      <PageBreadcrumb crumbs={[
        { label: 'Operasi' },
        { label: 'Data RAB', href: '/operations/rab-connection' },
        { label: 'Detail' },
      ]} />
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()} size='small'>Kembali</Button>
          <Typography variant='h5' fontWeight={700}>Detail Data RAB</Typography>
          {s && <Chip label={s.label} color={s.color} size='small' />}
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : !wo ? (
          <Alert severity='warning'>Data tidak ditemukan</Alert>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Person color='primary' />
                    <Typography variant='h6' fontWeight={700}>Informasi Work Order</Typography>
                  </Box>
                  <InfoRow label='ID Work Order' value={wo.id} />
                  <InfoRow label='Pelanggan' value={wo.koneksiData?.pelanggan?.namaLengkap} />
                  <InfoRow label='No. HP' value={wo.koneksiData?.pelanggan?.noHp} />
                  <InfoRow label='Alamat' value={wo.koneksiData?.alamat} />
                  <InfoRow label='Kelurahan / Kecamatan' value={[wo.koneksiData?.kelurahan, wo.koneksiData?.kecamatan].filter(Boolean).join(' / ')} />
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
                    <Engineering color='action' fontSize='small' />
                    <Typography variant='subtitle2'>Teknisi</Typography>
                  </Box>
                  <InfoRow label='Nama' value={wo.teknisiPenanggungJawab?.namaLengkap} />
                  <InfoRow label='NIP' value={wo.teknisiPenanggungJawab?.nip} />
                  <InfoRow label='Divisi' value={wo.teknisiPenanggungJawab?.divisi} />
                  <Divider sx={{ my: 1 }} />
                  <InfoRow label='Disubmit pada' value={fmtDate(wo.updatedAt)} />
                  {wo.catatanReview && <InfoRow label='Catatan Review' value={wo.catatanReview} />}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Receipt color='primary' />
                    <Typography variant='h6' fontWeight={700}>Data Hasil RAB</Typography>
                  </Box>
                  {!progres ? (
                    <Alert severity='info'>Data progres tidak tersedia</Alert>
                  ) : (
                    <>
                      <InfoRow
                        label='Total Biaya'
                        value={progres.totalBiaya != null
                          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(progres.totalBiaya)
                          : null}
                      />
                      <InfoRow label='Catatan' value={progres.catatan} />
                      {progres.urlRab && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant='subtitle2' sx={{ mb: 1 }}>Dokumen RAB</Typography>
                          <Button
                            variant='outlined' size='small'
                            onClick={() => window.open(progres.urlRab, '_blank')}
                          >
                            Buka Dokumen RAB
                          </Button>
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
