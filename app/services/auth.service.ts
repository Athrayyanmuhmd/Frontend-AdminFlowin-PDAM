import API from '../utils/API';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: number;
  message?: string;
  data?: any; // Admin returns user object directly
  token?: string; // Token might be at root level or in data
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'technician';
}

/**
 * Login as Admin
 */
export const loginAdmin = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await API.post('/admin/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Login as Technician
 */
export const loginTechnician = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await API.post('/technician/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Technician Profile
 */
export const getTechnicianProfile = async (): Promise<any> => {
  try {
    const response = await API.get('/technician/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout Admin
 */
export const logoutAdmin = async (): Promise<any> => {
  try {
    const response = await API.post('/admin/auth/logout');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout Technician
 */
export const logoutTechnician = async (): Promise<any> => {
  try {
    const response = await API.post('/technician/logout');
    return response.data;
  } catch (error) {
    throw error;
  }
};
