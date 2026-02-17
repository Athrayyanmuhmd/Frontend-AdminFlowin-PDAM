import API from '../utils/API';

export interface RabConnection {
  _id: string;
  connectionDataId: {
    _id: string;
    nik: string;
    userId?: {
      namaLengkap: string;
      email: string;
    };
  };
  technicianId?: {
    _id: string;
    namaLengkap: string;
    email: string;
  };
  totalBiaya: number;
  urlRab: string;
  statusPembayaran: string; // "Pending" | "Settlement" | "Cancel" | "Expire" | etc
  catatan?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRabConnectionPayload {
  connectionDataId: string;
  totalBiaya: number;
  catatan?: string;
  rabFile: File;
}

export const getAllRabConnections = async () => {
  const response = await API.get('/rab-connection');
  return response;
};

export const getRabConnectionById = async (id: string) => {
  const response = await API.get(`/rab-connection/${id}`);
  return response;
};

export const getRabConnectionByConnectionId = async (
  connectionDataId: string
) => {
  const response = await API.get(
    `/rab-connection/connection/${connectionDataId}`
  );
  return response;
};

export const createRabConnection = async (formData: FormData) => {
  const response = await API.post('/rab-connection', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const updateRabConnection = async (id: string, formData: FormData) => {
  const response = await API.put(`/rab-connection/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const updateRabPaymentStatus = async (id: string, statusPembayaran: string) => {
  const response = await API.put(`/rab-connection/${id}/payment`, { statusPembayaran });
  return response;
};

export const deleteRabConnection = async (id: string) => {
  const response = await API.delete(`/rab-connection/${id}`);
  return response;
};
