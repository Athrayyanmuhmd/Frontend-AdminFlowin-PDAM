import { gql } from '@apollo/client';

export const CREATE_PEMASANGAN = gql`
  mutation CreatePemasangan($input: CreatePemasanganInput!) {
    createPemasangan(input: $input) {
      _id
      seriMeteran
      statusVerifikasi
      tanggalPemasangan
      createdAt
    }
  }
`;

export const UPDATE_PEMASANGAN = gql`
  mutation UpdatePemasangan($id: ID!, $input: UpdatePemasanganInput!) {
    updatePemasangan(id: $id, input: $input) {
      _id
      seriMeteran
      statusVerifikasi
      catatan
      updatedAt
    }
  }
`;

export const DELETE_PEMASANGAN = gql`
  mutation DeletePemasangan($id: ID!) {
    deletePemasangan(id: $id)
  }
`;

export const VERIFY_PEMASANGAN = gql`
  mutation VerifyPemasangan($id: ID!, $statusVerifikasi: String!, $catatan: String) {
    verifyPemasangan(id: $id, statusVerifikasi: $statusVerifikasi, catatan: $catatan) {
      _id
      statusVerifikasi
      diverifikasiOleh {
        _id
        namaLengkap
      }
      tanggalVerifikasi
      catatan
      updatedAt
    }
  }
`;

export const CREATE_PENYELESAIAN_LAPORAN = gql`
  mutation CreatePenyelesaianLaporan($input: CreatePenyelesaianLaporanInput!) {
    createPenyelesaianLaporan(input: $input) {
      _id
      idLaporan {
        _id
        namaLaporan
        status
      }
      urlGambar
      catatan
      teknisiId {
        _id
        namaLengkap
      }
      tanggalSelesai
      metadata {
        durasiPengerjaan
        materialDigunakan
        biaya
      }
      createdAt
    }
  }
`;

export const UPDATE_PENYELESAIAN_LAPORAN = gql`
  mutation UpdatePenyelesaianLaporan($id: ID!, $input: UpdatePenyelesaianLaporanInput!) {
    updatePenyelesaianLaporan(id: $id, input: $input) {
      _id
      urlGambar
      catatan
      tanggalSelesai
      updatedAt
    }
  }
`;

export const DELETE_PENYELESAIAN_LAPORAN = gql`
  mutation DeletePenyelesaianLaporan($id: ID!) {
    deletePenyelesaianLaporan(id: $id)
  }
`;
