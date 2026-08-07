import { AlohaReservationPayload, AlohaUnitStatusPayload } from './integrationTypes.ts';

export class AlohaIntegrationService {
  /**
   * Valida se a estrutura mínima de payload de reserva do Aloha é válida.
   */
  validateReservationPayload(payload: any): { valid: boolean; error?: string } {
    if (!payload) {
      return { valid: false, error: 'Payload de reserva do Aloha é obrigatório.' };
    }
    if (!payload.alohaReservationId) {
      return { valid: false, error: 'Campo [alohaReservationId] é obrigatório no payload do Aloha.' };
    }
    if (!payload.guestName) {
      return { valid: false, error: 'Campo [guestName] é obrigatório no payload do Aloha.' };
    }
    if (!payload.checkIn || !payload.checkOut) {
      return { valid: false, error: 'Campos [checkIn] e [checkOut] são obrigatórios (YYYY-MM-DD).' };
    }
    return { valid: true };
  }

  /**
   * Sanitiza e formata o payload bruto de reserva do Aloha.
   */
  sanitizeReservationPayload(raw: any): AlohaReservationPayload {
    return {
      alohaReservationId: String(raw.alohaReservationId || raw.id || raw.bookingId || '').trim(),
      guestName: String(raw.guestName || raw.customerName || 'Hóspede Sem Nome').trim(),
      guestEmail: String(raw.guestEmail || raw.email || '').trim(),
      guestPhone: String(raw.guestPhone || raw.phone || '').trim(),
      documentId: String(raw.documentId || raw.cpf || raw.rg || '').trim(),
      unitNumber: raw.unitNumber ? String(raw.unitNumber).trim() : undefined,
      unitId: raw.unitId ? String(raw.unitId).trim() : undefined,
      checkIn: String(raw.checkIn || raw.checkInDate || '').trim(),
      checkOut: String(raw.checkOut || raw.checkOutDate || '').trim(),
      totalAmount: typeof raw.totalAmount === 'number' ? raw.totalAmount : parseFloat(raw.totalAmount || '0') || 0,
      adultsCount: parseInt(raw.adultsCount || raw.adults || '1', 10),
      childrenCount: parseInt(raw.childrenCount || raw.children || '0', 10),
      sourceChannel: String(raw.sourceChannel || raw.channel || raw.source || 'Aloha').trim(),
      status: raw.status ? String(raw.status).toLowerCase() as any : 'confirmed',
      notes: raw.notes ? String(raw.notes).trim() : undefined
    };
  }

  /**
   * Sanitiza e formata o payload bruto de status de UH do Aloha.
   */
  sanitizeUnitStatusPayload(raw: any): AlohaUnitStatusPayload {
    return {
      unitNumber: raw.unitNumber ? String(raw.unitNumber).trim() : undefined,
      unitId: raw.unitId ? String(raw.unitId).trim() : undefined,
      newStatus: String(raw.newStatus || raw.status || 'dirty').toLowerCase() as any,
      notes: raw.notes ? String(raw.notes).trim() : undefined
    };
  }
}

export const alohaIntegrationService = new AlohaIntegrationService();
