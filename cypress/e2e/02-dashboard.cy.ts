/**
 * ============================================================
 * BLACKBOX TESTING — Dashboard
 * ============================================================
 */
describe('[BLACKBOX] Dashboard Admin', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  it('TC-BB-14 ✅ Dashboard harus dapat diakses setelah login', () => {
    cy.url().should('include', '/dashboard');
  });

  it('TC-BB-15 ✅ Dashboard harus menampilkan minimal 1 stats card', () => {
    cy.get('[class*="Card"], [class*="card"], .MuiCard-root, [class*="stat"]')
      .should('have.length.at.least', 1);
  });

  it('TC-BB-16 ✅ Dashboard harus menampilkan judul atau heading', () => {
    cy.get('h1, h2, h3, h4, h5, h6').should('have.length.at.least', 1);
  });

  it('TC-BB-17 ✅ Sidebar navigasi harus tampil di dashboard', () => {
    cy.get('nav, aside, [class*="sidebar"], [class*="Sidebar"]').should('exist');
  });

  it('TC-BB-18 ✅ Header/navbar harus tampil di dashboard', () => {
    cy.get('header, [class*="header"], [class*="Header"], [class*="AppBar"]').should('exist');
  });

  it('TC-BB-19 ✅ Dashboard tidak boleh menampilkan error screen', () => {
    cy.get('body').should('not.contain.text', 'Application error');
    cy.get('body').should('not.contain.text', '500');
  });

  it('TC-BB-20 ✅ Navigasi ke halaman Pelanggan dari sidebar harus berfungsi', () => {
    cy.get('a[href*="/customers"], nav').contains(/pelanggan|customer/i).click();
    cy.url().should('include', '/customers');
  });

  it('TC-BB-21 ✅ Navigasi ke halaman Tagihan dari sidebar harus berfungsi', () => {
    cy.get('a[href*="/billing"], nav').contains(/tagihan|billing/i).click();
    cy.url().should('include', '/billing');
  });
});
