// @ts-nocheck
'use client';

/**
 * Custom Hooks - Kelompok Pelanggan Operations with GraphQL
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_KELOMPOK_PELANGGAN,
  GET_KELOMPOK_PELANGGAN_BY_ID,
  CREATE_KELOMPOK_PELANGGAN,
  UPDATE_KELOMPOK_PELANGGAN,
  DELETE_KELOMPOK_PELANGGAN,
} from '../queries/kelompokPelanggan';

// ==================== QUERIES ====================

export function useGetAllKelompokPelanggan() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_KELOMPOK_PELANGGAN, {
    fetchPolicy: 'network-only',
  });

  return {
    kelompokPelanggan: data?.getAllKelompokPelanggan || [],
    loading,
    error,
    refetch,
  };
}

export function useGetKelompokPelanggan(id: string) {
  const { data, loading, error } = useQuery(GET_KELOMPOK_PELANGGAN_BY_ID, {
    variables: { id },
    skip: !id,
  });

  return {
    kelompokPelanggan: data?.getKelompokPelanggan,
    loading,
    error,
  };
}

// ==================== MUTATIONS ====================

export function useCreateKelompokPelanggan() {
  const [createKelompokPelanggan, { data, loading, error }] = useMutation(
    CREATE_KELOMPOK_PELANGGAN,
    {
      refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    }
  );

  return {
    createKelompokPelanggan,
    data: data?.createKelompokPelanggan,
    loading,
    error,
  };
}

export function useUpdateKelompokPelanggan() {
  const [updateKelompokPelanggan, { data, loading, error }] = useMutation(
    UPDATE_KELOMPOK_PELANGGAN,
    {
      refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    }
  );

  return {
    updateKelompokPelanggan,
    data: data?.updateKelompokPelanggan,
    loading,
    error,
  };
}

export function useDeleteKelompokPelanggan() {
  const [deleteKelompokPelanggan, { data, loading, error }] = useMutation(
    DELETE_KELOMPOK_PELANGGAN,
    {
      refetchQueries: [{ query: GET_ALL_KELOMPOK_PELANGGAN }],
    }
  );

  return {
    deleteKelompokPelanggan,
    data: data?.deleteKelompokPelanggan,
    loading,
    error,
  };
}
