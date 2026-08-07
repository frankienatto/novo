export type AgentAuthorityLevel = 'READ_ONLY' | 'ASSISTED' | 'HUMAN_APPROVAL_REQUIRED';

export type ExecutionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AgentDeclaration {
  agentId: string;
  name: string;
  domain: string;
  responsibilities: string[];
  tools: string[];
  eventsConsumed: string[];
  eventsPublished: string[];
  authorityLevel: AgentAuthorityLevel;
}

export interface AgentEvent {
  eventId: string;
  eventName: string;
  publisherAgentId: string;
  timestamp: string;
  organizationId: string;
  propertyId: string;
  sessionId?: string;
  payload: Record<string, any>;
}

export interface SharedMemoryItem {
  key: string;
  value: any;
  agentId: string;
  timestamp: string;
  ttlMs?: number;
}

export interface OrchestratedContext {
  sessionContext: {
    sessionId: string;
    historyCount: number;
    lastMessageAt?: string;
  };
  propertyContext: {
    organizationId: string;
    propertyId: string;
    propertyName: string;
    propertyType: string;
  };
  userContext: {
    userId: string;
    userName: string;
    userRole: string;
  };
  operationalContext: Record<string, any>;
  executiveContext: Record<string, any>;
}

export interface OrchestrationDecision {
  primaryAgentId: string;
  collaboratingAgentIds: string[];
  excludedAgentIds: string[];
  decisionReason: string;
  priority: ExecutionPriority;
}

export interface OrchestrationResult {
  text: string;
  data: any;
  primaryAgentId: string;
  collaboratingAgentIds: string[];
  decisionReason: string;
  executionTimeMs: number;
  generatedEvents: AgentEvent[];
  sharedMemoryKeysUpdated: string[];
  source: string;
  orchestratedContext: OrchestratedContext;
}
