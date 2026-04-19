import { gql } from '@apollo/client';

// ─── Fragmen WorkOrder (Rafli-aligned schema) ──────────────────────────────────

const WORK_ORDER_FRAGMENT = gql`
  fragment WorkOrderFields on WorkOrder {
    id
    idKoneksiData
    jenisPekerjaan
    status
    statusRespon
    statusTim
    catatanTim
    alasanPenolakan
    catatanReviewPenolakan
    catatanReview
    createdAt
    updatedAt
    koneksiData {
      id
      alamat
      statusPengajuan
      pelanggan {
        id
        namaLengkap
        noHp
        email
      }
    }
    teknisiPenanggungJawab {
      id
      namaLengkap
      nip
      divisi
    }
    tim {
      id
      namaLengkap
      nip
      divisi
    }
  }
`;

// ─── Queries ───────────────────────────────────────────────────────────────────

export const GET_WORK_ORDERS = gql`
  ${WORK_ORDER_FRAGMENT}
  query GetWorkOrders(
    $pagination: PaginationInput
    $filter: WorkOrderFilterInput
  ) {
    workOrders(pagination: $pagination, filter: $filter) {
      data {
        ...WorkOrderFields
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const GET_WORK_ORDER_BY_ID = gql`
  ${WORK_ORDER_FRAGMENT}
  query GetWorkOrder($id: ID!) {
    workOrder(id: $id) {
      ...WorkOrderFields
      workOrderSebelumnya {
        id
        jenisPekerjaan
        status
      }
      riwayatRespon {
        aksi
        alasan
        tanggal
        oleh
      }
      riwayatReview {
        status
        catatan
        tanggal
        oleh
      }
      idSurvei
      idRAB
      idPemasangan
      idPengawasanPemasangan
      idPengawasanSetelahPemasangan
      idPenyelesaianLaporan
    }
  }
`;

export const GET_WORK_ORDERS_BY_KONEKSI_DATA = gql`
  ${WORK_ORDER_FRAGMENT}
  query GetWorkOrdersByKoneksiData($idKoneksiData: ID!) {
    workOrdersByKoneksiData(idKoneksiData: $idKoneksiData) {
      ...WorkOrderFields
    }
  }
`;

export const GET_WORKFLOW_CHAIN = gql`
  query GetWorkflowChain($idKoneksiData: ID!) {
    workflowChain(idKoneksiData: $idKoneksiData) {
      jenisPekerjaan
      workOrder {
        id
        status
        statusRespon
        statusTim
        catatanTim
        createdAt
      }
    }
  }
`;

export const CEK_PREREQUISITE_PEKERJAAN = gql`
  query CekPrerequisitePekerjaan(
    $idKoneksiData: ID!
    $jenisPekerjaan: JenisPekerjaan!
  ) {
    cekPrerequisitePekerjaan(
      idKoneksiData: $idKoneksiData
      jenisPekerjaan: $jenisPekerjaan
    )
  }
`;
