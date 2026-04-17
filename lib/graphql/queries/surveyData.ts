import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Survey Data
 * Backend: BE_backend/graphql/resolvers/domains/survei.ts
 * Note: Backend uses "Survei" (Indonesian spelling)
 * KoneksiData fields are PascalCase: Alamat, IdPelanggan, Kelurahan, Kecamatan
 */

export const GET_ALL_SURVEY_DATA = gql`
  query GetAllSurvei {
    getAllSurvei {
      _id
      idKoneksiData {
        _id
        Alamat
        Kelurahan
        Kecamatan
        IdPelanggan {
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
      urlPosisiBak
      posisiMeteran
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
        Alamat
        Kelurahan
        Kecamatan
        IdPelanggan {
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
      statusAdmin
      catatanAdmin
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

export const CREATE_SURVEI = gql`
  mutation CreateSurvei(
    $idKoneksiData: ID!
    $urlJaringan: String
    $diameterPipa: Float
    $urlPosisiBak: String
    $posisiMeteran: String
    $jumlahPenghuni: Int
    $standar: Boolean
    $catatan: String
    $koordinat: KoordinatInput
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
    $jumlahPenghuni: Int
    $standar: Boolean
    $catatan: String
    $koordinat: KoordinatInput
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
    deleteSurvei(id: $id) {
      success
      message
    }
  }
`;
