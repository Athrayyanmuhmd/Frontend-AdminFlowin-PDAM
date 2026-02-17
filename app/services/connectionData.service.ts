import API from '../utils/API';

export interface ConnectionData {
  _id: string;
  userId: {
    _id: string;
    namaLengkap: string;
    email: string;
    noHP: string;
  };
  nik: string;
  nikUrl: string;
  noKK: string;
  kkUrl: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  noImb: string;
  imbUrl: string;
  luasBangunan: number;
  isVerifiedByData: boolean;
  isVerifiedByTechnician: boolean;
  surveiId: any;
  rabConnectionId: any;
  isAllProcedureDone: boolean;
  // Assignment fields
  assignedTechnicianId?: {
    _id: string;
    namaLengkap: string;
    email: string;
    noHP: string;
  } | null;
  assignedAt?: string | null;
  assignedBy?: {
    _id: string;
    namaLengkap: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionDataListResponse {
  status: number;
  message?: string;
  data: ConnectionData[];
}

export interface ConnectionDataDetailResponse {
  status: number;
  message?: string;
  data: ConnectionData;
}

export interface ConnectionDataFilters {
  isVerifiedByData?: boolean;
  isVerifiedByTechnician?: boolean;
  isAllProcedureDone?: boolean;
}

/**
 * Get all connection data (Admin only)
 * With optional filters
 */
export const getAllConnectionData = async (
  filters?: ConnectionDataFilters
): Promise<ConnectionDataListResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters?.isVerifiedByData !== undefined) {
      params.append('isVerifiedByData', String(filters.isVerifiedByData));
    }
    if (filters?.isVerifiedByTechnician !== undefined) {
      params.append(
        'isVerifiedByTechnician',
        String(filters.isVerifiedByTechnician)
      );
    }
    if (filters?.isAllProcedureDone !== undefined) {
      params.append('isAllProcedureDone', String(filters.isAllProcedureDone));
    }

    const queryString = params.toString();
    const url = queryString
      ? `/connection-data?${queryString}`
      : '/connection-data';

    const response = await API.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get connection data by ID (Admin only)
 */
export const getConnectionDataById = async (
  id: string
): Promise<ConnectionDataDetailResponse> => {
  try {
    const response = await API.get(`/connection-data/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify connection data by Admin
 */
export const verifyConnectionDataByAdmin = async (
  id: string
): Promise<{ status: number; message: string; data: ConnectionData }> => {
  try {
    const response = await API.put(`/connection-data/${id}/verify-admin`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify connection data by Technician
 */
export const verifyConnectionDataByTechnician = async (
  id: string
): Promise<{ status: number; message: string; data: ConnectionData }> => {
  try {
    const response = await API.put(`/connection-data/${id}/verify-technician`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Complete all procedure (Admin only)
 * RAB must be paid first
 */
export const completeAllProcedure = async (
  id: string
): Promise<{ status: number; message: string; data: ConnectionData }> => {
  try {
    const response = await API.put(`/connection-data/${id}/complete-procedure`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete connection data (Admin only)
 */
export const deleteConnectionData = async (
  id: string
): Promise<{ status: number; message: string }> => {
  try {
    const response = await API.delete(`/connection-data/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Assign technician to connection data (Admin only)
 */
export const assignTechnician = async (
  connectionDataId: string,
  technicianId: string
): Promise<{ status: number; message: string; data: ConnectionData }> => {
  try {
    const response = await API.put(
      `/connection-data/${connectionDataId}/assign-technician`,
      { technicianId }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Unassign technician from connection data (Admin only)
 */
export const unassignTechnician = async (
  connectionDataId: string
): Promise<{ status: number; message: string; data: ConnectionData }> => {
  try {
    const response = await API.put(
      `/connection-data/${connectionDataId}/unassign-technician`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
