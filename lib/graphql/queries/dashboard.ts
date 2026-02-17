import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Dashboard
 * Backend: BE_backend/graphql/resolvers/index.js - getDashboardStats
 */

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
 * Query untuk mendapatkan statistik billing
 * Menggunakan getAllBillings untuk menghitung revenue dan collection rate
 */
export const GET_BILLING_STATS = gql`
  query GetBillingStats {
    getAllBillings {
      _id
      totalBiaya
      menunggak
      statusPembayaran
      createdAt
    }
  }
`;

/**
 * Query untuk mendapatkan statistik work orders
 * Menggunakan getAllWorkOrders untuk menghitung completion rate
 */
export const GET_WORK_ORDER_STATS = gql`
  query GetWorkOrderStats {
    getAllWorkOrders {
      _id
      status
      disetujui
      createdAt
      updatedAt
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
      nomorMeteran
      nomorAkun
      createdAt
    }
  }
`;

/**
 * Query gabungan untuk load semua data dashboard sekaligus
 * Menggunakan single request untuk efficiency
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
    getAllBillings {
      _id
      totalBiaya
      menunggak
      statusPembayaran
      createdAt
    }
  }
`;
