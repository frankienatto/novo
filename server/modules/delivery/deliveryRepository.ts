import { DeliveryOrderEntity } from './deliveryTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IDeliveryRepository {
  findOrders(organizationId: string, propertyId: string): Promise<DeliveryOrderEntity[]>;
  findOrderById(organizationId: string, propertyId: string, id: string): Promise<DeliveryOrderEntity | null>;
  saveOrder(order: DeliveryOrderEntity): Promise<DeliveryOrderEntity>;
  deleteOrder(organizationId: string, propertyId: string, id: string): Promise<boolean>;
}

export class DeliveryRepository implements IDeliveryRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findOrders(organizationId: string, propertyId: string): Promise<DeliveryOrderEntity[]> {
    const snap = await this.db.collection('deliveryOrders')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryOrderEntity));
  }

  async findOrderById(organizationId: string, propertyId: string, id: string): Promise<DeliveryOrderEntity | null> {
    const doc = await this.db.collection('deliveryOrders').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as DeliveryOrderEntity;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: doc.id, ...data };
  }

  async saveOrder(order: DeliveryOrderEntity): Promise<DeliveryOrderEntity> {
    const docRef = this.db.collection('deliveryOrders').doc(order.id);
    const existing = await docRef.get();
    if (existing.exists) {
      const current = existing.data() as DeliveryOrderEntity;
      if (current.organizationId !== order.organizationId || current.propertyId !== order.propertyId) {
        throw new Error('TENANT_MISMATCH');
      }
    }
    const payload: DeliveryOrderEntity = {
      ...order,
      updatedAt: new Date().toISOString(),
      createdAt: order.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deleteOrder(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const order = await this.findOrderById(organizationId, propertyId, id);
    if (!order) return false;
    await this.db.collection('deliveryOrders').doc(id).delete();
    return true;
  }
}
