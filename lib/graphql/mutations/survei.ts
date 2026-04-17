import { gql } from '@apollo/client';

/**
 * Mutations untuk Review Survei & Konfirmasi Pembayaran RAB
 */

export const REVIEW_SURVEI = gql`
  mutation ReviewSurvei($id: ID!, $disetujui: Boolean!, $catatan: String) {
    reviewSurvei(id: $id, disetujui: $disetujui, catatan: $catatan) {
      _id
      statusAdmin
      catatanAdmin
      updatedAt
    }
  }
`;

export const KONFIRMASI_PEMBAYARAN_RAB = gql`
  mutation KonfirmasiPembayaranRAB($id: ID!, $catatan: String) {
    konfirmasiPembayaranRAB(id: $id, catatan: $catatan) {
      _id
      statusPembayaran
      statusKonfirmasiPembayaran
      catatanKonfirmasi
      updatedAt
    }
  }
`;

export const TANDAI_LUNAS_RAB = gql`
  mutation TandaiLunasRAB($id: ID!, $catatan: String) {
    tandaiLunasRAB(id: $id, catatan: $catatan) {
      _id
      statusPembayaran
      statusKonfirmasiPembayaran
      catatanKonfirmasi
      updatedAt
    }
  }
`;
