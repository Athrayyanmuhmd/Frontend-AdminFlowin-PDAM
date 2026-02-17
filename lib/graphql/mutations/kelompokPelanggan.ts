import { gql } from '@apollo/client';

/**
 * GraphQL Mutations untuk Kelompok Pelanggan
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const CREATE_KELOMPOK_PELANGGAN = gql`
  mutation CreateKelompokPelanggan($input: KelompokPelangganInput!) {
    createKelompokPelanggan(input: $input) {
      _id
      namaKelompok
      hargaDiBawah10mKubik
      hargaDiAtas10mKubik
      biayaBeban
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_KELOMPOK_PELANGGAN = gql`
  mutation UpdateKelompokPelanggan($id: ID!, $input: KelompokPelangganInput!) {
    updateKelompokPelanggan(id: $id, input: $input) {
      _id
      namaKelompok
      hargaDiBawah10mKubik
      hargaDiAtas10mKubik
      biayaBeban
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_KELOMPOK_PELANGGAN = gql`
  mutation DeleteKelompokPelanggan($id: ID!) {
    deleteKelompokPelanggan(id: $id) {
      _id
      namaKelompok
    }
  }
`;
