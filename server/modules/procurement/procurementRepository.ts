import { ShoppingList, PurchaseOrder } from './procurementTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IProcurementRepository {
  findShoppingLists(organizationId: string, propertyId: string): Promise<ShoppingList[]>;
  findShoppingListById(organizationId: string, propertyId: string, id: string): Promise<ShoppingList | null>;
  saveShoppingList(list: ShoppingList): Promise<ShoppingList>;
  deleteShoppingList(organizationId: string, propertyId: string, id: string): Promise<boolean>;

  findPurchaseOrders(organizationId: string, propertyId: string): Promise<PurchaseOrder[]>;
  findPurchaseOrderById(organizationId: string, propertyId: string, id: string): Promise<PurchaseOrder | null>;
  savePurchaseOrder(order: PurchaseOrder): Promise<PurchaseOrder>;
  deletePurchaseOrder(organizationId: string, propertyId: string, id: string): Promise<boolean>;
}

export class ProcurementRepository implements IProcurementRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findShoppingLists(organizationId: string, propertyId: string): Promise<ShoppingList[]> {
    const snap = await this.db.collection('shoppingLists')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingList));
  }

  async findShoppingListById(organizationId: string, propertyId: string, id: string): Promise<ShoppingList | null> {
    const docSnap = await this.db.collection('shoppingLists').doc(id).get();
    if (!docSnap.exists) return null;
    const data = docSnap.data() as ShoppingList;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: docSnap.id, ...data };
  }

  async saveShoppingList(list: ShoppingList): Promise<ShoppingList> {
    const docRef = this.db.collection('shoppingLists').doc(list.id);
    const existing = await docRef.get();
    if (existing.exists) {
      const current = existing.data() as ShoppingList;
      if (current.organizationId !== list.organizationId || current.propertyId !== list.propertyId) {
        throw new Error('TENANT_MISMATCH');
      }
    }
    const payload: ShoppingList = {
      ...list,
      updatedAt: new Date().toISOString(),
      createdAt: list.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deleteShoppingList(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const item = await this.findShoppingListById(organizationId, propertyId, id);
    if (!item) return false;
    await this.db.collection('shoppingLists').doc(id).delete();
    return true;
  }

  async findPurchaseOrders(organizationId: string, propertyId: string): Promise<PurchaseOrder[]> {
    const snap = await this.db.collection('purchaseOrders')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseOrder));
  }

  async findPurchaseOrderById(organizationId: string, propertyId: string, id: string): Promise<PurchaseOrder | null> {
    const docSnap = await this.db.collection('purchaseOrders').doc(id).get();
    if (!docSnap.exists) return null;
    const data = docSnap.data() as PurchaseOrder;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: docSnap.id, ...data };
  }

  async savePurchaseOrder(order: PurchaseOrder): Promise<PurchaseOrder> {
    const docRef = this.db.collection('purchaseOrders').doc(order.id);
    const existing = await docRef.get();
    if (existing.exists) {
      const current = existing.data() as PurchaseOrder;
      if (current.organizationId !== order.organizationId || current.propertyId !== order.propertyId) {
        throw new Error('TENANT_MISMATCH');
      }
    }
    const payload: PurchaseOrder = {
      ...order,
      updatedAt: new Date().toISOString(),
      orderedAt: order.orderedAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deletePurchaseOrder(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const item = await this.findPurchaseOrderById(organizationId, propertyId, id);
    if (!item) return false;
    await this.db.collection('purchaseOrders').doc(id).delete();
    return true;
  }
}
