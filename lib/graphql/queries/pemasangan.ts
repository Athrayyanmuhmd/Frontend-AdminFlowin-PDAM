import { gql } from '@apollo/client';

export const GET_ALL_PEMASANGAN = gql`
  query GetAllPemasangan {
    getAllPemasangan {
      _id
      idKoneksiData {
        _id
        alamat
        idPelanggan {
          namaLengkap
          noHP
        }
      }
      seriMeteran
      fotoRumah
      fotoMeteran
      fotoMeteranDanRumah
      catatan
      teknisiId {
        _id
        namaLengkap
        divisi
      }
      tanggalPemasangan
      statusVerifikasi
      diverifikasiOleh {
        _id
        namaLengkap
      }
      tanggalVerifikasi
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
        alamat
        idPelanggan {
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
      teknisiId {
        _id
        namaLengkap
        divisi
        email
        noHP
      }
      tanggalPemasangan
      statusVerifikasi
      diverifikasiOleh {
        _id
        namaLengkap
      }
      tanggalVerifikasi
      detailPemasangan {
        diameterPipa
        lokasiPemasangan
        materialDigunakan
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PEMASANGAN_BY_STATUS = gql`
  query GetPemasanganByStatus($statusVerifikasi: String!) {
    getPemasanganByStatus(statusVerifikasi: $statusVerifikasi) {
      _id
      idKoneksiData {
        _id
        alamat
        idPelanggan {
          namaLengkap
        }
      }
      seriMeteran
      teknisiId {
        _id
        namaLengkap
      }
      statusVerifikasi
      tanggalPemasangan
      createdAt
    }
  }
`;
