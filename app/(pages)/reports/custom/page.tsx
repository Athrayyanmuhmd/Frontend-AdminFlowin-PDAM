'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Download,
  PictureAsPdf,
  TableChart,
  Assessment,
  FilterList,
  Schedule,
  Settings,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

// Mock report templates
const reportTemplates = [
  {
    id: '1',
    name: 'Laporan Konsumsi Air per Zona',
    description: 'Analisis konsumsi air berdasarkan zona distribusi',
    category: 'operational',
    fields: ['zona', 'konsumsi', 'pelanggan', 'periode'],
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'Analisis Pendapatan per Kategori',
    description: 'Breakdown pendapatan berdasarkan kategori pelanggan',
    category: 'financial',
    fields: ['kategori', 'pendapatan', 'jumlah_pelanggan', 'rata_rata'],
    createdAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    name: 'Work Order Performance',
    description: 'Statistik kinerja penyelesaian work order',
    category: 'operational',
    fields: ['tipe_wo', 'jumlah', 'avg_durasi', 'completion_rate'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'Kualitas Air Harian',
    description: 'Monitoring parameter kualitas air harian',
    category: 'compliance',
    fields: ['parameter', 'nilai', 'standar', 'status', 'waktu'],
    createdAt: new Date('2024-01-08'),
  },
];

const availableFields = [
  { id: 'customer_name', name: 'Nama Pelanggan', category: 'customer' },
  { id: 'customer_nik', name: 'NIK', category: 'customer' },
  { id: 'customer_address', name: 'Alamat', category: 'customer' },
  { id: 'customer_type', name: 'Tipe Pelanggan', category: 'customer' },
  { id: 'account_number', name: 'No. Akun', category: 'billing' },
  { id: 'consumption', name: 'Konsumsi', category: 'billing' },
  { id: 'amount', name: 'Tagihan', category: 'billing' },
  { id: 'payment_status', name: 'Status Pembayaran', category: 'billing' },
  { id: 'payment_date', name: 'Tanggal Pembayaran', category: 'billing' },
  { id: 'wo_type', name: 'Tipe Work Order', category: 'operations' },
  { id: 'wo_status', name: 'Status Work Order', category: 'operations' },
  { id: 'wo_duration', name: 'Durasi Work Order', category: 'operations' },
  { id: 'technician', name: 'Teknisi', category: 'operations' },
  { id: 'water_ph', name: 'pH Air', category: 'quality' },
  { id: 'water_turbidity', name: 'Kekeruhan', category: 'quality' },
  { id: 'water_chlorine', name: 'Klorin', category: 'quality' },
  { id: 'pressure', name: 'Tekanan', category: 'quality' },
];

const filterOperators = [
  { value: 'equals', label: 'Sama dengan' },
  { value: 'not_equals', label: 'Tidak sama dengan' },
  { value: 'greater_than', label: 'Lebih besar dari' },
  { value: 'less_than', label: 'Lebih kecil dari' },
  { value: 'contains', label: 'Mengandung' },
  { value: 'between', label: 'Antara' },
];

export default function CustomReports() {
  const [templates, setTemplates] = useState(reportTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBuilderDialog, setOpenBuilderDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Report Builder State
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const steps = ['Informasi Dasar', 'Pilih Field', 'Filter Data', 'Pengaturan Output'];

  const handleOpenBuilder = () => {
    setOpenBuilderDialog(true);
    setActiveStep(0);
    // Reset builder state
    setReportName('');
    setReportDescription('');
    setSelectedFields([]);
    setFilters([]);
    setGroupBy('');
    setSortBy('');
  };

  const handleCloseBuilder = () => {
    setOpenBuilderDialog(false);
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { field: '', operator: 'equals', value: '' },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      category: 'custom',
      fields: selectedFields,
      filters: filters,
      groupBy: groupBy,
      sortBy: sortBy,
      exportFormat: exportFormat,
      createdAt: new Date(),
    };

    setTemplates([...templates, newTemplate]);
    handleCloseBuilder();
  };

  const handleGenerateReport = () => {
    console.log('Generating report with settings:', {
      reportName,
      selectedFields,
      filters,
      groupBy,
      sortBy,
      exportFormat,
    });
    // Implementation for report generation
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              label="Nama Laporan"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Deskripsi"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Pilih field yang akan ditampilkan dalam laporan:
            </Typography>
            <Grid container spacing={2}>
              {['customer', 'billing', 'operations', 'quality'].map((category) => (
                <Grid item xs={12} md={6} key={category}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                      {category === 'customer' ? 'Pelanggan' :
                       category === 'billing' ? 'Tagihan' :
                       category === 'operations' ? 'Operasional' : 'Kualitas Air'}
                    </Typography>
                    <FormGroup>
                      {availableFields
                        .filter((f) => f.category === category)
                        .map((field) => (
                          <FormControlLabel
                            key={field.id}
                            control={
                              <Checkbox
                                checked={selectedFields.includes(field.id)}
                                onChange={() => handleFieldToggle(field.id)}
                              />
                            }
                            label={field.name}
                          />
                        ))}
                    </FormGroup>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Filter Data:</Typography>
              <Button startIcon={<Add />} onClick={handleAddFilter} size="small">
                Tambah Filter
              </Button>
            </Box>

            {filters.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Belum ada filter. Klik "Tambah Filter" untuk menambahkan kriteria filter.
              </Typography>
            ) : (
              filters.map((filter, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Field</InputLabel>
                        <Select
                          value={filter.field}
                          onChange={(e) => {
                            const newFilters = [...filters];
                            newFilters[index].field = e.target.value;
                            setFilters(newFilters);
                          }}
                          label="Field"
                        >
                          {availableFields.map((field) => (
                            <MenuItem key={field.id} value={field.id}>
                              {field.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={filter.operator}
                          onChange={(e) => {
                            const newFilters = [...filters];
                            newFilters[index].operator = e.target.value;
                            setFilters(newFilters);
                          }}
                          label="Operator"
                        >
                          {filterOperators.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nilai"
                        value={filter.value}
                        onChange={(e) => {
                          const newFilters = [...filters];
                          newFilters[index].value = e.target.value;
                          setFilters(newFilters);
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFilter(index)}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Group By</InputLabel>
                  <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    label="Group By"
                  >
                    <MenuItem value="">None</MenuItem>
                    {selectedFields.map((fieldId) => {
                      const field = availableFields.find((f) => f.id === fieldId);
                      return (
                        <MenuItem key={fieldId} value={fieldId}>
                          {field?.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="">None</MenuItem>
                    {selectedFields.map((fieldId) => {
                      const field = availableFields.find((f) => f.id === fieldId);
                      return (
                        <MenuItem key={fieldId} value={fieldId}>
                          {field?.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    label="Export Format"
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Custom Report Builder">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Custom Report Builder
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenBuilder}
          >
            Buat Laporan Baru
          </Button>
        </Box>

        {/* Saved Templates */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Template Laporan Tersimpan
        </Typography>

        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={template.category === 'operational' ? 'Operasional' :
                            template.category === 'financial' ? 'Keuangan' :
                            template.category === 'compliance' ? 'Kepatuhan' : 'Custom'}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${template.fields.length} fields`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => {
                        setSelectedTemplate(template);
                        handleGenerateReport();
                      }}
                    >
                      Generate
                    </Button>
                    <Tooltip title="Export PDF">
                      <IconButton size="small" color="primary">
                        <PictureAsPdf />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Excel">
                      <IconButton size="small" color="primary">
                        <TableChart />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Dibuat: {template.createdAt.toLocaleDateString('id-ID')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Report Builder Dialog */}
      <Dialog
        open={openBuilderDialog}
        onClose={handleCloseBuilder}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Buat Laporan Custom
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBuilder}>Batal</Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>Kembali</Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !reportName) ||
                (activeStep === 1 && selectedFields.length === 0)
              }
            >
              Lanjut
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveTemplate}
              disabled={!reportName || selectedFields.length === 0}
            >
              Simpan Template
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
