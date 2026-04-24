import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Connection Data (Data Sambungan / KoneksiData)
 * Disesuaikan dengan Ahmad's schema: PascalCase fields, StatusPengajuan enum
 */

const KONEKSI_DATA_FIELDS = gql`
  fragment KoneksiDataFields on KoneksiData {
    _id
    IdPelanggan {
      _id
      namaLengkap
      email
      noHP
      accountStatus
    }
    NIK
    NIKUrl
    NoKK
    KKUrl
    IMB
    IMBUrl
    Alamat
    Kelurahan
    Kecamatan
    LuasBangunan
    StatusPengajuan
    AlasanPenolakan
    TanggalVerifikasi
    catatan
    createdAt
    updatedAt
  }
`;

export const GET_ALL_CONNECTION_DATA = gql`
  ${KONEKSI_DATA_FIELDS}
  query GetAllKoneksiData {
    getAllKoneksiData {
      ...KoneksiDataFields
    }
  }
`;

export const GET_KONEKSI_DATA_BY_PELANGGAN = gql`
  ${KONEKSI_DATA_FIELDS}
  query GetKoneksiDataByPelanggan($idPelanggan: ID!) {
    getKoneksiDataByPelanggan(idPelanggan: $idPelanggan) {
      ...KoneksiDataFields
    }
  }
`;

export const GET_CONNECTION_DATA_BY_ID = gql`
  ${KONEKSI_DATA_FIELDS}
  query GetKoneksiData($id: ID!) {
    getKoneksiData(id: $id) {
      ...KoneksiDataFields
    }
  }
`;

export const GET_PENDING_CONNECTION_DATA = gql`
  query GetPendingKoneksiData {
    getPendingKoneksiData {
      _id
      IdPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      Alamat
      StatusPengajuan
      createdAt
      updatedAt
    }
  }
`;

export const GET_APPROVED_CONNECTION_DATA = gql`
  query GetApprovedKoneksiData {
    getApprovedKoneksiData {
      _id
      IdPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      Alamat
      StatusPengajuan
      TanggalVerifikasi
      createdAt
      updatedAt
    }
  }
`;

export const GET_REJECTED_CONNECTION_DATA = gql`
  query GetRejectedKoneksiData {
    getRejectedKoneksiData {
      _id
      IdPelanggan {
        _id
        namaLengkap
        email
        noHP
      }
      Alamat
      StatusPengajuan
      AlasanPenolakan
      createdAt
      updatedAt
    }
  }
`;

export const GET_DETAIL_SAMBUNGAN = gql`
  query GetDetailSambungan($id: ID!) {
    getDetailSambungan(id: $id) {
      koneksiData {
        _id
        IdPelanggan {
          _id
          namaLengkap
          email
          noHP
          accountStatus
        }
        NIK
        NIKUrl
        NoKK
        KKUrl
        IMB
        IMBUrl
        Alamat
        Kelurahan
        Kecamatan
        LuasBangunan
        StatusPengajuan
        AlasanPenolakan
        TanggalVerifikasi
        catatan
        createdAt
        updatedAt
      }
      survei {
        _id
        standar
        catatan
        statusAdmin
        catatanAdmin
        urlJaringan
        urlPosisiBak
        posisiMeteran
        jumlahPenghuni
        createdAt
      }
      rab {
        _id
        totalBiaya
        statusPembayaran
        statusKonfirmasiPembayaran
        paymentUrl
        catatan
        urlRab
        createdAt
      }
      meteran {
        _id
        NomorMeteran
        NomorAkun
        statusAktif
      }
      pemasangan {
        _id
        seriMeteran
        fotoRumah
        fotoMeteran
        fotoMeteranDanRumah
        statusAdmin
        catatanAdmin
        catatan
        createdAt
      }
      pengawasan {
        _id
        urlGambar
        catatan
        statusAdmin
        catatanAdmin
        createdAt
      }
      pengawasanSetelah {
        _id
        urlGambar
        catatan
        statusAdmin
        catatanAdmin
        createdAt
      }
      workOrders {
        id
        idKoneksiData
        jenisPekerjaan
        status
        statusRespon
        statusTim
        createdAt
        updatedAt
        teknisiPenanggungJawab {
          id
          namaLengkap
        }
      }
    }
  }
`;

// Stub mutations — assign teknisi sekarang via Rafli WorkOrder
// Diekspor dari sini (bukan dari mutations/) karena AssignTechnicianDialog masih import dari sini
export const ASSIGN_TEKNISI_TO_KONEKSI = gql`
  mutation AssignTeknisiToKoneksi($input: BuatWorkOrderInput!) {
    buatWorkOrder(input: $input) {
      success
      message
      workOrder {
        id
        jenisPekerjaan
        status
      }
    }
  }
`;

export const UNASSIGN_TEKNISI_FROM_KONEKSI = gql`
  mutation UnassignTeknisiFromKoneksi($id: ID!, $catatan: String) {
    batalkanWorkOrder(id: $id, catatan: $catatan) {
      success
      message
    }
  }
`;
