import { RevenueRepository, revenueRepository } from './revenueRepository.ts';
import { 
  RevenueDashboard, 
  RevenueMetrics, 
  ForecastDay, 
  ChannelRevenue, 
  CategoryRevenue, 
  PropertyRevenue, 
  WeekdayOccupancy, 
  RevenueSummaryForAI 
} from './revenueTypes.ts';
import { Reservation } from '../pms/reservationTypes.ts';
import { RoomCategory, RoomUnit } from '../pms/pmsTypes.ts';

export class RevenueService {
  private repo?: RevenueRepository;

  constructor(repo?: RevenueRepository) {
    this.repo = repo;
  }

  private getRepo(): RevenueRepository {
    return this.repo || revenueRepository;
  }

  // --- HELPERS DE DATA E FORMATAÇÃO ---

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private getDayOfWeekInfo(dateStr: string): { label: string; index: number } {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const index = date.getDay();
    const labels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return { label: labels[index], index };
  }

  private getChannelLabel(source: string): string {
    switch (source) {
      case 'direct_website': return 'Website Direto';
      case 'front_desk': return 'Balcão / Recepção';
      case 'phone': return 'Atendimento Telefônico';
      case 'whatsapp': return 'WhatsApp Business';
      case 'ota_generic': return 'Canais OTA (Aloha / n8n)';
      default: return 'Canal Direto / Outros';
    }
  }

  private isDateInRange(targetDateStr: string, startDateStr: string, endDateStr: string): boolean {
    return targetDateStr >= startDateStr && targetDateStr < endDateStr;
  }

  // --- NÚCLEO DE CÁLCULOS E DASHBOARD ---

  /**
   * Obtém o Dashboard Completo de Revenue Intelligence
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<RevenueDashboard> {
    const [reservations, categories, units] = await Promise.all([
      this.getRepo().getReservations(organizationId, propertyId),
      this.getRepo().getCategories(organizationId, propertyId),
      this.getRepo().getUnits(organizationId, propertyId)
    ]);

    const activeUnits = units.filter(u => u.active);
    const totalUnitsCount = activeUnits.length || 1;

    const metrics = this.calculateMetrics(reservations, totalUnitsCount);
    const forecast7 = this.calculateForecast(reservations, totalUnitsCount, 7);
    const forecast15 = this.calculateForecast(reservations, totalUnitsCount, 15);
    const forecast30 = this.calculateForecast(reservations, totalUnitsCount, 30);

    const avgForecastOccupancy7Days = Number((forecast7.reduce((acc, d) => acc + d.occupancyRatePercent, 0) / 7).toFixed(1));
    const avgForecastOccupancy15Days = Number((forecast15.reduce((acc, d) => acc + d.occupancyRatePercent, 0) / 15).toFixed(1));
    const avgForecastOccupancy30Days = Number((forecast30.reduce((acc, d) => acc + d.occupancyRatePercent, 0) / 30).toFixed(1));

    const revenueByChannel = this.calculateRevenueByChannel(reservations);
    const revenueByCategory = this.calculateRevenueByCategory(reservations, categories, units);
    const revenueByProperty = this.calculateRevenueByProperty(reservations, totalUnitsCount, propertyId);
    const weekdayOccupancy = this.calculateWeekdayOccupancy(reservations, totalUnitsCount);

    return {
      summary: metrics,
      forecast: {
        days7: forecast7,
        days15: forecast15,
        days30: forecast30,
        avgForecastOccupancy7Days,
        avgForecastOccupancy15Days,
        avgForecastOccupancy30Days
      },
      revenueByChannel,
      revenueByCategory,
      revenueByProperty,
      weekdayOccupancy,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Métricas e KPIs Comerciais Consolidados
   */
  async getMetrics(organizationId: string, propertyId: string): Promise<RevenueMetrics> {
    const [reservations, units] = await Promise.all([
      this.getRepo().getReservations(organizationId, propertyId),
      this.getRepo().getUnits(organizationId, propertyId)
    ]);
    const totalUnitsCount = units.filter(u => u.active).length || 1;
    return this.calculateMetrics(reservations, totalUnitsCount);
  }

  /**
   * Projeção / Forecast de Ocupação
   */
  async getForecast(organizationId: string, propertyId: string, days = 30): Promise<ForecastDay[]> {
    const [reservations, units] = await Promise.all([
      this.getRepo().getReservations(organizationId, propertyId),
      this.getRepo().getUnits(organizationId, propertyId)
    ]);
    const totalUnitsCount = units.filter(u => u.active).length || 1;
    return this.calculateForecast(reservations, totalUnitsCount, days);
  }

  /**
   * Receita por Canal de Venda
   */
  async getChannels(organizationId: string, propertyId: string): Promise<ChannelRevenue[]> {
    const reservations = await this.getRepo().getReservations(organizationId, propertyId);
    return this.calculateRevenueByChannel(reservations);
  }

  /**
   * Receita por Categoria de Acomodação
   */
  async getCategories(organizationId: string, propertyId: string): Promise<CategoryRevenue[]> {
    const [reservations, categories, units] = await Promise.all([
      this.getRepo().getReservations(organizationId, propertyId),
      this.getRepo().getCategories(organizationId, propertyId),
      this.getRepo().getUnits(organizationId, propertyId)
    ]);
    return this.calculateRevenueByCategory(reservations, categories, units);
  }

  /**
   * Resumo Executivo para Injeção no ContextService da IA
   */
  async getRevenueSummaryForAI(organizationId: string, propertyId: string): Promise<RevenueSummaryForAI> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    const summary = dashboard.summary;

    const topChannelObj = dashboard.revenueByChannel.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    const topChannel = topChannelObj ? topChannelObj.label : 'N/A';
    const topChannelRevenue = topChannelObj ? topChannelObj.totalRevenue : 0;

    const alerts: string[] = [];
    const trends: string[] = [];

    if (summary.occupancyTodayPercent < 50) {
      alerts.push(`Ocupação para hoje está abaixo da meta (${summary.occupancyTodayPercent}%). Considerar estratégias de promoção de última hora.`);
    } else if (summary.occupancyTodayPercent >= 85) {
      trends.push(`Alta taxa de ocupação hoje (${summary.occupancyTodayPercent}%). Oportunidade para otimizar tarifa balcão.`);
    }

    if (summary.cancellationRatePercent > 15) {
      alerts.push(`Taxa de cancelamento elevada (${summary.cancellationRatePercent}%).`);
    }

    if (dashboard.forecast.avgForecastOccupancy7Days > summary.occupancyTodayPercent) {
      trends.push(`Tendência de crescimento de ocupação para os próximos 7 dias (Média prevista: ${dashboard.forecast.avgForecastOccupancy7Days}%).`);
    }

    return {
      occupancyToday: summary.occupancyTodayPercent,
      occupancyWeek: summary.occupancyWeekPercent,
      occupancyMonth: summary.occupancyMonthPercent,
      adr: summary.adr,
      revPar: summary.revPar,
      forecast7DaysOccupancy: dashboard.forecast.avgForecastOccupancy7Days,
      topChannel,
      topChannelRevenue,
      alerts,
      trends
    };
  }

  // --- CÁLCULOS MATEMÁTICOS DE REVENUE ---

  private calculateMetrics(reservations: Reservation[], totalUnitsCount: number): RevenueMetrics {
    const todayStr = this.formatDate(new Date());
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));
    
    const totalReservationsCount = reservations.length;
    const totalCancelled = reservations.filter(r => r.status === 'cancelled').length;
    const totalNoShow = reservations.filter(r => r.status === 'no_show').length;

    const cancellationRatePercent = totalReservationsCount > 0 
      ? Number(((totalCancelled / totalReservationsCount) * 100).toFixed(1)) 
      : 0;

    const noShowRatePercent = totalReservationsCount > 0 
      ? Number(((totalNoShow / totalReservationsCount) * 100).toFixed(1)) 
      : 0;

    // 1. Receita e Diárias Vendidas
    let totalRevenue = 0;
    let totalNightsSold = 0;
    let totalLeadTimeDays = 0;

    for (const r of validReservations) {
      totalRevenue += r.totalAmount || 0;
      const nights = r.stayPeriod?.numberOfNights || 1;
      totalNightsSold += nights;

      // Calculation of Lead Time
      const createdAtDateStr = r.createdAt ? r.createdAt.substring(0, 10) : todayStr;
      const checkInDateStr = r.stayPeriod?.checkInDate || todayStr;
      const diffMs = new Date(checkInDateStr).getTime() - new Date(createdAtDateStr).getTime();
      const leadDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      totalLeadTimeDays += leadDays;
    }

    const adr = totalNightsSold > 0 ? Number((totalRevenue / totalNightsSold).toFixed(2)) : 0;
    const averageLengthOfStay = validReservations.length > 0 ? Number((totalNightsSold / validReservations.length).toFixed(1)) : 0;
    const averageLeadTimeDays = validReservations.length > 0 ? Number((totalLeadTimeDays / validReservations.length).toFixed(1)) : 0;

    // 2. Ocupação Hoje, Semana (7 dias) e Mês (30 dias)
    const occupiedTodayCount = validReservations.filter(r => 
      this.isDateInRange(todayStr, r.stayPeriod.checkInDate, r.stayPeriod.checkOutDate)
    ).length;

    const occupancyTodayPercent = Number(((occupiedTodayCount / totalUnitsCount) * 100).toFixed(1));

    // Janela de 7 dias
    let nightsOccupiedNext7Days = 0;
    for (let i = 0; i < 7; i++) {
      const dStr = this.formatDate(this.addDays(new Date(), i));
      const count = validReservations.filter(r => this.isDateInRange(dStr, r.stayPeriod.checkInDate, r.stayPeriod.checkOutDate)).length;
      nightsOccupiedNext7Days += count;
    }
    const occupancyWeekPercent = Number(((nightsOccupiedNext7Days / (totalUnitsCount * 7)) * 100).toFixed(1));

    // Janela de 30 dias
    let nightsOccupiedNext30Days = 0;
    for (let i = 0; i < 30; i++) {
      const dStr = this.formatDate(this.addDays(new Date(), i));
      const count = validReservations.filter(r => this.isDateInRange(dStr, r.stayPeriod.checkInDate, r.stayPeriod.checkOutDate)).length;
      nightsOccupiedNext30Days += count;
    }
    const occupancyMonthPercent = Number(((nightsOccupiedNext30Days / (totalUnitsCount * 30)) * 100).toFixed(1));

    // RevPAR = (ADR * Taxa de Ocupação Hoje) ou (Receita Total / UHs Disponíveis Hoje)
    const revPar = Number((adr * (occupancyTodayPercent / 100)).toFixed(2));

    // 3. Pickup Últimos 7 dias
    const sevenDaysAgoStr = this.formatDate(this.addDays(new Date(), -7));
    const pickupReservations = reservations.filter(r => {
      const createdStr = r.createdAt ? r.createdAt.substring(0, 10) : todayStr;
      return createdStr >= sevenDaysAgoStr && ['confirmed', 'checked_in', 'checked_out'].includes(r.status);
    });

    const pickupLast7Days = {
      reservationsCaptured: pickupReservations.length,
      revenueCaptured: Number(pickupReservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0).toFixed(2))
    };

    // 4. Booking Pace
    const currentMonthPrefix = todayStr.substring(0, 7);
    const monthReservations = validReservations.filter(r => r.createdAt && r.createdAt.startsWith(currentMonthPrefix));
    const monthRevenue = monthReservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalNightsSold,
      totalActiveReservations: validReservations.length,
      occupancyTodayPercent,
      occupancyWeekPercent,
      occupancyMonthPercent,
      adr,
      revPar,
      averageLengthOfStay,
      averageLeadTimeDays,
      cancellationRatePercent,
      noShowRatePercent,
      pickupLast7Days,
      bookingPace: {
        period: `Mês Atual (${currentMonthPrefix})`,
        totalBookings: monthReservations.length,
        totalRevenue: Number(monthRevenue.toFixed(2)),
        paceVsPreviousMonthPercent: 12.5 // Ritmo comparativo simulado/estável
      }
    };
  }

  private calculateForecast(reservations: Reservation[], totalUnitsCount: number, days: number): ForecastDay[] {
    const today = new Date();
    const forecast: ForecastDay[] = [];
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));

    for (let i = 0; i < days; i++) {
      const targetDate = this.addDays(today, i);
      const dateStr = this.formatDate(targetDate);
      const { label: dayOfWeek } = this.getDayOfWeekInfo(dateStr);

      let projectedOccupiedUnits = 0;
      let projectedRevenue = 0;

      for (const r of validReservations) {
        if (this.isDateInRange(dateStr, r.stayPeriod.checkInDate, r.stayPeriod.checkOutDate)) {
          projectedOccupiedUnits++;
          const nights = r.stayPeriod.numberOfNights || 1;
          const dailyRate = (r.totalAmount || 0) / nights;
          projectedRevenue += dailyRate;
        }
      }

      const occupancyRatePercent = Number(((projectedOccupiedUnits / totalUnitsCount) * 100).toFixed(1));
      const projectedADR = projectedOccupiedUnits > 0 
        ? Number((projectedRevenue / projectedOccupiedUnits).toFixed(2)) 
        : 0;

      forecast.push({
        date: dateStr,
        dayOfWeek,
        projectedOccupiedUnits,
        totalUnits: totalUnitsCount,
        occupancyRatePercent,
        projectedRevenue: Number(projectedRevenue.toFixed(2)),
        projectedADR
      });
    }

    return forecast;
  }

  private calculateRevenueByChannel(reservations: Reservation[]): ChannelRevenue[] {
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));
    const totalOverallRevenue = validReservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0) || 1;

    const channelMap: Map<string, { count: number; revenue: number; nights: number }> = new Map();

    for (const r of validReservations) {
      const src = r.source || 'direct_website';
      const existing = channelMap.get(src) || { count: 0, revenue: 0, nights: 0 };
      existing.count++;
      existing.revenue += r.totalAmount || 0;
      existing.nights += r.stayPeriod?.numberOfNights || 1;
      channelMap.set(src, existing);
    }

    const result: ChannelRevenue[] = [];
    for (const [src, data] of channelMap.entries()) {
      const sharePercent = Number(((data.revenue / totalOverallRevenue) * 100).toFixed(1));
      const avgADR = data.nights > 0 ? Number((data.revenue / data.nights).toFixed(2)) : 0;

      result.push({
        source: src,
        label: this.getChannelLabel(src),
        reservationsCount: data.count,
        totalRevenue: Number(data.revenue.toFixed(2)),
        sharePercent,
        avgADR
      });
    }

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private calculateRevenueByCategory(
    reservations: Reservation[], 
    categories: RoomCategory[], 
    units: RoomUnit[]
  ): CategoryRevenue[] {
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));

    return categories.map(cat => {
      const categoryUnits = units.filter(u => u.categoryId === cat.categoryId && u.active);
      const unitsCount = categoryUnits.length;
      const catReservations = validReservations.filter(r => r.categoryId === cat.categoryId);

      let totalRevenue = 0;
      let nightsSold = 0;

      for (const r of catReservations) {
        totalRevenue += r.totalAmount || 0;
        nightsSold += r.stayPeriod?.numberOfNights || 1;
      }

      const avgADR = nightsSold > 0 ? Number((totalRevenue / nightsSold).toFixed(2)) : 0;
      const occupancyRatePercent = unitsCount > 0 
        ? Number(((nightsSold / (unitsCount * 30)) * 100).toFixed(1)) 
        : 0;
      const revPar = Number((avgADR * (occupancyRatePercent / 100)).toFixed(2));

      return {
        categoryId: cat.categoryId,
        categoryName: cat.name,
        unitsCount,
        reservationsCount: catReservations.length,
        nightsSold,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        occupancyRatePercent,
        avgADR,
        revPar
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private calculateRevenueByProperty(
    reservations: Reservation[], 
    totalUnitsCount: number, 
    propertyId: string
  ): PropertyRevenue[] {
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));
    
    let totalRevenue = 0;
    let nightsSold = 0;

    for (const r of validReservations) {
      totalRevenue += r.totalAmount || 0;
      nightsSold += r.stayPeriod?.numberOfNights || 1;
    }

    const adr = nightsSold > 0 ? Number((totalRevenue / nightsSold).toFixed(2)) : 0;
    const occupancyRatePercent = Number(((nightsSold / (totalUnitsCount * 30)) * 100).toFixed(1));
    const revPar = Number((adr * (occupancyRatePercent / 100)).toFixed(2));

    return [
      {
        propertyId,
        propertyName: 'Propriedade Principal / Synapse Hotel',
        totalUnits: totalUnitsCount,
        reservationsCount: validReservations.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        occupancyRatePercent,
        adr,
        revPar
      }
    ];
  }

  private calculateWeekdayOccupancy(reservations: Reservation[], totalUnitsCount: number): WeekdayOccupancy[] {
    const dayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayMap = new Array(7).fill(0).map(() => ({ nightsCount: 0, revenueSum: 0 }));
    const validReservations = reservations.filter(r => ['confirmed', 'checked_in', 'checked_out'].includes(r.status));

    for (const r of validReservations) {
      const checkIn = new Date(r.stayPeriod.checkInDate);
      const nights = r.stayPeriod.numberOfNights || 1;
      const dailyRate = (r.totalAmount || 0) / nights;

      for (let i = 0; i < nights; i++) {
        const currentDate = this.addDays(checkIn, i);
        const dayIdx = currentDate.getDay();
        weekdayMap[dayIdx].nightsCount += 1;
        weekdayMap[dayIdx].revenueSum += dailyRate;
      }
    }

    return dayLabels.map((label, index) => {
      const data = weekdayMap[index];
      const avgRevenue = data.nightsCount > 0 ? Number((data.revenueSum / data.nightsCount).toFixed(2)) : 0;
      // Taxa de ocupação aproximada para aquele dia da semana em um horizonte de 4 semanas
      const occupancyRatePercent = Number(((data.nightsCount / (totalUnitsCount * 4)) * 100).toFixed(1));

      return {
        dayOfWeek: label,
        dayIndex: index,
        nightsCount: data.nightsCount,
        occupancyRatePercent,
        avgRevenue
      };
    });
  }
}

export const revenueService = new RevenueService();
