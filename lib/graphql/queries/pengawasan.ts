import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Pengawasan Pemasangan & Pengawasan Setelah Pemasangan
 * Backend schema (keduanya identik): _id, idPemasangan, urlGambar, catatan, statusAdmin, catatanAdmin, createdAt, updatedAt
 * Pemasangan nested: _id, idKoneksiData, seriMeteran, fotoRumah, fotoMeteran, fotoMeteranDanRumah, catatan
 * KoneksiData nested (PascalCase): _id, Alamat, IdPelanggan { namaLengkap, noHP }
 */

export const GET_ALL_PENGAWASAN_PEMASANGAN = gql`
  query GetAllPengawasanPemasangan {
    getAllPengawasanPemasangan {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      statusAdmin
      catatanAdmin
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_PEMASANGAN = gql`
  query GetPengawasanPemasangan($id: ID!) {
    getPengawasanPemasangan(id: $id) {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  query GetAllPengawasanSetelahPemasangan {
    getAllPengawasanSetelahPemasangan {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      statusAdmin
      catatanAdmin
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  query GetPengawasanSetelahPemasangan($id: ID!) {
    getPengawasanSetelahPemasangan(id: $id) {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      statusAdmin
      catatanAdmin
      createdAt
      updatedAt
    }
  }
`;

// Lightweight queries by pemasangan ID for connection-data detail page
export const GET_PENGAWASAN_BY_PEMASANGAN_ID = gql`
  query GetPengawasanByPemasanganId($idPemasangan: ID!) {
    getPengawasanPemasanganByPemasangan(idPemasangan: $idPemasangan) {
      _id
      urlGambar
      catatan
      statusAdmin
      catatanAdmin
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_SETELAH_BY_PEMASANGAN_ID = gql`
  query GetPengawasanSetelahByPemasanganId($idPemasangan: ID!) {
    getPengawasanSetelahPemasanganByPemasangan(idPemasangan: $idPemasangan) {
      _id
      urlGambar
      catatan
      statusAdmin
      catatanAdmin
      createdAt
      updatedAt
    }
  }
`;
