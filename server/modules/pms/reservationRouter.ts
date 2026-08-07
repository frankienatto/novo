import { Router, Request, Response } from 'express';
import { reservationService } from './reservationService.ts';
import { ReservationStatus } from './reservationTypes.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { reservationSchemas } from '../../schemas/routeSchemas.ts';

export const reservationRouter = Router();

// Helper de extração do Tenant Context
function getTenantContext(req: Request): { organizationId: string; propertyId: string } {
  const organizationId = 
    (req.headers['x-organization-id'] as string) || 
    (req.query.organizationId as string) || 
    req.body?.organizationId || 
    'org_dev_default';

  const propertyId = 
    (req.headers['x-property-id'] as string) || 
    (req.query.propertyId as string) || 
    req.body?.propertyId || 
    'prop_dev_default';

  return { organizationId, propertyId };
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
reservationRouter.post('/', validateRequest({ body: reservationSchemas.createReservation }), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const reservation = await reservationService.createReservation(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/reservations/:id/check-in
reservationRouter.patch('/:id/check-in', async (req: Request, res: Response) => {
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
reservationRouter.patch('/:id/check-out', async (req: Request, res: Response) => {
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
reservationRouter.patch('/:id/cancel', async (req: Request, res: Response) => {
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
reservationRouter.patch('/:id/no-show', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await reservationService.markNoShow(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});
