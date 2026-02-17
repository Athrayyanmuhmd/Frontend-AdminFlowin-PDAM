'use client';

/**
 * Custom Hooks - RAB Connection Operations with GraphQL
 */

import { useQuery } from '@apollo/client/react';
import {
  GET_ALL_RAB_CONNECTIONS,
  GET_RAB_CONNECTION_BY_ID,
  GET_PENDING_RAB,
} from '../queries/rabConnection';

// ==================== QUERIES ====================

export function useGetAllRABConnections() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_RAB_CONNECTIONS, {
    fetchPolicy: 'network-only',
  });

  return {
    rabConnections: data?.getAllRABConnections || [],
    loading,
    error,
    refetch,
  };
}

export function useGetRABConnection(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_RAB_CONNECTION_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  return {
    rabConnection: data?.getRABConnection,
    loading,
    error,
    refetch,
  };
}

export function useGetPendingRAB() {
  const { data, loading, error, refetch } = useQuery(GET_PENDING_RAB, {
    fetchPolicy: 'network-only',
  });

  return {
    pendingRAB: data?.getPendingRAB || [],
    loading,
    error,
    refetch,
  };
}
