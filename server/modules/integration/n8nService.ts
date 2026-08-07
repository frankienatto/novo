import { 
  N8nWebhookPayload, 
  IngestionResult, 
  N8nSyncLog, 
  ICalSyncConfig, 
  GCalSyncConfig 
} from './integrationTypes.ts';
import { alohaIntegrationService } from './alohaIntegrationService.ts';
import { EventNormalizer } from './eventNormalizer.ts';
import { reservationService } from '../pms/reservationService.ts';
import { pmsService } from '../pms/pmsService.ts';
import { contextService } from '../ai/contextService.ts';

export class N8nService {
  private syncLogs: N8nSyncLog[] = [];
  private icalConfigs: Map<string, ICalSyncConfig> = new Map();
  private gcalConfigs: Map<string, GCalSyncConfig> = new Map();

  /**
   * Processa eventos recebidos do n8n (origem Aloha PMS / iCal / Google Calendar)
   */
  async processEvent(payload: N8nWebhookPayload): Promise<IngestionResult> {
    const timestamp = new Date().toISOString();
    const { eventId, eventType, organizationId, propertyId, sourceSystem, payload: data } = payload;

    try {
      if (!organizationId || !propertyId) {
        throw new Error('Header/Campos [organizationId] e [propertyId] são obrigatórios para isolamento multi-tenant.');
      }

      let processedEntityId: string | undefined;
      let message = '';

      switch (eventType) {
        case 'reservation.created': {
          const sanitized = alohaIntegrationService.sanitizeReservationPayload(data);
          const val = alohaIntegrationService.validateReservationPayload(sanitized);
          if (!val.valid) {
            throw new Error(val.error);
          }

          // Resolver UH ID
          let resolvedUnitId = sanitized.unitId;
          if (!resolvedUnitId && sanitized.unitNumber) {
            const units = await pmsService.listUnits(organizationId, propertyId);
            const matchedUnit = units.find(u => u.unitNumber === sanitized.unitNumber);
            if (matchedUnit) {
              resolvedUnitId = matchedUnit.unitId;
            }
          }

          if (!resolvedUnitId) {
            // Fallback: busca a primeira UH disponível no inventário do tenant
            const units = await pmsService.listUnits(organizationId, propertyId);
            if (units.length === 0) {
              throw new Error('Nenhuma Unidade Hoteleira encontrada no inventário da propriedade.');
            }
            resolvedUnitId = units[0].unitId;
          }

          const createDTO = EventNormalizer.toCreateReservationDTO(sanitized, resolvedUnitId);
          const reservation = await reservationService.createReservation(organizationId, propertyId, createDTO);
          
          processedEntityId = reservation.reservationId;
          message = `Reserva sincronizada do Aloha/n8n [ID: ${reservation.reservationId}] para o hóspede ${reservation.guest.fullName}.`;
          break;
        }

        case 'reservation.updated': {
          const sanitized = alohaIntegrationService.sanitizeReservationPayload(data);
          const reservations = await reservationService.listReservations(organizationId, propertyId);
          const existing = reservations.find(
            r => r.notes?.includes(sanitized.alohaReservationId) || r.guest.fullName === sanitized.guestName
          );

          if (!existing) {
            throw new Error(`Reserva com referência Aloha ID [${sanitized.alohaReservationId}] não encontrada no PMS.`);
          }

          processedEntityId = existing.reservationId;
          message = `Atualização da reserva [ID: ${existing.reservationId}] processada via n8n.`;
          break;
        }

        case 'reservation.cancelled': {
          const sanitized = alohaIntegrationService.sanitizeReservationPayload(data);
          const reservations = await reservationService.listReservations(organizationId, propertyId);
          const existing = reservations.find(
            r => r.notes?.includes(sanitized.alohaReservationId) || r.guest.fullName === sanitized.guestName
          );

          if (!existing) {
            throw new Error(`Reserva com referência Aloha ID [${sanitized.alohaReservationId}] não encontrada no PMS para cancelamento.`);
          }

          const cancelledRes = await reservationService.cancelReservation(
            organizationId, 
            propertyId, 
            existing.reservationId, 
            sanitized.notes || 'Cancelamento solicitado via Aloha/n8n'
          );

          processedEntityId = cancelledRes.reservationId;
          message = `Reserva [ID: ${cancelledRes.reservationId}] cancelada via n8n.`;
          break;
        }

        case 'unit.status_changed': {
          const sanitizedStatus = alohaIntegrationService.sanitizeUnitStatusPayload(data);
          let targetUnitId = sanitizedStatus.unitId;

          if (!targetUnitId && sanitizedStatus.unitNumber) {
            const units = await pmsService.listUnits(organizationId, propertyId);
            const matched = units.find(u => u.unitNumber === sanitizedStatus.unitNumber);
            if (matched) {
              targetUnitId = matched.unitId;
            }
          }

          if (!targetUnitId) {
            throw new Error('Identificador da Unidade Hoteleira (unitId ou unitNumber) não informado.');
          }

          const updateDTO = EventNormalizer.toUpdateUnitStatusDTO(sanitizedStatus);
          const updatedUnit = await pmsService.updateUnitStatus(organizationId, propertyId, targetUnitId, updateDTO.status);

          processedEntityId = updatedUnit.unitId;
          message = `Status da UH ${updatedUnit.unitNumber} alterado para '${updatedUnit.status}' via n8n.`;
          break;
        }

        case 'ical.sync_requested': {
          const feedUrl = data.feedUrl;
          this.icalConfigs.set(propertyId, {
            propertyId,
            unitId: data.unitId,
            feedUrl,
            lastSyncedAt: timestamp,
            status: 'ACTIVE'
          });
          message = `Solicitação de sincronização iCal recebida via n8n para a propriedade ${propertyId}.`;
          break;
        }

        case 'gcal.sync_requested': {
          const calendarId = data.calendarId;
          this.gcalConfigs.set(propertyId, {
            propertyId,
            calendarId,
            lastSyncedAt: timestamp,
            status: 'ACTIVE'
          });
          message = `Solicitação de sincronização Google Calendar recebida via n8n para a propriedade ${propertyId}.`;
          break;
        }

        default:
          throw new Error(`Tipo de evento não suportado: '${eventType}'`);
      }

      // Registrar Log de Sucesso
      const log: N8nSyncLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId,
        organizationId,
        propertyId,
        eventType,
        sourceSystem: sourceSystem || 'n8n',
        status: 'SUCCESS',
        message,
        details: { processedEntityId },
        createdAt: timestamp
      };

      this.syncLogs.push(log);
      contextService.invalidateCache(organizationId, propertyId);

      return {
        success: true,
        eventId,
        eventType,
        timestamp,
        processedEntityId,
        message,
        details: { sourceSystem }
      };

    } catch (err: any) {
      const errorMessage = err?.message || 'Erro desconhecido ao processar evento n8n';

      // Registrar Log de Erro
      const errorLog: N8nSyncLog = {
        id: `log_err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId,
        organizationId,
        propertyId,
        eventType,
        sourceSystem: sourceSystem || 'n8n',
        status: 'ERROR',
        message: errorMessage,
        createdAt: timestamp
      };

      this.syncLogs.push(errorLog);

      return {
        success: false,
        eventId,
        eventType,
        timestamp,
        message: `Falha na ingestão n8n: ${errorMessage}`
      };
    }
  }

  /**
   * Retorna os logs de auditoria de sincronização por tenant.
   */
  getSyncLogs(organizationId: string, propertyId?: string): N8nSyncLog[] {
    return this.syncLogs.filter(l => {
      if (l.organizationId !== organizationId) return false;
      if (propertyId && l.propertyId !== propertyId) return false;
      return true;
    });
  }

  /**
   * Retorna o status resumido da integração n8n para o ContextService da IA.
   */
  getIntegrationSummary(organizationId: string, propertyId: string) {
    const logs = this.getSyncLogs(organizationId, propertyId);
    const lastSuccess = logs.filter(l => l.status === 'SUCCESS').slice(-1)[0];
    const icalConfig = this.icalConfigs.get(propertyId);
    const gcalConfig = this.gcalConfigs.get(propertyId);

    return {
      totalEventsProcessed: logs.length,
      lastSyncTimestamp: lastSuccess ? lastSuccess.createdAt : null,
      lastSyncStatus: logs.length > 0 ? logs[logs.length - 1].status : 'IDLE',
      icalSyncStatus: icalConfig ? icalConfig.status : 'NOT_CONFIGURED',
      gcalSyncStatus: gcalConfig ? gcalConfig.status : 'NOT_CONFIGURED'
    };
  }
}

export const n8nService = new N8nService();
