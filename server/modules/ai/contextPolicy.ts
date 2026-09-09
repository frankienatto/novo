import type { OperationalContext } from './aiTypes.ts';

export type AgentContextBlock = 'pms' | 'reception' | 'housekeeping' | 'maintenance' | 'crm' | 'revenue' | 'sales' | 'marketing' | 'executive' | 'governance';

const policy: Record<string, AgentContextBlock[]> = {
  reception_agent: ['pms', 'reception'], housekeeping_agent: ['pms', 'housekeeping'], maintenance_agent: ['pms', 'maintenance'],
  revenue_agent: ['pms', 'revenue'], financial_agent: ['revenue'], direct_booking_agent: ['pms', 'sales', 'crm'],
  sales_agent: ['sales', 'crm'], marketing_agent: ['marketing', 'crm'], concierge_agent: ['crm'], guest_concierge: ['crm'],
  executive_agent: ['pms', 'revenue', 'housekeeping', 'maintenance', 'sales', 'marketing', 'executive', 'governance'],
  executive_copilot_agent: ['pms', 'revenue', 'housekeeping', 'maintenance', 'sales', 'marketing', 'executive', 'governance'],
  decision_agent: ['executive', 'governance'], approval_agent: ['governance'], planning_agent: ['governance', 'executive'],
  execution_agent: ['governance', 'housekeeping', 'maintenance'],
  synapse_copilot: ['pms', 'reception', 'housekeeping', 'maintenance', 'revenue', 'sales', 'marketing', 'executive', 'governance'],
  default_agent: ['pms', 'executive']
};

const sensitiveKey = /(?:password|secret|token|document|passport|cpf|payment|stripe|card|amountpaid|totalamount|balance|webhook|internalnotes?|notes?|email|phone|fullName|guestName)/i;

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKey.test(key))
    .map(([key, child]) => [key, scrub(child)]));
}

function reservationSummary(reservations: any[]): Array<Record<string, unknown>> {
  return reservations.map((reservation) => ({ reservationId: reservation.reservationId, unitId: reservation.unitId, status: reservation.status, checkInDate: reservation.stayPeriod?.checkInDate, checkOutDate: reservation.stayPeriod?.checkOutDate, numberOfNights: reservation.stayPeriod?.numberOfNights }));
}

/** Selects only the minimum operational blocks permitted for an agent and strips PII/secrets. */
export function buildContextForAgent(agentId: string, context: OperationalContext): OperationalContext {
  const blocks = policy[agentId] || policy.default_agent;
  const pms = context.pmsData;
  const selectedPms = blocks.includes('pms') && pms ? {
    summary: scrub(pms.summary),
    units: (pms.units || []).map((unit: any) => scrub({ unitId: unit.unitId, unitNumber: unit.unitNumber, status: unit.status, categoryId: unit.categoryId, active: unit.active })),
    reservations: reservationSummary(pms.reservations || []),
    ...(blocks.includes('housekeeping') ? { housekeeping: scrub(pms.housekeeping) } : {}),
    ...(blocks.includes('reception') ? { receptionDashboard: scrub(pms.receptionDashboard) } : {}),
    ...(blocks.includes('maintenance') ? { maintenanceDashboard: scrub(pms.maintenanceDashboard) } : {})
  } : null;

  return {
    organization: context.organization ? { ...context.organization } : null,
    property: context.property ? { ...context.property } : null,
    user: context.user ? { userId: context.user.userId, role: context.user.role, name: context.user.name } : null,
    pmsData: selectedPms as OperationalContext['pmsData'],
    sessionHistory: context.sessionHistory.map(({ id, role, timestamp }) => ({ id, role, timestamp, content: '[mensagem de sessão não enviada ao provider]' })),
    ...(blocks.includes('crm') ? { guestIntelligence: scrub(context.guestIntelligence) as OperationalContext['guestIntelligence'] } : {}),
    ...(blocks.includes('revenue') ? { revenueSummary: scrub(context.revenueSummary) as OperationalContext['revenueSummary'] } : {}),
    ...(blocks.includes('sales') ? { salesSummary: scrub(context.salesSummary) as OperationalContext['salesSummary'] } : {}),
    ...(blocks.includes('marketing') ? { marketingSummary: scrub(context.marketingSummary) as OperationalContext['marketingSummary'] } : {}),
    ...(blocks.includes('executive') ? { executiveSummary: scrub(context.executiveSummary) as OperationalContext['executiveSummary'], executiveCopilotSummary: scrub(context.executiveCopilotSummary) as OperationalContext['executiveCopilotSummary'] } : {}),
    ...(blocks.includes('governance') ? { decisionSummary: scrub(context.decisionSummary) as OperationalContext['decisionSummary'], approvalSummary: scrub(context.approvalSummary) as OperationalContext['approvalSummary'], planningSummary: scrub(context.planningSummary) as OperationalContext['planningSummary'], executionSummary: scrub(context.executionSummary) as OperationalContext['executionSummary'] } : {}),
    metadata: { timestamp: context.metadata.timestamp, contextPolicy: `minimum:${agentId}` }
  };
}

export function getAgentContextBlocks(agentId: string): AgentContextBlock[] { return [...(policy[agentId] || policy.default_agent)]; }
