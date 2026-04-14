import { gql } from '@apollo/client';

/**
 * GraphQL Mutations untuk Billing/Tagihan
 * Disesuaikan dengan Ahmad's schema: PascalCase fields, PaymentStatus UPPERCASE
 */

export const GENERATE_TAGIHAN = gql`
  mutation GenerateTagihan($IdMeteran: ID!, $Periode: String!) {
    generateTagihan(IdMeteran: $IdMeteran, Periode: $Periode) {
      _id
      IdMeteran {
        _id
        NomorMeteran
        NomorAkun
      }
      Periode
      TotalPemakaian
      TotalBiaya
      StatusPembayaran
      TenggatWaktu
      createdAt
    }
  }
`;

export const GENERATE_TAGIHAN_BULANAN = gql`
  mutation GenerateTagihanBulanan($Periode: String!, $IdMeteranList: [ID!]!) {
    generateTagihanBulanan(Periode: $Periode, IdMeteranList: $IdMeteranList) {
      berhasil
      gagal
      pesan
      detailGagal {
        IdMeteran
        NomorMeteran
        NomorAkun
        namaLengkap
        alasan
      }
    }
  }
`;

export const UPDATE_STATUS_PEMBAYARAN = gql`
  mutation UpdateStatusPembayaran($id: ID!, $status: PaymentStatus!) {
    updateStatusPembayaran(id: $id, status: $status) {
      _id
      StatusPembayaran
      TanggalPembayaran
      updatedAt
    }
  }
`;
