import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { HousekeepingRepository } from './housekeepingRepository.ts';
import { HousekeepingTask } from './housekeepingTypes.ts';
import { HousekeepingService } from './housekeepingService.ts';

// In-memory Firestore store para ambiente de teste unitário
const mockFirestoreStore: Record<string, Record<string, any>> = {
  tasks: {},
  rooms: {},
};

function createMockFirestore() {
  return {
    collection: (collectionName: string) => {
      if (!mockFirestoreStore[collectionName]) {
        mockFirestoreStore[collectionName] = {};
      }
      const col = mockFirestoreStore[collectionName];

      const makeQuery = (filters: Array<{ field: string; op: string; val: any }>) => ({
        where: (field: string, op: string, val: any) => {
          return makeQuery([...filters, { field, op, val }]);
        },
        get: async () => {
          const matches = Object.values(col).filter((item: any) => {
            return filters.every((f) => {
              if (f.op === '==') return item[f.field] === f.val;
              return true;
            });
          });
          return {
            empty: matches.length === 0,
            docs: matches.map((data) => ({
              data: () => JSON.parse(JSON.stringify(data)),
            })),
            forEach: (cb: (doc: any) => void) => {
              matches.forEach((data) => cb({ data: () => JSON.parse(JSON.stringify(data)) }));
            },
          };
        },
      });

      return {
        doc: (docId: string) => ({
          get: async () => ({
            exists: !!col[docId],
            data: () => (col[docId] ? JSON.parse(JSON.stringify(col[docId])) : undefined),
          }),
          set: async (data: any, options?: { merge?: boolean }) => {
            if (options?.merge && col[docId]) {
              col[docId] = JSON.parse(JSON.stringify({ ...col[docId], ...data }));
            } else {
              col[docId] = JSON.parse(JSON.stringify({ ...data }));
            }
          },
          delete: async () => {
            delete col[docId];
          },
        }),
        get: async () => ({
          docs: Object.values(col).map((data) => ({
            data: () => JSON.parse(JSON.stringify(data)),
          })),
          forEach: (cb: (doc: any) => void) => {
            Object.values(col).forEach((data) => cb({ data: () => JSON.parse(JSON.stringify(data)) }));
          },
        }),
        where: (field: string, op: string, val: any) => {
          return makeQuery([{ field, op, val }]);
        },
      };
    },
  };
}

vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => createMockFirestore(),
}));

describe('HousekeepingRepository - Firestore Persistence Tests', () => {
  let repo: HousekeepingRepository;

  const orgA = `org_hk_test_a_${Date.now()}`;
  const orgB = `org_hk_test_b_${Date.now()}`;
  const propA = `prop_hk_test_a_${Date.now()}`;
  const propB = `prop_hk_test_b_${Date.now()}`;

  const task1Id = `task_hk_001_${Date.now()}`;
  const task2Id = `task_hk_002_${Date.now()}`;
  const task3Id = `task_hk_003_${Date.now()}`;
  const taskBId = `task_hk_b_${Date.now()}`;

  beforeAll(async () => {
    repo = new HousekeepingRepository();
  });

  afterAll(async () => {
    await repo.delete(orgA, propA, task1Id);
    await repo.delete(orgA, propA, task2Id);
    await repo.delete(orgA, propA, task3Id);
    await repo.delete(orgB, propB, taskBId);
  });

  // 1. Criação de Tarefa
  it('1. criação de tarefa', async () => {
    const task: HousekeepingTask = {
      taskId: task1Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_101',
      unitNumber: '101',
      assignedStaffId: 'staff_ana',
      assignedStaffName: 'Ana Silva',
      cleaningStatus: 'dirty',
      inspectionStatus: 'pending',
      priority: 'high',
      notes: 'Hóspede fez check-out hoje',
      slaMinutes: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.save(task);
    expect(saved).toBeDefined();
    expect(saved.taskId).toBe(task1Id);
    expect(saved.cleaningStatus).toBe('dirty');
    expect(saved.priority).toBe('high');
    expect(saved.slaMinutes).toBe(45);
  });

  // 2. Recuperação
  it('2. recuperação por id', async () => {
    const found = await repo.findById(orgA, propA, task1Id);
    expect(found).not.toBeNull();
    expect(found?.taskId).toBe(task1Id);
    expect(found?.assignedStaffName).toBe('Ana Silva');
    expect(found?.unitNumber).toBe('101');
  });

  // 3. Atualização
  it('3. atualização de tarefa', async () => {
    const existing = await repo.findById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const updatedTask: HousekeepingTask = {
      ...existing!,
      cleaningStatus: 'cleaning',
      notes: 'Limpeza iniciada pela camareira',
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.save(updatedTask);
    expect(saved.cleaningStatus).toBe('cleaning');
    expect(saved.notes).toBe('Limpeza iniciada pela camareira');

    const verified = await repo.findById(orgA, propA, task1Id);
    expect(verified?.cleaningStatus).toBe('cleaning');
  });

  // 4. Exclusão
  it('4. exclusão de tarefa', async () => {
    const tempTaskId = `task_temp_${Date.now()}`;
    await repo.save({
      taskId: tempTaskId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_temp',
      unitNumber: '999',
      cleaningStatus: 'clean',
      inspectionStatus: 'passed',
      priority: 'low',
      slaMinutes: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.delete(orgA, propA, tempTaskId);
    expect(deleted).toBe(true);

    const check = await repo.findById(orgA, propA, tempTaskId);
    expect(check).toBeNull();
  });

  // 5. Listagem
  it('5. listagem de tarefas', async () => {
    const task2: HousekeepingTask = {
      taskId: task2Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_102',
      unitNumber: '102',
      assignedStaffId: 'staff_carlos',
      assignedStaffName: 'Carlos Souza',
      cleaningStatus: 'dirty',
      inspectionStatus: 'pending',
      priority: 'urgent',
      slaMinutes: 45,
      createdAt: new Date(Date.now() - 10000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.save(task2);

    const list = await repo.findTasks(orgA, propA);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((t) => t.taskId === task1Id)).toBe(true);
    expect(list.some((t) => t.taskId === task2Id)).toBe(true);
  });

  // 6. Filtros existentes
  it('6. filtros existentes (unitId, cleaningStatus, priority, assignedStaffId)', async () => {
    const filterByUnit = await repo.findTasks(orgA, propA, { unitId: 'unit_101' });
    expect(filterByUnit.every((t) => t.unitId === 'unit_101')).toBe(true);

    const filterByStatus = await repo.findTasks(orgA, propA, { cleaningStatus: 'cleaning' });
    expect(filterByStatus.every((t) => t.cleaningStatus === 'cleaning')).toBe(true);

    const filterByStaff = await repo.findTasks(orgA, propA, { assignedStaffId: 'staff_carlos' });
    expect(filterByStaff.every((t) => t.assignedStaffId === 'staff_carlos')).toBe(true);
  });

  // 7. Status
  it('7. status de limpeza e inspeção', async () => {
    const task = await repo.findById(orgA, propA, task1Id);
    expect(task).not.toBeNull();

    const inspectedTask: HousekeepingTask = {
      ...task!,
      cleaningStatus: 'clean',
      inspectionStatus: 'passed',
      inspectedAt: new Date().toISOString(),
    };
    await repo.save(inspectedTask);

    const result = await repo.findById(orgA, propA, task1Id);
    expect(result?.cleaningStatus).toBe('clean');
    expect(result?.inspectionStatus).toBe('passed');
    expect(result?.inspectedAt).toBeDefined();
  });

  // 8. Prioridade e ordenação
  it('8. prioridade e ordenação (urgent > high > normal > low)', async () => {
    const task3: HousekeepingTask = {
      taskId: task3Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_103',
      unitNumber: '103',
      cleaningStatus: 'dirty',
      inspectionStatus: 'pending',
      priority: 'low',
      slaMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.save(task3);

    const allTasks = await repo.findTasks(orgA, propA);
    // task2 is urgent, task1 is high, task3 is low
    const urgentIdx = allTasks.findIndex((t) => t.taskId === task2Id);
    const highIdx = allTasks.findIndex((t) => t.taskId === task1Id);
    const lowIdx = allTasks.findIndex((t) => t.taskId === task3Id);

    expect(urgentIdx).toBeLessThan(highIdx);
    expect(highIdx).toBeLessThan(lowIdx);
  });

  // 9. Atribuição de funcionário
  it('9. atribuição de funcionário', async () => {
    const task = await repo.findById(orgA, propA, task3Id);
    expect(task).not.toBeNull();

    const assigned = await repo.save({
      ...task!,
      assignedStaffId: 'staff_mariana',
      assignedStaffName: 'Mariana Lima',
    });

    expect(assigned.assignedStaffId).toBe('staff_mariana');
    expect(assigned.assignedStaffName).toBe('Mariana Lima');
  });

  // 10. Consulta por propriedade e UH (findByUnitId e findActiveByUnitId)
  it('10. consultas por UH/quarto e tarefa ativa', async () => {
    const uhTasks = await repo.findByUnitId(orgA, propA, 'unit_101');
    expect(uhTasks.length).toBeGreaterThanOrEqual(1);
    expect(uhTasks[0].unitId).toBe('unit_101');

    const activeTask = await repo.findActiveByUnitId(orgA, propA, 'unit_102');
    expect(activeTask).not.toBeNull();
    expect(activeTask?.unitId).toBe('unit_102');
    expect(activeTask?.cleaningStatus).toBe('dirty');
  });

  // 11. Multi-tenancy: Tenant A não acessa Tenant B
  it('11. Tenant A não acessa tarefas do Tenant B', async () => {
    await repo.save({
      taskId: taskBId,
      organizationId: orgB,
      propertyId: propB,
      unitId: 'unit_201',
      unitNumber: '201',
      cleaningStatus: 'dirty',
      inspectionStatus: 'pending',
      priority: 'high',
      slaMinutes: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Tentativa de Tenant A acessar tarefa de Tenant B por ID
    const crossTenantGet = await repo.findById(orgA, propA, taskBId);
    expect(crossTenantGet).toBeNull();

    // Listagem de Tenant A não contém tarefas de Tenant B
    const listA = await repo.findTasks(orgA, propA);
    expect(listA.some((t) => t.taskId === taskBId)).toBe(false);

    // Tentativa de Tenant A deletar tarefa de Tenant B
    const deleteResult = await repo.delete(orgA, propA, taskBId);
    expect(deleteResult).toBe(false);

    // Tarefa continua existindo no Tenant B
    const checkB = await repo.findById(orgB, propB, taskBId);
    expect(checkB).not.toBeNull();
  });

  // 12. Tentativa de alterar organizationId (Bloqueio)
  it('12. tentativa de alterar organizationId deve ser bloqueada', async () => {
    const existing = await repo.findById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const maliciousTask: HousekeepingTask = {
      ...existing!,
      organizationId: 'org_malicious_hijack',
    };

    await expect(repo.save(maliciousTask)).rejects.toThrow(
      'Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.'
    );
  });

  // 13. Tentativa de alterar propertyId (Bloqueio)
  it('13. tentativa de alterar propertyId deve ser bloqueada', async () => {
    const existing = await repo.findById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const maliciousTask: HousekeepingTask = {
      ...existing!,
      propertyId: 'prop_unauthorized',
    };

    await expect(repo.save(maliciousTask)).rejects.toThrow(
      'Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.'
    );
  });

  // 14. Entidade inexistente
  it('14. busca e deleção de entidade inexistente retornam null / false', async () => {
    const notFound = await repo.findById(orgA, propA, 'non_existent_task_id');
    expect(notFound).toBeNull();

    const deleteNotFound = await repo.delete(orgA, propA, 'non_existent_task_id');
    expect(deleteNotFound).toBe(false);
  });

  // 15. PERSISTÊNCIA REAL APÓS RECRIAÇÃO DA INSTÂNCIA (Obrigatório)
  it('15. persistência real após destruição e recriação da instância do HousekeepingRepository', async () => {
    const persistentTaskId = `task_persist_${Date.now()}`;
    const persistentTask: HousekeepingTask = {
      taskId: persistentTaskId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_301',
      unitNumber: '301',
      cleaningStatus: 'clean',
      inspectionStatus: 'pending',
      priority: 'urgent',
      slaMinutes: 45,
      notes: 'Validando persistência durável no Firestore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Salva com a instância 1
    const instance1 = new HousekeepingRepository();
    await instance1.save(persistentTask);

    // 2. Destrói referência local
    const instance2 = new HousekeepingRepository();

    // 3. Recupera com a nova instância
    const retrieved = await instance2.findById(orgA, propA, persistentTaskId);

    // 4. Valida persistência independente de memória RAM
    expect(retrieved).not.toBeNull();
    expect(retrieved?.taskId).toBe(persistentTaskId);
    expect(retrieved?.unitId).toBe('unit_301');
    expect(retrieved?.notes).toBe('Validando persistência durável no Firestore');
    expect(retrieved?.priority).toBe('urgent');
  });

  // 16. Regressão dos consumidores existentes (HousekeepingService)
  it('16. regressão com HousekeepingService consumindo o Firestore HousekeepingRepository', async () => {
    const mockRoomRepo: any = {
      findUnitById: vi.fn().mockResolvedValue({ unitId: 'unit_101', unitNumber: '101', status: 'dirty' }),
      findUnits: vi.fn().mockResolvedValue([
        { unitId: 'unit_101', unitNumber: '101', status: 'dirty' },
        { unitId: 'unit_102', unitNumber: '102', status: 'clean' },
      ]),
      updateUnitStatus: vi.fn().mockResolvedValue({ unitId: 'unit_101', status: 'clean' }),
    };

    const service = new HousekeepingService(repo, mockRoomRepo);

    // Listar tarefas via service
    const tasks = await service.listTasks(orgA, propA);
    expect(tasks).toBeDefined();
    expect(tasks.length).toBeGreaterThan(0);

    // Obter visão geral de status via getDashboardSummary
    const summary = await service.getDashboardSummary(orgA, propA);
    expect(summary).toBeDefined();
    expect(summary.totalUnits).toBe(2);
  });
});
