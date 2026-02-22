// @ts-nocheck
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Refresh,
  Engineering,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  GET_ALL_TEKNISI,
  CREATE_TEKNISI,
  UPDATE_TEKNISI,
  DELETE_TEKNISI,
} from '../../../../lib/graphql/queries/technicians';

// Types
interface Technician {
  _id: string;
  namaLengkap: string;
  NIP: string;
  email: string;
  noHP: string;
  divisi: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTechnicianData {
  namaLengkap: string;
  NIP: string;
  email: string;
  noHP: string;
  divisi: string;
  password: string;
}

export default function TechnicianManagement() {
  const router = useRouter();
  const { userRole } = useAdmin();

  // ==================== GraphQL Queries & Mutations ====================
  const { loading, error: graphqlError, data, refetch } = useQuery(GET_ALL_TEKNISI, {
    fetchPolicy: 'network-only',
  });

  const [createTeknisi, { loading: createLoading }] = useMutation(CREATE_TEKNISI, {
    refetchQueries: [{ query: GET_ALL_TEKNISI }],
    onCompleted: () => {
      setSuccess('Teknisi berhasil ditambahkan');
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      setError(error.message || 'Gagal menambahkan teknisi');
    },
  });

  const [updateTeknisi, { loading: updateLoading }] = useMutation(UPDATE_TEKNISI, {
    refetchQueries: [{ query: GET_ALL_TEKNISI }],
    onCompleted: () => {
      setSuccess('Teknisi berhasil diperbarui');
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      setError(error.message || 'Gagal memperbarui teknisi');
    },
  });

  const [deleteTeknisi, { loading: deleteLoading }] = useMutation(DELETE_TEKNISI, {
    refetchQueries: [{ query: GET_ALL_TEKNISI }],
    onCompleted: () => {
      setSuccess('Teknisi berhasil dihapus');
      setDeleteDialogOpen(false);
      setSelectedTechnician(null);
    },
    onError: (error) => {
      setError(error.message || 'Gagal menghapus teknisi');
    },
  });

  // ==================== Local State ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateTechnicianData>({
    namaLengkap: '',
    NIP: '',
    email: '',
    password: '',
    noHP: '',
    divisi: 'PerencanaanTeknik',
  });

  // ==================== Data Processing ====================
  const technicians = data?.getAllTeknisi || [];

  // Helper function to format date safely
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  // Sort technicians by createdAt (newest first), then apply filter
  const filteredTechnicians = useMemo(() => {
    // First, sort by createdAt descending (newest first)
    const sorted = [...technicians].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });

    // Then apply search filter
    if (searchQuery.trim() === '') return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter((tech: Technician) =>
      tech.namaLengkap?.toLowerCase().includes(query) ||
      tech.email?.toLowerCase().includes(query) ||
      tech.noHP?.toLowerCase().includes(query) ||
      tech.NIP?.toLowerCase().includes(query)
    );
  }, [technicians, searchQuery]);

  const totalPages = Math.ceil(filteredTechnicians.length / rowsPerPage);
  const paginatedTechnicians = filteredTechnicians.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const actionLoading = createLoading || updateLoading || deleteLoading;

  // ==================== Handlers ====================
  const resetForm = () => {
    setFormData({
      namaLengkap: '',
      NIP: '',
      email: '',
      password: '',
      noHP: '',
      divisi: 'PerencanaanTeknik',
    });
  };

  const handleCreateOpen = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (technician: Technician) => {
    setSelectedTechnician(technician);
    setFormData({
      namaLengkap: technician.namaLengkap,
      NIP: technician.NIP || '',
      email: technician.email,
      password: '',
      noHP: technician.noHP,
      divisi: technician.divisi || 'PerencanaanTeknik',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (technician: Technician) => {
    setSelectedTechnician(technician);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    if (!formData.namaLengkap.trim()) { setError('Nama lengkap wajib diisi'); return; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Email tidak valid'); return; }
    if (!formData.password || formData.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (!formData.noHP.trim() || !/^[0-9]{10,15}$/.test(formData.noHP.replace(/\D/g, ''))) { setError('Nomor HP tidak valid (10-15 digit)'); return; }

    try {
      await createTeknisi({
        variables: {
          input: {
            namaLengkap: formData.namaLengkap,
            NIP: formData.NIP,
            email: formData.email,
            noHP: formData.noHP,
            divisi: formData.divisi,
            password: formData.password,
          },
        },
      });
    } catch (err: any) {
      console.error('Error creating technician:', err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTechnician) return;

    setError('');
    setSuccess('');

    if (!formData.namaLengkap.trim()) { setError('Nama lengkap wajib diisi'); return; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Email tidak valid'); return; }
    if (!formData.noHP.trim() || !/^[0-9]{10,15}$/.test(formData.noHP.replace(/\D/g, ''))) { setError('Nomor HP tidak valid (10-15 digit)'); return; }

    try {
      const updateData: any = {
        namaLengkap: formData.namaLengkap,
        NIP: formData.NIP,
        email: formData.email,
        noHP: formData.noHP,
        divisi: formData.divisi,
      };

      await updateTeknisi({
        variables: {
          id: selectedTechnician._id,
          input: updateData,
        },
      });
    } catch (err: any) {
      console.error('Error updating technician:', err);
      // Error handled by mutation onError
    }
  };

  const handleDelete = async () => {
    if (!selectedTechnician) return;

    setError('');
    setSuccess('');

    try {
      await deleteTeknisi({
        variables: {
          id: selectedTechnician._id,
        },
      });
    } catch (err: any) {
      console.error('Error deleting technician:', err);
    }
  };

  // Only admin can manage technicians
  if (userRole !== 'admin') {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>
            Akses ditolak. Hanya admin yang dapat mengelola teknisi.
          </Alert>
        </Box>
      </AdminLayout>
    );
  }

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
              Manajemen Teknisi
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Kelola data teknisi lapangan
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleCreateOpen}
            >
              Tambah Teknisi
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {graphqlError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            Gagal memuat data: {graphqlError.message}
            <Button size="small" onClick={() => refetch()} sx={{ ml: 2 }}>
              Coba Lagi
            </Button>
          </Alert>
        )}
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

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder='Cari nama, email, atau nomor telepon...'
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
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
            ) : filteredTechnicians.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Engineering
                  sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant='h6' color='text.secondary'>
                  Tidak ada data teknisi
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nama Lengkap</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Nomor Telepon</TableCell>
                        <TableCell>Tanggal Dibuat</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTechnicians.map(tech => (
                        <TableRow key={tech._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Engineering color='primary' />
                              <Typography variant='body2' fontWeight='bold'>
                                {tech.namaLengkap}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{tech.email}</TableCell>
                          <TableCell>{tech.noHP}</TableCell>
                          <TableCell>{formatDate(tech.createdAt)}</TableCell>
                          <TableCell align='center'>
                            <Tooltip title='Edit'>
                              <IconButton size='small' color='primary' onClick={() => handleEditOpen(tech)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Hapus'>
                              <IconButton size='small' color='error' onClick={() => handleDeleteOpen(tech)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Tambah Teknisi Baru</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Nama Lengkap'
                  required
                  value={formData.namaLengkap}
                  onChange={e =>
                    setFormData({ ...formData, namaLengkap: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='NIP (Opsional)'
                  value={formData.NIP}
                  onChange={e =>
                    setFormData({ ...formData, NIP: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Nomor Telepon'
                  required
                  value={formData.noHP}
                  onChange={e =>
                    setFormData({ ...formData, noHP: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Divisi</InputLabel>
                  <Select
                    value={formData.divisi}
                    label='Divisi'
                    onChange={e =>
                      setFormData({ ...formData, divisi: e.target.value })
                    }
                  >
                    <MenuItem value='PerencanaanTeknik'>Perencanaan Teknik</MenuItem>
                    <MenuItem value='TeknikCabang'>Teknik Cabang</MenuItem>
                    <MenuItem value='PengawasanTeknik'>Pengawasan Teknik</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Password'
                  type='password'
                  required
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button
              variant='contained'
              onClick={handleCreate}
              disabled={
                actionLoading ||
                !formData.namaLengkap ||
                !formData.email ||
                !formData.noHP ||
                !formData.password
              }
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Tambah'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Edit Teknisi</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Nama Lengkap'
                  value={formData.namaLengkap}
                  onChange={e =>
                    setFormData({ ...formData, namaLengkap: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='NIP (Opsional)'
                  value={formData.NIP}
                  onChange={e =>
                    setFormData({ ...formData, NIP: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Nomor Telepon'
                  value={formData.noHP}
                  onChange={e =>
                    setFormData({ ...formData, noHP: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Divisi</InputLabel>
                  <Select
                    value={formData.divisi}
                    label='Divisi'
                    onChange={e =>
                      setFormData({ ...formData, divisi: e.target.value })
                    }
                  >
                    <MenuItem value='PerencanaanTeknik'>Perencanaan Teknik</MenuItem>
                    <MenuItem value='TeknikCabang'>Teknik Cabang</MenuItem>
                    <MenuItem value='PengawasanTeknik'>Pengawasan Teknik</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Password (Kosongkan jika tidak ingin diubah)'
                  type='password'
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button
              variant='contained'
              onClick={handleUpdate}
              disabled={
                actionLoading ||
                !formData.namaLengkap ||
                !formData.email ||
                !formData.noHP
              }
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Simpan'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <DialogContent>
            <Typography>
              Apakah Anda yakin ingin menghapus teknisi{' '}
              <strong>{selectedTechnician?.namaLengkap}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Hapus'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
