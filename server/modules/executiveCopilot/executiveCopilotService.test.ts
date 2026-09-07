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

import { executiveCopilotService } from './executiveCopilotService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('ExecutiveCopilotService & Health Scores (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar Dashboard Completo do Copilot com Health Scores', async () => {
    const dashboard = await executiveCopilotService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.healthScores.overallScore).toBe('number');
    expect(dashboard.healthScores.overallScore).toBeGreaterThanOrEqual(0);
    expect(dashboard.healthScores.overallScore).toBeLessThanOrEqual(100);
    expect(typeof dashboard.riskScore).toBe('number');
    expect(typeof dashboard.opportunityScore).toBe('number');
    expect(Array.isArray(dashboard.topRisks)).toBe(true);
    expect(Array.isArray(dashboard.topOpportunities)).toBe(true);
    expect(Array.isArray(dashboard.recommendedPriorities)).toBe(true);
    expect(dashboard.dailyBrief.summary).toBeDefined();
  });

  it('2. Deve carregar Health Scores Setoriais (receita, comercial, governança)', async () => {
    const health = await executiveCopilotService.getHealth(orgId, propId);
    expect(typeof health.revenueHealth).toBe('number');
    expect(typeof health.commercialHealth).toBe('number');
    expect(typeof health.housekeepingHealth).toBe('number');
    expect(typeof health.maintenanceHealth).toBe('number');
  });

  it('3. Deve listar riscos, oportunidades e daily brief', async () => {
    const risks = await executiveCopilotService.getRisks(orgId, propId);
    const opportunities = await executiveCopilotService.getOpportunities(orgId, propId);
    const brief = await executiveCopilotService.getBrief(orgId, propId);

    expect(Array.isArray(risks)).toBe(true);
    expect(Array.isArray(opportunities)).toBe(true);
    expect(typeof brief.primaryFocusArea).toBe('string');
  });

  it('4. Deve gerar Resumos Executivos Standard e para IA', async () => {
    const summary = await executiveCopilotService.getSummary(orgId, propId);
    const aiSummary = await executiveCopilotService.getExecutiveCopilotSummaryForAI(orgId, propId);

    expect(typeof summary.overallHealthScore).toBe('number');
    expect(typeof aiSummary.healthScore).toBe('number');
    expect(Array.isArray(aiSummary.topRisks)).toBe(true);
    expect(aiSummary.topRisks.length).toBeLessThanOrEqual(5);
    expect(aiSummary.topOpportunities.length).toBeLessThanOrEqual(5);
  });

  it('5. Deve validar AgentRouter e PromptRegistry do executive_copilot_agent', () => {
    const routeResult = agentRouter.route('Qual é o Health Score executivo, estratégias do CEO e análise do Executive Copilot?');
    expect(routeResult.agentId).toBe('executive_copilot_agent');

    const promptDef = getPrompt('executive_copilot_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
  });

  it('6. Deve integrar executiveCopilotSummary no OperationalContext', async () => {
    const context = await contextService.buildOperationalContext(
      'test_user',
      orgId,
      propId
    );
    expect(context.executiveCopilotSummary).toBeDefined();
    expect(typeof context.executiveCopilotSummary?.healthScore).toBe('number');
  });
});
