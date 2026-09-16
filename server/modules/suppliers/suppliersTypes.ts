export interface SupplierEntity {
  id: string;
  organizationId: string;
  propertyId: string;
  name: string;
  category: 'Alimentos & Bebidas' | 'Lavanderia' | 'Manutenção' | 'Tecnologia' | 'Amenidades' | 'Outros';
  contactName?: string;
  phone?: string;
  email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  cnpj?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}
