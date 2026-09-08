import { getAdminFirestore } from '../../config/firebaseAdmin.ts';
import { PublicBookingProperty, PublicBookingUnit } from './publicBookingTypes.ts';

export interface IPublicBookingRepository {
  getProperty(publicPropertyId: string): Promise<PublicBookingProperty | null>;
  createProperty(property: PublicBookingProperty): Promise<PublicBookingProperty>;
  getUnit(publicPropertyId: string, publicUnitId: string): Promise<PublicBookingUnit | null>;
  createUnit(unit: PublicBookingUnit): Promise<PublicBookingUnit>;
}

/** Persistent, server-administered catalog. It is intentionally not exposed
 * through Firestore client rules: public lookups must be resolved by backend. */
export class PublicBookingRepository implements IPublicBookingRepository {
  private get db() {
    return getAdminFirestore();
  }

  private unitDocumentId(publicPropertyId: string, publicUnitId: string) {
    return `${publicPropertyId}__${publicUnitId}`;
  }

  async getProperty(publicPropertyId: string): Promise<PublicBookingProperty | null> {
    if (!publicPropertyId) return null;
    const snapshot = await this.db.collection('publicBookingProperties').doc(publicPropertyId).get();
    return snapshot.exists ? snapshot.data() as PublicBookingProperty : null;
  }

  async createProperty(property: PublicBookingProperty): Promise<PublicBookingProperty> {
    if (!property.publicPropertyId || !property.organizationId || !property.propertyId) {
      throw new Error('Public property mapping requires publicPropertyId, organizationId and propertyId.');
    }
    const existing = await this.getProperty(property.publicPropertyId);
    if (existing) {
      throw new Error('publicPropertyId is already registered.');
    }
    await this.db.collection('publicBookingProperties').doc(property.publicPropertyId).create(property);
    return property;
  }

  async getUnit(publicPropertyId: string, publicUnitId: string): Promise<PublicBookingUnit | null> {
    if (!publicPropertyId || !publicUnitId) return null;
    const snapshot = await this.db.collection('publicBookingUnits')
      .doc(this.unitDocumentId(publicPropertyId, publicUnitId)).get();
    return snapshot.exists ? snapshot.data() as PublicBookingUnit : null;
  }

  async createUnit(unit: PublicBookingUnit): Promise<PublicBookingUnit> {
    if (!unit.publicPropertyId || !unit.publicUnitId || !unit.organizationId || !unit.propertyId || !unit.unitId) {
      throw new Error('Public unit mapping is incomplete.');
    }
    const existing = await this.getUnit(unit.publicPropertyId, unit.publicUnitId);
    if (existing) {
      throw new Error('publicUnitId is already registered for this public property.');
    }
    await this.db.collection('publicBookingUnits')
      .doc(this.unitDocumentId(unit.publicPropertyId, unit.publicUnitId)).create(unit);
    return unit;
  }
}

export const publicBookingRepository = new PublicBookingRepository();
