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
  Pagination,
  Alert,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Inventory,
  Warning,
  TrendingDown,
  CheckCircle,
  Category,
  Download,
  Upload,
} from '@mui/icons-material';
import AdminLayout from '../../../layouts/AdminLayout';

interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  totalValue: number;
  location: string;
  supplier: string;
  lastRestockDate?: Date;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued';
}

const mockMaterials: Material[] = [
  {
    id: '1',
    code: 'MTR-001',
    name: 'Meteran Digital 1/2"',
    category: 'Meteran',
    unit: 'pcs',
    quantity: 45,
    minStock: 20,
    maxStock: 100,
    unitPrice: 250000,
    totalValue: 11250000,
    location: 'Gudang A - Rak 1',
    supplier: 'PT Meteran Indonesia',
    lastRestockDate: new Date('2024-01-10'),
    status: 'available',
  },
  {
    id: '2',
    code: 'PIP-001',
    name: 'Pipa PVC 1/2"',
    category: 'Pipa',
    unit: 'meter',
    quantity: 150,
    minStock: 100,
    maxStock: 500,
    unitPrice: 15000,
    totalValue: 2250000,
    location: 'Gudang A - Rak 3',
    supplier: 'PT PVC Jaya',
    lastRestockDate: new Date('2024-01-15'),
    status: 'available',
  },
  {
    id: '3',
    code: 'FIT-001',
    name: 'Fitting Elbow 1/2"',
    category: 'Fitting',
    unit: 'pcs',
    quantity: 15,
    minStock: 50,
    maxStock: 200,
    unitPrice: 5000,
    totalValue: 75000,
    location: 'Gudang A - Rak 2',
    supplier: 'PT Fitting Makmur',
    lastRestockDate: new Date('2024-01-05'),
    status: 'low_stock',
  },
  {
    id: '4',
    code: 'VLV-001',
    name: 'Gate Valve 2"',
    category: 'Valve',
    unit: 'pcs',
    quantity: 0,
    minStock: 10,
    maxStock: 50,
    unitPrice: 150000,
    totalValue: 0,
    location: 'Gudang B - Rak 1',
    supplier: 'PT Valve Indonesia',
    lastRestockDate: new Date('2023-12-20'),
    status: 'out_of_stock',
  },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openRestockDialog, setOpenRestockDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, material: Material) => {
    setAnchorEl(event.currentTarget);
    setSelectedMaterial(material);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleRestock = () => {
    setOpenRestockDialog(true);
    handleMenuClose();
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || material.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || material.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'discontinued': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'low_stock': return 'Stok Rendah';
      case 'out_of_stock': return 'Habis';
      case 'discontinued': return 'Dihentikan';
      default: return status;
    }
  };

  const getStatusIcon = (material: Material) => {
    if (material.quantity === 0) return <Warning color="error" />;
    if (material.quantity <= material.minStock) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  const totalValue = filteredMaterials.reduce((sum, m) => sum + m.totalValue, 0);
  const lowStockItems = materials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

  return (
    <AdminLayout title="Material & Inventaris">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Material & Inventaris
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenAddDialog(true)}
            >
              Tambah Material
            </Button>
          </Box>
        </Box>

        {/* Alert untuk stok rendah */}
        {lowStockItems > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Perhatian!</strong> Ada {lowStockItems} item dengan stok rendah atau habis yang memerlukan restock.
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <Inventory />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {materials.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Item
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
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      Rp {totalValue.toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Nilai Inventaris
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
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <TrendingDown />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {materials.filter(m => m.status === 'low_stock').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stok Rendah
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
                  <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {materials.filter(m => m.status === 'out_of_stock').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stok Habis
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
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Cari material..."
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
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label="Kategori"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="Meteran">Meteran</MenuItem>
                    <MenuItem value="Pipa">Pipa</MenuItem>
                    <MenuItem value="Fitting">Fitting</MenuItem>
                    <MenuItem value="Valve">Valve</MenuItem>
                    <MenuItem value="Alat">Alat</MenuItem>
                    <MenuItem value="Lain-lain">Lain-lain</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="available">Tersedia</MenuItem>
                    <MenuItem value="low_stock">Stok Rendah</MenuItem>
                    <MenuItem value="out_of_stock">Habis</MenuItem>
                    <MenuItem value="discontinued">Dihentikan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kode</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Stok</TableCell>
                  <TableCell>Harga Satuan</TableCell>
                  <TableCell>Total Nilai</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMaterials.map((material) => (
                  <TableRow
                    key={material.id}
                    hover
                    sx={{
                      backgroundColor: material.status === 'out_of_stock' ? 'error.light' :
                                     material.status === 'low_stock' ? 'warning.light' : 'inherit',
                      opacity: material.status === 'out_of_stock' ? 0.7 : 1,
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {material.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {material.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {material.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Category />}
                        label={material.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(material)}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {material.quantity} {material.unit}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((material.quantity / material.maxStock) * 100, 100)}
                          color={
                            material.quantity === 0 ? 'error' :
                            material.quantity <= material.minStock ? 'warning' : 'success'
                          }
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Min: {material.minStock} | Max: {material.maxStock}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Rp {material.unitPrice.toLocaleString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Rp {material.totalValue.toLocaleString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(material.status)}
                        size="small"
                        color={getStatusColor(material.status) as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, material)}
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
              count={Math.ceil(filteredMaterials.length / rowsPerPage)}
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
        <MenuItem onClick={handleRestock}>
          <Add sx={{ mr: 1 }} />
          Restock
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Hapus
        </MenuItem>
      </Menu>

      {/* Material Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Material</DialogTitle>
        <DialogContent>
          {selectedMaterial && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informasi Material
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Kode:</strong> {selectedMaterial.code}</Typography>
                  <Typography><strong>Nama:</strong> {selectedMaterial.name}</Typography>
                  <Typography><strong>Kategori:</strong> {selectedMaterial.category}</Typography>
                  <Typography><strong>Satuan:</strong> {selectedMaterial.unit}</Typography>
                  <Typography><strong>Lokasi:</strong> {selectedMaterial.location}</Typography>
                  <Typography><strong>Supplier:</strong> {selectedMaterial.supplier}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Stok & Nilai
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Stok Saat Ini:</strong> {selectedMaterial.quantity} {selectedMaterial.unit}</Typography>
                  <Typography><strong>Stok Minimum:</strong> {selectedMaterial.minStock} {selectedMaterial.unit}</Typography>
                  <Typography><strong>Stok Maximum:</strong> {selectedMaterial.maxStock} {selectedMaterial.unit}</Typography>
                  <Typography><strong>Harga Satuan:</strong> Rp {selectedMaterial.unitPrice.toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Total Nilai:</strong> Rp {selectedMaterial.totalValue.toLocaleString('id-ID')}</Typography>
                  <Typography><strong>Status:</strong> {getStatusLabel(selectedMaterial.status)}</Typography>
                  {selectedMaterial.lastRestockDate && (
                    <Typography><strong>Restock Terakhir:</strong> {selectedMaterial.lastRestockDate.toLocaleDateString('id-ID')}</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Tutup</Button>
          <Button variant="outlined" onClick={handleRestock}>
            Restock
          </Button>
          <Button variant="contained">
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={openRestockDialog} onClose={() => setOpenRestockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restock Material</DialogTitle>
        <DialogContent>
          {selectedMaterial && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Alert severity="info">
                Stok saat ini: <strong>{selectedMaterial.quantity} {selectedMaterial.unit}</strong>
              </Alert>
              <TextField
                fullWidth
                label="Jumlah Restock"
                type="number"
                defaultValue={selectedMaterial.minStock}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{selectedMaterial.unit}</InputAdornment>
                }}
              />
              <TextField
                fullWidth
                label="Supplier"
                defaultValue={selectedMaterial.supplier}
              />
              <TextField
                fullWidth
                label="Catatan"
                multiline
                rows={3}
                placeholder="Tambahkan catatan restock..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestockDialog(false)}>Batal</Button>
          <Button variant="contained">
            Konfirmasi Restock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tambah Material Baru</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Kode Material" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nama Material" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select label="Kategori">
                  <MenuItem value="Meteran">Meteran</MenuItem>
                  <MenuItem value="Pipa">Pipa</MenuItem>
                  <MenuItem value="Fitting">Fitting</MenuItem>
                  <MenuItem value="Valve">Valve</MenuItem>
                  <MenuItem value="Alat">Alat</MenuItem>
                  <MenuItem value="Lain-lain">Lain-lain</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Satuan" required placeholder="pcs, meter, kg, dll" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Stok Awal" type="number" required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Stok Minimum" type="number" required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Stok Maximum" type="number" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Harga Satuan" type="number" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Supplier" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Lokasi Penyimpanan" placeholder="Gudang A - Rak 1" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Batal</Button>
          <Button variant="contained">
            Tambah Material
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
