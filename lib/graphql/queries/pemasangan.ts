import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Pemasangan
 * Backend schema: Pemasangan hanya punya: _id, idKoneksiData, seriMeteran,
 * fotoRumah, fotoMeteran, fotoMeteranDanRumah, catatan, createdAt, updatedAt
 */

export const GET_ALL_PEMASANGAN = gql`
  query GetAllPemasangan {
    getAllPemasangan {
      _id
      idKoneksiData {
        _id
        Alamat
        IdPelanggan {
          _id
          namaLengkap
          noHP
        }
      }
      seriMeteran
      fotoRumah
      fotoMeteran
      fotoMeteranDanRumah
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_PEMASANGAN = gql`
  query GetPemasangan($id: ID!) {
    getPemasangan(id: $id) {
      _id
      idKoneksiData {
        _id
        Alamat
        IdPelanggan {
          _id
          namaLengkap
          noHP
          email
        }
      }
      seriMeteran
      fotoRumah
      fotoMeteran
      fotoMeteranDanRumah
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_PEMASANGAN_BY_KONEKSI_DATA = gql`
  query GetPemasanganByKoneksiData($idKoneksiData: ID!) {
    getPemasanganByKoneksiData(idKoneksiData: $idKoneksiData) {
      _id
      seriMeteran
      catatan
      createdAt
    }
  }
`;
