import { 
  Reservation, 
  ReservationFilterDTO 
} from './reservationTypes.ts';

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
  updateReservation(
    organizationId: string, 
    propertyId: string, 
    reservationId: string, 
    updates: Partial<Reservation>
  ): Promise<Reservation | null>;
  
  // Abstração preparada para futura integração transacional (ex: Firestore runTransaction)
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

export class InMemoryReservationRepository implements IReservationRepository {
  private reservations: Map<string, Reservation> = new Map();

  constructor() {
    this.seedDevData();
  }

  private seedDevData(): void {
    const devOrgId = 'org_dev_default';
    const devPropId = 'prop_dev_default';

    // Seed 1: Reserva Confirmada em UH 101 para próximas semanas
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
      totalAmount: 2250.00, // 5 * 450
      notes: 'Hóspede prefere andar alto e silêncio.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reservations.set(res1Id, res1);
  }

  async findReservations(organizationId: string, propertyId: string, filter?: ReservationFilterDTO): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => {
      if (r.organizationId !== organizationId || r.propertyId !== propertyId) {
        return false;
      }

      if (filter?.unitId && r.unitId !== filter.unitId) {
        return false;
      }

      if (filter?.categoryId && r.categoryId !== filter.categoryId) {
        return false;
      }

      if (filter?.status && r.status !== filter.status) {
        return false;
      }

      if (filter?.guestName) {
        const query = filter.guestName.toLowerCase().trim();
        const guestNameMatch = r.guest.fullName.toLowerCase().includes(query);
        const emailMatch = r.guest.email.toLowerCase().includes(query);
        if (!guestNameMatch && !emailMatch) {
          return false;
        }
      }

      if (filter?.startDate && r.stayPeriod.checkOutDate <= filter.startDate) {
        return false;
      }

      if (filter?.endDate && r.stayPeriod.checkInDate >= filter.endDate) {
        return false;
      }

      return true;
    });
  }

  async findReservationById(organizationId: string, propertyId: string, reservationId: string): Promise<Reservation | null> {
    const res = this.reservations.get(reservationId);
    if (!res || res.organizationId !== organizationId || res.propertyId !== propertyId) {
      return null;
    }
    return res;
  }

  async findConflictingReservations(
    organizationId: string,
    propertyId: string,
    unitId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<Reservation[]> {
    // Apenas reservas ativas ('confirmed' ou 'checked_in') geram conflito/overbooking.
    const activeStatuses = ['confirmed', 'checked_in'];

    return Array.from(this.reservations.values()).filter(r => {
      if (r.organizationId !== organizationId || r.propertyId !== propertyId || r.unitId !== unitId) {
        return false;
      }

      if (excludeReservationId && r.reservationId === excludeReservationId) {
        return false;
      }

      if (!activeStatuses.includes(r.status)) {
        return false;
      }

      // Regra padrão hoteleira de sobreposição de datas:
      // Conflito ocorre se: (checkInExistente < novocheckOut) E (checkOutExistente > novoCheckIn)
      const isOverlapping = (r.stayPeriod.checkInDate < checkOutDate) && (r.stayPeriod.checkOutDate > checkInDate);
      return isOverlapping;
    });
  }

  async saveReservation(reservation: Reservation): Promise<Reservation> {
    this.reservations.set(reservation.reservationId, reservation);
    return reservation;
  }

  async updateReservation(
    organizationId: string,
    propertyId: string,
    reservationId: string,
    updates: Partial<Reservation>
  ): Promise<Reservation | null> {
    const existing = await this.findReservationById(organizationId, propertyId, reservationId);
    if (!existing) return null;

    const updated: Reservation = {
      ...existing,
      ...updates,
      organizationId, // Imutável
      propertyId,     // Imutável
      reservationId,  // Imutável
      updatedAt: new Date().toISOString()
    };

    this.reservations.set(reservationId, updated);
    return updated;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Execução sequencial simples em memória, pronta para ser englobada em runTransaction no Firestore
    return await work();
  }
}

export const reservationRepository = new InMemoryReservationRepository();
