// @ts-nocheck
'use client';

/**
 * Custom Hooks - RAB Connection Operations with GraphQL
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_RAB_CONNECTIONS,
  GET_RAB_CONNECTION_BY_ID,
  GET_PENDING_RAB,
  CREATE_RAB_CONNECTION,
  UPDATE_RAB_CONNECTION,
  DELETE_RAB_CONNECTION,
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

// ==================== MUTATIONS ====================

export function useCreateRABConnection() {
  const [mutate, { loading, error }] = useMutation(CREATE_RAB_CONNECTION, {
    refetchQueries: [{ query: GET_ALL_RAB_CONNECTIONS }],
  });

  return { createRABConnection: mutate, loading, error };
}

export function useUpdateRABConnection() {
  const [mutate, { loading, error }] = useMutation(UPDATE_RAB_CONNECTION);

  return { updateRABConnection: mutate, loading, error };
}

export function useDeleteRABConnection() {
  const [mutate, { loading, error }] = useMutation(DELETE_RAB_CONNECTION, {
    refetchQueries: [{ query: GET_ALL_RAB_CONNECTIONS }],
  });

  return { deleteRABConnection: mutate, loading, error };
}
