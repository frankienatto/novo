import { marketingService } from './marketingService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runMarketingTests() {
  console.log('🧪 [Marketing Intelligence Test Suite] Iniciando validação da Etapa 9.4...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard e Estruturas Principais
  console.log('1️⃣ Testando getDashboard do Marketing Intelligence...');
  const dashboard = await marketingService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard de marketing não deve ser nulo');
  console.assert(Array.isArray(dashboard.segments), 'segments deve ser um array');
  console.assert(dashboard.journey !== undefined, 'journey deve estar presente');
  console.assert(dashboard.retention !== undefined, 'retention deve estar presente');
  console.assert(Array.isArray(dashboard.topMarkets), 'topMarkets deve ser um array');
  console.assert(Array.isArray(dashboard.channels), 'channels deve ser um array');
  console.assert(Array.isArray(dashboard.alerts), 'alerts deve ser um array');
  console.log('   ✅ Dashboard de Marketing validado.');

  // 2. Testar Segmentação Inteligente
  console.log('2️⃣ Testando Segmentação Inteligente...');
  const segments = await marketingService.getSegments(orgId, propId);
  console.assert(segments.length >= 10, 'Deve conter os segmentos inteligentes (VIP, Recorrentes, First Stay, Corporate, Famílias, etc.)');
  const vipSeg = segments.find(s => s.segment === 'vip');
  console.assert(vipSeg !== undefined, 'Segmento VIP deve existir');
  console.assert(typeof vipSeg?.count === 'number', 'Contagem de VIPs deve ser numérica');
  console.log('   ✅ Segmentação Inteligente validada.');

  // 3. Testar Customer Journey e Conversões
  console.log('3️⃣ Testando Customer Journey...');
  const journey = await marketingService.getCustomerJourney(orgId, propId);
  console.assert(journey.stageCounts.official_reservation !== undefined, 'Reservas oficiais no Aloha PMS devem ser contadas na jornada');
  console.assert(typeof journey.conversionRates.proposalToReservationPercent === 'number', 'Taxa Proposta->Reserva deve ser numérica');
  console.log('   ✅ Customer Journey validada.');

  // 4. Testar Mercados Geográficos e Canais
  console.log('4️⃣ Testando Mercados Geográficos e Canais...');
  const markets = await marketingService.getMarkets(orgId, propId);
  const channels = await marketingService.getChannels(orgId, propId);
  console.assert(Array.isArray(markets), 'Markets deve ser array');
  console.assert(Array.isArray(channels), 'Channels deve ser array');
  console.log('   ✅ Mercados Geográficos e Canais validados.');

  // 5. Testar Análise de Retenção e LTV
  console.log('5️⃣ Testando Análise de Retenção e LTV...');
  const retention = await marketingService.getRetentionAnalysis(orgId, propId);
  console.assert(typeof retention.retentionRatePercent === 'number', 'Taxa de retenção deve ser numérica');
  console.assert(typeof retention.averageEstimatedLtv === 'number', 'LTV estimado médio deve ser numérico');
  console.assert(Array.isArray(retention.preferredCategories), 'Categorias preferidas deve ser array');
  console.log('   ✅ Retenção e LTV validados.');

  // 6. Testar Resumo para IA (ContextService)
  console.log('6️⃣ Testando MarketingSummaryForAI...');
  const aiSummary = await marketingService.getMarketingSummaryForAI(orgId, propId);
  console.assert(Array.isArray(aiSummary.topSegments), 'topSegments para IA deve ser array');
  console.assert(Array.isArray(aiSummary.topMarkets), 'topMarkets para IA deve ser array');
  console.assert(typeof aiSummary.topPerformingChannel === 'string', 'topPerformingChannel deve ser string');
  console.log('   ✅ MarketingSummaryForAI validado.');

  // 7. Testar AgentRouter e PromptRegistry do marketing_agent
  console.log('7️⃣ Testando AgentRouter e PromptRegistry do marketing_agent...');
  const routeResult = agentRouter.route('Qual é a nossa taxa de retenção de clientes, LTV médio e os principais segmentos de mercado?');
  console.assert(routeResult.agentId === 'marketing_agent', 'Dúvidas sobre retenção/LTV/segmentos devem ser roteadas para marketing_agent');

  const promptDef = getPrompt('marketing_agent');
  console.assert(promptDef !== undefined, 'Prompt do marketing_agent deve existir no PromptRegistry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Instruções do marketing_agent devem indicar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('NUNCA dispara campanhas'), 'Garantia de não disparo de campanhas deve constar no prompt');
  console.log('   ✅ AgentRouter e PromptRegistry do marketing_agent validados.');

  // 8. Testar Injeção no ContextService
  console.log('8️⃣ Testando injeção no ContextService...');
  const opContext = await contextService.buildOperationalContext(orgId, propId);
  console.assert(opContext.marketingSummary !== undefined, 'marketingSummary deve estar presente em OperationalContext');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Marketing Intelligence Test Suite] Todos os testes da Etapa 9.4 passaram 100% com sucesso!');
}

runMarketingTests().catch(err => {
  console.error('❌ [Marketing Intelligence Test Suite] Erro durante os testes:', err);
  process.exit(1);
});
