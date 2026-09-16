export interface DeliveryOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryOrderEntity {
  id: string;
  organizationId: string;
  propertyId: string;
  externalOrderId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: DeliveryOrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled';
  source: 'App Próprio' | 'iFood' | 'WhatsApp' | 'Direct' | 'Rappi' | 'UberEats';
  courierType: 'Motoboy Próprio' | 'iFood' | 'Retirada';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
