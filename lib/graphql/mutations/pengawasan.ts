import { gql } from '@apollo/client';

export const CREATE_PENGAWASAN_PEMASANGAN = gql`
  mutation CreatePengawasanPemasangan($input: CreatePengawasanPemasanganInput!) {
    createPengawasanPemasangan(input: $input) {
      _id
      idPemasangan {
        _id
        seriMeteran
      }
      hasilPengawasan
      tanggalPengawasan
      perluTindakLanjut
      createdAt
    }
  }
`;

export const UPDATE_PENGAWASAN_PEMASANGAN = gql`
  mutation UpdatePengawasanPemasangan($id: ID!, $input: UpdatePengawasanPemasanganInput!) {
    updatePengawasanPemasangan(id: $id, input: $input) {
      _id
      hasilPengawasan
      catatan
      rekomendasi
      perluTindakLanjut
      updatedAt
    }
  }
`;

export const DELETE_PENGAWASAN_PEMASANGAN = gql`
  mutation DeletePengawasanPemasangan($id: ID!) {
    deletePengawasanPemasangan(id: $id)
  }
`;

export const CREATE_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  mutation CreatePengawasanSetelahPemasangan($input: CreatePengawasanSetelahPemasanganInput!) {
    createPengawasanSetelahPemasangan(input: $input) {
      _id
      idPemasangan {
        _id
        seriMeteran
      }
      hasilPengawasan
      statusMeteran
      bacaanAwal
      hariSetelahPemasangan
      tanggalPengawasan
      perluTindakLanjut
      createdAt
    }
  }
`;

export const UPDATE_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  mutation UpdatePengawasanSetelahPemasangan($id: ID!, $input: UpdatePengawasanSetelahPemasanganInput!) {
    updatePengawasanSetelahPemasangan(id: $id, input: $input) {
      _id
      hasilPengawasan
      statusMeteran
      catatan
      tindakan
      rekomendasi
      perluTindakLanjut
      updatedAt
    }
  }
`;

export const DELETE_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  mutation DeletePengawasanSetelahPemasangan($id: ID!) {
    deletePengawasanSetelahPemasangan(id: $id)
  }
`;
