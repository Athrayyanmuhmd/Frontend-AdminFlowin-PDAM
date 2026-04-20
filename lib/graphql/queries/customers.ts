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
      accountStatus
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
      accountStatus
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

// Pemutusan sambungan — min 3 bulan tunggak, buat billing denda, set accountStatus: inactive
export const DEACTIVATE_CUSTOMER = gql`
  mutation DeactivateCustomer($userId: ID!) {
    deactivateCustomer(userId: $userId) {
      _id
      namaLengkap
      accountStatus
    }
  }
`;

// Aktifkan kembali setelah bayar tunggakan di loket
export const KONFIRMASI_BAYAR_LOKET = gql`
  mutation KonfirmasiPembayaranLoket($userId: ID!) {
    konfirmasiPembayaranLoket(userId: $userId) {
      _id
      namaLengkap
      accountStatus
    }
  }
`;

// Aktivasi pelanggan baru — aktifkan akun + meter setelah semua tahap pemasangan selesai
export const AKTIVASI_PELANGGAN = gql`
  mutation AktivasiPelanggan($koneksiDataId: ID!, $catatan: String) {
    aktivasiPelanggan(koneksiDataId: $koneksiDataId, catatan: $catatan) {
      _id
      namaLengkap
      accountStatus
      isVerified
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
