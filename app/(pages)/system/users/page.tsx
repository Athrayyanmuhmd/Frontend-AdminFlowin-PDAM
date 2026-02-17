'use client';

import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Alert,
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
  Block,
  LockReset,
  Email,
  Phone,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { userAPI } from '../../../utils/API';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@pdam.ac.id',
    fullName: 'Administrator',
    phone: '081234567890',
    role: 'super_admin',
    status: 'active',
    lastLogin: new Date('2024-01-20T10:30:00'),
    createdAt: new Date('2020-01-01'),
    permissions: ['all'],
  },
  {
    id: '2',
    username: 'operator1',
    email: 'operator1@pdam.ac.id',
    fullName: 'Operator Satu',
    phone: '081234567891',
    role: 'operator',
    status: 'active',
    lastLogin: new Date('2024-01-20T09:15:00'),
    createdAt: new Date('2021-06-15'),
    permissions: ['customers:read', 'billing:read', 'workorders:manage'],
  },
  {
    id: '3',
    username: 'viewer1',
    email: 'viewer1@pdam.ac.id',
    fullName: 'Viewer User',
    phone: '081234567892',
    role: 'viewer',
    status: 'active',
    lastLogin: new Date('2024-01-19T14:20:00'),
    createdAt: new Date('2022-03-10'),
    permissions: ['customers:read', 'billing:read'],
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleResetPassword = () => {
    setOpenResetPasswordDialog(true);
    handleMenuClose();
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      // await userAPI.updateStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'operator': return 'primary';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'operator': return 'Operator';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield />;
      case 'admin': return <AdminPanelSettings />;
      case 'operator': return <Person />;
      case 'viewer': return <Visibility />;
      default: return <Person />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Tidak Aktif';
      case 'suspended': return 'Ditangguhkan';
      default: return status;
    }
  };

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <AdminLayout title="Manajemen User">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manajemen User
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddDialog(true)}
          >
            Tambah User
          </Button>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Perhatian!</strong> Perubahan role dan permission akan langsung berpengaruh pada akses user.
        </Alert>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total User
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      User Aktif
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Shield />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.role === 'super_admin' || u.role === 'admin').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admin
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.status === 'inactive' || u.status === 'suspended').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Non-Aktif
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Cari user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="operator">Operator</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Tidak Aktif</MenuItem>
                    <MenuItem value="suspended">Ditangguhkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Kontak</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Login Terakhir</TableCell>
                  <TableCell>Aksi</TableCell>
                  <TableCell align="right">Menu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(user.role) + '.main' }}>
                          {getRoleIcon(user.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <Email sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                          {user.email}
                        </Typography>
                        {user.phone && (
                          <Typography variant="body2">
                            <Phone sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                            {user.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={getRoleColor(user.role) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(user.status)}
                        size="small"
                        color={getStatusColor(user.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <Typography variant="body2">
                          {user.lastLogin.toLocaleString('id-ID')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Belum pernah login
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.status === 'active'}
                            onChange={() => handleToggleStatus(user.id, user.status)}
                            disabled={user.role === 'super_admin'}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filteredUsers.length / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </Card>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          Lihat Detail
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <LockReset sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Block sx={{ mr: 1 }} />
          Suspend User
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Hapus
        </MenuItem>
      </Menu>

      {/* User Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi User
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Username:</strong> {selectedUser.username}</Typography>
                  <Typography><strong>Nama Lengkap:</strong> {selectedUser.fullName}</Typography>
                  <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                  <Typography><strong>Telepon:</strong> {selectedUser.phone || '-'}</Typography>
                  <Typography><strong>Role:</strong> {getRoleLabel(selectedUser.role)}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedUser.status)}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Aktivitas
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Dibuat:</strong> {selectedUser.createdAt.toLocaleDateString('id-ID')}</Typography>
                  <Typography><strong>Login Terakhir:</strong> {selectedUser.lastLogin?.toLocaleString('id-ID') || 'Belum pernah'}</Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Permissions ({selectedUser.permissions.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedUser.permissions.map((perm, index) => (
                    <Chip key={index} label={perm} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained">Edit User</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tambah User Baru</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Username" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nama Lengkap" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" type="email" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Telepon" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Password" type="password" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Konfirmasi Password" type="password" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select label="Role">
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="operator">Operator</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select label="Status" defaultValue="active">
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Tidak Aktif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Batal</Button>
          <Button variant="contained">
            Tambah User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={openResetPasswordDialog} onClose={() => setOpenResetPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Reset password untuk user: <strong>{selectedUser.fullName}</strong>
              </Alert>
              <TextField
                fullWidth
                label="Password Baru"
                type="password"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Konfirmasi Password Baru"
                type="password"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetPasswordDialog(false)}>Batal</Button>
          <Button variant="contained" color="warning">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
