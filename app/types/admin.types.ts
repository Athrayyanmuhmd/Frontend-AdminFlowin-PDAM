// Types untuk Panel Admin Flowin

export interface User {
  id: string;
  nik: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'rumah_tangga' | 'komersial' | 'industri' | 'sosial';
  accountStatus: 'active' | 'inactive' | 'suspended';
  registrationDate: Date;
  lastLogin?: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'administrator' | 'teknisi' | 'technician';
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  sessionTimeout?: number;
  maxConcurrentSessions?: number;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface CustomerAccount {
  id: string;
  customerId: string;
  accountNumber: string;
  meterNumber: string;
  connectionType: 'new' | 'existing' | 'transfer';
  serviceStatus: 'active' | 'suspended' | 'disconnected';
  tariffCategory: '2A2' | '2A3' | 'komersial' | 'industri' | 'sosial';
  installationDate: Date;
  lastReading?: Date;
  currentReading?: number;
  previousReading?: number;
  consumption: number;
}

export interface Billing {
  id: string;
  accountId: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  consumption: number;
  baseRate: number;
  progressiveRate: number;
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'disputed';
  paymentMethod?: string;
  paymentDate?: Date;
  penaltyAmount?: number;
}

export interface TariffStructure {
  id: string;
  category: string;
  baseRate: number;
  progressiveRates: ProgressiveRate[];
  subsidies: Subsidy[];
  effectiveDate: Date;
  endDate?: Date;
}

export interface ProgressiveRate {
  minConsumption: number;
  maxConsumption?: number;
  rate: number;
}

export interface Subsidy {
  minConsumption: number;
  maxConsumption?: number;
  discountPercentage: number;
  maxDiscountAmount?: number;
}

export interface WorkOrder {
  id: string;
  type:
    | 'installation'
    | 'maintenance'
    | 'repair'
    | 'disconnection'
    | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  customerId: string;
  accountId?: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  materials?: Material[];
  notes?: string;
  photos?: string[];
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface SCADAData {
  timestamp: Date;
  plantId: string;
  flowRate: number;
  pressure: number;
  waterLevel: number;
  ph: number;
  turbidity: number;
  chlorine: number;
  temperature: number;
  energyConsumption: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface SmartMeter {
  id: string;
  serialNumber: string;
  accountId: string;
  type: 'NB-IoT' | 'LoRaWAN' | 'GSM';
  status: 'online' | 'offline' | 'maintenance';
  lastReading: Date;
  currentReading: number;
  batteryLevel?: number;
  signalStrength?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  installationDate: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface Report {
  id: string;
  type: 'operational' | 'financial' | 'compliance' | 'custom';
  title: string;
  description: string;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  status: 'draft' | 'scheduled' | 'generated' | 'sent';
  createdAt: Date;
  generatedAt?: Date;
  sentAt?: Date;
}

export interface ReportParameter {
  name: string;
  type: 'date' | 'string' | 'number' | 'boolean' | 'select';
  value: any;
  required: boolean;
  options?: string[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}

export interface DashboardKPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage?: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  userId?: string;
  role?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MobileAppData {
  workOrderId: string;
  technicianId: string;
  status: 'started' | 'in_progress' | 'completed';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  photos: string[];
  notes: string;
  voiceNotes?: string[];
  materials: Material[];
  startTime: Date;
  endTime?: Date;
  offline: boolean;
  synced: boolean;
}
