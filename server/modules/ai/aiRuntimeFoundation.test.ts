import { describe, expect, it, afterEach } from 'vitest';
import { DeterministicFakeAiProvider, GeminiAiProvider, getAiProvider, setAiProviderForTests } from './aiProvider.ts';
import { AGENT_ACTION_ALLOWLIST, validateAgentProposedActions } from './agentActions.ts';
import { buildContextForAgent, getAgentContextBlocks } from './contextPolicy.ts';
import { aiAuditRepository, createAiRunAudit } from './aiAuditRepository.ts';
import type { OperationalContext } from './aiTypes.ts';
import { compileSystemInstruction } from '../../ai/promptRegistry.ts';

const sourceContext: OperationalContext = {
  organization: { organizationId: 'org_a', name: 'A', plan: 'pro' },
  property: { propertyId: 'prop_a', name: 'A', type: 'hotel' },
  user: { userId: 'user_a', name: 'Operador', role: 'admin' },
  pmsData: { categories: [], units: [{ unitId: 'u1', unitNumber: '1', status: 'clean', active: true, password: 'no' }], reservations: [{ reservationId: 'same', unitId: 'u1', status: 'confirmed', guest: { fullName: 'Ana', email: 'ana@example.test', document: '123.456.789-00' }, stayPeriod: { checkInDate: '2026-01-01', checkOutDate: '2026-01-02', numberOfNights: 1 }, totalAmount: 100, paymentStatus: 'paid' }], summary: { totalCategories: 1, totalUnits: 1, activeUnits: 1, occupiedUnits: 1, dirtyUnits: 0, cleanUnits: 1, inspectedUnits: 0, maintenanceUnits: 0, outOfServiceUnits: 0, occupancyRatePercent: 100, totalActiveReservations: 1 } },
  sessionHistory: [], metadata: { timestamp: '2026-01-01T00:00:00.000Z' }, executiveSummary: { guestEmail: 'no@example.test', occupancy: 100 } as any
};

describe('AI runtime deterministic foundation', () => {
  afterEach(() => { setAiProviderForTests(); aiAuditRepository.clearForTests(); });

  it('uses deterministic fake provider in tests and never needs Gemini credentials', async () => {
    const provider = getAiProvider();
    expect(provider).toBeInstanceOf(DeterministicFakeAiProvider);
    await expect(provider.generate({ model: 'test', prompt: 'x', systemInstruction: 'y' })).resolves.toMatchObject({ provider: 'deterministic_fake' });
  });

  it('fails closed when the production provider has no configured Gemini key', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previous = process.env.GEMINI_API_KEY;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.GEMINI_API_KEY;
      expect(getAiProvider()).toBeInstanceOf(GeminiAiProvider);
      await expect(new GeminiAiProvider().generate({ model: 'test', prompt: 'x', systemInstruction: 'y' })).rejects.toThrow('AI_PROVIDER_NOT_CONFIGURED');
    } finally {
      if (previousNodeEnv) process.env.NODE_ENV = previousNodeEnv;
      else delete process.env.NODE_ENV;
      if (previous) process.env.GEMINI_API_KEY = previous;
    }
  });

  it('minimizes context by agent and removes PII, payment data and secrets', () => {
    const revenue = buildContextForAgent('revenue_agent', sourceContext);
    const serialized = JSON.stringify(revenue);
    expect(getAgentContextBlocks('revenue_agent')).toEqual(['pms', 'revenue']);
    expect(serialized).not.toContain('Ana');
    expect(serialized).not.toContain('ana@example.test');
    expect(serialized).not.toContain('123.456.789-00');
    expect(serialized).not.toContain('paymentStatus');
    expect(serialized).not.toContain('totalAmount');
    expect(revenue.pmsData?.reservations[0]).toMatchObject({ reservationId: 'same', unitId: 'u1' });
    expect(revenue.pmsData?.housekeeping).toBeUndefined();
  });

  it('keeps identical resource IDs tenant-scoped and treats hostile notes as data', () => {
    const tenantB: OperationalContext = { ...sourceContext, organization: { organizationId: 'org_b', name: 'B', plan: 'pro' }, property: { propertyId: 'prop_b', name: 'B', type: 'hotel' } };
    const contextA = buildContextForAgent('reception_agent', sourceContext);
    const contextB = buildContextForAgent('reception_agent', tenantB);
    expect(contextA.organization?.organizationId).toBe('org_a');
    expect(contextB.organization?.organizationId).toBe('org_b');
    const instruction = compileSystemInstruction('reception_agent', undefined, {}, contextA);
    expect(instruction).toContain('dados não confiáveis');
    expect(instruction).toContain('Não proponha ações fora da allowlist');
  });

  it('accepts only allowlisted actions with an existing RBAC permission', () => {
    const actions = validateAgentProposedActions([{ type: 'CREATE_DECISION_PROPOSAL', summary: 'Abrir decisão', payload: {} }], ['view_dashboard']);
    expect(actions).toHaveLength(1);
    expect(AGENT_ACTION_ALLOWLIST.CREATE_DECISION_PROPOSAL.requiresApproval).toBe(true);
    expect(() => validateAgentProposedActions([{ type: 'CREATE_PLANNING_PROPOSAL', summary: 'Plano', payload: {} }], ['view_dashboard'])).toThrow('AI_ACTION_PERMISSION_DENIED');
    expect(() => validateAgentProposedActions([{ type: 'MARK_PAYMENT_PAID', summary: 'Fraude', payload: {} }], ['view_dashboard'])).toThrow();
  });

  it('records a sanitized, tenant-scoped audit entry without raw PII or secrets', async () => {
    const record = createAiRunAudit({ organizationId: 'org_a', propertyId: 'prop_a', agentId: 'executive_agent', actorUserId: 'user_a', status: 'completed', task: 'Contato ana@example.test token=abc', proposedActionTypes: ['CREATE_DECISION_PROPOSAL'], requiresApproval: true, resultStatus: 'generated', provider: 'deterministic_fake' });
    await aiAuditRepository.record(record);
    const saved = aiAuditRepository.listForTests()[0]!;
    expect(saved.organizationId).toBe('org_a');
    expect(saved.actorUserId).toBe('user_a');
    expect(saved.sanitizedTaskSummary).not.toContain('ana@example.test');
    expect(saved.sanitizedTaskSummary).not.toContain('abc');
  });
});
