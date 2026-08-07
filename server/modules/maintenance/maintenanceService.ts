import { 
  MaintenanceTask, 
  MaintenanceHistory, 
  CreateMaintenanceTaskDTO, 
  UpdateMaintenanceTaskDTO, 
  MaintenanceTaskFilters, 
  MaintenanceDashboardSummary 
} from './maintenanceTypes.ts';
import { maintenanceRepository, IMaintenanceRepository } from './maintenanceRepository.ts';
import { pmsService } from '../pms/pmsService.ts';
import { timelineService } from '../crm/timelineService.ts';
import { contextService } from '../ai/contextService.ts';

export class MaintenanceService {
  constructor(private repo: IMaintenanceRepository = maintenanceRepository) {}

  /**
   * Criar Ordem de Serviço de Manutenção.
   * Ao criar a tarefa de manutenção, a UH é imediatamente bloqueada e colocada em status 'maintenance' no PMS.
   */
  async createTask(
    organizationId: string, 
    propertyId: string, 
    dto: CreateMaintenanceTaskDTO
  ): Promise<MaintenanceTask> {
    const unit = await pmsService.getUnitById(organizationId, propertyId, dto.unitId);
    if (!unit) {
      throw new Error(`UH com ID '${dto.unitId}' não foi encontrada no PMS.`);
    }

    // Verificar se já existe manutenção ativa para esta UH
    const existingActive = await this.repo.findActiveTaskByUnitId(organizationId, propertyId, dto.unitId);
    if (existingActive) {
      throw new Error(`A UH '${unit.unitNumber}' já possui uma ordem de manutenção ativa (Task ID: ${existingActive.taskId}).`);
    }

    const taskId = `maint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const task: MaintenanceTask = {
      taskId,
      organizationId,
      propertyId,
      unitId: dto.unitId,
      unitNumber: dto.unitNumber || unit.unitNumber,
      reservationId: dto.reservationId,
      guestId: dto.guestId,
      status: 'reported',
      category: dto.category,
      priority: dto.priority || 'normal',
      description: dto.description,
      reportedBy: dto.reportedBy || 'Operador/Recepção',
      assignedTechnicianId: dto.assignedTechnicianId,
      assignedTechnicianName: dto.assignedTechnicianName,
      slaMinutes: dto.slaMinutes || 120,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now
    };

    const saved = await this.repo.saveTask(task);

    // Salvar no histórico
    await this.repo.saveHistory({
      historyId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      newStatus: 'reported',
      changedBy: dto.reportedBy || 'Sistema',
      notes: `Ordem de manutenção criada: ${dto.description}`,
      timestamp: now
    });

    // 1. Atualizar status da UH para 'maintenance' no PMS (Bloqueio)
    await pmsService.updateUnitStatus(organizationId, propertyId, dto.unitId, 'maintenance');

    // 2. Se houver hóspede associado, publicar evento na Guest Timeline
    if (dto.guestId) {
      try {
        await timelineService.appendTimelineEvent(dto.guestId, {
          organizationId,
          propertyId,
          source: 'pms',
          eventType: 'housekeeping.note', // Evento operacional de unidade
          title: 'Manutenção Solicitada na UH',
          unitNumber: unit.unitNumber,
          description: `Ordem de Manutenção (${dto.category.toUpperCase()}) aberta para a UH ${unit.unitNumber}: ${dto.description}`,
          metadata: { taskId, priority: saved.priority, status: saved.status }
        });
      } catch (err: any) {
        console.warn('⚠️ Erro ao registrar evento de manutenção na Guest Timeline:', err?.message || err);
      }
    }

    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  /**
   * Atualizar Status / Transição de Estado da Ordem de Manutenção
   * Fluxo: reported -> triage -> assigned -> in_progress -> waiting_parts -> inspection -> completed -> closed (ou cancelled)
   */
  async updateTaskStatus(
    organizationId: string, 
    propertyId: string, 
    taskId: string, 
    dto: UpdateMaintenanceTaskDTO
  ): Promise<MaintenanceTask> {
    const task = await this.repo.findTaskById(organizationId, propertyId, taskId);
    if (!task) {
      throw new Error(`Ordem de Manutenção com ID '${taskId}' não foi encontrada.`);
    }

    const previousStatus = task.status;
    const now = new Date().toISOString();

    if (dto.status) task.status = dto.status;
    if (dto.priority) task.priority = dto.priority;
    if (dto.category) task.category = dto.category;
    if (dto.assignedTechnicianId) task.assignedTechnicianId = dto.assignedTechnicianId;
    if (dto.assignedTechnicianName) task.assignedTechnicianName = dto.assignedTechnicianName;
    if (dto.description) task.description = dto.description;
    if (dto.notes) task.notes = dto.notes;

    if (dto.status === 'in_progress' && !task.startedAt) {
      task.startedAt = now;
    }

    if ((dto.status === 'completed' || dto.status === 'closed') && !task.completedAt) {
      task.completedAt = now;
    }

    if (dto.status === 'closed' && !task.closedAt) {
      task.closedAt = now;
    }

    task.updatedAt = now;

    const updated = await this.repo.saveTask(task);

    // Registrar no histórico
    await this.repo.saveHistory({
      historyId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      previousStatus,
      newStatus: updated.status,
      changedBy: dto.changedBy || 'Técnico/Operador',
      notes: dto.notes || `Status alterado de '${previousStatus}' para '${updated.status}'`,
      timestamp: now
    });

    // Se a ordem for concluída ou fechada (ou cancelada), liberar o bloqueio de manutenção da UH no PMS
    if (updated.status === 'completed' || updated.status === 'closed' || updated.status === 'cancelled') {
      // Retorna a UH para 'clean' / aguardando vistoria no PMS para liberação limpa
      await pmsService.updateUnitStatus(organizationId, propertyId, task.unitId, 'clean');
    }

    // Registrar evento na Guest Timeline se houver hóspede associado
    if (task.guestId) {
      try {
        await timelineService.appendTimelineEvent(task.guestId, {
          organizationId,
          propertyId,
          source: 'pms',
          eventType: 'housekeeping.note',
          title: 'Atualização de Manutenção',
          unitNumber: task.unitNumber,
          description: `Ordem de manutenção da UH ${task.unitNumber}: Status atualizado para '${updated.status.toUpperCase()}'`,
          metadata: { taskId, status: updated.status, priority: updated.priority }
        });
      } catch (err: any) {
        console.warn('⚠️ Erro ao registrar atualização na Guest Timeline:', err?.message || err);
      }
    }

    contextService.invalidateCache(organizationId, propertyId);
    return updated;
  }

  /**
   * Listar Ordens de Manutenção
   */
  async listTasks(
    organizationId: string, 
    propertyId: string, 
    filters?: MaintenanceTaskFilters
  ): Promise<MaintenanceTask[]> {
    return this.repo.findTasks(organizationId, propertyId, filters);
  }

  /**
   * Obter Ordem por ID
   */
  async getTaskById(organizationId: string, propertyId: string, taskId: string): Promise<MaintenanceTask | null> {
    return this.repo.findTaskById(organizationId, propertyId, taskId);
  }

  /**
   * Obter Histórico da Tarefa
   */
  async getTaskHistory(taskId: string): Promise<MaintenanceHistory[]> {
    return this.repo.getHistoryByTaskId(taskId);
  }

  /**
   * Obter Resumo Estatístico para o Dashboard de Manutenção
   */
  async getDashboardSummary(organizationId: string, propertyId: string): Promise<MaintenanceDashboardSummary> {
    const allTasks = await this.repo.findTasks(organizationId, propertyId);
    const units = await pmsService.listUnits(organizationId, propertyId);

    const openTasks = allTasks.filter(t => !['completed', 'closed', 'cancelled'].includes(t.status));
    const completedTasks = allTasks.filter(t => t.status === 'completed' || t.status === 'closed');
    const criticalTasks = openTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const backlogTasks = openTasks.filter(t => t.status === 'reported' || t.status === 'triage');
    const waitingPartsTasks = openTasks.filter(t => t.status === 'waiting_parts');

    const totalSla = allTasks.reduce((acc, t) => acc + (t.slaMinutes || 120), 0);
    const averageSlaMinutes = allTasks.length > 0 ? Math.round(totalSla / allTasks.length) : 120;

    // Calcular tempo médio de resolução (em minutos) para tarefas concluídas
    let totalResolutionMinutes = 0;
    let resolvedCount = 0;
    completedTasks.forEach(t => {
      if (t.startedAt && t.completedAt) {
        const start = new Date(t.startedAt).getTime();
        const end = new Date(t.completedAt).getTime();
        const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
        totalResolutionMinutes += diffMinutes;
        resolvedCount++;
      }
    });

    const averageResolutionMinutes = resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : 45;
    const unavailableRoomsCount = units.filter(u => u.status === 'maintenance' || u.status === 'out_of_service').length;

    return {
      openTasksCount: openTasks.length,
      completedTasksCount: completedTasks.length,
      criticalTasksCount: criticalTasks.length,
      backlogTasksCount: backlogTasks.length,
      averageSlaMinutes,
      averageResolutionMinutes,
      unavailableRoomsCount,
      waitingPartsRoomsCount: waitingPartsTasks.length
    };
  }

  /**
   * Retornar Resumo Read-Only para o ContextService da IA
   */
  async getMaintenanceSummaryForAI(organizationId: string, propertyId: string): Promise<any> {
    const summary = await this.getDashboardSummary(organizationId, propertyId);
    const openTasks = await this.repo.findTasks(organizationId, propertyId, { priority: 'urgent' });

    return {
      summary,
      urgentTasksCount: summary.criticalTasksCount,
      urgentUnits: openTasks.map(t => t.unitNumber),
      backlogLength: summary.backlogTasksCount
    };
  }
}

export const maintenanceService = new MaintenanceService();
