import { gql } from '@apollo/client';

const MUTATION_RESPONSE_FRAGMENT = gql`
  fragment WorkOrderMutationFields on WorkOrderMutationResponse {
    success
    message
    workOrder {
      id
      jenisPekerjaan
      status
      statusRespon
      statusTim
      catatanTim
      updatedAt
    }
  }
`;

export const BUAT_WORK_ORDER = gql`
  ${MUTATION_RESPONSE_FRAGMENT}
  mutation BuatWorkOrder($input: BuatWorkOrderInput!) {
    buatWorkOrder(input: $input) {
      ...WorkOrderMutationFields
    }
  }
`;

export const REVIEW_PENOLAKAN = gql`
  ${MUTATION_RESPONSE_FRAGMENT}
  mutation ReviewPenolakan($input: ReviewPenolakanInput!) {
    reviewPenolakan(input: $input) {
      ...WorkOrderMutationFields
    }
  }
`;

export const REVIEW_TIM = gql`
  ${MUTATION_RESPONSE_FRAGMENT}
  mutation ReviewTim($input: ReviewTimInput!) {
    reviewTim(input: $input) {
      ...WorkOrderMutationFields
    }
  }
`;

export const REVIEW_HASIL = gql`
  ${MUTATION_RESPONSE_FRAGMENT}
  mutation ReviewHasil($input: ReviewHasilInput!) {
    reviewHasil(input: $input) {
      ...WorkOrderMutationFields
    }
  }
`;

export const BATALKAN_WORK_ORDER = gql`
  mutation BatalkanWorkOrder($id: ID!, $catatan: String) {
    batalkanWorkOrder(id: $id, catatan: $catatan) {
      success
      message
    }
  }
`;

// ─── Backward-compat stubs (halaman lama masih import ini) ───────────────────

export const UPDATE_WORK_ORDER_STATUS = BATALKAN_WORK_ORDER;

export const APPROVE_WORK_ORDER = REVIEW_HASIL;

export const ASSIGN_WORK_ORDER = BUAT_WORK_ORDER;

export const CREATE_WORK_ORDER_FROM_LAPORAN = BUAT_WORK_ORDER;

export const DELETE_WORK_ORDER = gql`
  mutation DeleteWorkOrder($id: ID!) {
    batalkanWorkOrder(id: $id) {
      success
      message
    }
  }
`;
