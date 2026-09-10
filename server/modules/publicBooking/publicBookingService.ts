import { organizationRepository } from '../saas/organizationRepository.ts';
import { IRoomRepository, roomRepository } from '../pms/roomRepository.ts';
import { IPublicBookingRepository, publicBookingRepository } from './publicBookingRepository.ts';
import {
  PublicBookingProperty,
  PublicBookingQuote,
  PublicBookingQuoteRequest,
  PublicBookingCatalog,
  PublicBookingUnit,
} from './publicBookingTypes.ts';

export class PublicBookingService {
  constructor(
    private readonly catalog: IPublicBookingRepository = publicBookingRepository,
    private readonly rooms: IRoomRepository = roomRepository,
  ) {}

  async resolveProperty(publicPropertyId: string): Promise<PublicBookingProperty> {
    const property = await this.catalog.getProperty(publicPropertyId);
    if (!property || !property.active) throw new Error('Public property is unavailable.');

    const canonicalProperty = await organizationRepository.getPropertyById(property.propertyId);
    if (!canonicalProperty || canonicalProperty.organizationId !== property.organizationId) {
      throw new Error('Public property mapping is invalid.');
    }
    return property;
  }

  async resolveUnit(publicPropertyId: string, publicUnitId: string): Promise<PublicBookingUnit> {
    const property = await this.resolveProperty(publicPropertyId);
    const unit = await this.catalog.getUnit(publicPropertyId, publicUnitId);
    if (!unit || !unit.active) throw new Error('Public unit is unavailable.');
    if (unit.organizationId !== property.organizationId || unit.propertyId !== property.propertyId) {
      throw new Error('Public unit mapping does not belong to the requested property.');
    }

    const canonicalUnit = await this.rooms.findUnitById(property.organizationId, property.propertyId, unit.unitId);
    if (!canonicalUnit || !canonicalUnit.active || canonicalUnit.status === 'maintenance' || canonicalUnit.status === 'out_of_service') {
      throw new Error('Canonical unit is unavailable.');
    }
    return unit;
  }

  async quote(request: PublicBookingQuoteRequest): Promise<PublicBookingQuote> {
    const property = await this.resolveProperty(request.publicPropertyId);
    const unitMapping = await this.resolveUnit(request.publicPropertyId, request.publicUnitId);
    const unit = await this.rooms.findUnitById(property.organizationId, property.propertyId, unitMapping.unitId);
    if (!unit) throw new Error('Canonical unit is unavailable.');
    const category = await this.rooms.findCategoryById(property.organizationId, property.propertyId, unit.categoryId);
    if (!category || !category.active) throw new Error('Canonical room category is unavailable.');

    const nights = this.nights(request.checkInDate, request.checkOutDate);
    const adults = request.adultsCount;
    const children = request.childrenCount || 0;
    if (!Number.isInteger(adults) || adults < 1 || adults > category.capacity.maxAdults || adults + children > category.capacity.totalCapacity) {
      throw new Error('Guest occupancy is not valid for this unit.');
    }

    let amount = category.basePrice * nights;
    if (request.packageId) {
      const pkg = property.packages.find(item => item.packageId === request.packageId && item.active);
      if (!pkg || !pkg.eligibleUnitIds.includes(unit.unitId) || nights < pkg.minNights || !this.isDateInRange(request.checkInDate, pkg.validFrom, pkg.validTo)) {
        throw new Error('Package is unavailable.');
      }
      amount = pkg.priceType === 'per_night' ? pkg.price * nights : pkg.price;
    } else {
      const ratePlanId = request.ratePlanId;
      const ratePlan = property.ratePlans.find(item => item.ratePlanId === ratePlanId && item.active);
      if (!ratePlan) throw new Error('Rate plan is unavailable.');
      amount = ratePlan.modifierType === 'percentage'
        ? amount * (1 + ratePlan.priceModifier / 100)
        : amount + ratePlan.priceModifier * nights;
    }

    const selectedAddOns = new Set(request.addOnIds || []);
    for (const addOnId of selectedAddOns) {
      const addOn = property.addOns.find(item => item.addOnId === addOnId && item.active);
      if (!addOn) throw new Error('Add-on is unavailable.');
      amount += addOn.price;
    }

    if (request.promoCode) {
      const promo = property.promoCodes.find(item => item.promoCode.toUpperCase() === request.promoCode!.toUpperCase() && item.active);
      if (!promo || new Date(`${promo.validUntil}T23:59:59.999Z`) < new Date(`${request.checkInDate}T00:00:00.000Z`) || (promo.minNights && nights < promo.minNights)) {
        throw new Error('Promotion is unavailable.');
      }
      amount = promo.discountType === 'percentage' ? amount * (1 - promo.discountValue / 100) : amount - promo.discountValue;
    }

    return {
      organizationId: property.organizationId,
      propertyId: property.propertyId,
      unitId: unit.unitId,
      currency: property.currency,
      numberOfNights: nights,
      totalAmount: Number(Math.max(0, amount).toFixed(2)),
    };
  }

  async getPublicCatalog(publicPropertyId: string): Promise<PublicBookingCatalog> {
    const property = await this.resolveProperty(publicPropertyId);
    const mappings = await this.catalog.listUnits(publicPropertyId);
    const units = [] as PublicBookingCatalog['units'];

    for (const mapping of mappings) {
      if (!mapping.active) continue;
      try {
        const resolved = await this.resolveUnit(publicPropertyId, mapping.publicUnitId);
        const unit = await this.rooms.findUnitById(property.organizationId, property.propertyId, resolved.unitId);
        if (!unit) continue;
        const category = await this.rooms.findCategoryById(property.organizationId, property.propertyId, unit.categoryId);
        if (!category?.active) continue;
        units.push({
          publicUnitId: mapping.publicUnitId,
          name: category.name || `Unidade ${unit.unitNumber}`,
          capacity: category.capacity.totalCapacity,
          baseNightlyAmount: category.basePrice,
          amenities: category.amenities || [],
        });
      } catch {
        // An unavailable canonical unit is intentionally omitted, never
        // replaced by a fixture or a legacy browser record.
      }
    }

    return {
      publicPropertyId: property.publicPropertyId,
      currency: property.currency,
      ratePlans: property.ratePlans.filter((item) => item.active).map(({ ratePlanId }) => ({ ratePlanId })),
      units,
    };
  }

  private nights(checkInDate: string, checkOutDate: string) {
    const start = new Date(`${checkInDate}T00:00:00.000Z`);
    const end = new Date(`${checkOutDate}T00:00:00.000Z`);
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (!Number.isInteger(days) || days < 1) throw new Error('Invalid stay period.');
    return days;
  }

  private isDateInRange(value: string, from: string, to: string) {
    return value >= from && value <= to;
  }
}

export const publicBookingService = new PublicBookingService();
