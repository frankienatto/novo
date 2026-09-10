import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDashboardData: vi.fn(), getTodayCheckins: vi.fn(), getOperationalAlerts: vi.fn() }));
vi.mock('./receptionService.ts', () => ({ receptionService: mocks }));
import { receptionRouter } from './receptionRouter.ts';

const request = async (path: string, permissions: string[]) => new Promise<Response>((resolve) => {
  const app = express(); app.use((req, _res, next) => { req.organizationId = 'org-a'; req.propertyId = 'prop-a'; req.saasUser = { role: 'receptionist', permissions } as any; next(); }); app.use('/api/reception', receptionRouter);
  const server = app.listen(0, async () => { const port = (server.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}${path}`)); server.close(); });
});

beforeEach(() => { vi.clearAllMocks(); mocks.getDashboardData.mockResolvedValue({}); mocks.getTodayCheckins.mockResolvedValue([]); mocks.getOperationalAlerts.mockResolvedValue([]); });

describe('reception dashboard HTTP boundary', () => {
  it('requires view_dashboard for operational reads', async () => {
    expect((await request('/api/reception/dashboard', [])).status).toBe(403);
    expect(mocks.getDashboardData).not.toHaveBeenCalled();
  });
  it('uses authenticated tenant/property for dashboard, check-ins and alerts', async () => {
    expect((await request('/api/reception/dashboard', ['view_dashboard'])).status).toBe(200);
    expect((await request('/api/reception/checkins/today', ['view_dashboard'])).status).toBe(200);
    expect((await request('/api/reception/alerts', ['view_dashboard'])).status).toBe(200);
    expect(mocks.getDashboardData).toHaveBeenCalledWith('org-a', 'prop-a');
    expect(mocks.getTodayCheckins).toHaveBeenCalledWith('org-a', 'prop-a');
    expect(mocks.getOperationalAlerts).toHaveBeenCalledWith('org-a', 'prop-a');
  });
});
