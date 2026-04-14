import { gql } from '@apollo/client';

/**
 * Mutations untuk Pemasangan & PenyelesaianLaporan
 * Pemasangan fields: _id, idKoneksiData, seriMeteran, fotoRumah, fotoMeteran, fotoMeteranDanRumah, catatan
 * PenyelesaianLaporan fields: _id, idLaporan, urlGambar, catatan
 */

export const CREATE_PEMASANGAN = gql`
  mutation CreatePemasangan($input: CreatePemasanganInput!) {
    createPemasangan(input: $input) {
      _id
      seriMeteran
      catatan
      createdAt
    }
  }
`;

export const UPDATE_PEMASANGAN = gql`
  mutation UpdatePemasangan($id: ID!, $input: UpdatePemasanganInput!) {
    updatePemasangan(id: $id, input: $input) {
      _id
      seriMeteran
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
      updatedAt
    }
  }
`;

export const DELETE_PENYELESAIAN_LAPORAN = gql`
  mutation DeletePenyelesaianLaporan($id: ID!) {
    deletePenyelesaianLaporan(id: $id)
  }
`;
