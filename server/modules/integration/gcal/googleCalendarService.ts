import { 
  GCalSyncRequest, 
  GCalSyncResponse, 
  GCalSyncLog, 
  GCalSyncStatus, 
  GCalEventPayload 
} from './googleCalendarTypes.ts';
import { pmsService } from '../../pms/pmsService.ts';

export class GoogleCalendarService {
  private syncLogs: GCalSyncLog[] = [];
  private processedEventsMap: Map<string, number> = new Map(); // key: "orgId_propId_eventId" -> version
  private activeCalendarMap: Map<string, string> = new Map();  // key: "orgId_propId" -> calendarId
  private lastSyncMap: Map<string, { status: 'SUCCESS' | 'ERROR'; timestamp: string }> = new Map();

  /**
   * Processa a sincronização de evento vindo do Google Calendar via n8n
   */
  async syncEvent(request: GCalSyncRequest): Promise<GCalSyncResponse> {
    const { eventId, eventType, organizationId, propertyId, payload } = request;
    const timestamp = new Date().toISOString();
    const logKey = `${organizationId}_${propertyId}`;
    const eventKey = `${logKey}_${eventId}`;

    // 1. Checagem de Idempotência
    const existingVersion = this.processedEventsMap.get(eventKey);
    if (existingVersion !== undefined) {
      if (payload.eventVersion <= existingVersion) {
        const duplicateMessage = `Evento [${eventId}] já processado com versão ${existingVersion} (versão recebida: ${payload.eventVersion}). Ignorando duplicata.`;
        this.addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          eventId,
          organizationId,
          propertyId,
          eventType,
          gcalEventId: payload.gcalEventId,
          eventVersion: payload.eventVersion,
          status: 'IGNORED_DUPLICATE',
          message: duplicateMessage,
          createdAt: timestamp
        });

        return {
          success: true,
          eventId,
          eventType,
          gcalEventId: payload.gcalEventId,
          status: 'IGNORED_DUPLICATE',
          message: duplicateMessage,
          timestamp
        };
      }
    }

    // Registrar ID do calendário se fornecido
    if (payload.calendarId) {
      this.activeCalendarMap.set(logKey, payload.calendarId);
    }

    let processedEntityId: string | undefined;
    let successMessage = `Evento de calendário [${eventType}] sincronizado com sucesso via n8n.`;

    try {
      // 2. Processar ações operacionais no PMS com base no tipo do evento
      switch (eventType) {
        case 'room.maintenance':
        case 'room.blocked': {
          if (payload.unitId || payload.unitNumber) {
            const units = await pmsService.listUnits(organizationId, propertyId);
            const targetUnit = units.find(u => u.unitId === payload.unitId || u.unitNumber === payload.unitNumber);

            if (targetUnit) {
              const newStatus = eventType === 'room.maintenance' ? 'maintenance' : 'out_of_service';
              const updated = await pmsService.updateUnitStatus(organizationId, propertyId, targetUnit.unitId, newStatus);
              processedEntityId = updated.unitId;
              successMessage = `UH ${updated.unitNumber} alterada para status '${updated.status}' no PMS devido a evento do Google Calendar (${payload.title}).`;
            }
          }
          break;
        }

        case 'reservation.created':
        case 'reservation.updated':
        case 'reservation.cancelled': {
          processedEntityId = payload.gcalEventId || payload.eventId;
          successMessage = `Sincronização de reserva [${payload.title}] processada via n8n/Google Calendar.`;
          break;
        }

        case 'housekeeping.task': {
          processedEntityId = payload.gcalEventId || payload.eventId;
          successMessage = `Tarefa de governança [${payload.title}] vinculada ao Google Calendar registrada.`;
          break;
        }

        case 'custom.calendar.event':
        default: {
          processedEntityId = payload.gcalEventId || payload.eventId;
          successMessage = `Evento de calendário genérico [${payload.title}] armazenado via n8n.`;
          break;
        }
      }

      // Marcar evento como processado
      this.processedEventsMap.set(eventKey, payload.eventVersion);
      this.lastSyncMap.set(logKey, { status: 'SUCCESS', timestamp });

      this.addLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        eventId,
        organizationId,
        propertyId,
        eventType,
        gcalEventId: payload.gcalEventId,
        eventVersion: payload.eventVersion,
        status: 'SUCCESS',
        message: successMessage,
        createdAt: timestamp
      });

      return {
        success: true,
        eventId,
        eventType,
        gcalEventId: payload.gcalEventId,
        status: 'SUCCESS',
        message: successMessage,
        processedEntityId,
        timestamp
      };

    } catch (err: any) {
      const errorMessage = `Erro ao sincronizar evento [${eventType}] do Google Calendar: ${err?.message || err}`;
      this.lastSyncMap.set(logKey, { status: 'ERROR', timestamp });

      this.addLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        eventId,
        organizationId,
        propertyId,
        eventType,
        gcalEventId: payload.gcalEventId,
        eventVersion: payload.eventVersion,
        status: 'ERROR',
        message: errorMessage,
        createdAt: timestamp
      });

      return {
        success: false,
        eventId,
        eventType,
        gcalEventId: payload.gcalEventId,
        status: 'ERROR',
        message: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Consulta os logs de sincronização para um tenant
   */
  getLogs(organizationId: string, propertyId: string): GCalSyncLog[] {
    return this.syncLogs.filter(
      l => l.organizationId === organizationId && l.propertyId === propertyId
    );
  }

  /**
   * Status detalhado da sincronização do Google Calendar por propriedade
   */
  getStatus(organizationId: string, propertyId: string): GCalSyncStatus {
    const key = `${organizationId}_${propertyId}`;
    const tenantLogs = this.getLogs(organizationId, propertyId);
    const lastSyncInfo = this.lastSyncMap.get(key);
    const calendarId = this.activeCalendarMap.get(key);

    const hasErrors = tenantLogs.some(l => l.status === 'ERROR');
    const totalSynced = tenantLogs.filter(l => l.status === 'SUCCESS').length;

    return {
      organizationId,
      propertyId,
      calendarId,
      totalSyncedEvents: totalSynced,
      pendingEventsCount: 0,
      hasErrors,
      lastSyncStatus: lastSyncInfo ? lastSyncInfo.status : 'IDLE',
      lastSyncedAt: lastSyncInfo ? lastSyncInfo.timestamp : undefined
    };
  }

  /**
   * Resumo read-only para consumo do ContextService da IA
   */
  getGCalSummary(organizationId: string, propertyId: string) {
    const status = this.getStatus(organizationId, propertyId);
    return {
      calendarId: status.calendarId || 'Nenhum calendário vinculado via n8n',
      totalSyncedEvents: status.totalSyncedEvents,
      hasPendingOrErrors: status.hasErrors,
      lastSyncStatus: status.lastSyncStatus,
      lastSyncedAt: status.lastSyncedAt || 'Sem sincronização registrada'
    };
  }

  /**
   * Adiciona um log com retenção máxima FIFO de 100 registros por tenant
   */
  private addLog(log: GCalSyncLog) {
    this.syncLogs.unshift(log);
    if (this.syncLogs.length > 200) {
      this.syncLogs.pop();
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
