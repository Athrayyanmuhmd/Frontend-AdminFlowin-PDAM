'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
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
  Paper,
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
  Tooltip,
  Pagination,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Build,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  LocationOn,
  Phone,
  Person,
  CameraAlt,
  Mic,
  Upload,
  Download,
  Navigation,
  QrCode,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';
import { GET_WORK_ORDERS, GET_WORK_ORDER_STATS } from '@/lib/graphql/queries/workOrder';
import { UPDATE_WORK_ORDER_STATUS, DELETE_WORK_ORDER } from '@/lib/graphql/mutations/workOrder';
import { WorkOrder } from '../../../types/workOrder.types';

const steps = [
  'Diterima',
  'Dijadwalkan',
  'Dalam Proses',
  'Selesai',
  'Diverifikasi',
];

export default function WorkOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // GraphQL queries
  const { data, loading, error, refetch } = useQuery(GET_WORK_ORDERS, {
    variables: {
      filter: {
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterPriority !== 'all' && { priority: filterPriority }),
        ...(searchTerm && { search: searchTerm }),
        page,
        limit: rowsPerPage,
      },
    },
  });

  const { data: statsData } = useQuery(GET_WORK_ORDER_STATS);

  // GraphQL mutations
  const [updateStatus] = useMutation(UPDATE_WORK_ORDER_STATUS, {
    onCompleted: () => refetch(),
  });

  const [deleteWorkOrder] = useMutation(DELETE_WORK_ORDER, {
    onCompleted: () => refetch(),
  });

  const workOrders = data?.workOrders?.data || [];
  const pagination = data?.workOrders?.pagination;
  const stats = statsData?.workOrderStats;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workOrder: WorkOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkOrder(workOrder);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorkOrder(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleStartWork = () => {
    if (selectedWorkOrder) {
      updateStatus({
        variables: { id: selectedWorkOrder._id, status: 'in_progress' },
      });
    }
    handleMenuClose();
  };

  const handleCompleteWork = () => {
    if (selectedWorkOrder) {
      updateStatus({
        variables: { id: selectedWorkOrder._id, status: 'completed' },
      });
    }
    handleMenuClose();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'installation': return 'Instalasi';
      case 'maintenance': return 'Pemeliharaan';
      case 'repair': return 'Perbaikan';
      case 'disconnection': return 'Pemutusan';
      case 'emergency': return 'Darurat';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'assigned': return 'Ditugaskan';
      case 'in_progress': return 'Dalam Proses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule color="warning" />;
      case 'assigned': return <Build color="info" />;
      case 'in_progress': return <Build color="primary" />;
      case 'completed': return <CheckCircle color="success" />;
      case 'cancelled': return <Error color="error" />;
      default: return <Build />;
    }
  };

  const getCurrentStep = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'assigned': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const getStatCount = (statusName: string) => {
    return stats?.workOrdersByStatus?.find((s: any) => s.status === statusName)?.count || 0;
  };

  return (
    <AdminLayout title="Manajemen Perintah Kerja">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          Manajemen Perintah Kerja
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat data work order: {error.message}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Build />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats?.totalWorkOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Perintah Kerja
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
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {getStatCount('pending')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Menunggu
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
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Build />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {getStatCount('in_progress')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dalam Proses
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
                      {getStatCount('completed')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Selesai
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Cari perintah kerja..."
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
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Jenis</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Jenis"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="installation">Instalasi</MenuItem>
                    <MenuItem value="maintenance">Pemeliharaan</MenuItem>
                    <MenuItem value="repair">Perbaikan</MenuItem>
                    <MenuItem value="disconnection">Pemutusan</MenuItem>
                    <MenuItem value="emergency">Darurat</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="pending">Menunggu</MenuItem>
                    <MenuItem value="assigned">Ditugaskan</MenuItem>
                    <MenuItem value="in_progress">Dalam Proses</MenuItem>
                    <MenuItem value="completed">Selesai</MenuItem>
                    <MenuItem value="cancelled">Dibatalkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Prioritas</InputLabel>
                  <Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    label="Prioritas"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="low">Rendah</MenuItem>
                    <MenuItem value="medium">Sedang</MenuItem>
                    <MenuItem value="high">Tinggi</MenuItem>
                    <MenuItem value="critical">Kritis</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ height: '56px' }}
                >
                  Buat Perintah Kerja
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Work Orders Table */}
        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>No. WO</TableCell>
                      <TableCell>Jenis</TableCell>
                      <TableCell>Prioritas</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Teknisi</TableCell>
                      <TableCell>Lokasi</TableCell>
                      <TableCell>Jadwal</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrders.map((workOrder: WorkOrder) => (
                      <TableRow key={workOrder._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {workOrder.workOrderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTypeLabel(workOrder.type)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPriorityLabel(workOrder.priority)}
                            size="small"
                            color={getPriorityColor(workOrder.priority) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(workOrder.status)}
                            <Chip
                              label={getStatusLabel(workOrder.status)}
                              size="small"
                              color={getStatusColor(workOrder.status) as any}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {workOrder.assignedTechnicianId?.namaLengkap || 'Belum ditugaskan'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn sx={{ fontSize: 16 }} />
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {workOrder.location?.address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(workOrder.scheduledDate).toLocaleDateString('id-ID')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(workOrder.scheduledDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, workOrder)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {workOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Tidak ada data work order
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={pagination?.totalPages || 1}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            </>
          )}
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
        <MenuItem onClick={handleStartWork}>
          <Build sx={{ mr: 1 }} />
          Mulai Kerja
        </MenuItem>
        <MenuItem onClick={handleCompleteWork}>
          <CheckCircle sx={{ mr: 1 }} />
          Selesai
        </MenuItem>
        <MenuItem>
          <Navigation sx={{ mr: 1 }} />
          Navigasi GPS
        </MenuItem>
        <MenuItem>
          <QrCode sx={{ mr: 1 }} />
          Scan QR Code
        </MenuItem>
      </Menu>

      {/* Work Order Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Perintah Kerja
          {selectedWorkOrder && ` - ${selectedWorkOrder.workOrderNumber}`}
        </DialogTitle>
        <DialogContent>
          {selectedWorkOrder && (
            <Box>
              {/* Progress Stepper */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Status Progress
                </Typography>
                <Stepper activeStep={getCurrentStep(selectedWorkOrder.status)} orientation="horizontal">
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informasi Perintah Kerja
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Jenis:</strong> {getTypeLabel(selectedWorkOrder.type)}</Typography>
                    <Typography><strong>Prioritas:</strong> {getPriorityLabel(selectedWorkOrder.priority)}</Typography>
                    <Typography><strong>Status:</strong> {getStatusLabel(selectedWorkOrder.status)}</Typography>
                    <Typography><strong>Teknisi:</strong> {selectedWorkOrder.assignedTechnicianId?.namaLengkap || 'Belum ditugaskan'}</Typography>
                    <Typography><strong>Pelanggan:</strong> {selectedWorkOrder.customerName || '-'}</Typography>
                    <Typography><strong>Deskripsi:</strong> {selectedWorkOrder.description}</Typography>
                    <Typography><strong>Lokasi:</strong> {selectedWorkOrder.location?.address}</Typography>
                    <Typography><strong>Jadwal:</strong> {new Date(selectedWorkOrder.scheduledDate).toLocaleString('id-ID')}</Typography>
                    <Typography><strong>Durasi Estimasi:</strong> {selectedWorkOrder.estimatedDuration} menit</Typography>
                    {selectedWorkOrder.actualDuration && (
                      <Typography><strong>Durasi Aktual:</strong> {selectedWorkOrder.actualDuration} menit</Typography>
                    )}
                    {selectedWorkOrder.completedAt && (
                      <Typography><strong>Tanggal Selesai:</strong> {new Date(selectedWorkOrder.completedAt).toLocaleString('id-ID')}</Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  {selectedWorkOrder.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Catatan
                      </Typography>
                      <Typography variant="body2">
                        {selectedWorkOrder.notes}
                      </Typography>
                    </Box>
                  )}

                  {selectedWorkOrder.adminNotes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Catatan Admin
                      </Typography>
                      <Typography variant="body2">
                        {selectedWorkOrder.adminNotes}
                      </Typography>
                    </Box>
                  )}

                  {/* Activity Log */}
                  {selectedWorkOrder.activityLog && selectedWorkOrder.activityLog.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Log Aktivitas
                      </Typography>
                      <List dense>
                        {selectedWorkOrder.activityLog.map((log: any, index: number) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={log.details}
                              secondary={`${log.performedBy?.userName || 'System'} - ${new Date(log.timestamp).toLocaleString('id-ID')}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="contained" startIcon={<Navigation />}>
            Navigasi GPS
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
