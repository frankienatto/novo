import { ISuppliersRepository, SuppliersRepository } from './suppliersRepository.ts';
import { SupplierEntity } from './suppliersTypes.ts';

export class SuppliersService {
  constructor(private repo: ISuppliersRepository = new SuppliersRepository()) {}

  async listSuppliers(organizationId: string, propertyId: string): Promise<SupplierEntity[]> {
    return this.repo.findSuppliers(organizationId, propertyId);
  }

  async getSupplier(organizationId: string, propertyId: string, id: string): Promise<SupplierEntity> {
    const s = await this.repo.findSupplierById(organizationId, propertyId, id);
    if (!s) throw new Error('SUPPLIER_NOT_FOUND');
    return s;
  }

  async upsertSupplier(
    organizationId: string,
    propertyId: string,
    data: Partial<SupplierEntity> & { name: string; category: any }
  ): Promise<SupplierEntity> {
    const id = data.id || `SUP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const supplier: SupplierEntity = {
      id,
      organizationId,
      propertyId,
      name: data.name,
      category: data.category || 'Outros',
      contactName: data.contactName,
      phone: data.phone,
      email: data.email,
      rating: data.rating || 3,
      cnpj: data.cnpj,
      address: data.address,
      createdAt: data.createdAt,
    };
    return this.repo.saveSupplier(supplier);
  }

  async deleteSupplier(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    return this.repo.deleteSupplier(organizationId, propertyId, id);
  }
}

export const suppliersService = new SuppliersService();
