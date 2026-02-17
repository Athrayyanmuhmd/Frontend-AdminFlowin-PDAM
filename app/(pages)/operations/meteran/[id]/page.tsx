'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  Speed,
  Group,
  Person,
  WaterDrop,
  MonetizationOn,
  EventAvailable,
  Link as LinkIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useGetMeteran } from '../../../../../lib/graphql/hooks/useMeteran';

interface Meteran {
  _id: string;
  noMeteran: string;
  kelompokPelangganId: {
    _id: string;
    namaKelompok: string;
    hargaPenggunaanDibawah10: number;
    hargaPenggunaanDiatas10: number;
    biayaBeban: number;
  };
  userId: {
    _id: string;
    namaLengkap: string;
    noHp: string;
  };
  connectionDataId?: {
    _id: string;
    nik: string;
    alamat: string;
  };
  totalPemakaian: number;
  pemakaianBelumTerbayar: number;
  jatuhTempo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MeteranDetail() {
  const router = useRouter();
  const params = useParams();
  const meteranId = params.id as string;

  // ✅ GraphQL Query - Replace REST API
  const { meteran: meteranData, loading, error: graphqlError, refetch } = useGetMeteran(meteranId);

  // Transform GraphQL data to match component interface
  const meteran = meteranData ? {
    _id: meteranData._id,
    noMeteran: meteranData.nomorMeteran,
    kelompokPelangganId: meteranData.idKelompokPelanggan ? {
      _id: meteranData.idKelompokPelanggan._id,
      namaKelompok: meteranData.idKelompokPelanggan.namaKelompok,
      hargaPenggunaanDibawah10: meteranData.idKelompokPelanggan.hargaDiBawah10mKubik,
      hargaPenggunaanDiatas10: meteranData.idKelompokPelanggan.hargaDiAtas10mKubik,
      biayaBeban: meteranData.idKelompokPelanggan.biayaBeban || 0,
    } : null,
    userId: meteranData.idKoneksiData?.userId ? {
      _id: meteranData.idKoneksiData.userId._id,
      namaLengkap: meteranData.idKoneksiData.userId.namaLengkap,
      noHp: meteranData.idKoneksiData.userId.noHP,
    } : null,
    connectionDataId: meteranData.idKoneksiData ? {
      _id: meteranData.idKoneksiData._id,
      nik: '', // Not available in schema
      alamat: meteranData.idKoneksiData.alamat,
    } : null,
    totalPemakaian: 0, // Not in schema
    pemakaianBelumTerbayar: 0, // Not in schema
    jatuhTempo: undefined,
    createdAt: meteranData.createdAt,
    updatedAt: meteranData.updatedAt,
  } : null;

  const error = graphqlError?.message || '';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error || !meteran) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{error || 'Data tidak ditemukan'}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>Detail Meteran</Typography>
            <Typography variant='body2' color='text.secondary'>
              {meteran.noMeteran}
            </Typography>
          </Box>
          <Chip
            icon={<Speed />}
            label='Aktif'
            color='success'
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Informasi Meteran */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Speed sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6'>Informasi Meteran</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Nomor Meteran
                    </Typography>
                    <Typography variant='h6' fontWeight='bold'>
                      {meteran.noMeteran}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Kelompok Pelanggan */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6'>Kelompok Pelanggan</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Nama Kelompok
                    </Typography>
                    <Typography variant='h6' fontWeight='bold'>
                      {meteran.kelompokPelangganId.namaKelompok}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tarif & Biaya */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6'>Tarif & Biaya</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'success.lighter',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Tarif Pemakaian {'<'} 10m³
                      </Typography>
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        color='success.main'
                      >
                        {formatCurrency(
                          meteran.kelompokPelangganId.hargaPenggunaanDibawah10
                        )}
                        /m³
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'warning.lighter',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        Tarif Pemakaian {'>'} 10m³
                      </Typography>
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        color='warning.main'
                      >
                        {formatCurrency(
                          meteran.kelompokPelangganId.hargaPenggunaanDiatas10
                        )}
                        /m³
                      </Typography>
                    </Box>
                  </Grid>

                  {meteran.kelompokPelangganId.biayaBeban > 0 && (
                    <Grid item xs={12} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'info.lighter',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          Biaya Beban Bulanan
                        </Typography>
                        <Typography
                          variant='h6'
                          fontWeight='bold'
                          color='info.main'
                        >
                          {formatCurrency(
                            meteran.kelompokPelangganId.biayaBeban
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Informasi Pelanggan */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6'>Informasi Pelanggan</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Nama Pelanggan
                    </Typography>
                    <Typography variant='body1'>
                      {meteran.userId.namaLengkap}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      No. HP
                    </Typography>
                    <Typography variant='body1'>
                      {meteran.userId.noHp}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Pemakaian & Pembayaran */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WaterDrop sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='h6'>Pemakaian & Pembayaran</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Total Pemakaian
                    </Typography>
                    <Typography variant='h6' color='primary.main'>
                      {meteran.totalPemakaian} m³
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Pemakaian Belum Terbayar
                    </Typography>
                    <Typography
                      variant='h6'
                      color={
                        meteran.pemakaianBelumTerbayar > 0
                          ? 'error.main'
                          : 'success.main'
                      }
                    >
                      {meteran.pemakaianBelumTerbayar} m³
                    </Typography>
                  </Grid>
                  {meteran.jatuhTempo && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <EventAvailable />
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            Jatuh Tempo
                          </Typography>
                          <Typography variant='body1'>
                            {formatDate(meteran.jatuhTempo)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Connection Data (if exists) */}
          {meteran.connectionDataId && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant='h6'>
                      Connection Data Terkait
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        NIK
                      </Typography>
                      <Typography variant='body1'>
                        {meteran.connectionDataId.nik}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Alamat
                      </Typography>
                      <Typography variant='body1'>
                        {meteran.connectionDataId.alamat}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant='outlined'
                        onClick={() =>
                          router.push(
                            `/operations/connection-data/${meteran.connectionDataId!._id}`
                          )
                        }
                      >
                        Lihat Connection Data
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Timestamps */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Dibuat Pada
                    </Typography>
                    <Typography variant='body1'>
                      {formatDateTime(meteran.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Terakhir Diperbarui
                    </Typography>
                    <Typography variant='body1'>
                      {formatDateTime(meteran.updatedAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
