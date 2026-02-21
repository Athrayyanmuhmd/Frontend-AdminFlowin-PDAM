import { gql } from '@apollo/client';

export const GET_LAPORAN_KEUANGAN_BULANAN = gql`
  query GetLaporanKeuanganBulanan {
    getLaporanKeuanganBulanan {
      bulan
      totalTagihan
      totalLunas
      jumlahTagihan
      jumlahLunas
    }
  }
`;

export const GET_TUNGGAKAN_PER_KELOMPOK = gql`
  query GetTunggakanPerKelompok {
    getTunggakanPerKelompok {
      namaKelompok
      totalTunggakan
      jumlahTunggakan
    }
  }
`;

export const GET_TAGIHAN_TERTINGGI = gql`
  query GetTagihanTertinggi($limit: Int) {
    getTagihanTertinggi(limit: $limit) {
      nomorMeteran
      nomorAkun
      namaKelompok
      totalBiaya
      periode
      statusPembayaran
    }
  }
`;

export const GET_RINGKASAN_STATUS_TAGIHAN = gql`
  query GetRingkasanStatusTagihan {
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

export const GET_KPI_OPERASIONAL = gql`
  query GetKpiOperasional {
    getKpiOperasional {
      totalMeteranTerpasang
      totalPelanggan
      totalLaporanMasuk
      totalLaporanSelesai
      totalWorkOrderAktif
      totalWorkOrderSelesai
      totalTeknisi
      tingkatPenyelesaianLaporan
    }
  }
`;

export const GET_RINGKASAN_WORK_ORDER = gql`
  query GetRingkasanWorkOrder {
    getRingkasanWorkOrder {
      status
      jumlah
    }
  }
`;

export const GET_RINGKASAN_LAPORAN = gql`
  query GetRingkasanLaporan {
    getRingkasanLaporan {
      status
      jumlah
    }
  }
`;
