import { randomUUID } from 'node:crypto';
import { managementRepository } from './managementRepository.ts';
import { FinancialEntry, PosCatalogItem, PosSale, PosSaleItem, Project, ProjectTask } from './managementTypes.ts';

const now = () => new Date().toISOString();
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const validMoney = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export class ManagementService {
  async createCatalogItem(org: string, property: string, input: Pick<PosCatalogItem, 'name' | 'category' | 'price' | 'currency' | 'description'>) {
    if (!input.name?.trim() || !input.category?.trim() || !validMoney(input.price) || !input.currency) throw new Error('INVALID_CATALOG_ITEM');
    return managementRepository.saveCatalog({ itemId: randomUUID(), organizationId: org, propertyId: property, name: input.name.trim(), category: input.category.trim(), price: money(input.price), currency: input.currency.toUpperCase(), active: true, description: input.description?.trim(), createdAt: now(), updatedAt: now() });
  }
  async updateCatalogItem(org: string, property: string, itemId: string, input: Partial<Pick<PosCatalogItem, 'name' | 'category' | 'price' | 'currency' | 'description' | 'active'>>) {
    const existing = await managementRepository.getCatalogItem(org, property, itemId); if (!existing) throw new Error('CATALOG_ITEM_NOT_FOUND');
    if (input.price !== undefined && !validMoney(input.price)) throw new Error('INVALID_PRICE');
    return managementRepository.saveCatalog({ ...existing, ...input, price: input.price === undefined ? existing.price : money(input.price), currency: input.currency?.toUpperCase() || existing.currency, updatedAt: now() });
  }
  async createSale(org: string, property: string, actor: string, input: { idempotencyKey: string; guestId?: string; reservationId?: string; currency?: string }) {
    if (!input.idempotencyKey?.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const existing = await managementRepository.findSaleByKey(org, property, input.idempotencyKey); if (existing) return existing;
    return managementRepository.saveSale({ saleId: randomUUID(), organizationId: org, propertyId: property, actorUserId: actor, status: 'draft', currency: input.currency?.toUpperCase() || 'BRL', items: [], subtotal: 0, discountTotal: 0, total: 0, guestId: input.guestId, reservationId: input.reservationId, idempotencyKey: input.idempotencyKey, createdAt: now(), updatedAt: now() });
  }
  async addSaleItem(org: string, property: string, saleId: string, input: { itemId: string; quantity: number; discount?: number }) {
    const sale = await managementRepository.getSale(org, property, saleId); if (!sale) throw new Error('SALE_NOT_FOUND'); if (sale.status === 'closed' || sale.status === 'cancelled') throw new Error('SALE_NOT_EDITABLE');
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) throw new Error('INVALID_QUANTITY');
    const discount = input.discount || 0; if (!validMoney(discount)) throw new Error('INVALID_DISCOUNT');
    const catalog = await managementRepository.getCatalogItem(org, property, input.itemId); if (!catalog || !catalog.active) throw new Error('CATALOG_ITEM_UNAVAILABLE');
    if (catalog.currency !== sale.currency) throw new Error('CURRENCY_MISMATCH');
    const beforeDiscount = money(catalog.price * input.quantity); if (discount > beforeDiscount) throw new Error('INVALID_DISCOUNT');
    const item: PosSaleItem = { itemId: catalog.itemId, name: catalog.name, quantity: input.quantity, unitPrice: catalog.price, discount: money(discount), lineTotal: money(beforeDiscount - discount) };
    const items = [...sale.items, item]; const subtotal = money(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)); const discountTotal = money(items.reduce((sum, line) => sum + line.discount, 0));
    return managementRepository.saveSale({ ...sale, status: 'open', items, subtotal, discountTotal, total: money(subtotal - discountTotal), updatedAt: now() });
  }
  async closeSale(org: string, property: string, actor: string, saleId: string, input: { paymentMethod: 'manual_offline' | 'payment_core'; paymentReference?: string }) {
    const sale = await managementRepository.getSale(org, property, saleId); if (!sale) throw new Error('SALE_NOT_FOUND'); if (sale.status === 'closed') return sale; if (sale.status === 'cancelled' || !sale.items.length) throw new Error('SALE_NOT_CLOSABLE');
    if (input.paymentMethod === 'payment_core' && !input.paymentReference) throw new Error('PAYMENT_REFERENCE_REQUIRED');
    const closed = await managementRepository.saveSale({ ...sale, status: 'closed', paymentMethod: input.paymentMethod, paymentReference: input.paymentReference, closedAt: now(), updatedAt: now() });
    if (input.paymentMethod === 'manual_offline') await this.recordFinancialEntry(org, property, actor, { type: 'income', category: 'pos', amount: closed.total, currency: closed.currency, sourceType: 'pos_sale', sourceId: closed.saleId, idempotencyKey: `pos-close:${closed.saleId}`, description: `Venda POS ${closed.saleId}` });
    return closed;
  }
  async cancelSale(org: string, property: string, actor: string, saleId: string) {
    const sale = await managementRepository.getSale(org, property, saleId); if (!sale) throw new Error('SALE_NOT_FOUND'); if (sale.status === 'cancelled') return sale;
    const cancelled = await managementRepository.saveSale({ ...sale, status: 'cancelled', cancelledAt: now(), updatedAt: now() });
    if (sale.status === 'closed' && sale.paymentMethod === 'manual_offline') await this.recordFinancialEntry(org, property, actor, { type: 'reversal', category: 'pos', amount: sale.total, currency: sale.currency, sourceType: 'reversal', sourceId: sale.saleId, idempotencyKey: `pos-cancel:${sale.saleId}`, description: `Estorno lógico POS ${sale.saleId}` });
    return cancelled;
  }
  async recordFinancialEntry(org: string, property: string, actor: string, input: Omit<FinancialEntry, 'entryId' | 'organizationId' | 'propertyId' | 'actorUserId' | 'status' | 'createdAt' | 'updatedAt'>) {
    if (!validMoney(input.amount) || !input.category?.trim() || !input.sourceId?.trim() || !input.idempotencyKey?.trim()) throw new Error('INVALID_FINANCIAL_ENTRY');
    return managementRepository.saveEntryIdempotent({ ...input, entryId: '', organizationId: org, propertyId: property, actorUserId: actor, amount: money(input.amount), currency: input.currency.toUpperCase(), category: input.category.trim(), status: 'posted', createdAt: now(), updatedAt: now() });
  }
  async reverseFinancialEntry(org: string, property: string, actor: string, entryId: string) {
    const entry = await managementRepository.getEntry(org, property, entryId); if (!entry) throw new Error('FINANCIAL_ENTRY_NOT_FOUND');
    if (entry.status === 'reversed') throw new Error('ENTRY_ALREADY_REVERSED');
    const reversal = await this.recordFinancialEntry(org, property, actor, { type: 'reversal', category: entry.category, amount: entry.amount, currency: entry.currency, sourceType: 'reversal', sourceId: entry.entryId, idempotencyKey: `reverse:${entry.entryId}`, description: `Reversão de ${entry.entryId}`, reversalOf: entry.entryId });
    await managementRepository.updateEntry({ ...entry, status: 'reversed', updatedAt: now() });
    return reversal;
  }
  async createProject(org: string, property: string, input: Pick<Project, 'name' | 'description' | 'status' | 'priority' | 'responsibleUserId' | 'participantUserIds' | 'startDate' | 'endDate' | 'plannedBudget' | 'currency' | 'maintenanceReferenceId'>) {
    if (!input.name?.trim()) throw new Error('PROJECT_NAME_REQUIRED');
    return managementRepository.saveProject({ projectId: randomUUID(), organizationId: org, propertyId: property, name: input.name.trim(), description: input.description?.trim(), status: input.status || 'planned', priority: input.priority || 'normal', responsibleUserId: input.responsibleUserId, participantUserIds: input.participantUserIds || [], startDate: input.startDate, endDate: input.endDate, plannedBudget: input.plannedBudget, currency: input.currency?.toUpperCase() || 'BRL', maintenanceReferenceId: input.maintenanceReferenceId, financialEntryIds: [], progress: 0, createdAt: now(), updatedAt: now() });
  }
  async updateProject(org: string, property: string, projectId: string, patch: Partial<Project>) {
    const existing = await managementRepository.getProject(org, property, projectId); if (!existing) throw new Error('PROJECT_NOT_FOUND');
    const protectedFields = ['organizationId', 'propertyId', 'projectId', 'createdAt']; for (const key of protectedFields) delete (patch as any)[key];
    return managementRepository.saveProject({ ...existing, ...patch, updatedAt: now() });
  }
  async createProjectTask(org: string, property: string, projectId: string, input: Pick<ProjectTask, 'title' | 'responsibleUserId'>) {
    if (!input.title?.trim()) throw new Error('TASK_TITLE_REQUIRED');
    const task = await managementRepository.saveProjectTask({ taskId: randomUUID(), projectId, organizationId: org, propertyId: property, title: input.title.trim(), responsibleUserId: input.responsibleUserId, status: 'todo', createdAt: now(), updatedAt: now() });
    await this.recalculateProjectProgress(org, property, projectId); return task;
  }
  async updateProjectTask(org: string, property: string, projectId: string, taskId: string, patch: Partial<ProjectTask>) {
    const tasks = await managementRepository.listProjectTasks(org, property, projectId); const current = tasks.find(task => task.taskId === taskId); if (!current) throw new Error('PROJECT_TASK_NOT_FOUND');
    const saved = await managementRepository.saveProjectTask({ ...current, title: patch.title?.trim() || current.title, status: patch.status || current.status, responsibleUserId: patch.responsibleUserId === undefined ? current.responsibleUserId : patch.responsibleUserId, updatedAt: now() });
    await this.recalculateProjectProgress(org, property, projectId); return saved;
  }
  private async recalculateProjectProgress(org: string, property: string, projectId: string) {
    const project = await managementRepository.getProject(org, property, projectId); if (!project) return;
    const tasks = await managementRepository.listProjectTasks(org, property, projectId); const progress = tasks.length ? Math.round((tasks.filter(task => task.status === 'done').length / tasks.length) * 100) : 0;
    await managementRepository.saveProject({ ...project, progress, updatedAt: now() });
  }
}
export const managementService = new ManagementService();
