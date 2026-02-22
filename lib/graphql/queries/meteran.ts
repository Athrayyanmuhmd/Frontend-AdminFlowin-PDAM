import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Meteran (Smart Water Meter)
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const GET_ALL_METERAN = gql`
  query GetAllMeteran {
    getAllMeteran {
      _id
      nomorMeteran
      nomorAkun
      statusAktif
      pemakaianBelumTerbayar
      totalPemakaian
      idKelompokPelanggan {
        _id
        namaKelompok
        hargaDiBawah10mKubik
        hargaDiAtas10mKubik
        biayaBeban
      }
      idKoneksiData {
        _id
        alamat
        idPelanggan {
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
      nomorMeteran
      nomorAkun
      statusAktif
      pemakaianBelumTerbayar
      totalPemakaian
      idKelompokPelanggan {
        _id
        namaKelompok
        hargaDiBawah10mKubik
        hargaDiAtas10mKubik
        biayaBeban
      }
      idKoneksiData {
        _id
        NIK
        alamat
        statusVerifikasi
        idPelanggan {
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

export const GET_METERAN_BY_PELANGGAN = gql`
  query GetMeteranByPelanggan($idPelanggan: ID!) {
    getMeteranByPelanggan(idPelanggan: $idPelanggan) {
      _id
      nomorMeteran
      nomorAkun
      idKelompokPelanggan {
        _id
        namaKelompok
      }
      idKoneksiData {
        _id
        alamat
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query untuk mendapatkan history usage meteran
 * Untuk monitoring real-time water consumption
 */
export const GET_HISTORY_USAGE_BY_METERAN = gql`
  query GetHistoryUsageByMeteran($nomorMeteran: String!) {
    getHistoryUsageByMeteran(nomorMeteran: $nomorMeteran) {
      _id
      nomorMeteran
      pemakaian
      tanggal
      createdAt
    }
  }
`;

/**
 * Query untuk statistik meteran
 * Total meteran, active, offline, dll
 */
export const GET_METERAN_STATS = gql`
  query GetMeteranStats {
    getDashboardStats {
      totalMeteran
      totalPelanggan
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_METERAN = gql`
  mutation CreateMeteran(
    $idKelompokPelanggan: ID!
    $nomorMeteran: String!
    $nomorAkun: String!
    $idKoneksiData: ID
  ) {
    createMeteran(
      idKelompokPelanggan: $idKelompokPelanggan
      nomorMeteran: $nomorMeteran
      nomorAkun: $nomorAkun
      idKoneksiData: $idKoneksiData
    ) {
      _id
      nomorMeteran
      nomorAkun
      statusAktif
      idKelompokPelanggan {
        _id
        namaKelompok
      }
      createdAt
    }
  }
`;

export const UPDATE_METERAN = gql`
  mutation UpdateMeteran(
    $id: ID!
    $idKelompokPelanggan: ID
    $nomorMeteran: String
    $nomorAkun: String
    $idKoneksiData: ID
    $statusAktif: Boolean
  ) {
    updateMeteran(
      id: $id
      idKelompokPelanggan: $idKelompokPelanggan
      nomorMeteran: $nomorMeteran
      nomorAkun: $nomorAkun
      idKoneksiData: $idKoneksiData
      statusAktif: $statusAktif
    ) {
      _id
      nomorMeteran
      nomorAkun
      statusAktif
      idKelompokPelanggan {
        _id
        namaKelompok
      }
    }
  }
`;

export const DELETE_METERAN = gql`
  mutation DeleteMeteran($id: ID!) {
    deleteMeteran(id: $id)
  }
`;
