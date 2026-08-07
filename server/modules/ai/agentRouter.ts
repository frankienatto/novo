import { AgentSelectionResult } from './aiTypes.ts';

export interface RouteRule {
  agentId: string;
  domain: string;
  keywords: string[];
}

export class AgentRouter {
  private rules: RouteRule[] = [
    {
      agentId: 'execution_agent',
      domain: 'Operational Execution Tracking Specialist',
      keywords: ['execução', 'execucao', 'acompanhamento', 'progresso', 'status de execução', 'bloqueio', 'gargalo', 'sla', 'produtividade', 'tempo de execução']
    },
    {
      agentId: 'planning_agent',
      domain: 'Operational Planning & Playbook Specialist',
      keywords: ['plano', 'playbook', 'planejamento', 'sequência', 'sequencia', 'cronograma', 'prioridade', 'checklist', 'execução', 'execucao', 'roadmap operacional']
    },
    {
      agentId: 'approval_agent',
      domain: 'Human Approval & Governance Specialist',
      keywords: ['aprovação', 'aprovacao', 'aprovar', 'rejeitar', 'workflow', 'auditoria', 'compliance', 'governança', 'governanca', 'histórico', 'historico', 'rastreabilidade', 'pente fino', 'status de aprovação', 'backlog de aprovações']
    },
    {
      agentId: 'strategy_agent',
      domain: 'Strategic Simulation & Explainable AI Specialist',
      keywords: ['simulação', 'simulacao', 'what if', 'cenário', 'cenario', 'comparar', 'comparação', 'comparacao', 'vale a pena', 'trade off', 'trade-off', 'impacto', 'estratégia', 'estrategia', 'projeção', 'projecao', 'forecast', 'decisão', 'decisao']
    },
    {
      agentId: 'decision_agent',
      domain: 'Decision Engine & Human Approval Specialist',
      keywords: ['recomendação', 'recomendacao', 'plano de ação', 'plano de acao', 'prioridade', 'o que devo fazer', 'próxima ação', 'proxima acao', 'fila de prioridades', 'roadmap operacional', 'decision engine', 'aprovação', 'aprovacao', 'aprovacao humana', 'aprovação humana', 'fila de ações', 'fila de acoes']
    },
    {
      agentId: 'executive_copilot_agent',
      domain: 'Executive Copilot & Strategic Decision Intelligence',
      keywords: ['copilot', 'executive copilot', 'health score', 'executive score', 'risk score', 'opportunity score', 'executive dashboard', 'estratégia', 'estrategia', 'prioridades', 'diretoria', 'presidência', 'presidencia', 'ceo', 'gestão', 'gestao', 'decisão', 'decisao', 'brief', 'executive brief']
    },
    {
      agentId: 'executive_agent',
      domain: 'Inteligência Executiva & Diretoria',
      keywords: ['executivo', 'dashboard', 'diretoria', 'gerência', 'gerencia', 'indicadores', 'resumo executivo', 'kpis', 'performance', 'gestão', 'gestao', 'prioridades', 'riscos', 'estratégia', 'estrategia', 'visão geral', 'visao geral']
    },
    {
      agentId: 'marketing_agent',
      domain: 'Marketing Intelligence & Segmentação',
      keywords: ['marketing', 'campanha', 'segmentação', 'segmentacao', 'retenção', 'retencao', 'cliente', 'engajamento', 'mercado', 'perfil', 'recorrência', 'recorrencia', 'ltv', 'journey', 'segmento', 'hóspede inativo', 'hospede inativo', 'vip inativo']
    },
    {
      agentId: 'sales_agent',
      domain: 'Sales CRM & Gestão do Pipeline Comercial',
      keywords: ['lead', 'pipeline', 'crm', 'vendas', 'negociação', 'negociacao', 'follow-up', 'followup', 'cliente', 'proposta', 'oportunidade', 'funil', 'score', 'prospecto']
    },
    {
      agentId: 'direct_booking_agent',
      domain: 'Reservas Diretas & CRM Comercial',
      keywords: ['proposta', 'orçamento', 'orcamento', 'cotação', 'cotacao', 'venda', 'vendas', 'comercial', 'negociação', 'negociacao', 'conversão', 'conversao', 'follow-up', 'followup', 'reserva direta', 'desconto', 'oportunidade', 'lead', 'inquiry', 'proposta comercial']
    },
    {
      agentId: 'revenue_agent',
      domain: 'Revenue Intelligence & Performance Comercial',
      keywords: ['revenue', 'adr', 'revpar', 'ocupação', 'ocupacao', 'forecast', 'diária média', 'diaria media', 'receita por quarto', 'performance comercial', 'booking pace', 'pace', 'pickup', 'tarifa média', 'tarifa media', 'lead time']
    },
    {
      agentId: 'reception_agent',
      domain: 'Recepção & Reservas',
      keywords: ['reserva', 'booking', 'checkin', 'check-in', 'checkout', 'check-out', 'hospede', 'hóspede', 'recepcao', 'recepção', 'tarifario', 'tarifário', 'quarto', 'apartamento', 'overbooking', 'no-show', 'noshow']
    },
    {
      agentId: 'financial_agent',
      domain: 'Financeiro & DRE',
      keywords: ['financeiro', 'fatura', 'pagamento', 'receita', 'dre', 'caixa', 'saldo', 'fluxo de caixa', 'despesa', 'faturamento', 'cartao', 'pix', 'inadimplencia', 'contas a pagar', 'contas a receber']
    },
    {
      agentId: 'housekeeping_agent',
      domain: 'Governança & Manutenção',
      keywords: ['manutencao', 'manutenção', 'limpeza', 'governanca', 'governança', 'camareira', 'toalha', 'enxoval', 'reparo', 'vazamento', 'ar condicionado', 'frigobar', 'vistoria', 'sujo', 'suja', 'sujos', 'sujas', 'higienização', 'higienizacao', 'arrumação', 'arrumacao', 'faxina', 'out_of_service', 'dirty', 'clean']
    },
    {
      agentId: 'marketing_agent',
      domain: 'Marketing & Vendas',
      keywords: ['marketing', 'vendas', 'campanha', 'promocao', 'promoção', 'redes sociais', 'instagram', 'cupom', 'mkt', 'fidelidade', 'conversion', 'tarifaria']
    },
    {
      agentId: 'concierge_agent',
      domain: 'Concierge & Experiência do Hóspede',
      keywords: ['concierge', 'experiências', 'experiencias', 'restaurantes', 'restaurante', 'passeios', 'passeio', 'aniversário', 'aniversario', 'lua de mel', 'transporte', 'transfer', 'turismo']
    }
  ];

  /**
   * Executa o roteamento determinístico da mensagem para o agente especializado.
   * 
   * Diretrizes estritas:
   * 1. 100% determinístico e sem uso de LLM / classificadores estocásticos.
   * 2. Se agentId for passado explicitamente, ele é respeitado com confiança HIGH.
   * 3. Pontuação baseada na contagem exata de termos correspondentes.
   * 4. Retorna justificativa detalhada com a lista de palavras-chave encontradas.
   */
  route(prompt: string, requestedAgentId?: string): AgentSelectionResult {
    // 1. Regra de Agente Explícito
    if (requestedAgentId && requestedAgentId.trim() !== '') {
      return {
        agentId: requestedAgentId.trim(),
        reason: `Agente selecionado explicitamente na requisição: ${requestedAgentId}`,
        confidence: 'HIGH',
        matchedKeywords: []
      };
    }

    const normalizedPrompt = (prompt || '').toLowerCase();
    let bestMatch: { rule: RouteRule; matchedKeywords: string[]; score: number } | null = null;

    // 2. Avaliação de regras por busca de palavras-chave
    for (const rule of this.rules) {
      const matched = rule.keywords.filter(kw => normalizedPrompt.includes(kw));
      if (matched.length > 0) {
        if (!bestMatch || matched.length > bestMatch.score) {
          bestMatch = {
            rule,
            matchedKeywords: matched,
            score: matched.length
          };
        }
      }
    }

    // 3. Resultado baseado na melhor pontuação
    if (bestMatch) {
      const confidence: 'HIGH' | 'MEDIUM' = bestMatch.score >= 2 ? 'HIGH' : 'MEDIUM';
      return {
        agentId: bestMatch.rule.agentId,
        reason: `Palavras-chave de ${bestMatch.rule.domain} identificadas (${bestMatch.matchedKeywords.join(', ')})`,
        confidence,
        matchedKeywords: bestMatch.matchedKeywords
      };
    }

    // 4. Fallback padrão Synapse Copilot
    return {
      agentId: 'synapse_copilot',
      reason: 'Nenhuma palavra-chave específica encontrada. Direcionado para o Synapse Copilot padrão.',
      confidence: 'FALLBACK',
      matchedKeywords: []
    };
  }
}

export const agentRouter = new AgentRouter();
