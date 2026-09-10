import { Router, Request, Response } from 'express';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';
import { managementRepository } from './managementRepository.ts';
import { managementService } from './managementService.ts';

export const managementRouter = Router();
const respond = (res: Response, work: () => Promise<unknown>, success = 200) => work().then(data => res.status(success).json({ success: true, data })).catch((error: any) => {
  const message = error?.message || 'MANAGEMENT_OPERATION_FAILED'; const status = /NOT_FOUND/.test(message) ? 404 : /MISMATCH|INVALID|REQUIRED|UNAVAILABLE|NOT_EDITABLE|NOT_CLOSABLE|ALREADY/.test(message) ? 400 : 500;
  res.status(status).json({ success: false, error: message });
});
const scope = (req: Request) => [req.organizationId!, req.propertyId!] as const;
const actor = (req: Request) => req.saasUser!.userId;

managementRouter.get('/pos/catalog', requirePermission('view_pos'), (req, res) => respond(res, () => managementRepository.listCatalog(...scope(req))));
managementRouter.post('/pos/catalog', requirePermission('manage_pos_catalog'), (req, res) => respond(res, () => managementService.createCatalogItem(...scope(req), req.body), 201));
managementRouter.patch('/pos/catalog/:itemId', requirePermission('manage_pos_catalog'), (req, res) => respond(res, () => managementService.updateCatalogItem(...scope(req), String(req.params.itemId), req.body)));
managementRouter.get('/pos/sales', requirePermission('view_pos'), (req, res) => respond(res, () => managementRepository.listSales(...scope(req))));
managementRouter.post('/pos/sales', requirePermission('operate_pos'), (req, res) => respond(res, () => managementService.createSale(...scope(req), actor(req), req.body), 201));
managementRouter.get('/pos/sales/:saleId', requirePermission('view_pos'), (req, res) => respond(res, async () => { const sale = await managementRepository.getSale(...scope(req), String(req.params.saleId)); if (!sale) throw new Error('SALE_NOT_FOUND'); return sale; }));
managementRouter.post('/pos/sales/:saleId/items', requirePermission('operate_pos'), (req, res) => respond(res, () => managementService.addSaleItem(...scope(req), String(req.params.saleId), req.body)));
managementRouter.post('/pos/sales/:saleId/close', requirePermission('operate_pos'), (req, res) => respond(res, () => managementService.closeSale(...scope(req), actor(req), String(req.params.saleId), req.body)));
managementRouter.post('/pos/sales/:saleId/cancel', requirePermission('manage_pos'), (req, res) => respond(res, () => managementService.cancelSale(...scope(req), actor(req), String(req.params.saleId))));

managementRouter.get('/finance/entries', requirePermission('view_financials'), (req, res) => respond(res, () => managementRepository.listEntries(...scope(req))));
managementRouter.post('/finance/entries', requirePermission('manage_financial_entries'), (req, res) => respond(res, () => managementService.recordFinancialEntry(...scope(req), actor(req), { ...req.body, sourceType: 'manual', sourceId: req.body.sourceId || `manual:${req.body.idempotencyKey}` }), 201));
managementRouter.post('/finance/entries/:entryId/reverse', requirePermission('approve_financial_actions'), (req, res) => respond(res, () => managementService.reverseFinancialEntry(...scope(req), actor(req), String(req.params.entryId))));
managementRouter.get('/finance/summary', requirePermission('view_financials'), (req, res) => respond(res, async () => { const entries = await managementRepository.listEntries(...scope(req)); const net = entries.reduce((total, e) => total + (e.type === 'expense' || e.type === 'reversal' ? -e.amount : e.amount), 0); return { income: entries.filter(e => e.type === 'income').reduce((n, e) => n + e.amount, 0), expense: entries.filter(e => e.type === 'expense').reduce((n, e) => n + e.amount, 0), net, count: entries.length }; }));

managementRouter.get('/projects', requirePermission('view_projects'), (req, res) => respond(res, () => managementRepository.listProjects(...scope(req))));
managementRouter.post('/projects', requirePermission('manage_projects'), (req, res) => respond(res, () => managementService.createProject(...scope(req), req.body), 201));
managementRouter.get('/projects/:projectId', requirePermission('view_projects'), (req, res) => respond(res, async () => { const project = await managementRepository.getProject(...scope(req), String(req.params.projectId)); if (!project) throw new Error('PROJECT_NOT_FOUND'); return project; }));
managementRouter.patch('/projects/:projectId', requirePermission('manage_projects'), (req, res) => respond(res, () => managementService.updateProject(...scope(req), String(req.params.projectId), req.body)));
managementRouter.get('/projects/:projectId/tasks', requirePermission('view_projects'), (req, res) => respond(res, () => managementRepository.listProjectTasks(...scope(req), String(req.params.projectId))));
managementRouter.post('/projects/:projectId/tasks', requirePermission('manage_projects'), (req, res) => respond(res, () => managementService.createProjectTask(...scope(req), String(req.params.projectId), req.body), 201));
managementRouter.patch('/projects/:projectId/tasks/:taskId', requirePermission('manage_projects'), (req, res) => respond(res, () => managementService.updateProjectTask(...scope(req), String(req.params.projectId), String(req.params.taskId), req.body)));
