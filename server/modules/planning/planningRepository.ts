import { approvalService } from '../approval/approvalService.ts';
import { decisionService } from '../decision/decisionService.ts';
import { executiveCopilotService } from '../executiveCopilot/executiveCopilotService.ts';
import { strategyService } from '../strategy/strategyService.ts';
import { 
  OperationalPlaybook, 
  PlanningDashboard, 
  PlanningSummaryForAI,
  PlaybookStatus,
  PriorityLevel,
  ResponsibleArea,
  ChecklistItem
} from './planningTypes.ts';

export class PlanningRepository {
  private playbooksStore: Map<string, OperationalPlaybook> = new Map();

  /**
   * Constrói ou recupera os playbooks operacionais em memória.
   * Consome exclusivamente APIs públicas dos módulos Approval, Decision, Copilot e Strategy.
   */
  async getPlaybooks(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    const now = new Date().toISOString();

    // 1. Obter aprovações do Human Approval Workflow
    const approvals = await approvalService.getHistory(organizationId, propertyId).catch(() => []);
    const pendingApprovals = await approvalService.getPending(organizationId, propertyId).catch(() => []);

    // 2. Mapear cada recomendação aprovada em um Playbook Operacional de Execução Manual
    for (const app of approvals) {
      if (app.status === 'approved') {
        const playbookId = `pb_appr_${app.recommendationId}`;
        if (!this.playbooksStore.has(playbookId)) {
          const playbook: OperationalPlaybook = {
            playbookId,
            title: `[Execução Recomendada] ${app.title}`,
            description: `Plano operacional estruturado para executar manualmente a recomendação aprovada: ${app.description}`,
            objective: `Implementar a decisão aprovada por ${app.decisionBy} com segurança operacional e acompanhamento de KPIs.`,
            originRecommendation: app.originalRecommendation || app,
            priority: app.priority || 'high',
            estimatedDuration: '45 minutos',
            estimatedComplexity: 'medium',
            estimatedBusinessImpact: 'Alto impacto em ocupação e receita direta.',
            responsibleArea: this.mapModuleToArea(app.moduleOrigin),
            recommendedOwner: app.decisionBy || 'Gerente Operacional / RM',
            requiredResources: ['Acesso ao Aloha PMS (módulo Tarifas/Reservas)', 'Acesso ao Painel de Canais/OTAs'],
            dependencies: ['Validação final com a recepção', 'Verificação de disponibilidade no PMS'],
            checklist: [
              {
                stepId: 'chk_1',
                title: 'Conferir Parâmetros no Aloha PMS',
                description: 'Verificar se as tarifas e restrições atuais coincidem com a base da recomendação.',
                completed: false,
                manualInstruction: 'Acesse o Aloha PMS -> Módulo de Tarifas -> Consultar Tarifas do Período.'
              },
              {
                stepId: 'chk_2',
                title: 'Realizar Alteração Manual no Aloha PMS',
                description: 'Aplicar os novos valores ou regras diretamente no sistema PMS.',
                completed: false,
                manualInstruction: 'Acesse a tela de Edição Tarifária no Aloha PMS e salve as alterações.'
              },
              {
                stepId: 'chk_3',
                title: 'Confirmar Sincronização via n8n',
                description: 'Aguardar o ciclo automático de sincronização do n8n para atualizar os canais.',
                completed: false,
                manualInstruction: 'Acompanhe o log de sincronização no n8n ou aguarde 5 minutos.'
              }
            ],
            executionSteps: [
              '1. Revisar justificativa da aprovação e restrições mencionadas pelo aprovador.',
              '2. Executar manualmente a alteração no Aloha PMS.',
              '3. Validar atualização no extranet do motor de reservas direto.',
              '4. Registrar a conclusão manual no Synapse Hospitality.'
            ],
            risks: [
              'Conflito de inventário caso ocorra Overbooking em horário de pico.',
              'Atraso na propagação n8n para extranets parceiras.'
            ],
            expectedOutcome: 'Aumento de margem de receita e alinhamento com a estratégia executiva definida.',
            approvalReference: {
              approvalId: app.approvalId,
              decisionBy: app.decisionBy,
              decisionDate: app.decisionDate
            },
            status: 'planned',
            executionMode: 'manual',
            createdAt: app.updatedAt || now,
            updatedAt: now
          };
          this.playbooksStore.set(playbookId, playbook);
        }
      }
    }

    // 3. Mapear pendências críticas para pré-playbooks planejados
    for (const pending of pendingApprovals) {
      const playbookId = `pb_plan_${pending.recommendationId}`;
      if (!this.playbooksStore.has(playbookId)) {
        const playbook: OperationalPlaybook = {
          playbookId,
          title: `[Aguardando Aprovação Humana] ${pending.title}`,
          description: `Plano operacional pré-estruturado aguardando decisão humana no workflow de governança: ${pending.description}`,
          objective: 'Aguardar validação do gestor antes de autorizar a execução manual.',
          originRecommendation: pending.originalRecommendation || pending,
          priority: pending.priority || 'medium',
          estimatedDuration: '30 minutos',
          estimatedComplexity: 'low',
          estimatedBusinessImpact: 'Otimização de rotina operacional e compliance.',
          responsibleArea: this.mapModuleToArea(pending.moduleOrigin),
          recommendedOwner: 'Operador Responsável da Área',
          requiredResources: ['Validação no Human Approval Workflow'],
          dependencies: [`Aprovação pendente no item ${pending.approvalId}`],
          checklist: [
            {
              stepId: 'chk_pre_1',
              title: 'Aguardar Aprovação no Painel de Governança',
              description: 'O plano só poderá ser executado após aprovação humana explícita.',
              completed: false,
              manualInstruction: 'Acesse o menu Approval Workflow e revise a recomendação.'
            }
          ],
          executionSteps: [
            '1. Aguardar aprovação do comitê executivo.',
            '2. Revisar pré-checklist de recursos exigidos.'
          ],
          risks: ['Atraso no tempo de resposta humana do aprovador.'],
          expectedOutcome: 'Prontidão operacional imediata assim que a aprovação for concedida.',
          approvalReference: {
            approvalId: pending.approvalId,
            status: 'pending_approval'
          },
          status: 'planned',
          executionMode: 'manual',
          createdAt: pending.createdAt || now,
          updatedAt: now
        };
        this.playbooksStore.set(playbookId, playbook);
      }
    }

    // Se a loja não tiver nenhum item, gerar um playbook padrão de governança
    if (this.playbooksStore.size === 0) {
      const defaultPb: OperationalPlaybook = {
        playbookId: 'pb_default_routine',
        title: '[Rotina Diária] Auditoria Operacional de Reservas e Ocupação',
        description: 'Plano padrão diário para conferência de alinhamento entre Synapse, Aloha PMS e canais n8n.',
        objective: 'Garantir 100% de consistência tarifária e de inventário no início da jornada diária.',
        originRecommendation: { module: 'system', topic: 'daily_routine' },
        priority: 'medium',
        estimatedDuration: '20 minutos',
        estimatedComplexity: 'low',
        estimatedBusinessImpact: 'Prevenção de disparidade tarifária e otimização de acolhimento na recepção.',
        responsibleArea: 'reception',
        recommendedOwner: 'Supervisor de Recepção',
        requiredResources: ['Terminal Aloha PMS', 'Painel Synapse Hospitality'],
        dependencies: ['Sincronização n8n ativa'],
        checklist: [
          {
            stepId: 'chk_def_1',
            title: 'Verificar Check-ins do Dia no Aloha PMS',
            description: 'Conferir lista de chegadas e UH designadas.',
            completed: false,
            manualInstruction: 'Abrir tela de Front Desk no Aloha PMS e filtrar por Chegadas de Hoje.'
          },
          {
            stepId: 'chk_def_2',
            title: 'Conferir Alertas no Executive Copilot',
            description: 'Identificar riscos de no-show ou no-show preventivo.',
            completed: false,
            manualInstruction: 'Acesse o painel Executive Copilot no Synapse.'
          }
        ],
        executionSteps: [
          '1. Fazer login no Aloha PMS.',
          '2. Revisar chegadas e saídas.',
          '3. Validar relatórios de governança/limpeza.'
        ],
        risks: ['Disparidade entre tarifas de balcão e canais online.'],
        expectedOutcome: 'Operação diária fluida e sem atritos de check-in.',
        status: 'planned',
        executionMode: 'manual',
        createdAt: now,
        updatedAt: now
      };
      this.playbooksStore.set(defaultPb.playbookId, defaultPb);
    }

    return Array.from(this.playbooksStore.values());
  }

  /**
   * Regenera/Atualiza os playbooks no repositório em memória.
   */
  async generatePlaybooks(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    this.playbooksStore.clear();
    return this.getPlaybooks(organizationId, propertyId);
  }

  /**
   * Reconstrói os playbooks atualizando dependências e checklists.
   */
  async rebuildPlaybooks(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    return this.generatePlaybooks(organizationId, propertyId);
  }

  /**
   * Retorna o Planning Dashboard com estatísticas e gargalos.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<PlanningDashboard> {
    const playbooks = await this.getPlaybooks(organizationId, propertyId);

    const planned = playbooks.filter(p => p.status === 'planned');
    const inExecution = playbooks.filter(p => p.status === 'in_manual_execution');
    const completed = playbooks.filter(p => p.status === 'completed_manually');

    const distributionBySector: Record<string, number> = {};
    const distributionByPriority: Record<string, number> = {};

    playbooks.forEach(p => {
      distributionBySector[p.responsibleArea] = (distributionBySector[p.responsibleArea] || 0) + 1;
      distributionByPriority[p.priority] = (distributionByPriority[p.priority] || 0) + 1;
    });

    return {
      totalPlansCreated: playbooks.length,
      pendingPlansCount: planned.length,
      inManualExecutionCount: inExecution.length,
      completedManuallyCount: completed.length,
      averageEstimatedDurationMinutes: 35,
      distributionBySector,
      distributionByPriority,
      topBottlenecks: [
        'Aprovação humana pendente no comitê de Revenue',
        'Tempo de propagação de alteração manual no Aloha PMS para OTAs via n8n'
      ],
      topOpportunities: [
        'Padronização de checklists de execução manual por turno',
        'Redução de tempo entre aprovação e implementação operacional'
      ],
      activePlaybooks: playbooks,
      systemStatus: 'read_only_planning'
    };
  }

  /**
   * Retorna o resumo para o ContextService da IA.
   */
  async getPlanningSummaryForAI(organizationId: string, propertyId: string): Promise<PlanningSummaryForAI> {
    const dash = await this.getDashboard(organizationId, propertyId);
    const playbooks = dash.activePlaybooks;

    const highPriority = playbooks.filter(p => p.priority === 'critical' || p.priority === 'high').length;
    const topPlaybook = playbooks.length > 0 ? playbooks[0].title : 'Nenhum plano ativo';

    return {
      plannedActions: dash.totalPlansCreated,
      highPriorityPlans: highPriority,
      estimatedExecutionHours: Math.round((dash.totalPlansCreated * 35) / 60 * 10) / 10,
      criticalDependencies: 'Aprovação humana e execução manual no Aloha PMS',
      topPlaybook
    };
  }

  private mapModuleToArea(moduleOrigin: string): ResponsibleArea {
    switch (moduleOrigin) {
      case 'revenue': return 'revenue';
      case 'marketing': return 'marketing';
      case 'sales': return 'sales';
      case 'reception': return 'reception';
      case 'housekeeping': return 'housekeeping';
      case 'maintenance': return 'maintenance';
      default: return 'management';
    }
  }
}

export const planningRepository = new PlanningRepository();
