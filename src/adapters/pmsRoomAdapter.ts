import { RoomStatus, type Room } from '../../types';

export interface CanonicalRoomCategory {
  categoryId: string;
  name: string;
  basePrice: number;
  amenities: string[];
  capacity: { totalCapacity: number };
}

export interface CanonicalRoomUnit {
  unitId: string;
  propertyId: string;
  categoryId: string;
  unitNumber: string;
  status: 'clean' | 'dirty' | 'inspected' | 'maintenance' | 'out_of_service';
  active: boolean;
}

const statusByCanonicalValue: Record<CanonicalRoomUnit['status'], RoomStatus> = {
  clean: RoomStatus.AVAILABLE,
  dirty: RoomStatus.CLEANING,
  inspected: RoomStatus.INSPECTION,
  maintenance: RoomStatus.MAINTENANCE,
  out_of_service: RoomStatus.MAINTENANCE,
};

/** Compatibility projection for existing visual components. The unitId stays
 * textual end-to-end; no browser-generated numeric room IDs are introduced. */
export function adaptCanonicalRoomUnit(unit: CanonicalRoomUnit, category?: CanonicalRoomCategory): Room {
  return {
    id: unit.unitId,
    name: `${category?.name || 'Unidade'} ${unit.unitNumber}`,
    type: (category?.name || 'Unidade Hoteleira') as Room['type'],
    capacity: category?.capacity.totalCapacity || 0,
    basePrice: category?.basePrice || 0,
    imageUrl: '',
    amenities: category?.amenities || [],
    status: statusByCanonicalValue[unit.status],
    propertyId: unit.propertyId as Room['propertyId'],
  };
}

export function toCanonicalUnitStatus(status: RoomStatus): CanonicalRoomUnit['status'] {
  switch (status) {
    case RoomStatus.AVAILABLE: return 'clean';
    case RoomStatus.CLEANING: return 'dirty';
    case RoomStatus.INSPECTION: return 'inspected';
    case RoomStatus.MAINTENANCE: return 'maintenance';
    case RoomStatus.OCCUPIED: return 'out_of_service';
  }
}
