import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Dashboard
 * Backend: BE_backend/graphql/resolvers/index.js - getDashboardStats
 */

export const GET_CHART_KONSUMSI_PER_BULAN = gql`
  query GetChartKonsumsiPerBulan {
    getChartKonsumsiPerBulan {
      bulan
      totalTagihan
      jumlahTagihan
    }
  }
`;

export const GET_DISTRIBUSI_KELOMPOK_PELANGGAN = gql`
  query GetDistribusiKelompokPelanggan {
    getDistribusiKelompokPelanggan {
      namaKelompok
      jumlahMeteran
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalPelanggan
      totalTeknisi
      totalMeteran
      pendingKoneksi
      activeWorkOrders
      tunggakanAktif
      laporanTerbuka
      totalTagihanBulanIni
      koneksiMenunggu
      koneksiDisetujui
      koneksiDitolak
    }
  }
`;

/**
 * Query untuk mendapatkan statistik pelanggan
 * Menggunakan getAllPengguna dan melakukan filtering di frontend
 */
export const GET_CUSTOMER_STATS = gql`
  query GetCustomerStats {
    getAllPengguna {
      _id
      isVerified
      createdAt
    }
  }
`;

/**
 * Query untuk ringkasan status tagihan (dari dashboard resolver)
 */
export const GET_BILLING_STATS_DASHBOARD = gql`
  query GetBillingStatsDashboard {
    getRingkasanStatusTagihan {
      totalTagihan
      totalLunas
      totalTunggakan
      totalPending
      nilaiTotal
      nilaiLunas
      nilaiTunggakan
    }
  }
`;

/**
 * Query untuk ringkasan work orders (dari dashboard resolver)
 */
export const GET_WORK_ORDER_STATS = gql`
  query GetWorkOrderStats {
    getRingkasanWorkOrder {
      status
      jumlah
    }
  }
`;

/**
 * Query untuk mendapatkan semua meteran untuk statistik
 */
export const GET_METERAN_STATS = gql`
  query GetMeteranStats {
    getAllMeteran {
      _id
      NomorMeteran
      NomorAkun
      createdAt
    }
  }
`;

/**
 * Query gabungan untuk load semua data dashboard sekaligus
 */
export const GET_DASHBOARD_ALL_DATA = gql`
  query GetDashboardAllData {
    getDashboardStats {
      totalPelanggan
      totalTeknisi
      totalMeteran
      pendingKoneksi
      activeWorkOrders
      tunggakanAktif
      laporanTerbuka
      totalTagihanBulanIni
    }
    getAllPengguna {
      _id
      isVerified
      createdAt
    }
    getRingkasanStatusTagihan {
      totalTagihan
      totalLunas
      totalTunggakan
      totalPending
      nilaiTotal
      nilaiLunas
      nilaiTunggakan
    }
  }
`;
