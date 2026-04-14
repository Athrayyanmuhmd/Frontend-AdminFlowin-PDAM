/**
 * GraphQL Queries & Mutations - Customer Operations (Pengguna)
 * Disesuaikan dengan Ahmad's flowin-backend schema
 */

import { gql } from '@apollo/client';

// ==================== QUERIES ====================

export const GET_ALL_CUSTOMERS = gql`
  query GetAllCustomers {
    getAllPengguna {
      _id
      namaLengkap
      email
      noHP
      profilePicture
      isVerified
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    getPengguna(id: $id) {
      _id
      namaLengkap
      email
      noHP
      profilePicture
      isVerified
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($search: String!) {
    searchPengguna(search: $search) {
      _id
      namaLengkap
      email
      noHP
      isVerified
    }
  }
`;

// ==================== MUTATIONS ====================

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deletePelanggan(id: $id) {
      success
      message
    }
  }
`;

// Stub backward-compat — Ahmad tidak menyediakan updatePelanggan dari sisi admin
// Tetap diekspor agar halaman yang masih import ini bisa compile
export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdatePelangganInput!) {
    updatePelanggan(id: $id, input: $input) {
      _id
      namaLengkap
      email
      noHP
      updatedAt
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreatePelangganInput!) {
    createPelanggan(input: $input) {
      _id
      namaLengkap
      email
      noHP
      isVerified
      createdAt
    }
  }
`;
