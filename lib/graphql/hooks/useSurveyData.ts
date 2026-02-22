// @ts-nocheck
'use client';

/**
 * Custom Hooks - Survey Data Operations with GraphQL
 */

import { useQuery } from '@apollo/client/react';
import {
  GET_ALL_SURVEY_DATA,
  GET_SURVEY_DATA_BY_ID,
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
