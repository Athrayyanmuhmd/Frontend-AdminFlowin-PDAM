/**
 * ============================================================
 * BLACKBOX TESTING — Work Order & Operasi
 * ============================================================
 */
describe('[BLACKBOX] Work Order & Operasi Lapangan', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // ── Work Orders ────────────────────────────────────────────
  it('TC-BB-35 ✅ Halaman Work Orders harus dapat diakses', () => {
    cy.visit('/operations/work-orders');
    cy.url().should('include', '/operations/work-orders');
  });

  it('TC-BB-36 ✅ Work Orders harus menampilkan tabel atau daftar', () => {
    cy.visit('/operations/work-orders');
    cy.get('table, [class*="Table"], [class*="DataGrid"], [class*="List"]').should('exist');
  });

  // ── Teknisi ────────────────────────────────────────────────
  it('TC-BB-37 ✅ Halaman Teknisi harus dapat diakses', () => {
    cy.visit('/operations/technicians');
    cy.url().should('include', '/operations/technicians');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-38 ✅ Halaman Teknisi harus menampilkan data teknisi', () => {
    cy.visit('/operations/technicians');
    cy.get('table, [class*="Table"], [class*="Card"]').should('exist');
  });

  // ── Connection Data ────────────────────────────────────────
  it('TC-BB-39 ✅ Halaman Koneksi Data harus dapat diakses', () => {
    cy.visit('/operations/connection-data');
    cy.url().should('include', '/operations/connection-data');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Survey Data ────────────────────────────────────────────
  it('TC-BB-40 ✅ Halaman Survey Data harus dapat diakses', () => {
    cy.visit('/operations/survey-data');
    cy.url().should('include', '/operations/survey-data');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── RAB Connection ─────────────────────────────────────────
  it('TC-BB-41 ✅ Halaman RAB Connection harus dapat diakses', () => {
    cy.visit('/operations/rab-connection');
    cy.url().should('include', '/operations/rab-connection');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Meteran ────────────────────────────────────────────────
  it('TC-BB-42 ✅ Halaman Meteran harus dapat diakses', () => {
    cy.visit('/operations/meteran');
    cy.url().should('include', '/operations/meteran');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Laporan ────────────────────────────────────────────────
  it('TC-BB-43 ✅ Halaman Laporan Operasional harus dapat diakses', () => {
    cy.visit('/reports/operational');
    cy.url().should('include', '/reports/operational');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-44 ✅ Halaman Laporan Keuangan harus dapat diakses', () => {
    cy.visit('/reports/financial');
    cy.url().should('include', '/reports/financial');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Notifikasi ─────────────────────────────────────────────
  it('TC-BB-45 ✅ Halaman Notifikasi harus dapat diakses', () => {
    cy.visit('/notifications');
    cy.url().should('include', '/notifications');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-46 ✅ Halaman Notifikasi harus menampilkan stats card', () => {
    cy.visit('/notifications');
    cy.get('[class*="Card"], .MuiCard-root').should('have.length.at.least', 1);
  });

  // ── Monitoring ─────────────────────────────────────────────
  it('TC-BB-47 ✅ Halaman Smart Meter Monitoring harus dapat diakses', () => {
    cy.visit('/monitoring/smart-meter');
    cy.url().should('include', '/monitoring/smart-meter');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Kelompok Pelanggan ─────────────────────────────────────
  it('TC-BB-48 ✅ Halaman Master Data Kelompok Pelanggan harus dapat diakses', () => {
    cy.visit('/master-data/kelompok-pelanggan');
    cy.url().should('include', '/master-data/kelompok-pelanggan');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── Mobile Teknisi ─────────────────────────────────────────
  it('TC-BB-49 ✅ Halaman Mobile Teknisi harus dapat diakses', () => {
    cy.visit('/mobile/technician');
    cy.url().should('include', '/mobile/technician');
    cy.get('body').should('not.contain.text', '404');
  });

  // ── System ────────────────────────────────────────────────
  it('TC-BB-50 ✅ Halaman System/Users harus dapat diakses', () => {
    cy.visit('/system/users');
    cy.url().should('include', '/system/users');
    cy.get('body').should('not.contain.text', '404');
  });
});
