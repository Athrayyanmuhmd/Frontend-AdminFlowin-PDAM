// @ts-nocheck
'use client';

/**
 * Custom Hooks - Customer Operations with GraphQL
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_CUSTOMERS,
  GET_CUSTOMER,
  SEARCH_CUSTOMERS,
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
  DELETE_CUSTOMER,
} from '../queries/customers';

// ==================== QUERIES ====================

export function useGetAllCustomers() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_CUSTOMERS, {
    fetchPolicy: 'network-only', // Always fetch fresh data
  });

  return {
    customers: data?.getAllPengguna || [],
    loading,
    error,
    refetch,
  };
}

export function useGetCustomer(id: string) {
  const { data, loading, error } = useQuery(GET_CUSTOMER, {
    variables: { id },
    skip: !id, // Skip query if no ID provided
  });

  return {
    customer: data?.getPengguna,
    loading,
    error,
  };
}

export function useSearchCustomers(search: string) {
  const { data, loading, error } = useQuery(SEARCH_CUSTOMERS, {
    variables: { search },
    skip: !search || search.length < 2, // Only search if query has 2+ chars
  });

  return {
    customers: data?.searchPengguna || [],
    loading,
    error,
  };
}

// ==================== MUTATIONS ====================

export function useCreateCustomer() {
  const [createCustomer, { data, loading, error }] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_ALL_CUSTOMERS }], // Refresh list after create
  });

  return {
    createCustomer,
    data: data?.createPelanggan,
    loading,
    error,
  };
}

export function useUpdateCustomer() {
  const [updateCustomer, { data, loading, error }] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: [{ query: GET_ALL_CUSTOMERS }], // Refresh list after update
  });

  return {
    updateCustomer,
    data: data?.updatePelanggan,
    loading,
    error,
  };
}

export function useDeleteCustomer() {
  const [deleteCustomer, { data, loading, error }] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_ALL_CUSTOMERS }], // Refresh list after delete
  });

  return {
    deleteCustomer,
    data: data?.deletePelanggan,
    loading,
    error,
  };
}
