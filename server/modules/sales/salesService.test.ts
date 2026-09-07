import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockFirestore } from '../../test/mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock_uid' }),
  }),
  getFirebaseAdminApp: () => ({}),
}));

import { salesService } from './salesService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('SalesService & Sales CRM Integration (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve calcular métricas e gerar o Dashboard do Sales CRM', async () => {
    const dashboard = await salesService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(dashboard.summary).toBeDefined();
    expect(typeof dashboard.summary.totalOpportunities).toBe('number');
    expect(typeof dashboard.summary.conversionRatePercent).toBe('number');
    expect(Array.isArray(dashboard.topOpportunities)).toBe(true);
    expect(Array.isArray(dashboard.overdueFollowUps)).toBe(true);
  });

  it('2. Deve gerenciar o ciclo de vida completo de uma Oportunidade Comercial', async () => {
    const newOpp = await salesService.createOpportunity(orgId, propId, {
      leadName: 'Roberto Carlos Braga',
      leadEmail: 'roberto@reimusica.com.br',
      leadPhone: '+55 11 98888-0000',
      stage: 'lead',
      temperature: 'warm',
      source: 'whatsapp',
      estimatedValue: 4500,
      categoryInterest: 'Suíte Presidencial',
      ownerName: 'Paula (Vendas)',
      notes: 'Interesse para fim de semana especial com a família.',
      nextFollowUp: {
        dueDate: '2026-09-10',
        time: '15:00',
        priority: 'high',
        actionDescription: 'Enviar proposta comercial detalhada com café incluso',
      },
    });

    expect(newOpp.opportunityId).toBeDefined();
    expect(newOpp.stage).toBe('lead');
    expect(newOpp.nextFollowUp?.priority).toBe('high');

    // Atualizar para negotiation
    const updatedNegotiating = await salesService.updateOpportunity(newOpp.opportunityId, orgId, propId, {
      stage: 'negotiation',
      temperature: 'hot',
    });
    expect(updatedNegotiating?.stage).toBe('negotiation');
    expect(updatedNegotiating?.temperature).toBe('hot');

    // Atualizar para won
    const updatedWon = await salesService.updateOpportunity(newOpp.opportunityId, orgId, propId, {
      stage: 'won',
      proposalId: 'prop_991',
    });
    expect(updatedWon?.stage).toBe('won');
    expect(updatedWon?.convertedAt).toBeDefined();
  });

  it('3. Deve registrar interações e agendar follow-ups', async () => {
    const opp = await salesService.createOpportunity(orgId, propId, {
      leadName: 'Interação Teste',
      leadEmail: 'interacao@teste.com',
      stage: 'lead',
      estimatedValue: 1200,
    });

    const withInteraction = await salesService.addInteraction(opp.opportunityId, orgId, propId, {
      type: 'whatsapp',
      summary: 'Cliente confirmou recebimento da proposta e pagamento via Pix.',
      authorName: 'Paula (Vendas)',
    });
    expect(withInteraction?.interactions.length).toBeGreaterThanOrEqual(1);

    const withFollowUp = await salesService.scheduleFollowUp(opp.opportunityId, orgId, propId, {
      dueDate: '2026-09-15',
      priority: 'low',
      actionDescription: 'Enviar mensagem de pré-boas-vindas antes do check-in',
    });
    expect(withFollowUp?.nextFollowUp?.actionDescription).toBe('Enviar mensagem de pré-boas-vindas antes do check-in');
  });

  it('4. Deve consolidar o resumo de vendas para a IA (ContextService)', async () => {
    const aiSummary = await salesService.getSalesSummaryForAI(orgId, propId);
    expect(typeof aiSummary.totalPipelineValue).toBe('number');
    expect(Array.isArray(aiSummary.commercialAlerts)).toBe(true);
    expect(Array.isArray(aiSummary.salesOpportunities)).toBe(true);
  });

  it('5. Deve validar o AgentRouter e PromptRegistry para sales_agent', () => {
    const routeResult = agentRouter.route('Como está a performance de vendas e o funil de leads do hotel este mês?');
    expect(routeResult.agentId).toBe('sales_agent');

    const promptDef = getPrompt('sales_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
  });

  it('6. Deve integrar o salesSummary no OperationalContext', async () => {
    const opContext = await contextService.buildOperationalContext(orgId, propId);
    expect(opContext.salesSummary).toBeDefined();
  });
});
