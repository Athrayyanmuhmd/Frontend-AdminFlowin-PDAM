import { gql } from '@apollo/client';

/**
 * GraphQL Queries & Mutations untuk Teknisi
 * Backend Schema: BE_backend/graphql/schemas/typeDefs.js
 */

// ==================== QUERIES ====================

export const GET_ALL_TEKNISI = gql`
  query GetAllTeknisi {
    getAllTeknisi {
      _id
      namaLengkap
      NIP
      email
      noHP
      divisi
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEKNISI = gql`
  query GetTeknisi($id: ID!) {
    getTeknisi(id: $id) {
      _id
      namaLengkap
      NIP
      email
      noHP
      divisi
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEKNISI_BY_DIVISI = gql`
  query GetTeknisiByDivisi($divisi: EnumDivisiTeknisi!) {
    getTeknisiByDivisi(divisi: $divisi) {
      _id
      namaLengkap
      NIP
      email
      noHP
      divisi
      createdAt
      updatedAt
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_TEKNISI = gql`
  mutation CreateTeknisi($input: CreateTeknisiInput!) {
    createTeknisi(input: $input) {
      _id
      namaLengkap
      NIP
      email
      noHP
      divisi
      createdAt
    }
  }
`;

export const UPDATE_TEKNISI = gql`
  mutation UpdateTeknisi($id: ID!, $input: UpdateTeknisiInput!) {
    updateTeknisi(id: $id, input: $input) {
      _id
      namaLengkap
      NIP
      email
      noHP
      divisi
      updatedAt
    }
  }
`;

export const DELETE_TEKNISI = gql`
  mutation DeleteTeknisi($id: ID!) {
    deleteTeknisi(id: $id) {
      success
      message
    }
  }
`;
