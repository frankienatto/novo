import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createStagingBootstrapRouter } from './stagingBootstrapRouter.ts';

const servers: Array<ReturnType<express.Express['listen']>> = [];

async function request(router: ReturnType<typeof createStagingBootstrapRouter>, authorization?: string, body = '{}') {
  const app = express();
  app.use(express.json());
  app.use('/api/staging', router);
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server unavailable');
  return fetch(`http://127.0.0.1:${address.port}/api/staging/bootstrap`, {
    method: 'POST', headers: authorization ? { authorization } : {}, body,
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

describe('staging bootstrap HTTP boundary', () => {
  it('hides disabled bootstrap and requires a verified Firebase bearer token when enabled', async () => {
    const disabledRouter = createStagingBootstrapRouter({
      config: { enabled: false, allowedUid: 'expected-uid' },
      verifyIdToken: async () => ({ uid: 'expected-uid', email: 'admin@staging.example.test' }),
      bootstrap: async () => { throw new Error('STAGING_BOOTSTRAP_DISABLED'); },
    });
    expect((await request(disabledRouter)).status).toBe(404);
    expect((await request(disabledRouter, 'Bearer valid-token')).status).toBe(404);

    const enabledRouter = createStagingBootstrapRouter({
      config: { enabled: true, allowedUid: 'expected-uid' },
      verifyIdToken: async () => ({ uid: 'expected-uid', email: 'admin@staging.example.test' }),
      bootstrap: async () => ({ status: 'created' }),
    });
    expect((await request(enabledRouter)).status).toBe(401);
  });

  it('does not trust request data and returns only the server-side bootstrap result', async () => {
    const calls: unknown[] = [];
    const router = createStagingBootstrapRouter({
      config: { enabled: true, allowedUid: 'expected-uid' },
      verifyIdToken: async (token) => {
        expect(token).toBe('verified-token');
        return { uid: 'expected-uid', email: 'admin@staging.example.test' };
      },
      bootstrap: async (config, actor) => {
        calls.push({ config, actor });
        return { status: 'created', organizationId: 'stg_org_synapse_core', propertyId: 'stg_prop_synapse_core' };
      },
    });
    const response = await request(router, 'Bearer verified-token', JSON.stringify({ organizationId: 'attacker-org', role: 'owner' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'created', organizationId: 'stg_org_synapse_core' });
    expect(calls).toEqual([{ config: { enabled: true, allowedUid: 'expected-uid' }, actor: { uid: 'expected-uid', email: 'admin@staging.example.test' } }]);
  });
});
