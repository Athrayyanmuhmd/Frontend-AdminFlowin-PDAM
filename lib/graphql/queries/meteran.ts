import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Meteran (Smart Water Meter)
 * Disesuaikan dengan Ahmad's schema: PascalCase FK fields
 */

export const GET_ALL_METERAN = gql`
  query GetAllMeteran($limit: Int, $offset: Int) {
    getAllMeteran(limit: $limit, offset: $offset) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      pemakaianBelumTerbayar
      totalPemakaian
      IdKelompokPelanggan {
        _id
        NamaKelompok
        TarifRendah
        TarifTinggi
        BiayaBeban
      }
      IdKoneksiData {
        _id
        Alamat
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_METERAN_BY_ID = gql`
  query GetMeteran($id: ID!) {
    getMeteran(id: $id) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      pemakaianBelumTerbayar
      totalPemakaian
      IdKelompokPelanggan {
        _id
        NamaKelompok
        TarifRendah
        TarifTinggi
        BiayaBeban
      }
      IdKoneksiData {
        _id
        NIK
        Alamat
        StatusPengajuan
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_METERAN_BY_KONEKSI_DATA = gql`
  query GetMeteranByKoneksiData($IdKoneksiData: ID!) {
    getMeteranByKoneksiData(IdKoneksiData: $IdKoneksiData) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      IdKelompokPelanggan {
        _id
        NamaKelompok
      }
      createdAt
    }
  }
`;

export const GET_METERAN_BY_PELANGGAN = gql`
  query GetMeteranByPelanggan($idPelanggan: ID!) {
    getMeteranByPelanggan(idPelanggan: $idPelanggan) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      totalPemakaian
      pemakaianBelumTerbayar
      IdKelompokPelanggan {
        _id
        NamaKelompok
      }
      IdKoneksiData {
        _id
        Alamat
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_METERAN_STATS = gql`
  query GetMeteranStats {
    getDashboardStats {
      totalMeteran
      totalPelanggan
    }
  }
`;

export const GET_RIWAYAT_PENGGUNAAN_BULANAN = gql`
  query GetRiwayatPenggunaanBulanan($meteranId: ID!) {
    getRiwayatPenggunaanBulanan(meteranId: $meteranId) {
      bulan
      totalPemakaian
      jumlahRecord
    }
  }
`;

export const GET_RIWAYAT_PENGGUNAAN = gql`
  query GetRiwayatPenggunaan($meteranId: ID!, $limit: Int) {
    getRiwayatPenggunaan(meteranId: $meteranId, limit: $limit) {
      _id
      penggunaanAir
      createdAt
    }
  }
`;

export const GET_ESTIMASI_BIAYA = gql`
  query GetEstimasiBiaya($meteranId: ID!) {
    getEstimasiBiaya(meteranId: $meteranId) {
      pemakaianBelumTerbayar
      estimasiBiaya
      biayaBeban
      totalEstimasi
      namaKelompok
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_METERAN = gql`
  mutation CreateMeteran(
    $IdKelompokPelanggan: ID!
    $NomorMeteran: String!
    $NomorAkun: String!
    $IdKoneksiData: ID
  ) {
    createMeteran(
      IdKelompokPelanggan: $IdKelompokPelanggan
      NomorMeteran: $NomorMeteran
      NomorAkun: $NomorAkun
      IdKoneksiData: $IdKoneksiData
    ) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      IdKelompokPelanggan {
        _id
        NamaKelompok
      }
      createdAt
    }
  }
`;

export const UPDATE_METERAN = gql`
  mutation UpdateMeteran(
    $id: ID!
    $IdKelompokPelanggan: ID
    $NomorMeteran: String
    $NomorAkun: String
    $IdKoneksiData: ID
    $statusAktif: Boolean
  ) {
    updateMeteran(
      id: $id
      IdKelompokPelanggan: $IdKelompokPelanggan
      NomorMeteran: $NomorMeteran
      NomorAkun: $NomorAkun
      IdKoneksiData: $IdKoneksiData
      statusAktif: $statusAktif
    ) {
      _id
      NomorMeteran
      NomorAkun
      statusAktif
      IdKelompokPelanggan {
        _id
        NamaKelompok
      }
    }
  }
`;

export const DELETE_METERAN = gql`
  mutation DeleteMeteran($id: ID!) {
    deleteMeteran(id: $id) {
      success
      message
    }
  }
`;

// Stub — endpoint ini tidak ada di backend; hook useMeteran masih import ini
export const GET_HISTORY_USAGE_BY_METERAN = gql`
  query GetHistoryUsageByMeteran($nomorMeteran: String!) {
    getRiwayatPenggunaan(meteranId: $nomorMeteran, limit: 50) {
      _id
      penggunaanAir
      createdAt
    }
  }
`;
