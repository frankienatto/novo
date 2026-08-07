import { synapseAgentOrchestrator } from "./orchestrator/synapseAgentOrchestrator.ts";
import { agentRouter } from "./agentRouter.ts";
import { contextService } from "./contextService.ts";
import { 
  OperationalContext, 
  AgentSelectionResult 
} from "./aiTypes.ts";

export interface AiOrchestratorParams {
  prompt: string;
  agentId?: string;
  sessionId?: string;
  organizationId?: string;
  propertyId?: string;
  userId?: string;
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
      organizationId = 'org_dev_default',
      propertyId = 'prop_dev_default',
      userId = 'usr_dev_default',
      schema,
      systemInstruction,
      context,
      modelName = "gemini-3.6-flash"
    } = params;

    const sessionId = rawSessionId || `session_${organizationId}_${propertyId}`;

    const orchResult = await synapseAgentOrchestrator.execute({
      prompt,
      agentId: requestedAgentId,
      sessionId,
      organizationId,
      propertyId,
      userId,
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

