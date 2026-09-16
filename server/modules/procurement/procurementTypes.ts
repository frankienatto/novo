export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  status: 'Pendente' | 'Comprado';
  unitCost?: number;
  productId?: string;
  projectId?: string;
  suggestedQuantity?: string;
  justification?: string;
}

export interface ShoppingList {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  status: 'Pendente' | 'Concluída';
  createdAt: string;
  updatedAt?: string;
  items: ShoppingListItem[];
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  propertyId: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'Pendente' | 'Enviada' | 'Recebida' | 'Cancelada';
  orderedAt: string;
  receivedAt?: string;
  updatedAt?: string;
}
