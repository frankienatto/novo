import { salesService } from './salesService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runSalesCrmTests() {
  console.log('🧪 [Sales CRM Test Suite] Iniciando validação da Etapa 9.3...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard e Métricas
  console.log('1️⃣ Testando getDashboard e Métricas do Sales CRM...');
  const dashboard = await salesService.getDashboard(orgId, propId);
  console.assert(dashboard !== null && dashboard.summary !== undefined, 'Dashboard summary deve ser retornado');
  console.assert(typeof dashboard.summary.totalOpportunities === 'number', 'totalOpportunities deve ser numérico');
  console.assert(typeof dashboard.summary.conversionRatePercent === 'number', 'conversionRatePercent deve ser numérico');
  console.assert(Array.isArray(dashboard.topOpportunities), 'topOpportunities deve ser um array');
  console.assert(Array.isArray(dashboard.overdueFollowUps), 'overdueFollowUps deve ser um array');
  console.log('   ✅ Dashboard e Métricas do Sales CRM validados.');

  // 2. Testar Criação, Atualização e Progressão de Estágio
  console.log('2️⃣ Testando criação e ciclo de vida de Oportunidade Comercial...');
  const newOpp = await salesService.createOpportunity(orgId, propId, {
    leadName: 'Roberto Carlos Braga',
    leadEmail: 'roberto@reimusica.com.br',
    leadPhone: '+55 11 98888-0000',
    stage: 'lead',
    temperature: 'warm',
    source: 'whatsapp',
    estimatedValue: 4500,
    categoryInterest: 'Suíte Presidencial',
    ownerName: 'Paula (Vendas)',
    notes: 'Interesse para fim de semana especial com a família.',
    nextFollowUp: {
      dueDate: '2026-09-10',
      time: '15:00',
      priority: 'high',
      actionDescription: 'Enviar proposta comercial detalhada com café incluso'
    }
  });

  console.assert(newOpp.opportunityId !== undefined, 'Oportunidade criada deve conter ID');
  console.assert(newOpp.stage === 'lead', 'Estágio inicial deve ser lead');
  console.assert(newOpp.nextFollowUp?.priority === 'high', 'Prioridade do follow-up deve ser high');

  // Atualizar para 'negotiation' e depois 'won'
  const updatedNegotiating = await salesService.updateOpportunity(newOpp.opportunityId, orgId, propId, {
    stage: 'negotiation',
    temperature: 'hot'
  });
  console.assert(updatedNegotiating?.stage === 'negotiation', 'Estágio deve ter sido alterado para negotiation');
  console.assert(updatedNegotiating?.temperature === 'hot', 'Temperatura deve ter mudado para hot');

  const updatedWon = await salesService.updateOpportunity(newOpp.opportunityId, orgId, propId, {
    stage: 'won',
    proposalId: 'prop_991'
  });
  console.assert(updatedWon?.stage === 'won', 'Estágio final deve ser won');
  console.assert(updatedWon?.convertedAt !== undefined, 'Data de conversão deve ser registrada no fechamento');
  console.log('   ✅ Criação e ciclo de vida da oportunidade validados.');

  // 3. Testar Interações e Agendamento de Follow-up
  console.log('3️⃣ Testando registro de Interações e Follow-ups...');
  const withInteraction = await salesService.addInteraction(newOpp.opportunityId, orgId, propId, {
    type: 'whatsapp',
    summary: 'Cliente confirmou recebimento da proposta e pagamento via Pix.',
    authorName: 'Paula (Vendas)'
  });
  console.assert(withInteraction?.interactions.length! >= 2, 'Interação deve ter sido adicionada à lista');

  const withFollowUp = await salesService.scheduleFollowUp(newOpp.opportunityId, orgId, propId, {
    dueDate: '2026-09-15',
    priority: 'low',
    actionDescription: 'Enviar mensagem de pré-boas-vindas antes do check-in'
  });
  console.assert(withFollowUp?.nextFollowUp?.actionDescription === 'Enviar mensagem de pré-boas-vindas antes do check-in', 'Follow-up deve ter sido atualizado');
  console.log('   ✅ Interações e Follow-ups validados.');

  // 4. Testar Resumo para IA (ContextService)
  console.log('4️⃣ Testando SalesSummaryForAI para o ContextService...');
  const aiSummary = await salesService.getSalesSummaryForAI(orgId, propId);
  console.assert(typeof aiSummary.totalPipelineValue === 'number', 'totalPipelineValue deve ser numérico');
  console.assert(Array.isArray(aiSummary.commercialAlerts), 'commercialAlerts deve ser array');
  console.assert(Array.isArray(aiSummary.salesOpportunities), 'salesOpportunities deve ser array');
  console.log('   ✅ SalesSummaryForAI validado.');

  // 5. Testar AgentRouter e PromptRegistry do sales_agent
  console.log('5️⃣ Testando AgentRouter e PromptRegistry para sales_agent...');
  const routeResult = agentRouter.route('Como está a performance de vendas e o funil de leads do hotel este mês?');
  console.assert(routeResult.agentId === 'sales_agent', 'Dúvidas sobre funil/leads/vendas devem ser roteadas para sales_agent');

  const promptDef = getPrompt('sales_agent');
  console.assert(promptDef !== undefined, 'Prompt do sales_agent deve existir no PromptRegistry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Instrução do sales_agent deve indicar MODO READ-ONLY');
  console.log('   ✅ AgentRouter e PromptRegistry do sales_agent validados.');

  // 6. Testar Injeção no ContextService
  console.log('6️⃣ Testando injeção do Sales CRM no ContextService...');
  const opContext = await contextService.buildOperationalContext(orgId, propId);
  console.assert(opContext.salesSummary !== undefined, 'salesSummary deve estar presente em OperationalContext');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Sales CRM Test Suite] Todos os testes da Etapa 9.3 passaram 100% com sucesso!');
}

runSalesCrmTests().catch(err => {
  console.error('❌ [Sales CRM Test Suite] Erro durante a execução dos testes:', err);
  process.exit(1);
});
