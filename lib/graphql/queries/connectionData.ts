import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Connection Data (Data Sambungan)
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const GET_ALL_CONNECTION_DATA = gql`
  query GetAllKoneksiData {
    getAllKoneksiData {
      _id
      idPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      NIK
      NIKUrl
      noKK
      KKUrl
      IMB
      IMBUrl
      alamat
      kelurahan
      kecamatan
      luasBangunan
      statusVerifikasi
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONNECTION_DATA_BY_ID = gql`
  query GetKoneksiData($id: ID!) {
    getKoneksiData(id: $id) {
      _id
      idPelanggan {
        _id
        namaLengkap
        email
        noHP
        isVerified
      }
      NIK
      NIKUrl
      noKK
      KKUrl
      IMB
      IMBUrl
      alamat
      kelurahan
      kecamatan
      luasBangunan
      statusVerifikasi
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENDING_CONNECTION_DATA = gql`
  query GetPendingKoneksiData {
    getPendingKoneksiData {
      _id
      idPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      alamat
      statusVerifikasi
      createdAt
      updatedAt
    }
  }
`;

export const GET_VERIFIED_CONNECTION_DATA = gql`
  query GetVerifiedKoneksiData {
    getVerifiedKoneksiData {
      _id
      idPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      alamat
      statusVerifikasi
      createdAt
      updatedAt
    }
  }
`;
