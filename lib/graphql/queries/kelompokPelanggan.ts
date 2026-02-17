import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Kelompok Pelanggan
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const GET_ALL_KELOMPOK_PELANGGAN = gql`
  query GetAllKelompokPelanggan {
    getAllKelompokPelanggan {
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

export const GET_KELOMPOK_PELANGGAN_BY_ID = gql`
  query GetKelompokPelanggan($id: ID!) {
    getKelompokPelanggan(id: $id) {
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
