'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import { useMemo, useState, useCallback } from 'react';
import {
  GET_ALL_TAGIHAN,
  GET_TAGIHAN_BY_STATUS,
  GET_TAGIHAN_BY_METERAN,
  GET_TUNGGAKAN,
  GET_DAFTAR_PEMUTUSAN,
  GET_BILLING_STATS,
  GET_BILLING_CHART,
  GENERATE_TAGIHAN,
  GENERATE_TAGIHAN_BULANAN,
  UPDATE_STATUS_PEMBAYARAN,
} from '../queries/billing';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusPembayaran =
  | 'pending'
  | 'settlement'
  | 'cancel'
  | 'expire'
  | 'refund'
  | 'chargeback'
  | 'fraud'
  | 'merged';

export type FilterPeriode = 'current' | 'last' | 'all';

export interface Tagihan {
  _id: string;
  userId?: string;
  IdMeteran?: {
    _id: string;
    NomorMeteran: string;
    NomorAkun: string;
    IdKoneksiData?: {
      _id: string;
      Alamat?: string;
      IdPelanggan?: {
        _id: string;
        namaLengkap: string;
        email: string;
        noHP: string;
      };
    };
  };
  Periode: string;
  PenggunaanSebelum?: number;
  PenggunaanSekarang?: number;
  TotalPemakaian?: number;
  Biaya?: number;
  BiayaBeban?: number;
  TotalBiaya?: number;
  StatusPembayaran: StatusPembayaran;
  TanggalPembayaran?: string;
  MetodePembayaran?: string;
  TenggatWaktu?: string;
  Menunggak?: boolean;
  Denda?: number;
  Catatan?: string;
  jenisBilling?: 'normal' | 'denda';
  bulanCakupan?: number;
  isMergedBilling?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingStats {
  totalTagihan: number;
  totalLunas: number;
  totalTunggakan: number;
  totalPending: number;
  nilaiTotal: number;
  nilaiLunas: number;
  nilaiTunggakan: number;
}

// ─── Helper: filter tagihan berdasarkan periode ───────────────────────────────

function matchesPeriode(tagihan: Tagihan, filter: FilterPeriode): boolean {
  if (filter === 'all' || !tagihan.Periode) return true;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const num = Number(tagihan.Periode);
  const d = !isNaN(num) && num > 1_000_000_000_000 ? new Date(num) : new Date(tagihan.Periode);
  if (isNaN(d.getTime())) return true;
  if (filter === 'current') return d.getFullYear() === y && d.getMonth() === m;
  // 'last'
  const lastM = m === 0 ? 11 : m - 1;
  const lastY = m === 0 ? y - 1 : y;
  return d.getFullYear() === lastY && d.getMonth() === lastM;
}

// ─── useTagihanList ────────────────────────────────────────────────────────────
// Hook utama untuk halaman /billing — list semua tagihan dengan filter & paginasi

export function useTagihanList(options?: { limit?: number; offset?: number }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusPembayaran | 'all'>('all');
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>('current');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const { data, loading, error, refetch } = useQuery(GET_ALL_TAGIHAN, {
    variables: { limit: options?.limit ?? 500, offset: options?.offset ?? 0 },
    fetchPolicy: 'network-only',
  });

  const allTagihan: Tagihan[] = useMemo(
    () => (data as any)?.getAllTagihan ?? [],
    [data],
  );

  // Client-side filter — data sudah di-fetch sekaligus untuk performa filter real-time
  const filtered = useMemo(() => {
    return allTagihan.filter((t) => {
      const nama = t.IdMeteran?.IdKoneksiData?.IdPelanggan?.namaLengkap ?? '';
      const noMeteran = t.IdMeteran?.NomorMeteran ?? '';
      const noAkun = t.IdMeteran?.NomorAkun ?? '';
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        nama.toLowerCase().includes(q) ||
        noMeteran.toLowerCase().includes(q) ||
        noAkun.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || t.StatusPembayaran === filterStatus;
      return matchSearch && matchStatus && matchesPeriode(t, filterPeriode);
    });
  }, [allTagihan, searchTerm, filterStatus, filterPeriode]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filtered, page],
  );

  // Reset page setiap kali filter berubah
  const handleSearch = useCallback((v: string) => { setSearchTerm(v); setPage(1); }, []);
  const handleFilterStatus = useCallback((v: StatusPembayaran | 'all') => { setFilterStatus(v); setPage(1); }, []);
  const handleFilterPeriode = useCallback((v: FilterPeriode) => { setFilterPeriode(v); setPage(1); }, []);

  return {
    // Data
    tagihan: paginated,
    allTagihan,
    totalTagihan: filtered.length,
    // State filter
    searchTerm,
    filterStatus,
    filterPeriode,
    // Pagination
    page,
    totalPages,
    rowsPerPage,
    // Actions
    setPage,
    setSearch: handleSearch,
    setFilterStatus: handleFilterStatus,
    setFilterPeriode: handleFilterPeriode,
    refetch,
    // Query state
    loading,
    error,
  };
}

// ─── useTagihanStats ───────────────────────────────────────────────────────────
// Statistik ringkasan untuk card di halaman /billing

export function useTagihanStats() {
  const { data, loading, error, refetch } = useQuery(GET_BILLING_STATS, {
    fetchPolicy: 'network-only',
  });
  const stats: BillingStats | null = (data as any)?.getRingkasanStatusTagihan ?? null;
  return { stats, loading, error, refetch };
}

// ─── useTagihanChart ───────────────────────────────────────────────────────────
// Data untuk grafik pendapatan bulanan di halaman /billing

export function useTagihanChart() {
  const { data, loading } = useQuery(GET_BILLING_CHART, { fetchPolicy: 'network-only' });
  const raw: any[] = (data as any)?.getLaporanKeuanganBulanan ?? [];
  const chartData = useMemo(
    () => raw.map((d) => ({ month: d.bulan, revenue: d.totalTagihan, bills: d.jumlahTagihan, collected: d.totalLunas })),
    [raw],
  );
  return { chartData, loading };
}

// ─── useTagihanByStatus ────────────────────────────────────────────────────────
// Untuk halaman /billing/payments — hanya tagihan dengan status tertentu

export function useTagihanByStatus(status: StatusPembayaran) {
  const { data, loading, error, refetch } = useQuery(GET_TAGIHAN_BY_STATUS, {
    variables: { status },
    fetchPolicy: 'network-only',
  });
  const tagihan: Tagihan[] = (data as any)?.getTagihanByStatus ?? [];
  return { tagihan, loading, error, refetch };
}

// ─── useTagihanByMeteran ───────────────────────────────────────────────────────
// Untuk detail meter — riwayat tagihan satu meteran

export function useTagihanByMeteran(idMeteran: string | null) {
  const { data, loading, error, refetch } = useQuery(GET_TAGIHAN_BY_METERAN, {
    variables: { IdMeteran: idMeteran },
    skip: !idMeteran,
    fetchPolicy: 'network-only',
  });
  const tagihan: Tagihan[] = (data as any)?.getTagihanByMeteran ?? [];
  return { tagihan, loading, error, refetch };
}

// ─── useTunggakan ─────────────────────────────────────────────────────────────
// Tagihan yang Menunggak=true — untuk laporan tunggakan

export function useTunggakan() {
  const { data, loading, error, refetch } = useQuery(GET_TUNGGAKAN, {
    fetchPolicy: 'network-only',
  });
  const tunggakan: Tagihan[] = (data as any)?.getTunggakan ?? [];
  return { tunggakan, totalTunggakan: tunggakan.length, loading, error, refetch };
}

// ─── useDaftarPemutusan ────────────────────────────────────────────────────────
// Pelanggan yang masuk daftar pemutusan (tunggak 3+ bulan)

export function useDaftarPemutusan() {
  const { data, loading, error, refetch } = useQuery(GET_DAFTAR_PEMUTUSAN, {
    fetchPolicy: 'network-only',
  });
  const daftar: any[] = (data as any)?.getDaftarPemutusan ?? [];
  return { daftar, loading, error, refetch };
}

// ─── useGenerateTagihan ────────────────────────────────────────────────────────
// Mutations untuk generate tagihan (single dan bulk)

export function useGenerateTagihan() {
  const [generateSingle, { loading: loadingSingle }] = useMutation(GENERATE_TAGIHAN);
  const [generateBulk, { loading: loadingBulk }] = useMutation(GENERATE_TAGIHAN_BULANAN);

  const generateSingleTagihan = useCallback(
    async (idMeteran: string, periode: string) => {
      const { data } = await generateSingle({ variables: { IdMeteran: idMeteran, Periode: periode } });
      return (data as any)?.generateTagihan ?? null;
    },
    [generateSingle],
  );

  const generateTagihanBulanan = useCallback(
    async (periode: string, idMeteranList: string[]) => {
      const { data } = await generateBulk({ variables: { Periode: periode, IdMeteranList: idMeteranList } });
      return (data as any)?.generateTagihanBulanan ?? null;
    },
    [generateBulk],
  );

  return {
    generateSingleTagihan,
    generateTagihanBulanan,
    loading: loadingSingle || loadingBulk,
  };
}

// ─── useUpdateStatusPembayaran ─────────────────────────────────────────────────
// Mutation untuk admin update status tagihan secara manual

export function useUpdateStatusPembayaran() {
  const [mutate, { loading }] = useMutation(UPDATE_STATUS_PEMBAYARAN);

  const updateStatus = useCallback(
    async (id: string, status: StatusPembayaran) => {
      const { data } = await mutate({ variables: { id, status } });
      return (data as any)?.updateStatusPembayaran ?? null;
    },
    [mutate],
  );

  return { updateStatus, loading };
}
