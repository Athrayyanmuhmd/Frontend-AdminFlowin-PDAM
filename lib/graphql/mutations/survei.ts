import { gql } from '@apollo/client';

export const ASSIGN_TEKNISI_SURVEI = gql`
  mutation AssignTeknisiSurvei($surveiId: ID!, $teknisiIds: [ID!]!) {
    assignTeknisiSurvei(surveiId: $surveiId, teknisiIds: $teknisiIds) {
      _id
      status
      disetujui
      tim {
        _id
        namaLengkap
        email
        noHP
      }
      updatedAt
    }
  }
`;

export const ASSIGN_TEKNISI_RAB = gql`
  mutation AssignTeknisiRAB($rabId: ID!, $teknisiIds: [ID!]!) {
    assignTeknisiRAB(rabId: $rabId, teknisiIds: $teknisiIds) {
      _id
      status
      disetujui
      tim {
        _id
        namaLengkap
        email
        noHP
      }
      updatedAt
    }
  }
`;

export const AKTIVASI_PELANGGAN = gql`
  mutation AktvasiPelanggan($koneksiDataId: ID!) {
    aktivasiPelanggan(koneksiDataId: $koneksiDataId) {
      _id
      namaLengkap
      email
      isVerified
      accountStatus
      updatedAt
    }
  }
`;
