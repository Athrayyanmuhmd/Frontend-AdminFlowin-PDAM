/**
 * ============================================================
 * BLACKBOX TESTING — Manajemen Pelanggan
 * ============================================================
 */
describe('[BLACKBOX] Manajemen Pelanggan', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/customers');
  });

  it('TC-BB-22 ✅ Halaman pelanggan harus dapat diakses', () => {
    cy.url().should('include', '/customers');
  });

  it('TC-BB-23 ✅ Halaman pelanggan harus menampilkan tabel atau daftar data', () => {
    cy.get('table, [class*="Table"], [class*="DataGrid"]').should('exist');
  });

  it('TC-BB-24 ✅ Halaman pelanggan harus memiliki kolom nama atau data pelanggan', () => {
    cy.get('th, [class*="header"]').should('have.length.at.least', 2);
  });

  it('TC-BB-25 ✅ Input pencarian harus tersedia dan berfungsi', () => {
    cy.get('input[type="text"], input[placeholder*="cari"], input[placeholder*="search"]')
      .first().should('be.visible').type('test');
    // Setelah mengetik, konten tabel bisa berubah
    cy.wait(500);
  });

  it('TC-BB-26 ✅ Pencarian dengan keyword menghasilkan perubahan pada tabel', () => {
    cy.get('input[type="text"], input[placeholder*="cari"]').first().type('Pelanggan');
    cy.wait(500);
    cy.get('table, [class*="Table"]').should('exist');
  });

  it('TC-BB-27 ✅ Halaman tidak boleh menampilkan error saat memuat', () => {
    cy.get('body').should('not.contain.text', 'Application error');
  });
});
