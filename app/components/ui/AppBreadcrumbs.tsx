'use client';

import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * Breadcrumb global berikon (gaya Attex) — otomatis dari URL, tampil di semua halaman.
 * Ditempatkan di AdminLayout sehingga tiap halaman dapat breadcrumb tanpa edit per-halaman.
 */
const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Pelanggan',
  registration: 'Registrasi Baru',
  accounts: 'Akun Pelanggan',
  detail: 'Detail',
  billing: 'Penagihan',
  generate: 'Generate Tagihan',
  tariffs: 'Struktur Tarif',
  payments: 'Pembayaran',
  pemutusan: 'Pemutusan',
  operations: 'Operasi Lapangan',
  'connection-data': 'Data Sambungan',
  'survey-data': 'Data Survey',
  'rab-connection': 'RAB Sambungan',
  technicians: 'Manajemen Teknisi',
  meteran: 'Manajemen Meteran',
  laporan: 'Laporan Pelanggan',
  'penyelesaian-laporan': 'Penyelesaian Laporan',
  'work-orders': 'Perintah Kerja',
  create: 'Buat Baru',
  monitoring: 'Monitoring',
  'smart-meter': 'Meteran Pintar',
  'smart-meters': 'Meteran Pintar',
  'master-data': 'Master Data',
  'kelompok-pelanggan': 'Kelompok Pelanggan',
  notifications: 'Notifikasi',
  reports: 'Laporan',
  operational: 'Operasional',
  financial: 'Keuangan',
  compliance: 'Kepatuhan',
  custom: 'Kustom',
  system: 'Sistem',
  users: 'Manajemen User',
  'audit-logs': 'Log Audit',
  transaksi: 'Transaksi',
  'kredit-air': 'Kredit Air',
  debitor: 'Debitor',
};

const isDynamic = (seg: string) =>
  /^[0-9a-fA-F]{16,}$/.test(seg) || /^\d+$/.test(seg) || seg.length > 22;

const prettify = (seg: string) =>
  seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const crumbSx = { color: 'text.secondary', fontSize: '0.82rem', fontWeight: 500 } as const;

export default function AppBreadcrumbs() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  // Jangan tampil di halaman auth atau jika tak ada segmen
  if (segments.length === 0 || segments[0] === 'auth') return null;

  const crumbs: { label: string; href?: string }[] = [];
  let acc = '';
  segments.forEach((seg, idx) => {
    acc += '/' + seg;
    const isLast = idx === segments.length - 1;
    if (isDynamic(seg)) {
      crumbs.push({ label: 'Detail' });
      return;
    }
    const label = LABELS[seg] || prettify(seg);
    crumbs.push({ label, href: isLast ? undefined : acc });
  });

  return (
    <Breadcrumbs
      separator={<ChevronRightIcon sx={{ fontSize: 16 }} />}
      aria-label="breadcrumb"
      sx={{
        mb: 2.5,
        // Semua item breadcrumb rata-tengah & tinggi seragam
        '& .MuiBreadcrumbs-ol': { alignItems: 'center' },
        '& .MuiBreadcrumbs-li': { display: 'flex', alignItems: 'center', minHeight: 24 },
        '& .MuiBreadcrumbs-separator': {
          mx: 0.75,
          color: 'text.disabled',
          display: 'flex',
          alignItems: 'center',
        },
      }}
    >
      <Link
        component={NextLink}
        href="/dashboard"
        underline="hover"
        sx={{ ...crumbSx, display: 'inline-flex', alignItems: 'center', gap: 0.5, lineHeight: 1 }}
      >
        <HomeRoundedIcon sx={{ fontSize: 17 }} />
        Beranda
      </Link>

      {crumbs.map((c, i) =>
        c.href ? (
          <Link
            key={i}
            component={NextLink}
            href={c.href}
            underline="hover"
            sx={{ ...crumbSx, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
          >
            {c.label}
          </Link>
        ) : (
          <Typography
            key={i}
            sx={{
              color: 'text.primary',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            {c.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
