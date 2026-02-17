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
