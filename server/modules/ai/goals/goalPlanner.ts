import { GoalDefinition, GoalTask } from './goalTypes.ts';
import { getAgentDeclaration } from '../orchestrator/agentRegistry.ts';

export class GoalPlanner {
  /**
   * Decompõe automaticamente um objetivo estratégico em tarefas sequenciadas por agentes responsáveis.
   */
  public decomposeGoal(definition: GoalDefinition): { decomposedTasks: GoalTask[]; rationale: string } {
    const tasks: GoalTask[] = [];
    const agents = definition.involvedAgents.length > 0 
      ? definition.involvedAgents 
      : ['executive_agent', 'decision_agent', 'planning_agent'];

    let taskIndex = 1;

    // Etapa 1: Análise Diagnóstica Inicial e Mapeamento de Fatos pelo Agente Primário
    const primaryAgentId = agents[0];
    const primaryDecl = getAgentDeclaration(primaryAgentId);

    tasks.push({
      taskId: `task_${definition.goalId}_01`,
      title: `Análise Diagnóstica de Base: ${definition.title}`,
      description: `Diagnóstico dos KPIs atuais (${definition.relatedKPIs.join(', ')}) e mapeamento da situação pela perspectiva do domínio '${primaryDecl.domain}'.`,
      assignedAgentId: primaryAgentId,
      requiredContext: ['propertyContext', 'operationalContext', 'executiveContext'],
      expectedEvents: [`${primaryAgentId}:response_generated`],
      expectedOutcome: `Relatório inicial de situação com linha de base dos KPIs (${definition.metrics.map(m => m.name).join(', ')}).`,
      status: 'PENDING',
      approvalRequired: false
    });

    // Etapas intermediárias: Contribuição de cada Agente Especializado
    for (let i = 1; i < agents.length; i++) {
      taskIndex++;
      const agentId = agents[i];
      const decl = getAgentDeclaration(agentId);

      // Respeito ao ADR-005: Se o agente for de nível ASSISTED ou HUMAN_APPROVAL_REQUIRED, ou for de tomada de decisão/aprovação, marca aprovação obrigatória
      const needsApproval = decl.authorityLevel === 'HUMAN_APPROVAL_REQUIRED' || 
                            decl.authorityLevel === 'ASSISTED' ||
                            agentId === 'decision_agent' ||
                            agentId === 'approval_agent' ||
                            agentId === 'direct_booking_agent' ||
                            agentId === 'revenue_agent';

      tasks.push({
        taskId: `task_${definition.goalId}_0${taskIndex}`,
        title: `Plano Especializado - ${decl.name}`,
        description: `Elaboração e execução de estratégias no domínio '${decl.domain}' para o objetivo '${definition.title}'.`,
        assignedAgentId: agentId,
        requiredContext: ['operationalContext', 'sharedMemoryState'],
        expectedEvents: [`${agentId}:response_generated`],
        expectedOutcome: `Ações específicas recomendadas ou propostas com alinhamento aos critérios de sucesso.`,
        status: 'PENDING',
        approvalRequired: needsApproval
      });
    }

    // Etapa Final: Consolidação Executiva e Validação pelo Decision/Executive Agent
    taskIndex++;
    const finalAgentId = agents.includes('executive_agent') ? 'executive_agent' : 'planning_agent';
    tasks.push({
      taskId: `task_${definition.goalId}_0${taskIndex}`,
      title: `Consolidação e Validação da Missão`,
      description: `Sintetizar os resultados alcançados, comparar métricas de KPI em relação aos critérios de sucesso e preparar encerramento da missão.`,
      assignedAgentId: finalAgentId,
      requiredContext: ['executiveContext', 'sharedMemoryState'],
      expectedEvents: [`${finalAgentId}:response_generated`],
      expectedOutcome: `Aprovação final do objetivo, avaliação de atingimento das metas e registro de audit trail.`,
      status: 'PENDING',
      approvalRequired: true // ADR-005: Validação final exige confirmação de conclusão
    });

    const rationale = `Objetivo '${definition.title}' decomposto com sucesso em ${tasks.length} tarefas sequenciais abarcando ${agents.length} agentes especializados. Regra ADR-005 aplicada para exigir aprovação humana em ${tasks.filter(t => t.approvalRequired).length} etapa(s).`;

    return {
      decomposedTasks: tasks,
      rationale
    };
  }
}

export const goalPlanner = new GoalPlanner();
