import { Router, Request, Response } from 'express';
import { deliveryService } from './deliveryService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const deliveryRouter = Router();

deliveryRouter.use(rateLimiters.rest);

function getTenant(req: Request) {
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('TENANT_REQUIRED');
  }
  return { organizationId, propertyId };
}

// GET /api/delivery/orders
deliveryRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const orders = await deliveryService.listOrders(organizationId, propertyId);
    return res.status(200).json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_ORDERS' });
  }
});

// POST /api/delivery/orders
deliveryRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const order = await deliveryService.createOrder(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_ORDER_DATA' });
  }
});

// PATCH /api/delivery/orders/:id/status
deliveryRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'STATUS_REQUIRED' });
    }
    const updated = await deliveryService.updateOrderStatus(organizationId, propertyId, req.params.id as string, status);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'UPDATE_STATUS_FAILED' });
  }
});
