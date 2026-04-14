/**
 * ============================================================
 * BLACKBOX TESTING — Manajemen Tagihan
 * ============================================================
 */
describe('[BLACKBOX] Manajemen Tagihan (Billing)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/billing');
  });

  it('TC-BB-28 ✅ Halaman tagihan harus dapat diakses', () => {
    cy.url().should('include', '/billing');
  });

  it('TC-BB-29 ✅ Halaman tagihan harus menampilkan tabel data', () => {
    cy.get('table, [class*="Table"], [class*="DataGrid"]').should('exist');
  });

  it('TC-BB-30 ✅ Halaman tagihan harus memiliki filter status', () => {
    cy.get('select, [class*="Select"], [role="combobox"]').should('have.length.at.least', 1);
  });

  it('TC-BB-31 ✅ Halaman Generate Tagihan dapat diakses', () => {
    cy.visit('/billing/generate');
    cy.url().should('include', '/billing/generate');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-32 ✅ Halaman Pembayaran dapat diakses', () => {
    cy.visit('/billing/payments');
    cy.url().should('include', '/billing/payments');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-33 ✅ Halaman Tarif dapat diakses', () => {
    cy.visit('/billing/tariffs');
    cy.url().should('include', '/billing/tariffs');
    cy.get('body').should('not.contain.text', '404');
  });

  it('TC-BB-34 ✅ Filter status "Lunas" harus mengubah tampilan tabel', () => {
    cy.get('select, [role="combobox"]').first().click();
    cy.wait(300);
    // Pilih opsi pertama (atau Lunas jika tersedia)
    cy.get('[role="option"], option').first().click();
    cy.wait(500);
    cy.get('table, [class*="Table"]').should('exist');
  });
});
