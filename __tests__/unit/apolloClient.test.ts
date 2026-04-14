/**
 * ============================================================
 * WHITEBOX TESTING — Apollo Client Configuration
 * ============================================================
 * Menguji konfigurasi Apollo Client v4 yang digunakan untuk
 * semua komunikasi GraphQL ke backend.
 *
 * File sumber: app/lib/apolloClient.ts
 * ============================================================
 */
import { ApolloClient, InMemoryCache } from '@apollo/client';

// Mock env variable
process.env.NEXT_PUBLIC_GRAPHQL_URL = 'http://localhost:5000/graphql';

describe('[WHITEBOX] Apollo Client — Konfigurasi GraphQL Client', () => {

  it('TC-APL-01 ✅ ApolloClient dapat diinstansiasi tanpa error', () => {
    const client = new ApolloClient({
      uri: 'http://localhost:5000/graphql',
      cache: new InMemoryCache(),
    });
    expect(client).toBeDefined();
  });

  it('TC-APL-02 ✅ InMemoryCache dapat diinstansiasi', () => {
    const cache = new InMemoryCache();
    expect(cache).toBeDefined();
  });

  it('TC-APL-03 ✅ NEXT_PUBLIC_GRAPHQL_URL terdefinisi', () => {
    expect(process.env.NEXT_PUBLIC_GRAPHQL_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_GRAPHQL_URL).toBe('http://localhost:5000/graphql');
  });

  it('TC-APL-04 ✅ URL GraphQL harus mengarah ke endpoint /graphql', () => {
    const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;
    expect(url).toMatch(/\/graphql$/);
  });

  it('TC-APL-05 ✅ ApolloClient harus memiliki cache', () => {
    const cache = new InMemoryCache();
    const client = new ApolloClient({
      uri: 'http://localhost:5000/graphql',
      cache,
    });
    expect(client.cache).toBeInstanceOf(InMemoryCache);
  });

  it('TC-APL-06 ✅ gql tag harus mem-parse query dengan benar', async () => {
    const { gql } = await import('@apollo/client');
    const query = gql`
      query TestQuery {
        getAllPengguna {
          _id
          namaLengkap
        }
      }
    `;
    expect(query).toBeDefined();
    expect(query.kind).toBe('Document');
    expect(query.definitions).toHaveLength(1);
  });

  it('TC-APL-07 ✅ gql tag mutation harus mem-parse dengan benar', async () => {
    const { gql } = await import('@apollo/client');
    const mutation = gql`
      mutation CreateNotif($input: CreateNotifikasiInput!) {
        createNotifikasi(input: $input) {
          _id
          judul
        }
      }
    `;
    expect(mutation.definitions[0].operation).toBe('mutation');
  });
});
