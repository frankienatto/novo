import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ listCatalog: vi.fn(), createCatalogItem: vi.fn(), createSale: vi.fn(), addSaleItem: vi.fn(), closeSale: vi.fn(), listEntries: vi.fn(), listProjects: vi.fn() }));
vi.mock('./managementRepository.ts', () => ({ managementRepository: { listCatalog: mocks.listCatalog, listSales: vi.fn(), getSale: vi.fn(), listEntries: mocks.listEntries, listProjects: mocks.listProjects, getProject: vi.fn(), listProjectTasks: vi.fn() } }));
vi.mock('./managementService.ts', () => ({ managementService: { createCatalogItem: mocks.createCatalogItem, updateCatalogItem: vi.fn(), createSale: mocks.createSale, addSaleItem: mocks.addSaleItem, closeSale: mocks.closeSale, cancelSale: vi.fn(), recordFinancialEntry: vi.fn(), reverseFinancialEntry: vi.fn(), createProject: vi.fn(), updateProject: vi.fn(), createProjectTask: vi.fn(), updateProjectTask: vi.fn() } }));
import { managementRouter } from './managementRouter.ts';

const request = (path: string, method: string, permissions: string[], body?: unknown) => new Promise<Response>(resolve => { const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.organizationId = 'org-a'; req.propertyId = 'prop-a'; req.saasUser = { userId: 'actor', role: 'manager', permissions } as any; next(); }); app.use('/api/management', managementRouter); const server = app.listen(0, async () => { const port = (server.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}/api/management${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })); server.close(); }); });
beforeEach(() => { vi.clearAllMocks(); Object.values(mocks).forEach((mock: any) => mock.mockResolvedValue([])); });
describe('canonical management HTTP boundary', () => {
  it('rejects POS catalog mutations without RBAC', async () => expect((await request('/pos/catalog', 'POST', [], { name: 'x' })).status).toBe(403));
  it('derives POS tenant scope from verified request context', async () => { mocks.createSale.mockResolvedValue({ saleId: 'sale-a' }); expect((await request('/pos/sales', 'POST', ['operate_pos'], { idempotencyKey: 'same', organizationId: 'org-b', propertyId: 'prop-b' })).status).toBe(201); expect(mocks.createSale).toHaveBeenCalledWith('org-a', 'prop-a', 'actor', expect.objectContaining({ organizationId: 'org-b', propertyId: 'prop-b' })); });
  it('requires financial permission for finance reads', async () => expect((await request('/finance/entries', 'GET', [])).status).toBe(403));
  it('requires project RBAC for projects', async () => expect((await request('/projects', 'GET', [])).status).toBe(403));
});
