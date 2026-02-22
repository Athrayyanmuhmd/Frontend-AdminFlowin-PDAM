import { gql } from '@apollo/client';

export const GET_WORK_ORDERS = gql`
  query GetAllWorkOrders {
    getAllWorkOrders {
      _id
      idSurvei {
        _id
        idKoneksiData {
          _id
          idPelanggan {
            namaLengkap
          }
        }
      }
      rabId {
        _id
        totalBiaya
      }
      idPenyelesaianLaporan {
        _id
        tanggalSelesai
      }
      idPemasangan {
        _id
        seriMeteran
      }
      tim {
        _id
        namaLengkap
        email
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_WORK_ORDER_BY_ID = gql`
  query GetWorkOrder($id: ID!) {
    getWorkOrder(id: $id) {
      _id
      idSurvei {
        _id
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
            noHP
          }
        }
      }
      rabId {
        _id
        totalBiaya
        statusPembayaran
      }
      idPenyelesaianLaporan {
        _id
        urlGambar
        catatan
        tanggalSelesai
        metadata {
          durasiPengerjaan
          materialDigunakan
          biaya
        }
      }
      idPemasangan {
        _id
        seriMeteran
        fotoRumah
        fotoMeteran
      }
      idPengawasanPemasangan {
        _id
        terpasang
        standar
      }
      idPengawasanSetelahPemasangan {
        _id
        terpasang
        standar
      }
      tim {
        _id
        namaLengkap
        email
        noHP
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_WORK_ORDERS_BY_STATUS = gql`
  query GetWorkOrdersByStatus($status: EnumWorkStatus!) {
    getWorkOrdersByStatus(status: $status) {
      _id
      idSurvei {
        _id
        idKoneksiData {
          idPelanggan {
            namaLengkap
          }
        }
      }
      tim {
        _id
        namaLengkap
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_WORK_ORDERS_BY_TEKNISI = gql`
  query GetWorkOrdersByTeknisi($idTeknisi: ID!) {
    getWorkOrdersByTeknisi(idTeknisi: $idTeknisi) {
      _id
      idSurvei {
        _id
        idKoneksiData {
          idPelanggan {
            namaLengkap
          }
        }
      }
      rabId {
        _id
        totalBiaya
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_WORK_ORDER_STATS = gql`
  query GetWorkOrderStats {
    getDashboardStats {
      activeWorkOrders
    }
  }
`;

// Alias queries using PekerjaanTeknisi naming
export const GET_PEKERJAAN_TEKNISI = gql`
  query GetPekerjaanTeknisi($id: ID!) {
    getPekerjaanTeknisi(id: $id) {
      _id
      idSurvei {
        _id
        idKoneksiData {
          idPelanggan {
            namaLengkap
          }
        }
      }
      rabId {
        _id
        totalBiaya
      }
      idPenyelesaianLaporan {
        _id
        tanggalSelesai
      }
      tim {
        _id
        namaLengkap
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_PEKERJAAN_TEKNISI = gql`
  query GetAllPekerjaanTeknisi {
    getAllPekerjaanTeknisi {
      _id
      idSurvei {
        _id
        idKoneksiData {
          idPelanggan {
            namaLengkap
          }
        }
      }
      tim {
        _id
        namaLengkap
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_PEKERJAAN_TEKNISI_PENDING = gql`
  query GetPekerjaanTeknisiPendingApproval {
    getPekerjaanTeknisiPendingApproval {
      _id
      idSurvei {
        _id
        idKoneksiData {
          idPelanggan {
            namaLengkap
          }
        }
      }
      tim {
        _id
        namaLengkap
      }
      status
      disetujui
      catatan
      createdAt
      updatedAt
    }
  }
`;
