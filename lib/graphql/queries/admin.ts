import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Admin Account Management
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const GET_ALL_ADMINS = gql`
  query GetAllAdmins {
    getAllAdmins {
      _id
      NIP
      namaLengkap
      email
      noHP
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_ADMIN_BY_ID = gql`
  query GetAdmin($id: ID!) {
    getAdmin(id: $id) {
      _id
      NIP
      namaLengkap
      email
      noHP
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ADMIN = gql`
  mutation CreateAdmin($input: CreateAdminInput!) {
    createAdmin(input: $input) {
      _id
      NIP
      namaLengkap
      email
      noHP
      isActive
      createdAt
    }
  }
`;

export const UPDATE_ADMIN = gql`
  mutation UpdateAdmin($id: ID!, $input: UpdateAdminInput!) {
    updateAdmin(id: $id, input: $input) {
      _id
      NIP
      namaLengkap
      email
      noHP
      isActive
      updatedAt
    }
  }
`;

export const DELETE_ADMIN = gql`
  mutation DeleteAdmin($id: ID!) {
    deleteAdmin(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_ADMIN_ACTIVE = gql`
  mutation ToggleAdminActive($id: ID!) {
    toggleAdminActive(id: $id) {
      _id
      namaLengkap
      isActive
    }
  }
`;
