import { GuestIntelligence, GuestSummary, RecurrenceLevel } from './intelligenceTypes.ts';
import { guestRepository } from './guestRepository.ts';
import { timelineRepository } from './timelineRepository.ts';

export class GuestIntelligenceService {
  /**
   * Calcula a inteligência completa do hóspede com base no perfil cadastral e timeline 360°
   */
  async calculateGuestIntelligence(guestId: string): Promise<GuestIntelligence> {
    const guest = await guestRepository.findById(guestId);
    if (!guest) {
      throw new Error(`Hóspede [${guestId}] não encontrado para cálculo de inteligência.`);
    }

    const events = await timelineRepository.findByGuestId(guestId);

    // 1. Métricas de Estadias e Receita
    const totalStays = guest.totalStaysCount || 0;
    const totalRevenueGenerated = guest.totalSpentAmount || 0;
    const averageSpendPerStay = totalStays > 0 ? Math.round(totalRevenueGenerated / totalStays) : 0;

    // 2. Dias desde a última estadia
    let daysSinceLastStay: number | null = null;
    if (guest.lastStayDate) {
      const lastDate = new Date(guest.lastStayDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      daysSinceLastStay = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // 3. Nível de Recorrência
    let recurrenceLevel: RecurrenceLevel = 'new';
    if (totalStays >= 6) {
      recurrenceLevel = 'champion';
    } else if (totalStays >= 3) {
      recurrenceLevel = 'frequent';
    } else if (totalStays >= 1) {
      recurrenceLevel = 'occasional';
    }

    // 4. Score de Engajamento (0 a 100)
    let engagementScore = 0;
    // Componente Estadias (até 40 pts)
    engagementScore += Math.min(totalStays * 10, 40);
    // Componente Receita (até 30 pts)
    engagementScore += Math.min(Math.floor(totalRevenueGenerated / 500) * 5, 30);
    // Componente Recência (até 15 pts)
    if (daysSinceLastStay !== null) {
      if (daysSinceLastStay <= 30) engagementScore += 15;
      else if (daysSinceLastStay <= 90) engagementScore += 10;
      else if (daysSinceLastStay <= 180) engagementScore += 5;
    }
    // Componente Cadastro & Preferências (até 15 pts)
    const prefCount = (guest.preferences?.dietaryRestrictions?.length || 0) +
      (guest.preferences?.pillowType ? 1 : 0) +
      (guest.preferences?.floorPreference ? 1 : 0) +
      (guest.preferences?.quietRoomRequested ? 1 : 0) +
      (guest.tags?.length || 0);
    engagementScore += Math.min(prefCount * 3, 15);
    // Teto de 100
    engagementScore = Math.min(Math.max(engagementScore, 0), 100);

    // 5. Padrões de permanência (Duração média de estadia)
    let totalNights = 0;
    let staysRecordedInTimeline = 0;
    let preferredBookingChannel = 'Direto';
    let preferredRoomCategory = 'Suíte Padrão';

    const checkoutEvents = events.filter(e => e.eventType === 'reservation.checkout');
    checkoutEvents.forEach(evt => {
      if (evt.metadata?.numberOfNights && typeof evt.metadata.numberOfNights === 'number') {
        totalNights += evt.metadata.numberOfNights;
        staysRecordedInTimeline++;
      }
      if (evt.metadata?.bookingChannel && typeof evt.metadata.bookingChannel === 'string') {
        preferredBookingChannel = evt.metadata.bookingChannel;
      }
      if (evt.unitNumber) {
        preferredRoomCategory = `UH ${evt.unitNumber}`;
      }
    });

    const averageStayDays = staysRecordedInTimeline > 0 
      ? Math.max(1, Math.round(totalNights / staysRecordedInTimeline)) 
      : (totalStays > 0 ? 3 : 0);

    // 6. Preferências Predominantes
    const topPreferences: string[] = [];
    if (guest.preferences?.dietaryRestrictions && guest.preferences.dietaryRestrictions.length > 0) {
      topPreferences.push(`Alimentação: ${guest.preferences.dietaryRestrictions.join(', ')}`);
    }
    if (guest.preferences?.pillowType) {
      topPreferences.push(`Travesseiro: ${guest.preferences.pillowType}`);
    }
    if (guest.preferences?.floorPreference) {
      topPreferences.push(`Andar: ${guest.preferences.floorPreference === 'high' ? 'Alto' : guest.preferences.floorPreference === 'low' ? 'Baixo' : guest.preferences.floorPreference}`);
    }
    if (guest.preferences?.quietRoomRequested) {
      topPreferences.push('Exige Quarto Silencioso');
    }

    // 7. Insights & Alertas Operacionais
    const operationalAlerts: string[] = [];
    if (guest.classification === 'vip') {
      operationalAlerts.push('Hóspede VIP com elevado volume de receita acumulada.');
    }
    if (guest.preferences?.dietaryRestrictions && guest.preferences.dietaryRestrictions.length > 0) {
      operationalAlerts.push(`Possui restrições alimentares: ${guest.preferences.dietaryRestrictions.join(', ')}.`);
    }
    if (guest.preferences?.quietRoomRequested) {
      operationalAlerts.push('Sempre solicita quarto silencioso (distante de elevadores/escadas).');
    }
    if (guest.preferences?.pillowType) {
      operationalAlerts.push(`Hóspede costuma solicitar travesseiro extra (${guest.preferences.pillowType}).`);
    }
    if (daysSinceLastStay !== null && daysSinceLastStay > 180) {
      operationalAlerts.push(`Hóspede está retornando após longo período ausente (${daysSinceLastStay} dias).`);
    }
    if (averageStayDays >= 5) {
      operationalAlerts.push(`Normalmente permanece estadias longas (~${averageStayDays} noites).`);
    }
    if (guest.tags?.includes('corporativo')) {
      operationalAlerts.push('Cliente corporativo recorrente com demandas de check-in ágil.');
    }

    // 8. Sugestões Proativas para o Concierge
    const conciergeSuggestions: string[] = [];
    if (guest.preferences?.dietaryRestrictions?.some(d => d.toLowerCase().includes('lactose'))) {
      conciergeSuggestions.push('Disponibilizar opções sem lactose no café da manhã e welcome drink.');
    }
    if (guest.preferences?.quietRoomRequested) {
      conciergeSuggestions.push('Priorizar alocação em bloco silencioso nos andares superiores.');
    }
    if (guest.classification === 'vip' || recurrenceLevel === 'champion') {
      conciergeSuggestions.push('Oferecer cartão de boas-vindas assinado pela gerência e cortesia na chegada.');
    }
    if (conciergeSuggestions.length === 0) {
      conciergeSuggestions.push('Apresentar os passeios locais e recomendação de restaurantes parceiros.');
    }

    // 9. Síntese do Perfil
    const profileSummary = `${guest.fullName} é um hóspede de nível ${guest.classification.toUpperCase()} (${recurrenceLevel.toUpperCase()}) com ${totalStays} estadias registradas e receita total de R$ ${totalRevenueGenerated}. Score de engajamento: ${engagementScore}/100.`;

    return {
      guestId: guest.guestId,
      fullName: guest.fullName,
      organizationId: guest.organizationId,
      profileSummary,
      engagementScore,
      recurrenceLevel,
      totalStays,
      daysSinceLastStay,
      averageSpendPerStay,
      totalRevenueGenerated,
      averageStayDays,
      preferredBookingChannel,
      preferredRoomCategory,
      preferredLanguage: 'Português (BR)',
      topPreferences,
      operationalAlerts,
      conciergeSuggestions,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Retorna um resumo enxuto da inteligência do hóspede
   */
  async getGuestSummary(guestId: string): Promise<GuestSummary> {
    const intelligence = await this.calculateGuestIntelligence(guestId);
    return {
      guestId: intelligence.guestId,
      fullName: intelligence.fullName,
      classification: intelligence.profileSummary.includes('VIP') ? 'vip' : 'standard',
      engagementScore: intelligence.engagementScore,
      recurrenceLevel: intelligence.recurrenceLevel,
      profileSummary: intelligence.profileSummary,
      topPreferences: intelligence.topPreferences,
      operationalAlerts: intelligence.operationalAlerts
    };
  }
}

export const guestIntelligenceService = new GuestIntelligenceService();
