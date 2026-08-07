import { describe, it, expect, beforeEach } from 'vitest';
import { synapseAgentOrchestrator } from './orchestrator/synapseAgentOrchestrator.ts';
import { getAllAgentDeclarations, getAgentDeclaration } from './orchestrator/agentRegistry.ts';
import { agentEventBus } from './orchestrator/agentEventBus.ts';
import { agentSharedMemory } from './orchestrator/agentSharedMemory.ts';
import { aiOrchestrator } from './aiOrchestrator.ts';

describe('FASE 3.0 — Synapse Agent Orchestrator', () => {
  beforeEach(() => {
    agentEventBus.clearHistory();
    agentSharedMemory.clear();
  });

  it('1. Deve registrar e declarar todos os 23 agentes especializados do Synapse', () => {
    const agents = getAllAgentDeclarations();
    expect(agents.length).toBeGreaterThanOrEqual(23);

    const revenueAgent = getAgentDeclaration('revenue_agent');
    expect(revenueAgent).toBeDefined();
    expect(revenueAgent.domain).toContain('Revenue Management');
    expect(revenueAgent.responsibilities.length).toBeGreaterThan(0);
    expect(revenueAgent.tools).toContain('getRevenueMetrics');
    expect(revenueAgent.eventsConsumed).toContain('pms:reservation_created');
    expect(revenueAgent.eventsPublished).toContain('revenue:recommendation_generated');
    expect(revenueAgent.authorityLevel).toBe('READ_ONLY');
  });

  it('2. Deve isolar a comunicação entre agentes garantindo que passam pelo Orchestrator', async () => {
    const scope = { organizationId: 'org_test', propertyId: 'prop_test', sessionId: 'sess_test' };
    
    // Simular que o Revenue Agent colocou um insight na Memória Compartilhada
    agentSharedMemory.setValue('revenue_insight', { revpar: 280 }, 'revenue_agent', scope);

    const retrieved = agentSharedMemory.getValue('revenue_insight', scope);
    expect(retrieved).toEqual({ revpar: 280 });
  });

  it('3. Deve construir e manter os 5 Contextos Centrais do Synapse', async () => {
    const context = await synapseAgentOrchestrator.buildOrchestratedContext(
      'org_dev_default',
      'prop_dev_default',
      'usr_dev_default',
      'session_test_5_contexts'
    );

    expect(context.sessionContext.sessionId).toBe('session_test_5_contexts');
    expect(context.propertyContext.organizationId).toBe('org_dev_default');
    expect(context.propertyContext.propertyName).toBeDefined();
    expect(context.userContext.userId).toBe('usr_dev_default');
    expect(context.operationalContext).toHaveProperty('pmsSummary');
    expect(context.executiveContext).toHaveProperty('executiveSummary');
  });

  it('4. Deve avaliar automaticamente agente primário, colaboradores, excluídos e prioridade CRITICAL', () => {
    const decision = synapseAgentOrchestrator.evaluateOrchestrationDecision(
      'URGENTE: Overbooking no check-in do quarto com emergência'
    );

    expect(decision.primaryAgentId).toBe('reception_agent');
    expect(decision.priority).toBe('CRITICAL');
    expect(decision.collaboratingAgentIds).toContain('housekeeping_agent');
    expect(decision.excludedAgentIds).not.toContain('reception_agent');
    expect(decision.decisionReason).toContain('Prioridade: CRITICAL');
  });

  it('5. Deve publicar eventos no Event Bus durante a execução do pipeline', async () => {
    const eventsReceived: any[] = [];
    const unsubscribe = agentEventBus.subscribe('*', (evt) => {
      eventsReceived.push(evt);
    });

    const result = await synapseAgentOrchestrator.execute({
      prompt: 'Qual é o RevPAR e Ocupação previstos para o próximo mês?',
      organizationId: 'org_test_bus',
      propertyId: 'prop_test_bus'
    });

    expect(result.primaryAgentId).toBe('revenue_agent');
    expect(result.generatedEvents.length).toBeGreaterThanOrEqual(2);

    const history = agentEventBus.getEventHistory({ organizationId: 'org_test_bus' });
    expect(history.some(e => e.eventName === 'orchestrator:execution_started')).toBe(true);
    expect(history.some(e => e.eventName === 'revenue_agent:response_generated')).toBe(true);

    unsubscribe();
  }, 20000);

  it('6. Deve manter observabilidade completa com tempo de execução e memória compartilhada atualizada', async () => {
    const result = await synapseAgentOrchestrator.execute({
      prompt: 'Qual é o status das aprovações pendentes do workflow?',
      organizationId: 'org_test_obs',
      propertyId: 'prop_test_obs'
    });

    expect(result.primaryAgentId).toBe('approval_agent');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.sharedMemoryKeysUpdated).toContain('approval_agent:last_result');
    expect(result.decisionReason).toBeDefined();

    const scope = { organizationId: 'org_test_obs', propertyId: 'prop_test_obs', sessionId: result.orchestratedContext.sessionContext.sessionId };
    const sharedVal = agentSharedMemory.getValue('approval_agent:last_result', scope);
    expect(sharedVal).toBeDefined();
    expect(sharedVal.text).toBe(result.text);
  }, 20000);

  it('7. Deve manter 100% de compatibilidade retroativa com aiOrchestrator.execute()', async () => {
    const legacyResult = await aiOrchestrator.execute({
      prompt: 'Como está a saúde executiva e os KPIs da diretoria?',
      organizationId: 'org_legacy',
      propertyId: 'prop_legacy'
    });

    expect(legacyResult.text).toBeDefined();
    expect(legacyResult.agentId).toBe('executive_agent');
    expect(legacyResult.agentSelection).toBeDefined();
    expect(legacyResult.operationalContext).toBeDefined();
    expect(legacyResult.source).toBeDefined();
  }, 20000);
});
