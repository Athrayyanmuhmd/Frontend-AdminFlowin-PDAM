'use client';

import { useMutation } from '@apollo/client/react';
import type { DocumentNode, OperationVariables } from '@apollo/client';
import type { MutationHookOptions } from '@apollo/client/react';
import { showToast } from '../utils/Toast';

/**
 * Wrapper around useMutation yang otomatis menampilkan toast
 * untuk success dan error.
 */
export function useMutationToast<
  TData = any,
  TVariables extends OperationVariables = OperationVariables
>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables> & {
    successMessage?: string;
    errorPrefix?: string;
  }
) {
  const { successMessage, errorPrefix = 'Operasi gagal', ...apolloOptions } = options ?? {};

  const [mutate, result] = useMutation<TData, TVariables>(mutation, {
    ...apolloOptions,
    onCompleted: (data) => {
      if (successMessage) showToast(successMessage, 200, 'top-center', 'light');
      apolloOptions.onCompleted?.(data);
    },
    onError: (error) => {
      const message = (error as any).graphQLErrors?.[0]?.message ?? error.message ?? 'Terjadi kesalahan';
      showToast(`${errorPrefix}: ${message}`, 400, 'top-center', 'light');
      apolloOptions.onError?.(error);
    },
  });

  return [mutate, result] as const;
}
