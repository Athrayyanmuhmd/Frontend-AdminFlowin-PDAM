'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  QrCode,
  Wifi,
  Settings,
  LocationOn,
  Person,
  Assignment,
  Add,
  Delete,
  SaveAlt,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../../layouts/AdminLayout';

const steps = ['Informasi Meteran', 'Konfigurasi', 'Instalasi', 'Verifikasi'];

interface MeterRegistration {
  // Informasi Meteran
  meterSerialNumber: string;
  meterType: string;
  manufacturer: string;
  model: string;
  yearManufactured: string;
  capacity: string;

  // Customer & Location
  customerId: string;
  customerName: string;
  accountNumber: string;
  installationAddress: string;
  latitude: string;
  longitude: string;

  // Configuration
  communicationType: string;
  simCardNumber: string;
  ipAddress: string;
  readingInterval: number;
  dataTransmissionInterval: number;

  // Installation
  installationDate: string;
  installedBy: string;
  initialReading: number;
  sealNumber: string;
  installationNotes: string;

  // Advanced Settings
  alertThreshold: number;
  tamperDetection: boolean;
  leakDetection: boolean;
  autoShutoff: boolean;
}

export default function SmartMeterRegistrationPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<MeterRegistration>({
    meterSerialNumber: '',
    meterType: 'digital',
    manufacturer: '',
    model: '',
    yearManufactured: new Date().getFullYear().toString(),
    capacity: '20',

    customerId: '',
    customerName: '',
    accountNumber: '',
    installationAddress: '',
    latitude: '',
    longitude: '',

    communicationType: 'NB-IoT',
    simCardNumber: '',
    ipAddress: '',
    readingInterval: 15,
    dataTransmissionInterval: 60,

    installationDate: new Date().toISOString().split('T')[0],
    installedBy: '',
    initialReading: 0,
    sealNumber: '',
    installationNotes: '',

    alertThreshold: 1000,
    tamperDetection: true,
    leakDetection: true,
    autoShutoff: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (field: keyof MeterRegistration, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.meterSerialNumber) newErrors.meterSerialNumber = 'Serial number wajib diisi';
        if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer wajib diisi';
        if (!formData.model) newErrors.model = 'Model wajib diisi';
        break;
      case 1:
        if (!formData.simCardNumber && formData.communicationType !== 'LoRa') {
          newErrors.simCardNumber = 'SIM card number wajib diisi';
        }
        break;
      case 2:
        if (!formData.installedBy) newErrors.installedBy = 'Teknisi installer wajib diisi';
        if (!formData.sealNumber) newErrors.sealNumber = 'Seal number wajib diisi';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    setTestConnectionStatus('testing');
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestConnectionStatus(success ? 'success' : 'error');
    }, 2000);
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      // Submit to API
      console.log('Submitting meter registration:', formData);
      alert('Meteran berhasil didaftarkan!');
      router.push('/monitoring/smart-meters');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment color="primary" />
                Informasi Meteran Pintar
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Serial Number"
                value={formData.meterSerialNumber}
                onChange={(e) => handleChange('meterSerialNumber', e.target.value)}
                error={!!errors.meterSerialNumber}
                helperText={errors.meterSerialNumber}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setQrDialogOpen(true)}>
                      <QrCode />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipe Meteran</InputLabel>
                <Select
                  value={formData.meterType}
                  onChange={(e) => handleChange('meterType', e.target.value)}
                  label="Tipe Meteran"
                >
                  <MenuItem value="digital">Digital Smart Meter</MenuItem>
                  <MenuItem value="ultrasonic">Ultrasonic Meter</MenuItem>
                  <MenuItem value="electromagnetic">Electromagnetic Meter</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                error={!!errors.manufacturer}
                helperText={errors.manufacturer}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                error={!!errors.model}
                helperText={errors.model}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tahun Produksi"
                type="number"
                value={formData.yearManufactured}
                onChange={(e) => handleChange('yearManufactured', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kapasitas (m³/h)</InputLabel>
                <Select
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  label="Kapasitas (m³/h)"
                >
                  <MenuItem value="15">15 m³/h</MenuItem>
                  <MenuItem value="20">20 m³/h</MenuItem>
                  <MenuItem value="25">25 m³/h</MenuItem>
                  <MenuItem value="40">40 m³/h</MenuItem>
                  <MenuItem value="50">50 m³/h</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Person color="primary" />
                Informasi Pelanggan & Lokasi
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Pelanggan"
                value={formData.customerId}
                onChange={(e) => handleChange('customerId', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nama Pelanggan"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nomor Akun"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Alamat Instalasi"
                value={formData.installationAddress}
                onChange={(e) => handleChange('installationAddress', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="5.5483"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="95.3238"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Konfigurasi Komunikasi
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipe Komunikasi</InputLabel>
                <Select
                  value={formData.communicationType}
                  onChange={(e) => handleChange('communicationType', e.target.value)}
                  label="Tipe Komunikasi"
                >
                  <MenuItem value="NB-IoT">NB-IoT</MenuItem>
                  <MenuItem value="LoRaWAN">LoRaWAN</MenuItem>
                  <MenuItem value="GPRS">GPRS/3G/4G</MenuItem>
                  <MenuItem value="WiFi">WiFi</MenuItem>
                  <MenuItem value="Ethernet">Ethernet</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.communicationType !== 'LoRa' && formData.communicationType !== 'Ethernet' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nomor SIM Card"
                  value={formData.simCardNumber}
                  onChange={(e) => handleChange('simCardNumber', e.target.value)}
                  error={!!errors.simCardNumber}
                  helperText={errors.simCardNumber}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={formData.ipAddress}
                onChange={(e) => handleChange('ipAddress', e.target.value)}
                placeholder="192.168.1.100"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Interval Pembacaan (menit)"
                type="number"
                value={formData.readingInterval}
                onChange={(e) => handleChange('readingInterval', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Interval Transmisi Data (menit)"
                type="number"
                value={formData.dataTransmissionInterval}
                onChange={(e) => handleChange('dataTransmissionInterval', parseInt(e.target.value))}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Wifi />}
                onClick={handleTestConnection}
                disabled={testConnectionStatus === 'testing'}
              >
                {testConnectionStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
              </Button>

              {testConnectionStatus === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>Koneksi Berhasil!</strong> Meteran dapat berkomunikasi dengan server.
                </Alert>
              )}

              {testConnectionStatus === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <strong>Koneksi Gagal!</strong> Periksa konfigurasi jaringan dan coba lagi.
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pengaturan Lanjutan
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Threshold Alert (L/h)"
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value))}
                helperText="Alert akan dikirim jika flow melebihi nilai ini"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.tamperDetection}
                    onChange={(e) => handleChange('tamperDetection', e.target.checked)}
                  />
                }
                label="Tamper Detection"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.leakDetection}
                    onChange={(e) => handleChange('leakDetection', e.target.checked)}
                  />
                }
                label="Leak Detection"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoShutoff}
                    onChange={(e) => handleChange('autoShutoff', e.target.checked)}
                  />
                }
                label="Auto Shutoff"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                Informasi Instalasi
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Tanggal Instalasi"
                type="date"
                value={formData.installationDate}
                onChange={(e) => handleChange('installationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Teknisi Installer"
                value={formData.installedBy}
                onChange={(e) => handleChange('installedBy', e.target.value)}
                error={!!errors.installedBy}
                helperText={errors.installedBy}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pembacaan Awal (m³)"
                type="number"
                value={formData.initialReading}
                onChange={(e) => handleChange('initialReading', parseFloat(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Seal Number"
                value={formData.sealNumber}
                onChange={(e) => handleChange('sealNumber', e.target.value)}
                error={!!errors.sealNumber}
                helperText={errors.sealNumber}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Catatan Instalasi"
                value={formData.installationNotes}
                onChange={(e) => handleChange('installationNotes', e.target.value)}
                multiline
                rows={4}
                placeholder="Kondisi lokasi, kendala instalasi, dll..."
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Verifikasi Data</strong> - Mohon periksa kembali semua informasi sebelum mendaftarkan meteran.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Informasi Meteran
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Serial Number:</strong></TableCell>
                        <TableCell>{formData.meterSerialNumber}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Tipe:</strong></TableCell>
                        <TableCell>{formData.meterType}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Manufacturer:</strong></TableCell>
                        <TableCell>{formData.manufacturer}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Model:</strong></TableCell>
                        <TableCell>{formData.model}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Kapasitas:</strong></TableCell>
                        <TableCell>{formData.capacity} m³/h</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Konfigurasi
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Komunikasi:</strong></TableCell>
                        <TableCell>{formData.communicationType}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>SIM Card:</strong></TableCell>
                        <TableCell>{formData.simCardNumber || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>IP Address:</strong></TableCell>
                        <TableCell>{formData.ipAddress || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Reading Interval:</strong></TableCell>
                        <TableCell>{formData.readingInterval} menit</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Tamper Detection:</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={formData.tamperDetection ? 'Aktif' : 'Nonaktif'}
                            color={formData.tamperDetection ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Pelanggan & Lokasi
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Customer ID:</strong></TableCell>
                        <TableCell>{formData.customerId || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Nama:</strong></TableCell>
                        <TableCell>{formData.customerName || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>No. Akun:</strong></TableCell>
                        <TableCell>{formData.accountNumber || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Alamat:</strong></TableCell>
                        <TableCell>{formData.installationAddress || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Koordinat:</strong></TableCell>
                        <TableCell>
                          {formData.latitude && formData.longitude
                            ? `${formData.latitude}, ${formData.longitude}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Instalasi
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Tanggal:</strong></TableCell>
                        <TableCell>{formData.installationDate}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Installer:</strong></TableCell>
                        <TableCell>{formData.installedBy}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Initial Reading:</strong></TableCell>
                        <TableCell>{formData.initialReading} m³</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Seal Number:</strong></TableCell>
                        <TableCell>{formData.sealNumber}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Catatan:</strong></TableCell>
                        <TableCell>{formData.installationNotes || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Registrasi Meteran Pintar">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Registrasi Meteran Pintar
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Daftarkan meteran air pintar baru ke dalam sistem
        </Typography>

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Kembali
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/monitoring/smart-meters')}
                >
                  Batal
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={<SaveAlt />}
                  >
                    Daftarkan Meteran
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Selanjutnya
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* QR Code Scanner Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <QrCode sx={{ fontSize: 100, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Arahkan kamera ke QR code pada meteran
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
