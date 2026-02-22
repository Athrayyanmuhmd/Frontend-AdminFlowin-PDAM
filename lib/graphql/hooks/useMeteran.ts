'use client';

/**
 * Custom Hooks - Meteran (Smart Water Meter) Operations with GraphQL
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_METERAN,
  GET_METERAN_BY_ID,
  GET_METERAN_BY_PELANGGAN,
  GET_HISTORY_USAGE_BY_METERAN,
  GET_METERAN_STATS,
  CREATE_METERAN,
  UPDATE_METERAN,
  DELETE_METERAN,
} from '../queries/meteran';

// ==================== QUERIES ====================

export function useGetAllMeteran() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_METERAN, {
    fetchPolicy: 'network-only',
  });

  return {
    meteran: (data as any)?.getAllMeteran || [],
    loading,
    error,
    refetch,
  };
}

export function useGetMeteran(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_METERAN_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  return {
    meteran: (data as any)?.getMeteran,
    loading,
    error,
    refetch,
  };
}

export function useGetMeteranByPelanggan(idPelanggan: string) {
  const { data, loading, error } = useQuery(GET_METERAN_BY_PELANGGAN, {
    variables: { idPelanggan },
    skip: !idPelanggan,
    fetchPolicy: 'network-only',
  });

  return {
    meteran: (data as any)?.getMeteranByPelanggan || [],
    loading,
    error,
  };
}

export function useGetHistoryUsage(nomorMeteran: string) {
  const { data, loading, error, refetch } = useQuery(GET_HISTORY_USAGE_BY_METERAN, {
    variables: { nomorMeteran },
    skip: !nomorMeteran,
    fetchPolicy: 'network-only',
  });

  return {
    historyUsage: (data as any)?.getHistoryUsageByMeteran || [],
    loading,
    error,
    refetch,
  };
}

export function useGetMeteranStats() {
  const { data, loading, error } = useQuery(GET_METERAN_STATS, {
    fetchPolicy: 'cache-first',
  });

  return {
    stats: (data as any)?.getDashboardStats,
    loading,
    error,
  };
}

// ==================== MUTATIONS ====================

export function useCreateMeteran() {
  const [createMeteran, { loading, error }] = useMutation(CREATE_METERAN, {
    refetchQueries: [{ query: GET_ALL_METERAN }],
  });
  return { createMeteran, loading, error };
}

export function useUpdateMeteran() {
  const [updateMeteran, { loading, error }] = useMutation(UPDATE_METERAN, {
    refetchQueries: [{ query: GET_ALL_METERAN }],
  });
  return { updateMeteran, loading, error };
}

export function useDeleteMeteran() {
  const [deleteMeteran, { loading, error }] = useMutation(DELETE_METERAN, {
    refetchQueries: [{ query: GET_ALL_METERAN }],
  });
  return { deleteMeteran, loading, error };
}
