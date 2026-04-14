/**
 * ============================================================
 * WHITEBOX TESTING — Utility Functions (helper.ts)
 * ============================================================
 * Menguji fungsi formatToIDR yang digunakan di seluruh aplikasi
 * untuk menampilkan nilai mata uang IDR.
 *
 * File sumber: app/utils/helper.ts
 * ============================================================
 */
import { formatToIDR } from '../../app/utils/helper';

describe('[WHITEBOX] formatToIDR — Format Mata Uang Rupiah', () => {

  // ── Nilai Normal ──────────────────────────────────────────
  it('TC-FE-01 ✅ Nilai 0 harus diformat menjadi "Rp 0"', () => {
    const result = formatToIDR(0);
    expect(result).toContain('0');
    expect(result).toMatch(/Rp|IDR/);
  });

  it('TC-FE-02 ✅ Nilai 50.000 harus mengandung "50.000"', () => {
    const result = formatToIDR(50000);
    expect(result).toContain('50.000');
  });

  it('TC-FE-03 ✅ Nilai 1.500.000 harus mengandung "1.500.000"', () => {
    const result = formatToIDR(1500000);
    expect(result).toContain('1.500.000');
  });

  it('TC-FE-04 ✅ Nilai 100.000 harus mengandung "100.000"', () => {
    const result = formatToIDR(100000);
    expect(result).toContain('100.000');
  });

  it('TC-FE-05 ✅ Nilai 25.000.000 harus mengandung "25.000.000"', () => {
    const result = formatToIDR(25000000);
    expect(result).toContain('25.000.000');
  });

  // ── Format IDR ────────────────────────────────────────────
  it('TC-FE-06 ✅ Output harus mengandung simbol Rp atau IDR', () => {
    const result = formatToIDR(10000);
    expect(result).toMatch(/Rp|IDR/);
  });

  it('TC-FE-07 ✅ Output tidak boleh mengandung desimal (koma + angka)', () => {
    const result = formatToIDR(50000);
    // Tidak boleh ada ",00" atau ".00" di akhir
    expect(result).not.toMatch(/[,\.]\d{2}$/);
  });

  it('TC-FE-08 ✅ Output harus bertipe string', () => {
    const result = formatToIDR(10000);
    expect(typeof result).toBe('string');
  });

  // ── Nilai Tagihan PDAM Umum ───────────────────────────────
  it('TC-FE-09 ✅ Tarif dasar air (Rp 15.750) harus diformat dengan benar', () => {
    const result = formatToIDR(15750);
    expect(result).toContain('15.750');
  });

  it('TC-FE-10 ✅ Total tagihan bulanan tipikal (Rp 87.500) harus diformat dengan benar', () => {
    const result = formatToIDR(87500);
    expect(result).toContain('87.500');
  });

  it('TC-FE-11 ✅ Biaya RAB pemasangan (Rp 5.000.000) harus diformat dengan benar', () => {
    const result = formatToIDR(5000000);
    expect(result).toContain('5.000.000');
  });

  // ── Edge Cases ────────────────────────────────────────────
  it('TC-FE-12 ✅ Nilai negatif harus tetap menghasilkan string', () => {
    const result = formatToIDR(-50000);
    expect(typeof result).toBe('string');
    expect(result).toBeTruthy();
  });

  it('TC-FE-13 ✅ Nilai pecahan harus dibulatkan (tidak ada desimal)', () => {
    const result = formatToIDR(1500.75);
    // minimumFractionDigits: 0 → tidak ada desimal
    expect(result).not.toContain(',75');
  });
});
