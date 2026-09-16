import { Router, Request, Response } from 'express';
import { coworkingService } from './coworkingService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const coworkingRouter = Router();

coworkingRouter.use(rateLimiters.rest);

function getTenant(req: Request) {
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('TENANT_REQUIRED');
  }
  return { organizationId, propertyId };
}

// GET /api/coworking/plans
coworkingRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const plans = await coworkingService.listPlans(organizationId, propertyId);
    return res.status(200).json({ success: true, data: plans });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_PLANS' });
  }
});

// POST /api/coworking/plans
coworkingRouter.post('/plans', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const plan = await coworkingService.upsertPlan(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: plan });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_PLAN_DATA' });
  }
});

// GET /api/coworking/desks
coworkingRouter.get('/desks', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const desks = await coworkingService.listDesks(organizationId, propertyId);
    return res.status(200).json({ success: true, data: desks });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_DESKS' });
  }
});

// POST /api/coworking/desks
coworkingRouter.post('/desks', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const desk = await coworkingService.upsertDesk(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: desk });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_DESK_DATA' });
  }
});

// GET /api/coworking/check-ins
coworkingRouter.get('/check-ins', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const status = req.query.status as 'Active' | 'Finished' | undefined;
    const checkIns = await coworkingService.listCheckIns(organizationId, propertyId, status);
    return res.status(200).json({ success: true, data: checkIns });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_CHECK_INS' });
  }
});

// POST /api/coworking/check-ins
coworkingRouter.post('/check-ins', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const checkIn = await coworkingService.startCheckIn(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: checkIn });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'FAILED_TO_START_CHECK_IN' });
  }
});

// POST /api/coworking/check-ins/:id/consumption
coworkingRouter.post('/check-ins/:id/consumption', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const updated = await coworkingService.addConsumptionItem(organizationId, propertyId, req.params.id as string, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'FAILED_TO_ADD_CONSUMPTION' });
  }
});

// POST /api/coworking/check-ins/:id/finish
coworkingRouter.post('/check-ins/:id/finish', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const finished = await coworkingService.finishCheckIn(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, data: finished });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'FAILED_TO_FINISH_CHECK_IN' });
  }
});
