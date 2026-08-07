export type RoomStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_service' | 'maintenance';

export type BedType = 'single' | 'double' | 'queen' | 'king' | 'bunk_bed' | 'sofa_bed';

export interface BedConfig {
  type: BedType;
  count: number;
}

export interface CapacityConfig {
  standardAdults: number;
  maxAdults: number;
  maxChildren: number;
  totalCapacity: number;
}

export interface Amenity {
  id: string;
  name: string;
  category?: string;
}

export interface RoomCategory {
  categoryId: string;
  organizationId: string;
  propertyId: string;
  name: string;
  code: string;
  description?: string;
  capacity: CapacityConfig;
  basePrice: number;
  beds: BedConfig[];
  amenities: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomUnit {
  unitId: string;
  organizationId: string;
  propertyId: string;
  categoryId: string;
  unitNumber: string;
  floor?: string;
  block?: string;
  status: RoomStatus;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  code: string;
  description?: string;
  capacity: CapacityConfig;
  basePrice: number;
  beds?: BedConfig[];
  amenities?: string[];
}

export interface UpdateCategoryDTO {
  name?: string;
  code?: string;
  description?: string;
  capacity?: CapacityConfig;
  basePrice?: number;
  beds?: BedConfig[];
  amenities?: string[];
  active?: boolean;
}

export interface CreateUnitDTO {
  categoryId: string;
  unitNumber: string;
  floor?: string;
  block?: string;
  status?: RoomStatus;
  notes?: string;
}

export interface UpdateUnitDTO {
  categoryId?: string;
  unitNumber?: string;
  floor?: string;
  block?: string;
  status?: RoomStatus;
  notes?: string;
  active?: boolean;
}

export interface PmsInventorySummary {
  totalCategories: number;
  totalUnits: number;
  unitsByStatus: Record<RoomStatus, number>;
  totalCapacity: number;
  activeUnitsCount: number;
}
