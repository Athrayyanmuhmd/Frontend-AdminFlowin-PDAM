import { gql } from '@apollo/client';

/**
 * GraphQL Mutations untuk Connection Data (KoneksiData)
 * Disesuaikan dengan Ahmad's schema: PascalCase fields, StatusPengajuanEnum
 */

export const CREATE_KONEKSI_DATA = gql`
  mutation CreateKoneksiData($input: CreateKoneksiDataInput!) {
    createKoneksiData(input: $input) {
      _id
      StatusPengajuan
      Alamat
      Kelurahan
      Kecamatan
      NIK
      NoKK
      IMB
      LuasBangunan
      createdAt
    }
  }
`;

export const VERIFY_CONNECTION_DATA = gql`
  mutation VerifyKoneksiData(
    $id: ID!
    $status: StatusPengajuanEnum!
    $catatan: String
    $alasanPenolakan: String
  ) {
    verifyKoneksiData(
      id: $id
      status: $status
      catatan: $catatan
      alasanPenolakan: $alasanPenolakan
    ) {
      _id
      StatusPengajuan
      AlasanPenolakan
      TanggalVerifikasi
      catatan
      updatedAt
    }
  }
`;

export const UPDATE_CONNECTION_DATA = gql`
  mutation UpdateKoneksiData($id: ID!, $input: UpdateKoneksiDataInput!) {
    updateKoneksiData(id: $id, input: $input) {
      _id
      Alamat
      StatusPengajuan
      catatan
      updatedAt
    }
  }
`;

export const DELETE_CONNECTION_DATA = gql`
  mutation DeleteKoneksiData($id: ID!) {
    deleteKoneksiData(id: $id) {
      success
      message
    }
  }
`;

// Stub — assign teknisi sekarang via Rafli WorkOrder (buatWorkOrder)
// Diekspor agar halaman yang masih import ini bisa compile
export const ASSIGN_TEKNISI_DED = gql`
  mutation AssignTeknisiDED($input: BuatWorkOrderInput!) {
    buatWorkOrder(input: $input) {
      success
      message
      workOrder {
        id
        jenisPekerjaan
        status
      }
    }
  }
`;
