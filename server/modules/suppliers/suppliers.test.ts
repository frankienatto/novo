import { describe, it, expect, beforeEach } from 'vitest';
import { SuppliersService } from './suppliersService.ts';
import { ISuppliersRepository } from './suppliersRepository.ts';
import { SupplierEntity } from './suppliersTypes.ts';

class MockSuppliersRepo implements ISuppliersRepository {
  private suppliers = new Map<string, SupplierEntity>();

  async findSuppliers(orgId: string, propId: string): Promise<SupplierEntity[]> {
    return Array.from(this.suppliers.values()).filter(s => s.organizationId === orgId && s.propertyId === propId);
  }
  async findSupplierById(orgId: string, propId: string, id: string): Promise<SupplierEntity | null> {
    const item = this.suppliers.get(id);
    if (!item || item.organizationId !== orgId || item.propertyId !== propId) return null;
    return item;
  }
  async saveSupplier(supplier: SupplierEntity): Promise<SupplierEntity> {
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }
  async deleteSupplier(orgId: string, propId: string, id: string): Promise<boolean> {
    const item = await this.findSupplierById(orgId, propId, id);
    if (!item) return false;
    this.suppliers.delete(id);
    return true;
  }
}

describe('SuppliersService', () => {
  let repo: MockSuppliersRepo;
  let service: SuppliersService;

  beforeEach(() => {
    repo = new MockSuppliersRepo();
    service = new SuppliersService(repo);
  });

  it('creates and lists suppliers per tenant', async () => {
    await service.upsertSupplier('org-1', 'prop-beach', {
      name: 'Frutas Tropicais Ltda',
      category: 'Alimentos & Bebidas',
      rating: 5,
      phone: '11999999999'
    });

    await service.upsertSupplier('org-2', 'prop-sanctuary', {
      name: 'Lavanderia Sol',
      category: 'Lavanderia',
      rating: 4
    });

    const beachSuppliers = await service.listSuppliers('org-1', 'prop-beach');
    expect(beachSuppliers).toHaveLength(1);
    expect(beachSuppliers[0].name).toBe('Frutas Tropicais Ltda');

    const sanctuarySuppliers = await service.listSuppliers('org-2', 'prop-sanctuary');
    expect(sanctuarySuppliers).toHaveLength(1);
    expect(sanctuarySuppliers[0].name).toBe('Lavanderia Sol');
  });

  it('deletes supplier cleanly', async () => {
    const s = await service.upsertSupplier('org-1', 'prop-beach', {
      name: 'To Delete',
      category: 'Outros',
      rating: 3
    });

    const deleted = await service.deleteSupplier('org-1', 'prop-beach', s.id);
    expect(deleted).toBe(true);
    const list = await service.listSuppliers('org-1', 'prop-beach');
    expect(list).toHaveLength(0);
  });
});
