import { revenueService } from './revenueService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runRevenueTests() {
  console.log('🧪 [Revenue Test Suite] Iniciando validação completa da Etapa 9.1...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard Completo
  console.log('1️⃣ Testando getDashboard...');
  const dashboard = await revenueService.getDashboard(orgId, propId);
  console.assert(dashboard !== null && dashboard.summary !== undefined, 'Dashboard summary deve ser retornado');
  console.assert(typeof dashboard.summary.adr === 'number', 'ADR deve ser numérico');
  console.assert(typeof dashboard.summary.revPar === 'number', 'RevPAR deve ser numérico');
  console.assert(dashboard.forecast.days7.length === 7, 'Forecast de 7 dias deve conter 7 elementos');
  console.assert(dashboard.forecast.days15.length === 15, 'Forecast de 15 dias deve conter 15 elementos');
  console.assert(dashboard.forecast.days30.length === 30, 'Forecast de 30 dias deve conter 30 elementos');
  console.assert(Array.isArray(dashboard.revenueByChannel), 'revenueByChannel deve ser um array');
  console.assert(Array.isArray(dashboard.revenueByCategory), 'revenueByCategory deve ser um array');
  console.assert(Array.isArray(dashboard.revenueByProperty), 'revenueByProperty deve ser um array');
  console.assert(dashboard.weekdayOccupancy.length === 7, 'weekdayOccupancy deve ter 7 dias da semana');
  console.log('   ✅ Dashboard e KPIs validados com sucesso.');

  // 2. Testar Forecast isolado
  console.log('2️⃣ Testando getForecast...');
  const forecast14 = await revenueService.getForecast(orgId, propId, 14);
  console.assert(forecast14.length === 14, 'Forecast customizado de 14 dias deve retornar 14 dias');
  console.log('   ✅ Forecast customizado validado.');

  // 3. Testar resumo de IA para ContextService
  console.log('3️⃣ Testando getRevenueSummaryForAI...');
  const aiSummary = await revenueService.getRevenueSummaryForAI(orgId, propId);
  console.assert(typeof aiSummary.occupancyToday === 'number', 'occupancyToday em aiSummary deve ser numérico');
  console.assert(typeof aiSummary.topChannel === 'string', 'topChannel deve ser string');
  console.assert(Array.isArray(aiSummary.alerts), 'alerts deve ser array');
  console.assert(Array.isArray(aiSummary.trends), 'trends deve ser array');
  console.log('   ✅ Resumo de IA para ContextService validado.');

  // 4. Testar AgentRouter para revenue_agent
  console.log('4️⃣ Testando AgentRouter para revenue_agent...');
  const routeRevPAR = agentRouter.route('Qual é o RevPAR e o ADR esperado para o próximo mês?');
  console.assert(routeRevPAR.agentId === 'revenue_agent', 'Prompt com RevPAR e ADR deve ser roteado para revenue_agent');
  console.assert(routeRevPAR.confidence === 'HIGH', 'Confiança do roteamento deve ser HIGH');

  const routeForecast = agentRouter.route('Mostre o forecast de ocupação e booking pace');
  console.assert(routeForecast.agentId === 'revenue_agent', 'Prompt com forecast deve ser roteado para revenue_agent');
  console.log('   ✅ AgentRouter para revenue_agent validado.');

  // 5. Testar PromptRegistry para revenue_agent
  console.log('5️⃣ Testando PromptRegistry para revenue_agent...');
  const promptDef = getPrompt('revenue_agent');
  console.assert(promptDef !== undefined, 'Prompt para revenue_agent deve estar registrado');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt de revenue_agent deve ter instrução READ-ONLY');
  console.log('   ✅ PromptRegistry para revenue_agent validado.');

  // 6. Testar integração com ContextService
  console.log('6️⃣ Testando integração com ContextService...');
  const opContext = await contextService.buildOperationalContext(orgId, propId);
  console.assert(opContext.revenueSummary !== undefined, 'revenueSummary deve estar presente no OperationalContext');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Revenue Test Suite] Todos os testes passaram 100% com sucesso!');
}

runRevenueTests().catch(err => {
  console.error('❌ [Revenue Test Suite] Erro durante a execução dos testes:', err);
  process.exit(1);
});
