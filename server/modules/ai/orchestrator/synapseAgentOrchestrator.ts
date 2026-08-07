import { GoogleGenAI } from "@google/genai";
import { 
  AgentDeclaration, 
  AgentEvent, 
  ExecutionPriority, 
  OrchestratedContext, 
  OrchestrationDecision, 
  OrchestrationResult 
} from './agentTypes.ts';
import { getAgentDeclaration, getAllAgentDeclarations } from './agentRegistry.ts';
import { agentEventBus } from './agentEventBus.ts';
import { agentSharedMemory } from './agentSharedMemory.ts';
import { agentRouter } from '../agentRouter.ts';
import { contextService } from '../contextService.ts';
import { sessionMemory } from '../sessionMemory.ts';
import { compileSystemInstruction } from '../../../ai/promptRegistry.ts';
import { metricsCollector } from '../../../utils/metricsCollector.ts';
import { logger } from '../../../utils/logger.ts';
import { goalEngine } from '../goals/goalEngine.ts';

export interface SynapseOrchestratorParams {
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
  priority?: ExecutionPriority;
}

const sleepServer = (ms: number) => new Promise(res => setTimeout(res, ms));

async function withRetryServer<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = String(error?.message || error || "");
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('UNAVAILABLE')) {
        const backoffMs = Math.pow(2, i) * 1000 + Math.floor(Math.random() * 500);
        console.warn(`⚠️ [SynapseAgentOrchestrator RateLimit] Tentativa ${i + 1}/${retries} aguardando ${backoffMs}ms...`);
        await sleepServer(backoffMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export class SynapseAgentOrchestrator {
  private activeExecutions: Set<string> = new Set();

  /**
   * Decide de forma automática e determinística o agente primário, agentes colaboradores,
   * agentes excluídos e prioridade da requisição.
   */
  public evaluateOrchestrationDecision(
    prompt: string,
    requestedAgentId?: string,
    overridePriority?: ExecutionPriority
  ): OrchestrationDecision {
    // 1. Seleção determinística do Agente Primário via AgentRouter
    const selection = agentRouter.route(prompt, requestedAgentId);
    const primaryAgentId = selection.agentId;
    const primaryDecl = getAgentDeclaration(primaryAgentId);

    // 2. Determinação da Prioridade
    let priority: ExecutionPriority = overridePriority || 'MEDIUM';
    const lowerPrompt = (prompt || '').toLowerCase();

    if (
      lowerPrompt.includes('urgente') ||
      lowerPrompt.includes('crítico') ||
      lowerPrompt.includes('critico') ||
      lowerPrompt.includes('emergência') ||
      lowerPrompt.includes('emergencia') ||
      lowerPrompt.includes('overbooking') ||
      lowerPrompt.includes('vazamento') ||
      lowerPrompt.includes('bloqueio')
    ) {
      priority = 'CRITICAL';
    } else if (
      lowerPrompt.includes('estratégia') ||
      lowerPrompt.includes('estrategia') ||
      lowerPrompt.includes('aprovação') ||
      lowerPrompt.includes('aprovacao') ||
      lowerPrompt.includes('diretoria') ||
      lowerPrompt.includes('receita') ||
      lowerPrompt.includes('faturamento')
    ) {
      priority = 'HIGH';
    }

    // 3. Mapeamento de Agentes Colaboradores por Domínio
    const allDeclarations = getAllAgentDeclarations();
    const collaboratingAgentIds: string[] = [];

    // Mapeamento explícito de cooperação inter-agentes para enriquecimento de contexto sem execução direta
    const collaborationMap: Record<string, string[]> = {
      reception_agent: ['housekeeping_agent', 'concierge_agent'],
      housekeeping_agent: ['maintenance_agent', 'reception_agent'],
      maintenance_agent: ['housekeeping_agent', 'reception_agent'],
      revenue_agent: ['direct_booking_agent', 'sales_agent', 'dynamic_pricing'],
      direct_booking_agent: ['sales_agent', 'revenue_agent'],
      sales_agent: ['marketing_agent', 'direct_booking_agent'],
      marketing_agent: ['sales_agent', 'direct_booking_agent', 'marketing_generator'],
      financial_agent: ['revenue_agent', 'financial_consultant'],
      executive_agent: ['executive_copilot_agent', 'decision_agent', 'strategy_agent'],
      executive_copilot_agent: ['executive_agent', 'decision_agent', 'strategy_agent'],
      decision_agent: ['approval_agent', 'planning_agent', 'executive_agent'],
      approval_agent: ['decision_agent', 'planning_agent'],
      planning_agent: ['execution_agent', 'decision_agent'],
      execution_agent: ['planning_agent', 'housekeeping_agent', 'maintenance_agent'],
      strategy_agent: ['executive_copilot_agent', 'decision_agent']
    };

    const candidates = collaborationMap[primaryAgentId] || [];
    for (const candId of candidates) {
      if (candId !== primaryAgentId && !collaboratingAgentIds.includes(candId)) {
        collaboratingAgentIds.push(candId);
      }
    }

    // 4. Identificação dos Agentes Excluídos
    const excludedAgentIds = allDeclarations
      .map(a => a.agentId)
      .filter(id => id !== primaryAgentId && !collaboratingAgentIds.includes(id));

    // 5. Motivo da Decisão
    const decisionReason = `Agente Primário '${primaryDecl.name}' (${primaryAgentId}) selecionado com confiança ${selection.confidence}. Colaboração habilitada para: [${collaboratingAgentIds.join(', ') || 'Nenhum'}]. Agentes fora do escopo do domínio [${excludedAgentIds.length}] pausados. Prioridade: ${priority}.`;

    return {
      primaryAgentId,
      collaboratingAgentIds,
      excludedAgentIds,
      decisionReason,
      priority
    };
  }

  /**
   * Constrói e organiza os 5 Contextos Centrais do Synapse.
   */
  public async buildOrchestratedContext(
    organizationId: string,
    propertyId: string,
    userId: string,
    sessionId: string
  ): Promise<OrchestratedContext> {
    const rawOpContext = await contextService.buildOperationalContext(
      organizationId,
      propertyId,
      userId,
      sessionId
    );

    const sessionHistory = rawOpContext.sessionHistory || [];
    const lastMsg = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : undefined;

    const activeGoals = goalEngine.listGoals({ organizationId, propertyId }).filter(
      g => ['CREATED', 'PLANNED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'VALIDATING'].includes(g.status)
    );
    const activeGoalContexts = activeGoals.map(g => goalEngine.buildGoalExecutionContext(g));

    return {
      sessionContext: {
        sessionId,
        historyCount: sessionHistory.length,
        lastMessageAt: lastMsg?.timestamp
      },
      propertyContext: {
        organizationId: rawOpContext.organization?.organizationId || organizationId,
        propertyId: rawOpContext.property?.propertyId || propertyId,
        propertyName: rawOpContext.property?.name || rawOpContext.organization?.name || 'Forest House Beach',
        propertyType: rawOpContext.property?.type || 'Hotel'
      },
      userContext: {
        userId: rawOpContext.user?.userId || userId || 'usr_default',
        userName: rawOpContext.user?.name || 'Operador Synapse',
        userRole: rawOpContext.user?.role || 'Operador'
      },
      operationalContext: {
        pmsSummary: rawOpContext.pmsData?.summary || null,
        units: rawOpContext.pmsData?.units || [],
        reservations: rawOpContext.pmsData?.reservations || [],
        housekeeping: rawOpContext.pmsData?.housekeeping || null,
        receptionDashboard: rawOpContext.pmsData?.receptionDashboard || null,
        maintenanceDashboard: rawOpContext.pmsData?.maintenanceDashboard || null,
        guestIntelligence: rawOpContext.guestIntelligence || null
      },
      executiveContext: {
        executiveSummary: rawOpContext.executiveSummary || null,
        executiveCopilotSummary: rawOpContext.executiveCopilotSummary || null,
        decisionSummary: rawOpContext.decisionSummary || null,
        strategySummary: rawOpContext.strategySummary || null,
        approvalSummary: rawOpContext.approvalSummary || null,
        planningSummary: rawOpContext.planningSummary || null,
        executionSummary: rawOpContext.executionSummary || null,
        revenueSummary: rawOpContext.revenueSummary || null,
        directBookingSummary: rawOpContext.directBookingSummary || null,
        salesSummary: rawOpContext.salesSummary || null,
        marketingSummary: rawOpContext.marketingSummary || null,
        activeStrategicGoals: activeGoalContexts
      }
    };
  }

  /**
   * Ponto Central de Execução Coordenada do Agent Orchestrator.
   */
  async execute(params: SynapseOrchestratorParams): Promise<OrchestrationResult> {
    const startTime = Date.now();
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
      modelName = "gemini-3.6-flash",
      priority: overridePriority
    } = params;

    const sessionId = rawSessionId || `session_${organizationId}_${propertyId}`;

    // 1. Prevenção de Execução Duplicada (Concurrency Lock)
    const promptHash = String(prompt || '').trim().toLowerCase().substring(0, 80);
    const executionKey = `${organizationId}:${propertyId}:${sessionId}:${promptHash}`;

    if (this.activeExecutions.has(executionKey)) {
      console.warn(`⚠️ [SynapseAgentOrchestrator] Execução duplicada detectada para key '${executionKey}'. Aguardando liberação.`);
      await sleepServer(300);
    }
    this.activeExecutions.add(executionKey);

    try {
      // 2. Avaliação de Decisão de Orquestração
      const decision = this.evaluateOrchestrationDecision(prompt, requestedAgentId, overridePriority);
      const primaryDecl = getAgentDeclaration(decision.primaryAgentId);

      // 3. Construção dos 5 Contextos
      const orchestratedContext = await this.buildOrchestratedContext(
        organizationId,
        propertyId,
        userId,
        sessionId
      );

      // 4. Injeção de Memória Compartilhada dos Agentes Colaboradores
      const scope = { organizationId, propertyId, sessionId };
      const sharedState = agentSharedMemory.getScopeState(scope);

      // 5. Emissão do Evento de Início no Event Bus
      const generatedEvents: AgentEvent[] = [];
      const startEvent = agentEventBus.publishEvent({
        eventName: 'orchestrator:execution_started',
        publisherAgentId: 'synapse_orchestrator',
        organizationId,
        propertyId,
        sessionId,
        payload: {
          primaryAgentId: decision.primaryAgentId,
          collaboratingAgentIds: decision.collaboratingAgentIds,
          priority: decision.priority,
          prompt
        }
      });
      generatedEvents.push(startEvent);

      // 6. Armazenamento da mensagem do usuário na SessionMemory
      await sessionMemory.addMessage(
        sessionId,
        { role: 'user', content: prompt },
        { organizationId, propertyId, agentId: decision.primaryAgentId }
      );

      // 7. Reconstruir OperationalContext completo para compatibilidade com o PromptRegistry
      const fullOpContext = await contextService.buildOperationalContext(
        organizationId,
        propertyId,
        userId,
        sessionId
      );

      // Enriquecer context com dados da Memória Compartilhada, Agentes Colaboradores e Goals
      const activeGoalsForOrg = goalEngine.listGoals({ organizationId, propertyId }).filter(
        g => ['CREATED', 'PLANNED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'VALIDATING'].includes(g.status)
      );

      const enrichedContext = {
        ...(context || {}),
        sharedMemoryState: sharedState,
        activeStrategicGoals: activeGoalsForOrg.map(g => goalEngine.buildGoalExecutionContext(g)),
        goalExecutionContext: activeGoalsForOrg[0] ? goalEngine.buildGoalExecutionContext(activeGoalsForOrg[0]) : null,
        collaboratingAgents: decision.collaboratingAgentIds.map(id => {
          const decl = getAgentDeclaration(id);
          return { agentId: decl.agentId, name: decl.name, domain: decl.domain };
        }),
        orchestrationPriority: decision.priority
      };

      // 8. Compilação da SystemInstruction via PromptRegistry
      const compiledInstruction = compileSystemInstruction(
        decision.primaryAgentId,
        systemInstruction,
        enrichedContext,
        fullOpContext
      );

      // 9. Formatar prompt com histórico
      let fullPromptContents = prompt;
      if (fullOpContext.sessionHistory && fullOpContext.sessionHistory.length > 1) {
        const previousHistory = fullOpContext.sessionHistory.slice(0, -1);
        if (previousHistory.length > 0) {
          const historyStr = previousHistory
            .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
            .join('\n');
          fullPromptContents = `HISTÓRICO DA CONVERSA:\n${historyStr}\n\nMENSAGEM ATUAL DO USUÁRIO:\n${prompt}`;
        }
      }

      // 10. Chamada ao Modelo Gemini ou Fallback
      let responseText = "";
      let parsedData: any = null;
      let source = modelName;

      if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ [SynapseAgentOrchestrator] Servidor sem GEMINI_API_KEY. Gerando resposta de fallback.");
        responseText = `[Synapse Agent Orchestrator - Agente: ${decision.primaryAgentId}] Processado com sucesso para a propriedade '${orchestratedContext.propertyContext.propertyName}'. Solicitação: "${prompt}"`;
        source = "fallback_mock";
      } else {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'synapse-ahos-server' } }
          });

          const result = await withRetryServer(async () => {
            return await ai.models.generateContent({
              model: modelName,
              contents: fullPromptContents,
              config: {
                systemInstruction: compiledInstruction,
                ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {})
              }
            });
          });

          responseText = result.text || "";
          if (!responseText) {
            throw new Error("Resposta vazia retornada pelo modelo Gemini.");
          }
        } catch (geminiError: any) {
          console.warn("⚠️ [SynapseAgentOrchestrator] Chamada ao Gemini falhou:", geminiError?.message || geminiError);
          source = "fallback_mock";
          responseText = `[Synapse Agent Orchestrator - Agente: ${decision.primaryAgentId}] Processado com sucesso para a propriedade '${orchestratedContext.propertyContext.propertyName}'. Solicitação: "${prompt}"`;
        }
      }

      // Tratar parse de dados JSON se aplicável
      if (schema || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          parsedData = JSON.parse(responseText.trim());
        } catch (e) {
          parsedData = responseText;
        }
      } else {
        parsedData = responseText;
      }

      // 11. Atualizar Memória Compartilhada com o resultado do Agente Primário
      const updatedKeys: string[] = [];
      const primaryAgentResultKey = `${decision.primaryAgentId}:last_result`;
      agentSharedMemory.setValue(
        primaryAgentResultKey,
        { text: responseText, data: parsedData, timestamp: new Date().toISOString() },
        decision.primaryAgentId,
        scope,
        1000 * 60 * 30 // TTL de 30 minutos
      );
      updatedKeys.push(primaryAgentResultKey);

      // 12. Registrar mensagem do Assistente na SessionMemory
      await sessionMemory.addMessage(
        sessionId,
        { role: 'assistant', content: responseText },
        { organizationId, propertyId, agentId: decision.primaryAgentId }
      );

      // 13. Publicar evento de conclusão no Event Bus
      const completedEvent = agentEventBus.publishEvent({
        eventName: `${decision.primaryAgentId}:response_generated`,
        publisherAgentId: decision.primaryAgentId,
        organizationId,
        propertyId,
        sessionId,
        payload: {
          authorityLevel: primaryDecl.authorityLevel,
          collaboratingAgentIds: decision.collaboratingAgentIds,
          executionTimeMs: Date.now() - startTime
        }
      });
      generatedEvents.push(completedEvent);

      const durationMs = Date.now() - startTime;
      metricsCollector.recordAiExecution(durationMs);
      logger.info(
        `[SynapseAgentOrchestrator] Orquestração concluída [Agente: ${decision.primaryAgentId}] [Prioridade: ${decision.priority}] em ${durationMs}ms`,
        {
          primaryAgentId: decision.primaryAgentId,
          collaboratingAgentIds: decision.collaboratingAgentIds,
          durationMs,
          source,
          organizationId,
          propertyId
        },
        'SYNAPSE_AGENT_ORCHESTRATOR'
      );

      return {
        text: responseText,
        data: parsedData,
        primaryAgentId: decision.primaryAgentId,
        collaboratingAgentIds: decision.collaboratingAgentIds,
        decisionReason: decision.decisionReason,
        executionTimeMs: durationMs,
        generatedEvents,
        sharedMemoryKeysUpdated: updatedKeys,
        source,
        orchestratedContext
      };
    } finally {
      this.activeExecutions.delete(executionKey);
    }
  }
}

export const synapseAgentOrchestrator = new SynapseAgentOrchestrator();
