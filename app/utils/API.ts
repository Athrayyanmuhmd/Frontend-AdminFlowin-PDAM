import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Membuat instance API dengan konfigurasi dasar
const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Menambahkan interceptor untuk request
API.interceptors.request.use(
  (config: any): any => {
    // Add auth token for admin requests (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Menambahkan interceptor untuk response
API.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError): Promise<AxiosError> => {
    // Handle unauthorized access (client-side only)
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    API.post('/admin/auth/login', credentials),
  logout: (userId: string) => API.post('/admin/auth/logout', { userId }),
  register: (userData: any) => API.post('/admin/auth/register', userData),
};

// Customer API
export const customerAPI = {
  getAll: (params?: any) => API.get('/admin/customers', { params }),
  getById: (id: string) => API.get(`/admin/customers/${id}`),
  create: (customerData: any) => API.post('/admin/customers', customerData),
  update: (id: string, customerData: any) =>
    API.put(`/admin/customers/${id}`, customerData),
  delete: (id: string) => API.delete(`/admin/customers/${id}`),
  getStats: () => API.get('/admin/customers/stats'),
};

// Billing API
export const billingAPI = {
  getAll: (params?: any) => API.get('/admin/billing', { params }),
  getById: (id: string) => API.get(`/admin/billing/${id}`),
  generateBill: (billData: any) =>
    API.post('/admin/billing/generate', billData),
  processPayment: (id: string, paymentData: any) =>
    API.post(`/admin/billing/${id}/payment`, paymentData),
  getStats: () => API.get('/admin/billing/stats'),
};

// Work Order API
export const workOrderAPI = {
  getAll: (params?: any) => API.get('/work-orders', { params }),
  getById: (id: string) => API.get(`/work-orders/${id}`),
  create: (workOrderData: any) => API.post('/work-orders', workOrderData),
  update: (id: string, workOrderData: any) =>
    API.put(`/work-orders/${id}`, workOrderData),
  delete: (id: string) => API.delete(`/work-orders/${id}`),
  assignTechnician: (id: string, technicianId: string) =>
    API.put(`/work-orders/${id}/assign`, { technicianId }),
  updateStatus: (id: string, status: string, notes?: string) =>
    API.put(`/work-orders/${id}/status`, { status, notes }),
  getStats: () => API.get('/work-orders/stats'),
  getTechnicianWorkOrders: (technicianId: string, params?: any) =>
    API.get(`/work-orders/technician/${technicianId}`, { params }),
};

// SCADA API
export const scadaAPI = {
  getAll: (params?: any) => API.get('/admin/scada', { params }),
  getById: (id: string) => API.get(`/admin/scada/${id}`),
  create: (scadaData: any) => API.post('/admin/scada', scadaData),
  update: (id: string, scadaData: any) =>
    API.put(`/admin/scada/${id}`, scadaData),
  getLatestByPlant: (plantId: string) =>
    API.get(`/admin/scada/plant/${plantId}/latest`),
  getHistory: (plantId: string, params?: any) =>
    API.get(`/admin/scada/plant/${plantId}/history`, { params }),
  getAlarms: (params?: any) => API.get('/admin/scada/alarms', { params }),
  acknowledgeAlarm: (
    plantId: string,
    alarmId: string,
    acknowledgedBy: string
  ) =>
    API.post(`/admin/scada/alarm/${plantId}/${alarmId}/acknowledge`, {
      acknowledgedBy,
    }),
  resolveAlarm: (plantId: string, alarmId: string) =>
    API.post(`/admin/scada/alarm/${plantId}/${alarmId}/resolve`),
  getStats: () => API.get('/admin/scada/stats'),
  getPlants: () => API.get('/admin/scada/plants'),
};

// Water Quality API
export const waterQualityAPI = {
  getAll: (params?: any) => API.get('/admin/water-quality', { params }),
  getById: (id: string) => API.get(`/admin/water-quality/${id}`),
  create: (waterQualityData: any) =>
    API.post('/admin/water-quality', waterQualityData),
  update: (id: string, waterQualityData: any) =>
    API.put(`/admin/water-quality/${id}`, waterQualityData),
  getRealTimeData: (params?: any) =>
    API.get('/admin/water-quality/realtime', { params }),
  getHistoricalData: (location: string, params?: any) =>
    API.get(`/admin/water-quality/historical/${location}`, { params }),
  getTestResults: (params?: any) =>
    API.get('/admin/water-quality/tests', { params }),
  createTest: (testData: any) =>
    API.post('/admin/water-quality/tests', testData),
  updateTest: (id: string, testData: any) =>
    API.put(`/admin/water-quality/tests/${id}`, testData),
  getStats: () => API.get('/admin/water-quality/stats'),
  getLocationStats: (location: string) =>
    API.get(`/admin/water-quality/location/${location}/stats`),
  getAlerts: (params?: any) =>
    API.get('/admin/water-quality/alerts', { params }),
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) =>
    API.post(`/admin/water-quality/alerts/${alertId}/acknowledge`, {
      acknowledgedBy,
    }),
  exportData: (params?: any) =>
    API.get('/admin/water-quality/export', { params, responseType: 'blob' }),
};

// Smart Meter API
export const smartMeterAPI = {
  getAll: (params?: any) => API.get('/admin/smart-meters', { params }),
  getById: (id: string) => API.get(`/admin/smart-meters/${id}`),
  create: (meterData: any) => API.post('/admin/smart-meters', meterData),
  update: (id: string, meterData: any) =>
    API.put(`/admin/smart-meters/${id}`, meterData),
  delete: (id: string) => API.delete(`/admin/smart-meters/${id}`),
  getReadings: (meterId: string, params?: any) =>
    API.get(`/admin/smart-meters/${meterId}/readings`, { params }),
  getRealTimeData: (params?: any) =>
    API.get('/admin/smart-meters/realtime', { params }),
  getStats: () => API.get('/admin/smart-meters/stats'),
  configure: (id: string, config: any) =>
    API.post(`/admin/smart-meters/${id}/configure`, config),
  remoteAction: (id: string, action: string) =>
    API.post(`/admin/smart-meters/${id}/action`, { action }),
  getAlerts: (params?: any) =>
    API.get('/admin/smart-meters/alerts', { params }),
  updateFirmware: (id: string, firmwareData: any) =>
    API.post(`/admin/smart-meters/${id}/firmware`, firmwareData),
  getConnectivityStatus: () => API.get('/admin/smart-meters/connectivity'),
  getBatteryStatus: () => API.get('/admin/smart-meters/battery'),
  exportData: (params?: any) =>
    API.get('/admin/smart-meters/export', { params, responseType: 'blob' }),
};

// Transaction API
export const transactionAPI = {
  getAll: (params?: any) => API.get('/transactions', { params }),
  getById: (id: string) =>
    API.get(`/transactions/getTransactionByTransactionID/${id}`),
  getByUserId: (userId: string) =>
    API.get(`/transactions/getTransactionByUserID/${userId}`),
  getByReceiverId: (receiverId: string) =>
    API.get(`/transactions/getTransactionByRecieverID/${receiverId}`),
  create: (transactionData: any) => API.post('/transactions', transactionData),
  update: (id: string, transactionData: any) =>
    API.put(`/transactions/updateTransaction/${id}`, transactionData),
};

// Water Credit API
export const waterCreditAPI = {
  getAll: () => API.get('/waterCredit/getAllWaterCredit'),
  getById: (id: string) => API.get(`/waterCredit/getWaterCreditById/${id}`),
  getByOwnerId: (ownerId: string) =>
    API.get(`/waterCredit/getWaterCreditByOwnerId/${ownerId}`),
  create: (waterCreditData: any) =>
    API.post('/waterCredit/createWaterCredit', waterCreditData),
  update: (id: string, waterCreditData: any) =>
    API.put(`/waterCredit/editWaterCredit/${id}`, waterCreditData),
  delete: (id: string) => API.delete(`/waterCredit/deleteWaterCredit/${id}`),
};

// Report API
export const reportAPI = {
  getAll: () => API.get('/report'),
  getByReporterId: (reporterId: string) =>
    API.get(`/report/getByReporterID/${reporterId}`),
  create: (reportData: any) => API.post('/report/create', reportData),
  update: (id: string, reportData: any) =>
    API.put(`/report/edit/${id}`, reportData),
  delete: (id: string) => API.delete(`/report/delete/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => API.get('/admin/dashboard/stats'),
  getRevenueChart: (params?: any) =>
    API.get('/admin/dashboard/revenue-chart', { params }),
  getConsumptionChart: (params?: any) =>
    API.get('/admin/dashboard/consumption-chart', { params }),
  getRecentActivities: (limit?: number) =>
    API.get('/admin/dashboard/recent-activities', { params: { limit } }),
  getAlerts: () => API.get('/admin/dashboard/alerts'),
};

// Notification API
export const notificationAPI = {
  getAll: (userId: string) => API.get(`/notification/${userId}`),
  markAsRead: (notificationId: string) =>
    API.put(`/notification/${notificationId}/read`),
  markAllAsRead: (userId: string) =>
    API.put(`/notification/${userId}/read-all`),
  delete: (notificationId: string) =>
    API.delete(`/notification/${notificationId}`),
};

// User API (Admin & Technician Management)
export const userAPI = {
  getAll: (params?: any) => API.get('/users', { params }),
  getById: (id: string) => API.get(`/users/${id}`),
  create: (userData: any) => API.post('/users/register', userData),
  update: (id: string, userData: any) => API.put(`/users/${id}`, userData),
  delete: (id: string) => API.delete(`/users/${id}`),
  changePassword: (id: string, passwordData: any) =>
    API.put(`/users/${id}/password`, passwordData),
};

export default API;
