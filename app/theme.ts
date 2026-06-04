import { createTheme } from '@mui/material/styles';

/**
 * Tema MUI terpusat untuk Aqualink Admin Panel.
 *
 * SATU sumber kebenaran untuk warna, font, radius, dan default komponen.
 * Sebelumnya tema ini tertanam di dalam `AdminProvider.tsx`; dipindah ke sini
 * agar mudah dirawat dan dipakai ulang. `AdminProvider` meng-import dari file ini.
 *
 * Acuan visual nilai warna/shadow mengikuti gaya dashboard yang sudah ada
 * (lihat `components/ui/StatCard.tsx`) supaya seluruh halaman konsisten.
 */

// Warna brand utama Aqualink (tetes air biru tua)
const BRAND_PRIMARY = '#013494';

const theme = createTheme({
  palette: {
    primary: {
      main: BRAND_PRIMARY,
    },
    // Semantic palette diselaraskan dengan warna ikon StatCard agar seragam
    secondary: { main: '#9c27b0' },
    info:      { main: '#0277BD' },
    success:   { main: '#2E7D32' },
    warning:   { main: '#E65100' },
    error:     { main: '#B71C1C' },
    // Skala abu-abu lembut bernuansa biru (acuan Attex) — dipakai untuk
    // header tabel (grey.100) dan border halus.
    grey: {
      50: '#f8f9fb',
      100: '#f4f6fa',
      200: '#eaecf0',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#aab8c5',
      600: '#818e9e',
      700: '#444d57',
      800: '#3f4650',
      900: '#3a444b',
      A100: '#f1f1f1',
      A200: '#e3eaef',
      A400: '#ced4da',
      A700: '#444d57',
    },
    divider: '#e7eaf0',
    background: {
      default: '#f0f2f5',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h4: {
      fontSize: '2.125rem',
      '@media (max-width:600px)': {
        fontSize: '1.4rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.15rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          minWidth: 0,
          borderRadius: '12px',
          boxShadow:
            '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          overflow: 'visible',
        },
      },
    },
    // Tombol gaya Attex: flat (tanpa gradient/shadow), tidak UPPERCASE
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
