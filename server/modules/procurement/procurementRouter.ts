import { Router, Request, Response } from 'express';
import { procurementService } from './procurementService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const procurementRouter = Router();

procurementRouter.use(rateLimiters.rest);

function getTenant(req: Request) {
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('TENANT_REQUIRED');
  }
  return { organizationId, propertyId };
}

// GET /api/procurement/shopping-lists
procurementRouter.get('/shopping-lists', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const lists = await procurementService.listShoppingLists(organizationId, propertyId);
    return res.status(200).json({ success: true, data: lists });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_LISTS' });
  }
});

// POST /api/procurement/shopping-lists
procurementRouter.post('/shopping-lists', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const list = await procurementService.upsertShoppingList(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_DATA' });
  }
});

// PATCH /api/procurement/shopping-lists/:id/items/:itemId/status
procurementRouter.patch('/shopping-lists/:id/items/:itemId/status', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const { status } = req.body;
    const updated = await procurementService.updateShoppingListItemStatus(
      organizationId,
      propertyId,
      req.params.id as string,
      req.params.itemId as string,
      status
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'UPDATE_FAILED' });
  }
});

// DELETE /api/procurement/shopping-lists/:id
procurementRouter.delete('/shopping-lists/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const deleted = await procurementService.deleteShoppingList(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, deleted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'DELETE_FAILED' });
  }
});

// GET /api/procurement/purchase-orders
procurementRouter.get('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const orders = await procurementService.listPurchaseOrders(organizationId, propertyId);
    return res.status(200).json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_ORDERS' });
  }
});

// POST /api/procurement/purchase-orders
procurementRouter.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const order = await procurementService.createPurchaseOrder(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_ORDER_DATA' });
  }
});

// PATCH /api/procurement/purchase-orders/:id/status
procurementRouter.patch('/purchase-orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const { status } = req.body;
    const order = await procurementService.updatePurchaseOrderStatus(organizationId, propertyId, req.params.id as string, status);
    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'UPDATE_ORDER_FAILED' });
  }
});
