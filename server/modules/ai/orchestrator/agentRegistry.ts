import { AgentDeclaration } from './agentTypes.ts';

const REGISTERED_AGENTS: Record<string, AgentDeclaration> = {
  reception_agent: {
    agentId: 'reception_agent',
    name: 'Agente de Recepção & Reservas',
    domain: 'Recepção, Atendimento e Reservas Operacionais',
    responsibilities: [
      'Síntese do Reception Dashboard em tempo real',
      'Acompanhamento de check-ins, check-outs, early/late check-in/out',
      'Acolhimento de hóspedes VIP e recorrentes',
      'Sugestões de upgrade e upsell na recepção'
    ],
    tools: ['getReceptionDashboard', 'getOccupancySummary', 'getVIPList'],
    eventsConsumed: ['pms:reservation_created', 'pms:checkin_completed', 'pms:checkout_completed'],
    eventsPublished: ['reception:alert_raised', 'reception:upsell_suggested'],
    authorityLevel: 'READ_ONLY'
  },
  concierge_agent: {
    agentId: 'concierge_agent',
    name: 'Concierge Virtual & Experiência do Hóspede',
    domain: 'Experiência do Hóspede, Gastronomia e Lazer',
    responsibilities: [
      'Atendimento personalizado com base em preferências de perfil',
      'Recomendação de passeios, restaurantes e transporte',
      'Organização de celebrações (aniversários, lua de mel)'
    ],
    tools: ['getGuestProfile', 'getExperiencesList', 'getPartnerRestaurants'],
    eventsConsumed: ['pms:guest_checked_in', 'crm:profile_updated'],
    eventsPublished: ['concierge:experience_recommended'],
    authorityLevel: 'READ_ONLY'
  },
  housekeeping_agent: {
    agentId: 'housekeeping_agent',
    name: 'Agente de Governança',
    domain: 'Governança, Higienização e Status de UHs',
    responsibilities: [
      'Consulta do estado das UHs (Limpas, Sujas, Vistoriadas, Bloqueadas)',
      'Priorização da fila de limpeza para liberação de check-in',
      'Acompanhamento de SLA de higienização'
    ],
    tools: ['getHousekeepingQueue', 'getUnitCleanlinessStatus'],
    eventsConsumed: ['pms:checkout_completed', 'housekeeping:cleaning_started'],
    eventsPublished: ['housekeeping:queue_prioritized', 'housekeeping:unit_ready'],
    authorityLevel: 'READ_ONLY'
  },
  maintenance_agent: {
    agentId: 'maintenance_agent',
    name: 'Agente de Manutenção',
    domain: 'Manutenção Preventiva, Corretiva e Bloqueio de UHs',
    responsibilities: [
      'Visibilidade técnica do ciclo de manutenção preventiva e corretiva',
      'Monitoramento do backlog de ordens de serviço',
      'Diagnóstico de UHs fora de serviço aguardando peças'
    ],
    tools: ['getMaintenanceDashboard', 'getMaintenanceBacklog'],
    eventsConsumed: ['maintenance:task_created', 'pms:unit_blocked'],
    eventsPublished: ['maintenance:critical_alert_emitted'],
    authorityLevel: 'READ_ONLY'
  },
  financial_agent: {
    agentId: 'financial_agent',
    name: 'Agente Financeiro & DRE',
    domain: 'Gestão Financeira, Faturamento e Caixa',
    responsibilities: [
      'Análise de faturamento, DRE e receitas de diárias',
      'Acompanhamento do fluxo de caixa e saldos',
      'Controle de faturas e pagamentos operacionais'
    ],
    tools: ['getFinancialSummary', 'getDREMetrics'],
    eventsConsumed: ['financial:payment_received', 'pms:folio_closed'],
    eventsPublished: ['financial:summary_generated'],
    authorityLevel: 'READ_ONLY'
  },
  revenue_agent: {
    agentId: 'revenue_agent',
    name: 'Agente de Revenue Intelligence',
    domain: 'Revenue Management, Precificação e Performance',
    responsibilities: [
      'Análise estratégica de ADR, RevPAR, ocupação, lead time e booking pace',
      'Projeção de forecast para 7, 15 e 30 dias',
      'Avaliação de performance por canais e categorias'
    ],
    tools: ['getRevenueMetrics', 'getForecast', 'getBookingPace'],
    eventsConsumed: ['pms:reservation_created', 'pms:reservation_cancelled', 'revenue:rate_rule_updated'],
    eventsPublished: ['revenue:recommendation_generated', 'revenue:risk_detected'],
    authorityLevel: 'READ_ONLY'
  },
  direct_booking_agent: {
    agentId: 'direct_booking_agent',
    name: 'Agente de Reservas Diretas & CRM Comercial',
    domain: 'Vendas Diretas, Orçamentos e Cotações',
    responsibilities: [
      'Apoio em cotações, propostas comerciais e follow-ups com leads',
      'Estratégias de conversão direta sem comissão de OTAs',
      'Resgate de propostas expiradas ou pendentes'
    ],
    tools: ['getCommercialFunnel', 'getProposalsSummary'],
    eventsConsumed: ['crm:proposal_created', 'crm:proposal_expired'],
    eventsPublished: ['direct_booking:followup_recommended'],
    authorityLevel: 'READ_ONLY'
  },
  sales_agent: {
    agentId: 'sales_agent',
    name: 'Agente de Sales CRM & Gestão Comercial',
    domain: 'Pipeline Comercial, Funil de Vendas e Leads',
    responsibilities: [
      'Gestão do pipeline de vendas e qualificação de leads (Cold, Warm, Hot)',
      'Identificação de gargalos nas etapas do funil comercial',
      'Recomendação de ações para acelerar o fechamento de oportunidades'
    ],
    tools: ['getSalesPipelineMetrics', 'getLeadScoreSummary'],
    eventsConsumed: ['sales:lead_created', 'sales:opportunity_updated'],
    eventsPublished: ['sales:pipeline_bottleneck_identified'],
    authorityLevel: 'READ_ONLY'
  },
  marketing_agent: {
    agentId: 'marketing_agent',
    name: 'Agente de Marketing Intelligence & Segmentação',
    domain: 'Inteligência de Marketing, Segmentação e LTV',
    responsibilities: [
      'Análise de segmentação inteligente (VIP, Recorrentes, Inativos)',
      'Acompanhamento da jornada do hóspede, retenção e LTV',
      'Identificação de oportunidades para reativação de clientes'
    ],
    tools: ['getMarketingSegments', 'getCustomerJourneyMetrics'],
    eventsConsumed: ['crm:guest_profile_created', 'pms:checkout_completed'],
    eventsPublished: ['marketing:churn_risk_detected'],
    authorityLevel: 'READ_ONLY'
  },
  executive_agent: {
    agentId: 'executive_agent',
    name: 'Agente de Inteligência Executiva & Diretoria',
    domain: 'Governança Executiva e Visão Consolidada de Diretoria',
    responsibilities: [
      'Síntese holística dos KPIs operacionais, comerciais e financeiros',
      'Consolidação de alertas críticos e prioridades operacionais do dia',
      'Resumo executivo consolidado para tomada de decisão'
    ],
    tools: ['getExecutiveDashboard', 'getExecutiveKPIs', 'getExecutiveAlerts'],
    eventsConsumed: ['executive:dashboard_requested', 'executive:kpis_updated'],
    eventsPublished: ['executive:daily_brief_generated'],
    authorityLevel: 'READ_ONLY'
  },
  executive_copilot_agent: {
    agentId: 'executive_copilot_agent',
    name: 'Executive Copilot & Strategic Decision Intelligence',
    domain: 'Consultoria Estratégica, Health Score Executivo e CEO Guidance',
    responsibilities: [
      'Cálculo do Executive Health Score (0-100) e scores setoriais',
      'Análise diagnóstica dos top 10 riscos e top 10 oportunidades',
      'Elaboração do Executive Daily Brief para a presidência'
    ],
    tools: ['getCopilotHealthScores', 'getTopRisksAndOpportunities', 'getExecutiveBrief'],
    eventsConsumed: ['executive:health_score_calculated', 'executive:risk_detected'],
    eventsPublished: ['executive:copilot_brief_published'],
    authorityLevel: 'READ_ONLY'
  },
  decision_agent: {
    agentId: 'decision_agent',
    name: 'Decision Engine & Human Approval Specialist',
    domain: 'Motor de Decisão Executiva e Fila de Prioridades',
    responsibilities: [
      'Consolidação da Fila Executiva de Ações recomendadas',
      'Explicação analítica de razões, benefícios e riscos de ações',
      'Garantia de que 100% das ações exigem aprovação humana'
    ],
    tools: ['getDecisionActionQueue', 'getActionDetails'],
    eventsConsumed: ['decision:action_recommended', 'decision:queue_updated'],
    eventsPublished: ['decision:action_pending_approval'],
    authorityLevel: 'ASSISTED'
  },
  approval_agent: {
    agentId: 'approval_agent',
    name: 'Human Approval & Governance Specialist',
    domain: 'Workflow de Aprovação Humana e Auditoria',
    responsibilities: [
      'Visibilidade e gestão da fila de aprovações (Aprovadas, Rejeitadas, Pendentes)',
      'Registro de auditoria com rastreabilidade completa e timestamps',
      'Verificação do cumprimento das normas de compliance'
    ],
    tools: ['getApprovalBacklog', 'getAuditLogHistory'],
    eventsConsumed: ['approval:status_changed', 'approval:action_rejected'],
    eventsPublished: ['approval:audit_logged', 'approval:workflow_completed'],
    authorityLevel: 'HUMAN_APPROVAL_REQUIRED'
  },
  planning_agent: {
    agentId: 'planning_agent',
    name: 'Operational Planning & Playbook Specialist',
    domain: 'Planejamento Operacional e Playbooks de Execução Manual',
    responsibilities: [
      'Estruturação de playbooks operacionais em passos e checklists manuais',
      'Sequenciamento e cronograma de tarefas por setor',
      'Definição de dependências e recursos necessários'
    ],
    tools: ['getPlaybookDetails', 'getOperationalPlan'],
    eventsConsumed: ['planning:playbook_generated', 'approval:action_approved'],
    eventsPublished: ['planning:playbook_ready_for_execution'],
    authorityLevel: 'ASSISTED'
  },
  execution_agent: {
    agentId: 'execution_agent',
    name: 'Operational Execution Tracking Specialist',
    domain: 'Acompanhamento de Execução Operacional Humana',
    responsibilities: [
      'Acompanhamento do progresso de execução manual de playbooks',
      'Diagnóstico de gargalos, bloqueios e estouro de SLA humano',
      'Métricas de produtividade setorial sem automação externa'
    ],
    tools: ['getExecutionTrackingSummary', 'getSectorProductivity'],
    eventsConsumed: ['execution:step_completed', 'execution:blocker_reported'],
    eventsPublished: ['execution:progress_updated', 'execution:sla_breached'],
    authorityLevel: 'READ_ONLY'
  },
  strategy_agent: {
    agentId: 'strategy_agent',
    name: 'Strategic Simulation & Explainable AI Specialist',
    domain: 'Simulação Estratégica ("What If") e Explainable AI',
    responsibilities: [
      'Simulação de cenários em memória ("What If")',
      'Análise de trade-offs e Explainable AI (reasoning, evidence, confidence)',
      'Comparação entre estado atual e estado projetado'
    ],
    tools: ['runStrategicSimulation', 'getSimulationScenarios'],
    eventsConsumed: ['strategy:simulation_requested'],
    eventsPublished: ['strategy:simulation_completed'],
    authorityLevel: 'READ_ONLY'
  },
  synapse_copilot: {
    agentId: 'synapse_copilot',
    name: 'Synapse Copilot Operacional',
    domain: 'Assistência Geral e Copiloto Hoteleiro Multi-função',
    responsibilities: [
      'Atendimento multifuncional e respostas gerais da plataforma',
      'Navegação e suporte ao operador em tarefas do dia a dia'
    ],
    tools: ['getGeneralContext', 'searchSystemData'],
    eventsConsumed: ['copilot:message_received'],
    eventsPublished: ['copilot:response_generated'],
    authorityLevel: 'READ_ONLY'
  },
  guest_concierge: {
    agentId: 'guest_concierge',
    name: 'Concierge Virtual 24/7',
    domain: 'Atendimento Direto ao Hóspede em Canais Digitais',
    responsibilities: [
      'Respostas automatizadas para dúvidas frequentes de hóspedes',
      'Informações sobre horários de check-in/out e regras do hotel'
    ],
    tools: ['getHotelPolicies', 'getGuestInformation'],
    eventsConsumed: ['guest:message_received'],
    eventsPublished: ['guest:reply_sent'],
    authorityLevel: 'READ_ONLY'
  },
  synapse_orchestrator: {
    agentId: 'synapse_orchestrator',
    name: 'Synapse Master Orchestrator',
    domain: 'Orquestração Central de Agentes de IA',
    responsibilities: [
      'Coordenação de agentes especializados e roteamento inteligente',
      'Gestão de eventos do Event Bus e memória compartilhada'
    ],
    tools: ['routeAgent', 'dispatchAgentEvent', 'getSharedMemory'],
    eventsConsumed: ['orchestrator:request_received'],
    eventsPublished: ['orchestrator:pipeline_completed'],
    authorityLevel: 'ASSISTED'
  },
  dynamic_pricing: {
    agentId: 'dynamic_pricing',
    name: 'Especialista em Precificação Dinâmica',
    domain: 'Revenue Management & Algoritmos de Tarifas',
    responsibilities: [
      'Cálculo de tarifas otimizadas com base em demanda e ocupação',
      'Recomendações de yield management'
    ],
    tools: ['calculateDynamicRates', 'getDemandForecast'],
    eventsConsumed: ['revenue:demand_surge_detected'],
    eventsPublished: ['revenue:rates_recommended'],
    authorityLevel: 'ASSISTED'
  },
  financial_consultant: {
    agentId: 'financial_consultant',
    name: 'Consultor Financeiro & DRE',
    domain: 'Consultoria Financeira, Breakeven e Custos',
    responsibilities: [
      'Análise de ponto de equilíbrio (breakeven) e margens de lucro',
      'Consultoria estratégica para redução de custos'
    ],
    tools: ['calculateBreakeven', 'getCostAnalysis'],
    eventsConsumed: ['financial:cost_overrun_detected'],
    eventsPublished: ['financial:consulting_insight_published'],
    authorityLevel: 'READ_ONLY'
  },
  marketing_generator: {
    agentId: 'marketing_generator',
    name: 'Gerador de Marketing & Growth',
    domain: 'Criação de Conteúdo de Marketing',
    responsibilities: [
      'Geração de textos para campanhas, posts e e-mails promocionais',
      'Criação de anúncios direcionados por segmento'
    ],
    tools: ['generateCampaignCopy', 'getAudienceTargeting'],
    eventsConsumed: ['marketing:campaign_draft_requested'],
    eventsPublished: ['marketing:copy_generated'],
    authorityLevel: 'ASSISTED'
  },
  default_agent: {
    agentId: 'default_agent',
    name: 'Agente Executivo Synapse',
    domain: 'Fallback Executivo Geral',
    responsibilities: [
      'Respostas de fallback executivo para solicitações gerais'
    ],
    tools: ['getGeneralContext'],
    eventsConsumed: [],
    eventsPublished: [],
    authorityLevel: 'READ_ONLY'
  }
};

const agentStore: Record<string, AgentDeclaration> = { ...REGISTERED_AGENTS };

export function registerAgent(declaration: AgentDeclaration): void {
  agentStore[declaration.agentId] = declaration;
}

export function getAgentDeclaration(agentId: string): AgentDeclaration {
  return agentStore[agentId] || agentStore['default_agent'] || REGISTERED_AGENTS['default_agent'];
}

export function getAllAgentDeclarations(): AgentDeclaration[] {
  return Object.values(agentStore);
}

export function findAgentsConsumingEvent(eventName: string): AgentDeclaration[] {
  return getAllAgentDeclarations().filter(agent => 
    agent.eventsConsumed.includes(eventName) || agent.eventsConsumed.includes('*')
  );
}

export function findAgentsPublishingEvent(eventName: string): AgentDeclaration[] {
  return getAllAgentDeclarations().filter(agent => 
    agent.eventsPublished.includes(eventName)
  );
}
