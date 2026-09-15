import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';
import { Router, Request, Response } from 'express';
import { reservationService } from './reservationService.ts';
import { ReservationStatus } from './reservationTypes.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { reservationSchemas } from '../../schemas/routeSchemas.ts';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';

export const reservationRouter = Router();

// The parent /api/pms router has already authenticated and validated the tenant.
// A nested router must never replace that server-side context from request data.
export function getTenantContext(req: Request): { organizationId: string; propertyId: string } {
  if (!req.organizationId || !req.propertyId) {
    throw new Error('Validated tenant context is required.');
  }
  return { organizationId: req.organizationId, propertyId: req.propertyId };
}

// GET /api/pms/reservations
reservationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const filter = {
      unitId: req.query.unitId as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      status: req.query.status as ReservationStatus | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      guestName: req.query.guestName as string | undefined
    };

    const reservations = await reservationService.listReservations(organizationId, propertyId, filter);
    return res.status(200).json({ success: true, data: reservations });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao listar reservas.' });
  }
});

// GET /api/pms/reservations/:id
reservationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await reservationService.getReservationById(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/pms/reservations
reservationRouter.post('/', requirePermission('manage_bookings'), validateRequest({ body: reservationSchemas.createReservation }), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const reservation = await reservationService.createReservation(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/reservations/:id/check-in
reservationRouter.patch('/:id/check-in', requirePermission('manage_bookings'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await reservationService.checkIn(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/reservations/:id/check-out
reservationRouter.patch('/:id/check-out', requirePermission('manage_bookings'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await reservationService.checkOut(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/reservations/:id/cancel
reservationRouter.patch('/:id/cancel', requirePermission('manage_bookings'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reason = req.body?.reason;
    const reservation = await reservationService.cancelReservation(organizationId, propertyId, id, reason);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/reservations/:id/no-show
reservationRouter.patch('/:id/no-show', requirePermission('manage_bookings'), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await reservationService.markNoShow(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});
