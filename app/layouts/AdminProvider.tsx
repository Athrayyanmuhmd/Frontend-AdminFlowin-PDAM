'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AdminUser, Permission, Notification } from '../types/admin.types';
import ApolloWrapper from '../lib/ApolloWrapper';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  LOGIN_ADMIN,
  LOGIN_TECHNICIAN,
  LOGOUT_ADMIN,
  LOGOUT_TECHNICIAN,
} from '../../lib/graphql/mutations/auth';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#013494',
    },
    background: {
      default: '#f0f2f5',
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h4: {
      fontSize: '2.125rem',
      '@media (max-width:600px)': {
        fontSize: '1.4rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.15rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          minWidth: 0,
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          overflow: 'visible',
        },
      },
    },
  },
});

const GET_ALL_NOTIFIKASI_ADMIN = gql`
  query GetAllNotifikasiAdmin {
    getAllNotifikasiAdmin {
      _id
      judul
      pesan
      kategori
      link
      isRead
      createdAt
    }
  }
`;

const MARK_NOTIF_READ = gql`
  mutation MarkNotifikasiAsRead($id: ID!) {
    markNotifikasiAsRead(id: $id) {
      _id
      isRead
    }
  }
`;

interface AdminContextType {
  user: AdminUser | null;
  permissions: Permission[];
  notifications: Notification[];
  login: (
    email: string,
    password: string,
    role: 'admin' | 'technician'
  ) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => void;
  markNotificationAsRead: (id: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: 'admin' | 'technician' | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

// Inner component with Apollo hooks (must be inside ApolloWrapper)
function AdminProviderInner({ children }: AdminProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'technician' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Error backoff untuk notifikasi polling
  const notifErrorCountRef = useRef(0);
  const notifRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notifikasi dari GraphQL (poll setiap 60 detik, dengan error backoff)
  const { data: notifData, refetch: refetchNotif, error: notifError, stopPolling, startPolling } = useQuery(GET_ALL_NOTIFIKASI_ADMIN, {
    skip: !isAuthenticated,
    pollInterval: 60000,
    fetchPolicy: 'network-only',
  });

  // Error backoff: stop polling setelah 2 error berturut-turut, retry setelah 5 menit
  useEffect(() => {
    if (notifError) {
      notifErrorCountRef.current += 1;
      if (notifErrorCountRef.current >= 2) {
        stopPolling();
        if (notifRetryTimerRef.current) clearTimeout(notifRetryTimerRef.current);
        notifRetryTimerRef.current = setTimeout(() => {
          notifErrorCountRef.current = 0;
          startPolling(60000);
        }, 5 * 60 * 1000);
      }
    } else if (notifData) {
      notifErrorCountRef.current = 0;
    }
  }, [notifError, notifData, stopPolling, startPolling]);

  const [markReadMutation] = useMutation(MARK_NOTIF_READ);
  const [logoutAdminMutation] = useMutation(LOGOUT_ADMIN);
  const [logoutTechnicianMutation] = useMutation(LOGOUT_TECHNICIAN);

  // GraphQL login queries (lazy — dipanggil manual saat user submit form)
  const [execLoginAdmin] = useLazyQuery(LOGIN_ADMIN, {
    fetchPolicy: 'no-cache',
  });
  const [execLoginTechnician] = useLazyQuery(LOGIN_TECHNICIAN, {
    fetchPolicy: 'no-cache',
  });

  // Sync notifikasi dari GraphQL ke state
  useEffect(() => {
    if ((notifData as any)?.getAllNotifikasiAdmin) {
      const mapped: Notification[] = (notifData as any).getAllNotifikasiAdmin.map((n: any) => ({
        id: n._id,
        type: n.kategori === 'Peringatan' ? 'warning' : n.kategori === 'Pembayaran' ? 'info' : 'info',
        title: n.judul,
        message: n.pesan,
        priority: n.kategori === 'Peringatan' ? 'high' : 'medium',
        isRead: n.isRead,
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        actionUrl: n.link || undefined,
      }));
      setNotifications(mapped);
    }
  }, [notifData]);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (notifRetryTimerRef.current) clearTimeout(notifRetryTimerRef.current);
    };
  }, []);

  // Keepalive: ping backend health every 4 minutes while authenticated.
  // Vercel recycles serverless containers after ~5 min idle, causing cold start bursts
  // that trigger DDoS mitigation. Pinging every 4 min keeps the container warm.
  useEffect(() => {
    if (!isAuthenticated) return;
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5000/graphql';
    const healthUrl = graphqlUrl.replace('/graphql', '/health');
    const ping = () => fetch(healthUrl, { method: 'GET', cache: 'no-store' }).catch(() => {});
    ping(); // immediate ping on auth restore
    const id = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    // Check saved session on client side
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('adminAuth');
      const savedToken = localStorage.getItem('admin_token');

      if (savedAuth && savedToken) {
        try {
          // Check JWT expiry before restoring session
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired — clear session
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('admin_token');
          } else {
            const authData = JSON.parse(savedAuth);
            setUser(authData.user);
            setUserRole(authData.role);
            setPermissions(authData.permissions || []);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error parsing saved auth:', error);
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('admin_token');
        }
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: 'admin' | 'technician'
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      let token: string | undefined;
      let userData: any;

      if (role === 'admin') {
        const result: any = await execLoginAdmin({ variables: { email, password } });
        if (result.errors?.length || !result.data?.loginAdmin) {
          const msg = result.errors?.[0]?.message ?? 'Login gagal';
          throw new Error(msg);
        }
        token = result.data.loginAdmin.token;
        userData = result.data.loginAdmin.admin;
      } else {
        const result: any = await execLoginTechnician({ variables: { email, password } });
        if (result.errors?.length || !result.data?.loginTechnician) {
          const msg = result.errors?.[0]?.message ?? 'Login gagal';
          throw new Error(msg);
        }
        token = result.data.loginTechnician.token;
        userData = result.data.loginTechnician.technician;
      }

      if (!token || !userData) {
        setIsLoading(false);
        return false;
      }

      const newUser: AdminUser = {
        id: userData._id,
        username: userData.namaLengkap,
        email: userData.email,
        role: role === 'admin' ? 'administrator' : 'technician',
        permissions: [],
        isActive: true,
      };

      setUser(newUser);
      setUserRole(role);
      setIsAuthenticated(true);

      if (typeof window !== 'undefined') {
        localStorage.setItem('adminAuth', JSON.stringify({ user: newUser, role, token, permissions: [] }));
        localStorage.setItem('admin_token', token);
      }

      // Refetch notifikasi setelah login
      setTimeout(() => refetchNotif(), 500);

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error; // re-throw agar halaman login bisa tampilkan pesan error
    }
  };

  const logout = async () => {
    try {
      // Invalidate token on server via GraphQL mutation
      if (userRole === 'admin') {
        await logoutAdminMutation().catch(() => {}); // fire-and-forget, don't block logout
      } else if (userRole === 'technician') {
        await logoutTechnicianMutation().catch(() => {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserRole(null);
      setPermissions([]);
      setNotifications([]);
      setIsAuthenticated(false);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
      }
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || user.role === 'administrator') return true;

    return permissions.some(
      permission =>
        permission.resource === resource && permission.action === action
    );
  };

  const addNotification = (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = async (id: string) => {
    // Mark in GraphQL backend
    try {
      await markReadMutation({ variables: { id } });
    } catch (err) {
      console.error('Gagal mark notif as read:', err);
    }
    // Optimistic update in state
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const value: AdminContextType = {
    user,
    permissions,
    notifications,
    login,
    logout,
    hasPermission,
    addNotification,
    markNotificationAsRead,
    isAuthenticated,
    isLoading,
    userRole,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export default function AdminProvider({ children }: AdminProviderProps) {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ApolloWrapper>
        <AdminProviderInner>{children}</AdminProviderInner>
      </ApolloWrapper>
    </ThemeProvider>
  );
}
