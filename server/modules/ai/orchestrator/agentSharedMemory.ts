import { SharedMemoryItem } from './agentTypes.ts';

export class AgentSharedMemory {
  private memoryStore: Map<string, SharedMemoryItem> = new Map();

  private buildKey(scope: { organizationId: string; propertyId: string; sessionId?: string }, itemKey: string): string {
    const sessionPart = scope.sessionId ? `:${scope.sessionId}` : '';
    return `${scope.organizationId}:${scope.propertyId}${sessionPart}:${itemKey}`;
  }

  /**
   * Armazena um valor na memória compartilhada entre agentes.
   */
  setValue(
    itemKey: string,
    value: any,
    agentId: string,
    scope: { organizationId: string; propertyId: string; sessionId?: string },
    ttlMs?: number
  ): void {
    const compositeKey = this.buildKey(scope, itemKey);
    const item: SharedMemoryItem = {
      key: itemKey,
      value,
      agentId,
      timestamp: new Date().toISOString(),
      ttlMs
    };
    this.memoryStore.set(compositeKey, item);
  }

  /**
   * Obtém um valor da memória compartilhada.
   * Expira itens com TTL ultrapassado.
   */
  getValue<T = any>(
    itemKey: string,
    scope: { organizationId: string; propertyId: string; sessionId?: string }
  ): T | null {
    const compositeKey = this.buildKey(scope, itemKey);
    const item = this.memoryStore.get(compositeKey);

    if (!item) return null;

    if (item.ttlMs) {
      const elapsed = Date.now() - new Date(item.timestamp).getTime();
      if (elapsed > item.ttlMs) {
        this.memoryStore.delete(compositeKey);
        return null;
      }
    }

    return item.value as T;
  }

  /**
   * Retorna todo o estado acumulado da memória compartilhada para um determinado escopo.
   */
  getScopeState(
    scope: { organizationId: string; propertyId: string; sessionId?: string }
  ): Record<string, { value: any; updatedBy: string; updatedAt: string }> {
    const prefix = `${scope.organizationId}:${scope.propertyId}${scope.sessionId ? `:${scope.sessionId}` : ''}:`;
    const result: Record<string, { value: any; updatedBy: string; updatedAt: string }> = {};

    for (const [key, item] of this.memoryStore.entries()) {
      if (key.startsWith(prefix)) {
        if (item.ttlMs) {
          const elapsed = Date.now() - new Date(item.timestamp).getTime();
          if (elapsed > item.ttlMs) {
            this.memoryStore.delete(key);
            continue;
          }
        }
        result[item.key] = {
          value: item.value,
          updatedBy: item.agentId,
          updatedAt: item.timestamp
        };
      }
    }

    return result;
  }

  /**
   * Limpa a memória de um escopo ou toda a memória (para testes).
   */
  clear(scope?: { organizationId: string; propertyId: string; sessionId?: string }): void {
    if (!scope) {
      this.memoryStore.clear();
      return;
    }

    const prefix = `${scope.organizationId}:${scope.propertyId}${scope.sessionId ? `:${scope.sessionId}` : ''}:`;
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const agentSharedMemory = new AgentSharedMemory();
