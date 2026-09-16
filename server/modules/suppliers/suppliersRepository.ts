import { SupplierEntity } from './suppliersTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface ISuppliersRepository {
  findSuppliers(organizationId: string, propertyId: string): Promise<SupplierEntity[]>;
  findSupplierById(organizationId: string, propertyId: string, id: string): Promise<SupplierEntity | null>;
  saveSupplier(supplier: SupplierEntity): Promise<SupplierEntity>;
  deleteSupplier(organizationId: string, propertyId: string, id: string): Promise<boolean>;
}

export class SuppliersRepository implements ISuppliersRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findSuppliers(organizationId: string, propertyId: string): Promise<SupplierEntity[]> {
    const snap = await this.db.collection('suppliers')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierEntity));
  }

  async findSupplierById(organizationId: string, propertyId: string, id: string): Promise<SupplierEntity | null> {
    const docSnap = await this.db.collection('suppliers').doc(id).get();
    if (!docSnap.exists) return null;
    const data = docSnap.data() as SupplierEntity;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: docSnap.id, ...data };
  }

  async saveSupplier(supplier: SupplierEntity): Promise<SupplierEntity> {
    const docRef = this.db.collection('suppliers').doc(supplier.id);
    const existing = await docRef.get();
    if (existing.exists) {
      const current = existing.data() as SupplierEntity;
      if (current.organizationId !== supplier.organizationId || current.propertyId !== supplier.propertyId) {
        throw new Error('TENANT_MISMATCH');
      }
    }
    const payload: SupplierEntity = {
      ...supplier,
      updatedAt: new Date().toISOString(),
      createdAt: supplier.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deleteSupplier(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const item = await this.findSupplierById(organizationId, propertyId, id);
    if (!item) return false;
    await this.db.collection('suppliers').doc(id).delete();
    return true;
  }
}
