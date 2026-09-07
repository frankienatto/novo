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

import { directBookingService } from './directBookingService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

describe('DirectBookingService & Proposals (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  it('1. Deve retornar Dashboard e Métricas do Direct Booking', async () => {
    const dashboard = await directBookingService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(dashboard.summary).toBeDefined();
    expect(typeof dashboard.summary.totalProposals).toBe('number');
    expect(typeof dashboard.summary.conversionRatePercent).toBe('number');
    expect(Array.isArray(dashboard.recentProposals)).toBe(true);
  });

  it('2. Deve criar e atualizar proposta comercial com cálculo correto', async () => {
    const newProp = await directBookingService.createProposal(orgId, propId, {
      leadName: 'Fernanda Montenegro',
      leadEmail: 'fernanda@teatro.com.br',
      categoryName: 'Suíte Luxo',
      checkInDate: '2026-09-01',
      checkOutDate: '2026-09-04',
      offeredRateDaily: 500,
      discountPercent: 10,
      sourceChannel: 'whatsapp',
      attendantName: 'Paula Vendas',
    });

    expect(newProp.proposalId).toBeDefined();
    expect(newProp.status).toBe('sent');
    expect(newProp.numberOfNights).toBe(3);
    expect(newProp.totalAmount).toBe(1500);

    const updated = await directBookingService.updateProposal(newProp.proposalId, orgId, propId, {
      status: 'accepted',
      convertedReservationId: 'res_aloha_99100',
    });

    expect(updated?.status).toBe('accepted');
    expect(updated?.convertedReservationId).toBe('res_aloha_99100');
  });

  it('3. Deve gerar resumo de reservas diretas para IA (ContextService)', async () => {
    const aiSummary = await directBookingService.getDirectBookingSummaryForAI(orgId, propId);
    expect(typeof aiSummary.openProposalsCount).toBe('number');
    expect(Array.isArray(aiSummary.commercialAlerts)).toBe(true);
  });

  it('4. Deve validar roteamento do direct_booking_agent e instruções READ-ONLY', () => {
    const routeProp = agentRouter.route('Como posso criar um orçamento ou cotação para enviar pelo WhatsApp?');
    expect(routeProp.agentId).toBe('direct_booking_agent');

    const promptDef = getPrompt('direct_booking_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
  });

  it('5. Deve injetar directBookingSummary no OperationalContext', async () => {
    const opContext = await contextService.buildOperationalContext(orgId, propId);
    expect(opContext.directBookingSummary).toBeDefined();
  });
});
