import { describe, it, expect, beforeEach } from 'vitest';
import { DeliveryService } from './deliveryService.ts';
import { IDeliveryRepository } from './deliveryRepository.ts';
import { DeliveryOrderEntity } from './deliveryTypes.ts';

class MockDeliveryRepo implements IDeliveryRepository {
  private orders = new Map<string, DeliveryOrderEntity>();

  async findOrders(orgId: string, propId: string): Promise<DeliveryOrderEntity[]> {
    return Array.from(this.orders.values()).filter(o => o.organizationId === orgId && o.propertyId === propId);
  }
  async findOrderById(orgId: string, propId: string, id: string): Promise<DeliveryOrderEntity | null> {
    const o = this.orders.get(id);
    if (!o || o.organizationId !== orgId || o.propertyId !== propId) return null;
    return o;
  }
  async saveOrder(order: DeliveryOrderEntity): Promise<DeliveryOrderEntity> {
    this.orders.set(order.id, order);
    return order;
  }
  async deleteOrder(orgId: string, propId: string, id: string): Promise<boolean> {
    const o = await this.findOrderById(orgId, propId, id);
    if (!o) return false;
    this.orders.delete(id);
    return true;
  }
}

describe('DeliveryService', () => {
  let repo: MockDeliveryRepo;
  let service: DeliveryService;

  beforeEach(() => {
    repo = new MockDeliveryRepo();
    service = new DeliveryService(repo);
  });

  it('creates an order and transitions status through Pending -> Preparing -> Dispatched', async () => {
    const order = await service.createOrder('org-1', 'prop-beach', {
      customerName: 'Maria Silva',
      customerPhone: '11988887777',
      customerAddress: 'Rua das Flores 123',
      items: [{ productId: 'p1', name: 'Hambúrguer Gourmet', quantity: 1, unitPrice: 45 }],
      total: 45,
      status: 'Pending',
      source: 'iFood',
      courierType: 'iFood',
      createdAt: new Date().toISOString()
    });

    expect(order.status).toBe('Pending');

    const preparing = await service.updateOrderStatus('org-1', 'prop-beach', order.id, 'Preparing');
    expect(preparing.status).toBe('Preparing');

    const dispatched = await service.updateOrderStatus('org-1', 'prop-beach', order.id, 'Dispatched');
    expect(dispatched.status).toBe('Dispatched');
  });
});
