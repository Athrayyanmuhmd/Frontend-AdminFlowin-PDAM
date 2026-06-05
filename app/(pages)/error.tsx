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
    // ChunkLoadError: terjadi saat ada deploy baru sementara browser masih
    // memegang halaman lama (hash chunk berubah → file lama 404). Auto-reload
    // sekali untuk mengambil versi terbaru; pengaman 10 dtk agar tidak loop.
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
          Halaman ini mengalami masalah. Silakan coba lagi.
        </Typography>
        {/* Detail error ditampilkan untuk membantu diagnosa (admin panel internal) */}
        {error?.message && (
          <Box
            sx={{
              mt: 1, p: 1.5, width: '100%', borderRadius: 2,
              bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider', textAlign: 'left',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block', wordBreak: 'break-word' }}>
              Detail: {error.message}
            </Typography>
            {error.digest && (
              <Typography variant="caption" color="text.disabled">Kode: {error.digest}</Typography>
            )}
          </Box>
        )}
        <Button variant="contained" onClick={reset}>
          Coba Lagi
        </Button>
      </Box>
    </Container>
  );
}
