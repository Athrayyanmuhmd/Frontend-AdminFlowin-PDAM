'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  MonetizationOn,
  WaterDrop,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import { GET_ALL_KELOMPOK_PELANGGAN } from '@/lib/graphql/queries/kelompokPelanggan';
import {
  CREATE_KELOMPOK_PELANGGAN,
  UPDATE_KELOMPOK_PELANGGAN,
  DELETE_KELOMPOK_PELANGGAN
} from '@/lib/graphql/mutations/kelompokPelanggan';

interface KelompokPelanggan {
  _id: string;
  namaKelompok: string;
  hargaDiBawah10mKubik: number;
  hargaDiAtas10mKubik: number;
  biayaBeban: number;
  createdAt: string;
  updatedAt: string;
}

export default function KelompokPelangganPage() {
  const router = useRouter();
  const { userRole } = useAdmin();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [namaKelompok, setNamaKelompok] = useState('');
  const [hargaDibawah10, setHargaDibawah10] = useState('');
  const [hargaDiatas10, setHargaDiatas10] = useState('');
  const [biayaBeban, setBiayaBeban] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ GraphQL Query - Replace REST API
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'network-only',
  });

  const kelompokList = data?.getAllKelompokPelanggan || [];

  // Handle query errors
  useEffect(() => {
    if (graphqlError) {
      console.error('GraphQL Error:', graphqlError);
      setError('Gagal memuat data: ' + graphqlError.message);
    }
  }, [graphqlError]);

  // ✅ GraphQL Mutations
  const [createKelompokPelanggan, { loading: createLoading }] = useMutation(CREATE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    onCompleted: () => {
      setSuccess('Kelompok pelanggan berhasil ditambahkan');
      closeDialog();
    },
    onError: (err) => {
      setError('Gagal menambahkan: ' + err.message);
    }
  });

  const [updateKelompokPelanggan, { loading: updateLoading }] = useMutation(UPDATE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    onCompleted: () => {
      setSuccess('Kelompok pelanggan berhasil diupdate');
      closeDialog();
    },
    onError: (err) => {
      setError('Gagal mengupdate: ' + err.message);
    }
  });

  const [deleteKelompokPelanggan, { loading: deleteLoading }] = useMutation(DELETE_KELOMPOK_PELANGGAN, {
    refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    onCompleted: () => {
      setSuccess('Kelompok pelanggan berhasil dihapus');
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (err) => {
      setError('Gagal menghapus: ' + err.message);
    }
  });

  const submitting = createLoading || updateLoading || deleteLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyInput = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format with dots
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\./g, ''), 10) || 0;
  };

  const handleOpenDialog = (
    mode: 'create' | 'edit',
    kelompok?: KelompokPelanggan
  ) => {
    setDialogMode(mode);
    if (mode === 'edit' && kelompok) {
      setEditingId(kelompok._id);
      setNamaKelompok(kelompok.namaKelompok);
      setHargaDibawah10(
        formatCurrencyInput(kelompok.hargaDiBawah10mKubik.toString())
      );
      setHargaDiatas10(
        formatCurrencyInput(kelompok.hargaDiAtas10mKubik.toString())
      );
      setBiayaBeban(formatCurrencyInput(kelompok.biayaBeban.toString()));
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNamaKelompok('');
    setHargaDibawah10('');
    setHargaDiatas10('');
    setBiayaBeban('');
    setEditingId(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!namaKelompok) {
        setError('Nama kelompok wajib diisi');
        return;
      }

      const hargaDibawah10Num = parseCurrency(hargaDibawah10);
      const hargaDiatas10Num = parseCurrency(hargaDiatas10);

      if (hargaDibawah10Num <= 0) {
        setError('Harga pemakaian dibawah 10m³ harus lebih dari 0');
        return;
      }

      if (hargaDiatas10Num <= 0) {
        setError('Harga pemakaian diatas 10m³ harus lebih dari 0');
        return;
      }

      const submitData = {
        namaKelompok,
        hargaDiBawah10mKubik: hargaDibawah10Num,
        hargaDiAtas10mKubik: hargaDiatas10Num,
        biayaBeban: parseCurrency(biayaBeban) || 0,
      };

      // ✅ GraphQL Mutation - Replace REST API
      if (dialogMode === 'create') {
        await createKelompokPelanggan({ variables: { input: submitData } });
      } else {
        await updateKelompokPelanggan({
          variables: {
            id: editingId,
            input: submitData
          }
        });
      }
    } catch (err: any) {
      console.error('Error saving kelompok pelanggan:', err);
      // Error already handled in mutation onError
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setError('');
    setSuccess('');

    try {
      // ✅ GraphQL Mutation - Replace REST API
      await deleteKelompokPelanggan({
        variables: { id: deletingId }
      });
    } catch (err: any) {
      console.error('Error deleting kelompok pelanggan:', err);
      // Error already handled in mutation onError
    }
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

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Group sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>Kelompok Pelanggan</Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage tarif kelompok pelanggan untuk billing
            </Typography>
          </Box>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
          >
            Tambah Kelompok
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Nama Kelompok</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tarif {'<'} 10m³</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tarif {'>'} 10m³</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Biaya Beban</strong>
                    </TableCell>
                    <TableCell align='center'>
                      <strong>Aksi</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kelompokList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        <Typography variant='body2' color='text.secondary'>
                          Belum ada kelompok pelanggan
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    kelompokList.map(kelompok => (
                      <TableRow key={kelompok._id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <WaterDrop color='primary' />
                            <Typography fontWeight='bold'>
                              {kelompok.namaKelompok}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              formatCurrency(
                                kelompok.hargaDiBawah10mKubik
                              ) + '/m³'
                            }
                            color='success'
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              formatCurrency(kelompok.hargaDiAtas10mKubik) +
                              '/m³'
                            }
                            color='warning'
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          {kelompok.biayaBeban > 0 ? (
                            <Chip
                              label={formatCurrency(kelompok.biayaBeban)}
                              color='info'
                              size='small'
                            />
                          ) : (
                            <Typography variant='body2' color='text.secondary'>
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleOpenDialog('edit', kelompok)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleOpenDeleteDialog(kelompok._id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            {dialogMode === 'create'
              ? 'Tambah Kelompok Pelanggan'
              : 'Edit Kelompok Pelanggan'}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <TextField
                fullWidth
                label='Nama Kelompok'
                value={namaKelompok}
                onChange={e => setNamaKelompok(e.target.value)}
                placeholder='Contoh: Rumah Tangga, Komersial, Industri'
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Group />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label='Harga Pemakaian Dibawah 10m³'
                value={hargaDibawah10}
                onChange={e =>
                  setHargaDibawah10(formatCurrencyInput(e.target.value))
                }
                placeholder='0'
                required
                helperText='Tarif per m³ untuk pemakaian < 10m³'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography>Rp</Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='body2' color='text.secondary'>
                        /m³
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label='Harga Pemakaian Diatas 10m³'
                value={hargaDiatas10}
                onChange={e =>
                  setHargaDiatas10(formatCurrencyInput(e.target.value))
                }
                placeholder='0'
                required
                helperText='Tarif per m³ untuk pemakaian >= 10m³'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography>Rp</Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='body2' color='text.secondary'>
                        /m³
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label='Biaya Beban (Opsional)'
                value={biayaBeban}
                onChange={e =>
                  setBiayaBeban(formatCurrencyInput(e.target.value))
                }
                placeholder='0'
                helperText='Biaya tetap bulanan (jika ada)'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography>Rp</Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='body2' color='text.secondary'>
                        /bulan
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              variant='contained'
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <DialogContent>
            <Typography>
              Apakah Anda yakin ingin menghapus kelompok pelanggan ini?
            </Typography>
            <Alert severity='warning' sx={{ mt: 2 }}>
              Perhatian: Kelompok yang sudah digunakan di meteran tidak bisa
              dihapus
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} disabled={submitting}>
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              variant='contained'
              color='error'
              disabled={submitting}
              startIcon={
                submitting ? <CircularProgress size={20} /> : <Delete />
              }
            >
              {submitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
