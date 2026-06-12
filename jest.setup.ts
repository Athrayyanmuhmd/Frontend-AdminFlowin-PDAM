import '@testing-library/jest-dom';

// jsdom tidak menyediakan `fetch`. Beberapa kode (mis. health-check ping di
// AdminProvider) memanggil fetch() langsung — tanpa polyfill ini akan melempar
// ReferenceError sinkron (lolos dari .catch) dan menggagalkan test.
if (typeof (globalThis as any).fetch === 'undefined') {
  (globalThis as any).fetch = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    });
}
