// @ts-nocheck
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, Permission, Notification } from '../types/admin.types';
import {
  loginAdmin,
  loginTechnician,
  logoutAdmin,
  logoutTechnician,
} from '../services/auth.service';
import ApolloWrapper from '../lib/ApolloWrapper';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

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

  // Load notifikasi dari GraphQL (poll setiap 30 detik)
  const { data: notifData, refetch: refetchNotif } = useQuery(GET_ALL_NOTIFIKASI_ADMIN, {
    skip: !isAuthenticated,
    pollInterval: 30000,
    fetchPolicy: 'network-only',
  });

  const [markReadMutation] = useMutation(MARK_NOTIF_READ);

  // Sync notifikasi dari GraphQL ke state
  useEffect(() => {
    if (notifData?.getAllNotifikasiAdmin) {
      const mapped: Notification[] = notifData.getAllNotifikasiAdmin.map((n: any) => ({
        id: n._id,
        type: n.kategori === 'Peringatan' ? 'warning' : n.kategori === 'Transaksi' ? 'info' : 'info',
        title: n.judul,
        message: n.pesan,
        priority: n.kategori === 'Peringatan' ? 'high' : 'medium',
        isRead: n.isRead,
        createdAt: new Date(n.createdAt),
        actionUrl: n.link || undefined,
      }));
      setNotifications(mapped);
    }
  }, [notifData]);

  useEffect(() => {
    // Check saved session on client side
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('adminAuth');

      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          setUser(authData.user);
          setUserRole(authData.role);
          setPermissions(authData.permissions || []);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved auth:', error);
          localStorage.removeItem('adminAuth');
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
      let response;

      if (role === 'admin') {
        response = await loginAdmin({ email, password });
      } else {
        response = await loginTechnician({ email, password });
      }

      const token = response.token || response.data?.token;
      const userData = response.data;

      if (response.status === 200 && userData && token) {
        const newUser: AdminUser = {
          id: userData._id || userData.id,
          username: userData.namaLengkap || userData.fullName,
          email: userData.email,
          role: role === 'admin' ? 'administrator' : 'technician',
          permissions: [],
          isActive: true,
        };

        setUser(newUser);
        setUserRole(role);
        setIsAuthenticated(true);

        if (typeof window !== 'undefined') {
          const authData = {
            user: newUser,
            role: role,
            token: token,
            permissions: [],
          };

          localStorage.setItem('adminAuth', JSON.stringify(authData));
          localStorage.setItem('admin_token', token);
        }

        // Refetch notifikasi setelah login
        setTimeout(() => refetchNotif(), 500);

        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (userRole === 'admin') {
        await logoutAdmin();
      } else if (userRole === 'technician') {
        await logoutTechnician();
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
    <ApolloWrapper>
      <AdminProviderInner>{children}</AdminProviderInner>
    </ApolloWrapper>
  );
}
