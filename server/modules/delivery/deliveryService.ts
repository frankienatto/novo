import { IDeliveryRepository, DeliveryRepository } from './deliveryRepository.ts';
import { DeliveryOrderEntity } from './deliveryTypes.ts';

export class DeliveryService {
  constructor(private repo: IDeliveryRepository = new DeliveryRepository()) {}

  async listOrders(organizationId: string, propertyId: string): Promise<DeliveryOrderEntity[]> {
    return this.repo.findOrders(organizationId, propertyId);
  }

  async getOrder(organizationId: string, propertyId: string, id: string): Promise<DeliveryOrderEntity> {
    const order = await this.repo.findOrderById(organizationId, propertyId, id);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    return order;
  }

  async createOrder(
    organizationId: string,
    propertyId: string,
    data: Omit<DeliveryOrderEntity, 'id' | 'organizationId' | 'propertyId'> & { id?: string }
  ): Promise<DeliveryOrderEntity> {
    const id = data.id || `DEL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const order: DeliveryOrderEntity = {
      id,
      organizationId,
      propertyId,
      externalOrderId: data.externalOrderId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      items: data.items || [],
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      total: Number(data.total),
      status: data.status || 'Pending',
      source: data.source || 'App Próprio',
      courierType: data.courierType || 'Motoboy Próprio',
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    return this.repo.saveOrder(order);
  }

  async updateOrderStatus(
    organizationId: string,
    propertyId: string,
    id: string,
    status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled'
  ): Promise<DeliveryOrderEntity> {
    const order = await this.getOrder(organizationId, propertyId, id);
    const updated: DeliveryOrderEntity = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
    };
    return this.repo.saveOrder(updated);
  }
}

export const deliveryService = new DeliveryService();
