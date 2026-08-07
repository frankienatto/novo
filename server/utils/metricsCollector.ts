import { reservationRepository } from '../modules/pms/reservationRepository.ts';
import { guestRepository } from '../modules/crm/guestRepository.ts';
import { housekeepingRepository } from '../modules/housekeeping/housekeepingRepository.ts';
import { maintenanceRepository } from '../modules/maintenance/maintenanceRepository.ts';
import { n8nService } from '../modules/integration/n8nService.ts';

class MetricsCollector {
  private httpRequestsTotal = 0;
  private httpResponseTimeTotalMs = 0;

  private contextBuildTotal = 0;
  private contextBuildDurationTotalMs = 0;
  private contextCacheHits = 0;
  private contextCacheMisses = 0;
  private contextCacheInvalidations = 0;

  private aiExecutionsTotal = 0;
  private aiExecutionDurationTotalMs = 0;

  recordHttpRequest(durationMs: number) {
    this.httpRequestsTotal++;
    this.httpResponseTimeTotalMs += durationMs;
  }

  recordContextBuild(durationMs: number, cacheHit: boolean) {
    if (cacheHit) {
      this.contextCacheHits++;
    } else {
      this.contextCacheMisses++;
      this.contextBuildTotal++;
      this.contextBuildDurationTotalMs += durationMs;
    }
  }

  recordContextInvalidation(count = 1) {
    this.contextCacheInvalidations += count;
  }

  recordAiExecution(durationMs: number) {
    this.aiExecutionsTotal++;
    this.aiExecutionDurationTotalMs += durationMs;
  }

  async getMetricsSummary() {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const avgHttpResponseTimeMs = this.httpRequestsTotal > 0 
      ? Number((this.httpResponseTimeTotalMs / this.httpRequestsTotal).toFixed(2)) 
      : 0;

    const avgContextBuildTimeMs = this.contextBuildTotal > 0 
      ? Number((this.contextBuildDurationTotalMs / this.contextBuildTotal).toFixed(2)) 
      : 0;

    const avgAiExecutionTimeMs = this.aiExecutionsTotal > 0 
      ? Number((this.aiExecutionDurationTotalMs / this.aiExecutionsTotal).toFixed(2)) 
      : 0;

    // Entity Counts locais sem chamadas externas
    let totalReservas = 0;
    let totalGuests = 0;
    let totalHousekeepingTasks = 0;
    let totalMaintenanceTasks = 0;
    let totalN8nIntegrations = 0;

    try {
      const reservas = await reservationRepository.findReservations('org_dev_default', 'prop_dev_default');
      totalReservas = reservas.length;
    } catch (_) {}

    try {
      const guests = await guestRepository.listByOrganization('org_dev_default');
      totalGuests = guests.length;
    } catch (_) {}

    try {
      const hkTasks = await housekeepingRepository.findTasks('org_dev_default', 'prop_dev_default');
      totalHousekeepingTasks = hkTasks.length;
    } catch (_) {}

    try {
      const maintTasks = await maintenanceRepository.findTasks('org_dev_default', 'prop_dev_default');
      totalMaintenanceTasks = maintTasks.length;
    } catch (_) {}

    try {
      const n8nSummary = n8nService.getIntegrationSummary('org_dev_default', 'prop_dev_default');
      totalN8nIntegrations = (n8nSummary.icalSyncStatus !== 'NOT_CONFIGURED' || n8nSummary.gcalSyncStatus !== 'NOT_CONFIGURED') ? 1 : 0;
    } catch (_) {}

    return {
      timestamp: new Date().toISOString(),
      server: {
        uptimeSeconds,
        memoryUsage: {
          rssMb: Number((memory.rss / (1024 * 1024)).toFixed(2)),
          heapTotalMb: Number((memory.heapTotal / (1024 * 1024)).toFixed(2)),
          heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(2)),
          externalMb: Number((memory.external / (1024 * 1024)).toFixed(2)),
        }
      },
      http: {
        totalRequests: this.httpRequestsTotal,
        averageResponseTimeMs: avgHttpResponseTimeMs,
      },
      contextService: {
        cacheHits: this.contextCacheHits,
        cacheMisses: this.contextCacheMisses,
        cacheInvalidations: this.contextCacheInvalidations,
        buildCount: this.contextBuildTotal,
        averageBuildTimeMs: avgContextBuildTimeMs,
      },
      aiOrchestrator: {
        totalExecutions: this.aiExecutionsTotal,
        averageExecutionTimeMs: avgAiExecutionTimeMs,
      },
      entitiesCount: {
        reservas: totalReservas,
        hóspedes: totalGuests,
        tarefasHousekeeping: totalHousekeepingTasks,
        tarefasManutenção: totalMaintenanceTasks,
        integraçõesN8n: totalN8nIntegrations,
      }
    };
  }
}

export const metricsCollector = new MetricsCollector();
