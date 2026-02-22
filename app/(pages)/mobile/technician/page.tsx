// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Home,
  Assignment,
  LocationOn,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Notifications,
  AccountCircle,
  Build,
  Schedule,
  Menu as MenuIcon,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries/workOrder';
import { UPDATE_WORK_ORDER_STATUS } from '@/lib/graphql/mutations/workOrder';

const STATUS_LABELS: Record<string, string> = {
  Ditugaskan: 'Ditugaskan',
  SedangDikerjakan: 'Sedang Dikerjakan',
  Selesai: 'Selesai',
  Dibatalkan: 'Dibatalkan',
  Ditunda: 'Ditunda',
  DitinjauAdmin: 'Ditinjau Admin',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  Ditugaskan: 'info',
  SedangDikerjakan: 'primary',
  Selesai: 'success',
  Dibatalkan: 'error',
  Ditunda: 'warning',
  DitinjauAdmin: 'default',
};

function getStatusIcon(status: string) {
  if (status === 'Selesai') return <CheckCircle fontSize="small" />;
  if (status === 'SedangDikerjakan') return <Build fontSize="small" />;
  if (status === 'Ditugaskan') return <Schedule fontSize="small" />;
  if (status === 'Dibatalkan') return <ErrorIcon fontSize="small" />;
  return <Warning fontSize="small" />;
}

export default function TechnicianMobileApp() {
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_WORK_ORDERS, {
    fetchPolicy: 'network-only',
  });

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_WORK_ORDER_STATUS, {
    onCompleted: () => {
      refetch();
      setOpenUpdate(false);
      setCatatan('');
      setSnackbarMessage('Status berhasil diperbarui');
      setSnackbarOpen(true);
    },
    onError: (err) => {
      setSnackbarMessage('Gagal: ' + err.message);
      setSnackbarOpen(true);
    },
  });

  const allWO: any[] = data?.getAllWorkOrders || [];

  // Statistik
  const activeWO = allWO.filter(w => w.status === 'Ditugaskan' || w.status === 'SedangDikerjakan');
  const selesaiWO = allWO.filter(w => w.status === 'Selesai');
  const ditugaskan = allWO.filter(w => w.status === 'Ditugaskan').length;
  const dikerjakan = allWO.filter(w => w.status === 'SedangDikerjakan').length;

  const handleOpenUpdate = (wo: any) => {
    setSelectedWO(wo);
    setNewStatus(wo.status);
    setCatatan(wo.catatan || '');
    setOpenUpdate(true);
  };

  const handleSaveStatus = () => {
    if (!selectedWO) return;
    updateStatus({ variables: { id: selectedWO._id, status: newStatus, catatan } });
  };

  const renderDashboard = () => (
    <Box sx={{ p: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>{ditugaskan}</Typography>
                  <Typography variant="body2" color="text.secondary">Ditugaskan</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>{dikerjakan}</Typography>
                  <Typography variant="body2" color="text.secondary">Dikerjakan</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{selesaiWO.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Selesai</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{allWO.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total WO</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* WO Aktif */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Work Order Aktif</Typography>
          {activeWO.length === 0 ? (
            <Alert severity="info">Tidak ada work order aktif saat ini.</Alert>
          ) : (
            activeWO.slice(0, 3).map((wo) => (
              <Card key={wo._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {wo.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || 'Pelanggan tidak diketahui'}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(wo.status)}
                      label={STATUS_LABELS[wo.status] || wo.status}
                      color={STATUS_COLORS[wo.status] || 'default'}
                      size="small"
                    />
                  </Box>
                  {wo.catatan && (
                    <Typography variant="caption" color="text.secondary">{wo.catatan}</Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => handleOpenUpdate(wo)}>
                      Update Status
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </Box>
  );

  const renderWorkOrders = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Semua Work Order</Typography>
        <IconButton size="small" onClick={() => refetch()} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : allWO.length === 0 ? (
        <Alert severity="info">Belum ada work order.</Alert>
      ) : (
        allWO.map((wo) => (
          <Card key={wo._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {wo.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}
                </Typography>
                <Chip
                  icon={getStatusIcon(wo.status)}
                  label={STATUS_LABELS[wo.status] || wo.status}
                  color={STATUS_COLORS[wo.status] || 'default'}
                  size="small"
                />
              </Box>

              {wo.tim && wo.tim.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Tim: {wo.tim.map((t: any) => t.namaLengkap).join(', ')}
                </Typography>
              )}

              {wo.catatan && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {wo.catatan}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('id-ID') : '-'}
              </Typography>

              <Button
                size="small"
                variant="outlined"
                startIcon={<Build />}
                onClick={() => handleOpenUpdate(wo)}
                disabled={wo.status === 'Selesai' || wo.status === 'Dibatalkan'}
              >
                Update Status
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  const renderProfile = () => (
    <Box sx={{ p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 20 }}>
              T
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Teknisi</Typography>
              <Typography variant="body2" color="text.secondary">PERUMDAM Tirta Daroy</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Total WO</Typography>
            <Typography variant="body2" fontWeight={600}>{allWO.length}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Selesai</Typography>
            <Typography variant="body2" fontWeight={600} color="success.main">{selesaiWO.length}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Tingkat Penyelesaian</Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {allWO.length > 0 ? Math.round((selesaiWO.length / allWO.length) * 100) : 0}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info">
        Halaman profil teknisi menampilkan data agregat dari semua work order dalam sistem.
      </Alert>
    </Box>
  );

  return (
    <Box sx={{ pb: 7 }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Aqualink Mobile</Typography>
          <IconButton color="inherit" onClick={() => refetch()} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ mt: 8, mb: 7 }}>
        {currentTab === 0 && renderDashboard()}
        {currentTab === 1 && renderWorkOrders()}
        {currentTab === 2 && renderProfile()}
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={currentTab}
        onChange={(_, v) => setCurrentTab(v)}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
      >
        <BottomNavigationAction label="Dashboard" icon={<Home />} />
        <BottomNavigationAction label="Work Order" icon={<Assignment />} />
        <BottomNavigationAction label="Profil" icon={<AccountCircle />} />
      </BottomNavigation>

      {/* Dialog Update Status */}
      <Dialog open={openUpdate} onClose={() => setOpenUpdate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Status Work Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pelanggan: <strong>{selectedWO?.idSurvei?.idKoneksiData?.idPelanggan?.namaLengkap || '-'}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Status">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdate(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSaveStatus} disabled={!newStatus || updating}>
            {updating ? <CircularProgress size={20} /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
