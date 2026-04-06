import { gql } from '@apollo/client';

export const CREATE_KELOMPOK_PELANGGAN = gql`
  mutation CreateKelompokPelanggan($input: CreateKelompokPelangganInput!) {
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
  mutation UpdateKelompokPelanggan($id: ID!, $input: UpdateKelompokPelangganInput!) {
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
      success
      message
    }
  }
`;
