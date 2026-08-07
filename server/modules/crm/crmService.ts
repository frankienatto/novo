import { 
  GuestProfile, 
  CreateGuestDTO, 
  UpdateGuestDTO, 
  GuestQueryFilters, 
  GuestStayRecord, 
  GuestMetricsSummary, 
  GuestClassification 
} from './guestTypes.ts';
import { guestRepository } from './guestRepository.ts';
import { timelineService } from './timelineService.ts';
import { contextService } from '../ai/contextService.ts';

export class CrmService {
  /**
   * Cria um perfil de hóspede vinculado à Organização
   */
  async createGuest(organizationId: string, dto: CreateGuestDTO): Promise<GuestProfile> {
    const primaryDoc = dto.documents && dto.documents.length > 0 ? dto.documents[0].number : undefined;

    // Verificar se hóspede já existe na Organização
    const existing = await guestRepository.findByEmailOrDocument(organizationId, dto.email, primaryDoc);
    if (existing) {
      // Se existir, atualiza dados sem duplicar
      return this.updateGuest(existing.guestId, dto);
    }

    const now = new Date().toISOString();
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newGuest: GuestProfile = {
      guestId,
      organizationId,
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      secondaryPhone: dto.secondaryPhone,
      primaryLanguage: dto.primaryLanguage || 'pt-BR',
      nationality: dto.nationality || 'Brasileira',
      classification: dto.classification || 'standard',
      tags: dto.tags || [],
      documents: dto.documents || [],
      preferences: dto.preferences || {},
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: now,
      updatedAt: now
    };

    const savedGuest = await guestRepository.save(newGuest);

    // Event-Driven Timeline: Registrar criação de cadastro
    await timelineService.appendTimelineEvent(guestId, {
      organizationId,
      source: 'crm',
      eventType: 'preference.updated',
      title: 'Perfil de Hóspede Cadastrado',
      description: `Cadastro inicial criado para ${savedGuest.fullName} (${savedGuest.email}).`,
      metadata: { classification: savedGuest.classification, tags: savedGuest.tags }
    });

    contextService.invalidateCache(organizationId);
    return savedGuest;
  }

  /**
   * Atualiza dados cadastrais ou preferências de um hóspede
   */
  async updateGuest(guestId: string, dto: UpdateGuestDTO): Promise<GuestProfile> {
    const guest = await guestRepository.findById(guestId);
    if (!guest) {
      throw new Error(`Hóspede com ID [${guestId}] não encontrado.`);
    }

    const now = new Date().toISOString();

    const updated: GuestProfile = {
      ...guest,
      fullName: dto.fullName !== undefined ? dto.fullName.trim() : guest.fullName,
      email: dto.email !== undefined ? dto.email.trim().toLowerCase() : guest.email,
      phone: dto.phone !== undefined ? dto.phone.trim() : guest.phone,
      secondaryPhone: dto.secondaryPhone !== undefined ? dto.secondaryPhone : guest.secondaryPhone,
      primaryLanguage: dto.primaryLanguage !== undefined ? dto.primaryLanguage : guest.primaryLanguage,
      nationality: dto.nationality !== undefined ? dto.nationality : guest.nationality,
      classification: dto.classification !== undefined ? dto.classification : guest.classification,
      tags: dto.tags !== undefined ? Array.from(new Set([...guest.tags, ...dto.tags])) : guest.tags,
      documents: dto.documents !== undefined ? dto.documents : guest.documents,
      preferences: dto.preferences !== undefined ? { ...guest.preferences, ...dto.preferences } : guest.preferences,
      updatedAt: now
    };

    const saved = await guestRepository.save(updated);

    // Event-Driven Timeline: Registrar atualização de preferências/perfil
    await timelineService.appendTimelineEvent(guestId, {
      organizationId: saved.organizationId,
      source: 'crm',
      eventType: 'preference.updated',
      title: 'Perfil/Preferências Atualizadas',
      description: `Informações cadastrais ou preferências do hóspede foram atualizadas.`,
      metadata: { preferences: saved.preferences, tags: saved.tags }
    });

    contextService.invalidateCache(saved.organizationId);
    return saved;
  }

  /**
   * Registra uma nova estadia no histórico do hóspede e recalcula a classificação
   */
  async recordStay(
    guestId: string, 
    stayData: Omit<GuestStayRecord, 'stayId' | 'createdAt'>
  ): Promise<GuestProfile> {
    const guest = await guestRepository.findById(guestId);
    if (!guest) {
      throw new Error(`Hóspede com ID [${guestId}] não encontrado.`);
    }

    const stayId = `stay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stay: GuestStayRecord = {
      ...stayData,
      stayId,
      createdAt: new Date().toISOString()
    };

    const updatedGuest = await guestRepository.addStay(guestId, stay);
    if (!updatedGuest) {
      throw new Error(`Erro ao registrar estadia no perfil do hóspede [${guestId}].`);
    }

    // Event-Driven Timeline: Registrar evento de estadia concluída
    await timelineService.appendTimelineEvent(guestId, {
      organizationId: updatedGuest.organizationId,
      propertyId: stay.propertyId,
      source: 'pms',
      eventType: 'reservation.checkout',
      title: `Estadia Concluída - UH ${stay.unitNumber || 'N/A'}`,
      description: `Estadia realizada no período ${stay.checkInDate} a ${stay.checkOutDate}. Valor acumulado: R$ ${stay.totalSpentAmount}`,
      reservationId: stay.reservationId,
      unitNumber: stay.unitNumber,
      metadata: { bookingChannel: stay.bookingChannel, rating: stay.guestRating }
    });

    // Recalcular classificação dinâmica (ex: frequent se >= 3 estadias, vip se >= 10 ou receita relevante)
    let newClassification: GuestClassification = updatedGuest.classification;

    if (updatedGuest.classification !== 'blacklisted' && updatedGuest.classification !== 'corporate') {
      if (updatedGuest.totalStaysCount >= 10 || updatedGuest.totalSpentAmount >= 15000) {
        newClassification = 'vip';
      } else if (updatedGuest.totalStaysCount >= 3) {
        newClassification = 'frequent';
      }
    }

    if (newClassification !== updatedGuest.classification) {
      const oldClass = updatedGuest.classification;
      updatedGuest.classification = newClassification;
      await guestRepository.save(updatedGuest);

      // Event-Driven Timeline: Registrar alteração de classificação
      await timelineService.appendTimelineEvent(guestId, {
        organizationId: updatedGuest.organizationId,
        source: 'system',
        eventType: 'classification.changed',
        title: `Classificação Atualizada para ${newClassification.toUpperCase()}`,
        description: `O hóspede foi promovido de '${oldClass}' para '${newClassification}' com base em ${updatedGuest.totalStaysCount} estadias e R$ ${updatedGuest.totalSpentAmount} em receita acumulada.`,
        metadata: { oldClassification: oldClass, newClassification }
      });
    }

    contextService.invalidateCache(updatedGuest.organizationId, stay.propertyId);
    return updatedGuest;
  }

  /**
   * Busca perfil por ID
   */
  async getGuestById(guestId: string): Promise<GuestProfile | null> {
    return guestRepository.findById(guestId);
  }

  /**
   * Lista hóspedes da Organização com suporte a busca e filtros
   */
  async listGuests(organizationId: string, filters?: GuestQueryFilters): Promise<GuestProfile[]> {
    return guestRepository.listByOrganization(organizationId, filters);
  }

  /**
   * Métricas do CRM em nível de Organização
   */
  async getMetrics(organizationId: string): Promise<GuestMetricsSummary> {
    const guests = await guestRepository.listByOrganization(organizationId);

    const vipCount = guests.filter(g => g.classification === 'vip').length;
    const frequentCount = guests.filter(g => g.classification === 'frequent').length;
    const totalStays = guests.reduce((sum, g) => sum + g.totalStaysCount, 0);
    const totalRevenue = guests.reduce((sum, g) => sum + g.totalSpentAmount, 0);

    return {
      organizationId,
      totalGuests: guests.length,
      vipGuestsCount: vipCount,
      frequentGuestsCount: frequentCount,
      totalStaysRecorded: totalStays,
      totalRevenueGenerated: totalRevenue
    };
  }
}

export const crmService = new CrmService();

