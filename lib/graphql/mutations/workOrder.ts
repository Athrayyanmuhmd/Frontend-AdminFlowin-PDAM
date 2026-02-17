import { gql } from '@apollo/client';

export const CREATE_WORK_ORDER = gql`
  mutation CreateWorkOrder($input: CreateWorkOrderInput!) {
    createWorkOrder(input: $input) {
      _id
      idSurvei {
        _id
        namaKlien
      }
      rabId {
        _id
        totalBiaya
      }
      tim {
        _id
        namaLengkap
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const ASSIGN_WORK_ORDER = gql`
  mutation AssignWorkOrder($id: ID!, $teknisiIds: [ID!]!) {
    assignWorkOrder(id: $id, teknisiIds: $teknisiIds) {
      _id
      tim {
        _id
        namaLengkap
        email
        noHP
      }
      status
      updatedAt
    }
  }
`;

export const UPDATE_WORK_ORDER_STATUS = gql`
  mutation UpdateWorkOrderStatus($id: ID!, $status: EnumWorkStatus!, $catatan: String) {
    updateWorkOrderStatus(id: $id, status: $status, catatan: $catatan) {
      _id
      status
      catatan
      updatedAt
    }
  }
`;

export const APPROVE_WORK_ORDER = gql`
  mutation ApproveWorkOrder($id: ID!, $disetujui: Boolean!, $catatan: String) {
    approveWorkOrder(id: $id, disetujui: $disetujui, catatan: $catatan) {
      _id
      disetujui
      catatan
      status
      updatedAt
    }
  }
`;

export const DELETE_WORK_ORDER = gql`
  mutation DeleteWorkOrder($id: ID!) {
    deleteWorkOrder(id: $id) {
      success
      message
    }
  }
`;
