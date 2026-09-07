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

import { executiveService } from './executiveService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('ExecutiveService & Executive Intelligence (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar o Dashboard Executivo com KPIs e alertas', async () => {
    const dashboard = await executiveService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(dashboard.kpis).toBeDefined();
    expect(typeof dashboard.kpis.revenue.totalRevenue).toBe('number');
    expect(typeof dashboard.kpis.revenue.revpar).toBe('number');
    expect(Array.isArray(dashboard.alerts)).toBe(true);
    expect(Array.isArray(dashboard.priorities.dailyPriorities)).toBe(true);
    expect(dashboard.summary.operationalToday).toBeDefined();
  });

  it('2. Deve obter KPIs Isolados de receita, comercial e operações', async () => {
    const kpis = await executiveService.getKpis(orgId, propId);
    expect(typeof kpis.revenue.occupancyRatePercent).toBe('number');
    expect(typeof kpis.commercial.pipelineValue).toBe('number');
    expect(typeof kpis.operations.inHouseCount).toBe('number');
  });

  it('3. Deve listar alertas e prioridades com riscos operacionais', async () => {
    const alerts = await executiveService.getAlerts(orgId, propId);
    const priorities = await executiveService.getPriorities(orgId, propId);
    expect(Array.isArray(alerts)).toBe(true);
    expect(priorities.operationalRisks.length).toBeGreaterThan(0);
  });

  it('4. Deve gerar resumo do módulo financeiro e operacional', async () => {
    const summaryModule = await executiveService.getSummaryModule(orgId, propId);
    expect(typeof summaryModule.financialAnalyticalSummary).toBe('string');
    expect(typeof summaryModule.receptionSummary).toBe('string');
  });

  it('5. Deve consolidar ExecutiveSummaryForAI para o agente executivo', async () => {
    const aiSummary = await executiveService.getExecutiveSummaryForAI(orgId, propId);
    expect(typeof aiSummary.kpis.totalRevenue).toBe('number');
    expect(Array.isArray(aiSummary.topDailyPriorities)).toBe(true);
    expect(Array.isArray(aiSummary.topExecutiveAlerts)).toBe(true);
  });

  it('6. Deve validar AgentRouter e PromptRegistry do executive_agent com READ-ONLY', () => {
    const routeResult = agentRouter.route('Qual é o resumo executivo, KPIs de diretoria e principais riscos operacionais de hoje?');
    expect(routeResult.agentId).toBe('executive_agent');

    const promptDef = getPrompt('executive_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('NUNCA altera tarifas');
  });

  it('7. Deve integrar executiveSummary no OperationalContext', async () => {
    const opContext = await contextService.buildOperationalContext(orgId, propId);
    expect(opContext.executiveSummary).toBeDefined();
  });
});
