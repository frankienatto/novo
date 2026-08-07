import { 
  ReceptionDashboardSummary, 
  ReceptionCheckinItem, 
  ReceptionCheckoutItem, 
  ReceptionSmartSuggestion, 
  ReceptionDashboardData 
} from './receptionTypes.ts';
import { reservationService } from '../pms/reservationService.ts';
import { pmsService } from '../pms/pmsService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { crmService } from '../crm/crmService.ts';
import { guestIntelligenceService } from '../crm/guestIntelligenceService.ts';

export class ReceptionService {
  /**
   * Data atual no formato YYYY-MM-DD
   */
  private getTodayFormatted(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Consolida todos os dados do Dashboard da Recepção agregando exclusivamente através de Serviços.
   */
  async getDashboardData(
    organizationId: string, 
    propertyId: string
  ): Promise<ReceptionDashboardData> {
    const today = this.getTodayFormatted();

    // 1. Carregar dados operacionais dos serviços existentes
    const [reservations, units, categories, hkSummary] = await Promise.all([
      reservationService.listReservations(organizationId, propertyId),
      pmsService.listUnits(organizationId, propertyId),
      pmsService.listCategories(organizationId, propertyId),
      housekeepingService.getDashboardSummary(organizationId, propertyId)
    ]);

    // Mapeamento auxiliar de UHs e Categorias
    const unitMap = new Map(units.map(u => [u.unitId, u]));
    const categoryMap = new Map(categories.map(c => [c.categoryId, c]));

    // 2. Filtrar Reservas para Check-in e Check-out Hoje
    const checkinsTodayRaw = reservations.filter(r => 
      r.stayPeriod.checkInDate === today && r.status === 'confirmed'
    );

    const checkoutsTodayRaw = reservations.filter(r => 
      r.stayPeriod.checkOutDate === today && r.status === 'checked_in'
    );

    const guestsInHouseCount = reservations.filter(r => r.status === 'checked_in').length;

    // Chegadas atrasadas (checkInDate <= today & status === confirmed & nota ou data passada)
    const lateArrivalsRaw = reservations.filter(r => 
      r.status === 'confirmed' && (r.stayPeriod.checkInDate < today || (r.stayPeriod.checkInDate === today && (r.notes?.toLowerCase().includes('atraso') || r.notes?.toLowerCase().includes('late arrival'))))
    );

    // Early check-in solicitados
    const earlyCheckinsRaw = checkinsTodayRaw.filter(r => 
      r.notes?.toLowerCase().includes('early') || r.notes?.toLowerCase().includes('cedo')
    );

    // Late check-out solicitados
    const lateCheckoutsRaw = checkoutsTodayRaw.filter(r => 
      r.notes?.toLowerCase().includes('late') || r.notes?.toLowerCase().includes('tarde')
    );

    // 3. Processar itens de Check-in Hoje enriquecidos com CRM / Guest Intelligence
    const checkinsToday: ReceptionCheckinItem[] = await Promise.all(
      checkinsTodayRaw.map(async (r) => {
        const assignedUnit = unitMap.get(r.unitId);
        const category = assignedUnit ? categoryMap.get(assignedUnit.categoryId) : undefined;
        let isVip = false;
        let isRecurring = false;
        const specialRequests: string[] = [];

        if (r.notes?.toLowerCase().includes('vip')) {
          isVip = true;
        }

        if (r.guest?.guestId) {
          try {
            const guestProfile = await crmService.getGuestById(r.guest.guestId);
            if (guestProfile) {
              if (guestProfile.classification === 'vip') isVip = true;
              if (guestProfile.totalStaysCount && guestProfile.totalStaysCount > 1) isRecurring = true;
            }

            const gi = await guestIntelligenceService.calculateGuestIntelligence(r.guest.guestId);
            if (gi) {
              if (gi.recurrenceLevel === 'champion' || gi.recurrenceLevel === 'frequent') isRecurring = true;
              if (gi.topPreferences) specialRequests.push(...gi.topPreferences);
            }
          } catch (err) {
            // Silencioso se não houver cadastro CRM para hóspede
          }
        }

        if (r.notes) {
          specialRequests.push(`Obs: ${r.notes}`);
        }

        return {
          reservationId: r.reservationId,
          guestName: r.guest?.fullName || 'Hóspede Não Identificado',
          guestId: r.guest?.guestId,
          unitId: r.unitId,
          unitNumber: assignedUnit?.unitNumber || 'A atribuir',
          categoryName: category?.name,
          stayPeriod: r.stayPeriod,
          status: r.status,
          cleaningStatus: assignedUnit?.status,
          isVip,
          isRecurring,
          isLateArrival: r.notes?.toLowerCase().includes('atraso') || false,
          isEarlyCheckinRequested: r.notes?.toLowerCase().includes('early') || false,
          specialRequests: specialRequests.length > 0 ? specialRequests : undefined,
          totalAmount: r.totalAmount
        };
      })
    );

    // 4. Processar itens de Check-out Hoje
    const checkoutsToday: ReceptionCheckoutItem[] = checkoutsTodayRaw.map(r => {
      const assignedUnit = unitMap.get(r.unitId);
      return {
        reservationId: r.reservationId,
        guestName: r.guest?.fullName || 'Hóspede Não Identificado',
        guestId: r.guest?.guestId,
        unitId: r.unitId,
        unitNumber: assignedUnit?.unitNumber || 'N/A',
        stayPeriod: r.stayPeriod,
        status: r.status,
        paymentStatus: r.paymentStatus,
        totalAmount: r.totalAmount,
        isLateCheckoutRequested: r.notes?.toLowerCase().includes('late') || false
      };
    });

    // 5. Gerar Sugestões Inteligentes e Alertas
    const suggestions: ReceptionSmartSuggestion[] = [];
    const alerts: ReceptionSmartSuggestion[] = [];

    // Alerta Operacional: Check-in hoje para quarto que ainda está SUJO ou EM MANUTENÇÃO
    checkinsToday.forEach(item => {
      if (item.cleaningStatus === 'dirty') {
        alerts.push({
          id: `sug_dirty_${item.reservationId}`,
          type: 'operational_alert',
          title: 'Quarto Sujo para Check-in Hoje',
          description: `A UH ${item.unitNumber} do hóspede ${item.guestName} está com status SUJO. Priorizar governança.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Solicitar prioridade de limpeza urgente na governança.',
          priority: 'urgent'
        });
      }

      if (item.cleaningStatus === 'maintenance' || item.cleaningStatus === 'out_of_service') {
        alerts.push({
          id: `sug_maint_${item.reservationId}`,
          type: 'operational_alert',
          title: 'Quarto Bloqueado em Manutenção',
          description: `A UH ${item.unitNumber} reservada para ${item.guestName} está em manutenção. Necessário realocação.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Atribuir outra UH limpa da mesma categoria.',
          priority: 'urgent'
        });
      }

      // Sugestão: Hóspede VIP
      if (item.isVip) {
        suggestions.push({
          id: `sug_vip_${item.reservationId}`,
          type: 'vip',
          title: 'Acolhimento Especial Hóspede VIP',
          description: `O hóspede VIP ${item.guestName} chega hoje na UH ${item.unitNumber}.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Preparar carta de boas-vindas e amenity de boas-vindas na UH.',
          priority: 'high'
        });
      }

      // Sugestão: Hóspede Recorrente
      if (item.isRecurring && !item.isVip) {
        suggestions.push({
          id: `sug_rec_${item.reservationId}`,
          type: 'recurring',
          title: 'Reconhecimento de Hóspede Frequente',
          description: `Hóspede recorrente ${item.guestName} possui histórico positivo na propriedade.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Agradecer a fidelidade durante o atendimento no Check-in.',
          priority: 'normal'
        });
      }

      // Sugestão: Oportunidade de Upgrade (se houver UH de categoria superior limpa disponível)
      const cleanUnitsAvailable = units.filter(u => u.status === 'clean');
      if (cleanUnitsAvailable.length > 0 && !item.isVip) {
        suggestions.push({
          id: `sug_upg_${item.reservationId}`,
          type: 'upgrade',
          title: 'Oportunidade de Upgrade de UH',
          description: `Existem ${cleanUnitsAvailable.length} UHs limpas disponíveis para potencial oferta de upgrade ao hóspede ${item.guestName}.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Oferecer upgrade cortesia ou tarifado no momento do Check-in.',
          priority: 'low'
        });
      }
    });

    // Sugestão: Upsell em Check-outs (Late check-out tarifado, transfer, etc.)
    checkoutsToday.forEach(item => {
      if (item.isLateCheckoutRequested) {
        suggestions.push({
          id: `sug_upsell_late_${item.reservationId}`,
          type: 'upsell',
          title: 'Solicitação de Late Check-out',
          description: `O hóspede ${item.guestName} (UH ${item.unitNumber}) solicitou saída tardia.`,
          reservationId: item.reservationId,
          guestId: item.guestId,
          guestName: item.guestName,
          unitNumber: item.unitNumber,
          actionableHint: 'Verificar disponibilidade de UH e oferecer taxa de Late Check-out.',
          priority: 'normal'
        });
      }
    });

    // 6. Consolidar Resumo
    const totalUnitsCount = units.length || 1;
    const occupancyRatePercent = Number(((guestsInHouseCount / totalUnitsCount) * 100).toFixed(1));

    const summary: ReceptionDashboardSummary = {
      checkinsExpectedToday: checkinsToday.length,
      checkoutsExpectedToday: checkoutsToday.length,
      guestsInHouse: guestsInHouseCount,
      lateArrivals: lateArrivalsRaw.length,
      pendingEarlyCheckins: earlyCheckinsRaw.length,
      pendingLateCheckouts: lateCheckoutsRaw.length,
      availableRooms: hkSummary.availableUnits,
      dirtyRooms: hkSummary.dirtyUnits,
      blockedRooms: hkSummary.blockedOrMaintenance,
      maintenanceRooms: units.filter(u => u.status === 'maintenance').length,
      occupancyRatePercent
    };

    const vips = checkinsToday.filter(c => c.isVip);

    return {
      summary,
      checkinsToday,
      checkoutsToday,
      suggestions,
      alerts,
      vips
    };
  }

  /**
   * Listar Check-ins previstos para hoje
   */
  async getTodayCheckins(organizationId: string, propertyId: string): Promise<ReceptionCheckinItem[]> {
    const data = await this.getDashboardData(organizationId, propertyId);
    return data.checkinsToday;
  }

  /**
   * Listar Check-outs previstos para hoje
   */
  async getTodayCheckouts(organizationId: string, propertyId: string): Promise<ReceptionCheckoutItem[]> {
    const data = await this.getDashboardData(organizationId, propertyId);
    return data.checkoutsToday;
  }

  /**
   * Listar Alertas Operacionais da Recepção
   */
  async getOperationalAlerts(organizationId: string, propertyId: string): Promise<ReceptionSmartSuggestion[]> {
    const data = await this.getDashboardData(organizationId, propertyId);
    return data.alerts;
  }

  /**
   * Listar Hóspedes VIPs previstos para hoje
   */
  async getVipArrivals(organizationId: string, propertyId: string): Promise<ReceptionCheckinItem[]> {
    const data = await this.getDashboardData(organizationId, propertyId);
    return data.vips;
  }
}

export const receptionService = new ReceptionService();
