'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdmin } from '../../../../layouts/AdminProvider';
import { getWorkOrder, getProgresWorkOrder } from '@/lib/graphql/teknisiServer';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip, Divider, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField, CircularProgress,
} from '@mui/material';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import DetailSkeleton from '../../../../components/ui/DetailSkeleton';
import ErrorWithRetry from '../../../../components/ui/ErrorWithRetry';
import { isPdfUrl, buildProxyUrl, getAdminToken } from '../../../../utils/documentUrl';
import { ArrowBack, LocationOn, Person, Engineering, CheckCircle, Cancel } from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import PageBreadcrumb from '../../../../components/ui/PageBreadcrumb';
import EmptyState from '../../../../components/ui/EmptyState';
import PrintButton from '../../../../components/ui/PrintButton';

// ─── Mutations ────────────────────────────────────────────────────────────────

const REVIEW_HASIL = gql`
  mutation ReviewHasil($input: ReviewHasilInput!) {
    reviewHasil(input: $input) {
      success
      message
      workOrder { id status }
    }
  }
`;

const UPDATE_PELANGGAN = gql`
  mutation UpdatePelangganSurvei($id: ID!, $input: UpdatePelangganInput!) {
    updatePelanggan(id: $id, input: $input) {
      _id
      customerType
    }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (v?: string) => {
  if (!v) return '-';
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_WO: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  dikirim: { label: 'Dikirim', color: 'info' },
  selesai: { label: 'Selesai', color: 'success' },
};

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'rumah_tangga', label: 'Rumah Tangga' },
  { value: 'komersial',    label: 'Komersial'    },
  { value: 'industri',     label: 'Industri'     },
  { value: 'sosial',       label: 'Sosial'       },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: { xs: 110, sm: 160 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveyDataDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const id = params.id as string;

  const [wo,      setWo]      = useState<any>(null);
  const [progres, setProgres] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Review state ───────────────────────────────────────────────────────────
  const [setujuiDialog, setSetujuiDialog] = useState(false);
  const [tolakDialog,   setTolakDialog]   = useState(false);
  const [customerType,  setCustomerType]  = useState('rumah_tangga');
  const [catatan,       setCatatan]       = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [errMsg,        setErrMsg]        = useState('');

  const [reviewHasil]    = useMutation(REVIEW_HASIL);
  const [updatePelanggan] = useMutation(UPDATE_PELANGGAN);

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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSetujui = async () => {
    setSubmitting(true);
    setErrMsg('');
    try {
      const res = await reviewHasil({
        variables: { input: { workOrderId: wo.id, disetujui: true, catatan: catatan || null } },
      });
      if (!(res.data as any)?.reviewHasil?.success) {
        throw new Error((res.data as any)?.reviewHasil?.message || 'Gagal menyetujui survei');
      }

      // Simpan customerType ke data pelanggan
      const pelangganId = wo.koneksiData?.pelanggan?.id;
      if (pelangganId) {
        await updatePelanggan({ variables: { id: pelangganId, input: { customerType } } });
      }

      setSetujuiDialog(false);
      setCatatan('');
      setSuccessMsg(`Survei disetujui. Jenis pelanggan ditetapkan: ${CUSTOMER_TYPE_OPTIONS.find(o => o.value === customerType)?.label}`);
      fetchData();
    } catch (err: any) {
      setErrMsg(err.message ?? 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTolak = async () => {
    setSubmitting(true);
    setErrMsg('');
    try {
      const res = await reviewHasil({
        variables: { input: { workOrderId: wo.id, disetujui: false, catatan: catatan || null } },
      });
      if (!(res.data as any)?.reviewHasil?.success) {
        throw new Error((res.data as any)?.reviewHasil?.message || 'Gagal menolak survei');
      }
      setTolakDialog(false);
      setCatatan('');
      setSuccessMsg('Survei ditolak. Teknisi akan diminta melakukan survei ulang.');
      fetchData();
    } catch (err: any) {
      setErrMsg(err.message ?? 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (authLoading || !isAuthenticated) return null;

  const s = wo ? STATUS_WO[wo.status] : null;
  const bisaDireview = wo?.status === 'dikirim';

  return (
    <AdminLayout title='Detail Survei'>
      <PageBreadcrumb crumbs={[
        { label: 'Operasi' },
        { label: 'Data Survei', href: '/operations/survey-data' },
        { label: 'Detail' },
      ]} />
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button className='no-print' startIcon={<ArrowBack />} onClick={() => router.back()} size='small'>
            Kembali
          </Button>
          <Typography variant='h5' fontWeight={700} sx={{ flex: 1 }}>
            Detail Data Survei
          </Typography>
          <PrintButton />
          {s && <Chip label={s.label} color={s.color} size='small' />}
        </Box>

        {successMsg && (
          <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {loading ? (
          <DetailSkeleton sections={[{ md: 5, rows: 6 }, { md: 7, rows: 5 }]} hasHeader={false} />
        ) : error ? (
          <ErrorWithRetry message='Gagal memuat data survei.' detail={error} onRetry={fetchData} />
        ) : !wo ? (
          <EmptyState
            title='Data tidak ditemukan'
            description='Work order ini tidak ada atau sudah dihapus'
            action={{ label: 'Kembali ke Daftar', onClick: () => router.back() }}
          />
        ) : (
          <>
            <Grid container spacing={2}>
              {/* Work Order Info */}
              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Person color='primary' />
                      <Typography variant='h6' fontWeight={700}>Informasi Work Order</Typography>
                    </Box>
                    <InfoRow label='ID Work Order'       value={wo.id} />
                    <InfoRow label='Pelanggan'           value={wo.koneksiData?.pelanggan?.namaLengkap} />
                    <InfoRow label='No. HP'              value={wo.koneksiData?.pelanggan?.noHp} />
                    <InfoRow label='Alamat'              value={wo.koneksiData?.alamat} />
                    <InfoRow
                      label='Kelurahan / Kecamatan'
                      value={[wo.koneksiData?.kelurahan, wo.koneksiData?.kecamatan].filter(Boolean).join(' / ')}
                    />
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
                      <Engineering color='action' fontSize='small' />
                      <Typography variant='subtitle2'>Teknisi</Typography>
                    </Box>
                    <InfoRow label='Nama'   value={wo.teknisiPenanggungJawab?.namaLengkap} />
                    <InfoRow label='NIP'    value={wo.teknisiPenanggungJawab?.nip} />
                    <InfoRow label='Divisi' value={wo.teknisiPenanggungJawab?.divisi} />
                    <Divider sx={{ my: 1 }} />
                    <InfoRow label='Disubmit pada'  value={fmtDate(wo.updatedAt)} />
                    {wo.catatanReview && (
                      <InfoRow label='Catatan Review' value={wo.catatanReview} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Data Hasil Survei */}
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocationOn color='primary' />
                      <Typography variant='h6' fontWeight={700}>Data Hasil Survei</Typography>
                    </Box>
                    {!progres ? (
                      <Alert severity='info'>Data progres tidak tersedia</Alert>
                    ) : (
                      <>
                        <InfoRow
                          label='Diameter Pipa'
                          value={progres.diameterPipa != null ? `${progres.diameterPipa} mm` : null}
                        />
                        <InfoRow
                          label='Jumlah Penghuni'
                          value={progres.jumlahPenghuni != null ? `${progres.jumlahPenghuni} orang` : null}
                        />
                        <InfoRow
                          label='Standar'
                          value={progres.standar != null ? (
                            <Chip
                              label={progres.standar ? 'Sesuai Standar' : 'Tidak Sesuai'}
                              color={progres.standar ? 'success' : 'warning'}
                              size='small'
                            />
                          ) : null}
                        />
                        {progres.koordinat && (
                          <InfoRow
                            label='Koordinat'
                            value={
                              <Box>
                                <Typography variant='body2'>Lat: {progres.koordinat.latitude}</Typography>
                                <Typography variant='body2'>Long: {progres.koordinat.longitude}</Typography>
                                <Button
                                  size='small' variant='text' sx={{ p: 0, mt: 0.5 }}
                                  onClick={() => window.open(`https://maps.google.com/?q=${progres.koordinat.latitude},${progres.koordinat.longitude}`, '_blank')}
                                >
                                  Lihat di Google Maps
                                </Button>
                              </Box>
                            }
                          />
                        )}
                        <InfoRow label='Catatan' value={progres.catatan} />
                        {(progres.urlJaringan || progres.urlPosisiBak) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant='subtitle2' sx={{ mb: 1 }}>Foto / Dokumen</Typography>
                            <Grid container spacing={1}>
                              {[
                                { label: 'Posisi Meteran', url: progres.posisiMeteran },
                                { label: 'Jaringan',       url: progres.urlJaringan   },
                                { label: 'Posisi Bak',     url: progres.urlPosisiBak  },
                              ].filter(d => d.url).map(d => (
                                <Grid item xs={12} sm={6} key={d.label}>
                                  <Typography variant='caption' color='text.secondary'>{d.label}</Typography>
                                  {isPdfUrl(d.url) ? (
                                    <Button
                                      size='small' variant='outlined' fullWidth sx={{ mt: 0.5, justifyContent: 'flex-start' }}
                                      onClick={() => { const t = getAdminToken(); window.open(t ? buildProxyUrl(d.url, t, 'SURVEI', id) : d.url, '_blank'); }}
                                    >
                                      Buka {d.label} (PDF)
                                    </Button>
                                  ) : (
                                    <Box
                                      component='img' src={d.url} alt={d.label}
                                      sx={{ width: '100%', borderRadius: 1, cursor: 'pointer', mt: 0.5 }}
                                      onClick={() => { const t = getAdminToken(); window.open(t ? buildProxyUrl(d.url, t, 'SURVEI', id) : d.url, '_blank'); }}
                                    />
                                  )}
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

            {/* Tombol Review — hanya tampil saat status 'dikirim' */}
            {bisaDireview && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>
                    Keputusan Admin
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Tinjau hasil survei di atas sebelum memberikan keputusan.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant='contained'
                      color='success'
                      startIcon={<CheckCircle />}
                      onClick={() => { setSetujuiDialog(true); setErrMsg(''); }}
                    >
                      Setujui Survei
                    </Button>
                    <Button
                      variant='outlined'
                      color='error'
                      startIcon={<Cancel />}
                      onClick={() => { setTolakDialog(true); setErrMsg(''); }}
                    >
                      Tolak / Revisi
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>

      {/* ── Dialog Setujui ── */}
      <Dialog open={setujuiDialog} onClose={() => !submitting && setSetujuiDialog(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Setujui Hasil Survei</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Tentukan jenis pelanggan berdasarkan hasil survei teknisi.
          </Typography>
          <FormControl fullWidth size='small' sx={{ mb: 2 }}>
            <InputLabel>Jenis Pelanggan *</InputLabel>
            <Select
              value={customerType}
              label='Jenis Pelanggan *'
              onChange={e => setCustomerType(e.target.value)}
            >
              {CUSTOMER_TYPE_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth size='small' multiline rows={2}
            label='Catatan (opsional)'
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
          />
          {errMsg && <Alert severity='error' sx={{ mt: 1.5 }}>{errMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetujuiDialog(false)} disabled={submitting}>Batal</Button>
          <Button
            variant='contained' color='success'
            onClick={handleSetujui}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <CheckCircle />}
          >
            {submitting ? 'Menyimpan...' : 'Konfirmasi Setujui'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Tolak ── */}
      <Dialog open={tolakDialog} onClose={() => !submitting && setTolakDialog(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Tolak / Minta Revisi Survei</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Survei akan ditolak dan teknisi akan diminta melakukan survei ulang.
          </Typography>
          <TextField
            fullWidth size='small' multiline rows={3}
            label='Alasan penolakan / catatan revisi'
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder='Contoh: Foto jaringan tidak jelas, harap ulangi survei...'
          />
          {errMsg && <Alert severity='error' sx={{ mt: 1.5 }}>{errMsg}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTolakDialog(false)} disabled={submitting}>Batal</Button>
          <Button
            variant='contained' color='error'
            onClick={handleTolak}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <Cancel />}
          >
            {submitting ? 'Menyimpan...' : 'Konfirmasi Tolak'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
