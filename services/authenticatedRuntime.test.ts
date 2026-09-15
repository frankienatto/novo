import { describe, expect, it, vi } from 'vitest';
import { restoreCanonicalInternalRuntime } from './authenticatedRuntime.ts';
import type { CanonicalSession } from './canonicalPmsRuntime.ts';

const session: CanonicalSession = {
  userId: 'firebase-uid', name: 'Staging Owner', email: 'owner@staging.test', role: 'owner', permissions: ['view_dashboard'],
  organizationId: 'stg_org_synapse_core', propertyId: 'stg_prop_synapse_core',
};

describe('canonical authenticated runtime restoration', () => {
  it('establishes the admin runtime from a valid SaaS session without email lookup authority', async () => {
    const getSession = vi.fn().mockResolvedValue(session);
    const loadState = vi.fn().mockResolvedValue({ staff: [{ id: 'firebase-uid', role: 'Super Administrador' }] });

    const restored = await restoreCanonicalInternalRuntime(getSession, loadState as any);

    expect(restored.user.id).toBe('firebase-uid');
    expect(restored.user.propertyId).toBe('stg_prop_synapse_core');
    expect(restored.session.organizationId).toBe('stg_org_synapse_core');
    expect(getSession).toHaveBeenCalledOnce();
    expect(loadState).toHaveBeenCalledOnce();
  });

  it('fails closed when a valid session cannot hydrate its canonical staff projection', async () => {
    await expect(restoreCanonicalInternalRuntime(
      vi.fn().mockResolvedValue(session),
      vi.fn().mockResolvedValue({ staff: [] }) as any,
    )).rejects.toThrow('CANONICAL_INTERNAL_RUNTIME_UNPROVISIONED');
  });

  it('propagates a rejected canonical session instead of using a browser fallback', async () => {
    await expect(restoreCanonicalInternalRuntime(
      vi.fn().mockRejectedValue(new Error('HTTP_403')),
      vi.fn(),
    )).rejects.toThrow('HTTP_403');
  });
});
