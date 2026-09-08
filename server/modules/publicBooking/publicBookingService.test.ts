import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicBookingRepository } from './publicBookingRepository.ts';
import { PublicBookingService } from './publicBookingService.ts';
import type { PublicBookingProperty, PublicBookingUnit } from './publicBookingTypes.ts';

const store: Record<string, Record<string, any>> = {};

function firestore() {
  return {
    collection: (name: string) => {
      const collection = store[name] ||= {};
      return {
        doc: (id: string) => ({
          get: async () => ({ exists: !!collection[id], data: () => collection[id] }),
          create: async (value: any) => {
            if (collection[id]) throw new Error('already exists');
            collection[id] = structuredClone(value);
          },
          set: async (value: any) => { collection[id] = structuredClone(value); },
        }),
      };
    },
  };
}

vi.mock('../../config/firebaseAdmin.ts', () => ({ getAdminFirestore: firestore }));

const property: PublicBookingProperty = {
  publicPropertyId: 'forest-beach', organizationId: 'org_a', propertyId: 'prop_a', active: true, currency: 'brl',
  ratePlans: [
    { ratePlanId: 'standard', modifierType: 'fixed', priceModifier: 0, active: true },
    { ratePlanId: 'nonref', modifierType: 'percentage', priceModifier: -10, active: true },
  ],
  packages: [{ packageId: 'romantic', price: 180, priceType: 'per_night', minNights: 2, validFrom: '2026-01-01', validTo: '2026-12-31', eligibleUnitIds: ['unit_a'], includedAddOnIds: ['breakfast'], active: true }],
  addOns: [{ addOnId: 'breakfast', price: 25, active: true }, { addOnId: 'late-checkout', price: 50, active: true }],
  promoCodes: [{ promoCode: 'WELCOME10', discountType: 'percentage', discountValue: 10, validUntil: '2026-12-31', minNights: 2, active: true }],
  createdAt: '', updatedAt: '',
};

const unit: PublicBookingUnit = {
  publicPropertyId: 'forest-beach', publicUnitId: 'beach-suite-1', organizationId: 'org_a', propertyId: 'prop_a', unitId: 'unit_a', active: true, createdAt: '', updatedAt: '',
};

describe('Public booking canonical foundation', () => {
  let catalog: PublicBookingRepository;
  let service: PublicBookingService;

  beforeEach(async () => {
    for (const key of Object.keys(store)) delete store[key];
    store.organizations = { org_a: { organizationId: 'org_a', status: 'active' } };
    store.properties = { prop_a: { propertyId: 'prop_a', organizationId: 'org_a' }, prop_b: { propertyId: 'prop_b', organizationId: 'org_b' } };
    catalog = new PublicBookingRepository();
    await catalog.createProperty(property);
    await catalog.createUnit(unit);
    const rooms = {
      findUnitById: vi.fn(async (org: string, prop: string, id: string) => org === 'org_a' && prop === 'prop_a' && id === 'unit_a'
        ? { unitId: 'unit_a', organizationId: org, propertyId: prop, categoryId: 'cat_a', active: true, status: 'clean' } : null),
      findCategoryById: vi.fn(async (org: string, prop: string, id: string) => org === 'org_a' && prop === 'prop_a' && id === 'cat_a'
        ? { categoryId: 'cat_a', organizationId: org, propertyId: prop, active: true, basePrice: 200, capacity: { maxAdults: 2, totalCapacity: 3 } } : null),
    } as any;
    service = new PublicBookingService(catalog, rooms);
  });

  it('resolves an explicit public property to its canonical tenant only', async () => {
    await expect(service.resolveProperty('forest-beach')).resolves.toMatchObject({ organizationId: 'org_a', propertyId: 'prop_a' });
    await expect(service.resolveProperty('unknown')).rejects.toThrow('unavailable');
  });

  it('rejects duplicate public property IDs and keeps mappings persistent', async () => {
    await expect(catalog.createProperty(property)).rejects.toThrow('already registered');
    await expect(catalog.getProperty('forest-beach')).resolves.toMatchObject({ propertyId: 'prop_a' });
  });

  it('resolves a unit only within the property it is explicitly mapped to', async () => {
    await expect(service.resolveUnit('forest-beach', 'beach-suite-1')).resolves.toMatchObject({ unitId: 'unit_a' });
    await expect(service.resolveUnit('forest-beach', 'unknown-unit')).rejects.toThrow('unavailable');
    await catalog.createProperty({ ...property, publicPropertyId: 'other-property', organizationId: 'org_b', propertyId: 'prop_b' });
    await catalog.createUnit({ ...unit, publicPropertyId: 'other-property', organizationId: 'org_b', propertyId: 'prop_b', unitId: 'unit_b' });
    await expect(service.resolveUnit('other-property', 'beach-suite-1')).rejects.toThrow('unavailable');
  });

  it('calculates the same commercial components server-side and ignores client financial input', async () => {
    const quote = await service.quote({
      publicPropertyId: 'forest-beach', publicUnitId: 'beach-suite-1', checkInDate: '2026-06-10', checkOutDate: '2026-06-13',
      adultsCount: 2, ratePlanId: 'nonref', addOnIds: ['breakfast', 'late-checkout'], promoCode: 'WELCOME10',
    });
    expect(quote.totalAmount).toBe(553.5); // ((200 * 3 * .9) + 25 + 50) * .9
    expect(quote).toMatchObject({ organizationId: 'org_a', propertyId: 'prop_a', unitId: 'unit_a', currency: 'brl' });
  });

  it('uses an explicitly eligible package and never a client supplied price', async () => {
    const quote = await service.quote({
      publicPropertyId: 'forest-beach', publicUnitId: 'beach-suite-1', checkInDate: '2026-06-10', checkOutDate: '2026-06-12',
      adultsCount: 2, packageId: 'romantic', addOnIds: ['breakfast'],
      totalPrice: 1,
    } as any);
    expect(quote.totalAmount).toBe(385); // Package (180 * 2) + server-resolved breakfast (25)
  });

  it('rejects unavailable commercial IDs and cross-property unit input', async () => {
    const base = { publicPropertyId: 'forest-beach', publicUnitId: 'beach-suite-1', checkInDate: '2026-06-10', checkOutDate: '2026-06-12', adultsCount: 2 };
    await expect(service.quote({ ...base, ratePlanId: 'attacker-price' })).rejects.toThrow('Rate plan');
    await expect(service.quote({ ...base, ratePlanId: 'standard', addOnIds: ['unknown'] })).rejects.toThrow('Add-on');
    await expect(service.quote({ ...base, ratePlanId: 'standard', promoCode: 'forged' })).rejects.toThrow('Promotion');
    await expect(service.quote({ ...base, publicUnitId: 'unit_a', ratePlanId: 'standard' })).rejects.toThrow('Public unit');
  });

  it('does not fall back to development properties, legacy rooms, or fixture pricing', async () => {
    const emptyCatalog = { getProperty: vi.fn(async () => null), getUnit: vi.fn(async () => null) } as any;
    const rooms = { findUnitById: vi.fn(), findCategoryById: vi.fn() } as any;
    const emptyService = new PublicBookingService(emptyCatalog, rooms);

    await expect(emptyService.quote({
      publicPropertyId: 'P01', publicUnitId: '101', checkInDate: '2026-06-10', checkOutDate: '2026-06-12', adultsCount: 2, ratePlanId: 'standard',
    })).rejects.toThrow('Public property is unavailable');
    expect(rooms.findUnitById).not.toHaveBeenCalled();
    expect(rooms.findCategoryById).not.toHaveBeenCalled();
  });
});
