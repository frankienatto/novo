import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response, Router } from 'express';
import type { Permission, SaaSUser } from '../modules/saas/saasTypes.ts';
import { executiveRouter } from '../modules/executive/executiveRouter.ts';
import { decisionRouter } from '../modules/decision/decisionRouter.ts';
import { approvalRouter } from '../modules/approval/approvalRouter.ts';
import { planningRouter } from '../modules/planning/planningRouter.ts';
import { executionRouter } from '../modules/execution/executionRouter.ts';
import { executiveService } from '../modules/executive/executiveService.ts';
import { decisionService } from '../modules/decision/decisionService.ts';
import { approvalService } from '../modules/approval/approvalService.ts';
import { planningService } from '../modules/planning/planningService.ts';
import { executionService } from '../modules/execution/executionService.ts';

function user(permissions: Permission[]): SaaSUser {
  return {
    userId: 'router-user', organizationId: 'org_a', propertyIds: ['prop_a'], name: 'Router User',
    email: 'router@example.test', role: 'receptionist', permissions, status: 'active', createdAt: '', updatedAt: ''
  };
}

async function invoke(router: Router, method: string, url: string, permissions?: Permission[], body: Record<string, unknown> = {}) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const req = {
      method, url, originalUrl: url, headers: {}, query: {}, body,
      socket: { remoteAddress: '127.0.0.1' },
      saasUser: permissions ? user(permissions) : undefined,
      organizationId: 'org_a', propertyId: 'prop_a',
    } as unknown as Request;
    const res = {
      statusCode: 200,
      setHeader() { return this; },
      status(code: number) { this.statusCode = code; return this; },
      json(payload: unknown) { resolve({ status: this.statusCode, body: payload }); return this; },
    } as unknown as Response;
    (router as unknown as { handle: (req: Request, res: Response, next: (error?: unknown) => void) => void })
      .handle(req, res, (error?: unknown) => error ? reject(error) : resolve({ status: 404, body: null }));
  });
}

describe('P0.2 critical routers enforce their RBAC permission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(executiveService, 'getDashboard').mockResolvedValue({} as never);
    vi.spyOn(decisionService, 'getDashboard').mockResolvedValue({} as never);
    vi.spyOn(approvalService, 'approve').mockResolvedValue({} as never);
    vi.spyOn(planningService, 'generate').mockResolvedValue([]);
    vi.spyOn(executionService, 'startExecution').mockResolvedValue({} as never);
  });

  it('returns 401 before every handler when no authenticated user context exists', async () => {
    expect((await invoke(approvalRouter, 'POST', '/approve', undefined, { recommendationId: 'rec' })).status).toBe(401);
  });

  it('permits executive and decision reads with view_dashboard', async () => {
    expect((await invoke(executiveRouter, 'GET', '/dashboard', ['view_dashboard'])).status).toBe(200);
    expect((await invoke(decisionRouter, 'GET', '/dashboard', ['view_dashboard'])).status).toBe(200);
  });

  it('denies all critical mutations to a dashboard-only user', async () => {
    const readOnly: Permission[] = ['view_dashboard'];
    expect((await invoke(approvalRouter, 'POST', '/approve', readOnly, { recommendationId: 'rec' })).status).toBe(403);
    expect((await invoke(planningRouter, 'POST', '/generate', readOnly)).status).toBe(403);
    expect((await invoke(executionRouter, 'POST', '/start', readOnly, { executionId: 'exec' })).status).toBe(403);
  });

  it('permits only the matching critical action permission', async () => {
    expect((await invoke(approvalRouter, 'POST', '/approve', ['approve_decisions'], { recommendationId: 'rec', decisionBy: 'forged' })).status).toBe(200);
    expect(approvalService.approve).toHaveBeenCalledWith(expect.objectContaining({ decisionBy: 'Router User' }), 'org_a', 'prop_a');
    expect((await invoke(planningRouter, 'POST', '/generate', ['manage_planning'])).status).toBe(200);
    expect((await invoke(executionRouter, 'POST', '/start', ['manage_execution'], { executionId: 'exec', owner: 'forged' })).status).toBe(200);
    expect(executionService.startExecution).toHaveBeenCalledWith('exec', 'org_a', 'prop_a', 'Router User', undefined);
  });
});
