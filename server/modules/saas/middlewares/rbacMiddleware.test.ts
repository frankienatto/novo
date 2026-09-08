import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { requirePermission } from './rbacMiddleware.ts';
import { ROLE_PERMISSIONS, type Permission, type SaaSUser } from '../saasTypes.ts';

function userWith(permissions: Permission[]): SaaSUser {
  return {
    userId: 'rbac-user', organizationId: 'org_a', propertyIds: ['prop_a'],
    name: 'RBAC User', email: 'rbac@example.test', role: 'receptionist', permissions,
    status: 'active', createdAt: '', updatedAt: ''
  };
}

describe('RBAC governance permissions', () => {
  let req: Partial<Request>;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    next = vi.fn();
  });

  const response = () => ({ status } as unknown as Response);
  const run = (permission: Permission) => requirePermission(permission)(req as Request, response(), next);

  it('returns 401 when the request has no authenticated SaaS user', () => {
    run('view_dashboard');
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows dashboard reads only with view_dashboard', () => {
    req.saasUser = userWith(['view_dashboard']);
    run('view_dashboard');
    expect(next).toHaveBeenCalledOnce();
  });

  it('does not let a dashboard reader approve, plan, or execute', () => {
    req.saasUser = userWith(['view_dashboard']);
    for (const permission of ['approve_decisions', 'manage_planning', 'manage_execution'] as Permission[]) {
      run(permission);
      expect(status).toHaveBeenLastCalledWith(403);
    }
  });

  it('keeps the three critical permissions independent', () => {
    const cases: Array<[Permission, Permission[]]> = [
      ['approve_decisions', ['manage_planning', 'manage_execution']],
      ['manage_planning', ['approve_decisions', 'manage_execution']],
      ['manage_execution', ['approve_decisions', 'manage_planning']],
    ];

    for (const [granted, denied] of cases) {
      req.saasUser = userWith([granted]);
      run(granted);
      expect(next).toHaveBeenCalled();
      for (const permission of denied) {
        run(permission);
        expect(status).toHaveBeenLastCalledWith(403);
      }
    }
  });

  it('grants all critical permissions only to owner and admin roles', () => {
    for (const role of ['owner', 'admin'] as const) {
      expect(ROLE_PERMISSIONS[role]).toEqual(expect.arrayContaining([
        'approve_decisions', 'manage_planning', 'manage_execution'
      ]));
    }
    for (const role of ['manager', 'receptionist', 'housekeeping', 'financial'] as const) {
      expect(ROLE_PERMISSIONS[role]).not.toEqual(expect.arrayContaining([
        'approve_decisions'
      ]));
      expect(ROLE_PERMISSIONS[role]).not.toEqual(expect.arrayContaining([
        'manage_planning'
      ]));
      expect(ROLE_PERMISSIONS[role]).not.toEqual(expect.arrayContaining([
        'manage_execution'
      ]));
    }
  });
});
