import { describe, it, expect, beforeEach } from 'vitest';
import { contextDistributionService } from './contextDistributionService.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { strategicPlanningEngine } from '../planning/strategicPlanningEngine.ts';
import { goalEngine } from '../goals/goalEngine.ts';
import { executiveCopilotService } from '../../executiveCopilot/executiveCopilotService.ts';
import { decisionService } from '../../decision/decisionService.ts';

describe('Contextual Intelligence Distribution Engine (Fase 4.2)', () => {
  const orgA = 'org_test_dist_a';
  const orgB = 'org_test_dist_b';
  const propA1 = 'prop_test_dist_a1';
  const propA2 = 'prop_test_dist_a2';
  const propB1 = 'prop_test_dist_b1';

  beforeEach(() => {
    contextDistributionService.clearAll();
  });

  it('1. Deve criar e estruturar um insight contextual com todos os metadados requeridos', () => {
    const insight = contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue', 'reservations'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.92,
      title: 'Demanda Elevada no Próximo Fim de Semana',
      summary: 'Projeção de 95% de ocupação. Oportunidade de ajuste de RevPAR.',
      expectedImpact: {
        metric: 'revpar',
        expectedChange: '+12%',
        confidence: 0.92
      }
    });

    expect(insight).toBeDefined();
    expect(insight.insightId).toMatch(/^ins_/);
    expect(insight.organizationId).toBe(orgA);
    expect(insight.propertyId).toBe(propA1);
    expect(insight.targetModules).toContain('revenue');
    expect(insight.targetModules).toContain('reservations');
    expect(insight.priority).toBe('HIGH');
    expect(insight.confidence).toBe(0.92);
    expect(insight.status).toBe('ACTIVE');
    expect(insight.requiresApproval).toBe(false);
  });

  it('2. Deve distribuir corretamente o insight para o módulo operacional alvo', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Janela de Oportunidade de Tarifas',
      summary: 'Reajuste sugerido para diárias de sexta e sábado.'
    });

    const revenueInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue'
    });

    expect(revenueInsights.length).toBe(1);
    expect(revenueInsights[0].title).toBe('Janela de Oportunidade de Tarifas');
  });

  it('3. Módulo incorreto não deve receber insight irrelevante', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['housekeeping'],
      source: 'goal_engine',
      type: 'ALERT',
      priority: 'CRITICAL',
      confidence: 0.90,
      title: 'Pico de Check-outs às 12h',
      summary: 'Priorizar liberação de 15 suítes no bloco 2.'
    });

    const revenueInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue'
    });

    const housekeepingInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'housekeeping'
    });

    expect(revenueInsights.length).toBe(0);
    expect(housekeepingInsights.length).toBe(1);
    expect(housekeepingInsights[0].title).toBe('Pico de Check-outs às 12h');
  });

  it('4. Deve ordenar determinísticamente por prioridade (CRITICAL > HIGH > MEDIUM > LOW)', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['reception'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'LOW',
      confidence: 0.90,
      title: 'Nota informativa de rotina',
      summary: 'Ajuste de ramais internos.'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['reception'],
      source: 'system',
      type: 'ALERT',
      priority: 'CRITICAL',
      confidence: 0.85,
      title: 'Overbooking Potencial UH 104',
      summary: 'Duas reservas confirmadas com mesmo horário estimado.'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['reception'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Chegada de Hóspede VIP',
      summary: 'Hóspede frequente chega às 14h.'
    });

    const receptionInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'reception'
    });

    expect(receptionInsights.length).toBe(3);
    expect(receptionInsights[0].priority).toBe('CRITICAL');
    expect(receptionInsights[1].priority).toBe('HIGH');
    expect(receptionInsights[2].priority).toBe('LOW');
  });

  it('5. Deve filtrar rigorosamente por nível mínimo de confiança (confidence score)', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['sales'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.70,
      title: 'Projeção preliminar com dados escassos',
      summary: 'Baixa amostragem estatística.'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['sales'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.94,
      title: 'Oportunidade de Fechamento de Grupos Corporativos',
      summary: 'Alta correlação histórica identificada.'
    });

    const highConfidenceInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'sales',
      minConfidence: 0.85
    });

    expect(highConfidenceInsights.length).toBe(1);
    expect(highConfidenceInsights[0].confidence).toBe(0.94);
  });

  it('6. Deve expirar insights temporários e emitir evento ao atingir expiresAt', () => {
    let expiredEventReceived = false;
    const unsub = agentEventBus.subscribe('context:recommendation:expired', (evt) => {
      if (evt.organizationId === orgA) {
        expiredEventReceived = true;
      }
    });

    const pastDate = new Date(Date.now() - 1000 * 60).toISOString(); // 1 minuto atrás
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.90,
      title: 'Flash Sale Relâmpago Expirada',
      summary: 'Oferta válida apenas até as 18h.',
      expiresAt: pastDate,
      requiresApproval: true
    });

    // Ao consultar sem includeExpired, não deve retornar
    const activeInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue',
      includeExpired: false
    });
    expect(activeInsights.length).toBe(0);

    // Executar limpeza
    const cleanedCount = contextDistributionService.cleanExpiredInsights(orgA, propA1);
    expect(cleanedCount).toBe(1);
    expect(expiredEventReceived).toBe(true);

    unsub();
  });

  it('7. Deve isolar rigorosamente insights por organizationId', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'ALERT',
      priority: 'HIGH',
      confidence: 0.90,
      title: 'Ar condicionado UH 201 em manutenção preventiva',
      summary: 'Troca de filtro agendada.'
    });

    const orgBInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgB,
      propertyId: propA1,
      module: 'maintenance'
    });

    expect(orgBInsights.length).toBe(0);
  });

  it('8. Deve isolar rigorosamente insights por propertyId', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['direct_booking'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.89,
      title: 'Campanha de Réveillon - Propriedade A1',
      summary: 'Direcionamento específico para o Resort A1.'
    });

    const propA2Insights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA2,
      module: 'direct_booking'
    });

    expect(propA2Insights.length).toBe(0);
  });

  it('9. Deve garantir isolamento estrito entre múltiplos tenants simultâneos', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['executive'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'CRITICAL',
      confidence: 0.95,
      title: 'Tenant A Insight',
      summary: 'Segredo operacional A.'
    });

    contextDistributionService.publishInsight({
      organizationId: orgB,
      propertyId: propB1,
      targetModules: ['executive'],
      source: 'strategic_planning',
      type: 'INSIGHT',
      priority: 'CRITICAL',
      confidence: 0.95,
      title: 'Tenant B Insight',
      summary: 'Segredo operacional B.'
    });

    const tenantAInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'executive'
    });

    const tenantBInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgB,
      propertyId: propB1,
      module: 'executive'
    });

    expect(tenantAInsights.length).toBe(1);
    expect(tenantAInsights[0].title).toBe('Tenant A Insight');
    expect(tenantBInsights.length).toBe(1);
    expect(tenantBInsights[0].title).toBe('Tenant B Insight');
  });

  it('10. Deve marcar recomendações com requiresApproval e status PENDING_APPROVAL (ADR-005)', () => {
    const rec = contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Ajuste de Tarifário de Baixa Temporada',
      summary: 'Reduzir diária em 8% para elevar ocupação.',
      recommendationId: 'rec_test_adr005_123',
      requiresApproval: true
    });

    expect(rec.status).toBe('PENDING_APPROVAL');
    expect(rec.requiresApproval).toBe(true);

    const pendingList = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue',
      includePendingApproval: true
    });

    expect(pendingList.length).toBe(1);
    expect(pendingList[0].status).toBe('PENDING_APPROVAL');
  });

  it('11. Deve assegurar ausência estrita de execução operacional automática', () => {
    const rec = contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'RECOMMENDATION',
      priority: 'CRITICAL',
      confidence: 0.95,
      title: 'Alteração Tarifária Crítica',
      summary: 'Aplicação imediata sugerida.',
      requiresApproval: true
    });

    // O status permanece PENDING_APPROVAL sem autorização humana
    expect(rec.status).toBe('PENDING_APPROVAL');
    expect(rec.requiresApproval).toBe(true);

    // Simular decisão de aprovação no Approval Center
    agentEventBus.publishEvent({
      eventName: 'approval:action_decision',
      organizationId: orgA,
      propertyId: propA1,
      publisherAgentId: 'approval_center',
      payload: {
        recommendationId: rec.recommendationId,
        action: 'approved',
        decisionBy: 'GestorOperacional'
      }
    });

    // Apenas após o evento de aprovação humana a recomendação se torna ativa
    const updatedInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue'
    });
    expect(updatedInsights[0].status).toBe('ACTIVE');
  });

  it('12. Deve publicar eventos correspondentes no AgentEventBus', () => {
    const eventsCaught: string[] = [];
    const unsub = agentEventBus.subscribe('*', (evt) => {
      if (evt.eventName.startsWith('context:')) {
        eventsCaught.push(evt.eventName);
      }
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['marketing'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'MEDIUM',
      confidence: 0.85,
      title: 'Insight Test',
      summary: 'Test'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['marketing'],
      source: 'system',
      type: 'ALERT',
      priority: 'CRITICAL',
      confidence: 0.90,
      title: 'Alert Test',
      summary: 'Test'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['marketing'],
      source: 'system',
      type: 'RECOMMENDATION',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Rec Test',
      summary: 'Test',
      requiresApproval: true
    });

    expect(eventsCaught).toContain('context:insight:created');
    expect(eventsCaught).toContain('context:alert:created');
    expect(eventsCaught).toContain('context:recommendation:created');

    unsub();
  });

  it('13. Deve sincronizar e isolar o estado no AgentSharedMemory por módulo', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['housekeeping'],
      source: 'goal_engine',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.90,
      title: 'Meta de SLA de Limpeza Atingida',
      summary: 'Tempo médio de turnaround caiu para 22 minutos.'
    });

    const scope = { organizationId: orgA, propertyId: propA1, sessionId: 'context_housekeeping' };
    const sharedInsights = agentSharedMemory.getValue<any[]>('module_insights_housekeeping', scope);

    expect(sharedInsights).toBeDefined();
    expect(Array.isArray(sharedInsights)).toBe(true);
    expect(sharedInsights!.length).toBeGreaterThan(0);
    const lastItem = sharedInsights![sharedInsights!.length - 1];
    expect(lastItem.title).toBe('Meta de SLA de Limpeza Atingida');
  });

  it('14. Deve reagir automaticamente ao ciclo do StrategicPlanningEngine', async () => {
    // Executar ciclo de planejamento estratégico
    await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: orgA,
      propertyId: propA1,
      actor: 'ExecutiveBrainTest'
    });

    // O StrategicPlanningEngine emite planning:plan_created e o ContextDistributionService recebe
    const execInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'executive'
    });

    expect(execInsights.length).toBeGreaterThan(0);
    expect(execInsights.some(i => i.title.includes('Plano Estratégico'))).toBe(true);
  });

  it('15. Deve reagir automaticamente aos eventos de metas do GoalEngine', () => {
    // Simular evento goal:created
    agentEventBus.publishEvent({
      eventName: 'goal:created',
      organizationId: orgA,
      propertyId: propA1,
      publisherAgentId: 'goal_engine',
      payload: {
        goalId: 'goal_test_occ_999',
        title: 'Alavancar Ocupação de Terça a Quinta',
        definition: {
          objective: 'Subir ocupação mid-week de 40% para 65%',
          relatedKPIs: ['occupancy_rate', 'revpar'],
          involvedAgents: ['revenue_agent', 'direct_sales_agent']
        }
      }
    });

    const revenueInsights = contextDistributionService.getInsightsForModule({
      organizationId: orgA,
      propertyId: propA1,
      module: 'revenue'
    });

    expect(revenueInsights.length).toBeGreaterThan(0);
    expect(revenueInsights[0].type).toBe('GOAL_CONTEXT');
    expect(revenueInsights[0].title).toContain('Alavancar Ocupação');
  });

  it('16. Deve integrar com ExecutiveCopilotService disponibilizando resumos distribuídos', async () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue'],
      source: 'strategic_planning',
      type: 'ALERT',
      priority: 'CRITICAL',
      confidence: 0.92,
      title: 'Risco de Perda de Receita na Baixa',
      summary: 'Atraso na contratação de campanhas.'
    });

    const distributedSummary = await executiveCopilotService.getDistributedContextSummary(orgA, propA1);

    expect(distributedSummary).toBeDefined();
    expect(distributedSummary.revenue).toBeDefined();
    expect(distributedSummary.revenue.criticalAlertsCount).toBeGreaterThanOrEqual(1);
    expect(distributedSummary.revenue.topInsights[0].title).toBe('Risco de Perda de Receita na Baixa');
  });

  it('17. Deve integrar com DecisionService disponibilizando contexto por departamento', async () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['maintenance'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.90,
      title: 'Manutenção Preventiva de Geradores',
      summary: 'Revisão concluída com 100% de conformidade técnica.'
    });

    const deptContext = await decisionService.getDistributedContextForDepartment(orgA, propA1, 'maintenance');

    expect(deptContext).toBeDefined();
    expect(deptContext.module).toBe('maintenance');
    expect(deptContext.activeInsightsCount).toBeGreaterThanOrEqual(1);
    expect(deptContext.topInsights[0].title).toBe('Manutenção Preventiva de Geradores');
  });

  it('18. Deve suportar múltiplas propriedades da mesma organização com resumos independentes', () => {
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['marketing'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Campanha Propriedade A1',
      summary: 'Resumo A1'
    });

    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA2,
      targetModules: ['marketing'],
      source: 'system',
      type: 'INSIGHT',
      priority: 'HIGH',
      confidence: 0.88,
      title: 'Campanha Propriedade A2',
      summary: 'Resumo A2'
    });

    const sumA1 = contextDistributionService.getModuleContextSummary('marketing', orgA, propA1);
    const sumA2 = contextDistributionService.getModuleContextSummary('marketing', orgA, propA2);

    expect(sumA1.activeInsightsCount).toBe(1);
    expect(sumA1.topInsights[0].title).toBe('Campanha Propriedade A1');

    expect(sumA2.activeInsightsCount).toBe(1);
    expect(sumA2.topInsights[0].title).toBe('Campanha Propriedade A2');
  });

  it('19. Deve distribuir múltiplos objetivos simultâneos para diferentes departamentos', () => {
    // Meta de Ocupação -> Revenue e PMS
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['revenue', 'pms'],
      source: 'goal_engine',
      type: 'GOAL_CONTEXT',
      priority: 'HIGH',
      confidence: 0.90,
      goalId: 'goal_rev_01',
      title: 'Meta: Ocupação 75%',
      summary: 'Ajuste tarifário e distribuição de canais.'
    });

    // Meta de Governança -> Housekeeping
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['housekeeping'],
      source: 'goal_engine',
      type: 'GOAL_CONTEXT',
      priority: 'HIGH',
      confidence: 0.90,
      goalId: 'goal_hk_02',
      title: 'Meta: SLA Limpeza 20min',
      summary: 'Otimização de rotas de camareiras.'
    });

    // Meta de Vendas Diretas -> Sales e Direct Booking
    contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: ['sales', 'direct_booking'],
      source: 'goal_engine',
      type: 'GOAL_CONTEXT',
      priority: 'HIGH',
      confidence: 0.90,
      goalId: 'goal_sales_03',
      title: 'Meta: 40% Vendas Diretas',
      summary: 'Incentivo de reservas pelo motor próprio.'
    });

    const revSum = contextDistributionService.getModuleContextSummary('revenue', orgA, propA1);
    const hkSum = contextDistributionService.getModuleContextSummary('housekeeping', orgA, propA1);
    const salesSum = contextDistributionService.getModuleContextSummary('sales', orgA, propA1);

    expect(revSum.relatedGoals).toContain('goal_rev_01');
    expect(hkSum.relatedGoals).toContain('goal_hk_02');
    expect(salesSum.relatedGoals).toContain('goal_sales_03');
  });

  it('20. Deve tratar robustamente dados insuficientes / inputs parciais sem quebrar o motor', () => {
    // Chamar com filtros vazios ou nulos
    const emptyResult = contextDistributionService.getInsightsForModule({
      organizationId: '',
      propertyId: '',
      module: 'revenue'
    });
    expect(emptyResult).toEqual([]);

    // Chamar publicação sem dados opcionais
    const minimalInsight = contextDistributionService.publishInsight({
      organizationId: orgA,
      propertyId: propA1,
      targetModules: [],
      source: 'system',
      type: 'INSIGHT',
      priority: 'LOW',
      confidence: 0.5,
      title: '',
      summary: ''
    });

    expect(minimalInsight).toBeDefined();
    expect(minimalInsight.targetModules).toContain('executive');
    expect(minimalInsight.status).toBe('ACTIVE');

    // Chamar cleanExpiredInsights em store vazio
    const cleaned = contextDistributionService.cleanExpiredInsights('non_existent_org', 'non_existent_prop');
    expect(cleaned).toBe(0);
  });
});
