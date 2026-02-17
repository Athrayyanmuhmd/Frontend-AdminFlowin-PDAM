import API from '../utils/API';

export interface SurveyData {
  _id: string;
  connectionDataId: {
    _id: string;
    nik: string;
    userId: {
      _id: string;
      namaLengkap: string;
      email: string;
    };
  };
  userId: string;
  technicianId?: {
    _id: string;
    namaLengkap: string;
    email: string;
  };
  jaringanUrl: string;
  diameterPipa: number;
  posisiBakUrl: string;
  posisiMeteranUrl: string;
  jumlahPenghuni: number;
  koordinat: {
    lat: number;
    long: number;
  };
  standar: boolean;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurveyDataPayload {
  connectionDataId: string;
  luasTanah: number;
  kondisiLingkungan: string;
  jarakSumberAir: number;
  tekananAir: string;
  kualitasAir: string;
  aksesJalan: string;
  fotoLokasi: File;
  catatanTambahan?: string;
}

export const getAllSurveyData = async () => {
  const response = await API.get('/survey-data');
  return response;
};

export const getSurveyDataById = async (id: string) => {
  const response = await API.get(`/survey-data/${id}`);
  return response;
};

export const getSurveyDataByConnectionId = async (connectionDataId: string) => {
  const response = await API.get(`/survey-data/connection/${connectionDataId}`);
  return response;
};

export const createSurveyData = async (formData: FormData) => {
  const response = await API.post('/survey-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const updateSurveyData = async (id: string, formData: FormData) => {
  const response = await API.put(`/survey-data/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const deleteSurveyData = async (id: string) => {
  const response = await API.delete(`/survey-data/${id}`);
  return response;
};
