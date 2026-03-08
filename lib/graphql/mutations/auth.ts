import { gql } from '@apollo/client';

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
