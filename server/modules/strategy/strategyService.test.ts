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

import { strategyService } from './strategyService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('StrategyService & Strategic Simulation (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar o Dashboard de Estratégia e Simulação', async () => {
    const dashboard = await strategyService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.activeScenariosCount).toBe('number');
    expect(dashboard.activeScenariosCount).toBeGreaterThanOrEqual(10);
    expect(typeof dashboard.averageConfidence).toBe('number');
    expect(dashboard.systemStatus).toBe('read_only');
    expect(dashboard.simulationMode).toBe('memory_only');
  });

  it('2. Deve garantir Explainable AI e invariantes READ-ONLY em todos os cenários', async () => {
    const scenarios = await strategyService.getScenarios(orgId, propId);
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThanOrEqual(10);

    scenarios.forEach((scen) => {
      expect(scen.status).toBe('simulation_only');
      expect(scen.humanApprovalRequired).toBe(true);
      expect(scen.approvalRequired).toBe(true);

      const exp = scen.explainableAi;
      expect(exp).toBeDefined();
      expect(typeof exp.reasoning).toBe('string');
      expect(exp.reasoning.length).toBeGreaterThan(0);
      expect(Array.isArray(exp.evidence)).toBe(true);
      expect(typeof exp.confidenceScore).toBe('number');
      expect(typeof exp.estimatedGain).toBe('string');
      expect(typeof exp.estimatedRisk).toBe('string');
      expect(typeof exp.businessImpact).toBe('string');
      expect(typeof exp.operationalImpact).toBe('string');
      expect(typeof exp.financialImpact).toBe('string');
      expect(Array.isArray(exp.affectedModules)).toBe(true);
      expect(Array.isArray(exp.dependencies)).toBe(true);
      expect(exp.humanApprovalRequired).toBe(true);
      expect(exp.status).toBe('simulation_only');
    });
  });

  it('3. Deve executar simulação customizada sob demanda em memória (simulate)', async () => {
    const customSim = await strategyService.simulate(
      {
        scenarioType: 'adr_increase',
        adrIncreasePercent: 12,
        cancellationReductionPercent: 20,
        customName: 'Simulação Teste Automatizado Alta Demanda',
      },
      orgId,
      propId
    );

    expect(customSim).toBeDefined();
    expect(customSim.status).toBe('simulation_only');
    expect(customSim.humanApprovalRequired).toBe(true);
    expect(customSim.projectedScenario.adr).toBeGreaterThan(customSim.currentScenario.adr);
  });

  it('4. Deve gerar resumo do módulo de estratégia para IA (getStrategySummaryForAI)', async () => {
    const summaryForAi = await strategyService.getStrategySummaryForAI(orgId, propId);
    expect(typeof summaryForAi.totalScenarios).toBe('number');
    expect(typeof summaryForAi.highestImpactScenario).toBe('string');
    expect(typeof summaryForAi.highestConfidenceScenario).toBe('string');
    expect(typeof summaryForAi.topRecommendation).toBe('string');
    expect(typeof summaryForAi.averageConfidence).toBe('number');
  });

  it('5. Deve validar AgentRouter e PromptRegistry do strategy_agent', () => {
    const routeResult = agentRouter.route('Qual é a simulação de cenário what if para aumento de ADR e trade off de ocupação?');
    expect(routeResult.agentId).toBe('strategy_agent');

    const promptDef = getPrompt('strategy_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('simulation_only');
  });

  it('6. Deve integrar o strategySummary no ContextService', async () => {
    const context = await contextService.buildOperationalContext(orgId, propId, 'test_user');
    expect(context.strategySummary).toBeDefined();
    expect(typeof context.strategySummary?.totalScenarios).toBe('number');
  });
});
