import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getGuestById: vi.fn(),
  calculateGuestIntelligence: vi.fn(),
  appendTimelineEvent: vi.fn(),
  getTimeline: vi.fn(),
}));

vi.mock('./crmService.ts', () => ({ crmService: { getGuestById: mocks.getGuestById } }));
vi.mock('./guestIntelligenceService.ts', () => ({ guestIntelligenceService: { calculateGuestIntelligence: mocks.calculateGuestIntelligence } }));
vi.mock('./timelineService.ts', () => ({ timelineService: { appendTimelineEvent: mocks.appendTimelineEvent, getTimeline: mocks.getTimeline } }));
vi.mock('../../config/firebaseAdmin.ts', () => ({ getAdminFirestore: vi.fn() }));

import { crmRouter } from './crmRouter.ts';

const request = async (path: string, init: RequestInit = {}) => new Promise<Response>((resolve) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.organizationId = 'org-a'; req.propertyId = 'prop-a'; next(); });
  app.use('/api/crm', crmRouter);
  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    resolve(await fetch(`http://127.0.0.1:${port}${path}`, init));
    server.close();
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getGuestById.mockResolvedValue({ guestId: 'guest-a', organizationId: 'org-a' });
});

describe('CRM HTTP tenant boundary', () => {
  it('does not calculate intelligence for a guest outside the authenticated tenant', async () => {
    mocks.getGuestById.mockResolvedValue({ guestId: 'guest-b', organizationId: 'org-b' });
    const response = await request('/api/crm/guests/guest-b/intelligence');
    expect(response.status).toBe(404);
    expect(mocks.calculateGuestIntelligence).not.toHaveBeenCalled();
  });

  it('uses middleware tenant values instead of timeline body overrides', async () => {
    mocks.appendTimelineEvent.mockResolvedValue({ eventId: 'timeline-1' });
    const response = await request('/api/crm/guests/guest-a/timeline', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'crm', eventType: 'note', title: 'Nota', organizationId: 'org-b', propertyId: 'prop-b' }),
    });
    expect(response.status).toBe(201);
    expect(mocks.appendTimelineEvent).toHaveBeenCalledWith('guest-a', expect.objectContaining({ organizationId: 'org-a', propertyId: 'prop-a' }));
  });

  it('does not expose a guest timeline across tenants', async () => {
    mocks.getGuestById.mockResolvedValue({ guestId: 'guest-b', organizationId: 'org-b' });
    const response = await request('/api/crm/guests/guest-b/timeline');
    expect(response.status).toBe(404);
    expect(mocks.getTimeline).not.toHaveBeenCalled();
  });
});
