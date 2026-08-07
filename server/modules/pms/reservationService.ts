import { 
  IReservationRepository, 
  reservationRepository 
} from './reservationRepository.ts';
import { 
  IRoomRepository, 
  roomRepository 
} from './roomRepository.ts';
import { 
  Reservation, 
  CreateReservationDTO, 
  ReservationFilterDTO, 
  ReservationStatus 
} from './reservationTypes.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { contextService } from '../ai/contextService.ts';

export class ReservationService {
  private reservationRepo: IReservationRepository;
  private roomRepo: IRoomRepository;

  constructor(
    reservationRepo: IReservationRepository = reservationRepository,
    roomRepo: IRoomRepository = roomRepository
  ) {
    this.reservationRepo = reservationRepo;
    this.roomRepo = roomRepo;
  }

  /**
   * Helper para calcular diferença em dias entre duas datas YYYY-MM-DD
   */
  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Formato de data inválido. Utilize o formato YYYY-MM-DD.");
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      throw new Error("A data de Check-out deve ser posterior à data de Check-in (mínimo 1 diária).");
    }

    return diffDays;
  }

  /**
   * 1. Criar Reserva (Motor de Reservas)
   */
  async createReservation(
    organizationId: string, 
    propertyId: string, 
    dto: CreateReservationDTO
  ): Promise<Reservation> {
    return this.reservationRepo.runInTransaction(async () => {
      // Validar DTO e parâmetros básicos
      if (!dto.unitId) {
        throw new Error("O identificador da Unidade Hoteleira (unitId) é obrigatório.");
      }

      if (!dto.guest || !dto.guest.fullName || dto.guest.fullName.trim().length < 2) {
        throw new Error("O nome completo do hóspede é obrigatório.");
      }

      if (!dto.guest.email || !dto.guest.email.includes('@')) {
        throw new Error("Um e-mail válido para o hóspede é obrigatório.");
      }

      const numberOfNights = this.calculateNights(dto.checkInDate, dto.checkOutDate);
      const adultsCount = dto.adultsCount || 1;
      const childrenCount = dto.childrenCount || 0;

      if (adultsCount < 1) {
        throw new Error("A reserva deve conter ao menos 1 adulto.");
      }

      // Validar UH no repositório
      const unit = await this.roomRepo.findUnitById(organizationId, propertyId, dto.unitId);
      if (!unit) {
        throw new Error(`Unidade Hoteleira (unitId: '${dto.unitId}') não foi encontrada nesta propriedade.`);
      }

      if (!unit.active) {
        throw new Error(`A Unidade Hoteleira '${unit.unitNumber}' está inativa no sistema e não pode receber reservas.`);
      }

      // Bloqueio de reservas para quartos em manutenção ou fora de serviço
      if (unit.status === 'maintenance' || unit.status === 'out_of_service') {
        const statusLabel = unit.status === 'maintenance' ? 'Manutenção' : 'Fora de Serviço';
        throw new Error(`A Unidade Hoteleira '${unit.unitNumber}' está indisponível para reservas no momento (Status: ${statusLabel}).`);
      }

      // Validar Categoria da UH
      const category = await this.roomRepo.findCategoryById(organizationId, propertyId, unit.categoryId);
      if (!category || !category.active) {
        throw new Error("A categoria de acomodação associada a esta UH está inativa ou indisponível.");
      }

      // Validar Capacidade Máxima
      if (adultsCount > category.capacity.maxAdults) {
        throw new Error(`A quantidade de adultos (${adultsCount}) excede o limite máximo permitido para esta categoria (${category.capacity.maxAdults}).`);
      }

      const totalGuests = adultsCount + childrenCount;
      if (totalGuests > category.capacity.totalCapacity) {
        throw new Error(`A quantidade total de hóspedes (${totalGuests}) excede a capacidade da acomodação (${category.capacity.totalCapacity}).`);
      }

      // Prevenção de Overbooking & Checagem de Conflito de Datas
      const conflicts = await this.reservationRepo.findConflictingReservations(
        organizationId,
        propertyId,
        dto.unitId,
        dto.checkInDate,
        dto.checkOutDate
      );

      if (conflicts.length > 0) {
        const conflictRes = conflicts[0];
        throw new Error(`Conflito de datas (Overbooking impedido): A UH '${unit.unitNumber}' já possui uma reserva ativa (${conflictRes.reservationId}) no período de ${conflictRes.stayPeriod.checkInDate} a ${conflictRes.stayPeriod.checkOutDate}.`);
      }

      // Cálculo financeiro base (diária x noites)
      const totalAmount = Number((category.basePrice * numberOfNights).toFixed(2));

      // Construção da Entidade Reserva
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const guestId = dto.guest.guestId || `gst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newReservation: Reservation = {
        reservationId,
        organizationId,
        propertyId,
        unitId: dto.unitId,
        categoryId: unit.categoryId,
        guest: {
          guestId,
          fullName: dto.guest.fullName.trim(),
          email: dto.guest.email.trim().toLowerCase(),
          phone: dto.guest.phone,
          documentId: dto.guest.documentId,
          documentType: dto.guest.documentType || 'cpf'
        },
        stayPeriod: {
          checkInDate: dto.checkInDate,
          checkOutDate: dto.checkOutDate,
          numberOfNights
        },
        adultsCount,
        childrenCount,
        status: 'confirmed',
        source: dto.source || 'front_desk',
        paymentStatus: 'pending',
        totalAmount,
        notes: dto.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = await this.reservationRepo.saveReservation(newReservation);
      contextService.invalidateCache(organizationId, propertyId);
      return created;
    });
  }

  /**
   * 2. Listar Reservas com Filtros
   */
  async listReservations(
    organizationId: string, 
    propertyId: string, 
    filter?: ReservationFilterDTO
  ): Promise<Reservation[]> {
    return await this.reservationRepo.findReservations(organizationId, propertyId, filter);
  }

  /**
   * 3. Buscar Reserva por ID
   */
  async getReservationById(
    organizationId: string, 
    propertyId: string, 
    reservationId: string
  ): Promise<Reservation> {
    const reservation = await this.reservationRepo.findReservationById(organizationId, propertyId, reservationId);
    if (!reservation) {
      throw new Error(`Reserva com ID '${reservationId}' não foi encontrada.`);
    }
    return reservation;
  }

  /**
   * 4. Transição de Estado: Check-in (Sem Operação Financeira)
   */
  async checkIn(
    organizationId: string, 
    propertyId: string, 
    reservationId: string
  ): Promise<Reservation> {
    return this.reservationRepo.runInTransaction(async () => {
      const reservation = await this.getReservationById(organizationId, propertyId, reservationId);

      if (reservation.status !== 'confirmed') {
        throw new Error(`Não é possível realizar Check-in em uma reserva com status '${reservation.status}'. O status deve ser 'confirmed'.`);
      }

      // Atualizar status da reserva para 'checked_in'
      const updated = await this.reservationRepo.updateReservation(organizationId, propertyId, reservationId, {
        status: 'checked_in'
      });

      if (!updated) {
        throw new Error("Erro ao atualizar status da reserva durante o Check-in.");
      }

      contextService.invalidateCache(organizationId, propertyId);
      return updated;
    });
  }

  /**
   * 5. Transição de Estado: Check-out (Sem Operação Financeira - Altera UH para 'dirty')
   */
  async checkOut(
    organizationId: string, 
    propertyId: string, 
    reservationId: string
  ): Promise<Reservation> {
    return this.reservationRepo.runInTransaction(async () => {
      const reservation = await this.getReservationById(organizationId, propertyId, reservationId);

      if (reservation.status !== 'checked_in') {
        throw new Error(`Não é possível realizar Check-out em uma reserva com status '${reservation.status}'. O hóspede deve estar em 'checked_in'.`);
      }

      // Atualizar status da reserva para 'checked_out'
      const updated = await this.reservationRepo.updateReservation(organizationId, propertyId, reservationId, {
        status: 'checked_out'
      });

      if (!updated) {
        throw new Error("Erro ao atualizar status da reserva durante o Check-out.");
      }

      // Atualizar automaticamente a UH vinculada para 'dirty' e gerar tarefa de governança
      await this.roomRepo.updateUnitStatus(organizationId, propertyId, reservation.unitId, 'dirty');
      
      const unit = await this.roomRepo.findUnitById(organizationId, propertyId, reservation.unitId);
      await housekeepingService.createTaskForCheckout(
        organizationId,
        propertyId,
        reservation.unitId,
        unit?.unitNumber || 'N/A',
        reservationId,
        reservation.guest?.guestId,
        'high'
      ).catch(err => console.warn('Erro ao gerar tarefa de governança no check-out:', err));

      contextService.invalidateCache(organizationId, propertyId);
      return updated;
    });
  }

  /**
   * 6. Cancelar Reserva
   */
  async cancelReservation(
    organizationId: string, 
    propertyId: string, 
    reservationId: string,
    reason?: string
  ): Promise<Reservation> {
    return this.reservationRepo.runInTransaction(async () => {
      const reservation = await this.getReservationById(organizationId, propertyId, reservationId);

      if (reservation.status === 'checked_out' || reservation.status === 'cancelled') {
        throw new Error(`A reserva já está em estado final '${reservation.status}' e não pode ser cancelada.`);
      }

      const notes = reason 
        ? `${reservation.notes || ''} [Cancelamento: ${reason}]`.trim()
        : reservation.notes;

      const updated = await this.reservationRepo.updateReservation(organizationId, propertyId, reservationId, {
        status: 'cancelled',
        notes
      });

      if (!updated) {
        throw new Error("Erro ao cancelar a reserva.");
      }

      contextService.invalidateCache(organizationId, propertyId);
      return updated;
    });
  }

  /**
   * 7. Registrar No-Show
   */
  async markNoShow(
    organizationId: string, 
    propertyId: string, 
    reservationId: string
  ): Promise<Reservation> {
    return this.reservationRepo.runInTransaction(async () => {
      const reservation = await this.getReservationById(organizationId, propertyId, reservationId);

      if (reservation.status !== 'confirmed') {
        throw new Error(`Marcação de No-Show permitida apenas para reservas no status 'confirmed'. Status atual: '${reservation.status}'.`);
      }

      const updated = await this.reservationRepo.updateReservation(organizationId, propertyId, reservationId, {
        status: 'no_show'
      });

      if (!updated) {
        throw new Error("Erro ao registrar No-Show na reserva.");
      }

      contextService.invalidateCache(organizationId, propertyId);
      return updated;
    });
  }
}

export const reservationService = new ReservationService();
