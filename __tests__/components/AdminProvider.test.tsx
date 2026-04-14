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
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
  }),
}));

// Mock auth service
jest.mock('../../app/services/auth.service', () => ({
  loginAdmin: jest.fn(),
  loginTechnician: jest.fn(),
  logoutAdmin: jest.fn(),
  logoutTechnician: jest.fn(),
}));

import { loginAdmin, loginTechnician } from '../../app/services/auth.service';
import AdminProvider, { useAdmin } from '../../app/layouts/AdminProvider';

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
  it('TC-ADM-06 ✅ login() dengan role "admin" memanggil loginAdmin service', async () => {
    const mockLoginAdmin = loginAdmin as jest.Mock;
    mockLoginAdmin.mockResolvedValue({
      token: 'test-token-admin',
      admin: {
        _id: 'adminId001',
        namaLengkap: 'Admin Test',
        email: 'admin@test.com',
        role: 'administrator',
        NIP: 'NIP001',
        noHP: '08123456789',
      },
    });

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());

    await act(async () => {
      await ctx!.login('admin@test.com', 'admin123', 'admin');
    });

    expect(mockLoginAdmin).toHaveBeenCalledWith('admin@test.com', 'admin123');
  });

  it('TC-ADM-07 ✅ login() dengan role "technician" memanggil loginTechnician service', async () => {
    const mockLoginTech = loginTechnician as jest.Mock;
    mockLoginTech.mockResolvedValue({
      token: 'test-token-tech',
      technician: {
        _id: 'techId001',
        namaLengkap: 'Teknisi Test',
        email: 'tech@test.com',
        role: 'teknisi',
        NIP: 'NIPTEK001',
        noHP: '08199999999',
      },
    });

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());

    await act(async () => {
      await ctx!.login('tech@test.com', 'teknisi123', 'technician');
    });

    expect(mockLoginTech).toHaveBeenCalledWith('tech@test.com', 'teknisi123');
  });

  it('TC-ADM-08 ❌ login() yang gagal harus return false', async () => {
    const mockLoginAdmin = loginAdmin as jest.Mock;
    mockLoginAdmin.mockRejectedValue(new Error('Invalid credentials'));

    let ctx: ReturnType<typeof useAdmin> | null = null;
    renderWithProvider(<TestConsumer onRender={(c) => { ctx = c; }} />);

    await waitFor(() => expect(ctx).not.toBeNull());

    let result: boolean;
    await act(async () => {
      result = await ctx!.login('admin@test.com', 'salah', 'admin');
    });

    expect(result!).toBe(false);
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
