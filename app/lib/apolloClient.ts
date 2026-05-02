import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

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

// Auth link to add token to headers
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
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

// Create Apollo Client instance
const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
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
