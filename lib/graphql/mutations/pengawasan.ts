import { gql } from '@apollo/client';

/**
 * Mutations untuk Pengawasan Pemasangan & Pengawasan Setelah Pemasangan
 * Backend schema: input hanya idPemasangan, urlGambar, catatan
 * Return type: _id, idPemasangan, urlGambar, catatan, createdAt, updatedAt
 */

export const CREATE_PENGAWASAN_PEMASANGAN = gql`
  mutation CreatePengawasanPemasangan($input: CreatePengawasanPemasanganInput!) {
    createPengawasanPemasangan(input: $input) {
      _id
      idPemasangan {
        _id
        seriMeteran
      }
      urlGambar
      catatan
      createdAt
    }
  }
`;

export const UPDATE_PENGAWASAN_PEMASANGAN = gql`
  mutation UpdatePengawasanPemasangan($id: ID!, $input: UpdatePengawasanPemasanganInput!) {
    updatePengawasanPemasangan(id: $id, input: $input) {
      _id
      urlGambar
      catatan
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
      urlGambar
      catatan
      createdAt
    }
  }
`;

export const UPDATE_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  mutation UpdatePengawasanSetelahPemasangan($id: ID!, $input: UpdatePengawasanSetelahPemasanganInput!) {
    updatePengawasanSetelahPemasangan(id: $id, input: $input) {
      _id
      urlGambar
      catatan
      updatedAt
    }
  }
`;

export const DELETE_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  mutation DeletePengawasanSetelahPemasangan($id: ID!) {
    deletePengawasanSetelahPemasangan(id: $id)
  }
`;
