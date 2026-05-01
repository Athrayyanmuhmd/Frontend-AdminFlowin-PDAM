import { gql } from '@apollo/client';

/**
 * GraphQL Queries untuk Billing/Tagihan
 * Disesuaikan dengan Ahmad's schema: PascalCase fields, PaymentStatus UPPERCASE
 */

export const GET_ALL_TAGIHAN = gql`
  query GetAllTagihan($limit: Int, $offset: Int) {
    getAllTagihan(limit: $limit, offset: $offset) {
      _id
      userId
      IdMeteran {
        _id
        NomorMeteran
        NomorAkun
        IdKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            email
            noHP
          }
        }
      }
      Periode
      PeriodeAkhir
      PenggunaanSebelum
      PenggunaanSekarang
      TotalPemakaian
      Biaya
      BiayaBeban
      TotalBiaya
      StatusPembayaran
      TanggalPembayaran
      MetodePembayaran
      TenggatWaktu
      Menunggak
      Denda
      Catatan
      jenisBilling
      bulanCakupan
      isMergedBilling
      createdAt
      updatedAt
    }
  }
`;

export const GET_TAGIHAN_BY_STATUS = gql`
  query GetTagihanByStatus($status: PaymentStatus!) {
    getTagihanByStatus(status: $status) {
      _id
      userId
      IdMeteran {
        _id
        NomorMeteran
        NomorAkun
        IdKoneksiData {
          _id
          IdPelanggan {
            _id
            namaLengkap
            email
            noHP
          }
        }
      }
      Periode
      TotalPemakaian
      TotalBiaya
      StatusPembayaran
      TanggalPembayaran
      MetodePembayaran
      TenggatWaktu
      Denda
      createdAt
      updatedAt
    }
  }
`;

export const GET_TAGIHAN_BY_METERAN = gql`
  query GetTagihanByMeteran($IdMeteran: ID!) {
    getTagihanByMeteran(IdMeteran: $IdMeteran) {
      _id
      Periode
      PenggunaanSebelum
      PenggunaanSekarang
      TotalPemakaian
      Biaya
      BiayaBeban
      TotalBiaya
      StatusPembayaran
      TanggalPembayaran
      MetodePembayaran
      TenggatWaktu
      Menunggak
      Denda
      Catatan
      createdAt
      updatedAt
    }
  }
`;

export const GET_TUNGGAKAN = gql`
  query GetTunggakan {
    getTunggakan {
      _id
      userId
      IdMeteran {
        _id
        NomorMeteran
        NomorAkun
        IdKoneksiData {
          _id
          Alamat
          IdPelanggan {
            _id
            namaLengkap
            noHP
          }
        }
      }
      Periode
      TotalBiaya
      TenggatWaktu
      Menunggak
      Denda
      createdAt
    }
  }
`;

export const GET_DAFTAR_PEMUTUSAN = gql`
  query GetDaftarPemutusan {
    getDaftarPemutusan {
      user {
        _id
        namaLengkap
        email
        noHP
      }
      tagihanTunggakan {
        _id
        Periode
        TotalBiaya
        StatusPembayaran
        Menunggak
      }
      jumlahBulanTunggak
      totalTunggakan
      denda
      sudahDiputus
    }
  }
`;

// Billing stats from dashboard resolver
export const GET_BILLING_STATS = gql`
  query GetBillingStats {
    getRingkasanStatusTagihan {
      totalTagihan
      totalLunas
      totalTunggakan
      totalPending
      nilaiTotal
      nilaiLunas
      nilaiTunggakan
    }
  }
`;

export const GET_BILLING_CHART = gql`
  query GetBillingChart {
    getLaporanKeuanganBulanan {
      bulan
      totalTagihan
      totalLunas
      jumlahTagihan
      jumlahLunas
    }
  }
`;

// ==================== MUTATIONS ====================

export const GENERATE_TAGIHAN = gql`
  mutation GenerateTagihan($IdMeteran: ID!, $Periode: String!) {
    generateTagihan(IdMeteran: $IdMeteran, Periode: $Periode) {
      _id
      IdMeteran {
        _id
        NomorMeteran
        NomorAkun
      }
      Periode
      TotalPemakaian
      TotalBiaya
      StatusPembayaran
      TenggatWaktu
      createdAt
    }
  }
`;

export const GENERATE_TAGIHAN_BULANAN = gql`
  mutation GenerateTagihanBulanan($Periode: String!, $IdMeteranList: [ID!]!) {
    generateTagihanBulanan(Periode: $Periode, IdMeteranList: $IdMeteranList) {
      berhasil
      gagal
      pesan
      detailGagal {
        IdMeteran
        NomorMeteran
        NomorAkun
        namaLengkap
        alasan
      }
    }
  }
`;

export const UPDATE_STATUS_PEMBAYARAN = gql`
  mutation UpdateStatusPembayaran($id: ID!, $status: PaymentStatus!) {
    updateStatusPembayaran(id: $id, status: $status) {
      _id
      StatusPembayaran
      TanggalPembayaran
      updatedAt
    }
  }
`;

// Backward-compat alias — halaman billing masih import GET_BILLINGS
export const GET_BILLINGS = GET_ALL_TAGIHAN;
