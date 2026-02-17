'use client';

/**
 * Custom Hooks - Connection Data Operations with GraphQL
 */

import { useQuery } from '@apollo/client/react';
import {
  GET_ALL_CONNECTION_DATA,
  GET_CONNECTION_DATA_BY_ID,
} from '../queries/connectionData';

// ==================== QUERIES ====================

export function useGetAllConnectionData() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_CONNECTION_DATA, {
    fetchPolicy: 'network-only',
  });

  return {
    connectionData: data?.getAllKoneksiData || [],
    loading,
    error,
    refetch,
  };
}

export function useGetConnectionData(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_CONNECTION_DATA_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  return {
    connectionData: data?.getKoneksiData,
    loading,
    error,
    refetch,
  };
}
