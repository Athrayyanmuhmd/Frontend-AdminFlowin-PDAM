/**
 * Custom Cypress Commands untuk Aqualink Admin Panel
 */

// Login sebagai admin — digunakan di semua spec
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('/auth/login');
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Tunggu loading selesai
Cypress.Commands.add('waitForLoad', () => {
  cy.get('[data-testid="loading"]', { timeout: 500 }).should('not.exist');
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      waitForLoad(): Chainable<void>;
    }
  }
}
