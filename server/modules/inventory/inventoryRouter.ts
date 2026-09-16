import { Router, Request, Response } from 'express';
import { inventoryService } from './inventoryService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const inventoryRouter = Router();

inventoryRouter.use(rateLimiters.rest);

function getTenant(req: Request) {
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('TENANT_REQUIRED');
  }
  return { organizationId, propertyId };
}

// GET /api/inventory/products
inventoryRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const products = await inventoryService.listProducts(organizationId, propertyId);
    return res.status(200).json({ success: true, data: products });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_PRODUCTS' });
  }
});

// GET /api/inventory/products/:id
inventoryRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const product = await inventoryService.getProduct(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err?.message || 'PRODUCT_NOT_FOUND' });
  }
});

// POST /api/inventory/products
inventoryRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const product = await inventoryService.upsertProduct(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_PRODUCT_DATA' });
  }
});

// PUT /api/inventory/products/:id
inventoryRouter.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const product = await inventoryService.upsertProduct(organizationId, propertyId, { ...req.body, id: req.params.id as string });
    return res.status(200).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'FAILED_TO_UPDATE_PRODUCT' });
  }
});

// POST /api/inventory/products/:id/adjust
inventoryRouter.post('/products/:id/adjust', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const { quantityDelta, reason } = req.body;
    const product = await inventoryService.adjustStock(
      organizationId,
      propertyId,
      req.params.id as string,
      Number(quantityDelta),
      reason || 'Manual Adjustment',
      req.saasUser?.userId || (req as any).user?.uid
    );
    return res.status(200).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'STOCK_ADJUST_FAILED' });
  }
});

// DELETE /api/inventory/products/:id
inventoryRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const deleted = await inventoryService.deleteProduct(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, deleted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'DELETE_FAILED' });
  }
});
