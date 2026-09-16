export interface InventoryItem {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  price: number;
  costPrice?: number;
  category: 'Comida & Bebida' | 'Aluguel' | 'Passeio' | 'Coworking' | 'Outros' | 'Manutenção' | 'Limpeza' | 'Suprimentos';
  stock: number;
  lowStockThreshold: number;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  propertyId: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason?: string;
  createdAt: string;
  performedBy?: string;
}
