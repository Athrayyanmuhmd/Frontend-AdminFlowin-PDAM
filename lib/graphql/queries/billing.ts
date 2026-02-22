import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Billing/Tagihan
 * Backend Schema: BE_backend/graphql/schemas/typeDefs.js
 */

// Get all billings (tagihan)
export const GET_ALL_TAGIHAN = gql`
  query GetAllTagihan {
    getAllTagihan {
      _id
      idMeteran {
        _id
        nomorMeteran
        nomorAkun
        idPengguna {
          _id
          namaLengkap
          email
          noHP
        }
      }
      periode
      penggunaanSebelum
      penggunaanSekarang
      totalPemakaian
      biaya
      biayaBeban
      totalBiaya
      statusPembayaran
      tanggalPembayaran
      metodePembayaran
      tenggatWaktu
      menunggak
      denda
      catatan
      createdAt
      updatedAt
    }
  }
`;

// Get billings by status (for payments page - Settlement = success)
export const GET_TAGIHAN_BY_STATUS = gql`
  query GetTagihanByStatus($status: EnumPaymentStatus!) {
    getTagihanByStatus(status: $status) {
      _id
      idMeteran {
        _id
        nomorMeteran
        nomorAkun
        idKoneksiData {
          idPelanggan {
            _id
            namaLengkap
            email
            noHP
          }
        }
      }
      periode
      totalPemakaian
      totalBiaya
      statusPembayaran
      tanggalPembayaran
      metodePembayaran
      tenggatWaktu
      denda
      createdAt
      updatedAt
    }
  }
`;

// Get billings by meter ID (for customer detail page billing history)
export const GET_TAGIHAN_BY_METERAN = gql`
  query GetTagihanByMeteran($idMeteran: ID!) {
    getTagihanByMeteran(idMeteran: $idMeteran) {
      _id
      periode
      penggunaanSebelum
      penggunaanSekarang
      totalPemakaian
      biaya
      biayaBeban
      totalBiaya
      statusPembayaran
      tanggalPembayaran
      metodePembayaran
      tenggatWaktu
      menunggak
      denda
      catatan
      createdAt
      updatedAt
    }
  }
`;

// Main billing list query - uses real backend schema
export const GET_BILLINGS = gql`
  query GetBillings {
    getAllTagihan {
      _id
      idMeteran {
        _id
        nomorMeteran
        nomorAkun
        idKoneksiData {
          idPelanggan {
            _id
            namaLengkap
            email
          }
        }
      }
      periode
      totalPemakaian
      biaya
      biayaBeban
      totalBiaya
      statusPembayaran
      tanggalPembayaran
      metodePembayaran
      tenggatWaktu
      menunggak
      denda
      catatan
      createdAt
    }
  }
`;

// Billing stats from real backend schema
export const GET_BILLING_STATS = gql`
  query GetBillingStats {
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

// Chart data for billing trend
export const GET_BILLING_CHART = gql`
  query GetBillingChart {
    getLaporanKeuanganBulanan {
      bulan
      totalTagihan
      totalLunas
      jumlahTagihan
      jumlahLunas
    }
  }
`;

export const GET_BILLING_BY_ID = gql`
  query GetBillingById($id: ID!) {
    billing(id: $id) {
      _id
      idPengguna {
        _id
        namaLengkap
        email
        noHP
        alamat
      }
      idMeteran {
        _id
        nomorSeri
        lokasi
      }
      bulan
      tahun
      tanggalTagihan
      tanggalJatuhTempo
      pemakaian
      totalBiaya
      statusPembayaran
      metodePembayaran
      tanggalPembayaran
      denda
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMER_BILLINGS = gql`
  query GetCustomerBillings($customerId: ID!, $filter: BillingFilterInput) {
    customerBillings(customerId: $customerId, filter: $filter) {
      _id
      bulan
      tahun
      tanggalTagihan
      tanggalJatuhTempo
      pemakaian
      totalBiaya
      statusPembayaran
      metodePembayaran
      tanggalPembayaran
      idMeteran {
        nomorSeri
      }
    }
  }
`;
