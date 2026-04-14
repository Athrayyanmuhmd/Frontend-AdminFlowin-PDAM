import { gql } from '@apollo/client';

/**
 * GraphQL Queries & Mutations untuk Teknisi
 * Backend Schema: BE_backend/graphql/schemas/typeDefs/teknisi.ts
 * Teknisi type uses camelCase; `id` (not `_id`), `nip`, `noHp`
 */

// ==================== QUERIES ====================

export const GET_ALL_TEKNISI = gql`
  query GetAllTeknisi {
    getAllTeknisi {
      id
      namaLengkap
      nip
      email
      noHp
      divisi
      isActive
      pekerjaanSekarang
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEKNISI = gql`
  query GetTeknisi($id: ID!) {
    getTeknisi(id: $id) {
      id
      namaLengkap
      nip
      email
      noHp
      divisi
      isActive
      pekerjaanSekarang
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEKNISI_BY_DIVISI = gql`
  query GetTeknisiByDivisi($divisi: DivisiTeknisi!) {
    getTeknisiByDivisi(divisi: $divisi) {
      id
      namaLengkap
      nip
      email
      noHp
      divisi
      isActive
      pekerjaanSekarang
      createdAt
      updatedAt
    }
  }
`;

// ==================== MUTATIONS ====================

export const CREATE_TEKNISI = gql`
  mutation CreateTeknisi($input: CreateTeknisiInput!) {
    createTeknisi(input: $input) {
      id
      namaLengkap
      nip
      email
      noHp
      divisi
      isActive
      createdAt
    }
  }
`;

export const UPDATE_TEKNISI = gql`
  mutation UpdateTeknisi($id: ID!, $input: UpdateTeknisiInput!) {
    updateTeknisi(id: $id, input: $input) {
      id
      namaLengkap
      nip
      email
      noHp
      divisi
      isActive
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
