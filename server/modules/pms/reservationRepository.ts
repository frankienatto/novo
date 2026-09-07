import { 
  Reservation, 
  ReservationFilterDTO 
} from './reservationTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

export interface IReservationRepository {
  findReservations(organizationId: string, propertyId: string, filter?: ReservationFilterDTO): Promise<Reservation[]>;
  findReservationById(organizationId: string, propertyId: string, reservationId: string): Promise<Reservation | null>;
  findConflictingReservations(
    organizationId: string, 
    propertyId: string, 
    unitId: string, 
    checkInDate: string, 
    checkOutDate: string, 
    excludeReservationId?: string
  ): Promise<Reservation[]>;
  saveReservation(reservation: Reservation): Promise<Reservation>;
  createReservation?(reservation: Reservation): Promise<Reservation>;
  updateReservation(
    organizationId: string, 
    propertyId: string, 
    reservationId: string, 
    updates: Partial<Reservation>
  ): Promise<Reservation | null>;
  deleteReservation?(organizationId: string, propertyId: string, reservationId: string): Promise<boolean>;
  
  // Abstração transacional
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
  seedDevData?(): Promise<void>;
}

export class ReservationRepository implements IReservationRepository {
  private get db() {
    return getAdminFirestore();
  }

  async findReservations(organizationId: string, propertyId: string, filter?: ReservationFilterDTO): Promise<Reservation[]> {
    if (!organizationId || !propertyId) return [];

    let query = this.db.collection('bookings')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId);

    if (filter?.unitId) {
      query = query.where('unitId', '==', filter.unitId);
    }
    if (filter?.categoryId) {
      query = query.where('categoryId', '==', filter.categoryId);
    }
    if (filter?.status) {
      query = query.where('status', '==', filter.status);
    }

    const snapshot = await query.get();
    const reservations: Reservation[] = [];

    snapshot.forEach(doc => {
      const r = doc.data() as Reservation;

      if (filter?.guestName) {
        const queryStr = filter.guestName.toLowerCase().trim();
        const guestNameMatch = r.guest?.fullName?.toLowerCase().includes(queryStr);
        const emailMatch = r.guest?.email?.toLowerCase().includes(queryStr);
        if (!guestNameMatch && !emailMatch) {
          return;
        }
      }

      if (filter?.startDate && r.stayPeriod?.checkOutDate <= filter.startDate) {
        return;
      }

      if (filter?.endDate && r.stayPeriod?.checkInDate >= filter.endDate) {
        return;
      }

      reservations.push(r);
    });

    return reservations;
  }

  async findReservationById(organizationId: string, propertyId: string, reservationId: string): Promise<Reservation | null> {
    if (!organizationId || !propertyId || !reservationId) return null;

    const docSnap = await this.db.collection('bookings').doc(reservationId).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data() as Reservation;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) {
      return null;
    }

    return data;
  }

  async findConflictingReservations(
    organizationId: string,
    propertyId: string,
    unitId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<Reservation[]> {
    if (!organizationId || !propertyId || !unitId) return [];

    const activeStatuses = ['confirmed', 'checked_in'];

    const snapshot = await this.db.collection('bookings')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .where('unitId', '==', unitId)
      .get();

    const conflicts: Reservation[] = [];

    snapshot.forEach(doc => {
      const r = doc.data() as Reservation;

      if (excludeReservationId && r.reservationId === excludeReservationId) {
        return;
      }

      if (!activeStatuses.includes(r.status)) {
        return;
      }

      // Regra padrão hoteleira de sobreposição de datas:
      // Conflito ocorre se: (checkInExistente < novoCheckOut) E (checkOutExistente > novoCheckIn)
      const isOverlapping = (r.stayPeriod.checkInDate < checkOutDate) && (r.stayPeriod.checkOutDate > checkInDate);
      if (isOverlapping) {
        conflicts.push(r);
      }
    });

    return conflicts;
  }

  async saveReservation(reservation: Reservation): Promise<Reservation> {
    if (!reservation.reservationId) {
      reservation.reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!reservation.createdAt) {
      reservation.createdAt = new Date().toISOString();
    }
    reservation.updatedAt = new Date().toISOString();

    await this.db.collection('bookings').doc(reservation.reservationId).set(reservation, { merge: true });
    return reservation;
  }

  async createReservation(reservation: Reservation): Promise<Reservation> {
    return this.saveReservation(reservation);
  }

  async updateReservation(
    organizationId: string,
    propertyId: string,
    reservationId: string,
    updates: Partial<Reservation>
  ): Promise<Reservation | null> {
    const existing = await this.findReservationById(organizationId, propertyId, reservationId);
    if (!existing) return null;

    // Proteção de imutabilidade multi-tenant
    if (updates.organizationId && updates.organizationId !== organizationId) {
      throw new Error("Não é permitido alterar o organizationId de uma reserva existente.");
    }
    if (updates.propertyId && updates.propertyId !== propertyId) {
      throw new Error("Não é permitido alterar o propertyId de uma reserva existente.");
    }
    if (updates.reservationId && updates.reservationId !== reservationId) {
      throw new Error("Não é permitido alterar o reservationId de uma reserva existente.");
    }

    const updated: Reservation = {
      ...existing,
      ...updates,
      organizationId,
      propertyId,
      reservationId,
      updatedAt: new Date().toISOString()
    };

    await this.db.collection('bookings').doc(reservationId).set(updated, { merge: true });
    return updated;
  }

  async deleteReservation(organizationId: string, propertyId: string, reservationId: string): Promise<boolean> {
    const existing = await this.findReservationById(organizationId, propertyId, reservationId);
    if (!existing) return false;

    await this.db.collection('bookings').doc(reservationId).delete();
    return true;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return await work();
  }

  async seedDevData(): Promise<void> {
    const devOrgId = 'org_dev_default';
    const devPropId = 'prop_dev_default';

    const existing = await this.findReservations(devOrgId, devPropId);
    if (existing.length === 0) {
      const res1Id = 'res_dev_001';
      const res1: Reservation = {
        reservationId: res1Id,
        organizationId: devOrgId,
        propertyId: devPropId,
        unitId: 'uh_101',
        categoryId: 'cat_suite_luxo',
        guest: {
          guestId: 'gst_001',
          fullName: 'Carlos Eduardo Silva',
          email: 'carlos.silva@example.com',
          phone: '+55 11 98765-4321',
          documentId: '123.456.789-00',
          documentType: 'cpf'
        },
        stayPeriod: {
          checkInDate: '2026-08-10',
          checkOutDate: '2026-08-15',
          numberOfNights: 5
        },
        adultsCount: 2,
        childrenCount: 0,
        status: 'confirmed',
        source: 'direct_website',
        paymentStatus: 'pending',
        totalAmount: 2250.00,
        notes: 'Hóspede prefere andar alto e silêncio.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveReservation(res1);
    }
  }
}

export const reservationRepository = new ReservationRepository();
export { ReservationRepository as InMemoryReservationRepository };

