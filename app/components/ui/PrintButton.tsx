'use client';
import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { Print } from '@mui/icons-material';

interface PrintButtonProps {
  /** Label button. Default: 'Cetak' */
  label?: string;
}

/**
 * Tombol cetak halaman. Hanya tampil di layar (hidden saat print via CSS .no-print).
 * Gunakan bersama @media print di globals.css yang menyembunyikan sidebar & header.
 */
export default function PrintButton({ label = 'Cetak' }: PrintButtonProps) {
  return (
    <Tooltip title='Cetak / Simpan sebagai PDF'>
      <Button
        className='no-print'
        variant='outlined'
        size='small'
        startIcon={<Print />}
        onClick={() => window.print()}
      >
        {label}
      </Button>
    </Tooltip>
  );
}
