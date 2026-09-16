export interface CoworkingPlanEntity {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  type: 'hour' | 'day' | 'month';
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoworkingDeskEntity {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  status: 'Livre' | 'Ocupada' | 'Em Manutenção';
  currentCheckInId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoworkingCheckInEntity {
  id: string;
  organizationId: string;
  propertyId: string;
  deskId: string;
  guestName: string;
  guestPhone?: string;
  startTime: string;
  endTime?: string;
  planId: string;
  status: 'Active' | 'Finished';
  currentItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}
