import { describe, it, expect, vi } from 'vitest';
import { createMockFirestore } from '../../test/mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock_uid' }),
  }),
  getFirebaseAdminApp: () => ({}),
}));

import { executionService } from './executionService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('ExecutionService & Execution Tracking (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar Dashboard do Execution Tracking', async () => {
    const dashboard = await executionService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.runningCount).toBe('number');
    expect(typeof dashboard.waitingCount).toBe('number');
    expect(typeof dashboard.completedCount).toBe('number');
    expect(typeof dashboard.blockedCount).toBe('number');
    expect(dashboard.systemStatus).toBe('read_only_tracking');
  });

  it('2. Deve listar execuções manuais com modo manual rigoroso', async () => {
    const executions = await executionService.getExecutions(orgId, propId);
    expect(Array.isArray(executions)).toBe(true);
    expect(executions.length).toBeGreaterThan(0);
    executions.forEach((exec) => {
      expect(typeof exec.executionId).toBe('string');
      expect(typeof exec.playbookId).toBe('string');
      expect(typeof exec.progressPercent).toBe('number');
      expect(exec.executionMode).toBe('manual');
    });
  });

  it('3. Deve iniciar execução manual sem automação externa', async () => {
    const executions = await executionService.getExecutions(orgId, propId);
    const targetExecution = executions[0].executionId;
    const startedRecord = await executionService.startExecution(
      targetExecution,
      'Operador de Governança - Teste',
      'Iniciando execução manual conforme instruído'
    );

    expect(startedRecord).toBeDefined();
    expect(startedRecord.status).toBe('running');
    expect(startedRecord.owner).toBe('Operador de Governança - Teste');
    expect(startedRecord.startedAt).toBeDefined();
  });

  it('4. Deve atualizar progresso operacional de checklist', async () => {
    const executions = await executionService.getExecutions(orgId, propId);
    const targetExecution = executions[0].executionId;
    const updatedRecord = await executionService.updateProgress(
      targetExecution,
      50,
      ['step_1', 'step_2'],
      'Primeira metade do checklist concluída manualmente',
      false
    );

    expect(updatedRecord).toBeDefined();
    expect(updatedRecord.progressPercent).toBe(50);
    expect(updatedRecord.completedChecklist).toContain('step_1');
    expect(updatedRecord.completedChecklist).toContain('step_2');
  });

  it('5. Deve registrar conclusão manual da execução', async () => {
    const executions = await executionService.getExecutions(orgId, propId);
    const targetExecution = executions[0].executionId;
    const completedRecord = await executionService.completeExecution(
      targetExecution,
      'Operador de Governança - Teste',
      'Todos os passos finalizados e verificados manualmente'
    );

    expect(completedRecord).toBeDefined();
    expect(completedRecord.status).toBe('completed');
    expect(completedRecord.progressPercent).toBe(100);
    expect(completedRecord.completedAt).toBeDefined();
  });

  it('6. Deve fornecer resumo de execução para a IA', async () => {
    const summaryForAi = await executionService.getExecutionSummaryForAI(orgId, propId);
    expect(typeof summaryForAi.running).toBe('number');
    expect(typeof summaryForAi.completed).toBe('number');
    expect(typeof summaryForAi.averageProgress).toBe('number');
    expect(typeof summaryForAi.blocked).toBe('number');
    expect(typeof summaryForAi.criticalExecutions).toBe('string');
  });

  it('7. Deve validar o AgentRouter e PromptRegistry do execution_agent', () => {
    const routeResult = agentRouter.route('Qual é o progresso de execução e status do acompanhamento dos playbooks operacionais?');
    expect(routeResult.agentId).toBe('execution_agent');

    const promptDef = getPrompt('execution_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('NÃO executa tarefas');
  });

  it('8. Deve integrar executionSummary no OperationalContext', async () => {
    const context = await contextService.buildOperationalContext(
      orgId,
      propId,
      'test_user'
    );
    expect(context.executionSummary).toBeDefined();
    expect(typeof context.executionSummary?.running).toBe('number');
  });
});
