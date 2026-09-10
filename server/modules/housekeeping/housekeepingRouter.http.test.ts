import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ listTasks: vi.fn(), updateTaskStatus: vi.fn() }));
vi.mock('./housekeepingService.ts', () => ({ housekeepingService: { listTasks: mocks.listTasks, updateTaskStatus: mocks.updateTaskStatus } }));

import { housekeepingRouter } from './housekeepingRouter.ts';

const request = async (path: string, permissions: string[], init: RequestInit = {}) => new Promise<Response>((resolve) => {
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { req.organizationId = 'org-a'; req.propertyId = 'prop-a'; req.saasUser = { role: 'manager', permissions } as any; next(); });
  app.use('/api/housekeeping', housekeepingRouter);
  const server = app.listen(0, async () => { const port = (server.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}${path}`, init)); server.close(); });
});

beforeEach(() => { vi.clearAllMocks(); mocks.listTasks.mockResolvedValue([]); mocks.updateTaskStatus.mockResolvedValue({ taskId: 'task-a', organizationId: 'org-a', propertyId: 'prop-a', cleaningStatus: 'clean' }); });

describe('housekeeping HTTP boundary', () => {
  it('uses only authenticated tenant context when listing tasks', async () => {
    const response = await request('/api/housekeeping/tasks?propertyId=prop-b', ['view_dashboard']);
    expect(response.status).toBe(200);
    expect(mocks.listTasks).toHaveBeenCalledWith('org-a', 'prop-a', expect.any(Object));
  });

  it('rejects a user without the existing read permission', async () => {
    expect((await request('/api/housekeeping/tasks', [])).status).toBe(403);
    expect(mocks.listTasks).not.toHaveBeenCalled();
  });

  it('requires manage_bookings for status and assignment updates', async () => {
    const denied = await request('/api/housekeeping/tasks/task-a', ['view_dashboard'], { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cleaningStatus: 'clean', assignedStaffId: 'staff-a', organizationId: 'org-b', propertyId: 'prop-b' }) });
    expect(denied.status).toBe(403);
    const allowed = await request('/api/housekeeping/tasks/task-a', ['manage_bookings'], { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cleaningStatus: 'clean', inspectionStatus: 'passed', assignedStaffId: 'staff-a', organizationId: 'org-b', propertyId: 'prop-b' }) });
    expect(allowed.status).toBe(200);
    expect(mocks.updateTaskStatus).toHaveBeenCalledWith('org-a', 'prop-a', 'task-a', expect.objectContaining({ cleaningStatus: 'clean', inspectionStatus: 'passed', assignedStaffId: 'staff-a' }));
  });
});
