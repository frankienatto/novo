import { describe, expect, it } from 'vitest';
import { RoomStatus } from '../../types';
import { adaptCanonicalRoomUnit, toCanonicalUnitStatus } from './pmsRoomAdapter.ts';
import { adaptCanonicalReservation } from './pmsReservationAdapter.ts';

describe('canonical PMS frontend adapters', () => {
  it('preserves textual canonical unit IDs instead of inventing numeric legacy IDs', () => {
    const room = adaptCanonicalRoomUnit({
      unitId: 'stg_unit_01', propertyId: 'stg_prop_synapse_core', categoryId: 'stg_category_standard', unitNumber: 'STG-01', status: 'clean', active: true,
    }, { categoryId: 'stg_category_standard', name: 'Staging Standard', basePrice: 250, amenities: ['Wi-Fi'], capacity: { totalCapacity: 2 } });
    expect(room.id).toBe('stg_unit_01');
    expect(room.status).toBe(RoomStatus.AVAILABLE);
  });

  it('maps only a known visual status back to a canonical PMS status', () => {
    expect(toCanonicalUnitStatus(RoomStatus.MAINTENANCE)).toBe('maintenance');
    expect(toCanonicalUnitStatus(RoomStatus.CLEANING)).toBe('dirty');
  });

  it('projects canonical reservations without making payment state browser-authoritative', () => {
    const booking = adaptCanonicalReservation({
      reservationId: 'res_canonical', unitId: 'stg_unit_01', propertyId: 'stg_prop_synapse_core',
      guest: { guestId: 'guest_1', fullName: 'Guest', email: 'guest@example.test' },
      stayPeriod: { checkInDate: '2026-09-10', checkOutDate: '2026-09-12' }, adultsCount: 1,
      status: 'confirmed', source: 'front_desk', paymentStatus: 'pending', totalAmount: 500, balance: 500,
    });
    expect(booking).toMatchObject({ id: 'res_canonical', roomId: 'stg_unit_01', paymentStatus: 'Pending', totalPrice: 500 });
  });
});
