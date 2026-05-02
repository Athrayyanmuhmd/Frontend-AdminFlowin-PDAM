import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';

// Create HTTP link for GraphQL endpoint
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5000/graphql',
  credentials: 'include',
  // 30 second timeout via AbortController
  fetch: (uri, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    return fetch(uri as RequestInfo, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  },
});

// Auth link to add token + Vercel bypass header
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const bypassSecret = process.env.NEXT_PUBLIC_VERCEL_BYPASS_SECRET;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      ...(bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {}),
    },
  };
});

// Global error handler — log network errors, let components handle GraphQL errors
const errorLink = onError((err: any) => {
  const { graphQLErrors, networkError, operation } = err;
  if (networkError) {
    console.error('[Network Error]', operation?.operationName, networkError);
  }
  if (graphQLErrors) {
    graphQLErrors.forEach((e: any) => {
      console.error('[GraphQL Error]', operation?.operationName, e?.message);
    });
  }
});

// Retry link — retry network errors with exponential backoff (max 3x)
// Prevents burst of simultaneous retries during cold start that triggers DDoS mitigation
const retryLink = new RetryLink({
  delay: {
    initial: 1000,  // 1 detik sebelum retry pertama
    max: 10000,     // maks 10 detik antar retry
    jitter: true,   // acak sedikit agar request tidak barengan
  },
  attempts: {
    max: 3,
    retryIf: (error) => {
      // Hanya retry untuk network error (5xx, timeout), bukan 4xx
      if (!error) return false;
      const err = error as any;
      const status = err?.statusCode ?? err?.response?.status;
      if (status && status < 500) return false; // 4xx = jangan retry
      return true;
    },
  },
});

// Create Apollo Client instance
const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Semua type pakai _id dari MongoDB sebagai cache key
      Meteran: { keyFields: ['_id'] },
      Tagihan: { keyFields: ['_id'] },
      Pelanggan: { keyFields: ['_id'] },
      KelompokPelanggan: { keyFields: ['_id'] },
      KoneksiData: { keyFields: ['_id'] },
      SurveyData: { keyFields: ['_id'] },
      RabConnection: { keyFields: ['_id'] },
      WorkOrder: { keyFields: ['_id'] },
      Notifikasi: { keyFields: ['_id'] },
      AdminAccount: { keyFields: ['_id'] },
      Teknisi: { keyFields: ['_id'] },
    },
  }),
  defaultOptions: {
    watchQuery: {
      // cache-and-network: tampil cache dulu (instan), fetch background, update bila berubah
      // Efek: navigasi balik ke halaman yang sama langsung tampil tanpa loading
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'none',
    },
  },
});

export default apolloClient;
