import { CreateReservationDTO, ReservationSource } from '../pms/reservationTypes.ts';
import { RoomStatus } from '../pms/pmsTypes.ts';
import { AlohaReservationPayload, AlohaUnitStatusPayload } from './integrationTypes.ts';

export interface UpdateUnitStatusDTO {
  status: RoomStatus;
  notes?: string;
}

export class EventNormalizer {
  /**
   * Mapeia string de canal de origem do Aloha/OTA para ReservationSource do Synapse PMS
   */
  static normalizeSourceChannel(source?: string): ReservationSource {
    if (!source) return 'ota_generic';
    const lower = source.toLowerCase().trim();

    if (lower.includes('booking') || lower.includes('airbnb') || lower.includes('expedia') || lower.includes('decolar') || lower.includes('hostelworld') || lower.includes('aloha')) {
      return 'ota_generic';
    }
    if (lower.includes('site') || lower.includes('website') || lower.includes('direto')) return 'direct_website';
    if (lower.includes('phone') || lower.includes('telefone')) return 'phone';
    if (lower.includes('whats') || lower.includes('whatsapp')) return 'whatsapp';
    if (lower.includes('walkin') || lower.includes('balcao')) return 'front_desk';

    return 'ota_generic';
  }

  /**
   * Normaliza payload de reserva vindo do Aloha (via n8n) para CreateReservationDTO
   */
  static toCreateReservationDTO(
    payload: AlohaReservationPayload,
    resolvedUnitId: string
  ): CreateReservationDTO {
    const checkInDate = payload.checkIn ? payload.checkIn.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const checkOutDate = payload.checkOut ? payload.checkOut.substring(0, 10) : new Date().toISOString().substring(0, 10);

    return {
      unitId: resolvedUnitId,
      guest: {
        fullName: payload.guestName || 'Hóspede Aloha',
        email: payload.guestEmail || `${(payload.guestName || 'hospede').toLowerCase().replace(/\s+/g, '.')}@aloha-alohapms.com`,
        phone: payload.guestPhone || '',
        documentId: payload.documentId || ''
      },
      checkInDate,
      checkOutDate,
      adultsCount: payload.adultsCount && payload.adultsCount > 0 ? payload.adultsCount : 1,
      childrenCount: payload.childrenCount || 0,
      notes: payload.notes || `Sincronizado via Aloha/n8n ID: ${payload.alohaReservationId}`,
      source: EventNormalizer.normalizeSourceChannel(payload.sourceChannel)
    };
  }

  /**
   * Normaliza payload de status de UH vindo do Aloha para UpdateUnitStatusDTO
   */
  static toUpdateUnitStatusDTO(payload: AlohaUnitStatusPayload): UpdateUnitStatusDTO {
    const statusMap: Record<string, RoomStatus> = {
      clean: 'clean',
      dirty: 'dirty',
      inspected: 'inspected',
      maintenance: 'maintenance',
      out_of_service: 'out_of_service'
    };

    const status = statusMap[payload.newStatus] || 'dirty';

    return {
      status,
      notes: payload.notes || `Status atualizado via n8n (Aloha PMS) em ${new Date().toISOString()}`
    };
  }
}
