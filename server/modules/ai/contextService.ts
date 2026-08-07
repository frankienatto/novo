import { OperationalContext } from './aiTypes.ts';
import { sessionMemory } from './sessionMemory.ts';
import { organizationRepository } from '../saas/organizationRepository.ts';
import { pmsService } from '../pms/pmsService.ts';
import { reservationService } from '../pms/reservationService.ts';
import { n8nService } from '../integration/n8nService.ts';
import { icalService } from '../integration/ical/icalService.ts';
import { googleCalendarService } from '../integration/gcal/googleCalendarService.ts';
import { crmService } from '../crm/crmService.ts';
import { timelineService } from '../crm/timelineService.ts';
import { guestIntelligenceService } from '../crm/guestIntelligenceService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { receptionService } from '../reception/receptionService.ts';
import { maintenanceService } from '../maintenance/maintenanceService.ts';
import { revenueService } from '../revenue/revenueService.ts';
import { directBookingService } from '../directBooking/directBookingService.ts';
import { salesService } from '../sales/salesService.ts';
import { marketingService } from '../marketing/marketingService.ts';
import { executiveService } from '../executive/executiveService.ts';
import { executiveCopilotService } from '../executiveCopilot/executiveCopilotService.ts';
import { decisionService } from '../decision/decisionService.ts';
import { strategyService } from '../strategy/strategyService.ts';
import { approvalService } from '../approval/approvalService.ts';
import { planningService } from '../planning/planningService.ts';
import { executionService } from '../execution/executionService.ts';
import { cacheConfig } from '../../config/cacheConfig.ts';
import { metricsCollector } from '../../utils/metricsCollector.ts';
import { env } from '../../config/environment.ts';

interface CacheEntry {
  data: OperationalContext;
  expiresAt: number;
  organizationId: string;
  propertyId: string;
}

export class ContextService {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Invalida o cache de contexto para uma organização/propriedade específica ou totalmente.
   * Chamado quando ocorrem mutações no PMS, Reservas, CRM, Timeline, Governança, Manutenção ou Integrações.
   */
  invalidateCache(organizationId?: string, propertyId?: string): void {
    if (!organizationId) {
      const count = this.cache.size;
      this.cache.clear();
      metricsCollector.recordContextInvalidation(count);
      return;
    }

    let invalidatedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.organizationId === organizationId) {
        if (!propertyId || entry.propertyId === propertyId) {
          this.cache.delete(key);
          invalidatedCount++;
        }
      }
    }
    metricsCollector.recordContextInvalidation(invalidatedCount);
  }

  /**
   * Constrói e retorna o objeto estruturado OperationalContext com cache em memória e isolamento por tenant.
   */
  async buildOperationalContext(
    organizationId: string,
    propertyId?: string,
    userId?: string,
    sessionId?: string,
    activeGuestId?: string
  ): Promise<OperationalContext> {
    const resolvedOrgId = organizationId || 'org_dev_default';
    const resolvedPropId = propertyId || 'prop_dev_default';

    const cacheKey = `${resolvedOrgId}:${resolvedPropId}:${userId || 'none'}:${sessionId || 'none'}:${activeGuestId || 'none'}`;

    // 0. Verificar Cache se habilitado
    if (env.ENABLE_CACHE) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        metricsCollector.recordContextBuild(0, true);
        return cached.data;
      }
    }

    const startTime = Date.now();

    // 1. Leitura de Organização
    const orgData = await organizationRepository.getOrganizationById(resolvedOrgId);
    const organization = orgData ? {
      organizationId: orgData.organizationId,
      name: orgData.name,
      plan: orgData.plan
    } : null;

    // 2. Leitura de Propriedade
    let property = null;
    if (resolvedPropId) {
      const propData = await organizationRepository.getPropertyById(resolvedPropId);
      if (propData) {
        property = {
          propertyId: propData.propertyId,
          name: propData.name,
          type: propData.type
        };
      }
    }

    // 3. Leitura de Usuário
    let user = null;
    if (userId) {
      const userData = await organizationRepository.getUserById(userId);
      if (userData) {
        user = {
          userId: userData.userId,
          name: userData.name,
          role: userData.role
        };
      }
    }

    // 4. Leitura do Histórico Recente de Sessão (Memory)
    const sessionHistory = sessionId 
      ? await sessionMemory.getRecentMessages(sessionId) 
      : [];

    // 5. Resumo da Integração n8n / Aloha PMS, iCal Universal, Google Calendar & Guest CRM
    const integrationSummary = n8nService.getIntegrationSummary(resolvedOrgId, resolvedPropId);
    const icalSummary = icalService.getICalSummary(resolvedOrgId, resolvedPropId);
    const gcalSummary = googleCalendarService.getGCalSummary(resolvedOrgId, resolvedPropId);
    const crmMetrics = await crmService.getMetrics(resolvedOrgId);

    // Resumo enxuto da Timeline e Inteligência do hóspede ativo (se informado)
    let guestTimelineSummary = undefined;
    let guestIntelligence = null;
    if (activeGuestId) {
      guestTimelineSummary = await timelineService.getTimelineSummaryForAI(activeGuestId);
      try {
        guestIntelligence = await guestIntelligenceService.calculateGuestIntelligence(activeGuestId);
      } catch (err: any) {
        console.warn(`⚠️ [ContextService] Erro ao calcular inteligência do hóspede [${activeGuestId}]:`, err?.message || err);
      }
    }

    // 6. Integração com o PMS: Consulta via Services
    let pmsData = null;
    let revenueSummary = null;
    let directBookingSummary = null;
    let salesSummary = null;
    let marketingSummary = null;
    let executiveSummary = null;
    let executiveCopilotSummary = null;
    let decisionSummary = null;
    let strategySummary = null;
    let approvalSummary = null;
    let planningSummary = null;
    let executionSummary = null;
    try {
      const [categories, units, inventorySummary, reservations, housekeepingSummary, receptionDashboard, maintenanceDashboard, revSummary, directBookingSum, salesSum, mktSum, execSum, execCopilotSum, decSum, stratSum, apprSum, planSum, execTrackSum] = await Promise.all([
        pmsService.listCategories(resolvedOrgId, resolvedPropId),
        pmsService.listUnits(resolvedOrgId, resolvedPropId),
        pmsService.getInventorySummary(resolvedOrgId, resolvedPropId),
        reservationService.listReservations(resolvedOrgId, resolvedPropId),
        housekeepingService.getHousekeepingSummaryForAI(resolvedOrgId, resolvedPropId),
        receptionService.getDashboardData(resolvedOrgId, resolvedPropId),
        maintenanceService.getMaintenanceSummaryForAI(resolvedOrgId, resolvedPropId),
        revenueService.getRevenueSummaryForAI(resolvedOrgId, resolvedPropId),
        directBookingService.getDirectBookingSummaryForAI(resolvedOrgId, resolvedPropId),
        salesService.getSalesSummaryForAI(resolvedOrgId, resolvedPropId),
        marketingService.getMarketingSummaryForAI(resolvedOrgId, resolvedPropId),
        executiveService.getExecutiveSummaryForAI(resolvedOrgId, resolvedPropId),
        executiveCopilotService.getExecutiveCopilotSummaryForAI(resolvedOrgId, resolvedPropId),
        decisionService.getDecisionSummaryForAI(resolvedOrgId, resolvedPropId),
        strategyService.getStrategySummaryForAI(resolvedOrgId, resolvedPropId),
        approvalService.getApprovalSummaryForAI(resolvedOrgId, resolvedPropId),
        planningService.getPlanningSummaryForAI(resolvedOrgId, resolvedPropId),
        executionService.getExecutionSummaryForAI(resolvedOrgId, resolvedPropId)
      ]);

      revenueSummary = revSummary;
      directBookingSummary = directBookingSum;
      salesSummary = salesSum;
      marketingSummary = mktSum;
      executiveSummary = execSum;
      executiveCopilotSummary = execCopilotSum;
      decisionSummary = decSum;
      strategySummary = stratSum;
      approvalSummary = apprSum;
      planningSummary = planSum;
      executionSummary = execTrackSum;

      const activeReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
      const occupiedUnitsCount = reservations.filter(r => r.status === 'checked_in').length;
      const totalUnitsCount = inventorySummary.totalUnits || 1;
      const occupancyRatePercent = Number(((occupiedUnitsCount / totalUnitsCount) * 100).toFixed(1));

      pmsData = {
        categories,
        units,
        reservations,
        summary: {
          totalCategories: inventorySummary.totalCategories,
          totalUnits: inventorySummary.totalUnits,
          activeUnits: inventorySummary.activeUnitsCount,
          occupiedUnits: occupiedUnitsCount,
          dirtyUnits: inventorySummary.unitsByStatus.dirty,
          cleanUnits: inventorySummary.unitsByStatus.clean,
          inspectedUnits: inventorySummary.unitsByStatus.inspected,
          maintenanceUnits: inventorySummary.unitsByStatus.maintenance,
          outOfServiceUnits: inventorySummary.unitsByStatus.out_of_service,
          occupancyRatePercent,
          totalActiveReservations: activeReservations.length
        },
        integration: {
          ...integrationSummary,
          icalFeed: icalSummary,
          googleCalendar: gcalSummary
        },
        guestCrm: {
          totalGuests: crmMetrics.totalGuests,
          vipGuestsCount: crmMetrics.vipGuestsCount,
          frequentGuestsCount: crmMetrics.frequentGuestsCount,
          totalStaysRecorded: crmMetrics.totalStaysRecorded,
          totalRevenueGenerated: crmMetrics.totalRevenueGenerated,
          activeGuestTimelineSummary: guestTimelineSummary
        },
        housekeeping: housekeepingSummary,
        receptionDashboard: {
          summary: receptionDashboard.summary,
          suggestionsCount: receptionDashboard.suggestions.length,
          alertsCount: receptionDashboard.alerts.length,
          vipsCount: receptionDashboard.vips.length,
          topSuggestions: receptionDashboard.suggestions.slice(0, 5),
          topAlerts: receptionDashboard.alerts.slice(0, 5)
        },
        maintenanceDashboard,
        revenueSummary,
        directBookingSummary,
        salesSummary,
        marketingSummary,
        executiveSummary,
        executiveCopilotSummary,
        decisionSummary,
        strategySummary,
        approvalSummary,
        planningSummary,
        executionSummary
      };
    } catch (err: any) {
      console.warn("⚠️ [ContextService] Erro ao carregar contexto PMS via Services:", err?.message || err);
    }

    const operationalContext: OperationalContext = {
      organization,
      property,
      user,
      pmsData,
      sessionHistory,
      guestIntelligence,
      revenueSummary,
      directBookingSummary,
      salesSummary,
      marketingSummary,
      executiveSummary,
      executiveCopilotSummary,
      decisionSummary,
      strategySummary,
      approvalSummary,
      planningSummary,
      executionSummary,
      metadata: {
        timestamp: new Date().toISOString(),
        resolvedFrom: 'pmsService_reservationService_and_n8nService'
      }
    };

    const durationMs = Date.now() - startTime;
    metricsCollector.recordContextBuild(durationMs, false);

    if (env.ENABLE_CACHE) {
      this.cache.set(cacheKey, {
        data: operationalContext,
        expiresAt: Date.now() + cacheConfig.DEFAULT_CONTEXT_CACHE_TTL,
        organizationId: resolvedOrgId,
        propertyId: resolvedPropId
      });
    }

    return operationalContext;
  }
}

export const contextService = new ContextService();
