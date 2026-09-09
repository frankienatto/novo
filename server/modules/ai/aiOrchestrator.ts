import { synapseAgentOrchestrator } from "./orchestrator/synapseAgentOrchestrator.ts";
import { agentRouter } from "./agentRouter.ts";
import { contextService } from "./contextService.ts";
import { 
  OperationalContext, 
  AgentSelectionResult 
} from "./aiTypes.ts";
import type { Permission } from '../saas/saasTypes.ts';
import { aiAuditRepository, createAiRunAudit } from './aiAuditRepository.ts';
import { AGENT_ACTION_ALLOWLIST } from './agentActions.ts';

export interface AiOrchestratorParams {
  prompt: string;
  agentId?: string;
  sessionId?: string;
  organizationId?: string;
  propertyId?: string;
  userId?: string;
  permissions?: Permission[];
  schema?: any;
  systemInstruction?: string;
  context?: Record<string, any>;
  modelName?: string;
}

export interface AiOrchestratorResult {
  text: string;
  data?: any;
  agentId: string;
  agentSelection: AgentSelectionResult;
  operationalContext: OperationalContext;
  sessionId: string;
  source: string;
}

export class AiOrchestrator {
  /**
   * Ponto central de orquestração do pipeline de IA.
   * Delega para o SynapseAgentOrchestrator mantendo 100% de compatibilidade retroativa.
   */
  async execute(params: AiOrchestratorParams): Promise<AiOrchestratorResult> {
    const {
      prompt,
      agentId: requestedAgentId,
      sessionId: rawSessionId,
      organizationId,
      propertyId,
      userId,
      permissions,
      schema,
      systemInstruction,
      context,
      modelName = "gemini-3.6-flash"
    } = params;

    if (!organizationId || !propertyId || !userId) throw new Error('Contexto autenticado de organização, propriedade e usuário é obrigatório.');
    const sessionId = rawSessionId || `session_${organizationId}_${propertyId}`;

    const orchResult = await synapseAgentOrchestrator.execute({
      prompt,
      agentId: requestedAgentId,
      sessionId,
      organizationId,
      propertyId,
      userId,
      permissions,
      schema,
      systemInstruction,
      context,
      modelName
    });

    const agentSelection = agentRouter.route(prompt, orchResult.primaryAgentId);
    const operationalContext = await contextService.buildOperationalContext(
      organizationId,
      propertyId,
      userId,
      sessionId
    );

    const proposedActions = Array.isArray(orchResult.data?.proposedActions) ? orchResult.data.proposedActions : [];
    await aiAuditRepository.record(createAiRunAudit({
      organizationId,
      propertyId,
      agentId: orchResult.primaryAgentId,
      actorUserId: userId,
      status: 'completed',
      task: prompt,
      proposedActionTypes: proposedActions.map((action: { type?: string }) => action.type || 'unknown'),
      requiresApproval: proposedActions.some((action: { type?: keyof typeof AGENT_ACTION_ALLOWLIST }) => action.type && AGENT_ACTION_ALLOWLIST[action.type]?.requiresApproval),
      resultStatus: 'generated',
      provider: orchResult.source
    }));

    return {
      text: orchResult.text,
      data: orchResult.data,
      agentId: orchResult.primaryAgentId,
      agentSelection,
      operationalContext,
      sessionId,
      source: orchResult.source
    };
  }
}

export const aiOrchestrator = new AiOrchestrator();

