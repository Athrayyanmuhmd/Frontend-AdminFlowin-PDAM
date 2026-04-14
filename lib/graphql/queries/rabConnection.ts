import { gql } from '@apollo/client';

/**
 * GraphQL Queries/Mutations untuk RAB Connection
 * KoneksiData fields are PascalCase: Alamat, IdPelanggan, NoKK, Kelurahan, etc.
 * StatusPengajuan (NOT statusVerifikasi)
 * PaymentStatus enum (NOT EnumPaymentStatus)
 */

export const GET_ALL_RAB_CONNECTIONS = gql`
  query GetAllRABConnections {
    getAllRABConnections {
      _id
      idKoneksiData {
        _id
        NIK
        Alamat
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      totalBiaya
      statusPembayaran
      urlRab
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_RAB_CONNECTION_BY_ID = gql`
  query GetRABConnection($id: ID!) {
    getRABConnection(id: $id) {
      _id
      idKoneksiData {
        _id
        NIK
        NoKK
        IMB
        Alamat
        Kelurahan
        Kecamatan
        LuasBangunan
        StatusPengajuan
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      totalBiaya
      statusPembayaran
      orderId
      paymentUrl
      urlRab
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_RAB_BY_KONEKSI_DATA = gql`
  query GetRABByKoneksiData($idKoneksiData: ID!) {
    getRABByKoneksiData(idKoneksiData: $idKoneksiData) {
      _id
      totalBiaya
      statusPembayaran
      createdAt
    }
  }
`;

export const CREATE_RAB_CONNECTION = gql`
  mutation CreateRABConnection(
    $idKoneksiData: ID!
    $totalBiaya: Float
    $urlRab: String
    $catatan: String
  ) {
    createRABConnection(
      idKoneksiData: $idKoneksiData
      totalBiaya: $totalBiaya
      urlRab: $urlRab
      catatan: $catatan
    ) {
      _id
      idKoneksiData { _id }
      totalBiaya
      statusPembayaran
      urlRab
      createdAt
    }
  }
`;

export const UPDATE_RAB_CONNECTION = gql`
  mutation UpdateRABConnection(
    $id: ID!
    $totalBiaya: Float
    $urlRab: String
    $catatan: String
    $statusPembayaran: PaymentStatus
  ) {
    updateRABConnection(
      id: $id
      totalBiaya: $totalBiaya
      urlRab: $urlRab
      catatan: $catatan
      statusPembayaran: $statusPembayaran
    ) {
      _id
      totalBiaya
      statusPembayaran
      urlRab
      updatedAt
    }
  }
`;

export const DELETE_RAB_CONNECTION = gql`
  mutation DeleteRABConnection($id: ID!) {
    deleteRABConnection(id: $id)
  }
`;

export const GET_PENDING_RAB = gql`
  query GetPendingRAB {
    getPendingRAB {
      _id
      idKoneksiData {
        _id
        NIK
        Alamat
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      totalBiaya
      statusPembayaran
      createdAt
      updatedAt
    }
  }
`;
