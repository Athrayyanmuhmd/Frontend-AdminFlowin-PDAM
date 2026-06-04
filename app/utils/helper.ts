export const formatToIDR = (amount: number): any =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

/**
 * Format konsumsi air ke m³ dengan jumlah desimal tetap (default 2),
 * supaya konsisten di seluruh aplikasi — menghindari tampilan seperti
 * "0.031223099999999962 m³". Memakai titik sebagai pemisah desimal.
 */
export const formatM3 = (val: number, decimals = 2): string =>
  `${(Number(val) || 0).toFixed(decimals)} m³`;

/** Rupiah tanpa simbol mata uang, dibulatkan ke rupiah penuh (mis. "10.187"). */
export const formatRupiahValue = (amount: number): string =>
  (Math.round(Number(amount) || 0)).toLocaleString("id-ID");
