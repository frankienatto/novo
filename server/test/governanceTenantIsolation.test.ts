import { describe, expect, it, vi } from 'vitest';
import { createMockFirestore } from './mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../config/firebaseAdmin.ts', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({ verifyIdToken: vi.fn().mockResolvedValue({ uid: 'p02-test-user' }) }),
  getFirebaseAdminApp: () => ({}),
}));
import { approvalService } from '../modules/approval/approvalService.ts';
import { approvalRepository } from '../modules/approval/approvalRepository.ts';
import { planningService } from '../modules/planning/planningService.ts';
import { executionService } from '../modules/execution/executionService.ts';

const tenantA = { organizationId: 'p02_org_a', propertyId: 'p02_prop_a' };
const tenantB = { organizationId: 'p02_org_b', propertyId: 'p02_prop_b' };

describe('P0.2 governance repository tenant isolation', () => {
  it('isolates same playbook and execution IDs between tenants', async () => {
    const recommendationId = 'p02_playbook_collision';
    for (const tenant of [tenantA, tenantB]) {
      await approvalRepository.submitRecommendation({
        recommendationId,
        title: 'Collision test', description: 'Scoped planning record', moduleOrigin: 'decision_engine',
        organizationId: tenant.organizationId, propertyId: tenant.propertyId,
      });
    }
    const playbooksA = await planningService.generate(tenantA.organizationId, tenantA.propertyId);
    const playbooksB = await planningService.generate(tenantB.organizationId, tenantB.propertyId);
    expect(playbooksA).toHaveLength(playbooksA.length);
    expect(playbooksA.every(p => p.organizationId === tenantA.organizationId && p.propertyId === tenantA.propertyId)).toBe(true);
    expect(playbooksB.every(p => p.organizationId === tenantB.organizationId && p.propertyId === tenantB.propertyId)).toBe(true);
    expect(playbooksA.map(p => p.playbookId)).toContain(`pb_plan_${recommendationId}`);
    expect(playbooksB.map(p => p.playbookId)).toContain(`pb_plan_${recommendationId}`);

    const sharedExecutionId = 'exec_p02_collision';
    await executionService.startExecution(sharedExecutionId, tenantA.organizationId, tenantA.propertyId, 'Owner A');
    await executionService.startExecution(sharedExecutionId, tenantB.organizationId, tenantB.propertyId, 'Owner B');
    await executionService.updateProgress(sharedExecutionId, tenantA.organizationId, tenantA.propertyId, 75, [], 'A only');

    const executionsA = await executionService.getExecutions(tenantA.organizationId, tenantA.propertyId);
    const executionsB = await executionService.getExecutions(tenantB.organizationId, tenantB.propertyId);
    expect(executionsA.every(e => e.organizationId === tenantA.organizationId && e.propertyId === tenantA.propertyId)).toBe(true);
    expect(executionsB.every(e => e.organizationId === tenantB.organizationId && e.propertyId === tenantB.propertyId)).toBe(true);
    expect(executionsA.find(e => e.executionId === sharedExecutionId)?.progressPercent).toBe(75);
    expect(executionsB.find(e => e.executionId === sharedExecutionId)?.progressPercent).toBe(20);

    await planningService.rebuild(tenantB.organizationId, tenantB.propertyId);
    expect((await planningService.getPlaybooks(tenantA.organizationId, tenantA.propertyId))
      .every(p => p.organizationId === tenantA.organizationId && p.propertyId === tenantA.propertyId)).toBe(true);
  });

  it('isolates a deliberately colliding recommendation ID between tenants', async () => {
    const recommendationId = 'p02_recommendation_collision';
    await approvalService.approve({ recommendationId, decisionBy: 'Owner A' }, tenantA.organizationId, tenantA.propertyId);
    await approvalService.reject({ recommendationId, decisionBy: 'Owner B' }, tenantB.organizationId, tenantB.propertyId);

    const historyA = await approvalService.getHistory(tenantA.organizationId, tenantA.propertyId);
    const historyB = await approvalService.getHistory(tenantB.organizationId, tenantB.propertyId);
    const recordA = historyA.find(r => r.recommendationId === recommendationId);
    const recordB = historyB.find(r => r.recommendationId === recommendationId);
    expect(recordA).toMatchObject({ organizationId: tenantA.organizationId, propertyId: tenantA.propertyId, status: 'approved', decisionBy: 'Owner A' });
    expect(recordB).toMatchObject({ organizationId: tenantB.organizationId, propertyId: tenantB.propertyId, status: 'rejected', decisionBy: 'Owner B' });
  });
});
