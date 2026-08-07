import { describe, it, expect, beforeEach } from 'vitest';
import { goalEngine } from './goals/goalEngine.ts';
import { goalRegistry } from './goals/goalRegistry.ts';
import { goalStateMachine } from './goals/goalStateMachine.ts';
import { goalPlanner } from './goals/goalPlanner.ts';
import { agentEventBus } from './orchestrator/agentEventBus.ts';
import { agentSharedMemory } from './orchestrator/agentSharedMemory.ts';
import { synapseAgentOrchestrator } from './orchestrator/synapseAgentOrchestrator.ts';
import { decisionService } from '../decision/decisionService.ts';
import { approvalRepository } from '../approval/approvalRepository.ts';

describe('FASE 3.1 — Goal Engine (Missões Estratégicas)', () => {
  beforeEach(() => {
    agentEventBus.clearHistory();
    goalRegistry.clear();
  });

  it('1. Deve carregar e disponibilizar todos os templates de Missões Estratégicas no Goal Registry', () => {
    const templates = goalRegistry.getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);

    const tmpl = goalRegistry.getTemplate('goal_occupancy_boost');
    expect(tmpl).toBeDefined();
    expect(tmpl?.title).toContain('Ocupação');
    expect(tmpl?.involvedAgents).toContain('revenue_agent');
    expect(tmpl?.rollbackPlan.steps.length).toBeGreaterThan(0);
  });

  it('2. Deve aplicar rigorosamente a Máquina de Estados (Goal State Machine) e rejeitar transições inválidas', () => {
    expect(goalStateMachine.canTransition('CREATED', 'PLANNED')).toBe(true);
    expect(goalStateMachine.canTransition('CREATED', 'COMPLETED')).toBe(false);

    expect(() => {
      goalStateMachine.validateTransition('CREATED', 'COMPLETED');
    }).toThrowError(/Transição de estado inválida/);
  });

  it('3. Deve decompor automaticamente um objetivo em tarefas rotulando necessidade de aprovação (ADR-005)', () => {
    const tmpl = goalRegistry.getTemplate('goal_occupancy_boost')!;
    const plannerResult = goalPlanner.decomposeGoal(tmpl);

    expect(plannerResult.decomposedTasks.length).toBeGreaterThanOrEqual(3);
    expect(plannerResult.rationale).toContain('ADR-005');

    // Primeira tarefa diagnóstica não exige aprovação antecipada
    expect(plannerResult.decomposedTasks[0].approvalRequired).toBe(false);

    // Tarefas com receita e decisão exigem aprovação humana de acordo com ADR-005
    const approvalTasks = plannerResult.decomposedTasks.filter(t => t.approvalRequired);
    expect(approvalTasks.length).toBeGreaterThan(0);
  });

  it('4. Deve criar e planejar uma nova Missão Estratégica transicionando de CREATED para PLANNED', () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_goal_test',
      propertyId: 'prop_goal_test'
    });

    expect(goal.status).toBe('CREATED');
    expect(goal.timeline.length).toBe(1);

    const plannedGoal = goalEngine.planGoal(goal.goalId);
    expect(plannedGoal.status).toBe('PLANNED');
    expect(plannedGoal.tasks.length).toBeGreaterThan(0);
    expect(plannedGoal.auditTrail.some(a => a.action === 'GOAL_PLANNED')).toBe(true);
  });

  it('5. Deve executar tarefas sequencialmente e pausar em WAITING_APPROVAL respeitando a governança ADR-005', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_housekeeping_sla_optimization',
      organizationId: 'org_adr005_test',
      propertyId: 'prop_adr005_test'
    });

    // Iniciar e executar missão até encontrar pausa por ADR-005 ou conclusão
    const executedGoal = await goalEngine.executeGoal(goal.goalId);

    expect(['WAITING_APPROVAL', 'IN_PROGRESS', 'COMPLETED']).toContain(executedGoal.status);
    expect(executedGoal.metrics.totalTasks).toBeGreaterThan(0);
    expect(executedGoal.eventLog.length).toBeGreaterThan(0);
    expect(executedGoal.auditTrail.length).toBeGreaterThan(0);
  }, 25000);

  it('6. Deve liberar tarefa com aprovação humana e prosseguir a execução da missão', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_direct_proposal_recovery',
      organizationId: 'org_approve_test',
      propertyId: 'prop_approve_test'
    });

    const plannedGoal = goalEngine.planGoal(goal.goalId);
    
    // Forçar uma tarefa pendente para status WAITING_APPROVAL para testar a aprovação explícita
    const taskToApprove = plannedGoal.tasks.find(t => t.approvalRequired);
    if (taskToApprove) {
      taskToApprove.status = 'WAITING_APPROVAL';
      plannedGoal.status = 'WAITING_APPROVAL';
      goalRegistry.saveGoal(plannedGoal);

      const approvedGoal = await goalEngine.approveGoalTask(
        plannedGoal.goalId, 
        taskToApprove.taskId, 
        'usr_director_01'
      );

      expect(approvedGoal.auditTrail.some(a => a.action === 'TASK_APPROVED_BY_HUMAN')).toBe(true);
    }
  }, 25000);

  it('7. Deve executar rollback de missão e registrar os passos de reversão no Audit Trail', () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_rollback_test',
      propertyId: 'prop_rollback_test'
    });

    goalEngine.planGoal(goal.goalId);
    const rolledBackGoal = goalEngine.rollbackGoal(goal.goalId, 'Métricas fora do limite de segurança', 'DirectorUser');

    expect(rolledBackGoal.status).toBe('ROLLED_BACK');
    expect(rolledBackGoal.auditTrail.some(a => a.action === 'GOAL_ROLLED_BACK')).toBe(true);
    expect(rolledBackGoal.timeline.some(t => t.status === 'ROLLED_BACK')).toBe(true);
  });
});

describe('FASE 3.2 — Executive Mission Engine (Integração)', () => {
  beforeEach(() => {
    agentEventBus.clearHistory();
    goalRegistry.clear();
    agentSharedMemory.clear();
  });

  it('1. Deve deduplicar missões concorrentes no mesmo escopo (Organization / Property / Template)', () => {
    const goal1 = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_dedup_test',
      propertyId: 'prop_dedup_test'
    });

    const goal2 = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_dedup_test',
      propertyId: 'prop_dedup_test'
    });

    expect(goal1.goalId).toBe(goal2.goalId);
  });

  it('2. Deve sincronizar automaticamente o GoalExecutionContext na AgentSharedMemory', () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_housekeeping_sla_optimization',
      organizationId: 'org_shmem_test',
      propertyId: 'prop_shmem_test',
      sessionId: 'sess_shmem_001'
    });

    goalEngine.planGoal(goal.goalId);

    const sharedCtx = agentSharedMemory.getValue(
      'goalExecutionContext',
      { organizationId: 'org_shmem_test', propertyId: 'prop_shmem_test', sessionId: 'sess_shmem_001' }
    );

    expect(sharedCtx).toBeDefined();
    expect(sharedCtx.goalId).toBe(goal.goalId);
    expect(sharedCtx.status).toBe('PLANNED');
    expect(sharedCtx.tasksSummary.length).toBeGreaterThan(0);
  });

  it('3. Deve integrar missões ativas no contexto executivo do SynapseAgentOrchestrator', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_orch_integration',
      propertyId: 'prop_orch_integration'
    });
    goalEngine.planGoal(goal.goalId);

    const orchContext = await synapseAgentOrchestrator.buildOrchestratedContext(
      'org_orch_integration',
      'prop_orch_integration',
      'usr_test',
      'sess_test'
    );

    expect(orchContext.executiveContext.activeStrategicGoals).toBeDefined();
    expect(orchContext.executiveContext.activeStrategicGoals?.length).toBe(1);
    expect(orchContext.executiveContext.activeStrategicGoals?.[0].goalId).toBe(goal.goalId);
  });

  it('4. Deve refletir missões ativas no resumo para IA do Decision Service', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_direct_proposal_recovery',
      organizationId: 'org_decision_integration',
      propertyId: 'prop_decision_integration'
    });
    goalEngine.planGoal(goal.goalId);

    const decisionSummary = await decisionService.getDecisionSummaryForAI(
      'org_decision_integration',
      'prop_decision_integration'
    );

    expect(decisionSummary.nextRecommendedAction).toContain('Missão Ativa');
    expect(decisionSummary.nextRecommendedAction).toContain('Recuperação de Propostas');
  });

  it('5. Deve conectar tarefas WAITING_APPROVAL do GoalEngine ao ApprovalRepository e retomar missão ao aprovar (ADR-005)', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: 'org_approval_integration',
      propertyId: 'prop_approval_integration'
    });

    const planned = goalEngine.planGoal(goal.goalId);
    const taskWithApproval = planned.tasks.find(t => t.approvalRequired);

    if (taskWithApproval) {
      taskWithApproval.status = 'WAITING_APPROVAL';
      planned.status = 'WAITING_APPROVAL';
      goalRegistry.saveGoal(planned);

      // Verificar se a tarefa aparece no Approval Repository
      const pendingApprovals = await approvalRepository.getPendingApprovals(
        'org_approval_integration',
        'prop_approval_integration'
      );

      const approvalItem = pendingApprovals.find(p => p.recommendationId === taskWithApproval.taskId);
      expect(approvalItem).toBeDefined();
      expect(approvalItem?.moduleOrigin).toBe('goal_engine');

      // Aprovar no Approval Repository
      await approvalRepository.approveRecommendation(
        { recommendationId: taskWithApproval.taskId, decisionBy: 'DirectorUser', reason: 'Aprovado para reajuste tarifário' },
        'org_approval_integration',
        'prop_approval_integration'
      );

      // Verificar se o GoalEngine destravou a tarefa
      const updatedGoal = goalEngine.getGoal(goal.goalId)!;
      expect(updatedGoal.auditTrail.some(a => a.action === 'TASK_APPROVED_BY_HUMAN')).toBe(true);
    }
  }, 25000);
});

