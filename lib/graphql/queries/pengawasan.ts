import { gql } from '@apollo/client';

export const GET_ALL_PENGAWASAN_PEMASANGAN = gql`
  query GetAllPengawasanPemasangan {
    getAllPengawasanPemasangan {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
            noHP
          }
        }
        teknisiId {
          _id
          namaLengkap
        }
      }
      urlGambar
      catatan
      supervisorId {
        _id
        namaLengkap
        divisi
      }
      tanggalPengawasan
      hasilPengawasan
      temuan
      rekomendasi
      perluTindakLanjut
      checklist {
        kualitasSambunganPipa
        posisiMeteran
        kebersihanPemasangan
        kepatuhanK3
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_PEMASANGAN = gql`
  query GetPengawasanPemasangan($id: ID!) {
    getPengawasanPemasangan(id: $id) {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      supervisorId {
        _id
        namaLengkap
        divisi
      }
      tanggalPengawasan
      hasilPengawasan
      temuan
      rekomendasi
      perluTindakLanjut
      checklist {
        kualitasSambunganPipa
        posisiMeteran
        kebersihanPemasangan
        kepatuhanK3
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_PEMASANGAN_PROBLEMATIC = gql`
  query GetPengawasanPemasanganProblematic {
    getPengawasanPemasanganProblematic {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
          }
        }
      }
      hasilPengawasan
      temuan
      rekomendasi
      perluTindakLanjut
      tanggalPengawasan
      supervisorId {
        _id
        namaLengkap
      }
    }
  }
`;

export const GET_ALL_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  query GetAllPengawasanSetelahPemasangan {
    getAllPengawasanSetelahPemasangan {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
            noHP
          }
        }
        teknisiId {
          _id
          namaLengkap
        }
      }
      urlGambar
      catatan
      supervisorId {
        _id
        namaLengkap
        divisi
      }
      tanggalPengawasan
      hariSetelahPemasangan
      hasilPengawasan
      statusMeteran
      bacaanAwal
      masalahDitemukan
      tindakan
      rekomendasi
      perluTindakLanjut
      checklist {
        meteranBacaCorrect
        tidakAdaKebocoran
        sambunganAman
        mudahDibaca
        pelangganPuas
        dokumentasiLengkap
      }
      feedbackPelanggan {
        rating
        komentar
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_SETELAH_PEMASANGAN = gql`
  query GetPengawasanSetelahPemasangan($id: ID!) {
    getPengawasanSetelahPemasangan(id: $id) {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
            noHP
          }
        }
      }
      urlGambar
      catatan
      supervisorId {
        _id
        namaLengkap
        divisi
      }
      tanggalPengawasan
      hariSetelahPemasangan
      hasilPengawasan
      statusMeteran
      bacaanAwal
      masalahDitemukan
      tindakan
      rekomendasi
      perluTindakLanjut
      checklist {
        meteranBacaCorrect
        tidakAdaKebocoran
        sambunganAman
        mudahDibaca
        pelangganPuas
        dokumentasiLengkap
      }
      feedbackPelanggan {
        rating
        komentar
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENGAWASAN_SETELAH_PROBLEMATIC = gql`
  query GetPengawasanSetelahPemasanganProblematic {
    getPengawasanSetelahPemasanganProblematic {
      _id
      idPemasangan {
        _id
        seriMeteran
        idKoneksiData {
          _id
          alamat
          idPelanggan {
            namaLengkap
          }
        }
      }
      hasilPengawasan
      statusMeteran
      masalahDitemukan
      perluTindakLanjut
      tanggalPengawasan
      supervisorId {
        _id
        namaLengkap
      }
    }
  }
`;

export const GET_AVERAGE_CUSTOMER_RATING = gql`
  query GetAverageCustomerRating {
    getAverageCustomerRating {
      averageRating
      totalResponden
    }
  }
`;
