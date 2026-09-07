import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/environment.ts';
import { authenticateN8n, extractTenantContext } from './n8nRouter.ts';

describe('n8nRouter security boundary', () => {
  let req: Partial<Request>;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;
  let next: NextFunction;

  beforeEach(() => {
    (env as any).N8N_SECRET = 'test-n8n-secret';
    (env as any).N8N_ORGANIZATION_ID = 'org_authorized';
    (env as any).N8N_PROPERTY_ID = 'prop_authorized';
    req = { headers: {}, body: {} };
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    next = vi.fn();
  });

  const response = () => ({ status } as unknown as Response);

  it('rejects a request without authentication', () => {
    authenticateN8n(req as Request, response(), next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', () => {
    req.headers = { 'x-n8n-api-key': 'invalid' };
    authenticateN8n(req as Request, response(), next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a missing configured tenant', () => {
    (env as any).N8N_ORGANIZATION_ID = undefined;
    extractTenantContext(req as Request, response(), next);
    expect(status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a request attempting to switch organization or property', () => {
    req.headers = { 'x-organization-id': 'org_other' };
    extractTenantContext(req as Request, response(), next);
    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts the configured key and derives tenant only from server configuration', () => {
    req.headers = {
      'x-n8n-api-key': 'test-n8n-secret',
      'x-organization-id': 'org_authorized',
      'x-property-id': 'prop_authorized'
    };
    authenticateN8n(req as Request, response(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const tenantNext = vi.fn();
    extractTenantContext(req as Request, response(), tenantNext);
    expect(tenantNext).toHaveBeenCalledTimes(1);
    expect((req as any).organizationId).toBe('org_authorized');
    expect((req as any).propertyId).toBe('prop_authorized');
  });
});
