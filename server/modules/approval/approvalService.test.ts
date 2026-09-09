import { beforeAll, describe, it, expect, vi } from 'vitest';
import { createMockFirestore } from '../../test/mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock_uid' }),
  }),
  getFirebaseAdminApp: () => ({}),
}));

import { approvalService } from './approvalService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';
import { approvalRepository } from './approvalRepository.ts';

describe('ApprovalService & Human Approval Workflow (Unit / Domain)', () => {
  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  beforeAll(async () => {
    // Fixture explícita: os testes de domínio não dependem de dashboards ou
    // Firestore externos para produzir uma recomendação pendente.
    await approvalRepository.submitRecommendation({
      recommendationId: 'rec_approval_test_fixture',
      title: 'Recomendação de teste',
      description: 'Fixture determinística para o fluxo de aprovação.',
      moduleOrigin: 'test_fixture',
      organizationId: orgId,
      propertyId: propId,
    });
  });

  it('1. Deve carregar o Dashboard do Human Approval Workflow', async () => {
    const dashboard = await approvalService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.pendingCount).toBe('number');
    expect(typeof dashboard.approvedCount).toBe('number');
    expect(typeof dashboard.rejectedCount).toBe('number');
    expect(typeof dashboard.backlogCount).toBe('number');
    expect(dashboard.systemStatus).toBe('read_only_governance');
  });

  it('2. Deve listar itens pendentes de aprovação humana com governança', async () => {
    const pending = await approvalService.getPending(orgId, propId);
    expect(Array.isArray(pending)).toBe(true);
    expect(pending.length).toBeGreaterThan(0);
    pending.forEach((item) => {
      expect(item.status).toBe('pending_approval');
      expect(typeof item.approvalId).toBe('string');
      expect(typeof item.recommendationId).toBe('string');
      expect(typeof item.correlationId).toBe('string');
      expect(typeof item.requestId).toBe('string');
    });
  });

  it('3. Deve registrar a aprovação humana de uma recomendação', async () => {
    const pending = await approvalService.getPending(orgId, propId);
    const targetToApprove = pending[0].recommendationId;
    const approvedRecord = await approvalService.approve(
      {
        recommendationId: targetToApprove,
        decisionBy: 'Diretor de Operações - Teste Automatizado',
        reason: 'Viabilidade confirmada pela gerência',
        comments: 'Implementação agendada para execução manual no Aloha PMS',
      },
      orgId,
      propId
    );

    expect(approvedRecord).toBeDefined();
    expect(approvedRecord.status).toBe('approved');
    expect(approvedRecord.decisionBy).toBe('Diretor de Operações - Teste Automatizado');
    expect(approvedRecord.decisionDate.length).toBeGreaterThan(0);
    expect(approvedRecord.reason).toBe('Viabilidade confirmada pela gerência');
    expect(approvedRecord.comments).toContain('Aloha PMS');
  });

  it('4. Deve registrar a rejeição humana de uma recomendação', async () => {
    const pending = await approvalService.getPending(orgId, propId);
    const targetToReject = pending.length > 1 ? pending[1].recommendationId : 'rec_test_reject_123';
    const rejectedRecord = await approvalService.reject(
      {
        recommendationId: targetToReject,
        decisionBy: 'Gerente Geral - Teste Automatizado',
        reason: 'Incompatível com orçamento do mês',
        comments: 'Decisão do comitê de não prosseguir com esta ação',
      },
      orgId,
      propId
    );

    expect(rejectedRecord).toBeDefined();
    expect(rejectedRecord.status).toBe('rejected');
    expect(rejectedRecord.decisionBy).toBe('Gerente Geral - Teste Automatizado');
    expect(rejectedRecord.decisionDate.length).toBeGreaterThan(0);
  });

  it('5. Deve obter o histórico de auditoria do workflow', async () => {
    const history = await approvalService.getHistory(orgId, propId);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it('6. Deve gerar o resumo do módulo de aprovação para a IA', async () => {
    const summaryForAi = await approvalService.getApprovalSummaryForAI(orgId, propId);
    expect(typeof summaryForAi.pending).toBe('number');
    expect(typeof summaryForAi.approvedToday).toBe('number');
    expect(typeof summaryForAi.rejectedToday).toBe('number');
    expect(typeof summaryForAi.averageApprovalTime).toBe('string');
    expect(typeof summaryForAi.oldestPending).toBe('string');
  });

  it('7. Deve validar o AgentRouter e PromptRegistry do approval_agent', () => {
    const routeResult = agentRouter.route('Qual é o status de aprovação e o histórico de auditoria do workflow de governança?');
    expect(routeResult.agentId).toBe('approval_agent');

    const promptDef = getPrompt('approval_agent');
    expect(promptDef).toBeDefined();
    expect(promptDef?.systemInstruction).toContain('READ-ONLY');
    expect(promptDef?.systemInstruction).toContain('NENHUMA recomendação');
  });

  it('8. Deve integrar o approvalSummary no OperationalContext', async () => {
    const context = await contextService.buildOperationalContext(orgId, propId, 'test_user');
    expect(context.approvalSummary).toBeDefined();
    expect(typeof context.approvalSummary?.pending).toBe('number');
  });
});
