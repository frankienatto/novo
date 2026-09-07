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

import { revenueService } from './revenueService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('RevenueService & Revenue Intelligence (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve carregar Dashboard Completo com KPIs, forecast e canais', async () => {
    const dashboard = await revenueService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(dashboard.summary).toBeDefined();
    expect(typeof dashboard.summary.adr).toBe('number');
    expect(typeof dashboard.summary.revPar).toBe('number');
    expect(dashboard.forecast.days7.length).toBe(7);
    expect(dashboard.forecast.days15.length).toBe(15);
    expect(dashboard.forecast.days30.length).toBe(30);
    expect(Array.isArray(dashboard.revenueByChannel)).toBe(true);
    expect(Array.isArray(dashboard.revenueByCategory)).toBe(true);
    expect(Array.isArray(dashboard.revenueByProperty)).toBe(true);
    expect(dashboard.weekdayOccupancy.length).toBe(7);
  });

  it('2. Deve obter forecast customizado de 14 dias', async () => {
    const forecast14 = await revenueService.getForecast(orgId, propId, 14);
    expect(forecast14.length).toBe(14);
  });

  it('3. Deve fornecer resumo de receita para a IA (ContextService)', async () => {
    const aiSummary = await revenueService.getRevenueSummaryForAI(orgId, propId);
    expect(typeof aiSummary.occupancyToday).toBe('number');
    expect(typeof aiSummary.topChannel).toBe('string');
    expect(Array.isArray(aiSummary.alerts)).toBe(true);
    expect(Array.isArray(aiSummary.trends)).toBe(true);
  });

  it('4. Deve validar AgentRouter para o revenue_agent com confiança HIGH', () => {
    const routeRevPAR = agentRouter.route('Qual é o RevPAR e o ADR esperado para o próximo mês?');
    expect(routeRevPAR.agentId).toBe('revenue_agent');
    expect(routeRevPAR.confidence).toBe('HIGH');

    const routeForecast = agentRouter.route('Mostre o forecast de ocupação e booking pace');
    expect(routeForecast.agentId).toBe('revenue_agent');
  });

  it('5. Deve validar PromptRegistry para revenue_agent com diretiva READ-ONLY', () => {
    const promptDef = getPrompt('revenue_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
  });

  it('6. Deve integrar revenueSummary no OperationalContext', async () => {
    const opContext = await contextService.buildOperationalContext(orgId, propId);
    expect(opContext.revenueSummary).toBeDefined();
  });
});
