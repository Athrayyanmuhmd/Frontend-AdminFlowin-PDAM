import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Kelompok Pelanggan
 * Backend: BE_backend/graphql/resolvers/domains/kelompokPelanggan.ts
 * Field names: PascalCase (sesuai backend schema)
 */

export const GET_ALL_KELOMPOK_PELANGGAN = gql`
  query GetAllKelompokPelanggan {
    getAllKelompokPelanggan {
      _id
      KodeKelompok
      NamaKelompok
      Kategori
      Deskripsi
      TarifRendah
      TarifTinggi
      BatasRendah
      BiayaBeban
      IsKesepakatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_KELOMPOK_PELANGGAN_BY_ID = gql`
  query GetKelompokPelanggan($id: ID!) {
    getKelompokPelanggan(id: $id) {
      _id
      KodeKelompok
      NamaKelompok
      Kategori
      Deskripsi
      TarifRendah
      TarifTinggi
      BatasRendah
      BiayaBeban
      IsKesepakatan
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_KELOMPOK_PELANGGAN = gql`
  mutation CreateKelompokPelanggan($input: CreateKelompokPelangganInput!) {
    createKelompokPelanggan(input: $input) {
      _id
      KodeKelompok
      NamaKelompok
      Kategori
      TarifRendah
      TarifTinggi
      BatasRendah
      BiayaBeban
      IsKesepakatan
      createdAt
    }
  }
`;

export const UPDATE_KELOMPOK_PELANGGAN = gql`
  mutation UpdateKelompokPelanggan($id: ID!, $input: UpdateKelompokPelangganInput!) {
    updateKelompokPelanggan(id: $id, input: $input) {
      _id
      KodeKelompok
      NamaKelompok
      Kategori
      TarifRendah
      TarifTinggi
      BatasRendah
      BiayaBeban
      IsKesepakatan
      updatedAt
    }
  }
`;

export const DELETE_KELOMPOK_PELANGGAN = gql`
  mutation DeleteKelompokPelanggan($id: ID!) {
    deleteKelompokPelanggan(id: $id) {
      success
      message
    }
  }
`;
