import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import { SearchOff, Home } from '@mui/icons-material';

export default function NotFound() {
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
      <SearchOff sx={{ fontSize: 80, color: 'text.disabled' }} />
      <Typography variant='h3' fontWeight='bold'>
        404
      </Typography>
      <Typography variant='h5'>Halaman Tidak Ditemukan</Typography>
      <Typography variant='body1' color='text.secondary' maxWidth={400}>
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </Typography>
      <Button
        component={Link}
        href='/dashboard'
        variant='contained'
        startIcon={<Home />}
        sx={{ mt: 1 }}
      >
        Kembali ke Dashboard
      </Button>
    </Box>
  );
}
