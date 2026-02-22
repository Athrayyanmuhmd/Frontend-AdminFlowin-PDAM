import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Survey Data
 * Backend: BE_backend/graphql/resolvers/index.js
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
      idTeknisi {
        _id
        namaLengkap
        email
        noHP
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
        idPelanggan {
          _id
          namaLengkap
          email
          noHP
        }
      }
      idTeknisi {
        _id
        namaLengkap
        email
        noHP
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

export const CREATE_SURVEI = gql`
  mutation CreateSurvei(
    $idKoneksiData: ID!
    $idTeknisi: ID!
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
      idTeknisi: $idTeknisi
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
      idTeknisi { _id namaLengkap }
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
