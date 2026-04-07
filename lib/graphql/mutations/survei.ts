import { gql } from '@apollo/client';

export const APPROVE_SURVEI = gql`
  mutation ApproveSurvei($id: ID!) {
    approveSurvei(id: $id) {
      _id
      statusSurvei
      tanggalVerifikasiAdmin
      updatedAt
    }
  }
`;

export const REJECT_SURVEI = gql`
  mutation RejectSurvei($id: ID!, $alasanPenolakan: String!) {
    rejectSurvei(id: $id, alasanPenolakan: $alasanPenolakan) {
      _id
      statusSurvei
      alasanPenolakan
      tanggalVerifikasiAdmin
      updatedAt
    }
  }
`;

export const ASSIGN_TEKNISI_DED = gql`
  mutation AssignTeknisiDED($id: ID!, $technicianId: ID!) {
    assignTeknisiDED(id: $id, technicianId: $technicianId) {
      _id
      idTeknisiDED {
        _id
        namaLengkap
        email
        noHP
      }
      assignedDEDAt
      updatedAt
    }
  }
`;

export const AKTIVASI_PELANGGAN = gql`
  mutation AktvasiPelanggan($koneksiDataId: ID!) {
    aktivasiPelanggan(koneksiDataId: $koneksiDataId) {
      _id
      namaLengkap
      email
      isVerified
      accountStatus
      updatedAt
    }
  }
`;
