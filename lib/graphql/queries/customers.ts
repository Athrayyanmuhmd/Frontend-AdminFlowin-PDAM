/**
 * GraphQL Queries & Mutations - Customer Operations (Pengguna)
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
      nik
      address
      gender
      birthDate
      occupation
      customerType
      accountStatus
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
      nik
      address
      gender
      birthDate
      occupation
      customerType
      accountStatus
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
      nik
      address
      customerType
      accountStatus
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreatePelangganInput!) {
    createPelanggan(input: $input) {
      _id
      namaLengkap
      email
      noHP
      nik
      accountStatus
      isVerified
      createdAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdatePelangganInput!) {
    updatePelanggan(id: $id, input: $input) {
      _id
      namaLengkap
      email
      noHP
      nik
      address
      gender
      birthDate
      occupation
      customerType
      accountStatus
      updatedAt
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deletePelanggan(id: $id) {
      success
      message
    }
  }
`;
