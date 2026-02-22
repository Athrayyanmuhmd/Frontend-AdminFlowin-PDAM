// @ts-nocheck
'use client';

/**
 * Custom Hooks - Survey Data Operations with GraphQL
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_ALL_SURVEY_DATA,
  GET_SURVEY_DATA_BY_ID,
  CREATE_SURVEI,
  UPDATE_SURVEI,
  DELETE_SURVEI,
} from '../queries/surveyData';

// ==================== QUERIES ====================

export function useGetAllSurveyData() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_SURVEY_DATA, {
    fetchPolicy: 'network-only',
  });

  return {
    surveyData: data?.getAllSurvei || [],
    loading,
    error,
    refetch,
  };
}

export function useGetSurveyData(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_SURVEY_DATA_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  return {
    surveyData: data?.getSurvei,
    loading,
    error,
    refetch,
  };
}

// ==================== MUTATIONS ====================

export function useCreateSurveyData() {
  const [mutate, { loading, error }] = useMutation(CREATE_SURVEI, {
    refetchQueries: [{ query: GET_ALL_SURVEY_DATA }],
  });

  return { createSurveyData: mutate, loading, error };
}

export function useUpdateSurveyData() {
  const [mutate, { loading, error }] = useMutation(UPDATE_SURVEI);

  return { updateSurveyData: mutate, loading, error };
}

export function useDeleteSurveyData() {
  const [mutate, { loading, error }] = useMutation(DELETE_SURVEI, {
    refetchQueries: [{ query: GET_ALL_SURVEY_DATA }],
  });

  return { deleteSurveyData: mutate, loading, error };
}
