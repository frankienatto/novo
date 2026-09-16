import { IProcurementRepository, ProcurementRepository } from './procurementRepository.ts';
import { ShoppingList, ShoppingListItem, PurchaseOrder } from './procurementTypes.ts';

export class ProcurementService {
  constructor(private repo: IProcurementRepository = new ProcurementRepository()) {}

  async listShoppingLists(organizationId: string, propertyId: string): Promise<ShoppingList[]> {
    return this.repo.findShoppingLists(organizationId, propertyId);
  }

  async getShoppingList(organizationId: string, propertyId: string, id: string): Promise<ShoppingList> {
    const list = await this.repo.findShoppingListById(organizationId, propertyId, id);
    if (!list) throw new Error('SHOPPING_LIST_NOT_FOUND');
    return list;
  }

  async upsertShoppingList(
    organizationId: string,
    propertyId: string,
    data: { id?: string; name: string; status?: 'Pendente' | 'Concluída'; items?: ShoppingListItem[] }
  ): Promise<ShoppingList> {
    const id = data.id || `LIST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const list: ShoppingList = {
      id,
      organizationId,
      propertyId,
      name: data.name,
      status: data.status || 'Pendente',
      createdAt: new Date().toISOString(),
      items: data.items || [],
    };
    return this.repo.saveShoppingList(list);
  }

  async updateShoppingListItemStatus(
    organizationId: string,
    propertyId: string,
    listId: string,
    itemId: string,
    status: 'Pendente' | 'Comprado'
  ): Promise<ShoppingList> {
    const list = await this.getShoppingList(organizationId, propertyId, listId);
    const updatedItems = list.items.map(item => item.id === itemId ? { ...item, status } : item);
    const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.status === 'Comprado');
    return this.repo.saveShoppingList({
      ...list,
      items: updatedItems,
      status: allCompleted ? 'Concluída' : 'Pendente'
    });
  }

  async deleteShoppingList(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    return this.repo.deleteShoppingList(organizationId, propertyId, id);
  }

  async listPurchaseOrders(organizationId: string, propertyId: string): Promise<PurchaseOrder[]> {
    return this.repo.findPurchaseOrders(organizationId, propertyId);
  }

  async createPurchaseOrder(
    organizationId: string,
    propertyId: string,
    data: Omit<PurchaseOrder, 'id' | 'organizationId' | 'propertyId'> & { id?: string }
  ): Promise<PurchaseOrder> {
    const id = data.id || `PO_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const order: PurchaseOrder = {
      id,
      organizationId,
      propertyId,
      supplierId: data.supplierId,
      items: data.items,
      totalCost: Number(data.totalCost),
      status: data.status || 'Pendente',
      orderedAt: data.orderedAt || new Date().toISOString(),
      receivedAt: data.receivedAt,
    };
    return this.repo.savePurchaseOrder(order);
  }

  async updatePurchaseOrderStatus(
    organizationId: string,
    propertyId: string,
    orderId: string,
    status: 'Pendente' | 'Enviada' | 'Recebida' | 'Cancelada'
  ): Promise<PurchaseOrder> {
    const order = await this.repo.findPurchaseOrderById(organizationId, propertyId, orderId);
    if (!order) throw new Error('PURCHASE_ORDER_NOT_FOUND');
    const receivedAt = status === 'Recebida' ? new Date().toISOString() : order.receivedAt;
    return this.repo.savePurchaseOrder({ ...order, status, receivedAt });
  }
}

export const procurementService = new ProcurementService();
