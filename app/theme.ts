import { createTheme, alpha } from '@mui/material/styles';

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
    // Tombol gaya "soft" Attex: latar tint lembut + teks warna; hover -> solid + teks putih.
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
        contained: ({ theme, ownerState }) => {
          const c = ownerState.color;
          if (!c || c === 'inherit') return {};
          const pal = (theme.palette as any)[c];
          if (!pal?.main) return {};
          return {
            backgroundColor: alpha(pal.main, 0.14),
            color: pal.main,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: pal.main,
              color: pal.contrastText || '#fff',
              boxShadow: 'none',
            },
            '&:active': { backgroundColor: pal.main, color: pal.contrastText || '#fff' },
            '&.Mui-disabled': { backgroundColor: alpha(pal.main, 0.08), color: alpha(pal.main, 0.4) },
          };
        },
      },
    },
    // Badge/Chip gaya "soft" Attex: filled berwarna -> latar tint + teks warna.
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        filled: ({ theme, ownerState }) => {
          const c = ownerState.color;
          if (!c || c === 'default') return {};
          const pal = (theme.palette as any)[c];
          if (!pal?.main) return {};
          return {
            backgroundColor: alpha(pal.main, 0.16),
            color: pal.main,
            '& .MuiChip-icon': { color: pal.main },
            '& .MuiChip-deleteIcon': { color: alpha(pal.main, 0.7), '&:hover': { color: pal.main } },
          };
        },
      },
    },
    // Tabel gaya Attex (global): header grey rapi + border halus.
    // Berlaku ke SEMUA tabel sehingga konsisten di seluruh halaman.
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.text.secondary,
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
    // Hover lembut untuk SEMUA baris isi tabel (tanpa perlu prop hover).
    // Ditarget ke MuiTableBody agar baris header tidak ikut ter-hover.
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(1,52,148,0.035)',
          },
        },
      },
    },
  },
});

export default theme;
