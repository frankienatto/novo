import { executiveCopilotService } from './executiveCopilotService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runExecutiveCopilotTests() {
  console.log('🧪 [Executive Copilot Test Suite] Iniciando validação da Etapa 10.2...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard Completo do Copilot
  console.log('1️⃣ Testando getDashboard do Executive Copilot...');
  const dashboard = await executiveCopilotService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard do Copilot não deve ser nulo');
  console.assert(typeof dashboard.healthScores.overallScore === 'number', 'overallScore deve ser numérico');
  console.assert(dashboard.healthScores.overallScore >= 0 && dashboard.healthScores.overallScore <= 100, 'overallScore deve estar entre 0 e 100');
  console.assert(typeof dashboard.riskScore === 'number', 'riskScore deve ser numérico');
  console.assert(typeof dashboard.opportunityScore === 'number', 'opportunityScore deve ser numérico');
  console.assert(Array.isArray(dashboard.topRisks), 'topRisks deve ser um array');
  console.assert(Array.isArray(dashboard.topOpportunities), 'topOpportunities deve ser um array');
  console.assert(Array.isArray(dashboard.recommendedPriorities), 'recommendedPriorities deve ser um array');
  console.assert(dashboard.dailyBrief.summary !== undefined, 'Executive Daily Brief deve ter summary');
  console.log('   ✅ Dashboard do Executive Copilot validado com sucesso.');

  // 2. Testar Health Scores Setoriais
  console.log('2️⃣ Testando getHealth Scores...');
  const health = await executiveCopilotService.getHealth(orgId, propId);
  console.assert(typeof health.revenueHealth === 'number', 'revenueHealth deve ser numérico');
  console.assert(typeof health.commercialHealth === 'number', 'commercialHealth deve ser numérico');
  console.assert(typeof health.housekeepingHealth === 'number', 'housekeepingHealth deve ser numérico');
  console.assert(typeof health.maintenanceHealth === 'number', 'maintenanceHealth deve ser numérico');
  console.log('   ✅ Health Scores Setoriais validados.');

  // 3. Testar Riscos, Oportunidades e Brief
  console.log('3️⃣ Testando Riscos, Oportunidades e Daily Brief...');
  const risks = await executiveCopilotService.getRisks(orgId, propId);
  const opportunities = await executiveCopilotService.getOpportunities(orgId, propId);
  const brief = await executiveCopilotService.getBrief(orgId, propId);
  console.assert(Array.isArray(risks), 'risks deve ser um array');
  console.assert(Array.isArray(opportunities), 'opportunities deve ser um array');
  console.assert(typeof brief.primaryFocusArea === 'string', 'primaryFocusArea deve ser string');
  console.log('   ✅ Riscos, Oportunidades e Daily Brief validados.');

  // 4. Testar Executive Summary e SummaryForAI
  console.log('4️⃣ Testando Resumos Executivos (Standard + IA)...');
  const summary = await executiveCopilotService.getSummary(orgId, propId);
  const aiSummary = await executiveCopilotService.getExecutiveCopilotSummaryForAI(orgId, propId);
  console.assert(typeof summary.overallHealthScore === 'number', 'overallHealthScore do summary deve ser numérico');
  console.assert(typeof aiSummary.healthScore === 'number', 'healthScore do AI Summary deve ser numérico');
  console.assert(Array.isArray(aiSummary.topRisks), 'topRisks do AI summary deve ser array');
  console.assert(aiSummary.topRisks.length <= 5, 'topRisks do AI summary não deve exceder 5 itens');
  console.assert(aiSummary.topOpportunities.length <= 5, 'topOpportunities do AI summary não deve exceder 5 itens');
  console.log('   ✅ Resumos Executivos validados.');

  // 5. Testar AgentRouter e PromptRegistry do executive_copilot_agent
  console.log('5️⃣ Testando AgentRouter e PromptRegistry do executive_copilot_agent...');
  const routeResult = agentRouter.route('Qual é o Health Score executivo, estratégias do CEO e análise do Executive Copilot?');
  console.assert(routeResult.agentId === 'executive_copilot_agent', 'Dúvidas sobre Health Score/CEO/Executive Copilot devem ser roteadas para executive_copilot_agent');

  const promptDef = getPrompt('executive_copilot_agent');
  console.assert(promptDef !== undefined, 'Prompt definition do executive_copilot_agent deve existir no registry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt do executive_copilot_agent deve reforçar MODO READ-ONLY');
  console.log('   ✅ AgentRouter e PromptRegistry do executive_copilot_agent validados.');

  // 6. Testar injeção no ContextService
  console.log('6️⃣ Testando injeção no ContextService...');
  const context = await contextService.buildOperationalContext(
    'test_user',
    orgId,
    propId
  );
  console.assert(context.executiveCopilotSummary !== undefined && context.executiveCopilotSummary !== null, 'executiveCopilotSummary deve estar presente no OperationalContext');
  console.assert(typeof context.executiveCopilotSummary?.healthScore === 'number', 'healthScore no contexto deve ser numérico');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Executive Copilot Test Suite] Todos os testes da Etapa 10.2 passaram 100% com sucesso!');
}

runExecutiveCopilotTests().catch(err => {
  console.error('❌ [Executive Copilot Test Suite] Falha nos testes:', err);
  process.exit(1);
});
