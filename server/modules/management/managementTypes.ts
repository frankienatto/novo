export type PosSaleStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type FinancialEntryType = 'income' | 'expense' | 'adjustment' | 'reversal';
export type FinancialEntryStatus = 'posted' | 'reversed';
export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TenantScopedRecord {
  organizationId: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PosCatalogItem extends TenantScopedRecord {
  itemId: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  active: boolean;
  description?: string;
}

export interface PosSaleItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface PosSale extends TenantScopedRecord {
  saleId: string;
  status: PosSaleStatus;
  currency: string;
  items: PosSaleItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  guestId?: string;
  reservationId?: string;
  paymentReference?: string;
  paymentMethod?: 'manual_offline' | 'payment_core';
  closedAt?: string;
  cancelledAt?: string;
  actorUserId: string;
  idempotencyKey?: string;
}

export interface FinancialEntry extends TenantScopedRecord {
  entryId: string;
  type: FinancialEntryType;
  status: FinancialEntryStatus;
  category: string;
  amount: number;
  currency: string;
  sourceType: 'manual' | 'pos_sale' | 'payment_core' | 'project' | 'reversal';
  sourceId: string;
  idempotencyKey: string;
  actorUserId: string;
  description?: string;
  reversalOf?: string;
}

export interface ProjectTask {
  taskId: string;
  projectId: string;
  organizationId: string;
  propertyId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  responsibleUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends TenantScopedRecord {
  projectId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  responsibleUserId?: string;
  participantUserIds: string[];
  startDate?: string;
  endDate?: string;
  plannedBudget?: number;
  currency: string;
  financialEntryIds: string[];
  maintenanceReferenceId?: string;
  progress: number;
}
