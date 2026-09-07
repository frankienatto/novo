import { HousekeepingTask, HousekeepingTaskFilters } from './housekeepingTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IHousekeepingRepository {
  save(task: HousekeepingTask): Promise<HousekeepingTask>;
  findById(organizationId: string, propertyId: string, taskId: string): Promise<HousekeepingTask | null>;
  findByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask[]>;
  findActiveByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask | null>;
  findTasks(organizationId: string, propertyId: string, filters?: HousekeepingTaskFilters): Promise<HousekeepingTask[]>;
  delete(organizationId: string, propertyId: string, taskId: string): Promise<boolean>;
  seedDevData?(): Promise<void>;
}

export class HousekeepingRepository implements IHousekeepingRepository {
  private get db() {
    return getAdminFirestore();
  }

  async save(task: HousekeepingTask): Promise<HousekeepingTask> {
    if (!task.organizationId || !task.propertyId || !task.taskId) {
      throw new Error("Invalid HousekeepingTask: organizationId, propertyId and taskId are required.");
    }

    // Verificar se o documento já existe para garantir integridade de multi-tenancy
    const docRef = this.db.collection('tasks').doc(task.taskId);
    const existingSnap = await docRef.get();
    
    if (existingSnap.exists) {
      const existingData = existingSnap.data() as HousekeepingTask;
      if (
        existingData.organizationId !== task.organizationId ||
        existingData.propertyId !== task.propertyId
      ) {
        throw new Error("Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.");
      }
    }

    const taskToSave: HousekeepingTask = {
      ...task,
      updatedAt: task.updatedAt || new Date().toISOString(),
      createdAt: task.createdAt || new Date().toISOString()
    };

    await docRef.set(taskToSave, { merge: true });
    return JSON.parse(JSON.stringify(taskToSave));
  }

  async findById(organizationId: string, propertyId: string, taskId: string): Promise<HousekeepingTask | null> {
    if (!organizationId || !propertyId || !taskId) return null;

    const docSnap = await this.db.collection('tasks').doc(taskId).get();
    if (!docSnap.exists) return null;

    const task = docSnap.data() as HousekeepingTask;
    if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
      return null;
    }

    return JSON.parse(JSON.stringify(task));
  }

  async findByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask[]> {
    if (!organizationId || !propertyId || !unitId) return [];

    const snapshot = await this.db.collection('tasks')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .where('unitId', '==', unitId)
      .get();

    const list: HousekeepingTask[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data() as HousekeepingTask);
    });

    return list;
  }

  async findActiveByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<HousekeepingTask | null> {
    if (!organizationId || !propertyId || !unitId) return null;

    const tasks = await this.findByUnitId(organizationId, propertyId, unitId);
    for (const task of tasks) {
      if (
        task.cleaningStatus !== 'available' &&
        task.cleaningStatus !== 'cancelled'
      ) {
        return JSON.parse(JSON.stringify(task));
      }
    }
    return null;
  }

  async findTasks(organizationId: string, propertyId: string, filters?: HousekeepingTaskFilters): Promise<HousekeepingTask[]> {
    if (!organizationId || !propertyId) return [];

    let query = this.db.collection('tasks')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (filters?.unitId) {
      query = query.where('unitId', '==', filters.unitId);
    }
    if (filters?.assignedStaffId) {
      query = query.where('assignedStaffId', '==', filters.assignedStaffId);
    }
    if (filters?.cleaningStatus) {
      query = query.where('cleaningStatus', '==', filters.cleaningStatus);
    }
    if (filters?.priority) {
      query = query.where('priority', '==', filters.priority);
    }

    const snapshot = await query.get();
    const list: HousekeepingTask[] = [];

    snapshot.forEach(doc => {
      const task = doc.data() as HousekeepingTask;
      if (filters?.inspectionStatus && task.inspectionStatus !== filters.inspectionStatus) {
        return;
      }
      list.push(task);
    });

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
    if (!organizationId || !propertyId || !taskId) return false;

    const docSnap = await this.db.collection('tasks').doc(taskId).get();
    if (!docSnap.exists) return false;

    const task = docSnap.data() as HousekeepingTask;
    if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
      return false;
    }

    await this.db.collection('tasks').doc(taskId).delete();
    return true;
  }
}

export const housekeepingRepository = new HousekeepingRepository();

