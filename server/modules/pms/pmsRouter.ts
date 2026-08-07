import { Router, Request, Response } from 'express';
import { pmsService } from './pmsService.ts';
import { RoomStatus } from './pmsTypes.ts';
import { reservationRouter } from './reservationRouter.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { pmsSchemas } from '../../schemas/routeSchemas.ts';

export const pmsRouter = Router();

// Sub-roteador do Motor de Reservas (Etapa 4.2)
pmsRouter.use('/reservations', reservationRouter);

// Helper de extração de Tenant Context das requisições
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

// ------------------------------------------------------------------
// RESUMO DE INVENTÁRIO DO PMS
// ------------------------------------------------------------------
pmsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const summary = await pmsService.getInventorySummary(organizationId, propertyId);
    return res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao obter resumo do inventário PMS.' });
  }
});

// ------------------------------------------------------------------
// CATEGORIAS DE ACOMODAÇÃO
// ------------------------------------------------------------------

// GET /api/pms/categories
pmsRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await pmsService.listCategories(organizationId, propertyId, includeInactive);
    return res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao listar categorias.' });
  }
});

// GET /api/pms/categories/:id
pmsRouter.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await pmsService.getCategoryById(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/pms/categories
pmsRouter.post('/categories', validateRequest({ body: pmsSchemas.createCategory }), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const category = await pmsService.createCategory(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/pms/categories/:id
pmsRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await pmsService.updateCategory(organizationId, propertyId, id, req.body);
    return res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/pms/categories/:id (Soft Delete)
pmsRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await pmsService.deleteCategory(organizationId, propertyId, id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// ------------------------------------------------------------------
// UNIDADES HOTELEIRAS (UHs)
// ------------------------------------------------------------------

// GET /api/pms/units
pmsRouter.get('/units', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const categoryId = req.query.categoryId as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const units = await pmsService.listUnits(organizationId, propertyId, categoryId, includeInactive);
    return res.status(200).json({ success: true, data: units });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Erro ao listar unidades hoteleiras.' });
  }
});

// GET /api/pms/units/:id
pmsRouter.get('/units/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const unit = await pmsService.getUnitById(organizationId, propertyId, id);
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/pms/units
pmsRouter.post('/units', validateRequest({ body: pmsSchemas.createUnit }), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const unit = await pmsService.createUnit(organizationId, propertyId, req.body);
    return res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/pms/units/:id
pmsRouter.put('/units/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const unit = await pmsService.updateUnit(organizationId, propertyId, id, req.body);
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/pms/units/:id/status
pmsRouter.patch('/units/:id/status', validateRequest({ body: pmsSchemas.updateUnitStatus }), async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const unit = await pmsService.updateUnitStatus(organizationId, propertyId, id, status as RoomStatus);
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/pms/units/:id (Soft Delete)
pmsRouter.delete('/units/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantContext(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await pmsService.deleteUnit(organizationId, propertyId, id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});
