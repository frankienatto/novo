import { 
  GuestTimelineEvent, 
  AppendTimelineEventDTO, 
  Guest360Profile, 
  GuestTimelineSummary 
} from './timelineTypes.ts';
import { timelineRepository } from './timelineRepository.ts';
import { guestRepository } from './guestRepository.ts';

export class TimelineService {
  /**
   * Método único Event-Driven para publicar um evento na Timeline do Hóspede
   */
  async appendTimelineEvent(guestId: string, dto: AppendTimelineEventDTO): Promise<GuestTimelineEvent> {
    const eventId = `evt_tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const event: GuestTimelineEvent = {
      eventId,
      guestId,
      organizationId: dto.organizationId,
      propertyId: dto.propertyId,
      source: dto.source,
      eventType: dto.eventType,
      title: dto.title,
      description: dto.description,
      reservationId: dto.reservationId,
      unitId: dto.unitId,
      unitNumber: dto.unitNumber,
      metadata: dto.metadata || {},
      createdAt: new Date().toISOString()
    };

    return timelineRepository.append(event);
  }

  /**
   * Consulta os eventos da Timeline de um Hóspede
   */
  async getTimeline(guestId: string, limit?: number): Promise<GuestTimelineEvent[]> {
    return timelineRepository.findByGuestId(guestId, limit);
  }

  /**
   * Retorna o Perfil 360° Completo do Hóspede (Dados Cadastrais + Timeline)
   */
  async getGuest360Profile(guestId: string): Promise<Guest360Profile> {
    const guest = await guestRepository.findById(guestId);
    if (!guest) {
      throw new Error(`Hóspede com ID [${guestId}] não encontrado para visualização 360°.`);
    }

    const timeline = await timelineRepository.findByGuestId(guestId);
    const totalCount = await timelineRepository.countByGuestId(guestId);

    return {
      guest,
      timeline,
      timelineTotalCount: totalCount
    };
  }

  /**
   * Resumo enxuto da Timeline para o ContextService dos Agentes de IA
   * (Apenas últimos 5 eventos, classificação, preferências principais e alertas)
   */
  async getTimelineSummaryForAI(guestId: string): Promise<GuestTimelineSummary | null> {
    const guest = await guestRepository.findById(guestId);
    if (!guest) return null;

    const recentEvents = await timelineRepository.findByGuestId(guestId, 5);

    // Extrair preferências principais
    const mainPreferences: string[] = [];
    if (guest.preferences.dietaryRestrictions && guest.preferences.dietaryRestrictions.length > 0) {
      mainPreferences.push(`Restrições Alimentares: ${guest.preferences.dietaryRestrictions.join(', ')}`);
    }
    if (guest.preferences.pillowType) {
      mainPreferences.push(`Travesseiro: ${guest.preferences.pillowType}`);
    }
    if (guest.preferences.floorPreference) {
      mainPreferences.push(`Andar Preferencial: ${guest.preferences.floorPreference}`);
    }
    if (guest.preferences.quietRoomRequested) {
      mainPreferences.push(`Quarto Silencioso Solicitado`);
    }

    // Extrair alertas importantes
    const alerts: string[] = [];
    if (guest.classification === 'vip') {
      alerts.push('HÓSPEDE VIP - Atendimento prioritário e cortesia especial.');
    } else if (guest.classification === 'blacklisted') {
      alerts.push('ALERTA: Hóspede na Lista Negra (Restrição de Reserva).');
    }
    if (guest.preferences.specialNeeds) {
      alerts.push(`Necessidades Especiais: ${guest.preferences.specialNeeds}`);
    }

    return {
      guestId,
      fullName: guest.fullName,
      classification: guest.classification,
      totalStaysCount: guest.totalStaysCount,
      lastStayDate: guest.lastStayDate,
      mainPreferences,
      recentEvents,
      alerts
    };
  }
}

export const timelineService = new TimelineService();
