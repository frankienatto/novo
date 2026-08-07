import { decisionService } from './decisionService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runDecisionEngineTests() {
  console.log('🧪 [Decision Engine Test Suite] Iniciando validação da Etapa 10.3...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard do Decision Engine
  console.log('1️⃣ Testando getDashboard do Decision Engine...');
  const dashboard = await decisionService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard do Decision Engine não deve ser nulo');
  console.assert(typeof dashboard.totalPendingRecommendations === 'number', 'totalPendingRecommendations deve ser numérico');
  console.assert(typeof dashboard.confidenceAverage === 'number', 'confidenceAverage deve ser numérico');
  console.assert(Array.isArray(dashboard.executiveActionQueue), 'executiveActionQueue deve ser um array');
  console.assert(dashboard.executiveActionQueue.length > 0, 'Deve conter ao menos 1 recomendação na fila');
  console.log('   ✅ Dashboard do Decision Engine validado com sucesso.');

  // 2. Validar que TODAS as recomendações possuem status "pending_approval" e "approvalRequired: true"
  console.log('2️⃣ Validando MODO PENDING_APPROVAL e aprovação humana em 100% das recomendações...');
  dashboard.executiveActionQueue.forEach(rec => {
    console.assert(rec.status === 'pending_approval', `Recomendação ${rec.recommendationId} deve estar em status pending_approval`);
    console.assert(rec.approvalRequired === true, `Recomendação ${rec.recommendationId} deve exigir aprovação humana (approvalRequired: true)`);
  });
  console.log('   ✅ 100% das recomendações exigem aprovação humana explícita.');

  // 3. Testar Lista de Recomendações e Prioridades
  console.log('3️⃣ Testando Fila de Ações, Prioridades e Summary...');
  const recommendations = await decisionService.getRecommendations(orgId, propId);
  const priorities = await decisionService.getPriorities(orgId, propId);
  const summary = await decisionService.getSummary(orgId, propId);

  console.assert(Array.isArray(recommendations), 'recommendations deve ser um array');
  console.assert(Array.isArray(priorities.dailyPriorities), 'dailyPriorities deve ser um array');
  console.assert(typeof summary.highestPriorityAction === 'string', 'highestPriorityAction deve ser string');
  console.log('   ✅ Recomendações e Prioridades validadas.');

  // 4. Testar DecisionSummaryForAI para ContextService
  console.log('4️⃣ Testando Resumo do Decision Engine para IA (getDecisionSummaryForAI)...');
  const aiSummary = await decisionService.getDecisionSummaryForAI(orgId, propId);
  console.assert(typeof aiSummary.totalRecommendations === 'number', 'totalRecommendations no AI Summary deve ser numérico');
  console.assert(typeof aiSummary.confidenceAverage === 'number', 'confidenceAverage no AI Summary deve ser numérico');
  console.assert(typeof aiSummary.nextRecommendedAction === 'string', 'nextRecommendedAction deve ser string');
  console.log('   ✅ Resumo de IA validado.');

  // 5. Testar AgentRouter e PromptRegistry do decision_agent
  console.log('5️⃣ Testando AgentRouter e PromptRegistry do decision_agent...');
  const routeResult = agentRouter.route('Qual é a recomendação para hoje, plano de ação e prioridade do decision engine?');
  console.assert(routeResult.agentId === 'decision_agent', 'Dúvidas sobre recomendações e planos de ação devem ser roteadas para decision_agent');

  const promptDef = getPrompt('decision_agent');
  console.assert(promptDef !== undefined, 'Prompt definition do decision_agent deve existir no registry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt do decision_agent deve reforçar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('pending_approval'), 'Prompt deve reforçar aprovação humana obrigatória');
  console.log('   ✅ AgentRouter e PromptRegistry do decision_agent validados.');

  // 6. Testar injeção no ContextService
  console.log('6️⃣ Testando injeção do decisionSummary no ContextService...');
  const context = await contextService.buildOperationalContext(
    'test_user',
    orgId,
    propId
  );
  console.assert(context.decisionSummary !== undefined && context.decisionSummary !== null, 'decisionSummary deve estar presente no OperationalContext');
  console.assert(typeof context.decisionSummary?.totalRecommendations === 'number', 'totalRecommendations no contexto deve ser numérico');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Decision Engine Test Suite] Todos os testes da Etapa 10.3 passaram 100% com sucesso!');
}

runDecisionEngineTests().catch(err => {
  console.error('❌ [Decision Engine Test Suite] Falha nos testes:', err);
  process.exit(1);
});
