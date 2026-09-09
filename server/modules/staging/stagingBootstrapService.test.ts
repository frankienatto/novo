import { describe, expect, it } from 'vitest';
import { StagingBootstrapService } from './stagingBootstrapService.ts';
import type { IStagingBootstrapRepository, StagingBootstrapPlan, StagingBootstrapResult } from './stagingBootstrapTypes.ts';

class FakeBootstrapRepository implements IStagingBootstrapRepository {
  readonly documents = new Map<string, Record<string, unknown>>();
  failBeforeCommit = false;

  async provision(plan: StagingBootstrapPlan): Promise<StagingBootstrapResult> {
    const keys = plan.documents.map((document) => `${document.collection}/${document.id}`);
    const existing = keys.filter((key) => this.documents.has(key));
    if (existing.length === keys.length) {
      if (existing.every((key) => this.documents.get(key)?.bootstrapKey === plan.key)) return this.result(plan, 'already_provisioned');
      throw new Error('STAGING_BOOTSTRAP_CONFLICT');
    }
    if (existing.length > 0) throw new Error('STAGING_BOOTSTRAP_PARTIAL_STATE');
    if (this.failBeforeCommit) throw new Error('SIMULATED_TRANSACTION_FAILURE');

    const staged = new Map(this.documents);
    plan.documents.forEach((document) => staged.set(`${document.collection}/${document.id}`, document.data));
    this.documents.clear();
    staged.forEach((value, key) => this.documents.set(key, value));
    return this.result(plan, 'created');
  }

  private result(plan: StagingBootstrapPlan, status: StagingBootstrapResult['status']): StagingBootstrapResult {
    return { status, organizationId: plan.organizationId, propertyId: plan.propertyId, publicPropertyId: plan.publicPropertyId, publicUnitIds: plan.publicUnitIds };
  }
}

const actor = { uid: 'firebase-staging-admin-uid', email: 'admin@staging.example.test' };
const enabled = { enabled: true, allowedUid: actor.uid };

describe('secure staging bootstrap', () => {
  it('fails closed when disabled or invoked by another Firebase UID', async () => {
    const service = new StagingBootstrapService(new FakeBootstrapRepository());
    await expect(service.bootstrap({ enabled: false, allowedUid: actor.uid }, actor)).rejects.toThrow('STAGING_BOOTSTRAP_DISABLED');
    await expect(service.bootstrap(enabled, { ...actor, uid: 'another-firebase-uid' })).rejects.toThrow('STAGING_BOOTSTRAP_FORBIDDEN');
  });

  it('creates a complete synthetic staging tenant only once', async () => {
    const repository = new FakeBootstrapRepository();
    const service = new StagingBootstrapService(repository);

    const first = await service.bootstrap(enabled, actor);
    const second = await service.bootstrap(enabled, actor);

    expect(first.status).toBe('created');
    expect(second.status).toBe('already_provisioned');
    expect(repository.documents.size).toBe(11);
    expect(repository.documents.get(`users/${actor.uid}`)).toMatchObject({ organizationId: first.organizationId, propertyIds: [first.propertyId], role: 'owner' });
    expect(repository.documents.get(`staff/${actor.uid}`)).toMatchObject({ organizationId: first.organizationId, propertyId: first.propertyId, role: 'Super Administrador' });
    expect(repository.documents.get(`users/${actor.uid}`)?.permissions).toEqual(expect.arrayContaining(['manage_org', 'manage_properties', 'manage_users']));
    expect(repository.documents.get(`publicBookingProperties/${first.publicPropertyId}`)).toMatchObject({
      active: true, currency: 'brl', ratePlans: [{ ratePlanId: 'stg-standard-rate', active: true }],
    });
    expect(repository.documents.get(`publicBookingUnits/${first.publicPropertyId}__${first.publicUnitIds[0]}`)).toMatchObject({ unitId: 'stg_unit_01' });
    expect(repository.documents.get('roomUnits/stg_unit_01')).toMatchObject({ organizationId: first.organizationId, propertyId: first.propertyId, active: true });
  });

  it('never uses legacy fixture identifiers or fixture inventory', async () => {
    const repository = new FakeBootstrapRepository();
    await new StagingBootstrapService(repository).bootstrap(enabled, actor);
    const serialized = JSON.stringify([...repository.documents.entries()]);
    for (const prohibited of ['P01', 'beach', 'sanctuary', 'org_dev_default', 'prop_dev_default', 'INITIAL_ROOMS', 'database.ts', 'uh_']) {
      expect(serialized).not.toContain(prohibited);
    }
  });

  it('does not commit a partial state when the transaction fails', async () => {
    const repository = new FakeBootstrapRepository();
    repository.failBeforeCommit = true;
    const service = new StagingBootstrapService(repository);
    await expect(service.bootstrap(enabled, actor)).rejects.toThrow('SIMULATED_TRANSACTION_FAILURE');
    expect(repository.documents.size).toBe(0);
  });

  it('fails closed when a conflicting partial state already exists', async () => {
    const repository = new FakeBootstrapRepository();
    repository.documents.set('organizations/stg_org_synapse_core', { bootstrapKey: 'unexpected-bootstrap' });
    await expect(new StagingBootstrapService(repository).bootstrap(enabled, actor)).rejects.toThrow('STAGING_BOOTSTRAP_PARTIAL_STATE');
  });
});
