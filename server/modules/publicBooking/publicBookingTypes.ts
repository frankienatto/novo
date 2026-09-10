export type PriceModifierType = 'fixed' | 'percentage';
export type PublicPackagePriceType = 'per_night' | 'total_stay';

/**
 * Server-administered public entry point for a property. This deliberately
 * separates an opaque public ID from internal SaaS tenant identifiers.
 */
export interface PublicBookingProperty {
  publicPropertyId: string;
  organizationId: string;
  propertyId: string;
  active: boolean;
  currency: 'brl';
  ratePlans: PublicRatePlan[];
  packages: PublicPackage[];
  addOns: PublicAddOn[];
  promoCodes: PublicPromoCode[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicBookingUnit {
  publicPropertyId: string;
  publicUnitId: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicRatePlan {
  ratePlanId: string;
  modifierType: PriceModifierType;
  priceModifier: number;
  active: boolean;
}

export interface PublicPackage {
  packageId: string;
  price: number;
  priceType: PublicPackagePriceType;
  minNights: number;
  validFrom: string;
  validTo: string;
  /** Explicit canonical-unit allow-list; never infer package eligibility from a legacy room type. */
  eligibleUnitIds: string[];
  includedAddOnIds: string[];
  active: boolean;
}

export interface PublicAddOn {
  addOnId: string;
  price: number;
  active: boolean;
}

export interface PublicPromoCode {
  promoCode: string;
  discountType: PriceModifierType;
  discountValue: number;
  validUntil: string;
  minNights?: number;
  active: boolean;
}

export interface PublicBookingQuoteRequest {
  publicPropertyId: string;
  publicUnitId: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount?: number;
  ratePlanId?: string;
  packageId?: string;
  addOnIds?: string[];
  promoCode?: string;
}

export interface PublicBookingQuote {
  organizationId: string;
  propertyId: string;
  unitId: string;
  currency: 'brl';
  numberOfNights: number;
  totalAmount: number;
}

/** Deliberately public projection of the catalog. It never exposes tenant IDs,
 * internal unit IDs, guest data, or administrative pricing configuration. */
export interface PublicBookingCatalog {
  publicPropertyId: string;
  currency: 'brl';
  ratePlans: Array<{ ratePlanId: string }>;
  units: Array<{
    publicUnitId: string;
    name: string;
    capacity: number;
    baseNightlyAmount: number;
    amenities: string[];
  }>;
}
