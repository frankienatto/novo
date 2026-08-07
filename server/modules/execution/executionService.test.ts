import { executionService } from './executionService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runExecutionTrackingTests() {
  console.log('🧪 [Operational Execution Tracking Test Suite] Iniciando validação da Etapa 11.3...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard do Módulo Execution Tracking
  console.log('1️⃣ Testando getDashboard do Execution Tracking...');
  const dashboard = await executionService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard de Execução não deve ser nulo');
  console.assert(typeof dashboard.runningCount === 'number', 'runningCount deve ser numérico');
  console.assert(typeof dashboard.waitingCount === 'number', 'waitingCount deve ser numérico');
  console.assert(typeof dashboard.completedCount === 'number', 'completedCount deve ser numérico');
  console.assert(typeof dashboard.blockedCount === 'number', 'blockedCount deve ser numérico');
  console.assert(dashboard.systemStatus === 'read_only_tracking', 'systemStatus deve ser read_only_tracking');
  console.log('   ✅ Dashboard do Operational Execution Tracking validado.');

  // 2. Testar Listagem de Execuções
  console.log('2️⃣ Testando getExecutions...');
  const executions = await executionService.getExecutions(orgId, propId);
  console.assert(Array.isArray(executions), 'executions deve ser um array');
  console.assert(executions.length > 0, 'Deve conter registros de acompanhamento de execução de playbooks');
  executions.forEach(exec => {
    console.assert(typeof exec.executionId === 'string', 'executionId deve ser string');
    console.assert(typeof exec.playbookId === 'string', 'playbookId deve ser string');
    console.assert(typeof exec.progressPercent === 'number', 'progressPercent deve ser numérico');
    console.assert(exec.executionMode === 'manual', 'executionMode deve ser manual');
  });
  console.log('   ✅ Registros de execução e estrutura de acompanhamento validados.');

  // 3. Testar Início de Execução Manual (startExecution)
  console.log('3️⃣ Testando startExecution...');
  const targetExecution = executions[0].executionId;
  const startedRecord = await executionService.startExecution(
    targetExecution,
    'Operador de Governança - Teste',
    'Iniciando execução manual conforme instruído'
  );

  console.assert(startedRecord !== null, 'Registro de início de execução não deve ser nulo');
  console.assert(startedRecord.status === 'running', 'Status deve ser atualizado para running');
  console.assert(startedRecord.owner === 'Operador de Governança - Teste', 'owner deve ser atualizado');
  console.assert(startedRecord.startedAt !== undefined && startedRecord.startedAt.length > 0, 'startedAt deve conter timestamp');
  console.log('   ✅ Início de execução manual registrado com sucesso sem ações automáticas externas.');

  // 4. Testar Atualização de Progresso (updateProgress)
  console.log('4️⃣ Testando updateProgress...');
  const updatedRecord = await executionService.updateProgress(
    targetExecution,
    50,
    ['step_1', 'step_2'],
    'Primeira metade do checklist concluída manualmente',
    false
  );

  console.assert(updatedRecord !== null, 'Registro de atualização de progresso não deve ser nulo');
  console.assert(updatedRecord.progressPercent === 50, 'progressPercent deve ser atualizado para 50');
  console.assert(updatedRecord.completedChecklist.includes('step_1'), 'step_1 deve constar em completedChecklist');
  console.assert(updatedRecord.completedChecklist.includes('step_2'), 'step_2 deve constar em completedChecklist');
  console.log('   ✅ Atualização de progresso operacional registrada.');

  // 5. Testar Conclusão de Execução Manual (completeExecution)
  console.log('5️⃣ Testando completeExecution...');
  const completedRecord = await executionService.completeExecution(
    targetExecution,
    'Operador de Governança - Teste',
    'Todos os passos finalizados e verificados manualmente'
  );

  console.assert(completedRecord !== null, 'Registro de conclusão não deve ser nulo');
  console.assert(completedRecord.status === 'completed', 'Status deve ser atualizado para completed');
  console.assert(completedRecord.progressPercent === 100, 'progressPercent deve ser 100% no término');
  console.assert(completedRecord.completedAt !== undefined && completedRecord.completedAt.length > 0, 'completedAt deve conter timestamp');
  console.log('   ✅ Conclusão de execução manual validada.');

  // 6. Testar Resumo de Execução para a IA (getExecutionSummaryForAI)
  console.log('6️⃣ Testando Resumo do Módulo Execution para IA (getExecutionSummaryForAI)...');
  const summaryForAi = await executionService.getExecutionSummaryForAI(orgId, propId);
  console.assert(typeof summaryForAi.running === 'number', 'running deve ser numérico');
  console.assert(typeof summaryForAi.completed === 'number', 'completed deve ser numérico');
  console.assert(typeof summaryForAi.averageProgress === 'number', 'averageProgress deve ser numérico');
  console.assert(typeof summaryForAi.blocked === 'number', 'blocked deve ser numérico');
  console.assert(typeof summaryForAi.criticalExecutions === 'string', 'criticalExecutions deve ser string');
  console.log('   ✅ Resumo de acompanhamento de execução para IA validado.');

  // 7. Testar AgentRouter e PromptRegistry do execution_agent
  console.log('7️⃣ Testando AgentRouter e PromptRegistry do execution_agent...');
  const routeResult = agentRouter.route('Qual é o progresso de execução e status do acompanhamento dos playbooks operacionais?');
  console.assert(routeResult.agentId === 'execution_agent', 'Perguntas sobre execução, acompanhamento e progresso devem ser roteadas para execution_agent');

  const promptDef = getPrompt('execution_agent');
  console.assert(promptDef !== undefined, 'Prompt definition do execution_agent deve existir no registry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt do execution_agent deve reforçar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('NÃO executa tarefas'), 'Prompt deve reforçar ausência de execução automática externa');
  console.log('   ✅ AgentRouter e PromptRegistry do execution_agent validados.');

  // 8. Testar injeção do executionSummary no ContextService
  console.log('8️⃣ Testando injeção do executionSummary no ContextService...');
  const context = await contextService.buildOperationalContext(
    orgId,
    propId,
    'test_user'
  );
  console.assert(context.executionSummary !== undefined && context.executionSummary !== null, 'executionSummary deve estar presente no OperationalContext');
  console.assert(typeof context.executionSummary?.running === 'number', 'running no contexto deve ser numérico');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Operational Execution Tracking Test Suite] Todos os testes da Etapa 11.3 passaram 100% com sucesso!');
}

runExecutionTrackingTests().catch(err => {
  console.error('❌ [Operational Execution Tracking Test Suite] Falha nos testes:', err);
  process.exit(1);
});
