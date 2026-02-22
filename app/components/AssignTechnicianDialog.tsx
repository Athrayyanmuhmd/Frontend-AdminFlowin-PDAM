// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_TEKNISI } from '../../lib/graphql/queries/technicians';
import {
  ASSIGN_TEKNISI_TO_KONEKSI,
  UNASSIGN_TEKNISI_FROM_KONEKSI,
  GET_CONNECTION_DATA_BY_ID,
} from '../../lib/graphql/queries/connectionData';

interface AssignTechnicianDialogProps {
  open: boolean;
  onClose: () => void;
  connectionDataId: string;
  currentTechnicianId?: string;
  currentTechnicianName?: string;
  onSuccess: () => void;
}

export default function AssignTechnicianDialog({
  open,
  onClose,
  connectionDataId,
  currentTechnicianId,
  currentTechnicianName,
  onSuccess,
}: AssignTechnicianDialogProps) {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: teknisiData, loading } = useQuery(GET_ALL_TEKNISI, {
    skip: !open,
    fetchPolicy: 'network-only',
  });

  const technicians = teknisiData?.getAllTeknisi || [];

  const [assignMutate, { loading: assigning }] = useMutation(ASSIGN_TEKNISI_TO_KONEKSI, {
    refetchQueries: [{ query: GET_CONNECTION_DATA_BY_ID, variables: { id: connectionDataId } }],
    onCompleted: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Gagal assign teknisi');
    },
  });

  const [unassignMutate, { loading: unassigning }] = useMutation(UNASSIGN_TEKNISI_FROM_KONEKSI, {
    refetchQueries: [{ query: GET_CONNECTION_DATA_BY_ID, variables: { id: connectionDataId } }],
    onCompleted: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Gagal hapus assignment teknisi');
    },
  });

  const submitting = assigning || unassigning;

  useEffect(() => {
    if (open) {
      setSelectedTechnicianId(currentTechnicianId || '');
      setError(null);
    }
  }, [open, currentTechnicianId]);

  const handleSubmit = async () => {
    if (!selectedTechnicianId) {
      setError('Pilih teknisi terlebih dahulu');
      return;
    }
    setError(null);
    await assignMutate({ variables: { id: connectionDataId, technicianId: selectedTechnicianId } });
  };

  const handleUnassign = async () => {
    setError(null);
    await unassignMutate({ variables: { id: connectionDataId } });
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      aria-labelledby='assign-technician-dialog-title'
    >
      <DialogTitle id='assign-technician-dialog-title'>
        {currentTechnicianId ? 'Ubah Teknisi' : 'Assign Teknisi'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {currentTechnicianName && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Teknisi saat ini:
            </Typography>
            <Typography variant='body1' fontWeight='bold'>
              {currentTechnicianName}
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box display='flex' justifyContent='center' py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id='technician-select-label'>Pilih Teknisi</InputLabel>
            <Select
              labelId='technician-select-label'
              id='technician-select'
              value={selectedTechnicianId}
              label='Pilih Teknisi'
              onChange={e => setSelectedTechnicianId(e.target.value)}
              disabled={submitting}
            >
              <MenuItem value=''>
                <em>-- Pilih Teknisi --</em>
              </MenuItem>
              {technicians.map((teknisi: any) => (
                <MenuItem key={teknisi._id} value={teknisi._id}>
                  {teknisi.namaLengkap} - {teknisi.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {currentTechnicianId && (
          <Button
            onClick={handleUnassign}
            disabled={submitting || loading}
            color='error'
            variant='outlined'
          >
            {unassigning ? 'Menghapus...' : 'Hapus Assignment'}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} disabled={submitting} color='inherit'>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading || !selectedTechnicianId}
          variant='contained'
          color='primary'
        >
          {assigning ? <CircularProgress size={24} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
