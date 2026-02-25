import { gql } from '@apollo/client';

export const CREATE_NOTIFIKASI = gql`
  mutation CreateNotifikasi($input: CreateNotifikasiInput!) {
    createNotifikasi(input: $input) {
      _id
      judul
      pesan
      kategori
      idPelanggan {
        _id
        namaLengkap
      }
      idAdmin {
        _id
        namaLengkap
      }
      idTeknisi {
        _id
        namaLengkap
      }
      link
      isRead
      createdAt
    }
  }
`;

export const BROADCAST_NOTIFIKASI = gql`
  mutation BroadcastNotifikasi($input: CreateNotifikasiInput!) {
    broadcastNotifikasi(input: $input) {
      _id
      judul
      pesan
      kategori
      isRead
      createdAt
    }
  }
`;

export const MARK_NOTIFIKASI_AS_READ = gql`
  mutation MarkNotifikasiAsRead($id: ID!) {
    markNotifikasiAsRead(id: $id) {
      _id
      isRead
    }
  }
`;
