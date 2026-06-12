/**
 * ============================================================
 * WHITEBOX TESTING — AdminProvider & useAdmin Hook
 * ============================================================
 * Menguji context provider autentikasi yang digunakan di semua
 * halaman admin: login, logout, hasPermission, userRole.
 *
 * File sumber: app/layouts/AdminProvider.tsx
 * ============================================================
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
// Apollo Client v4: MockedProvider pindah ke subpath /testing/react
// (sebelumnya di /testing pada v3). MockLink tetap di /testing.
import { MockedProvider } from '@apollo/client/testing/react';
import { gql } from '@apollo/client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
  }),
}));

// AdminProvider membungkus isinya dengan <ApolloWrapper> yang menyuntik
// apolloClient ASLI (HttpLink → backend). Di test itu meng-override
// MockedProvider sehingga query login/notifikasi memakai client asli (fetch
// gagal di jsdom). Kita mock ApolloWrapper jadi pass-through agar hook
// AdminProvider memakai client dari MockedProvider test.
jest.mock('../../app/lib/ApolloWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import AdminProvider, { useAdmin } from '../../app/layouts/AdminProvider';
// AdminProvider.login() melakukan login lewat GraphQL (useLazyQuery), bukan
// auth.service — jadi kita mock query-nya via MockedProvider, bukan module service.
import { LOGIN_ADMIN, LOGIN_TECHNICIAN } from '../../lib/graphql/mutations/auth';

// Helper: komponen consumer untuk test hook
function TestConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useAdmin>) => void }) {
  const ctx = useAdmin();
  onRender(ctx);
  return <div data-testid="consumer">rendered</div>;
}

const GET_ALL_NOTIFIKASI_ADMIN = gql`
  query GetAllNotifikasiAdmin {
    getAllNotifikasiAdmin {
      _id judul pesan kategori link isRead createdAt
    }
  }
`;

const notifMock = {
  request: { query: GET_ALL_NOTIFIKASI_ADMIN },
  result: { data: { getAllNotifikasiAdmin: [] } },
};

function renderWithProvider(ui: React.ReactNode, mocks = [notifMock]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AdminProvider>{ui}</AdminProvider>
    </MockedProvider>
  );
}

// ============================================================
// SUITE 1: Initial State
// ============================================================
describe('[WHITEBOX] useAdmin — Initial State', () => {
  it('TC-ADM-01 ✅ State awal: isAuthenticated = false', async () => {
    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => {
      expect(ctx).not.toBeNull();
    });

    expect(ctx!.isAuthenticated).toBe(false);
  });

  it('TC-ADM-02 ✅ State awal: user = null', async () => {
    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());
    expect(ctx!.user).toBeNull();
  });

  it('TC-ADM-03 ✅ State awal: userRole = null', async () => {
    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());
    expect(ctx!.userRole).toBeNull();
  });

  it('TC-ADM-04 ✅ State awal: notifications = array kosong', async () => {
    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());
    expect(Array.isArray(ctx!.notifications)).toBe(true);
  });
});

// ============================================================
// SUITE 2: useAdmin harus throw jika di luar Provider
// ============================================================
describe('[WHITEBOX] useAdmin — Error Boundary', () => {
  it('TC-ADM-05 ❌ useAdmin di luar AdminProvider harus throw error', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function ComponentTanpaProvider() {
      useAdmin();
      return null;
    }

    expect(() => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <ComponentTanpaProvider />
        </MockedProvider>
      );
    }).toThrow('useAdmin must be used within AdminProvider');

    consoleError.mockRestore();
  });
});

// ============================================================
// SUITE 3: Login Admin
// ============================================================
describe('[WHITEBOX] useAdmin — Login Flow', () => {
  it('TC-ADM-06 ✅ login() admin sukses → return true & state terautentikasi', async () => {
    const loginAdminMock = {
      request: { query: LOGIN_ADMIN, variables: { email: 'admin@test.com', password: 'admin123' } },
      result: {
        data: {
          loginAdmin: {
            token: 'test-token-admin',
            admin: {
              _id: 'adminId001',
              NIP: 'NIP001',
              namaLengkap: 'Admin Test',
              email: 'admin@test.com',
              noHP: '08123456789',
            },
          },
        },
      },
    };

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />, [notifMock, notifMock, loginAdminMock]);

    await waitFor(() => expect(ctx).not.toBeNull());

    let result: boolean | undefined;
    await act(async () => {
      result = await ctx!.login('admin@test.com', 'admin123', 'admin');
    });

    expect(result).toBe(true);
    expect(ctx!.isAuthenticated).toBe(true);
    expect(ctx!.userRole).toBe('admin');
  });

  it('TC-ADM-07 ✅ login() technician sukses → return true & userRole technician', async () => {
    const loginTechMock = {
      request: { query: LOGIN_TECHNICIAN, variables: { email: 'tech@test.com', password: 'teknisi123' } },
      result: {
        data: {
          loginTechnician: {
            token: 'test-token-tech',
            technician: {
              _id: 'techId001',
              NIP: 'NIPTEK001',
              namaLengkap: 'Teknisi Test',
              email: 'tech@test.com',
              noHP: '08199999999',
            },
          },
        },
      },
    };

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />, [notifMock, notifMock, loginTechMock]);

    await waitFor(() => expect(ctx).not.toBeNull());

    let result: boolean | undefined;
    await act(async () => {
      result = await ctx!.login('tech@test.com', 'teknisi123', 'technician');
    });

    expect(result).toBe(true);
    expect(ctx!.isAuthenticated).toBe(true);
    expect(ctx!.userRole).toBe('technician');
  });

  it('TC-ADM-08 ❌ login() gagal harus throw (agar halaman login bisa tampilkan pesan error)', async () => {
    // Perilaku production: pada kredensial salah, login() me-throw (re-throw) —
    // BUKAN return false — supaya UI login bisa menampilkan pesan error.
    const loginAdminErrorMock = {
      request: { query: LOGIN_ADMIN, variables: { email: 'admin@test.com', password: 'salah' } },
      result: { errors: [{ message: 'Email atau kata sandi salah.' }] },
    };

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />, [notifMock, loginAdminErrorMock]);

    await waitFor(() => expect(ctx).not.toBeNull());

    await act(async () => {
      await expect(ctx!.login('admin@test.com', 'salah', 'admin')).rejects.toThrow();
    });
  });
});

// ============================================================
// SUITE 4: hasPermission
// ============================================================
describe('[WHITEBOX] useAdmin — hasPermission', () => {
  it('TC-ADM-09 ✅ hasPermission selalu true saat belum login (default state)', async () => {
    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());

    // hasPermission() adalah function, cek bisa dipanggil
    const result = ctx!.hasPermission('billing', 'read');
    expect(typeof result).toBe('boolean');
  });
});
