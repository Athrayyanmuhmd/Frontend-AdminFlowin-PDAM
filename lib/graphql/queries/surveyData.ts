import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Survey Data
 * Backend: BE_backend/graphql/resolvers/domains/survei.ts
 * Note: Backend uses "Survei" (Indonesian spelling)
 */

export const GET_ALL_SURVEY_DATA = gql`
  query GetAllSurvei {
    getAllSurvei {
      _id
      idKoneksiData {
        _id
        alamat
        idPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      urlJaringan
      diameterPipa
      jumlahPenghuni
      standar
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_SURVEY_DATA_BY_ID = gql`
  query GetSurvei($id: ID!) {
    getSurvei(id: $id) {
      _id
      idKoneksiData {
        _id
        NIK
        alamat
        kelurahan
        kecamatan
        idPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      koordinat {
        latitude
        longitude
      }
      urlJaringan
      diameterPipa
      urlPosisiBak
      posisiMeteran
      jumlahPenghuni
      standar
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_SURVEI_BY_KONEKSI_DATA = gql`
  query GetSurveiByKoneksiData($idKoneksiData: ID!) {
    getSurveiByKoneksiData(idKoneksiData: $idKoneksiData) {
      _id
      standar
      catatan
      createdAt
    }
  }
`;

export const GET_WO_BY_SURVEI = gql`
  query GetWOBySurvei($surveiId: ID!) {
    getWOBySurvei(surveiId: $surveiId) {
      _id
      status
      disetujui
      catatan
      tim {
        _id
        namaLengkap
        email
        noHP
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SURVEI = gql`
  mutation CreateSurvei(
    $idKoneksiData: ID!
    $urlJaringan: String!
    $diameterPipa: Float!
    $urlPosisiBak: String!
    $posisiMeteran: String!
    $jumlahPenghuni: String!
    $standar: Boolean!
    $catatan: String
    $koordinat: GeolocationInput
  ) {
    createSurvei(
      idKoneksiData: $idKoneksiData
      urlJaringan: $urlJaringan
      diameterPipa: $diameterPipa
      urlPosisiBak: $urlPosisiBak
      posisiMeteran: $posisiMeteran
      jumlahPenghuni: $jumlahPenghuni
      standar: $standar
      catatan: $catatan
      koordinat: $koordinat
    ) {
      _id
      idKoneksiData { _id }
      urlJaringan
      createdAt
    }
  }
`;

export const UPDATE_SURVEI = gql`
  mutation UpdateSurvei(
    $id: ID!
    $urlJaringan: String
    $diameterPipa: Float
    $urlPosisiBak: String
    $posisiMeteran: String
    $jumlahPenghuni: String
    $standar: Boolean
    $catatan: String
    $koordinat: GeolocationInput
  ) {
    updateSurvei(
      id: $id
      urlJaringan: $urlJaringan
      diameterPipa: $diameterPipa
      urlPosisiBak: $urlPosisiBak
      posisiMeteran: $posisiMeteran
      jumlahPenghuni: $jumlahPenghuni
      standar: $standar
      catatan: $catatan
      koordinat: $koordinat
    ) {
      _id
      urlJaringan
      updatedAt
    }
  }
`;

export const DELETE_SURVEI = gql`
  mutation DeleteSurvei($id: ID!) {
    deleteSurvei(id: $id)
  }
`;
