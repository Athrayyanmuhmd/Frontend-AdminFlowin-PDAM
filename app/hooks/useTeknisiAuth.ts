'use client';

import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { LOGIN_TECHNICIAN } from '@/lib/graphql/mutations/auth';

// Hook untuk login ke sistem teknisi (Rafli's backend) dari admin panel.
// Digunakan oleh TeknisiLoginDialog saat admin perlu akses fitur teknisi.
export function useTeknisiAuth() {
  const [loginQuery] = useLazyQuery(LOGIN_TECHNICIAN, { fetchPolicy: 'no-cache' });

  const login = useCallback(
    async (email: string, password: string): Promise<string> => {
      const { data, error } = await loginQuery({ variables: { email, password } });
      if (error) throw new Error(error.message);
      const token = (data as any)?.loginTechnician?.token;
      if (!token) throw new Error('Login gagal: token tidak diterima');
      localStorage.setItem('teknisi_token', token);
      return token;
    },
    [loginQuery],
  );

  return { login };
}
