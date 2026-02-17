'use client';

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

interface TariffRate {
  minConsumption: number;
  maxConsumption?: number;
  rate: number;
}

interface Tariff {
  id: string;
  category: string;
  categoryName: string;
  baseRate: number;
  progressiveRates: TariffRate[];
  effectiveDate: Date;
  status: 'active' | 'inactive';
}

const mockTariffs: Tariff[] = [
  {
    id: '1',
    category: '2A2',
    categoryName: 'Rumah Tangga Subsidi',
    baseRate: 2500,
    progressiveRates: [
      { minConsumption: 0, maxConsumption: 10, rate: 2500 },
      { minConsumption: 11, maxConsumption: 20, rate: 3000 },
      { minConsumption: 21, rate: 3500 },
    ],
    effectiveDate: new Date('2024-01-01'),
    status: 'active',
  },
  {
    id: '2',
    category: 'komersial',
    categoryName: 'Komersial',
    baseRate: 3500,
    progressiveRates: [
      { minConsumption: 0, maxConsumption: 50, rate: 3500 },
      { minConsumption: 51, maxConsumption: 100, rate: 4000 },
      { minConsumption: 101, rate: 4500 },
    ],
    effectiveDate: new Date('2024-01-01'),
    status: 'active',
  },
  {
    id: '3',
    category: 'industri',
    categoryName: 'Industri',
    baseRate: 4000,
    progressiveRates: [
      { minConsumption: 0, maxConsumption: 100, rate: 4000 },
      { minConsumption: 101, maxConsumption: 500, rate: 4500 },
      { minConsumption: 501, rate: 5000 },
    ],
    effectiveDate: new Date('2024-01-01'),
    status: 'active',
  },
];

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>(mockTariffs);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleAddTariff = () => {
    setSelectedTariff(null);
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleEditTariff = (tariff: Tariff) => {
    setSelectedTariff(tariff);
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDeleteTariff = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tarif ini?')) {
      setTariffs(tariffs.filter(t => t.id !== id));
    }
  };

  return (
    <AdminLayout title="Struktur Tarif">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Struktur Tarif Air
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddTariff}
          >
            Tambah Tarif
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Tarif air menggunakan sistem progresif berdasarkan konsumsi bulanan. Perubahan tarif memerlukan persetujuan dari pihak terkait.
        </Alert>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AttachMoney sx={{ color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {tariffs.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Kategori Tarif
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {tariffs.filter(t => t.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tarif Aktif
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp sx={{ color: 'warning.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {Math.min(...tariffs.map(t => t.baseRate)).toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tarif Terendah
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tariffs Table */}
        {tariffs.map((tariff) => (
          <Card key={tariff.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {tariff.categoryName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kategori: {tariff.category} | Berlaku sejak: {tariff.effectiveDate.toLocaleDateString('id-ID')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={tariff.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    color={tariff.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                  <IconButton size="small" onClick={() => handleEditTariff(tariff)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTariff(tariff.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Konsumsi Minimal (m³)</TableCell>
                      <TableCell>Konsumsi Maksimal (m³)</TableCell>
                      <TableCell>Tarif (Rp/m³)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tariff.progressiveRates.map((rate, index) => (
                      <TableRow key={index}>
                        <TableCell>{rate.minConsumption}</TableCell>
                        <TableCell>{rate.maxConsumption || '∞'}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Rp {rate.rate.toLocaleString('id-ID')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Tarif' : 'Tambah Tarif Baru'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kode Kategori"
                defaultValue={selectedTariff?.category}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nama Kategori"
                defaultValue={selectedTariff?.categoryName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tarif Dasar (Rp/m³)"
                type="number"
                defaultValue={selectedTariff?.baseRate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  defaultValue={selectedTariff?.status || 'active'}
                  label="Status"
                >
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Tidak Aktif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tarif Progresif
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Tambahkan rentang konsumsi dan tarif progresif
              </Alert>
              {/* Add progressive rate form here */}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant="contained">
            {editMode ? 'Simpan Perubahan' : 'Tambah Tarif'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
