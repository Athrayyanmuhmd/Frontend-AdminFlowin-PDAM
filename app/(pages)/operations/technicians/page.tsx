'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Chip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Refresh,
  Engineering,
  Lock,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdmin } from '../../../layouts/AdminProvider';
import {
  getTeknisiUsers,
  registerTeknisi,
  updateTeknisiUser,
  deleteTeknisiUser,
  toggleTeknisiUserStatus,
  changeTeknisiPassword,
} from '../../../../lib/graphql/teknisiServer';

// Types
interface Technician {
  id: string;
  namaLengkap: string;
  nip: string;
  email: string;
  noHp: string;
  divisi: string;
  isActive?: boolean;
  pekerjaanSekarang?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateTechnicianData {
  namaLengkap: string;
  nip: string;
  email: string;
  noHp: string;
  divisi: string;
  password: string;
}

export default function TechnicianManagement() {
  const router = useRouter();
  const { userRole, isAuthenticated, isLoading: authLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  // ==================== State ====================
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [graphqlError, setGraphqlError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateTechnicianData>({
    namaLengkap: '',
    nip: '',
    email: '',
    password: '',
    noHp: '',
    divisi: 'perencanaan_teknik',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
  });

  // ==================== Fetch Data ====================
  const fetchTechnicians = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    setGraphqlError(null);
    try {
      const res = await getTeknisiUsers(token);
      if (res.errors?.length) {
        setGraphqlError(res.errors[0].message);
        return;
      }
      setTechnicians((res.data as any)?.users ?? []);
    } catch (e: any) {
      setGraphqlError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchTechnicians();
  }, [authLoading, isAuthenticated, fetchTechnicians]);

  // ==================== Data Processing ====================
  const parseDate = (val: string | undefined | null): Date | null => {
    if (!val) return null;
    if (/^\d+$/.test(val)) {
      const d = new Date(Number(val));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (dateString: string | undefined | null): string => {
    const date = parseDate(dateString);
    if (!date) return '-';
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredTechnicians = useMemo(() => {
    const sorted = [...technicians].sort((a, b) => {
      const dateA = parseDate(a.createdAt)?.getTime() ?? 0;
      const dateB = parseDate(b.createdAt)?.getTime() ?? 0;
      return dateB - dateA;
    });

    if (searchQuery.trim() === '') return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (tech: Technician) =>
        tech.namaLengkap?.toLowerCase().includes(query) ||
        tech.email?.toLowerCase().includes(query) ||
        tech.noHp?.toLowerCase().includes(query) ||
        tech.nip?.toLowerCase().includes(query)
    );
  }, [technicians, searchQuery]);

  const totalPages = Math.ceil(filteredTechnicians.length / rowsPerPage);
  const paginatedTechnicians = filteredTechnicians.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ==================== Handlers ====================
  const resetForm = () => {
    setFormData({
      namaLengkap: '',
      nip: '',
      email: '',
      password: '',
      noHp: '',
      divisi: 'perencanaan_teknik',
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
      nip: technician.nip || '',
      email: technician.email,
      password: '',
      noHp: technician.noHp,
      divisi: technician.divisi || 'perencanaan_teknik',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (technician: Technician) => {
    setSelectedTechnician(technician);
    setDeleteDialogOpen(true);
  };

  const handlePasswordOpen = (technician: Technician) => {
    setSelectedTechnician(technician);
    setPasswordForm({ oldPassword: '', newPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');

    if (!formData.namaLengkap.trim()) { setError('Nama lengkap wajib diisi'); return; }
    if (!formData.nip.trim()) { setError('NIP wajib diisi'); return; }
    if (!/^[0-9]+$/.test(formData.nip.trim())) { setError('NIP harus berupa angka'); return; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Email tidak valid'); return; }
    if (!formData.password || formData.password.length < 8) { setError('Password minimal 8 karakter'); return; }
    if (!/[A-Z]/.test(formData.password)) { setError('Password harus mengandung minimal 1 huruf kapital'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) { setError('Password harus mengandung minimal 1 karakter khusus'); return; }
    if (!formData.noHp.trim() || !/^[0-9]{10,15}$/.test(formData.noHp.replace(/\D/g, ''))) { setError('Nomor HP tidak valid (10-15 digit)'); return; }

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await registerTeknisi(token, {
        namaLengkap: formData.namaLengkap,
        nip: formData.nip,
        email: formData.email,
        noHp: formData.noHp,
        divisi: formData.divisi,
        password: formData.password,
      });
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setSuccess('Teknisi berhasil ditambahkan');
      setCreateDialogOpen(false);
      resetForm();
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan teknisi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTechnician) return;
    setError('');
    setSuccess('');

    if (!formData.namaLengkap.trim()) { setError('Nama lengkap wajib diisi'); return; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Email tidak valid'); return; }
    if (!formData.noHp.trim() || !/^[0-9]{10,15}$/.test(formData.noHp.replace(/\D/g, ''))) { setError('Nomor HP tidak valid (10-15 digit)'); return; }

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await updateTeknisiUser(token, selectedTechnician.id, {
        namaLengkap: formData.namaLengkap,
        nip: formData.nip,
        email: formData.email,
        noHp: formData.noHp,
        divisi: formData.divisi,
      });
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setSuccess('Teknisi berhasil diperbarui');
      setEditDialogOpen(false);
      resetForm();
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui teknisi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTechnician) return;
    setError('');
    setSuccess('');

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await deleteTeknisiUser(token, selectedTechnician.id);
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setSuccess('Teknisi berhasil dihapus');
      setDeleteDialogOpen(false);
      setSelectedTechnician(null);
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus teknisi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (technician: Technician) => {
    setError('');
    setSuccess('');

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await toggleTeknisiUserStatus(token, technician.id);
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      const newStatus = technician.isActive ? 'dinonaktifkan' : 'diaktifkan';
      setSuccess(`Teknisi ${technician.namaLengkap} berhasil ${newStatus}`);
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status teknisi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedTechnician) return;
    setError('');
    setSuccess('');

    if (!passwordForm.oldPassword) { setError('Password lama wajib diisi'); return; }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) { setError('Password baru minimal 8 karakter'); return; }
    if (!/[A-Z]/.test(passwordForm.newPassword)) { setError('Password baru harus mengandung minimal 1 huruf kapital'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)) { setError('Password baru harus mengandung minimal 1 karakter khusus'); return; }

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await changeTeknisiPassword(token, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.errors?.length) { setError(res.errors[0].message); return; }
      setSuccess(`Password teknisi ${selectedTechnician.namaLengkap} berhasil diubah`);
      setPasswordDialogOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h4' gutterBottom>Manajemen Teknisi</Typography>
            <Typography variant='body2' color='text.secondary'>Kelola data teknisi lapangan</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant='outlined' startIcon={<Refresh />} onClick={() => fetchTechnicians()} disabled={loading}>
              Refresh
            </Button>
            <Button variant='contained' startIcon={<Add />} onClick={handleCreateOpen}>
              Tambah Teknisi
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {graphqlError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            Gagal memuat data: {graphqlError}
            <Button size='small' onClick={() => fetchTechnicians()} sx={{ ml: 2 }}>Coba Lagi</Button>
          </Alert>
        )}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}
        {success && (
          <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Teknisi', value: technicians.length, color: '#013494' },
            { label: 'Aktif', value: technicians.filter(t => t.isActive !== false).length, color: '#2e7d32' },
            { label: 'Nonaktif', value: technicians.filter(t => t.isActive === false).length, color: '#757575' },
          ].map(s => (
            <Card key={s.label} sx={{ flex: '1 1 140px', minWidth: 0, borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant='body2' color='text.secondary'>{s.label}</Typography>
                <Typography variant='h5' fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              size='small'
              placeholder='Cari nama, email, NIP, atau nomor telepon...'
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'><Search /></InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : filteredTechnicians.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Engineering sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant='h6' color='text.secondary'>Tidak ada data teknisi</Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nama Lengkap</TableCell>
                        <TableCell>NIP</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>No. HP</TableCell>
                        <TableCell>Divisi</TableCell>
                        <TableCell align='center'>Status</TableCell>
                        <TableCell>Tgl Dibuat</TableCell>
                        <TableCell align='center'>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTechnicians.map((tech: Technician) => (
                        <TableRow key={tech.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Engineering color='primary' fontSize='small' />
                              <Typography variant='body2' fontWeight={600}>{tech.namaLengkap}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 12 }}>{tech.nip || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' noWrap sx={{ maxWidth: 180 }} title={tech.email}>{tech.email}</Typography>
                          </TableCell>
                          <TableCell>{tech.noHp}</TableCell>
                          <TableCell>
                            <Chip
                              label={tech.divisi?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-'}
                              size='small'
                              variant='outlined'
                              color='primary'
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Tooltip title={tech.isActive !== false ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}>
                              <Chip
                                label={tech.isActive !== false ? 'Aktif' : 'Nonaktif'}
                                color={tech.isActive !== false ? 'success' : 'default'}
                                size='small'
                                onClick={() => handleToggleStatus(tech)}
                                disabled={actionLoading}
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' noWrap>{formatDate(tech.createdAt)}</Typography>
                          </TableCell>
                          <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title='Edit'>
                              <IconButton size='small' color='primary' onClick={() => handleEditOpen(tech)}><Edit fontSize='small' /></IconButton>
                            </Tooltip>
                            <Tooltip title='Ganti Password'>
                              <IconButton size='small' color='warning' onClick={() => handlePasswordOpen(tech)}><Lock fontSize='small' /></IconButton>
                            </Tooltip>
                            <Tooltip title='Hapus'>
                              <IconButton size='small' color='error' onClick={() => handleDeleteOpen(tech)}><Delete fontSize='small' /></IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, mt: 1, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Menampilkan {paginatedTechnicians.length} dari {filteredTechnicians.length} teknisi
                  </Typography>
                  {totalPages > 1 && (
                    <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color='primary' size='small' />
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* ==================== Create Dialog ==================== */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Tambah Teknisi Baru</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label='Nama Lengkap' required value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='NIP' required placeholder='Contoh: 199001012020121001'
                  helperText='Hanya angka, tanpa spasi atau tanda baca' value={formData.nip}
                  onChange={e => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Email' type='email' required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Nomor Telepon' required value={formData.noHp}
                  onChange={e => setFormData({ ...formData, noHp: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Divisi</InputLabel>
                  <Select value={formData.divisi} label='Divisi'
                    onChange={e => setFormData({ ...formData, divisi: e.target.value })}>
                    <MenuItem value='perencanaan_teknik'>Perencanaan Teknik</MenuItem>
                    <MenuItem value='teknik_cabang'>Teknik Cabang</MenuItem>
                    <MenuItem value='pengawasan_teknik'>Pengawasan Teknik</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Password' type='password' required
                  helperText='Min 8 karakter, 1 huruf kapital, 1 karakter khusus' value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button variant='contained' onClick={handleCreate}
              disabled={actionLoading || !formData.namaLengkap || !formData.nip || !formData.email || !formData.noHp || !formData.password}>
              {actionLoading ? <CircularProgress size={24} /> : 'Tambah'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ==================== Edit Dialog ==================== */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Edit Teknisi</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label='Nama Lengkap' value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='NIP' helperText='Hanya angka, tanpa spasi atau tanda baca' value={formData.nip}
                  onChange={e => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Email' type='email' value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Nomor Telepon' value={formData.noHp}
                  onChange={e => setFormData({ ...formData, noHp: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Divisi</InputLabel>
                  <Select value={formData.divisi} label='Divisi'
                    onChange={e => setFormData({ ...formData, divisi: e.target.value })}>
                    <MenuItem value='perencanaan_teknik'>Perencanaan Teknik</MenuItem>
                    <MenuItem value='teknik_cabang'>Teknik Cabang</MenuItem>
                    <MenuItem value='pengawasan_teknik'>Pengawasan Teknik</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button variant='contained' onClick={handleUpdate}
              disabled={actionLoading || !formData.namaLengkap || !formData.email || !formData.noHp}>
              {actionLoading ? <CircularProgress size={24} /> : 'Simpan'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ==================== Delete Dialog ==================== */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <DialogContent>
            <Typography>
              Apakah Anda yakin ingin menghapus teknisi{' '}
              <strong>{selectedTechnician?.namaLengkap}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant='contained' color='error' onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={24} /> : 'Hapus'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ==================== Change Password Dialog ==================== */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Ganti Password — {selectedTechnician?.namaLengkap}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label='Password Lama' type='password' required value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label='Password Baru' type='password' required
                  helperText='Min 8 karakter, 1 huruf kapital, 1 karakter khusus' value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Batal</Button>
            <Button variant='contained' onClick={handleChangePassword}
              disabled={actionLoading || !passwordForm.oldPassword || !passwordForm.newPassword}>
              {actionLoading ? <CircularProgress size={24} /> : 'Ganti Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
