import { CoworkingPlanEntity, CoworkingDeskEntity, CoworkingCheckInEntity } from './coworkingTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface ICoworkingRepository {
  findPlans(organizationId: string, propertyId: string): Promise<CoworkingPlanEntity[]>;
  savePlan(plan: CoworkingPlanEntity): Promise<CoworkingPlanEntity>;
  deletePlan(organizationId: string, propertyId: string, id: string): Promise<boolean>;

  findDesks(organizationId: string, propertyId: string): Promise<CoworkingDeskEntity[]>;
  findDeskById(organizationId: string, propertyId: string, id: string): Promise<CoworkingDeskEntity | null>;
  saveDesk(desk: CoworkingDeskEntity): Promise<CoworkingDeskEntity>;
  deleteDesk(organizationId: string, propertyId: string, id: string): Promise<boolean>;

  findCheckIns(organizationId: string, propertyId: string, status?: 'Active' | 'Finished'): Promise<CoworkingCheckInEntity[]>;
  findCheckInById(organizationId: string, propertyId: string, id: string): Promise<CoworkingCheckInEntity | null>;
  saveCheckIn(checkIn: CoworkingCheckInEntity): Promise<CoworkingCheckInEntity>;
}

export class CoworkingRepository implements ICoworkingRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findPlans(organizationId: string, propertyId: string): Promise<CoworkingPlanEntity[]> {
    const snap = await this.db.collection('coworkingPlans')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoworkingPlanEntity));
  }

  async savePlan(plan: CoworkingPlanEntity): Promise<CoworkingPlanEntity> {
    const docRef = this.db.collection('coworkingPlans').doc(plan.id);
    const payload: CoworkingPlanEntity = {
      ...plan,
      updatedAt: new Date().toISOString(),
      createdAt: plan.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deletePlan(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const docRef = this.db.collection('coworkingPlans').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    const data = snap.data() as CoworkingPlanEntity;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return false;
    await docRef.delete();
    return true;
  }

  async findDesks(organizationId: string, propertyId: string): Promise<CoworkingDeskEntity[]> {
    const snap = await this.db.collection('coworkingDesks')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoworkingDeskEntity));
  }

  async findDeskById(organizationId: string, propertyId: string, id: string): Promise<CoworkingDeskEntity | null> {
    const snap = await this.db.collection('coworkingDesks').doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as CoworkingDeskEntity;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: snap.id, ...data };
  }

  async saveDesk(desk: CoworkingDeskEntity): Promise<CoworkingDeskEntity> {
    const docRef = this.db.collection('coworkingDesks').doc(desk.id);
    const payload: CoworkingDeskEntity = {
      ...desk,
      updatedAt: new Date().toISOString(),
      createdAt: desk.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }

  async deleteDesk(organizationId: string, propertyId: string, id: string): Promise<boolean> {
    const desk = await this.findDeskById(organizationId, propertyId, id);
    if (!desk) return false;
    await this.db.collection('coworkingDesks').doc(id).delete();
    return true;
  }

  async findCheckIns(organizationId: string, propertyId: string, status?: 'Active' | 'Finished'): Promise<CoworkingCheckInEntity[]> {
    let query: FirebaseFirestore.Query = this.db.collection('coworkingCheckIns')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (status) {
      query = query.where('status', '==', status);
    }
    const snap = await query.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoworkingCheckInEntity));
  }

  async findCheckInById(organizationId: string, propertyId: string, id: string): Promise<CoworkingCheckInEntity | null> {
    const snap = await this.db.collection('coworkingCheckIns').doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as CoworkingCheckInEntity;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) return null;
    return { id: snap.id, ...data };
  }

  async saveCheckIn(checkIn: CoworkingCheckInEntity): Promise<CoworkingCheckInEntity> {
    const docRef = this.db.collection('coworkingCheckIns').doc(checkIn.id);
    const payload: CoworkingCheckInEntity = {
      ...checkIn,
      updatedAt: new Date().toISOString(),
      createdAt: checkIn.createdAt || new Date().toISOString(),
    };
    await docRef.set(payload, { merge: true });
    return payload;
  }
}
