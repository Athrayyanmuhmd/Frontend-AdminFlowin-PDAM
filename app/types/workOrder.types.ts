// Work Order Types untuk Admin Panel

export type WorkOrderType =
  | 'installation'
  | 'repair'
  | 'survey'
  | 'inspection'
  | 'complaint'
  | 'maintenance';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkOrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface WorkOrderLocation {
  address: string;
  kecamatan?: string;
  kelurahan?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface WorkOrderMaterial {
  materialName: string;
  quantity: number;
  unit: string;
}

export interface WorkOrderCompletionReport {
  summary?: string;
  workDone?: string;
  materialsUsed?: WorkOrderMaterial[];
  issues?: string;
  recommendations?: string;
  technicianSignature?: string;
}

export interface WorkOrderPhoto {
  url: string;
  description?: string;
  uploadedAt?: Date;
}

export interface WorkOrderPhotos {
  before?: WorkOrderPhoto[];
  after?: WorkOrderPhoto[];
}

export interface ActivityLogEntry {
  action: string;
  performedBy: {
    userId: string;
    userType: 'admin' | 'technician';
    userName: string;
  };
  timestamp: Date;
  details?: string;
}

export interface AdditionalTechnicianRequest {
  isRequested: boolean;
  reason?: string;
  requestedAt?: Date;
  isApproved: boolean;
  approvedBy?: string;
  additionalTechnicianId?: string;
}

export interface CustomerRating {
  rating?: number;
  feedback?: string;
  ratedAt?: Date;
}

export interface WorkOrder {
  _id: string;
  workOrderNumber: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;

  // Customer info
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  // Related data
  connectionDataId?: string;
  meteranId?: string;

  // Assignment
  assignedTechnicianId?: string;
  assignedBy?: string;
  assignedAt?: Date;

  // Scheduling
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // Duration
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes

  // Location & description
  location: WorkOrderLocation;
  description: string;
  notes?: string;
  adminNotes?: string;

  // Completion data
  completionReport?: WorkOrderCompletionReport;
  photos?: WorkOrderPhotos;

  // Cancellation/Rejection
  cancellationReason?: string;
  rejectionReason?: string;

  // Additional requests
  additionalTechnicianRequest?: AdditionalTechnicianRequest;

  // Customer feedback
  customerRating?: CustomerRating;

  // Activity log
  activityLog?: ActivityLogEntry[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isOverdue?: boolean;
}

// Populated work order (with relations)
export interface PopulatedWorkOrder extends WorkOrder {
  assignedTechnicianId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  customerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    customerType: string;
  };
  assignedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

// Form data untuk create/update work order
export interface WorkOrderFormData {
  type: WorkOrderType;
  priority: WorkOrderPriority;
  customerId?: string;
  connectionDataId?: string;
  meteranId?: string;
  scheduledDate: string | Date;
  estimatedDuration?: number;
  location: WorkOrderLocation;
  description: string;
  notes?: string;
  adminNotes?: string;
}

// Stats untuk dashboard
export interface WorkOrderStats {
  totalWorkOrders: number;
  workOrdersByStatus: Array<{ _id: string; count: number }>;
  workOrdersByType: Array<{ _id: string; count: number }>;
  workOrdersByPriority: Array<{ _id: string; count: number }>;
  completionRate: number;
  averageCompletionTime: number; // in minutes
  overdueWorkOrders: number;
}

// Filter params untuk query
export interface WorkOrderQueryParams {
  status?: string;
  type?: string;
  priority?: string;
  technicianId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper functions
export const getWorkOrderTypeLabel = (type: WorkOrderType): string => {
  const labels: Record<WorkOrderType, string> = {
    installation: 'Instalasi',
    repair: 'Perbaikan',
    survey: 'Survei',
    inspection: 'Inspeksi',
    complaint: 'Keluhan',
    maintenance: 'Pemeliharaan',
  };
  return labels[type] || type;
};

export const getWorkOrderStatusLabel = (status: WorkOrderStatus): string => {
  const labels: Record<WorkOrderStatus, string> = {
    pending: 'Menunggu',
    assigned: 'Ditugaskan',
    in_progress: 'Sedang Dikerjakan',
    on_hold: 'Ditunda',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    rejected: 'Ditolak',
  };
  return labels[status] || status;
};

export const getWorkOrderPriorityLabel = (priority: WorkOrderPriority): string => {
  const labels: Record<WorkOrderPriority, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
  };
  return labels[priority] || priority;
};

export const getWorkOrderStatusColor = (status: WorkOrderStatus):
  'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
  const colors: Record<WorkOrderStatus, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
    pending: 'default',
    assigned: 'info',
    in_progress: 'primary',
    on_hold: 'warning',
    completed: 'success',
    cancelled: 'error',
    rejected: 'error',
  };
  return colors[status] || 'default';
};

export const getWorkOrderPriorityColor = (priority: WorkOrderPriority):
  'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
  const colors: Record<WorkOrderPriority, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
    low: 'success',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  };
  return colors[priority] || 'default';
};
