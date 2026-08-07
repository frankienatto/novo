import { 
  MaintenanceTask, 
  MaintenanceHistory, 
  MaintenanceTaskFilters 
} from './maintenanceTypes.ts';

export interface IMaintenanceRepository {
  saveTask(task: MaintenanceTask): Promise<MaintenanceTask>;
  findTaskById(organizationId: string, propertyId: string, taskId: string): Promise<MaintenanceTask | null>;
  findTasks(organizationId: string, propertyId: string, filters?: MaintenanceTaskFilters): Promise<MaintenanceTask[]>;
  findActiveTaskByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<MaintenanceTask | null>;
  saveHistory(history: MaintenanceHistory): Promise<MaintenanceHistory>;
  getHistoryByTaskId(taskId: string): Promise<MaintenanceHistory[]>;
}

export class InMemoryMaintenanceRepository implements IMaintenanceRepository {
  private tasks: Map<string, MaintenanceTask> = new Map();
  private history: MaintenanceHistory[] = [];

  private getKey(orgId: string, propId: string, taskId: string): string {
    return `${orgId}:${propId}:${taskId}`;
  }

  async saveTask(task: MaintenanceTask): Promise<MaintenanceTask> {
    const key = this.getKey(task.organizationId, task.propertyId, task.taskId);
    this.tasks.set(key, { ...task });
    return { ...task };
  }

  async findTaskById(organizationId: string, propertyId: string, taskId: string): Promise<MaintenanceTask | null> {
    const key = this.getKey(organizationId, propertyId, taskId);
    const task = this.tasks.get(key);
    return task ? { ...task } : null;
  }

  async findTasks(
    organizationId: string, 
    propertyId: string, 
    filters?: MaintenanceTaskFilters
  ): Promise<MaintenanceTask[]> {
    const results: MaintenanceTask[] = [];

    for (const task of this.tasks.values()) {
      if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
        continue;
      }

      if (filters?.status && task.status !== filters.status) continue;
      if (filters?.category && task.category !== filters.category) continue;
      if (filters?.priority && task.priority !== filters.priority) continue;
      if (filters?.unitId && task.unitId !== filters.unitId) continue;
      if (filters?.assignedTechnicianId && task.assignedTechnicianId !== filters.assignedTechnicianId) continue;

      results.push({ ...task });
    }

    // Ordenar por data de criação decrescente
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findActiveTaskByUnitId(
    organizationId: string, 
    propertyId: string, 
    unitId: string
  ): Promise<MaintenanceTask | null> {
    const activeStatuses = ['reported', 'triage', 'assigned', 'in_progress', 'waiting_parts', 'inspection'];
    
    for (const task of this.tasks.values()) {
      if (
        task.organizationId === organizationId &&
        task.propertyId === propertyId &&
        task.unitId === unitId &&
        activeStatuses.includes(task.status)
      ) {
        return { ...task };
      }
    }

    return null;
  }

  async saveHistory(historyItem: MaintenanceHistory): Promise<MaintenanceHistory> {
    this.history.push({ ...historyItem });
    return { ...historyItem };
  }

  async getHistoryByTaskId(taskId: string): Promise<MaintenanceHistory[]> {
    return this.history
      .filter(h => h.taskId === taskId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const maintenanceRepository = new InMemoryMaintenanceRepository();
