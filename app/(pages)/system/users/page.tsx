// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Person,
  AdminPanelSettings,
  Shield,
  LockReset,
  Email,
  Phone,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  GET_ALL_ADMINS,
  CREATE_ADMIN,
  UPDATE_ADMIN,
  DELETE_ADMIN,
} from '../../../../lib/graphql/queries/admin';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form state - add
  const [addForm, setAddForm] = useState({ NIP: '', namaLengkap: '', email: '', noHP: '', password: '', confirmPassword: '' });
  const [addFormError, setAddFormError] = useState('');

  // Form state - edit
  const [editForm, setEditForm] = useState({ NIP: '', namaLengkap: '', email: '', noHP: '' });

  // Form state - reset password
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetFormError, setResetFormError] = useState('');

  // GraphQL
  const { data, loading, error, refetch } = useQuery(GET_ALL_ADMINS, { fetchPolicy: 'network-only' });
  const [createAdmin, { loading: creating }] = useMutation(CREATE_ADMIN, { onCompleted: () => { refetch(); setOpenAddDialog(false); setAddForm({ NIP: '', namaLengkap: '', email: '', noHP: '', password: '', confirmPassword: '' }); showAlert('success', 'Admin berhasil ditambahkan'); }, onError: (e) => setAddFormError(e.message) });
  const [updateAdmin, { loading: updating }] = useMutation(UPDATE_ADMIN, { onCompleted: () => { refetch(); setOpenEditDialog(false); showAlert('success', 'Data admin berhasil diperbarui'); }, onError: (e) => showAlert('error', e.message) });
  const [deleteAdmin, { loading: deleting }] = useMutation(DELETE_ADMIN, { onCompleted: () => { refetch(); setOpenDeleteDialog(false); showAlert('success', 'Admin berhasil dihapus'); }, onError: (e) => showAlert('error', e.message) });

  const admins = data?.getAllAdmins || [];

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlertMsg({ type, msg });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const q = searchTerm.toLowerCase();
    return admins.filter((a: any) =>
      a.namaLengkap?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.NIP?.toLowerCase().includes(q) ||
      a.noHP?.toLowerCase().includes(q)
    );
  }, [admins, searchTerm]);

  const startIndex = (page - 1) * rowsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + rowsPerPage);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admin: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmin(admin);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleViewDetails = () => { setOpenDetailDialog(true); handleMenuClose(); };
  const handleOpenEdit = () => {
    setEditForm({ NIP: selectedAdmin?.NIP || '', namaLengkap: selectedAdmin?.namaLengkap || '', email: selectedAdmin?.email || '', noHP: selectedAdmin?.noHP || '' });
    setOpenEditDialog(true);
    handleMenuClose();
  };
  const handleOpenDelete = () => { setOpenDeleteDialog(true); handleMenuClose(); };
  const handleOpenReset = () => { setResetForm({ password: '', confirmPassword: '' }); setResetFormError(''); setOpenResetPasswordDialog(true); handleMenuClose(); };

  const handleAddSubmit = async () => {
    setAddFormError('');
    if (!addForm.NIP || !addForm.namaLengkap || !addForm.email || !addForm.noHP || !addForm.password) {
      setAddFormError('Semua field wajib diisi'); return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setAddFormError('Konfirmasi password tidak cocok'); return;
    }
    await createAdmin({ variables: { input: { NIP: addForm.NIP, namaLengkap: addForm.namaLengkap, email: addForm.email, noHP: addForm.noHP, password: addForm.password } } });
  };

  const handleEditSubmit = async () => {
    await updateAdmin({ variables: { id: selectedAdmin._id, input: { NIP: editForm.NIP, namaLengkap: editForm.namaLengkap, email: editForm.email, noHP: editForm.noHP } } });
  };

  const handleDeleteConfirm = async () => {
    await deleteAdmin({ variables: { id: selectedAdmin._id } });
  };

  const handleResetSubmit = async () => {
    setResetFormError('');
    if (!resetForm.password) { setResetFormError('Password baru wajib diisi'); return; }
    if (resetForm.password !== resetForm.confirmPassword) { setResetFormError('Konfirmasi password tidak cocok'); return; }
    await updateAdmin({ variables: { id: selectedAdmin._id, input: { password: resetForm.password } } });
    setOpenResetPasswordDialog(false);
    showAlert('success', 'Password berhasil direset');
  };

  const formatDate = (ts: string) => {
    if (!ts) return '-';
    return new Date(parseInt(ts) || ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return (
    <AdminLayout title="Manajemen User">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout title="Manajemen User">
      <Alert severity="error">Gagal memuat data admin: {error.message}</Alert>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Manajemen User">
      <Box sx={{ mb: 3 }}>
        {alertMsg && <Alert severity={alertMsg.type} sx={{ mb: 2 }} onClose={() => setAlertMsg(null)}>{alertMsg.msg}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>Manajemen Admin</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setAddFormError(''); setAddForm({ NIP: '', namaLengkap: '', email: '', noHP: '', password: '', confirmPassword: '' }); setOpenAddDialog(true); }}>
            Tambah Admin
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{admins.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Admin</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}><CheckCircle /></Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{admins.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Admin Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}><Shield /></Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{admins.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Administrator</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}><Warning /></Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>0</Typography>
                    <Typography variant="body2" color="text.secondary">Non-Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Cari admin berdasarkan nama, email, NIP, atau no. HP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Admin</TableCell>
                  <TableCell>Kontak</TableCell>
                  <TableCell>NIP</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Dibuat</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        {searchTerm ? 'Tidak ada admin yang cocok dengan pencarian' : 'Belum ada data admin'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedAdmins.map((admin: any) => (
                  <TableRow key={admin._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}><AdminPanelSettings /></Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{admin.namaLengkap}</Typography>
                          <Typography variant="caption" color="text.secondary">{admin.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <Email sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{admin.email}
                        </Typography>
                        <Typography variant="body2">
                          <Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{admin.noHP}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{admin.NIP || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip icon={<Shield />} label="Administrator" size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(admin.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, admin)} size="small"><MoreVert /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filteredAdmins.length / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </Card>
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewDetails}><Visibility sx={{ mr: 1 }} />Lihat Detail</MenuItem>
        <MenuItem onClick={handleOpenEdit}><Edit sx={{ mr: 1 }} />Edit</MenuItem>
        <MenuItem onClick={handleOpenReset}><LockReset sx={{ mr: 1 }} />Reset Password</MenuItem>
        <MenuItem onClick={handleOpenDelete} sx={{ color: 'error.main' }}><Delete sx={{ mr: 1 }} />Hapus</MenuItem>
      </Menu>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detail Admin</DialogTitle>
        <DialogContent>
          {selectedAdmin && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><AdminPanelSettings /></Avatar>
                  <Box>
                    <Typography variant="h6">{selectedAdmin.namaLengkap}</Typography>
                    <Chip icon={<Shield />} label="Administrator" size="small" color="primary" />
                  </Box>
                </Box>
              </Grid>
              {[
                { label: 'NIP', value: selectedAdmin.NIP || '-' },
                { label: 'Email', value: selectedAdmin.email },
                { label: 'No. HP', value: selectedAdmin.noHP },
                { label: 'Dibuat', value: formatDate(selectedAdmin.createdAt) },
                { label: 'Diperbarui', value: formatDate(selectedAdmin.updatedAt) },
              ].map(({ label, value }) => (
                <Grid item xs={6} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Tutup</Button>
          <Button variant="contained" onClick={() => { setOpenDetailDialog(false); handleOpenEdit(); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tambah Admin Baru</DialogTitle>
        <DialogContent>
          {addFormError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{addFormError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="NIP" required value={addForm.NIP} onChange={e => setAddForm(f => ({ ...f, NIP: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nama Lengkap" required value={addForm.namaLengkap} onChange={e => setAddForm(f => ({ ...f, namaLengkap: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" type="email" required value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="No. HP" required value={addForm.noHP} onChange={e => setAddForm(f => ({ ...f, noHP: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Password" type="password" required value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Konfirmasi Password" type="password" required value={addForm.confirmPassword} onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} disabled={creating}>Batal</Button>
          <Button variant="contained" onClick={handleAddSubmit} disabled={creating} startIcon={creating ? <CircularProgress size={16} /> : <Add />}>
            {creating ? 'Menyimpan...' : 'Tambah Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Admin — {selectedAdmin?.namaLengkap}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="NIP" value={editForm.NIP} onChange={e => setEditForm(f => ({ ...f, NIP: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nama Lengkap" required value={editForm.namaLengkap} onChange={e => setEditForm(f => ({ ...f, namaLengkap: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="No. HP" required value={editForm.noHP} onChange={e => setEditForm(f => ({ ...f, noHP: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={updating}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={updating} startIcon={updating ? <CircularProgress size={16} /> : <Edit />}>
            {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Admin</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1 }}>
            Hapus admin <strong>{selectedAdmin?.namaLengkap}</strong>? Tindakan ini tidak dapat dibatalkan.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting} startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={openResetPasswordDialog} onClose={() => setOpenResetPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password — {selectedAdmin?.namaLengkap}</DialogTitle>
        <DialogContent>
          {resetFormError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{resetFormError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Alert severity="warning">Reset password untuk: <strong>{selectedAdmin?.namaLengkap}</strong></Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password Baru" type="password" value={resetForm.password} onChange={e => setResetForm(f => ({ ...f, password: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Konfirmasi Password Baru" type="password" value={resetForm.confirmPassword} onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetPasswordDialog(false)} disabled={updating}>Batal</Button>
          <Button variant="contained" color="warning" onClick={handleResetSubmit} disabled={updating} startIcon={updating ? <CircularProgress size={16} /> : <LockReset />}>
            {updating ? 'Mereset...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
