'use client';

import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload sekali saat ChunkLoadError (deploy baru vs halaman lama).
    const isChunkError =
      /Loading chunk [\w-]+ failed|ChunkLoadError|Loading CSS chunk|importing a module script failed/i.test(
        error?.message || ''
      );
    if (isChunkError && typeof window !== 'undefined') {
      const last = Number(sessionStorage.getItem('chunkReloadAt') || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem('chunkReloadAt', String(Date.now()));
        window.location.reload();
        return;
      }
    }
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />
      <Typography variant='h4' fontWeight='bold'>
        Terjadi Kesalahan
      </Typography>
      <Typography variant='body1' color='text.secondary' maxWidth={500}>
        Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator sistem.
      </Typography>
      {error.digest && (
        <Typography variant='caption' color='text.disabled'>
          Kode Error: {error.digest}
        </Typography>
      )}
      <Button
        variant='contained'
        startIcon={<Refresh />}
        onClick={reset}
        sx={{ mt: 1 }}
      >
        Coba Lagi
      </Button>
    </Box>
  );
}
