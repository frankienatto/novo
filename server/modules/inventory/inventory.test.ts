import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from './inventoryService.ts';
import { IInventoryRepository } from './inventoryRepository.ts';
import { InventoryItem, InventoryMovement } from './inventoryTypes.ts';

class MockInventoryRepo implements IInventoryRepository {
  private items = new Map<string, InventoryItem>();
  private movements: InventoryMovement[] = [];

  async findProducts(orgId: string, propId: string): Promise<InventoryItem[]> {
    return Array.from(this.items.values()).filter(
      i => i.organizationId === orgId && i.propertyId === propId
    );
  }

  async findProductById(orgId: string, propId: string, id: string): Promise<InventoryItem | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== orgId || item.propertyId !== propId) return null;
    return item;
  }

  async saveProduct(product: InventoryItem): Promise<InventoryItem> {
    this.items.set(product.id, product);
    return product;
  }

  async deleteProduct(orgId: string, propId: string, id: string): Promise<boolean> {
    const item = await this.findProductById(orgId, propId, id);
    if (!item) return false;
    this.items.delete(id);
    return true;
  }

  async recordMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    this.movements.push(movement);
    return movement;
  }

  async getMovements(orgId: string, propId: string, productId?: string): Promise<InventoryMovement[]> {
    return this.movements.filter(m => m.organizationId === orgId && m.propertyId === propId && (!productId || m.productId === productId));
  }
}

describe('InventoryService', () => {
  let repo: MockInventoryRepo;
  let service: InventoryService;

  beforeEach(() => {
    repo = new MockInventoryRepo();
    service = new InventoryService(repo);
  });

  it('creates and lists products strictly within tenant boundary', async () => {
    await service.upsertProduct('org-1', 'prop-beach', { name: 'Água de Coco', price: 10, stock: 20 });
    await service.upsertProduct('org-2', 'prop-sanctuary', { name: 'Vinho Tinto', price: 80, stock: 5 });

    const beachProducts = await service.listProducts('org-1', 'prop-beach');
    expect(beachProducts).toHaveLength(1);
    expect(beachProducts[0].name).toBe('Água de Coco');

    const sanctuaryProducts = await service.listProducts('org-2', 'prop-sanctuary');
    expect(sanctuaryProducts).toHaveLength(1);
    expect(sanctuaryProducts[0].name).toBe('Vinho Tinto');
  });

  it('adjusts stock and records movement', async () => {
    const created = await service.upsertProduct('org-1', 'prop-beach', { name: 'Cerveja', price: 15, stock: 10 });
    const updated = await service.adjustStock('org-1', 'prop-beach', created.id, -2, 'Venda POS');

    expect(updated.stock).toBe(8);
    const movements = await repo.getMovements('org-1', 'prop-beach', created.id);
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe('OUT');
    expect(movements[0].quantity).toBe(-2);
  });
});
