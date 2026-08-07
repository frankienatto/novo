import { AgentSelectionResult } from './aiTypes.ts';
import { agentRouter } from './agentRouter.ts';

export class AgentSelector {
  /**
   * Seleciona deterministicamente o agente de IA delegando ao AgentRouter.
   * Mantém 100% de compatibilidade retroativa com a API existente.
   */
  selectAgent(prompt: string, requestedAgentId?: string): AgentSelectionResult {
    return agentRouter.route(prompt, requestedAgentId);
  }
}

export const agentSelector = new AgentSelector();

