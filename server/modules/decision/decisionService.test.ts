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

import { decisionService } from './decisionService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('DecisionService & Decision Engine (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar o Dashboard do Decision Engine', async () => {
    const dashboard = await decisionService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.totalPendingRecommendations).toBe('number');
    expect(typeof dashboard.confidenceAverage).toBe('number');
    expect(Array.isArray(dashboard.executiveActionQueue)).toBe(true);
    expect(dashboard.executiveActionQueue.length).toBeGreaterThan(0);
  });

  it('2. Deve validar status pending_approval e aprovação humana em 100% das recomendações', async () => {
    const dashboard = await decisionService.getDashboard(orgId, propId);
    dashboard.executiveActionQueue.forEach((rec) => {
      expect(rec.status).toBe('pending_approval');
      expect(rec.approvalRequired).toBe(true);
    });
  });

  it('3. Deve listar recomendações, prioridades e sumário executivo', async () => {
    const recommendations = await decisionService.getRecommendations(orgId, propId);
    const priorities = await decisionService.getPriorities(orgId, propId);
    const summary = await decisionService.getSummary(orgId, propId);

    expect(Array.isArray(recommendations)).toBe(true);
    expect(Array.isArray(priorities.dailyPriorities)).toBe(true);
    expect(typeof summary.highestPriorityAction).toBe('string');
  });

  it('4. Deve gerar DecisionSummaryForAI para o ContextService', async () => {
    const aiSummary = await decisionService.getDecisionSummaryForAI(orgId, propId);
    expect(typeof aiSummary.totalRecommendations).toBe('number');
    expect(typeof aiSummary.confidenceAverage).toBe('number');
    expect(typeof aiSummary.nextRecommendedAction).toBe('string');
  });

  it('5. Deve validar AgentRouter e PromptRegistry do decision_agent', () => {
    const routeResult = agentRouter.route('Qual é a recomendação para hoje, plano de ação e prioridade do decision engine?');
    expect(routeResult.agentId).toBe('decision_agent');

    const promptDef = getPrompt('decision_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('pending_approval');
  });

  it('6. Deve integrar o decisionSummary no ContextService', async () => {
    const context = await contextService.buildOperationalContext(
      orgId,
      propId,
      'test_user'
    );
    expect(context.decisionSummary).toBeDefined();
    expect(typeof context.decisionSummary?.totalRecommendations).toBe('number');
  });
});
