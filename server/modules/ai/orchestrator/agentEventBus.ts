import { AgentEvent } from './agentTypes.ts';

type EventListener = (event: AgentEvent) => void | Promise<void>;

export class AgentEventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventHistory: AgentEvent[] = [];
  private readonly maxHistorySize = 500;

  /**
   * Publica um novo evento no Event Bus interno do Synapse.
   */
  publishEvent(
    eventInput: Omit<AgentEvent, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: string }
  ): AgentEvent {
    const fullEvent: AgentEvent = {
      eventId: eventInput.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: eventInput.timestamp || new Date().toISOString(),
      eventName: eventInput.eventName,
      publisherAgentId: eventInput.publisherAgentId,
      organizationId: eventInput.organizationId,
      propertyId: eventInput.propertyId,
      sessionId: eventInput.sessionId,
      payload: eventInput.payload || {}
    };

    // Armazenar na memória de histórico
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notificar ouvintes específicos e globais ('*')
    const specificListeners = this.listeners.get(fullEvent.eventName) || [];
    const wildcardListeners = this.listeners.get('*') || [];
    const allListeners = [...specificListeners, ...wildcardListeners];

    for (const listener of allListeners) {
      try {
        Promise.resolve(listener(fullEvent)).catch(err => {
          console.error(`❌ [AgentEventBus] Erro ao processar ouvinte de '${fullEvent.eventName}':`, err);
        });
      } catch (err) {
        console.error(`❌ [AgentEventBus] Erro síncrono no ouvinte de '${fullEvent.eventName}':`, err);
      }
    }

    return fullEvent;
  }

  /**
   * Inscreve um ouvinte para um evento específico ou '*' (todos os eventos).
   * Retorna função de desinscrição (unsubscribe).
   */
  subscribe(eventName: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);

    return () => {
      const current = this.listeners.get(eventName) || [];
      this.listeners.set(
        eventName,
        current.filter(l => l !== listener)
      );
    };
  }

  /**
   * Retorna o histórico recente de eventos filtrado.
   */
  getEventHistory(filter?: {
    organizationId?: string;
    propertyId?: string;
    sessionId?: string;
    eventName?: string;
    publisherAgentId?: string;
    limit?: number;
  }): AgentEvent[] {
    let filtered = [...this.eventHistory];

    if (filter) {
      if (filter.organizationId) {
        filtered = filtered.filter(e => e.organizationId === filter.organizationId);
      }
      if (filter.propertyId) {
        filtered = filtered.filter(e => e.propertyId === filter.propertyId);
      }
      if (filter.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.eventName) {
        filtered = filtered.filter(e => e.eventName === filter.eventName);
      }
      if (filter.publisherAgentId) {
        filtered = filtered.filter(e => e.publisherAgentId === filter.publisherAgentId);
      }
    }

    const limit = filter?.limit || 50;
    return filtered.slice(-limit);
  }

  /**
   * Limpa o histórico de eventos (útil para testes).
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

export const agentEventBus = new AgentEventBus();
