import API from '../utils/API';

export interface Technician {
  _id: string;
  namaLengkap: string;
  email: string;
  noHP: string;
  nip?: string;
  divisi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechnicianData {
  namaLengkap: string;
  email: string;
  password: string;
  noHP: string;
}

export interface UpdateTechnicianData {
  namaLengkap?: string;
  email?: string;
  noHP?: string;
  password?: string;
}

export const getAllTechnicians = async () => {
  const response = await API.get('/technician');
  return response;
};

export const getTechnicianById = async (id: string) => {
  const response = await API.get(`/technician/${id}`);
  return response;
};

export const createTechnician = async (data: CreateTechnicianData) => {
  const response = await API.post('/technician', data);
  return response;
};

export const updateTechnician = async (
  id: string,
  data: UpdateTechnicianData
) => {
  const response = await API.put(`/technician/${id}`, data);
  return response;
};

export const deleteTechnician = async (id: string) => {
  const response = await API.delete(`/technician/${id}`);
  return response;
};
