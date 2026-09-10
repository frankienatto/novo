import { describe, expect, it, vi } from 'vitest';

const getIdToken = vi.fn();
vi.mock('./firebase.ts', () => ({ auth: { get currentUser() { return { getIdToken }; } } }));

import { createCanonicalRoom, getCanonicalSession } from './canonicalPmsRuntime.ts';

describe('canonical PMS runtime client', () => {
  it('uses a Firebase bearer token and never sends tenant or property override headers', async () => {
    getIdToken.mockResolvedValue('verified-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { userId: 'u', name: 'User', email: 'u@example.test', role: 'owner', permissions: [], organizationId: 'org', propertyId: 'prop' } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getCanonicalSession()).resolves.toMatchObject({ organizationId: 'org', propertyId: 'prop' });
    expect(fetchMock).toHaveBeenCalledWith('/api/saas/session', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer verified-token' }) }));
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['X-Organization-ID']).toBeUndefined();
    expect(headers['X-Property-ID']).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it('creates a unit through the authenticated PMS API after scoped category resolution', async () => {
    getIdToken.mockResolvedValue('verified-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [{ categoryId: 'cat-1', name: 'Privado', active: true }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { unitId: 'unit-1', propertyId: 'prop', categoryId: 'cat-1', unitNumber: '101', status: 'clean', active: true } }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createCanonicalRoom({ name: '101', type: 'Privado' })).resolves.toMatchObject({ unitId: 'unit-1' });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/pms/units');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer verified-token' }) });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ categoryId: 'cat-1', unitNumber: '101', status: 'clean' });
    vi.unstubAllGlobals();
  });
});
