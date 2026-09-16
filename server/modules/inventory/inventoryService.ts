import { IInventoryRepository, InventoryRepository } from './inventoryRepository.ts';
import { InventoryItem, InventoryMovement } from './inventoryTypes.ts';

export class InventoryService {
  constructor(private repo: IInventoryRepository = new InventoryRepository()) {}

  async listProducts(organizationId: string, propertyId: string): Promise<InventoryItem[]> {
    return this.repo.findProducts(organizationId, propertyId);
  }

  async getProduct(organizationId: string, propertyId: string, id: string): Promise<InventoryItem> {
    const product = await this.repo.findProductById(organizationId, propertyId, id);
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    return product;
  }

  async upsertProduct(organizationId: string, propertyId: string, data: Partial<InventoryItem> & { name: string; price: number }): Promise<InventoryItem> {
    const id = data.id || `PROD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const product: InventoryItem = {
      id,
      organizationId,
      propertyId,
      name: data.name,
      price: Number(data.price),
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      category: data.category || 'Outros',
      stock: data.stock !== undefined ? Number(data.stock) : 0,
      lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : 5,
      description: data.description,
      imageUrl: data.imageUrl,
      createdAt: data.createdAt,
    };

    return this.repo.saveProduct(product);
  }

  async adjustStock(
    organizationId: string,
    propertyId: string,
    productId: string,
    quantityDelta: number,
    reason: string,
    performedBy?: string
  ): Promise<InventoryItem> {
    const product = await this.getProduct(organizationId, propertyId, productId);
    const newStock = Math.max(0, product.stock + quantityDelta);
    const updated = await this.repo.saveProduct({ ...product, stock: newStock });

    const movement: InventoryMovement = {
      id: `MOV_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId,
      propertyId,
      productId,
      quantity: quantityDelta,
      type: quantityDelta >= 0 ? 'IN' : 'OUT',
      reason,
      createdAt: new Date().toISOString(),
      performedBy,
    };

    await this.repo.recordMovement(movement);
    return updated;
  }

  async deleteProduct(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    return this.repo.deleteProduct(organizationId, propertyId, id);
  }
}

export const inventoryService = new InventoryService();
