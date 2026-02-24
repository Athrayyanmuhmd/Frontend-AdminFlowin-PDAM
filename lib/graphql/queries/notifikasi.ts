import { gql } from '@apollo/client';

export const GET_ALL_NOTIFIKASI_ADMIN = gql`
  query GetAllNotifikasiAdmin {
    getAllNotifikasiAdmin {
      _id
      judul
      pesan
      kategori
      link
      isRead
      idPelanggan {
        _id
        namaLengkap
        email
      }
      idAdmin {
        _id
        namaLengkap
      }
      idTeknisi {
        _id
        namaLengkap
      }
      createdAt
    }
  }
`;

export const GET_ALL_PENGGUNA_FOR_NOTIF = gql`
  query GetAllPenggunaForNotif {
    getAllPengguna {
      _id
      namaLengkap
      email
      noHP
    }
  }
`;
