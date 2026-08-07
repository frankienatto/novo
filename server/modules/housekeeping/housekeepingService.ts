import { 
  HousekeepingTask, 
  CleaningStatus, 
  InspectionStatus, 
  TaskPriority,
  CreateHousekeepingTaskDTO, 
  UpdateHousekeepingTaskDTO, 
  HousekeepingTaskFilters, 
  HousekeepingDashboardSummary 
} from './housekeepingTypes.ts';
import { IHousekeepingRepository, housekeepingRepository } from './housekeepingRepository.ts';
import { IRoomRepository, roomRepository } from '../pms/roomRepository.ts';
import { timelineService } from '../crm/timelineService.ts';
import { contextService } from '../ai/contextService.ts';

export class HousekeepingService {
  private repo: IHousekeepingRepository;
  private roomRepo: IRoomRepository;

  constructor(
    repo: IHousekeepingRepository = housekeepingRepository,
    roomRepo: IRoomRepository = roomRepository
  ) {
    this.repo = repo;
    this.roomRepo = roomRepo;
  }

  /**
   * Criar uma nova tarefa de governança/limpeza
   */
  async createTask(
    organizationId: string,
    propertyId: string,
    dto: CreateHousekeepingTaskDTO
  ): Promise<HousekeepingTask> {
    if (!dto.unitId) {
      throw new Error('O identificador da unidade (unitId) é obrigatório.');
    }

    // 1. Validar se a UH existe na propriedade
    const unit = await this.roomRepo.findUnitById(organizationId, propertyId, dto.unitId);
    if (!unit) {
      throw new Error(`Unidade Hoteleira [${dto.unitId}] não foi encontrada.`);
    }

    // 2. Regra: Quarto em manutenção ou fora de serviço não gera tarefa de limpeza
    if (unit.status === 'maintenance' || unit.status === 'out_of_service') {
      const statusLabel = unit.status === 'maintenance' ? 'Manutenção' : 'Fora de Serviço';
      throw new Error(`Não é possível criar tarefa de limpeza. A UH '${unit.unitNumber}' está em status de ${statusLabel}.`);
    }

    // 3. Verificar se já existe uma tarefa ativa para esta UH
    const existingActive = await this.repo.findActiveByUnitId(organizationId, propertyId, dto.unitId);
    if (existingActive) {
      return existingActive; // Retorna tarefa ativa já existente sem duplicar
    }

    const taskId = `task_hk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const initialCleaningStatus: CleaningStatus = dto.assignedStaffId ? 'assigned' : 'dirty';

    const newTask: HousekeepingTask = {
      taskId,
      organizationId,
      propertyId,
      unitId: dto.unitId,
      unitNumber: dto.unitNumber || unit.unitNumber,
      reservationId: dto.reservationId,
      guestId: dto.guestId,
      cleaningStatus: initialCleaningStatus,
      inspectionStatus: 'pending',
      priority: dto.priority || 'normal',
      assignedStaffId: dto.assignedStaffId,
      assignedStaffName: dto.assignedStaffName,
      notes: dto.notes,
      slaMinutes: dto.slaMinutes || 45,
      createdAt: now,
      updatedAt: now
    };

    const saved = await this.repo.save(newTask);

    // Atualiza status da UH no PMS para 'dirty'
    await this.roomRepo.updateUnitStatus(organizationId, propertyId, dto.unitId, 'dirty');

    // Registrar evento na Guest Timeline se houver hóspede associado
    if (dto.guestId) {
      await timelineService.appendTimelineEvent(dto.guestId, {
        organizationId,
        propertyId,
        eventType: 'housekeeping.task_created',
        source: 'pms',
        title: 'Tarefa de Governança Criada',
        unitNumber: unit.unitNumber,
        description: `Tarefa de governança criada para a UH ${unit.unitNumber} (Prioridade: ${saved.priority.toUpperCase()})`,
        metadata: { taskId, priority: saved.priority, status: saved.cleaningStatus }
      }).catch(err => console.warn('Erro ao registrar timeline na criação de tarefa de governança:', err));
    }

    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  /**
   * Helper para criar tarefa de limpeza derivada de um Check-out de reserva
   */
  async createTaskForCheckout(
    organizationId: string,
    propertyId: string,
    unitId: string,
    unitNumber: string,
    reservationId?: string,
    guestId?: string,
    priority: TaskPriority = 'high'
  ): Promise<HousekeepingTask> {
    return this.createTask(organizationId, propertyId, {
      unitId,
      unitNumber,
      reservationId,
      guestId,
      priority,
      notes: `Limpeza pós Check-out da reserva ${reservationId || 'N/A'}`
    });
  }

  /**
   * Atualizar status da tarefa mantendo o fluxo operacional e histórico
   */
  async updateTaskStatus(
    organizationId: string,
    propertyId: string,
    taskId: string,
    dto: UpdateHousekeepingTaskDTO
  ): Promise<HousekeepingTask> {
    const task = await this.repo.findById(organizationId, propertyId, taskId);
    if (!task) {
      throw new Error(`Tarefa de governança [${taskId}] não foi encontrada.`);
    }

    // Validar status atual da UH no PMS
    const unit = await this.roomRepo.findUnitById(organizationId, propertyId, task.unitId);
    
    // Regra: Quarto bloqueado ou em manutenção não pode entrar em limpeza
    if (dto.cleaningStatus === 'cleaning') {
      if (unit && (unit.status === 'out_of_service' || unit.status === 'maintenance')) {
        throw new Error(`A UH '${task.unitNumber}' está bloqueada/manutenção (${unit.status}) e não pode entrar em limpeza.`);
      }
    }

    const now = new Date().toISOString();
    const updated: HousekeepingTask = {
      ...task,
      updatedAt: now
    };

    if (dto.priority) updated.priority = dto.priority;
    if (dto.notes) updated.notes = dto.notes;
    if (dto.assignedStaffId) updated.assignedStaffId = dto.assignedStaffId;
    if (dto.assignedStaffName) updated.assignedStaffName = dto.assignedStaffName;

    // Transições de Status de Limpeza (Flow: dirty -> assigned -> cleaning -> clean -> inspection -> available)
    if (dto.cleaningStatus) {
      updated.cleaningStatus = dto.cleaningStatus;

      if (dto.cleaningStatus === 'cleaning' && !task.startedAt) {
        updated.startedAt = now;
      }

      if ((dto.cleaningStatus === 'clean' || dto.cleaningStatus === 'inspection') && !task.completedAt) {
        updated.completedAt = now;
      }

      if (dto.cleaningStatus === 'available') {
        updated.completedAt = updated.completedAt || now;
        updated.inspectedAt = now;
        updated.inspectionStatus = 'passed';

        // Atualizar UH no PMS para 'clean'
        await this.roomRepo.updateUnitStatus(organizationId, propertyId, task.unitId, 'clean');
      }
    }

    if (dto.inspectionStatus) {
      updated.inspectionStatus = dto.inspectionStatus;
      if (dto.inspectionStatus === 'passed') {
        updated.inspectedAt = now;
        updated.cleaningStatus = 'available';
        await this.roomRepo.updateUnitStatus(organizationId, propertyId, task.unitId, 'clean');
      } else if (dto.inspectionStatus === 'failed') {
        updated.cleaningStatus = 'dirty'; // Retorna para limpeza em caso de falha na inspeção
      }
    }

    const saved = await this.repo.save(updated);

    // Registrar evento na Guest Timeline se houver hóspede associado
    if (task.guestId) {
      await timelineService.appendTimelineEvent(task.guestId, {
        organizationId,
        propertyId,
        eventType: 'housekeeping.task_updated',
        source: 'pms',
        title: 'Atualização de Governança',
        unitNumber: task.unitNumber,
        description: `Atualização de governança na UH ${task.unitNumber}: Status -> ${saved.cleaningStatus.toUpperCase()}`,
        metadata: { taskId, cleaningStatus: saved.cleaningStatus, inspectionStatus: saved.inspectionStatus }
      }).catch(err => console.warn('Erro ao registrar timeline na atualização de tarefa:', err));
    }

    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  /**
   * Cancelar tarefa preservando histórico
   */
  async cancelTask(
    organizationId: string,
    propertyId: string,
    taskId: string,
    reason?: string
  ): Promise<HousekeepingTask> {
    const task = await this.repo.findById(organizationId, propertyId, taskId);
    if (!task) {
      throw new Error(`Tarefa de governança [${taskId}] não encontrada para cancelamento.`);
    }

    const updated: HousekeepingTask = {
      ...task,
      cleaningStatus: 'cancelled',
      notes: reason ? `${task.notes || ''} [Cancelada: ${reason}]`.trim() : task.notes,
      updatedAt: new Date().toISOString()
    };

    const saved = await this.repo.save(updated);
    contextService.invalidateCache(organizationId, propertyId);
    return saved;
  }

  /**
   * Listar tarefas com filtros
   */
  async listTasks(
    organizationId: string,
    propertyId: string,
    filters?: HousekeepingTaskFilters
  ): Promise<HousekeepingTask[]> {
    return this.repo.findTasks(organizationId, propertyId, filters);
  }

  /**
   * Calcular Resumo do Dashboard de Governança
   */
  async getDashboardSummary(
    organizationId: string,
    propertyId: string
  ): Promise<HousekeepingDashboardSummary> {
    const units = await this.roomRepo.findUnits(organizationId, propertyId);
    const tasks = await this.repo.findTasks(organizationId, propertyId);

    let totalUnits = units.length;
    let availableUnits = 0;
    let dirtyUnits = 0;
    let cleaningInProcess = 0;
    let awaitingInspection = 0;
    let blockedOrMaintenance = 0;

    units.forEach(u => {
      if (u.status === 'clean') availableUnits++;
      else if (u.status === 'dirty') dirtyUnits++;
      else if (u.status === 'inspected') awaitingInspection++;
      else if (u.status === 'maintenance' || u.status === 'out_of_service') blockedOrMaintenance++;
    });

    let pendingTasksCount = 0;
    let urgentTasksCount = 0;
    let totalSlaMinutes = 0;
    let completedCount = 0;

    tasks.forEach(t => {
      if (t.cleaningStatus !== 'available' && t.cleaningStatus !== 'cancelled') {
        pendingTasksCount++;
        if (t.priority === 'urgent' || t.priority === 'high') {
          urgentTasksCount++;
        }
      }

      if (t.cleaningStatus === 'cleaning') {
        cleaningInProcess++;
      }

      if (t.cleaningStatus === 'inspection' || t.inspectionStatus === 'pending') {
        if (t.cleaningStatus === 'clean') awaitingInspection++;
      }

      if (t.startedAt && t.completedAt) {
        const diffMs = new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime();
        totalSlaMinutes += Math.max(1, Math.round(diffMs / (1000 * 60)));
        completedCount++;
      }
    });

    const averageSlaCompletionMinutes = completedCount > 0 ? Math.round(totalSlaMinutes / completedCount) : 35;

    return {
      totalUnits,
      availableUnits,
      dirtyUnits,
      cleaningInProcess,
      awaitingInspection,
      blockedOrMaintenance,
      pendingTasksCount,
      urgentTasksCount,
      averageSlaCompletionMinutes
    };
  }

  /**
   * Resumo Operacional de Governança para o ContextService da IA (Read-Only)
   */
  async getHousekeepingSummaryForAI(organizationId: string, propertyId: string) {
    const summary = await this.getDashboardSummary(organizationId, propertyId);
    const activeTasks = await this.repo.findTasks(organizationId, propertyId, {
      cleaningStatus: 'dirty'
    });

    return {
      summary,
      queueLength: activeTasks.length,
      urgentUnits: activeTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').map(t => t.unitNumber),
      slaStandardMinutes: 45
    };
  }
}

export const housekeepingService = new HousekeepingService();
