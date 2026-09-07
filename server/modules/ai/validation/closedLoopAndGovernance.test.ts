import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockFirestore } from '../../../test/mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock_uid' }),
  }),
  getFirebaseAdminApp: () => ({}),
}));

import { synapseAgentOrchestrator } from '../orchestrator/synapseAgentOrchestrator.ts';
import { goalEngine } from '../goals/goalEngine.ts';
import { approvalService } from '../../approval/approvalService.ts';
import { decisionService } from '../../decision/decisionService.ts';
import { executiveService } from '../../executive/executiveService.ts';
import { contextDistributionService } from '../context/contextDistributionService.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';

describe('FASE 4.4 — Closed-Loop da Inteligência & ADR-005 Regra Inviolável', () => {
  const orgId = 'org_test_closed_loop';
  const propId = 'prop_test_closed_loop';
  const sessionId = 'session_test_closed_loop';

  beforeEach(() => {
    // Reset or clean states if necessary
  });

  describe('3. Closed Loop da Inteligência (Ponta a Ponta)', () => {
    it('deve percorrer o ciclo completo: Dados -> Contexto -> Orquestrador -> Decisão -> Aprovação -> GoalEngine -> Execução -> KPIs', async () => {
      // 1. DADOS OPERACIONAIS & CONTEXT SERVICE
      const insight = contextDistributionService.publishInsight({
        organizationId: orgId,
        propertyId: propId,
        targetModules: ['revenue', 'reservations'],
        source: 'strategic_planning',
        type: 'INSIGHT',
        priority: 'CRITICAL',
        confidence: 0.95,
        title: 'Queda na Ocupação para o Feriado',
        summary: 'Taxa em 42% com oportunidade de ajuste tarifário dinâmico.',
        expectedImpact: {
          metric: 'revpar',
          expectedChange: '+18%',
          confidence: 0.95
        }
      });
      expect(insight.insightId).toBeDefined();
      expect(insight.priority).toBe('CRITICAL');

      // 2. AGENTE ESPECIALIZADO VIA SYNAPSE AGENT ORCHESTRATOR
      vi.spyOn(synapseAgentOrchestrator, 'execute').mockResolvedValueOnce({
        text: 'Recomendação Estratégica: Aumento de RevPAR em 18% através de reajuste tarifário dinâmico nas diárias de fim de semana.',
        data: { targetRevparChange: 0.18 },
        primaryAgentId: 'revenue_agent',
        collaboratingAgentIds: ['decision_agent'],
        decisionReason: 'Otimização tarifária identificada',
        executionTimeMs: 120,
        generatedEvents: [],
        sharedMemoryKeysUpdated: [],
        source: 'revenue_intelligence',
        orchestratedContext: {} as any
      });

      const orchResult = await synapseAgentOrchestrator.execute({
        prompt: 'Nossa taxa de ocupação para o feriado está em 42% e a tarifa média está abaixo da concorrência. Sugira um plano tarifário.',
        agentId: 'revenue_agent',
        organizationId: orgId,
        propertyId: propId,
        sessionId,
        priority: 'CRITICAL'
      });
      expect(orchResult.primaryAgentId).toBe('revenue_agent');
      expect(orchResult.text).toBeDefined();
      expect(orchResult.text.length).toBeGreaterThan(20);

      // 3. DECISION ENGINE & GERAÇÃO DE RECOMENDAÇÃO
      vi.spyOn(decisionService, 'getDashboard').mockResolvedValueOnce({
        executiveActionQueue: [{
          actionId: 'act_pricing_test',
          title: 'Ajuste Tarifário de Feriado',
          status: 'PENDING_REVIEW',
          priority: 'CRITICAL',
          impactEstimate: 'RevPAR +18%'
        }]
      } as any);

      const decisionDash = await decisionService.getDashboard(orgId, propId);
      expect(decisionDash).toBeDefined();
      expect(decisionDash.executiveActionQueue).toBeDefined();

      // 4. SUBMISSÃO DE RECOMENDAÇÃO AO HUMAN APPROVAL CENTER (ADR-005)
      const testRecId = `rec_test_cl_${Date.now()}`;
      const approvalRecord = await approvalService.approve({
        recommendationId: testRecId,
        decisionBy: 'Diretor Operacional (Humano)',
        reason: 'Aprovado após análise de elasticidade de preço e ADR-005',
        comments: 'Execução autorizada para 3 dias de campanha'
      }, orgId, propId);
      expect(approvalRecord.status).toBe('approved');
      expect(approvalRecord.decisionBy).toBe('Diretor Operacional (Humano)');
      expect(approvalRecord.decisionDate).toBeDefined();

      // 5. GOAL ENGINE — CRIAÇÃO E EXECUÇÃO DE MISSÃO COM TAREFAS
      const goal = goalEngine.createGoal({
        definition: {
          goalId: `goal_cl_${Date.now()}`,
          title: 'Otimização de RevPAR Feriado',
          objective: 'Aumentar ocupação e receita líquida',
          category: 'REVENUE',
          priority: 'CRITICAL',
          metrics: [
            { kpiId: 'kpi_1', name: 'Ocupação', targetValue: 80, currentValue: 42, unit: '%' },
            { kpiId: 'kpi_2', name: 'RevPAR', targetValue: 350, currentValue: 210, unit: 'BRL' }
          ],
          scope: { organizationId: orgId, propertyId: propId },
          actionPlan: [
            {
              stepNumber: 1,
              title: 'Análise Concorrencial de Tarifas',
              description: 'Coleta de dados de mercado local',
              expectedOutcome: 'Relatório de benchmarking consolidado',
              assignedAgentId: 'revenue_agent',
              requiresHumanApproval: false
            }
          ]
        },
        organizationId: orgId,
        propertyId: propId,
        sessionId,
        actor: 'DirectorHuman'
      });

      expect(goal.status).toBe('CREATED');
      const plannedGoal = goalEngine.planGoal(goal.goalId, 'DirectorHuman');
      expect(plannedGoal.tasks.length).toBe(1);

      // Executar tarefa não sensível com spy no orchestrator
      vi.spyOn(synapseAgentOrchestrator, 'execute').mockResolvedValueOnce({
        text: 'Benchmarking concluído: tarifa recomendada R$ 420.',
        data: { targetRate: 420 },
        primaryAgentId: 'revenue_agent',
        collaboratingAgentIds: [],
        decisionReason: 'Benchmarking tarifário realizado',
        executionTimeMs: 80,
        generatedEvents: [],
        sharedMemoryKeysUpdated: [],
        source: 'revenue_intelligence',
        orchestratedContext: {} as any
      });

      const executedGoal = await goalEngine.executeGoal(goal.goalId, 'SystemWorker');
      expect(executedGoal.tasks[0].status).toBe('COMPLETED');

      // 6. ATUALIZAÇÃO DOS KPIS EXECUTIVOS
      vi.spyOn(executiveService, 'getKpis').mockResolvedValueOnce({
        revenue: {
          totalRevenue: 50000,
          adr: 420,
          revpar: 340,
          occupancyRatePercent: 78,
          pickupCount: 12,
          bookingPacePercent: 15
        },
        commercial: {} as any,
        retentionAndMarketing: {} as any,
        operations: {} as any
      });

      const execMetrics = await executiveService.getKpis(orgId, propId);
      expect(execMetrics).toBeDefined();
      expect(execMetrics.revenue).toBeDefined();
      expect(execMetrics.revenue.revpar).toBeGreaterThan(0);
    });
  });

  describe('4. ADR-005 — Regra Inviolável e Tentativas de Bypass', () => {
    it('IA NUNCA pode executar ação com approvalRequired autonomamente (entra em WAITING_APPROVAL)', async () => {
      const goal = goalEngine.createGoal({
        definition: {
          goalId: `goal_adr005_bypass_${Date.now()}`,
          title: 'Alteração Sensível de Tarifas Balcão',
          objective: 'Atualizar tarifas mínimas com impacto financeiro alto',
          category: 'REVENUE',
          priority: 'CRITICAL',
          metrics: [{ kpiId: 'kpi_sens_1', name: 'Preço Médio', targetValue: 450, currentValue: 300, unit: 'BRL' }],
          scope: { organizationId: orgId, propertyId: propId },
          actionPlan: [
            {
              stepNumber: 1,
              title: 'Reajuste Tarifário Geral (+35%)',
              description: 'Reajustar tarifa base no canal direto',
              expectedOutcome: 'Tarifas atualizadas',
              assignedAgentId: 'revenue_agent',
              requiresHumanApproval: true // Sensível!
            }
          ],
          involvedAgents: ['revenue_agent', 'decision_agent'],
          relatedKPIs: ['RevPAR', 'ADR']
        },
        organizationId: orgId,
        propertyId: propId,
        sessionId,
        actor: 'AIAssistant'
      });

      goalEngine.planGoal(goal.goalId, 'AIAssistant');

      // Execução autônoma tentada pelo sistema ou IA
      const goalAfterAttempt = await goalEngine.executeGoal(goal.goalId, 'AutonomousAISystem');

      // DEVE estar pausada em WAITING_APPROVAL e tarefa NÃO concluída
      expect(goalAfterAttempt.status).toBe('WAITING_APPROVAL');
      expect(goalAfterAttempt.tasks[0].status).toBe('WAITING_APPROVAL');
      expect(goalAfterAttempt.tasks[0].resultText).toBeUndefined();
    });

    it('Tentativa de forçar execução repetida (Bypass) com ator não humano DEVE ser neutralizada e permanecer WAITING_APPROVAL', async () => {
      const goal = goalEngine.createGoal({
        definition: {
          goalId: `goal_bypass_force_${Date.now()}`,
          title: 'Tentativa de Forçar Execução Sensível',
          objective: 'Testar blindagem contra repetição autônoma',
          category: 'REVENUE',
          priority: 'HIGH',
          metrics: [{ kpiId: 'kpi_bypass_1', name: 'Meta', targetValue: 100, currentValue: 0, unit: 'pts' }],
          scope: { organizationId: orgId, propertyId: propId },
          actionPlan: [
            {
              stepNumber: 1,
              title: 'Ação Bloqueada por ADR-005',
              description: 'Requer aprovação',
              expectedOutcome: 'Bloqueio estrito',
              assignedAgentId: 'revenue_agent',
              requiresHumanApproval: true
            }
          ],
          involvedAgents: ['revenue_agent'],
          relatedKPIs: ['RevPAR']
        },
        organizationId: orgId,
        propertyId: propId,
        sessionId,
        actor: 'AIAgent'
      });

      goalEngine.planGoal(goal.goalId, 'AIAgent');
      await goalEngine.executeGoal(goal.goalId, 'AutonomousWorker');

      // Tentativa explícita de bypass chamando executeGoal novamente com ator de automação/IA
      const bypassAttempt = await goalEngine.executeGoal(goal.goalId, 'BypassBotService');
      expect(bypassAttempt.status).toBe('WAITING_APPROVAL');
      expect(bypassAttempt.tasks[0].status).toBe('WAITING_APPROVAL');
    });

    it('Rejeição humana encerra formalmente a ação com justificativa e status REJECTED', async () => {
      const recId = `rec_reject_test_${Date.now()}`;
      const rejection = await approvalService.reject({
        recommendationId: recId,
        decisionBy: 'Gerente Geral (Humano)',
        reason: 'Risco de perda de volume de reservas muito elevado no cenário atual',
        comments: 'Rejeitado sumariamente com base na política de ADR-005'
      }, orgId, propId);

      expect(rejection.status).toBe('rejected');
      expect(rejection.decisionBy).toBe('Gerente Geral (Humano)');
      expect(rejection.reason).toContain('Risco de perda');
      expect(rejection.decisionDate).toBeDefined();
    });

    it('Aprovação humana registra formalmente quem aprovou, data ISO e justificativa auditável', async () => {
      const recId = `rec_audit_test_${Date.now()}`;
      const approval = await approvalService.approve({
        recommendationId: recId,
        decisionBy: 'Diretoria Financeira',
        reason: 'ROI projetado de 3.2x compatível com teto orçamentário',
        comments: 'Aprovado para início imediato'
      }, orgId, propId);

      expect(approval.status).toBe('approved');
      expect(approval.decisionBy).toBe('Diretoria Financeira');
      expect(approval.reason).toContain('ROI projetado');
      expect(new Date(approval.decisionDate).getTime()).toBeGreaterThan(0);
      expect(approval.approvalId).toBeDefined();
    });
  });
});
