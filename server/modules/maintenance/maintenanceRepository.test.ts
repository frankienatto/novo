import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { MaintenanceRepository } from './maintenanceRepository.ts';
import { MaintenanceTask, MaintenanceHistory } from './maintenanceTypes.ts';
import { MaintenanceService } from './maintenanceService.ts';

// In-memory Firestore store para ambiente de teste unitário
const mockFirestoreStore: Record<string, Record<string, any>> = {
  tasks: {},
  history: {},
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
          collection: (subColName: string) => {
            const subKey = `${collectionName}_${docId}_${subColName}`;
            if (!mockFirestoreStore[subKey]) {
              mockFirestoreStore[subKey] = {};
            }
            const subCol = mockFirestoreStore[subKey];
            return {
              doc: (subDocId: string) => ({
                set: async (data: any, options?: { merge?: boolean }) => {
                  if (options?.merge && subCol[subDocId]) {
                    subCol[subDocId] = JSON.parse(JSON.stringify({ ...subCol[subDocId], ...data }));
                  } else {
                    subCol[subDocId] = JSON.parse(JSON.stringify({ ...data }));
                  }
                },
                get: async () => ({
                  exists: !!subCol[subDocId],
                  data: () => (subCol[subDocId] ? JSON.parse(JSON.stringify(subCol[subDocId])) : undefined),
                }),
              }),
              get: async () => ({
                docs: Object.values(subCol).map((data) => ({
                  data: () => JSON.parse(JSON.stringify(data)),
                })),
                forEach: (cb: (doc: any) => void) => {
                  Object.values(subCol).forEach((data) => cb({ data: () => JSON.parse(JSON.stringify(data)) }));
                },
              }),
            };
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

describe('MaintenanceRepository - Firestore Persistence Tests', () => {
  let repo: MaintenanceRepository;

  const orgA = `org_maint_test_a_${Date.now()}`;
  const orgB = `org_maint_test_b_${Date.now()}`;
  const propA = `prop_maint_test_a_${Date.now()}`;
  const propB = `prop_maint_test_b_${Date.now()}`;

  const task1Id = `task_maint_001_${Date.now()}`;
  const task2Id = `task_maint_002_${Date.now()}`;
  const task3Id = `task_maint_003_${Date.now()}`;
  const taskBId = `task_maint_b_${Date.now()}`;

  beforeAll(async () => {
    repo = new MaintenanceRepository();
  });

  afterAll(async () => {
    await repo.deleteTask(orgA, propA, task1Id);
    await repo.deleteTask(orgA, propA, task2Id);
    await repo.deleteTask(orgA, propA, task3Id);
    await repo.deleteTask(orgB, propB, taskBId);
  });

  // 1. Criação
  it('1. criação de ordem de manutenção', async () => {
    const task: MaintenanceTask = {
      taskId: task1Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_101',
      unitNumber: '101',
      status: 'reported',
      category: 'plumbing',
      priority: 'high',
      description: 'Vazamento de água sob a pia do banheiro',
      reportedBy: 'Recepção / Hóspede',
      slaMinutes: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.saveTask(task);
    expect(saved).toBeDefined();
    expect(saved.taskId).toBe(task1Id);
    expect(saved.status).toBe('reported');
    expect(saved.category).toBe('plumbing');
    expect(saved.priority).toBe('high');
    expect(saved.description).toContain('Vazamento');
  });

  // 2. Recuperação
  it('2. recuperação por id', async () => {
    const found = await repo.findTaskById(orgA, propA, task1Id);
    expect(found).not.toBeNull();
    expect(found?.taskId).toBe(task1Id);
    expect(found?.category).toBe('plumbing');
    expect(found?.unitNumber).toBe('101');
  });

  // 3. Atualização
  it('3. atualização de ordem de manutenção', async () => {
    const existing = await repo.findTaskById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const updatedTask: MaintenanceTask = {
      ...existing!,
      status: 'in_progress',
      assignedTechnicianId: 'tech_roberto',
      assignedTechnicianName: 'Roberto Encanador',
      notes: 'Técnico no local realizando troca do sifão',
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.saveTask(updatedTask);
    expect(saved.status).toBe('in_progress');
    expect(saved.assignedTechnicianName).toBe('Roberto Encanador');

    const verified = await repo.findTaskById(orgA, propA, task1Id);
    expect(verified?.status).toBe('in_progress');
    expect(verified?.notes).toBe('Técnico no local realizando troca do sifão');
  });

  // 4. Exclusão
  it('4. exclusão de ordem de manutenção', async () => {
    const tempTaskId = `task_temp_${Date.now()}`;
    await repo.saveTask({
      taskId: tempTaskId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_temp',
      unitNumber: '999',
      status: 'reported',
      category: 'general',
      priority: 'low',
      description: 'Troca de lâmpada simples',
      slaMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.deleteTask(orgA, propA, tempTaskId);
    expect(deleted).toBe(true);

    const check = await repo.findTaskById(orgA, propA, tempTaskId);
    expect(check).toBeNull();
  });

  // 5. Listagem
  it('5. listagem de ordens de manutenção', async () => {
    const task2: MaintenanceTask = {
      taskId: task2Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_102',
      unitNumber: '102',
      status: 'assigned',
      category: 'hvac',
      priority: 'urgent',
      description: 'Ar-condicionado não gela',
      assignedTechnicianId: 'tech_claudio',
      assignedTechnicianName: 'Claudio Refrigeração',
      slaMinutes: 60,
      createdAt: new Date(Date.now() - 5000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveTask(task2);

    const list = await repo.findTasks(orgA, propA);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((t) => t.taskId === task1Id)).toBe(true);
    expect(list.some((t) => t.taskId === task2Id)).toBe(true);
  });

  // 6. Filtros existentes
  it('6. filtros existentes (status, category, priority, unitId, assignedTechnicianId)', async () => {
    const filterByUnit = await repo.findTasks(orgA, propA, { unitId: 'unit_101' });
    expect(filterByUnit.every((t) => t.unitId === 'unit_101')).toBe(true);

    const filterByCategory = await repo.findTasks(orgA, propA, { category: 'hvac' });
    expect(filterByCategory.every((t) => t.category === 'hvac')).toBe(true);

    const filterByStatus = await repo.findTasks(orgA, propA, { status: 'assigned' });
    expect(filterByStatus.every((t) => t.status === 'assigned')).toBe(true);

    const filterByTech = await repo.findTasks(orgA, propA, { assignedTechnicianId: 'tech_claudio' });
    expect(filterByTech.every((t) => t.assignedTechnicianId === 'tech_claudio')).toBe(true);
  });

  // 7. Status e transição
  it('7. status e transição de estados de manutenção', async () => {
    const task = await repo.findTaskById(orgA, propA, task1Id);
    expect(task).not.toBeNull();

    const completedTask: MaintenanceTask = {
      ...task!,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    await repo.saveTask(completedTask);

    const result = await repo.findTaskById(orgA, propA, task1Id);
    expect(result?.status).toBe('completed');
    expect(result?.completedAt).toBeDefined();
  });

  // 8. Prioridade e ordenação
  it('8. prioridade e ordenação por createdAt', async () => {
    const task3: MaintenanceTask = {
      taskId: task3Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_103',
      unitNumber: '103',
      status: 'reported',
      category: 'electrical',
      priority: 'low',
      description: 'Tomada frouxa',
      slaMinutes: 180,
      createdAt: new Date(Date.now() + 10000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveTask(task3);

    const allTasks = await repo.findTasks(orgA, propA);
    // Mais recente primeiro
    expect(allTasks[0].taskId).toBe(task3Id);
  });

  // 9. Atribuição de técnico
  it('9. atribuição de técnico responsável', async () => {
    const task = await repo.findTaskById(orgA, propA, task3Id);
    expect(task).not.toBeNull();

    const assigned = await repo.saveTask({
      ...task!,
      status: 'assigned',
      assignedTechnicianId: 'tech_marcos',
      assignedTechnicianName: 'Marcos Eletricista',
    });

    expect(assigned.status).toBe('assigned');
    expect(assigned.assignedTechnicianId).toBe('tech_marcos');
    expect(assigned.assignedTechnicianName).toBe('Marcos Eletricista');
  });

  // 10. Consulta por unidade ativa (findActiveTaskByUnitId)
  it('10. consulta por tarefa ativa de UH (findActiveTaskByUnitId)', async () => {
    const active102 = await repo.findActiveTaskByUnitId(orgA, propA, 'unit_102');
    expect(active102).not.toBeNull();
    expect(active102?.unitId).toBe('unit_102');
    expect(active102?.status).toBe('assigned');

    // unit_101 foi completada no teste 7, portanto não deve retornar como ativa
    const active101 = await repo.findActiveTaskByUnitId(orgA, propA, 'unit_101');
    expect(active101).toBeNull();
  });

  // 11. Tenant A não acessa tarefas do Tenant B
  it('11. Tenant A não acessa tarefas do Tenant B', async () => {
    await repo.saveTask({
      taskId: taskBId,
      organizationId: orgB,
      propertyId: propB,
      unitId: 'unit_201',
      unitNumber: '201',
      status: 'reported',
      category: 'plumbing',
      priority: 'high',
      description: 'Vazamento Tenant B',
      slaMinutes: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Tentativa de Tenant A acessar tarefa de Tenant B por ID
    const crossTenantGet = await repo.findTaskById(orgA, propA, taskBId);
    expect(crossTenantGet).toBeNull();

    // Tentativa de Tenant A deletar tarefa de Tenant B
    const deleteResult = await repo.deleteTask(orgA, propA, taskBId);
    expect(deleteResult).toBe(false);

    // Tarefa continua existindo no Tenant B
    const checkB = await repo.findTaskById(orgB, propB, taskBId);
    expect(checkB).not.toBeNull();
  });

  // 12. Tenant A não lista Tenant B
  it('12. Tenant A não lista tarefas do Tenant B', async () => {
    const listA = await repo.findTasks(orgA, propA);
    expect(listA.some((t) => t.taskId === taskBId)).toBe(false);
  });

  // 13. Tentativa de alterar organizationId (Bloqueio)
  it('13. tentativa de alterar organizationId deve ser bloqueada', async () => {
    const existing = await repo.findTaskById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const maliciousTask: MaintenanceTask = {
      ...existing!,
      organizationId: 'org_malicious_hijack',
    };

    await expect(repo.saveTask(maliciousTask)).rejects.toThrow(
      'Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.'
    );
  });

  // 14. Tentativa de alterar propertyId (Bloqueio)
  it('14. tentativa de alterar propertyId deve ser bloqueada', async () => {
    const existing = await repo.findTaskById(orgA, propA, task1Id);
    expect(existing).not.toBeNull();

    const maliciousTask: MaintenanceTask = {
      ...existing!,
      propertyId: 'prop_unauthorized',
    };

    await expect(repo.saveTask(maliciousTask)).rejects.toThrow(
      'Tenant mismatch: Cannot alter organizationId or propertyId of an existing task.'
    );
  });

  // 15. Entidade inexistente
  it('15. busca e deleção de entidade inexistente retornam null / false', async () => {
    const notFound = await repo.findTaskById(orgA, propA, 'non_existent_task_id');
    expect(notFound).toBeNull();

    const deleteNotFound = await repo.deleteTask(orgA, propA, 'non_existent_task_id');
    expect(deleteNotFound).toBe(false);
  });

  // 16. PERSISTÊNCIA REAL APÓS RECRIAÇÃO DA INSTÂNCIA (Obrigatório)
  it('16. persistência real após destruição e recriação da instância do MaintenanceRepository', async () => {
    const persistentTaskId = `task_maint_persist_${Date.now()}`;
    const persistentTask: MaintenanceTask = {
      taskId: persistentTaskId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'unit_301',
      unitNumber: '301',
      status: 'in_progress',
      category: 'appliances',
      priority: 'urgent',
      description: 'Frigobar não liga na suíte master',
      slaMinutes: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Salva com a instância 1
    const instance1 = new MaintenanceRepository();
    await instance1.saveTask(persistentTask);

    // 2. Destrói referência local
    const instance2 = new MaintenanceRepository();

    // 3. Recupera com a nova instância
    const retrieved = await instance2.findTaskById(orgA, propA, persistentTaskId);

    // 4. Valida persistência independente de memória RAM
    expect(retrieved).not.toBeNull();
    expect(retrieved?.taskId).toBe(persistentTaskId);
    expect(retrieved?.unitId).toBe('unit_301');
    expect(retrieved?.description).toBe('Frigobar não liga na suíte master');
    expect(retrieved?.priority).toBe('urgent');
  });

  // 17. Histórico de manutenção e regressão com MaintenanceService
  it('17. histórico de manutenção e regressão com MaintenanceService', async () => {
    const historyItem: MaintenanceHistory = {
      historyId: `hist_001_${Date.now()}`,
      taskId: task1Id,
      previousStatus: 'in_progress',
      newStatus: 'completed',
      changedBy: 'Supervisor Técnico',
      notes: 'Vazamento reparado e testado com sucesso',
      timestamp: new Date().toISOString(),
    };

    await repo.saveHistory(historyItem);

    const histories = await repo.getHistoryByTaskId(task1Id);
    expect(histories.length).toBeGreaterThanOrEqual(1);
    expect(histories[0].taskId).toBe(task1Id);
    expect(histories[0].newStatus).toBe('completed');

    // Consumo pelo MaintenanceService
    const service = new MaintenanceService(repo);
    const dashboardSummary = await service.getDashboardSummary(orgA, propA);
    expect(dashboardSummary).toBeDefined();
    expect(dashboardSummary.completedTasksCount).toBeGreaterThanOrEqual(1);
  });
});
