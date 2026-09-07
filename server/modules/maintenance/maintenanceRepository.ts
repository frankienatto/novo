import { 
  MaintenanceTask, 
  MaintenanceHistory, 
  MaintenanceTaskFilters 
} from './maintenanceTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IMaintenanceRepository {
  saveTask(task: MaintenanceTask): Promise<MaintenanceTask>;
  findTaskById(organizationId: string, propertyId: string, taskId: string): Promise<MaintenanceTask | null>;
  findTasks(organizationId: string, propertyId: string, filters?: MaintenanceTaskFilters): Promise<MaintenanceTask[]>;
  findActiveTaskByUnitId(organizationId: string, propertyId: string, unitId: string): Promise<MaintenanceTask | null>;
  saveHistory(history: MaintenanceHistory): Promise<MaintenanceHistory>;
  getHistoryByTaskId(taskId: string): Promise<MaintenanceHistory[]>;
  deleteTask?(organizationId: string, propertyId: string, taskId: string): Promise<boolean>;
}

export class MaintenanceRepository implements IMaintenanceRepository {
  private get db() {
    return getAdminFirestore();
  }

  async saveTask(task: MaintenanceTask): Promise<MaintenanceTask> {
    if (!task.organizationId || !task.propertyId || !task.taskId) {
      throw new Error("Invalid MaintenanceTask: organizationId, propertyId and taskId are required.");
    }

    // Verificar se o documento já existe para garantir integridade de multi-tenancy
    const docRef = this.db.collection('tasks').doc(task.taskId);
    const existingSnap = await docRef.get();

    if (existingSnap.exists) {
      const existingData = existingSnap.data() as MaintenanceTask;
      if (
        existingData.organizationId !== task.organizationId ||
        existingData.propertyId !== task.propertyId
      ) {
        throw new Error("Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.");
      }
    }

    const taskToSave: MaintenanceTask = {
      ...task,
      updatedAt: task.updatedAt || new Date().toISOString(),
      createdAt: task.createdAt || new Date().toISOString()
    };

    await docRef.set(taskToSave, { merge: true });
    return JSON.parse(JSON.stringify(taskToSave));
  }

  async findTaskById(organizationId: string, propertyId: string, taskId: string): Promise<MaintenanceTask | null> {
    if (!organizationId || !propertyId || !taskId) return null;

    const docSnap = await this.db.collection('tasks').doc(taskId).get();
    if (!docSnap.exists) return null;

    const task = docSnap.data() as MaintenanceTask;
    if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
      return null;
    }

    return JSON.parse(JSON.stringify(task));
  }

  async findTasks(
    organizationId: string, 
    propertyId: string, 
    filters?: MaintenanceTaskFilters
  ): Promise<MaintenanceTask[]> {
    if (!organizationId || !propertyId) return [];

    let query = this.db.collection('tasks')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters?.priority) {
      query = query.where('priority', '==', filters.priority);
    }
    if (filters?.unitId) {
      query = query.where('unitId', '==', filters.unitId);
    }
    if (filters?.assignedTechnicianId) {
      query = query.where('assignedTechnicianId', '==', filters.assignedTechnicianId);
    }

    const snapshot = await query.get();
    const results: MaintenanceTask[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as MaintenanceTask;
      // Garantir que pertence ao domínio de manutenção (deve ter category e status válidos de manutenção)
      if (data.category && data.status) {
        results.push(data);
      }
    });

    // Ordenar por data de criação decrescente
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findActiveTaskByUnitId(
    organizationId: string, 
    propertyId: string, 
    unitId: string
  ): Promise<MaintenanceTask | null> {
    if (!organizationId || !propertyId || !unitId) return null;

    const activeStatuses = ['reported', 'triage', 'assigned', 'in_progress', 'waiting_parts', 'inspection'];
    
    const snapshot = await this.db.collection('tasks')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .where('unitId', '==', unitId)
      .get();

    for (const doc of snapshot.docs) {
      const task = doc.data() as MaintenanceTask;
      if (task.status && activeStatuses.includes(task.status)) {
        return JSON.parse(JSON.stringify(task));
      }
    }

    return null;
  }

  async saveHistory(historyItem: MaintenanceHistory): Promise<MaintenanceHistory> {
    if (!historyItem.taskId || !historyItem.historyId) {
      throw new Error("Invalid MaintenanceHistory: taskId and historyId are required.");
    }

    const historyToSave: MaintenanceHistory = {
      ...historyItem,
      timestamp: historyItem.timestamp || new Date().toISOString()
    };

    await this.db
      .collection('tasks')
      .doc(historyItem.taskId)
      .collection('history')
      .doc(historyItem.historyId)
      .set(historyToSave, { merge: true });

    return JSON.parse(JSON.stringify(historyToSave));
  }

  async getHistoryByTaskId(taskId: string): Promise<MaintenanceHistory[]> {
    if (!taskId) return [];

    const snapshot = await this.db
      .collection('tasks')
      .doc(taskId)
      .collection('history')
      .get();

    const historyList: MaintenanceHistory[] = [];
    snapshot.forEach(doc => {
      historyList.push(doc.data() as MaintenanceHistory);
    });

    return historyList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async deleteTask(organizationId: string, propertyId: string, taskId: string): Promise<boolean> {
    if (!organizationId || !propertyId || !taskId) return false;

    const docSnap = await this.db.collection('tasks').doc(taskId).get();
    if (!docSnap.exists) return false;

    const task = docSnap.data() as MaintenanceTask;
    if (task.organizationId !== organizationId || task.propertyId !== propertyId) {
      return false;
    }

    await this.db.collection('tasks').doc(taskId).delete();
    return true;
  }
}

// Exportar instância canônica e manter compatibilidade com nomes legados
export const InMemoryMaintenanceRepository = MaintenanceRepository;
export const maintenanceRepository = new MaintenanceRepository();

