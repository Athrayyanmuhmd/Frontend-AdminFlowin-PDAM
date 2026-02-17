'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  FilterList,
  FileDownload,
  Refresh,
  Visibility,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AdminLayout from '../../../layouts/AdminLayout';
import { AuditLog } from '../../../types/admin.types';
import dayjs, { Dayjs } from 'dayjs';

// Mock data untuk audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'admin001',
    action: 'USER_LOGIN',
    resource: 'Authentication',
    resourceId: 'admin001',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2025-10-02T08:30:00'),
  },
  {
    id: '2',
    userId: 'admin001',
    action: 'CUSTOMER_CREATE',
    resource: 'Customer',
    resourceId: 'CUST-12345',
    oldValues: null,
    newValues: {
      name: 'John Doe',
      nik: '1171234567890123',
      customerType: 'rumah_tangga',
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2025-10-02T09:15:00'),
  },
  {
    id: '3',
    userId: 'admin002',
    action: 'BILLING_UPDATE',
    resource: 'Billing',
    resourceId: 'BILL-98765',
    oldValues: { status: 'pending', amount: 150000 },
    newValues: { status: 'paid', amount: 150000 },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date('2025-10-02T10:30:00'),
  },
  {
    id: '4',
    userId: 'teknisi001',
    action: 'WORKORDER_COMPLETE',
    resource: 'WorkOrder',
    resourceId: 'WO-45678',
    oldValues: { status: 'in_progress' },
    newValues: { status: 'completed', completedDate: '2025-10-02T11:00:00' },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    timestamp: new Date('2025-10-02T11:00:00'),
  },
  {
    id: '5',
    userId: 'admin001',
    action: 'TARIFF_UPDATE',
    resource: 'TariffStructure',
    resourceId: 'TARIFF-001',
    oldValues: { baseRate: 1500, progressiveRates: [] },
    newValues: { baseRate: 1650, progressiveRates: [] },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2025-10-02T13:45:00'),
  },
  {
    id: '6',
    userId: 'admin002',
    action: 'USER_DELETE',
    resource: 'User',
    resourceId: 'USER-99999',
    oldValues: { name: 'Test User', email: 'test@example.com', role: 'viewer' },
    newValues: null,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date('2025-10-02T14:20:00'),
  },
  {
    id: '7',
    userId: 'admin001',
    action: 'PERMISSION_UPDATE',
    resource: 'Permission',
    resourceId: 'ROLE-003',
    oldValues: { permissions: ['read'] },
    newValues: { permissions: ['read', 'update'] },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2025-10-02T15:10:00'),
  },
  {
    id: '8',
    userId: 'admin003',
    action: 'CONFIG_UPDATE',
    resource: 'SystemConfig',
    resourceId: 'CONFIG-EMAIL',
    oldValues: { smtpHost: 'smtp.old.com', smtpPort: 587 },
    newValues: { smtpHost: 'smtp.new.com', smtpPort: 465 },
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2025-10-02T16:30:00'),
  },
];

const actionTypes = [
  'All Actions',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_DELETE',
  'BILLING_CREATE',
  'BILLING_UPDATE',
  'BILLING_DELETE',
  'WORKORDER_CREATE',
  'WORKORDER_UPDATE',
  'WORKORDER_COMPLETE',
  'TARIFF_UPDATE',
  'PERMISSION_UPDATE',
  'CONFIG_UPDATE',
];

const resourceTypes = [
  'All Resources',
  'Authentication',
  'User',
  'Customer',
  'Billing',
  'WorkOrder',
  'TariffStructure',
  'Permission',
  'SystemConfig',
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [resourceFilter, setResourceFilter] = useState('All Resources');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    // In production, this would fetch fresh data from the API
    console.log('Refreshing audit logs...');
  };

  const handleExport = () => {
    // Generate CSV export
    const headers = ['Timestamp', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address'];
    const csvData = filteredLogs.map(log => [
      log.timestamp.toLocaleString('id-ID'),
      log.userId,
      log.action,
      log.resource,
      log.resourceId,
      log.ipAddress,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedLog(null);
  };

  const getActionColor = (action: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    if (action.includes('LOGIN')) return 'primary';
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('DELETE')) return 'error';
    return 'default';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Info />;
    if (action.includes('CREATE')) return <CheckCircle />;
    if (action.includes('UPDATE')) return <Warning />;
    if (action.includes('DELETE')) return <Error />;
    return <Info />;
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'All Actions' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'All Resources' || log.resource === resourceFilter;

    const matchesDateRange =
      (!startDate || dayjs(log.timestamp).isAfter(startDate) || dayjs(log.timestamp).isSame(startDate, 'day')) &&
      (!endDate || dayjs(log.timestamp).isBefore(endDate) || dayjs(log.timestamp).isSame(endDate, 'day'));

    return matchesSearch && matchesAction && matchesResource && matchesDateRange;
  });

  // Paginate filtered logs
  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <AdminLayout title="Audit Logs">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            System Audit Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          View and track all system activities and user actions
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  label="Action Type"
                >
                  {actionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  label="Resource"
                >
                  {resourceTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('All Actions');
                  setResourceFilter('All Resources');
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Activity Log ({filteredLogs.length} entries)
            </Typography>
            <Chip
              label={`Showing ${paginatedLogs.length} of ${filteredLogs.length}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resource ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {log.timestamp.toLocaleDateString('id-ID')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.timestamp.toLocaleTimeString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.userId} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getActionIcon(log.action)}
                        label={log.action}
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.resourceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(log)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No audit logs found matching your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.timestamp.toLocaleString('id-ID')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1">{selectedLog.userId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      icon={getActionIcon(selectedLog.action)}
                      label={selectedLog.action}
                      color={getActionColor(selectedLog.action)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Resource
                  </Typography>
                  <Typography variant="body1">{selectedLog.resource}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Resource ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.resourceId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              </Grid>

              {selectedLog.oldValues && (
                <Paper sx={{ p: 2, backgroundColor: 'error.light' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Old Values
                  </Typography>
                  <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </Box>
                </Paper>
              )}

              {selectedLog.newValues && (
                <Paper sx={{ p: 2, backgroundColor: 'success.light' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    New Values
                  </Typography>
                  <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
