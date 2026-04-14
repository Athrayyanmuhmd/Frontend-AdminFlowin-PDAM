import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'admin123',
    },
  },
});
