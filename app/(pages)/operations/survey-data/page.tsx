'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
} from '@mui/material';
import {
  Search,
  Refresh,
  Visibility,
  Description,
  Close,
  ZoomIn,
  ZoomOut,
  RestartAlt,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_SURVEY_DATA } from '../../../../lib/graphql/queries/surveyData';

export default function SurveyDataManagement() {
  const router = useRouter();

  // GraphQL Query
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_SURVEY_DATA, {
    fetchPolicy: 'network-only',
  });

  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const [zoom, setZoom] = useState(100);

  // Handle GraphQL errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      setError('Gagal memuat data survey: ' + graphqlError.message);
    }
  }, [graphqlError]);

  // Get survey data from GraphQL response
  const surveyData = data?.getAllSurvei || [];

  // Filter data using useMemo for reactive updates
  const filteredData = useMemo(() => {
    if (searchQuery.trim() === '') {
      return surveyData;
    }

    const query = searchQuery.toLowerCase();
    return surveyData.filter((item: any) =>
      item.idKoneksiData?.idPelanggan?.namaLengkap?.toLowerCase().includes(query) ||
      item.idTeknisi?.namaLengkap?.toLowerCase().includes(query) ||
      item.idKoneksiData?.alamat?.toLowerCase().includes(query)
    );
  }, [surveyData, searchQuery]);

  const openImageViewer = (url: string) => {
    setViewerImage(url);
    setZoom(100);
    setViewerOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/operations/survey-data/${id}`);
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant='h4' gutterBottom>
              Data Survey
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Kelola data survey lokasi sambungan
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Alert */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder='Cari Nama Pelanggan, Alamat, atau Teknisi...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant='h6' color='text.secondary'>
                  Tidak ada data survey
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alamat / Pelanggan</TableCell>
                      <TableCell>Teknisi</TableCell>
                      <TableCell>Diameter Pipa</TableCell>
                      <TableCell>Jumlah Penghuni</TableCell>
                      <TableCell>Standar</TableCell>
                      <TableCell>Tanggal Survey</TableCell>
                      <TableCell align='center'>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(filteredData) &&
                      filteredData.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight='bold'>
                              {item.idKoneksiData?.alamat || 'N/A'}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {item.idKoneksiData?.idPelanggan?.namaLengkap || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.idTeknisi?.namaLengkap || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.diameterPipa ? `${item.diameterPipa} mm` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.jumlahPenghuni ? `${item.jumlahPenghuni} orang` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.standar ? 'Sesuai' : 'Tidak Sesuai'}
                              size='small'
                              color={item.standar ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString(
                              'id-ID'
                            )}
                          </TableCell>
                          <TableCell align='center'>
                            <Tooltip title='Lihat Detail'>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => handleViewDetail(item._id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {item.urlJaringan && (
                              <Tooltip title='Lihat Foto Jaringan'>
                                <IconButton
                                  size='small'
                                  color='info'
                                  onClick={() =>
                                    openImageViewer(item.urlJaringan)
                                  }
                                >
                                  <Description />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Image Viewer Dialog */}
        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth='lg'
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='h6'>Foto Lokasi Survey</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
                >
                  <ZoomOut />
                </IconButton>
                <Typography
                  variant='body2'
                  sx={{ minWidth: 60, textAlign: 'center' }}
                >
                  {zoom}%
                </Typography>
                <IconButton
                  size='small'
                  onClick={() => setZoom(prev => Math.min(prev + 25, 300))}
                >
                  <ZoomIn />
                </IconButton>
                <IconButton size='small' onClick={() => setZoom(100)}>
                  <RestartAlt />
                </IconButton>
                <IconButton onClick={() => setViewerOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: 400,
                overflow: 'auto',
              }}
            >
              <img
                src={viewerImage}
                alt='Foto Lokasi'
                style={{
                  width: `${zoom}%`,
                  height: 'auto',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
