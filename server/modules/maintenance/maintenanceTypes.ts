export type MaintenanceStatus = 
  | 'reported' 
  | 'triage' 
  | 'assigned' 
  | 'in_progress' 
  | 'waiting_parts' 
  | 'inspection' 
  | 'completed' 
  | 'closed' 
  | 'cancelled';

export type MaintenanceCategory = 
  | 'plumbing' 
  | 'electrical' 
  | 'hvac' 
  | 'furniture' 
  | 'appliances' 
  | 'structure' 
  | 'lock_key' 
  | 'general';

export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MaintenanceTechnician {
  technicianId: string;
  name: string;
  specialty: MaintenanceCategory;
  phone?: string;
  isAvailable: boolean;
}

export interface MaintenanceTask {
  taskId: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  unitNumber: string;
  reservationId?: string;
  guestId?: string;
  status: MaintenanceStatus;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  reportedBy?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  slaMinutes: number;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceHistory {
  historyId: string;
  taskId: string;
  previousStatus?: MaintenanceStatus;
  newStatus: MaintenanceStatus;
  changedBy?: string;
  notes?: string;
  timestamp: string;
}

export interface CreateMaintenanceTaskDTO {
  unitId: string;
  unitNumber?: string;
  reservationId?: string;
  guestId?: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
  description: string;
  reportedBy?: string;
  slaMinutes?: number;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  notes?: string;
}

export interface UpdateMaintenanceTaskDTO {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  description?: string;
  notes?: string;
  changedBy?: string;
}

export interface MaintenanceTaskFilters {
  status?: MaintenanceStatus;
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
  unitId?: string;
  assignedTechnicianId?: string;
}

export interface MaintenanceDashboardSummary {
  openTasksCount: number;
  completedTasksCount: number;
  criticalTasksCount: number;
  backlogTasksCount: number;
  averageSlaMinutes: number;
  averageResolutionMinutes: number;
  unavailableRoomsCount: number;
  waitingPartsRoomsCount: number;
}
