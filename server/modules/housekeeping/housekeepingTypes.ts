export type CleaningStatus = 'dirty' | 'assigned' | 'cleaning' | 'clean' | 'inspection' | 'available' | 'cancelled';

export type InspectionStatus = 'pending' | 'passed' | 'failed';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface HousekeepingTask {
  taskId: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  unitNumber: string;
  reservationId?: string;
  guestId?: string;
  cleaningStatus: CleaningStatus;
  inspectionStatus: InspectionStatus;
  priority: TaskPriority;
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  slaMinutes: number; // ex: 45 minutos
  startedAt?: string;
  completedAt?: string;
  inspectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHousekeepingTaskDTO {
  unitId: string;
  unitNumber?: string;
  reservationId?: string;
  guestId?: string;
  priority?: TaskPriority;
  notes?: string;
  slaMinutes?: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
}

export interface UpdateHousekeepingTaskDTO {
  cleaningStatus?: CleaningStatus;
  inspectionStatus?: InspectionStatus;
  priority?: TaskPriority;
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
}

export interface HousekeepingTaskFilters {
  cleaningStatus?: CleaningStatus;
  inspectionStatus?: InspectionStatus;
  priority?: TaskPriority;
  unitId?: string;
  assignedStaffId?: string;
}

export interface HousekeepingDashboardSummary {
  totalUnits: number;
  availableUnits: number;
  dirtyUnits: number;
  cleaningInProcess: number;
  awaitingInspection: number;
  blockedOrMaintenance: number;
  pendingTasksCount: number;
  urgentTasksCount: number;
  averageSlaCompletionMinutes: number;
}
