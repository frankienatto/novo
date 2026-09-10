import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ checkIn: vi.fn(), checkOut: vi.fn() }));
vi.mock('./reservationService.ts', () => ({ reservationService: { checkIn: mocks.checkIn, checkOut: mocks.checkOut } }));

import { reservationRouter } from './reservationRouter.ts';

const request = async (path: string, permissions: string[]) => new Promise<Response>((resolve) => {
  const app = express();
  app.use((req, _res, next) => { req.organizationId = 'org-a'; req.propertyId = 'prop-a'; req.saasUser = { role: 'receptionist', permissions } as any; next(); });
  app.use('/api/pms/reservations', reservationRouter);
  const server = app.listen(0, async () => { const port = (server.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}${path}`, { method: 'PATCH' })); server.close(); });
});

beforeEach(() => { vi.clearAllMocks(); });

describe('reception reservation transition boundary', () => {
  it('requires manage_bookings before check-in', async () => {
    expect((await request('/api/pms/reservations/res-a/check-in', [])).status).toBe(403);
    expect(mocks.checkIn).not.toHaveBeenCalled();
  });

  it('uses the authenticated organization/property for check-in and check-out', async () => {
    mocks.checkIn.mockResolvedValue({ reservationId: 'res-a', status: 'checked_in' });
    mocks.checkOut.mockResolvedValue({ reservationId: 'res-a', status: 'checked_out' });
    expect((await request('/api/pms/reservations/res-a/check-in', ['manage_bookings'])).status).toBe(200);
    expect((await request('/api/pms/reservations/res-a/check-out', ['manage_bookings'])).status).toBe(200);
    expect(mocks.checkIn).toHaveBeenCalledWith('org-a', 'prop-a', 'res-a');
    expect(mocks.checkOut).toHaveBeenCalledWith('org-a', 'prop-a', 'res-a');
  });

  it('keeps missing or cross-tenant reservations fail-closed', async () => {
    mocks.checkIn.mockRejectedValue(new Error('Reservation not found in tenant.'));
    const response = await request('/api/pms/reservations/res-b/check-in', ['manage_bookings']);
    expect(response.status).toBe(400);
  });
});
