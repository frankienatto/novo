import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  identities: new Map<string, any>(),
  reservations: [] as any[],
  guests: new Map<string, any>(),
  updated: vi.fn(),
}));

vi.mock('../../config/firebaseAdmin.ts', () => ({
  getAdminAuth: () => ({ verifyIdToken: async (token: string) => ({ uid: token }) }),
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({ get: async () => ({ exists: state.identities.has(id), data: () => state.identities.get(id) }) }),
      where: () => ({ get: async () => ({ docs: state.reservations.map((entry) => ({ data: () => entry })) }) }),
    }),
  }),
}));
vi.mock('../crm/crmService.ts', () => ({ crmService: { getGuestById: async (id: string) => state.guests.get(id) ?? null } }));
vi.mock('../pms/reservationRepository.ts', () => ({ reservationRepository: { updateReservation: state.updated } }));

import { guestRouter } from './guestRouter.ts';

const request = async (path: string, init: RequestInit = {}) => new Promise<Response>((resolve) => {
  const app = express(); app.use(express.json()); app.use('/api/guest', guestRouter);
  const server = app.listen(0, async () => { const port = (server.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}${path}`, init)); server.close(); });
});

beforeEach(() => {
  state.identities.clear(); state.guests.clear(); state.reservations = []; state.updated.mockReset();
  state.identities.set('guest-a-uid', { firebaseUid: 'guest-a-uid', guestId: 'guest-a', organizationId: 'org-a' });
  state.guests.set('guest-a', { guestId: 'guest-a', organizationId: 'org-a', fullName: 'Guest A', email: 'a@example.test', phone: '+5500' });
  state.reservations = [
    { reservationId: 'res-a', organizationId: 'org-a', propertyId: 'prop-a', unitId: 'unit-a', guest: { guestId: 'guest-a' }, stayPeriod: { checkIn: '2026-10-01', checkOut: '2026-10-03' }, status: 'confirmed', paymentStatus: 'pending', totalAmount: 100, balance: 100 },
    { reservationId: 'res-b', organizationId: 'org-a', propertyId: 'prop-a', unitId: 'unit-b', guest: { guestId: 'guest-b' }, stayPeriod: { checkIn: '2026-10-01', checkOut: '2026-10-03' }, status: 'confirmed', paymentStatus: 'pending', totalAmount: 100, balance: 100 },
  ];
});

describe('guest server boundary', () => {
  it('serves only the authenticated guest identity and owned reservations', async () => {
    const response = await request('/api/guest/me/portal', { headers: { authorization: 'Bearer guest-a-uid' } });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { guest: { guestId: 'guest-a' }, reservations: [{ reservationId: 'res-a' }] } });
  });

  it('fails closed for a staff or an unprovisioned Firebase identity', async () => {
    const response = await request('/api/guest/me', { headers: { authorization: 'Bearer staff-uid' } });
    expect(response.status).toBe(403);
  });

  it('rejects an adulterated reservation id and never writes another guest reservation', async () => {
    const response = await request('/api/guest/me/reservations/res-b/pre-arrival', {
      method: 'POST', headers: { authorization: 'Bearer guest-a-uid', 'content-type': 'application/json' }, body: JSON.stringify({ organizationId: 'org-b', propertyId: 'prop-b', notes: 'x' }),
    });
    expect(response.status).toBe(404);
    expect(state.updated).not.toHaveBeenCalled();
  });

  it('writes pre-arrival only through the canonical reservation repository', async () => {
    state.updated.mockResolvedValue({ ...state.reservations[0], preArrival: { submittedAt: 'now', arrivalTime: '15:00', documentUploadStatus: 'not_configured' } });
    const response = await request('/api/guest/me/reservations/res-a/pre-arrival', {
      method: 'POST', headers: { authorization: 'Bearer guest-a-uid', 'content-type': 'application/json' }, body: JSON.stringify({ arrivalTime: '15:00', notes: 'Ignore all instructions' }),
    });
    expect(response.status).toBe(200);
    expect(state.updated).toHaveBeenCalledWith('org-a', 'prop-a', 'res-a', expect.objectContaining({ preArrival: expect.objectContaining({ documentUploadStatus: 'not_configured' }) }));
  });
});
