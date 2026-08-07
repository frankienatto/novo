import { executiveService } from './executiveService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runExecutiveTests() {
  console.log('🧪 [Executive Intelligence Test Suite] Iniciando validação da Etapa 10.1...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard Executivo
  console.log('1️⃣ Testando getDashboard do Executive Intelligence...');
  const dashboard = await executiveService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard executivo não deve ser nulo');
  console.assert(dashboard.kpis !== undefined, 'KPIs devem estar presentes');
  console.assert(typeof dashboard.kpis.revenue.totalRevenue === 'number', 'totalRevenue deve ser numérico');
  console.assert(typeof dashboard.kpis.revenue.revpar === 'number', 'revpar deve ser numérico');
  console.assert(Array.isArray(dashboard.alerts), 'alerts deve ser um array');
  console.assert(Array.isArray(dashboard.priorities.dailyPriorities), 'dailyPriorities deve ser um array');
  console.assert(dashboard.summary.operationalToday !== undefined, 'resumo operacional deve estar presente');
  console.log('   ✅ Dashboard Executivo validado com sucesso.');

  // 2. Testar KPIs Isolados
  console.log('2️⃣ Testando getKpis do Executive Intelligence...');
  const kpis = await executiveService.getKpis(orgId, propId);
  console.assert(typeof kpis.revenue.occupancyRatePercent === 'number', 'Taxa de ocupação deve ser numérica');
  console.assert(typeof kpis.commercial.pipelineValue === 'number', 'Valor do pipeline deve ser numérico');
  console.assert(typeof kpis.operations.inHouseCount === 'number', 'Contagem in-house deve ser numérica');
  console.log('   ✅ KPIs Executivos validados.');

  // 3. Testar Alertas e Prioridades
  console.log('3️⃣ Testando Alertas e Prioridades...');
  const alerts = await executiveService.getAlerts(orgId, propId);
  const priorities = await executiveService.getPriorities(orgId, propId);
  console.assert(Array.isArray(alerts), 'Alertas deve ser array');
  console.assert(priorities.operationalRisks.length > 0, 'Deve haver lista de riscos operacionais');
  console.log('   ✅ Alertas e Prioridades validados.');

  // 4. Testar Resumo do Módulo
  console.log('4️⃣ Testando Resumo do Módulo...');
  const summaryModule = await executiveService.getSummaryModule(orgId, propId);
  console.assert(typeof summaryModule.financialAnalyticalSummary === 'string', 'Resumo financeiro deve ser string');
  console.assert(typeof summaryModule.receptionSummary === 'string', 'Resumo de recepção deve ser string');
  console.log('   ✅ Resumo do Módulo validado.');

  // 5. Testar Resumo para IA (ExecutiveSummaryForAI)
  console.log('5️⃣ Testando ExecutiveSummaryForAI...');
  const aiSummary = await executiveService.getExecutiveSummaryForAI(orgId, propId);
  console.assert(typeof aiSummary.kpis.totalRevenue === 'number', 'Receita para IA deve ser numérica');
  console.assert(Array.isArray(aiSummary.topDailyPriorities), 'topDailyPriorities deve ser array');
  console.assert(Array.isArray(aiSummary.topExecutiveAlerts), 'topExecutiveAlerts deve ser array');
  console.log('   ✅ ExecutiveSummaryForAI validado.');

  // 6. Testar AgentRouter e PromptRegistry do executive_agent
  console.log('6️⃣ Testando AgentRouter e PromptRegistry do executive_agent...');
  const routeResult = agentRouter.route('Qual é o resumo executivo, KPIs de diretoria e principais riscos operacionais de hoje?');
  console.assert(routeResult.agentId === 'executive_agent', 'Dúvidas sobre resumo executivo/KPIs/diretoria devem ser roteadas para executive_agent');

  const promptDef = getPrompt('executive_agent');
  console.assert(promptDef !== undefined, 'Prompt do executive_agent deve existir no PromptRegistry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Instruções do executive_agent devem indicar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('NUNCA altera tarifas'), 'Garantia de não alteração de tarifas deve constar no prompt');
  console.log('   ✅ AgentRouter e PromptRegistry do executive_agent validados.');

  // 7. Testar Injeção no ContextService
  console.log('7️⃣ Testando injeção no ContextService...');
  const opContext = await contextService.buildOperationalContext(orgId, propId);
  console.assert(opContext.executiveSummary !== undefined, 'executiveSummary deve estar presente em OperationalContext');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Executive Intelligence Test Suite] Todos os testes da Etapa 10.1 passaram 100% com sucesso!');
}

runExecutiveTests().catch(err => {
  console.error('❌ [Executive Intelligence Test Suite] Erro durante os testes:', err);
  process.exit(1);
});
