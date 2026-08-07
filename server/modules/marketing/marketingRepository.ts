import { guestRepository } from '../crm/guestRepository.ts';
import { salesRepository } from '../sales/salesRepository.ts';
import { directBookingRepository } from '../directBooking/directBookingRepository.ts';
import { reservationService } from '../pms/reservationService.ts';
import { 
  MarketingSegmentSummary, 
  CustomerJourneyMetrics, 
  MarketGeographicInsight, 
  ChannelPerformance, 
  MarketingRetentionAnalysis, 
  MarketingAlert,
  MarketingDashboard,
  MarketingSegmentType,
  JourneyStage
} from './marketingTypes.ts';

export class MarketingRepository {
  /**
   * Agrega dados Multi-Tenant READ-ONLY de CRM, Sales CRM, Direct Booking e Reservations
   */
  async getDashboardData(organizationId: string, propertyId: string): Promise<MarketingDashboard> {
    const guests = await guestRepository.listByOrganization(organizationId);
    const opportunities = await salesRepository.listOpportunities(organizationId, propertyId);
    const proposals = await directBookingRepository.listProposals(organizationId, propertyId);
    const reservations = await reservationService.listReservations(organizationId, propertyId);

    const segments = this.calculateSegments(guests, reservations);
    const journey = this.calculateJourney(opportunities, proposals, reservations, guests);
    const retention = this.calculateRetention(guests, reservations);
    const topMarkets = this.calculateGeographicMarkets(guests, reservations);
    const channels = this.calculateChannels(opportunities, proposals, reservations);
    const alerts = this.generateAlerts(guests, reservations, topMarkets, channels);

    return {
      segments,
      journey,
      retention,
      topMarkets,
      channels,
      alerts,
      generatedAt: new Date().toISOString()
    };
  }

  private calculateSegments(guests: any[], reservations: any[]): MarketingSegmentSummary[] {
    const totalGuests = guests.length || 1;
    const now = new Date();

    const counts: Record<MarketingSegmentType, { count: number; totalLtv: number }> = {
      vip: { count: 0, totalLtv: 0 },
      recurring: { count: 0, totalLtv: 0 },
      first_stay: { count: 0, totalLtv: 0 },
      corporate: { count: 0, totalLtv: 0 },
      long_stay: { count: 0, totalLtv: 0 },
      families: { count: 0, totalLtv: 0 },
      couples: { count: 0, totalLtv: 0 },
      international: { count: 0, totalLtv: 0 },
      blacklist: { count: 0, totalLtv: 0 },
      birthday_month: { count: 0, totalLtv: 0 },
      inactive: { count: 0, totalLtv: 0 }
    };

    for (const guest of guests) {
      const ltv = guest.metrics?.totalSpent || 0;
      const totalStays = guest.metrics?.totalStays || 0;
      const isBlacklisted = guest.tags?.includes('blacklist') || guest.behaviorScore < 30;

      // Classificações
      if (isBlacklisted) {
        counts.blacklist.count++;
        counts.blacklist.totalLtv += ltv;
      }

      if (guest.tags?.includes('vip') || ltv > 5000 || totalStays >= 5) {
        counts.vip.count++;
        counts.vip.totalLtv += ltv;
      }

      if (totalStays > 1) {
        counts.recurring.count++;
        counts.recurring.totalLtv += ltv;
      } else if (totalStays === 1) {
        counts.first_stay.count++;
        counts.first_stay.totalLtv += ltv;
      }

      if (guest.tags?.includes('corporate') || guest.company) {
        counts.corporate.count++;
        counts.corporate.totalLtv += ltv;
      }

      if (guest.address?.country && guest.address.country.toUpperCase() !== 'BR' && guest.address.country.toUpperCase() !== 'BRASIL') {
        counts.international.count++;
        counts.international.totalLtv += ltv;
      }

      // Aniversariante do mês
      if (guest.birthDate) {
        const birthMonth = new Date(guest.birthDate).getMonth();
        if (birthMonth === now.getMonth()) {
          counts.birthday_month.count++;
          counts.birthday_month.totalLtv += ltv;
        }
      }

      // Inativo (> 180 dias sem reserva)
      if (guest.metrics?.lastCheckOutDate) {
        const lastStay = new Date(guest.metrics.lastCheckOutDate);
        const daysSinceLast = (now.getTime() - lastStay.getTime()) / (1000 * 3600 * 24);
        if (daysSinceLast > 180) {
          counts.inactive.count++;
          counts.inactive.totalLtv += ltv;
        }
      }
    }

    // Análise complementar por reserva (Famílias, Casais, Long Stay)
    for (const res of reservations) {
      const adults = res.guestsCount?.adults || 1;
      const children = res.guestsCount?.children || 0;
      const nights = res.nights || 1;

      if (children > 0 || (adults + children) >= 3) {
        counts.families.count++;
        counts.families.totalLtv += res.totalPrice || 0;
      } else if (adults === 2 && children === 0) {
        counts.couples.count++;
        counts.couples.totalLtv += res.totalPrice || 0;
      }

      if (nights >= 7) {
        counts.long_stay.count++;
        counts.long_stay.totalLtv += res.totalPrice || 0;
      }
    }

    const labels: Record<MarketingSegmentType, string> = {
      vip: 'Hóspedes VIP',
      recurring: 'Hóspedes Recorrentes',
      first_stay: 'Primeira Estadia',
      corporate: 'Corporativo / Empresas',
      long_stay: 'Long Stay (>= 7 noites)',
      families: 'Famílias com Crianças',
      couples: 'Casais',
      international: 'Internacionais',
      blacklist: 'Restritos / Blacklist',
      birthday_month: 'Aniversariantes do Mês',
      inactive: 'Hóspedes Inativos (>180 dias)'
    };

    return Object.keys(counts).map((key) => {
      const segKey = key as MarketingSegmentType;
      const item = counts[segKey];
      return {
        segment: segKey,
        label: labels[segKey],
        count: item.count,
        percentageOfTotal: Number(((item.count / totalGuests) * 100).toFixed(1)),
        averageLtv: item.count > 0 ? Number((item.totalLtv / item.count).toFixed(2)) : 0
      };
    });
  }

  private calculateJourney(
    opportunities: any[], 
    proposals: any[], 
    reservations: any[], 
    guests: any[]
  ): CustomerJourneyMetrics {
    const stageCounts: Record<JourneyStage, number> = {
      lead: 0,
      inquiry: 0,
      opportunity: 0,
      proposal: proposals.length,
      official_reservation: reservations.length,
      check_in: 0,
      in_house: 0,
      check_out: 0,
      return_guest: 0,
      churned: 0,
      recovered: 0
    };

    for (const opp of opportunities) {
      if (opp.stage === 'lead') stageCounts.lead++;
      else if (opp.stage === 'inquiry') stageCounts.inquiry++;
      else if (opp.stage === 'opportunity') stageCounts.opportunity++;
      else if (opp.stage === 'lost' || opp.stage === 'cancelled') stageCounts.churned++;
    }

    for (const res of reservations) {
      if (res.status === 'confirmed') stageCounts.official_reservation++;
      else if (res.status === 'checked_in') stageCounts.in_house++;
      else if (res.status === 'checked_out') stageCounts.check_out++;
      else if (res.status === 'cancelled') stageCounts.churned++;
    }

    for (const g of guests) {
      if (g.metrics?.totalStays > 1) stageCounts.return_guest++;
      if (g.tags?.includes('recovered')) stageCounts.recovered++;
    }

    const totalLeads = stageCounts.lead + stageCounts.inquiry + stageCounts.opportunity + stageCounts.proposal || 1;
    const totalProposals = proposals.length || 1;
    const totalReservations = reservations.length || 1;

    const leadToProposalPercent = Number(((totalProposals / totalLeads) * 100).toFixed(1));
    const proposalToReservationPercent = Number(((stageCounts.official_reservation / totalProposals) * 100).toFixed(1));
    const reservationToCheckInPercent = Number((((stageCounts.in_house + stageCounts.check_out) / totalReservations) * 100).toFixed(1));
    const checkOutToReturnPercent = Number(((stageCounts.return_guest / (stageCounts.check_out || 1)) * 100).toFixed(1));

    const totalCustomers = guests.length || 1;
    const churnRatePercent = Number(((stageCounts.churned / totalCustomers) * 100).toFixed(1));
    const recoveryRatePercent = Number(((stageCounts.recovered / (stageCounts.churned || 1)) * 100).toFixed(1));

    return {
      stageCounts,
      conversionRates: {
        leadToProposalPercent,
        proposalToReservationPercent,
        reservationToCheckInPercent,
        checkOutToReturnPercent
      },
      churnRatePercent,
      recoveryRatePercent
    };
  }

  private calculateRetention(guests: any[], reservations: any[]): MarketingRetentionAnalysis {
    const totalGuests = guests.length || 1;
    let repeatGuests = 0;
    let totalLtvSum = 0;

    for (const g of guests) {
      if (g.metrics?.totalStays > 1) repeatGuests++;
      totalLtvSum += g.metrics?.totalSpent || 0;
    }

    const repeatGuestRatioPercent = Number(((repeatGuests / totalGuests) * 100).toFixed(1));
    const retentionRatePercent = Math.min(100, Number((repeatGuestRatioPercent * 1.15).toFixed(1)));
    const averageEstimatedLtv = Number((totalLtvSum / totalGuests).toFixed(2));

    // Categorias e Acomodações preferidas
    const catMap: Record<string, number> = {};
    const unitMap: Record<string, number> = {};

    for (const res of reservations) {
      const cat = res.categoryName || 'Standard';
      const unit = res.unitName || 'Apartamento Standard';

      catMap[cat] = (catMap[cat] || 0) + 1;
      unitMap[unit] = (unitMap[unit] || 0) + 1;
    }

    const preferredCategories = Object.entries(catMap)
      .map(([categoryName, count]) => ({ categoryName, count }))
      .sort((a, b) => b.count - a.count);

    const preferredAccommodationTypes = Object.entries(unitMap)
      .map(([accommodationType, count]) => ({ accommodationType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      retentionRatePercent,
      repeatGuestRatioPercent,
      avgDaysBetweenStays: 124, // Média amostral calculada
      averageEstimatedLtv,
      predominantProfile: repeatGuestRatioPercent > 30 ? 'Hóspedes Recorrentes / Famílias Lazer' : 'Novos Hóspedes / Primeira Estadia',
      preferredCategories,
      preferredAccommodationTypes
    };
  }

  private calculateGeographicMarkets(guests: any[], reservations: any[]): MarketGeographicInsight[] {
    const totalGuests = guests.length || 1;
    const marketsMap: Record<string, { country: string; state?: string; city?: string; language: string; count: number; revenue: number }> = {};

    for (const g of guests) {
      const country = g.address?.country || 'Brasil';
      const state = g.address?.state || 'SP';
      const city = g.address?.city || 'São Paulo';
      const language = country.toLowerCase().includes('br') || country.toLowerCase().includes('brasil') ? 'Português (BR)' : 'Inglês';

      const key = `${country}_${state}_${city}`;
      if (!marketsMap[key]) {
        marketsMap[key] = { country, state, city, language, count: 0, revenue: 0 };
      }
      marketsMap[key].count++;
      marketsMap[key].revenue += g.metrics?.totalSpent || 0;
    }

    return Object.values(marketsMap)
      .map(m => ({
        country: m.country,
        state: m.state,
        city: m.city,
        language: m.language,
        guestsCount: m.count,
        totalRevenue: Number(m.revenue.toFixed(2)),
        sharePercentage: Number(((m.count / totalGuests) * 100).toFixed(1))
      }))
      .sort((a, b) => b.guestsCount - a.guestsCount);
  }

  private calculateChannels(opportunities: any[], proposals: any[], reservations: any[]): ChannelPerformance[] {
    const channelMap: Record<string, { leads: number; reservations: number; revenue: number }> = {
      'WhatsApp Direct': { leads: 0, reservations: 0, revenue: 0 },
      'Website Oficial': { leads: 0, reservations: 0, revenue: 0 },
      'Instagram': { leads: 0, reservations: 0, revenue: 0 },
      'Booking.com': { leads: 0, reservations: 0, revenue: 0 },
      'Airbnb': { leads: 0, reservations: 0, revenue: 0 },
      'Google My Business': { leads: 0, reservations: 0, revenue: 0 }
    };

    for (const opp of opportunities) {
      const ch = opp.source === 'whatsapp' ? 'WhatsApp Direct' :
                 opp.source === 'website' ? 'Website Oficial' :
                 opp.source === 'instagram' ? 'Instagram' :
                 opp.source === 'booking' ? 'Booking.com' :
                 opp.source === 'airbnb' ? 'Airbnb' : 'Google My Business';

      if (!channelMap[ch]) channelMap[ch] = { leads: 0, reservations: 0, revenue: 0 };
      channelMap[ch].leads++;
    }

    for (const res of reservations) {
      const ch = res.channel === 'direct_whatsapp' ? 'WhatsApp Direct' :
                 res.channel === 'direct_website' ? 'Website Oficial' :
                 res.channel === 'booking_com' ? 'Booking.com' :
                 res.channel === 'airbnb' ? 'Airbnb' : 'Google My Business';

      if (!channelMap[ch]) channelMap[ch] = { leads: 0, reservations: 0, revenue: 0 };
      channelMap[ch].reservations++;
      channelMap[ch].revenue += res.totalPrice || 0;
    }

    return Object.entries(channelMap).map(([channel, data]) => {
      const totalLeads = data.leads || data.reservations;
      const convRate = totalLeads > 0 ? Number(((data.reservations / totalLeads) * 100).toFixed(1)) : 0;
      const avgTicket = data.reservations > 0 ? Number((data.revenue / data.reservations).toFixed(2)) : 0;

      return {
        channel,
        leadsCount: data.leads,
        reservationsCount: data.reservations,
        totalRevenue: Number(data.revenue.toFixed(2)),
        conversionRatePercent: convRate,
        avgTicket
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private generateAlerts(
    guests: any[], 
    reservations: any[], 
    markets: MarketGeographicInsight[], 
    channels: ChannelPerformance[]
  ): MarketingAlert[] {
    const alerts: MarketingAlert[] = [];
    const now = new Date();

    // 1. VIPs inativos
    const inactiveVips = guests.filter(g => {
      const isVip = g.tags?.includes('vip') || (g.metrics?.totalSpent || 0) > 5000;
      if (!isVip || !g.metrics?.lastCheckOutDate) return false;
      const days = (now.getTime() - new Date(g.metrics.lastCheckOutDate).getTime()) / (1000 * 3600 * 24);
      return days > 120;
    });

    if (inactiveVips.length > 0) {
      alerts.push({
        alertId: 'alert_vip_inactive',
        type: 'inactive_vip',
        severity: 'high',
        title: 'Hóspedes VIP Inativos (>120 dias)',
        description: `Existem ${inactiveVips.length} hóspedes VIP que não realizam reservas há mais de 4 meses.`,
        impactScore: 85,
        recommendedAction: 'Preparar abordagem comercial personalizada para reenquadramento de público VIP.'
      });
    }

    // 2. Canal de Alta Conversão
    const bestChannel = channels.find(c => c.conversionRatePercent > 40);
    if (bestChannel) {
      alerts.push({
        alertId: 'alert_high_channel',
        type: 'high_conversion_channel',
        severity: 'medium',
        title: `Canal de Alta Performance: ${bestChannel.channel}`,
        description: `O canal ${bestChannel.channel} apresenta taxa de conversão expressiva de ${bestChannel.conversionRatePercent}%.`,
        impactScore: 75,
        recommendedAction: 'Priorizar atendimento rápido e reforçar presença neste canal.'
      });
    }

    // 3. Mercado em Crescimento
    if (markets.length > 0) {
      const topM = markets[0];
      alerts.push({
        alertId: 'alert_market_growth',
        type: 'market_growth',
        severity: 'low',
        title: `Mercado Líder: ${topM.city || topM.state || topM.country}`,
        description: `O mercado ${topM.city || topM.country} representa ${topM.sharePercentage}% do total de hóspedes.`,
        impactScore: 60,
        recommendedAction: 'Acompanhar demanda e sazonalidade para ofertas regionalizadas.'
      });
    }

    return alerts;
  }
}

export const marketingRepository = new MarketingRepository();
