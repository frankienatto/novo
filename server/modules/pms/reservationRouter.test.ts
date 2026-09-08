import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { getTenantContext } from './reservationRouter.ts';

describe('reservationRouter tenant context', () => {
  it('uses only context produced by tenantMiddleware', () => {
    const request = {
      organizationId: 'org_authorized',
      propertyId: 'prop_authorized',
      headers: { 'x-organization-id': 'org_attacker', 'x-property-id': 'prop_attacker' },
      query: { organizationId: 'org_attacker', propertyId: 'prop_attacker' },
      body: { organizationId: 'org_attacker', propertyId: 'prop_attacker' },
    } as unknown as Request;

    expect(getTenantContext(request)).toEqual({ organizationId: 'org_authorized', propertyId: 'prop_authorized' });
  });

  it('fails closed without a validated tenant context', () => {
    expect(() => getTenantContext({ headers: {}, query: {}, body: {} } as Request)).toThrow('Validated tenant context is required');
  });
});
