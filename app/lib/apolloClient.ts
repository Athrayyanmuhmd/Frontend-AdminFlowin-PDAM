import { ApolloClient, InMemoryCache, HttpLink, from, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create HTTP link for GraphQL endpoint
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5000/graphql',
  credentials: 'include', // Changed from 'same-origin' for better CORS handling
});

// Auth link to add token to headers
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (client-side only)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create Apollo Client instance
const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    addTypename: true,
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export default apolloClient;
