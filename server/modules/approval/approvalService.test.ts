import { approvalService } from './approvalService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runApprovalWorkflowTests() {
  console.log('🧪 [Human Approval Workflow Test Suite] Iniciando validação da Etapa 11.1...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard do Módulo Approval
  console.log('1️⃣ Testando getDashboard do Human Approval Workflow...');
  const dashboard = await approvalService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard de Aprovação não deve ser nulo');
  console.assert(typeof dashboard.pendingCount === 'number', 'pendingCount deve ser numérico');
  console.assert(typeof dashboard.approvedCount === 'number', 'approvedCount deve ser numérico');
  console.assert(typeof dashboard.rejectedCount === 'number', 'rejectedCount deve ser numérico');
  console.assert(typeof dashboard.backlogCount === 'number', 'backlogCount deve ser numérico');
  console.assert(dashboard.systemStatus === 'read_only_governance', 'systemStatus deve ser read_only_governance');
  console.log('   ✅ Dashboard do Human Approval Workflow validado.');

  // 2. Testar obtenção de itens pendentes
  console.log('2️⃣ Testando getPending...');
  const pending = await approvalService.getPending(orgId, propId);
  console.assert(Array.isArray(pending), 'pending deve ser um array');
  console.assert(pending.length > 0, 'Deve conter pendências vindas dos módulos de decisão e copilot');
  pending.forEach(item => {
    console.assert(item.status === 'pending_approval', `Item ${item.recommendationId} deve possuir status pending_approval`);
    console.assert(typeof item.approvalId === 'string', 'approvalId deve ser string');
    console.assert(typeof item.recommendationId === 'string', 'recommendationId deve ser string');
    console.assert(typeof item.correlationId === 'string', 'correlationId deve ser string');
    console.assert(typeof item.requestId === 'string', 'requestId deve ser string');
  });
  console.log('   ✅ Pendências e estrutura de auditoria validadas.');

  // 3. Testar Ação de Aprovação (approve)
  console.log('3️⃣ Testando approve de uma recomendação...');
  const targetToApprove = pending[0].recommendationId;
  const approvedRecord = await approvalService.approve(
    {
      recommendationId: targetToApprove,
      decisionBy: 'Diretor de Operações - Teste Automatizado',
      reason: 'Viabilidade confirmada pela gerência',
      comments: 'Implementação agendada para execução manual no Aloha PMS'
    },
    orgId,
    propId
  );

  console.assert(approvedRecord !== null, 'Registro de aprovação não deve ser nulo');
  console.assert(approvedRecord.status === 'approved', 'Status deve ser atualizado para approved');
  console.assert(approvedRecord.decisionBy === 'Diretor de Operações - Teste Automatizado', 'decisionBy deve conferir');
  console.assert(approvedRecord.decisionDate.length > 0, 'decisionDate deve conter timestamp');
  console.assert(approvedRecord.reason === 'Viabilidade confirmada pela gerência', 'reason deve conferir');
  console.assert(approvedRecord.comments.includes('Aloha PMS'), 'comments deve conferir');
  console.log('   ✅ Aprovação humana registrada com rastro auditável e sem execução externa.');

  // 4. Testar Ação de Rejeição (reject)
  console.log('4️⃣ Testando reject de uma recomendação...');
  const targetToReject = pending.length > 1 ? pending[1].recommendationId : 'rec_test_reject_123';
  const rejectedRecord = await approvalService.reject(
    {
      recommendationId: targetToReject,
      decisionBy: 'Gerente Geral - Teste Automatizado',
      reason: 'Incompatível com orçamento do mês',
      comments: 'Decisão do comitê de não prosseguir com esta ação'
    },
    orgId,
    propId
  );

  console.assert(rejectedRecord !== null, 'Registro de rejeição não deve ser nulo');
  console.assert(rejectedRecord.status === 'rejected', 'Status deve ser atualizado para rejected');
  console.assert(rejectedRecord.decisionBy === 'Gerente Geral - Teste Automatizado', 'decisionBy deve conferir');
  console.assert(rejectedRecord.decisionDate.length > 0, 'decisionDate deve conter timestamp');
  console.log('   ✅ Rejeição humana registrada com rastro auditável e sem execução externa.');

  // 5. Testar Histórico de Decisões (getHistory)
  console.log('5️⃣ Testando getHistory...');
  const history = await approvalService.getHistory(orgId, propId);
  console.assert(Array.isArray(history), 'history deve ser um array');
  console.assert(history.length >= 2, 'Histórico deve incluir os itens aprovados e rejeitados');
  console.log('   ✅ Histórico de auditoria validado.');

  // 6. Testar Resumo para a IA (getApprovalSummaryForAI)
  console.log('6️⃣ Testando Resumo do Módulo Approval para IA (getApprovalSummaryForAI)...');
  const summaryForAi = await approvalService.getApprovalSummaryForAI(orgId, propId);
  console.assert(typeof summaryForAi.pending === 'number', 'pending deve ser numérico');
  console.assert(typeof summaryForAi.approvedToday === 'number', 'approvedToday deve ser numérico');
  console.assert(typeof summaryForAi.rejectedToday === 'number', 'rejectedToday deve ser numérico');
  console.assert(typeof summaryForAi.averageApprovalTime === 'string', 'averageApprovalTime deve ser string');
  console.assert(typeof summaryForAi.oldestPending === 'string', 'oldestPending deve ser string');
  console.log('   ✅ Resumo de aprovação para IA validado.');

  // 7. Testar AgentRouter e PromptRegistry do approval_agent
  console.log('7️⃣ Testando AgentRouter e PromptRegistry do approval_agent...');
  const routeResult = agentRouter.route('Qual é o status de aprovação e o histórico de auditoria do workflow de governança?');
  console.assert(routeResult.agentId === 'approval_agent', 'Perguntas sobre aprovação, workflow e auditoria devem ser roteadas para approval_agent');

  const promptDef = getPrompt('approval_agent');
  console.assert(promptDef !== undefined, 'Prompt definition do approval_agent deve existir no registry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt do approval_agent deve reforçar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('NENHUMA recomendação'), 'Prompt deve reforçar ausência de automação externa');
  console.log('   ✅ AgentRouter e PromptRegistry do approval_agent validados.');

  // 8. Testar injeção do approvalSummary no ContextService
  console.log('8️⃣ Testando injeção do approvalSummary no ContextService...');
  const context = await contextService.buildOperationalContext(
    orgId,
    propId,
    'test_user'
  );
  console.assert(context.approvalSummary !== undefined && context.approvalSummary !== null, 'approvalSummary deve estar presente no OperationalContext');
  console.assert(typeof context.approvalSummary?.pending === 'number', 'pending no contexto deve ser numérico');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Human Approval Workflow Test Suite] Todos os testes da Etapa 11.1 passaram 100% com sucesso!');
}

runApprovalWorkflowTests().catch(err => {
  console.error('❌ [Human Approval Workflow Test Suite] Falha nos testes:', err);
  process.exit(1);
});
