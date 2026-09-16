import { describe, it, expect, beforeEach } from 'vitest';
import { ProcurementService } from './procurementService.ts';
import { IProcurementRepository } from './procurementRepository.ts';
import { ShoppingList, PurchaseOrder } from './procurementTypes.ts';

class MockProcurementRepo implements IProcurementRepository {
  private lists = new Map<string, ShoppingList>();
  private orders = new Map<string, PurchaseOrder>();

  async findShoppingLists(orgId: string, propId: string): Promise<ShoppingList[]> {
    return Array.from(this.lists.values()).filter(l => l.organizationId === orgId && l.propertyId === propId);
  }
  async findShoppingListById(orgId: string, propId: string, id: string): Promise<ShoppingList | null> {
    const item = this.lists.get(id);
    if (!item || item.organizationId !== orgId || item.propertyId !== propId) return null;
    return item;
  }
  async saveShoppingList(list: ShoppingList): Promise<ShoppingList> {
    this.lists.set(list.id, list);
    return list;
  }
  async deleteShoppingList(orgId: string, propId: string, id: string): Promise<boolean> {
    const item = await this.findShoppingListById(orgId, propId, id);
    if (!item) return false;
    this.lists.delete(id);
    return true;
  }
  async findPurchaseOrders(orgId: string, propId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter(o => o.organizationId === orgId && o.propertyId === propId);
  }
  async findPurchaseOrderById(orgId: string, propId: string, id: string): Promise<PurchaseOrder | null> {
    const item = this.orders.get(id);
    if (!item || item.organizationId !== orgId || item.propertyId !== propId) return null;
    return item;
  }
  async savePurchaseOrder(order: PurchaseOrder): Promise<PurchaseOrder> {
    this.orders.set(order.id, order);
    return order;
  }
  async deletePurchaseOrder(orgId: string, propId: string, id: string): Promise<boolean> {
    const item = await this.findPurchaseOrderById(orgId, propId, id);
    if (!item) return false;
    this.orders.delete(id);
    return true;
  }
}

describe('ProcurementService', () => {
  let repo: MockProcurementRepo;
  let service: ProcurementService;

  beforeEach(() => {
    repo = new MockProcurementRepo();
    service = new ProcurementService(repo);
  });

  it('creates a shopping list and updates item status', async () => {
    const list = await service.upsertShoppingList('org-1', 'prop-beach', {
      name: 'Café da Manhã',
      items: [
        { id: 'i1', name: 'Pão', category: 'Alimentos', status: 'Pendente' },
        { id: 'i2', name: 'Leite', category: 'Laticínios', status: 'Pendente' }
      ]
    });

    expect(list.status).toBe('Pendente');
    const updated = await service.updateShoppingListItemStatus('org-1', 'prop-beach', list.id, 'i1', 'Comprado');
    expect(updated.items.find(i => i.id === 'i1')?.status).toBe('Comprado');
    expect(updated.status).toBe('Pendente');

    const completed = await service.updateShoppingListItemStatus('org-1', 'prop-beach', list.id, 'i2', 'Comprado');
    expect(completed.status).toBe('Concluída');
  });

  it('creates purchase order and updates status to Recebida with timestamp', async () => {
    const po = await service.createPurchaseOrder('org-1', 'prop-beach', {
      supplierId: 'sup-1',
      items: [{ productId: 'p1', name: 'Sabonete', quantity: 50, unitPrice: 2 }],
      totalCost: 100,
      status: 'Pendente',
      orderedAt: new Date().toISOString()
    });

    expect(po.status).toBe('Pendente');
    const received = await service.updatePurchaseOrderStatus('org-1', 'prop-beach', po.id, 'Recebida');
    expect(received.status).toBe('Recebida');
    expect(received.receivedAt).toBeDefined();
  });
});
