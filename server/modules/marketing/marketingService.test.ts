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

import { marketingService } from './marketingService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('MarketingService & Marketing Intelligence (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve retornar Dashboard e Estruturas Principais de Marketing', async () => {
    const dashboard = await marketingService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(Array.isArray(dashboard.segments)).toBe(true);
    expect(dashboard.journey).toBeDefined();
    expect(dashboard.retention).toBeDefined();
    expect(Array.isArray(dashboard.topMarkets)).toBe(true);
    expect(Array.isArray(dashboard.channels)).toBe(true);
    expect(Array.isArray(dashboard.alerts)).toBe(true);
  });

  it('2. Deve segmentar hóspedes e identificar segmento VIP', async () => {
    const segments = await marketingService.getSegments(orgId, propId);
    expect(segments.length).toBeGreaterThanOrEqual(10);
    const vipSeg = segments.find((s) => s.segment === 'vip');
    expect(vipSeg).toBeDefined();
    expect(typeof vipSeg?.count).toBe('number');
  });

  it('3. Deve analisar Customer Journey e Conversões', async () => {
    const journey = await marketingService.getCustomerJourney(orgId, propId);
    expect(journey.stageCounts.official_reservation).toBeDefined();
    expect(typeof journey.conversionRates.proposalToReservationPercent).toBe('number');
  });

  it('4. Deve retornar Mercados Geográficos e Canais', async () => {
    const markets = await marketingService.getMarkets(orgId, propId);
    const channels = await marketingService.getChannels(orgId, propId);
    expect(Array.isArray(markets)).toBe(true);
    expect(Array.isArray(channels)).toBe(true);
  });

  it('5. Deve calcular Retenção e LTV médio', async () => {
    const retention = await marketingService.getRetentionAnalysis(orgId, propId);
    expect(typeof retention.retentionRatePercent).toBe('number');
    expect(typeof retention.averageEstimatedLtv).toBe('number');
    expect(Array.isArray(retention.preferredCategories)).toBe(true);
  });

  it('6. Deve consolidar MarketingSummaryForAI para o agente de marketing', async () => {
    const aiSummary = await marketingService.getMarketingSummaryForAI(orgId, propId);
    expect(Array.isArray(aiSummary.topSegments)).toBe(true);
    expect(Array.isArray(aiSummary.topMarkets)).toBe(true);
    expect(typeof aiSummary.topPerformingChannel).toBe('string');
  });

  it('7. Deve validar AgentRouter e PromptRegistry do marketing_agent em READ-ONLY', () => {
    const routeResult = agentRouter.route('Qual é a nossa taxa de retenção de clientes, LTV médio e os principais segmentos de mercado?');
    expect(routeResult.agentId).toBe('marketing_agent');

    const promptDef = getPrompt('marketing_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('NUNCA dispara campanhas');
  });

  it('8. Deve integrar marketingSummary no OperationalContext', async () => {
    const opContext = await contextService.buildOperationalContext(orgId, propId);
    expect(opContext.marketingSummary).toBeDefined();
  });
});
