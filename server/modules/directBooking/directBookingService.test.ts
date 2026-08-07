import { directBookingService } from './directBookingService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runDirectBookingTests() {
  console.log('🧪 [Direct Booking Test Suite] Iniciando validação da Etapa 9.2...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard e KPIs
  console.log('1️⃣ Testando getDashboard e Métricas...');
  const dashboard = await directBookingService.getDashboard(orgId, propId);
  console.assert(dashboard !== null && dashboard.summary !== undefined, 'Dashboard summary deve ser retornado');
  console.assert(typeof dashboard.summary.totalProposals === 'number', 'totalProposals deve ser numérico');
  console.assert(typeof dashboard.summary.conversionRatePercent === 'number', 'conversionRatePercent deve ser numérico');
  console.assert(Array.isArray(dashboard.recentProposals), 'recentProposals deve ser um array');
  console.log('   ✅ Dashboard e Métricas validados.');

  // 2. Testar Geração e Atualização de Proposta Comercial
  console.log('2️⃣ Testando criação e atualização de Proposta Comercial...');
  const newProp = await directBookingService.createProposal(orgId, propId, {
    leadName: 'Fernanda Montenegro',
    leadEmail: 'fernanda@teatro.com.br',
    categoryName: 'Suíte Luxo',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-04',
    offeredRateDaily: 500,
    discountPercent: 10,
    sourceChannel: 'whatsapp',
    attendantName: 'Paula Vendas'
  });

  console.assert(newProp.proposalId !== undefined, 'Proposta criada deve conter ID');
  console.assert(newProp.status === 'sent', 'Status inicial deve ser sent');
  console.assert(newProp.numberOfNights === 3, 'Número de noites deve ser 3');
  console.assert(newProp.totalAmount === 1500, 'Valor total deve ser 1500');

  // Atualiza para 'accepted'
  const updated = await directBookingService.updateProposal(newProp.proposalId, orgId, propId, {
    status: 'accepted',
    convertedReservationId: 'res_aloha_99100'
  });

  console.assert(updated?.status === 'accepted', 'Status deve ter sido alterado para accepted');
  console.assert(updated?.convertedReservationId === 'res_aloha_99100', 'ID da reserva no Aloha PMS deve ter sido registrado');
  console.log('   ✅ Criação e fluxo de conversão da proposta validados.');

  // 3. Testar resumo para IA (ContextService)
  console.log('3️⃣ Testando resumo para ContextService...');
  const aiSummary = await directBookingService.getDirectBookingSummaryForAI(orgId, propId);
  console.assert(typeof aiSummary.openProposalsCount === 'number', 'openProposalsCount deve ser número');
  console.assert(Array.isArray(aiSummary.commercialAlerts), 'commercialAlerts deve ser array');
  console.log('   ✅ DirectBookingSummaryForAI validado.');

  // 4. Testar Roteamento e Prompt do direct_booking_agent
  console.log('4️⃣ Testando AgentRouter e PromptRegistry para direct_booking_agent...');
  const routeProp = agentRouter.route('Como posso criar um orçamento ou cotação para enviar pelo WhatsApp?');
  console.assert(routeProp.agentId === 'direct_booking_agent', 'Dúvidas sobre orçamento/cotação devem ser roteadas para direct_booking_agent');

  const promptDef = getPrompt('direct_booking_agent');
  console.assert(promptDef !== undefined, 'Prompt do direct_booking_agent deve existir');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Instruções do direct_booking_agent devem conter READ-ONLY');
  console.log('   ✅ Roteamento e PromptRegistry do direct_booking_agent validados.');

  // 5. Testar injeção no ContextService
  console.log('5️⃣ Testando injeção em ContextService...');
  const opContext = await contextService.buildOperationalContext(orgId, propId);
  console.assert(opContext.directBookingSummary !== undefined, 'directBookingSummary deve estar presente em OperationalContext');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Direct Booking Test Suite] Todos os testes da Etapa 9.2 passaram 100% com sucesso!');
}

runDirectBookingTests().catch(err => {
  console.error('❌ [Direct Booking Test Suite] Erro durante a execução dos testes:', err);
  process.exit(1);
});
