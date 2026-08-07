import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { logger } from '../../../utils/logger.ts';

export type PlanningTriggerType = 'PERIODIC_SCHEDULE' | 'KPI_THRESHOLD_BREACHED' | 'EVENT_DRIVEN' | 'MANUAL_EXECUTIVE_REQUEST';

export interface PlanningTrigger {
  triggerId: string;
  type: PlanningTriggerType;
  organizationId: string;
  propertyId: string;
  reason: string;
  timestamp: string;
}

export class StrategicScheduler {
  private activeTriggers: PlanningTrigger[] = [];
  private onTriggerCallback?: (trigger: PlanningTrigger) => Promise<void>;

  constructor() {
    // Inscrever escuta no EventBus para gatilhos operacionais de variação crítica
    agentEventBus.subscribe('kpi:threshold_breached', async (event) => {
      const { organizationId, propertyId, metricName, value } = event.payload || {};
      if (organizationId && propertyId) {
        this.emitTrigger({
          triggerId: `trig_kpi_${Date.now()}`,
          type: 'KPI_THRESHOLD_BREACHED',
          organizationId,
          propertyId,
          reason: `Variação de KPI detectada: ${metricName} = ${value}`,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  public registerTriggerCallback(callback: (trigger: PlanningTrigger) => Promise<void>): void {
    this.onTriggerCallback = callback;
  }

  public emitTrigger(trigger: PlanningTrigger): void {
    this.activeTriggers.push(trigger);
    logger.info(`[StrategicScheduler] Gatilho de planejamento ativado: ${trigger.type} (${trigger.reason})`, { triggerId: trigger.triggerId }, 'STRATEGIC_PLANNING');

    if (this.onTriggerCallback) {
      this.onTriggerCallback(trigger).catch(err => {
        logger.error(`[StrategicScheduler] Erro ao processar callback de gatilho de planejamento: ${err?.message}`);
      });
    }
  }

  public getActiveTriggers(): PlanningTrigger[] {
    return [...this.activeTriggers];
  }

  public clearTriggers(): void {
    this.activeTriggers = [];
  }
}

export const strategicScheduler = new StrategicScheduler();
