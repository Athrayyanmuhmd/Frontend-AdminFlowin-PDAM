'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Upload,
  Close,
  CheckCircle,
  LocationOn,
} from '@mui/icons-material';
import AdminLayout from '../../../../layouts/AdminLayout';
import { useAdmin } from '../../../../layouts/AdminProvider';
import {
  getConnectionDataById,
  ConnectionData,
} from '../../../../services/connectionData.service';
import { createSurveyData } from '../../../../services/surveyData.service';

export default function CreateSurveyData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole } = useAdmin();
  const connectionId = searchParams.get('connectionId');

  const [connectionData, setConnectionData] = useState<ConnectionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    diameterPipa: '',
    jumlahPenghuni: '',
    koordinatLat: '',
    koordinatLong: '',
    standar: true,
    catatan: '',
  });

  // Files
  const [files, setFiles] = useState<{
    jaringanFile: File | null;
    posisiBakFile: File | null;
    posisiMeteranFile: File | null;
  }>({
    jaringanFile: null,
    posisiBakFile: null,
    posisiMeteranFile: null,
  });

  const [filePreviews, setFilePreviews] = useState<{
    jaringanFile: string | null;
    posisiBakFile: string | null;
    posisiMeteranFile: string | null;
  }>({
    jaringanFile: null,
    posisiBakFile: null,
    posisiMeteranFile: null,
  });

  useEffect(() => {
    if (!connectionId) {
      setError('Connection ID tidak ditemukan');
      setLoading(false);
      return;
    }

    fetchConnectionData();
  }, [connectionId]);

  const fetchConnectionData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getConnectionDataById(connectionId!);
      let detailData: ConnectionData | null = null;

      if (response.data) {
        const responseData: any = response.data;
        if (responseData.data) {
          detailData = responseData.data;
        } else if (responseData._id) {
          detailData = responseData;
        }
      }

      if (detailData) {
        setConnectionData(detailData);

        // Check if already has survey
        if (detailData.surveiId) {
          setError('Connection data ini sudah memiliki survei');
        }

        // Check if verified
        if (!detailData.isVerifiedByData) {
          setError('Connection data belum diverifikasi oleh admin');
        }

        // Check if technician is assigned (for technician role)
        if (userRole === 'technician' && !detailData.assignedTechnicianId) {
          setError('Anda belum ditugaskan untuk connection data ini');
        }
      } else {
        setError('Data tidak ditemukan');
      }
    } catch (err: any) {
      console.error('Error fetching connection data:', err);
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof typeof files
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Hanya file gambar (JPG, PNG) atau PDF yang diperbolehkan');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }

      setFiles(prev => ({ ...prev, [fieldName]: file }));

      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({
            ...prev,
            [fieldName]: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews(prev => ({ ...prev, [fieldName]: 'PDF' }));
      }

      setError('');
    }
  };

  const handleRemoveFile = (fieldName: keyof typeof files) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setFilePreviews(prev => ({ ...prev, [fieldName]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (
        !files.jaringanFile ||
        !files.posisiBakFile ||
        !files.posisiMeteranFile
      ) {
        setError('Semua file foto wajib diupload');
        setSubmitting(false);
        return;
      }

      if (!formData.diameterPipa || !formData.jumlahPenghuni) {
        setError('Diameter pipa dan jumlah penghuni wajib diisi');
        setSubmitting(false);
        return;
      }

      if (!formData.koordinatLat || !formData.koordinatLong) {
        setError('Koordinat lokasi wajib diisi');
        setSubmitting(false);
        return;
      }

      // Prepare FormData
      const submitData = new FormData();
      submitData.append('connectionDataId', connectionId!);
      submitData.append('jaringanFile', files.jaringanFile);
      submitData.append('posisiBakFile', files.posisiBakFile);
      submitData.append('posisiMeteranFile', files.posisiMeteranFile);
      submitData.append('diameterPipa', formData.diameterPipa);
      submitData.append('jumlahPenghuni', formData.jumlahPenghuni);
      submitData.append('koordinatLat', formData.koordinatLat);
      submitData.append('koordinatLong', formData.koordinatLong);
      submitData.append('standar', String(formData.standar));
      if (formData.catatan) {
        submitData.append('catatan', formData.catatan);
      }

      console.log('Submitting survey data...');
      const response = await createSurveyData(submitData);
      console.log('Survey created:', response);

      setSuccess('Survei berhasil dibuat');
      setTimeout(() => {
        router.push(`/operations/connection-data/${connectionId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating survey:', err);
      setError(err.response?.data?.message || 'Gagal membuat survei');
    } finally {
      setSubmitting(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setFormData(prev => ({
            ...prev,
            koordinatLat: position.coords.latitude.toString(),
            koordinatLong: position.coords.longitude.toString(),
          }));
          setSuccess('Lokasi berhasil diambil');
          setTimeout(() => setSuccess(''), 3000);
        },
        error => {
          setError('Gagal mengambil lokasi: ' + error.message);
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error && !connectionData) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity='error'>{error}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Kembali
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h4'>Buat Survei</Typography>
            <Typography variant='body2' color='text.secondary'>
              NIK: {connectionData?.nik} - {connectionData?.userId?.namaLengkap}
            </Typography>
          </Box>
        </Box>

        {/* Alerts */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* File Uploads */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Upload Foto/Dokumen
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Jaringan File */}
                    <Grid item xs={12} md={4}>
                      <Typography variant='body2' gutterBottom>
                        Foto Jaringan *
                      </Typography>
                      <input
                        accept='image/*,application/pdf'
                        style={{ display: 'none' }}
                        id='jaringan-file'
                        type='file'
                        onChange={e => handleFileChange(e, 'jaringanFile')}
                      />
                      <label htmlFor='jaringan-file'>
                        <Button
                          variant='outlined'
                          component='span'
                          startIcon={<Upload />}
                          fullWidth
                        >
                          Upload Jaringan
                        </Button>
                      </label>
                      {filePreviews.jaringanFile && (
                        <Box sx={{ mt: 1, position: 'relative' }}>
                          {filePreviews.jaringanFile === 'PDF' ? (
                            <Typography variant='caption'>
                              PDF uploaded
                            </Typography>
                          ) : (
                            <img
                              src={filePreviews.jaringanFile}
                              alt='Preview'
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          )}
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveFile('jaringanFile')}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'background.paper',
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      )}
                    </Grid>

                    {/* Posisi Bak File */}
                    <Grid item xs={12} md={4}>
                      <Typography variant='body2' gutterBottom>
                        Foto Posisi Bak *
                      </Typography>
                      <input
                        accept='image/*,application/pdf'
                        style={{ display: 'none' }}
                        id='bak-file'
                        type='file'
                        onChange={e => handleFileChange(e, 'posisiBakFile')}
                      />
                      <label htmlFor='bak-file'>
                        <Button
                          variant='outlined'
                          component='span'
                          startIcon={<Upload />}
                          fullWidth
                        >
                          Upload Posisi Bak
                        </Button>
                      </label>
                      {filePreviews.posisiBakFile && (
                        <Box sx={{ mt: 1, position: 'relative' }}>
                          {filePreviews.posisiBakFile === 'PDF' ? (
                            <Typography variant='caption'>
                              PDF uploaded
                            </Typography>
                          ) : (
                            <img
                              src={filePreviews.posisiBakFile}
                              alt='Preview'
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          )}
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveFile('posisiBakFile')}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'background.paper',
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      )}
                    </Grid>

                    {/* Posisi Meteran File */}
                    <Grid item xs={12} md={4}>
                      <Typography variant='body2' gutterBottom>
                        Foto Posisi Meteran *
                      </Typography>
                      <input
                        accept='image/*,application/pdf'
                        style={{ display: 'none' }}
                        id='meteran-file'
                        type='file'
                        onChange={e => handleFileChange(e, 'posisiMeteranFile')}
                      />
                      <label htmlFor='meteran-file'>
                        <Button
                          variant='outlined'
                          component='span'
                          startIcon={<Upload />}
                          fullWidth
                        >
                          Upload Posisi Meteran
                        </Button>
                      </label>
                      {filePreviews.posisiMeteranFile && (
                        <Box sx={{ mt: 1, position: 'relative' }}>
                          {filePreviews.posisiMeteranFile === 'PDF' ? (
                            <Typography variant='caption'>
                              PDF uploaded
                            </Typography>
                          ) : (
                            <img
                              src={filePreviews.posisiMeteranFile}
                              alt='Preview'
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          )}
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleRemoveFile('posisiMeteranFile')
                            }
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'background.paper',
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Survey Details */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Detail Survei
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Diameter Pipa (inch)'
                        name='diameterPipa'
                        type='number'
                        value={formData.diameterPipa}
                        onChange={handleInputChange}
                        required
                        inputProps={{ min: 0, step: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Jumlah Penghuni'
                        name='jumlahPenghuni'
                        type='number'
                        value={formData.jumlahPenghuni}
                        onChange={handleInputChange}
                        required
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label='Koordinat Latitude'
                        name='koordinatLat'
                        type='number'
                        value={formData.koordinatLat}
                        onChange={handleInputChange}
                        required
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label='Koordinat Longitude'
                        name='koordinatLong'
                        type='number'
                        value={formData.koordinatLong}
                        onChange={handleInputChange}
                        required
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant='outlined'
                        onClick={getLocation}
                        startIcon={<LocationOn />}
                        fullWidth
                        sx={{ height: '56px' }}
                      >
                        Auto
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.standar}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                standar: e.target.checked,
                              }))
                            }
                            color='primary'
                          />
                        }
                        label='Standar (Sesuai Standar Instalasi)'
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label='Catatan Tambahan'
                        name='catatan'
                        value={formData.catatan}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        placeholder='Catatan tambahan mengenai survei...'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant='outlined'
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CheckCircle />
                    )
                  }
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Survei'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </AdminLayout>
  );
}
