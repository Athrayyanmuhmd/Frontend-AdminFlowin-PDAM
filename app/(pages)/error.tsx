'use client';

import { useEffect } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h5" fontWeight={600}>
          Terjadi Kesalahan
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'Halaman ini mengalami masalah. Silakan coba lagi.'}
        </Typography>
        <Button variant="contained" onClick={reset}>
          Coba Lagi
        </Button>
      </Box>
    </Container>
  );
}
