import { HousekeepingTask, HousekeepingTaskFilters } from './housekeepingTypes.ts';

export interface IHousekeepingRepository {
  save(task: HousekeepingTask): Promise<HousekeepingTask>;
  findById(organizationId: string, propertyId: string, taskId: string): Promise<HousekeepingTask | null>;
  findByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask[]>;
  findActiveByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask | null>;
  findTasks(organizationId: string, propertyId: string, filters?: HousekeepingTaskFilters): Promise<HousekeepingTask[]>;
  delete(organizationId: string, propertyId: string, taskId: string): Promise<boolean>;
}

export class HousekeepingRepository implements IHousekeepingRepository {
  private tasksMap: Map<string, HousekeepingTask> = new Map();

  async save(task: HousekeepingTask): Promise<HousekeepingTask> {
    const key = `${task.organizationId}_${task.propertyId}_${task.taskId}`;
    const copy = JSON.parse(JSON.stringify(task));
    this.tasksMap.set(key, copy);
    return JSON.parse(JSON.stringify(copy));
  }

  async findById(organizationId: string, propertyId: string, taskId: string): Promise<HousekeepingTask | null> {
    const key = `${organizationId}_${propertyId}_${taskId}`;
    const found = this.tasksMap.get(key);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  async findByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask[]> {
    const list: HousekeepingTask[] = [];
    for (const task of this.tasksMap.values()) {
      if (
        task.organizationId === organizationId &&
        task.propertyId === propertyId &&
        task.unitId === unitId
      ) {
        list.push(JSON.parse(JSON.stringify(task)));
      }
    }
    return list;
  }

  async findActiveByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask | null> {
    for (const task of this.tasksMap.values()) {
      if (
        task.organizationId === organizationId &&
        task.propertyId === propertyId &&
        task.unitId === unitId &&
        task.cleaningStatus !== 'available' &&
        task.cleaningStatus !== 'cancelled'
      ) {
        return JSON.parse(JSON.stringify(task));
      }
    }
    return null;
  }

  async findTasks(organizationId: string, propertyId: string, filters?: HousekeepingTaskFilters): Promise<HousekeepingTask[]> {
    const list: HousekeepingTask[] = [];
    for (const task of this.tasksMap.values()) {
      if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
        continue;
      }

      if (filters?.cleaningStatus && task.cleaningStatus !== filters.cleaningStatus) {
        continue;
      }

      if (filters?.inspectionStatus && task.inspectionStatus !== filters.inspectionStatus) {
        continue;
      }

      if (filters?.priority && task.priority !== filters.priority) {
        continue;
      }

      if (filters?.unitId && task.unitId !== filters.unitId) {
        continue;
      }

      if (filters?.assignedStaffId && task.assignedStaffId !== filters.assignedStaffId) {
        continue;
      }

      list.push(JSON.parse(JSON.stringify(task)));
    }

    // Ordenar por prioridade (urgent > high > normal > low) e depois createdAt asc
    const priorityOrder: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    list.sort((a, b) => {
      const pA = priorityOrder[a.priority] || 0;
      const pB = priorityOrder[b.priority] || 0;
      if (pA !== pB) return pB - pA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return list;
  }

  async delete(organizationId: string, propertyId: string, taskId: string): Promise<boolean> {
    const key = `${organizationId}_${propertyId}_${taskId}`;
    return this.tasksMap.delete(key);
  }
}

export const housekeepingRepository = new HousekeepingRepository();
