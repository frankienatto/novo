import { InventoryItem, InventoryMovement } from './inventoryTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IInventoryRepository {
  findProducts(organizationId: string, propertyId: string): Promise<InventoryItem[]>;
  findProductById(organizationId: string, propertyId: string, id: string): Promise<InventoryItem | null>;
  saveProduct(product: InventoryItem): Promise<InventoryItem>;
  deleteProduct(organizationId: string, propertyId: string, id: string): Promise<boolean>;
  recordMovement(movement: InventoryMovement): Promise<InventoryMovement>;
  getMovements(organizationId: string, propertyId: string, productId?: string): Promise<InventoryMovement[]>;
}

export class InventoryRepository implements IInventoryRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findProducts(organizationId: string, propertyId: string): Promise<InventoryItem[]> {
    const snap = await this.db.collection('products')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
  }

  async findProductById(organizationId: string, propertyId: string, id: string): Promise<InventoryItem | null> {
    const docSnap = await this.db.collection('products').doc(id).get();
    if (!docSnap.exists) return null;
    const data = docSnap.data() as InventoryItem;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: docSnap.id, ...data };
  }

  async saveProduct(product: InventoryItem): Promise<InventoryItem> {
    const docRef = this.db.collection('products').doc(product.id);
    const existing = await docRef.get();
    if (existing.exists) {
      const current = existing.data() as InventoryItem;
      if (current.organizationId !== product.organizationId || current.propertyId !== product.propertyId) {
        throw new Error('TENANT_MISMATCH: Cannot overwrite item of different tenant');
      }
    }

    const payload: InventoryItem = {
      ...product,
      updatedAt: new Date().toISOString(),
      createdAt: product.createdAt || new Date().toISOString(),
    };

    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deleteProduct(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const item = await this.findProductById(organizationId, propertyId, id);
    if (!item) return false;
    await this.db.collection('products').doc(id).delete();
    return true;
  }

  async recordMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    const docRef = this.db.collection('inventoryMovements').doc(movement.id);
    await docRef.set(movement);
    return movement;
  }

  async getMovements(organizationId: string, propertyId: string, productId?: string): Promise<InventoryMovement[]> {
    let query: FirebaseFirestore.Query = this.db.collection('inventoryMovements')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (productId) {
      query = query.where('productId', '==', productId);
    }

    const snap = await query.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryMovement));
  }
}
