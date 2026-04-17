import { gql } from '@apollo/client';

// Queries (bukan Mutations) — sesuai schema backend
export const LOGIN_ADMIN = gql`
  query LoginAdmin($email: String!, $password: String!) {
    loginAdmin(email: $email, password: $password) {
      token
      admin {
        _id
        NIP
        namaLengkap
        email
        noHP
      }
    }
  }
`;

export const LOGIN_TECHNICIAN = gql`
  query LoginTechnician($email: String!, $password: String!) {
    loginTechnician(email: $email, password: $password) {
      token
      technician {
        _id
        NIP
        namaLengkap
        email
        noHP
      }
    }
  }
`;

export const LOGOUT_ADMIN = gql`
  mutation LogoutAdmin {
    logoutAdmin
  }
`;

export const LOGOUT_TECHNICIAN = gql`
  mutation LogoutTechnician {
    logoutTechnician
  }
`;
