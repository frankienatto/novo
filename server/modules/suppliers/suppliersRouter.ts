import { Router, Request, Response } from 'express';
import { suppliersService } from './suppliersService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const suppliersRouter = Router();

suppliersRouter.use(rateLimiters.rest);

function getTenant(req: Request) {
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('TENANT_REQUIRED');
  }
  return { organizationId, propertyId };
}

// GET /api/suppliers
suppliersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const suppliers = await suppliersService.listSuppliers(organizationId, propertyId);
    return res.status(200).json({ success: true, data: suppliers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'FAILED_TO_LOAD_SUPPLIERS' });
  }
});

// GET /api/suppliers/:id
suppliersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const supplier = await suppliersService.getSupplier(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, data: supplier });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err?.message || 'SUPPLIER_NOT_FOUND' });
  }
});

// POST /api/suppliers
suppliersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const supplier = await suppliersService.upsertSupplier(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: supplier });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'INVALID_SUPPLIER_DATA' });
  }
});

// PUT /api/suppliers/:id
suppliersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const supplier = await suppliersService.upsertSupplier(organizationId, propertyId, { ...req.body, id: req.params.id as string });
    return res.status(200).json({ success: true, data: supplier });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'FAILED_TO_UPDATE_SUPPLIER' });
  }
});

// DELETE /api/suppliers/:id
suppliersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenant(req);
    const deleted = await suppliersService.deleteSupplier(organizationId, propertyId, req.params.id as string);
    return res.status(200).json({ success: true, deleted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'DELETE_FAILED' });
  }
});
