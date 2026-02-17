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

export default function AdminProvider({ children }: AdminProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'technician' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Simulasi data admin untuk demo
  const mockAdminUser: AdminUser = {
    id: '1',
    username: 'admin',
    email: 'admin@pdam-tirtadaroy.ac.id',
    role: 'administrator',
    permissions: [
      { id: '1', name: 'Manage Users', resource: 'users', action: 'create' },
      { id: '2', name: 'View Users', resource: 'users', action: 'read' },
      { id: '3', name: 'Update Users', resource: 'users', action: 'update' },
      { id: '4', name: 'Delete Users', resource: 'users', action: 'delete' },
      {
        id: '5',
        name: 'Manage Customers',
        resource: 'customers',
        action: 'create',
      },
      {
        id: '6',
        name: 'View Customers',
        resource: 'customers',
        action: 'read',
      },
      {
        id: '7',
        name: 'Update Customers',
        resource: 'customers',
        action: 'update',
      },
      {
        id: '8',
        name: 'Manage Billing',
        resource: 'billing',
        action: 'create',
      },
      { id: '9', name: 'View Billing', resource: 'billing', action: 'read' },
      {
        id: '10',
        name: 'Update Billing',
        resource: 'billing',
        action: 'update',
      },
      {
        id: '11',
        name: 'Manage Work Orders',
        resource: 'workorders',
        action: 'create',
      },
      {
        id: '12',
        name: 'View Work Orders',
        resource: 'workorders',
        action: 'read',
      },
      {
        id: '13',
        name: 'Update Work Orders',
        resource: 'workorders',
        action: 'update',
      },
      { id: '14', name: 'View Reports', resource: 'reports', action: 'read' },
      {
        id: '15',
        name: 'Create Reports',
        resource: 'reports',
        action: 'create',
      },
      {
        id: '16',
        name: 'Manage System',
        resource: 'system',
        action: 'execute',
      },
    ],
    isActive: true,
    sessionTimeout: 30, // 30 menit
    maxConcurrentSessions: 2,
  };

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Tekanan Air Rendah',
      message: 'Tekanan air di zona A menurun hingga 1.2 bar',
      priority: 'high',
      isRead: false,
      createdAt: new Date('2025-10-07T10:00:00'),
      actionUrl: '/dashboard/operational',
    },
    {
      id: '2',
      type: 'info',
      title: 'Pembacaan Meteran Selesai',
      message: 'Pembacaan meteran untuk 1,250 pelanggan telah selesai',
      priority: 'medium',
      isRead: false,
      createdAt: new Date('2025-10-07T09:30:00'),
      actionUrl: '/billing/readings',
    },
    {
      id: '3',
      type: 'error',
      title: 'Gangguan Sistem',
      message: 'Koneksi ke server SCADA terputus',
      priority: 'critical',
      isRead: false,
      createdAt: new Date('2025-10-07T09:00:00'),
      actionUrl: '/system/monitoring',
    },
  ];

  useEffect(() => {
    setMounted(true);

    // Check saved session only on client side
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('adminAuth');

      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          setUser(authData.user);
          setUserRole(authData.role);
          setPermissions(authData.permissions || []);
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

      // Handle different response formats
      // Admin: { status, data: {...}, token }
      // Technician: { status, data: { ..., token } }
      const token = response.token || response.data?.token;
      const userData = response.data;

      if (response.status === 200 && userData && token) {
        const user: AdminUser = {
          id: userData._id || userData.id,
          username: userData.namaLengkap || userData.fullName,
          email: userData.email,
          role: role === 'admin' ? 'administrator' : 'technician',
          permissions: [],
          isActive: true,
        };

        setUser(user);
        setUserRole(role);

        // Save to localStorage (client-side only)
        if (typeof window !== 'undefined') {
          const authData = {
            user: user,
            role: role,
            token: token,
            permissions: [],
          };

          localStorage.setItem('adminAuth', JSON.stringify(authData));
          localStorage.setItem('admin_token', token);
        }

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

      // Clear localStorage (client-side only)
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
    localStorage.setItem(
      'admin_notifications',
      JSON.stringify([newNotification, ...notifications])
    );
  };

  const markNotificationAsRead = (id: string) => {
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
    isAuthenticated: !!user,
    isLoading,
    userRole,
  };

  return (
    <ApolloWrapper>
      <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
    </ApolloWrapper>
  );
}
