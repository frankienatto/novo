import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contextDistributionService } from './contextDistributionService.ts';
import { QUERY_KEYS } from '../../../../src/core/api/queryKeys.ts';
import { decisionApi } from '../../../../src/core/api/moduleApis.ts';
import { httpClient } from '../../../../src/core/api/httpClient.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';

describe('Frontend Contextual Intelligence Distribution & Operational UI Integration (Fase 4.3)', () => {
  const orgAlpha = 'org_hotel_chain_alpha';
  const orgBeta = 'org_hotel_chain_beta';
  const propResort = 'prop_beach_resort_01';
  const propCity = 'prop_urban_hotel_02';
  const propBetaResort = 'prop_beta_island_01';

  beforeEach(() => {
    contextDistributionService.clearAll();
    vi.restoreAllMocks();
  });

  // 1. Renderização de insight
  it('1. Renderização de insight: deve prover todos os campos necessários para renderização visual rica e acessível', () => {
    const insight = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['pms'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.93,
      title: 'Alta Taxa de Ocupação no Fim de Semana',
      summary: 'Previsão de 95% de ocupação com base no histórico de feriados.',
      description: 'Recomenda-se alocação antecipada de equipe e bloqueio preventivo de quartos para manutenção.',
      expectedImpact: {
        metric: 'revpar',
        expectedChange: '+12%',
        confidence: 0.90
      }
    });

    const insights = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'pms'
    });

    expect(insights.length).toBe(1);
    const item = insights[0];
    expect(item.insightId).toBe(insight.insightId);
    expect(item.title).toBe('Alta Taxa de Ocupação no Fim de Semana');
    expect(item.summary).toContain('Previsão de 95%');
    expect(item.description).toBeDefined();
    expect(item.priority).toBe('HIGH');
    expect(item.confidence).toBe(0.93);
    expect(item.source).toBe('strategic_planning');
    expect(item.type).toBe('INSIGHT');
    expect(item.expectedImpact?.metric).toBe('revpar');
    expect(item.createdAt).toBeDefined();
  });

  // 2. Ausência de insights
  it('2. Ausência de insights: deve prover estado calmo com contadores zerados sem gerar erros ou ruído visual', () => {
    const summary = contextDistributionService.getModuleContextSummary('housekeeping', orgAlpha, propResort);
    const list = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'housekeeping'
    });

    expect(list).toEqual([]);
    expect(summary.activeInsightsCount).toBe(0);
    expect(summary.criticalAlertsCount).toBe(0);
    expect(summary.pendingRecommendationsCount).toBe(0);
    expect(summary.relatedGoals).toEqual([]);
  });

  // 3. Múltiplos insights
  it('3. Múltiplos insights: deve consolidar e agrupar múltiplos insights simultâneos para um módulo', () => {
    for (let i = 1; i <= 4; i++) {
      contextDistributionService.publishInsight({
        organizationId: orgAlpha,
        propertyId: propResort,
        targetModules: ['revenue'],
        source: 'strategic_planning',
        type: i === 1 ? 'ALERT' : 'INSIGHT',
        priority: i === 1 ? 'CRITICAL' : 'MEDIUM',
        confidence: 0.85 + (i * 0.02),
        title: `Alerta de Demanda #${i}`,
        summary: `Resumo de curva de demanda #${i}`
      });
    }

    const summary = contextDistributionService.getModuleContextSummary('revenue', orgAlpha, propResort);
    const list = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'revenue'
    });

    expect(list.length).toBe(4);
    expect(summary.activeInsightsCount).toBe(4);
    expect(summary.criticalAlertsCount).toBe(1);
  });

  // 4. Prioridade
  it('4. Prioridade: deve ordenar determinísticamente os insights por severidade (CRITICAL > HIGH > MEDIUM > LOW)', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'LOW',
      confidence: 0.9,
      title: 'Baixa prioridade',
      summary: 'Troca de filtro de rotina'
    });

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'ALERT',
      priority: 'CRITICAL',
      confidence: 0.99,
      title: 'Vazamento Crítico',
      summary: 'Inundação no subsolo'
    });

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Aquecedor com falha',
      summary: 'Desarme de disjuntor'
    });

    const list = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'maintenance'
    });

    expect(list[0].priority).toBe('CRITICAL');
    expect(list[1].priority).toBe('HIGH');
    expect(list[2].priority).toBe('LOW');
  });

  // 5. Confidence score
  it('5. Confidence score: deve filtrar e validar métricas mínimas de confiança estatística', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['sales'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.92,
      title: 'Alta Confiança',
      summary: 'Conversão garantida de grupo'
    });

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['sales'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.65,
      title: 'Baixa Confiança',
      summary: 'Lead incerto'
    });

    const filtered = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'sales',
      minConfidence: 0.80
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].confidence).toBe(0.92);
  });

  // 6. Status
  it('6. Status: deve refletir estados ACTIVE, EXPIRED, PENDING_APPROVAL e DISMISSED de forma consistente', () => {
    // 1. ACTIVE
    const activeInsight = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['reception'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.9,
      title: 'VIP chegando em 1h',
      summary: 'Quarto 402 preparado com amenidades.'
    });
    expect(activeInsight.status).toBe('ACTIVE');

    // 2. PENDING_APPROVAL
    const recInsight = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['reception'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.9,
      title: 'Upgrade Cortesia',
      summary: 'Requer aprovação humana prévia',
      requiresApproval: true
    });
    expect(recInsight.status).toBe('PENDING_APPROVAL');

    // 3. DISMISSED (quando rejeitado pelo Approval Center)
    agentEventBus.publishEvent({
      eventName: 'approval:action_decision',
      organizationId: orgAlpha,
      propertyId: propResort,
      publisherAgentId: 'approval_center',
      payload: {
        recommendationId: recInsight.recommendationId,
        action: 'rejected'
      }
    });

    const activeList = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'reception'
    });
    // O rejeitado (DISMISSED) não aparece nos insights ativos
    expect(activeList.find(i => i.insightId === recInsight.insightId)).toBeUndefined();
    expect(activeList.find(i => i.insightId === activeInsight.insightId)).toBeDefined();
  });

  // 7. Expiração
  it('7. Expiração: deve remover e ocultar automaticamente insights cujo TTL expirou', () => {
    const expiredTime = new Date(Date.now() - 5000).toISOString();
    const validTime = new Date(Date.now() + 60000).toISOString();

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['marketing'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.85,
      title: 'Flash Promo Vencida',
      summary: 'Válida apenas até 10 minutos atrás',
      expiresAt: expiredTime
    });

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['marketing'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.85,
      title: 'Flash Promo Ativa',
      summary: 'Válida por mais 1 hora',
      expiresAt: validTime
    });

    const activeMarketing = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'marketing'
    });

    expect(activeMarketing.length).toBe(1);
    expect(activeMarketing[0].title).toBe('Flash Promo Ativa');
  });

  // 8. Filtro por módulo
  it('8. Filtro por módulo: deve segmentar rigorosamente insights direcionados para targetModules específicos', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['housekeeping'],
      source: 'system',
      type: 'ALERT',
      priority: 'HIGH',
      confidence: 0.95,
      title: 'Troca Urgente de Roupa de Cama 204',
      summary: 'Check-in antecipado solicitado'
    });

    const hkInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'housekeeping'
    });

    const maintenanceInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'maintenance'
    });

    expect(hkInsights.length).toBe(1);
    expect(maintenanceInsights.length).toBe(0);
  });

  // 9. Isolamento organizationId
  it('9. Isolamento organizationId: dados de diferentes organizações nunca devem se misturar', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['reservations'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.9,
      title: 'Insight Confidencial Org Alpha',
      summary: 'Dados de Alpha'
    });

    contextDistributionService.publishInsight({
      organizationId: orgBeta,
      propertyId: propBetaResort,
      targetModules: ['reservations'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.9,
      title: 'Insight Confidencial Org Beta',
      summary: 'Dados de Beta'
    });

    const alphaList = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'reservations'
    });

    const betaList = contextDistributionService.getInsightsForModule({
      organizationId: orgBeta,
      propertyId: propBetaResort,
      module: 'reservations'
    });

    expect(alphaList.length).toBe(1);
    expect(alphaList[0].title).toBe('Insight Confidencial Org Alpha');
    expect(betaList.length).toBe(1);
    expect(betaList[0].title).toBe('Insight Confidencial Org Beta');
  });

  // 10. Isolamento propertyId
  it('10. Isolamento propertyId: dados de propriedades distintas dentro da mesma organização devem ser isolados', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['pms'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.9,
      title: 'Ocupação Resort Praia',
      summary: 'Praia em alta'
    });

    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propCity,
      targetModules: ['pms'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.9,
      title: 'Ocupação Hotel Urbano',
      summary: 'Centro em calmaria'
    });

    const resortList = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'pms'
    });

    const cityList = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propCity,
      module: 'pms'
    });

    expect(resortList.length).toBe(1);
    expect(resortList[0].title).toBe('Ocupação Resort Praia');
    expect(cityList.length).toBe(1);
    expect(cityList[0].title).toBe('Ocupação Hotel Urbano');
  });

  // 11. Recommendation
  it('11. Recommendation: recomendações estratégicas devem conter justificativa prescritiva e impacto financeiro', () => {
    const rec = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.94,
      title: 'Ajuste de Tarifa Balcão em +15%',
      summary: 'Aumento de tarifa para o réveillon devido à alta procura.',
      requiresApproval: true,
      expectedImpact: {
        metric: 'revpar',
        expectedChange: '+18.5%',
        confidence: 0.92
      },
      actualImpact: {
        outcome: 'EXCEEDED',
        achievementRatePercent: 110
      }
    });

    expect(rec.type).toBe('RECOMMENDATION');
    expect(rec.expectedImpact?.expectedChange).toBe('+18.5%');
    expect(rec.actualImpact?.achievementRatePercent).toBe(110);
  });

  // 12. PENDING_APPROVAL
  it('12. PENDING_APPROVAL: recomendações estratégicas iniciam obrigatoriamente em estado pendente de decisão', () => {
    const rec = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['direct_booking'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.89,
      title: 'Ativar Cupom de Desconto de 10% no Motor Direto',
      summary: 'Aumentar taxa de conversão direta contra booking.com',
      requiresApproval: true
    });

    expect(rec.status).toBe('PENDING_APPROVAL');
    expect(rec.requiresApproval).toBe(true);
  });

  // 13. requiresApproval
  it('13. requiresApproval: flag de governança ADR-005 deve ser estritamente preservada', () => {
    const nonApprovalInsight = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['reception'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'LOW',
      confidence: 0.9,
      title: 'Informativo Climático',
      summary: 'Previsão de chuva amanhã',
      requiresApproval: false
    });

    const approvalRecommendation = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['reception'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.95,
      title: 'Permitir Early Check-in Cortesia',
      summary: 'Liberar hóspede Diamante sem cobrança de taxa',
      requiresApproval: true
    });

    expect(nonApprovalInsight.requiresApproval).toBe(false);
    expect(nonApprovalInsight.status).toBe('ACTIVE');

    expect(approvalRecommendation.requiresApproval).toBe(true);
    expect(approvalRecommendation.status).toBe('PENDING_APPROVAL');
  });

  // 14. Encaminhamento ao Approval Center
  it('14. Encaminhamento ao Approval Center: UI deve direcionar itens pendentes exclusivamente para o Approval Center', () => {
    contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.96,
      title: 'Alteração em massa de Tarifário de Temporada',
      summary: 'Requer chancela executiva formal.',
      requiresApproval: true
    });

    const summary = contextDistributionService.getModuleContextSummary('revenue', orgAlpha, propResort);
    expect(summary.pendingRecommendationsCount).toBe(1);

    // O summary sinaliza que há itens pendentes para o Approval Center oficial
    expect(summary.pendingRecommendationsCount).toBeGreaterThan(0);
  });

  // 15. Ausência de execução automática
  it('15. Ausência de execução automática: nenhuma ação operacional pode ser despachada sem aprovação humana', () => {
    const rec = contextDistributionService.publishInsight({
      organizationId: orgAlpha,
      propertyId: propResort,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'RECOMMENDATION',
      priority: 'CRITICAL',
      confidence: 0.99,
      title: 'Desligamento Preventivo de Caldeira 02',
      summary: 'Superaquecimento. Parada imediata sugerida.',
      requiresApproval: true
    });

    // O status JAMAIS muda para APPROVED ou EXECUTED sem aprovação explícita
    expect(rec.status).toBe('PENDING_APPROVAL');
    expect(rec.requiresApproval).toBe(true);

    const list = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'maintenance'
    });

    expect(list[0].status).toBe('PENDING_APPROVAL');
  });

  // 16. Dados insuficientes
  it('16. Dados insuficientes: deve tratar com resiliência inputs incompletos, nulos ou módulos inexistentes', () => {
    const summary = contextDistributionService.getModuleContextSummary('non_existent' as any, orgAlpha, propResort);
    const list = contextDistributionService.getInsightsForModule({
      organizationId: orgAlpha,
      propertyId: propResort,
      module: 'non_existent' as any
    });

    expect(summary.activeInsightsCount).toBe(0);
    expect(list).toEqual([]);
  });

  // 17. Query/Cache
  it('17. Query/Cache: deve gerar queryKeys escopadas por orgId, propId e módulo com isolamento total', () => {
    const qkPms = QUERY_KEYS.decision.moduleContext(orgAlpha, propResort, 'pms');
    const qkRevenue = QUERY_KEYS.decision.moduleContext(orgAlpha, propResort, 'revenue');
    const qkOrgBeta = QUERY_KEYS.decision.moduleContext(orgBeta, propBetaResort, 'pms');

    expect(qkPms).toEqual(['decision', 'context', orgAlpha, propResort, 'pms']);
    expect(qkRevenue).toEqual(['decision', 'context', orgAlpha, propResort, 'revenue']);
    expect(qkOrgBeta).toEqual(['decision', 'context', orgBeta, propBetaResort, 'pms']);

    expect(qkPms).not.toEqual(qkRevenue);
    expect(qkPms).not.toEqual(qkOrgBeta);
  });

  // 18. Múltiplos módulos (10 módulos operacionais oficiais)
  it('18. Múltiplos módulos: deve suportar simultaneamente a distribuição para os 10 módulos oficiais da plataforma', () => {
    const officialModules = [
      'pms',
      'reservations',
      'reception',
      'housekeeping',
      'maintenance',
      'revenue',
      'sales',
      'direct_booking',
      'marketing',
      'executive'
    ];

    expect(officialModules.length).toBe(10);

    for (const mod of officialModules) {
      contextDistributionService.clearAll();
      contextDistributionService.publishInsight({
        organizationId: orgAlpha,
        propertyId: propResort,
        targetModules: [mod as any],
        source: 'system',
        type: 'INSIGHT',
        priority: 'MEDIUM',
        confidence: 0.9,
        title: `Diretriz Operacional ${mod}`,
        summary: `Contexto para módulo ${mod}`
      });

      const insights = contextDistributionService.getInsightsForModule({
        organizationId: orgAlpha,
        propertyId: propResort,
        module: mod as any
      });

      expect(insights.length).toBe(1);
      expect(insights[0].targetModules).toContain(mod);
    }
  });

  // 19. Comportamento de carregamento/erro
  it('19. Comportamento de carregamento/erro: decisionApi deve retornar null e evitar chamadas com IDs vazios', async () => {
    const httpGetSpy = vi.spyOn(httpClient, 'get');

    const result = await decisionApi.getModuleContext('', '', 'pms');
    expect(result).toBeNull();
    expect(httpGetSpy).not.toHaveBeenCalled();

    const resultWithPropOnly = await decisionApi.getModuleContext(orgAlpha, '', 'pms');
    expect(resultWithPropOnly).toBeNull();
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  // 20. Integração com contexto oficial da plataforma
  it('20. Integração com contexto oficial: deve garantir que o tenant seja obtido estritamente via contexto oficial', async () => {
    const mockResponse = {
      status: 'SUCCESS',
      data: {
        summary: {
          module: 'executive',
          activeInsightsCount: 1,
          criticalAlertsCount: 0,
          pendingRecommendationsCount: 0,
          topPriority: 'HIGH',
          relatedGoals: ['goal_q3']
        },
        insights: [
          {
            insightId: 'ins_exec_01',
            organizationId: orgAlpha,
            propertyId: propResort,
            targetModules: ['executive'],
            source: 'strategic_planning',
            type: 'STRATEGIC_OPPORTUNITY',
            priority: 'HIGH',
            confidence: 0.95,
            title: 'Meta Q3 Atingida',
            summary: 'Receita 14% acima do budget',
            status: 'ACTIVE',
            requiresApproval: false,
            createdAt: new Date().toISOString()
          }
        ]
      }
    };

    const httpGetSpy = vi.spyOn(httpClient, 'get').mockResolvedValue(mockResponse as any);

    const res = await decisionApi.getModuleContext(orgAlpha, propResort, 'executive', 'HIGH', 0.9);

    expect(httpGetSpy).toHaveBeenCalledWith(
      `/api/decision/context/executive?orgId=${orgAlpha}&propertyId=${propResort}&minPriority=HIGH&minConfidence=0.9`
    );
    expect(res?.data.summary.module).toBe('executive');
    expect(res?.data.insights[0].insightId).toBe('ins_exec_01');
  });
});
