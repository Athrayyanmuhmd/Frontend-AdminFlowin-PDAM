import { gql } from '@apollo/client';

/**
 * GraphQL Mutations untuk Connection Data
 * Backend: BE_backend/graphql/resolvers/index.js
 */

export const VERIFY_CONNECTION_DATA = gql`
  mutation VerifyKoneksiData($id: ID!, $verified: Boolean!, $catatan: String) {
    verifyKoneksiData(id: $id, verified: $verified, catatan: $catatan) {
      _id
      statusVerifikasi
      catatan
      updatedAt
    }
  }
`;

export const UPDATE_CONNECTION_DATA = gql`
  mutation UpdateKoneksiData($id: ID!, $input: KoneksiDataInput!) {
    updateKoneksiData(id: $id, input: $input) {
      _id
      alamat
      latitude
      longitude
      statusVerifikasi
      catatan
      updatedAt
    }
  }
`;
