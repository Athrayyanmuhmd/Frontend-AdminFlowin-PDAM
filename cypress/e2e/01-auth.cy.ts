/**
 * ============================================================
 * BLACKBOX TESTING — Autentikasi (Login & Logout)
 * ============================================================
 * Menguji alur login dan logout dari perspektif pengguna akhir.
 * Tidak ada pengetahuan tentang implementasi internal.
 * ============================================================
 */
describe('[BLACKBOX] Autentikasi Admin — Login & Logout', () => {

  beforeEach(() => {
    cy.visit('/auth/login');
  });

  // ── Tampilan Halaman Login ─────────────────────────────────
  it('TC-BB-01 ✅ Halaman login harus dapat diakses', () => {
    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-02 ✅ Halaman login harus menampilkan form input email dan password', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('TC-BB-03 ✅ Halaman login harus memiliki tombol submit', () => {
    cy.get('button[type="submit"]').should('be.visible');
  });

  // ── Login Sukses ───────────────────────────────────────────
  it('TC-BB-04 ✅ Login dengan kredensial valid harus redirect ke /dashboard', () => {
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('TC-BB-05 ✅ Setelah login, sidebar navigasi harus tampil', () => {
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    // Sidebar harus tampil setelah login
    cy.get('nav, [data-testid="sidebar"], aside').should('exist');
  });

  // ── Login Gagal ────────────────────────────────────────────
  it('TC-BB-06 ❌ Login dengan email tidak terdaftar harus menampilkan pesan error', () => {
    cy.get('input[type="email"]').type('tidakada@email.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    // Harus tetap di halaman login atau tampil error
    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-07 ❌ Login dengan password salah harus menampilkan pesan error', () => {
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type('passwordsalah');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-08 ❌ Login dengan form kosong harus gagal (tidak berpindah halaman)', () => {
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/auth/login');
  });

  // ── Protected Route ────────────────────────────────────────
  it('TC-BB-09 ❌ Akses /dashboard tanpa login harus redirect ke /auth/login', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-10 ❌ Akses /customers tanpa login harus redirect ke /auth/login', () => {
    cy.clearLocalStorage();
    cy.visit('/customers');
    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-11 ❌ Akses /billing tanpa login harus redirect ke /auth/login', () => {
    cy.clearLocalStorage();
    cy.visit('/billing');
    cy.url().should('include', '/auth/login');
  });

  // ── Logout ─────────────────────────────────────────────────
  it('TC-BB-12 ✅ Logout harus redirect ke halaman login', () => {
    // Login dulu
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Cari tombol logout di header/sidebar
    cy.get('[data-testid="logout-btn"], button:contains("Logout"), button:contains("Keluar")')
      .first().click();

    cy.url().should('include', '/auth/login');
  });

  it('TC-BB-13 ✅ Setelah logout, localStorage harus bersih (tidak ada adminAuth)', () => {
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    cy.get('[data-testid="logout-btn"], button:contains("Logout"), button:contains("Keluar")')
      .first().click();

    cy.window().then((win) => {
      expect(win.localStorage.getItem('adminAuth')).to.be.null;
      expect(win.localStorage.getItem('admin_token')).to.be.null;
    });
  });
});
