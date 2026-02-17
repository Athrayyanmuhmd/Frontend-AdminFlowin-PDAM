'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Home,
  Assignment,
  LocationOn,
  CameraAlt,
  Mic,
  CheckCircle,
  Warning,
  Error,
  Menu,
  Notifications,
  AccountCircle,
  QrCode,
  Upload,
  Download,
  Navigation,
  Build,
  Schedule,
  Phone,
  Email,
  Map,
  BatteryFull,
  SignalCellularAlt,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { WorkOrder, MobileAppData } from '../../../types/admin.types';

// Mock data untuk demo
const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    type: 'installation',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Teknisi A',
    customerId: '1',
    accountId: 'ACC-001-2024',
    description: 'Instalasi meteran baru untuk pelanggan baru',
    location: {
      address: 'Jl. Teuku Umar No. 123, Banda Aceh',
      coordinates: {
        latitude: 5.5483,
        longitude: 95.3238,
      },
    },
    scheduledDate: new Date('2024-01-20T09:00:00'),
    estimatedDuration: 120,
    materials: [
      {
        id: '1',
        name: 'Meteran Digital 1/2"',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 250000,
        totalPrice: 250000,
      },
    ],
  },
  {
    id: '2',
    type: 'maintenance',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'Teknisi A',
    customerId: '2',
    accountId: 'ACC-002-2024',
    description: 'Pemeliharaan rutin meteran dan pipa',
    location: {
      address: 'Jl. Cut Nyak Dien No. 456, Banda Aceh',
      coordinates: {
        latitude: 5.5483,
        longitude: 95.3238,
      },
    },
    scheduledDate: new Date('2024-01-21T10:00:00'),
    estimatedDuration: 90,
  },
];

export default function TechnicianMobileApp() {
  const [currentTab, setCurrentTab] = useState(0);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [signalStrength, setSignalStrength] = useState(4);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 5.5483,
    longitude: 95.3238,
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Simulasi status koneksi
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOffline(Math.random() < 0.1); // 10% chance offline
      setBatteryLevel(prev => Math.max(20, prev - Math.random() * 2));
      setSignalStrength(Math.floor(Math.random() * 5) + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleStartWork = (workOrder: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === workOrder.id 
        ? { ...wo, status: 'in_progress' }
        : wo
    ));
    setSnackbarMessage('Perintah kerja dimulai');
    setSnackbarOpen(true);
  };

  const handleCompleteWork = (workOrder: WorkOrder) => {
    setWorkOrders(prev => prev.map(wo => 
      wo.id === workOrder.id 
        ? { ...wo, status: 'completed', completedDate: new Date() }
        : wo
    ));
    setSnackbarMessage('Perintah kerja selesai');
    setSnackbarOpen(true);
  };

  const handleTakePhoto = () => {
    setSnackbarMessage('Kamera dibuka');
    setSnackbarOpen(true);
  };

  const handleRecordVoice = () => {
    setSnackbarMessage('Perekaman suara dimulai');
    setSnackbarOpen(true);
  };

  const handleScanQR = () => {
    setSnackbarMessage('Scanner QR Code dibuka');
    setSnackbarOpen(true);
  };

  const handleNavigate = (workOrder: WorkOrder) => {
    setSnackbarMessage(`Navigasi ke ${workOrder.location.address}`);
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'in_progress': return 'Dalam Proses';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Rendah';
      case 'medium': return 'Sedang';
      case 'high': return 'Tinggi';
      case 'critical': return 'Kritis';
      default: return priority;
    }
  };

  const renderDashboard = () => (
    <Box sx={{ p: 2 }}>
      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {workOrders.filter(wo => wo.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Menunggu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {workOrders.filter(wo => wo.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dalam Proses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Sistem
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Koneksi</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOffline ? <WifiOff color="error" /> : <Wifi color="success" />}
                <Typography variant="body2" color={isOffline ? 'error.main' : 'success.main'}>
                  {isOffline ? 'Offline' : 'Online'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Baterai</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BatteryFull color={batteryLevel < 30 ? 'error' : batteryLevel < 60 ? 'warning' : 'success'} />
                <Typography variant="body2">{batteryLevel}%</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Sinyal</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SignalCellularAlt color={signalStrength < 2 ? 'error' : signalStrength < 4 ? 'warning' : 'success'} />
                <Typography variant="body2">{signalStrength}/5</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Aksi Cepat
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={handleTakePhoto}
                sx={{ py: 1.5 }}
              >
                Ambil Foto
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Mic />}
                onClick={handleRecordVoice}
                sx={{ py: 1.5 }}
              >
                Rekam Suara
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<QrCode />}
                onClick={handleScanQR}
                sx={{ py: 1.5 }}
              >
                Scan QR
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => {
                  setSnackbarMessage('Sinkronisasi data');
                  setSnackbarOpen(true);
                }}
                sx={{ py: 1.5 }}
              >
                Sinkronisasi
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderWorkOrders = () => (
    <Box sx={{ p: 2 }}>
      <List>
        {workOrders.map((workOrder) => (
          <Card key={workOrder.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    WO-{workOrder.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {workOrder.description}
                  </Typography>
                </Box>
                <Chip 
                  label={getStatusLabel(workOrder.status)}
                  size="small"
                  color={getStatusColor(workOrder.status) as any}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {workOrder.location.address}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={getPriorityLabel(workOrder.priority)}
                  size="small"
                  color={getPriorityColor(workOrder.priority) as any}
                />
                <Typography variant="caption" color="text.secondary">
                  {workOrder.scheduledDate?.toLocaleDateString('id-ID')} {workOrder.scheduledDate?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Navigation />}
                  onClick={() => handleNavigate(workOrder)}
                >
                  Navigasi
                </Button>
                {workOrder.status === 'pending' && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Build />}
                    onClick={() => handleStartWork(workOrder)}
                  >
                    Mulai
                  </Button>
                )}
                {workOrder.status === 'in_progress' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleCompleteWork(workOrder)}
                  >
                    Selesai
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );

  const renderProfile = () => (
    <Box sx={{ p: 2 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
              TA
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Teknisi A
              </Typography>
              <Typography variant="body2" color="text.secondary">
                teknisi@pdam-tirtadaroy.ac.id
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +62 812 3456 7890
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Perintah Kerja Hari Ini</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {workOrders.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Selesai</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {workOrders.filter(wo => wo.status === 'completed').length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Efisiensi</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
              {workOrders.length > 0 ? Math.round((workOrders.filter(wo => wo.status === 'completed').length / workOrders.length) * 100) : 0}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pengaturan
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notifikasi Push"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="GPS Tracking"
            />
            <FormControlLabel
              control={<Switch />}
              label="Mode Offline"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto Sync"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ pb: 7 }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit">
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Flowin Mobile
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
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
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <BottomNavigationAction label="Dashboard" icon={<Home />} />
        <BottomNavigationAction label="Perintah Kerja" icon={<Assignment />} />
        <BottomNavigationAction label="Profil" icon={<AccountCircle />} />
      </BottomNavigation>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000,
        }}
        onClick={handleTakePhoto}
      >
        <CameraAlt />
      </Fab>

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
