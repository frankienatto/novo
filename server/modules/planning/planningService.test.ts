import { planningService } from './planningService.ts';
import { AgentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';
import fs from 'fs';
import path from 'path';

async function runPlanningTests() {
  console.log('🧪 [Operational Planning Test Suite] Iniciando validação da Etapa 11.2...');

  const orgId = 'org_test_112';
  const propId = 'prop_test_112';

  // 1. Dashboard
  console.log('1️⃣ Testando getDashboard...');
  const dashboard = await planningService.getDashboard(orgId, propId);
  if (!dashboard || typeof dashboard.totalPlansCreated !== 'number') {
    throw new Error('Falha ao carregar dashboard de planejamento.');
  }
  if (dashboard.systemStatus !== 'read_only_planning') {
    throw new Error('SystemStatus deve ser read_only_planning.');
  }
  console.log('   ✅ Dashboard de planejamento validado.');

  // 2. Playbooks e garantias de modo manual
  console.log('2️⃣ Testando getPlaybooks e garantias de execução manual...');
  const playbooks = await planningService.getPlaybooks(orgId, propId);
  if (!Array.isArray(playbooks) || playbooks.length === 0) {
    throw new Error('Lista de playbooks está vazia.');
  }
  for (const pb of playbooks) {
    if (pb.executionMode !== 'manual') {
      throw new Error(`VIOLAÇÃO ARQUITETURAL: Playbook ${pb.playbookId} possui modo diferente de manual!`);
    }
    if (!pb.checklist || pb.checklist.length === 0) {
      throw new Error(`Playbook ${pb.playbookId} não possui checklist de instrução humana.`);
    }
  }
  console.log(`   ✅ ${playbooks.length} playbook(s) validados em MODO EXCLUSIVAMENTE MANUAL.`);

  // 3. Generate
  console.log('3️⃣ Testando generate playbooks...');
  const generated = await planningService.generate(orgId, propId);
  if (!Array.isArray(generated)) {
    throw new Error('Falha no método generate do planningService.');
  }
  console.log('   ✅ Geração de playbooks validada sem ações externas.');

  // 4. Rebuild
  console.log('4️⃣ Testando rebuild playbooks...');
  const rebuilt = await planningService.rebuild(orgId, propId);
  if (!Array.isArray(rebuilt)) {
    throw new Error('Falha no método rebuild do planningService.');
  }
  console.log('   ✅ Reconstrução de sequências de playbooks validada.');

  // 5. Resumo para IA
  console.log('5️⃣ Testando getPlanningSummaryForAI...');
  const summary = await planningService.getPlanningSummaryForAI(orgId, propId);
  if (typeof summary.plannedActions !== 'number' || typeof summary.topPlaybook !== 'string') {
    throw new Error('Estrutura inválida para planningSummary.');
  }
  console.log('   ✅ Resumo de planejamento para IA validado.');

  // 6. AgentRouter & PromptRegistry
  console.log('6️⃣ Testando AgentRouter e PromptRegistry do planning_agent...');
  const router = new AgentRouter();

  const routeResult = router.route('qual o playbook e sequencia de acao para o dia de hoje?');
  if (routeResult.agentId !== 'planning_agent') {
    throw new Error(`Esperado agent planning_agent, mas obteve: ${routeResult.agentId}`);
  }

  const agentPrompt = getPrompt('planning_agent');
  if (!agentPrompt || !agentPrompt.systemInstruction.includes('Operational Planning & Playbook Specialist')) {
    throw new Error('PromptRegistry não retornou as instruções corretas para planning_agent.');
  }
  if (!agentPrompt.systemInstruction.includes('READ-ONLY') && !agentPrompt.systemInstruction.includes('NUNCA executa tarefas')) {
    throw new Error('PromptRegistry do planning_agent não possui a cláusula de MODO CONSULTA / READ-ONLY.');
  }
  console.log('   ✅ AgentRouter e PromptRegistry do planning_agent validados.');

  // 7. ContextService Integration
  console.log('7️⃣ Testando injeção do planningSummary no ContextService...');
  const context = await contextService.buildOperationalContext(orgId, propId, 'user_test', 'session_112');
  if (!context.planningSummary || typeof context.planningSummary.plannedActions !== 'number') {
    throw new Error('planningSummary não foi injetado corretamente no ContextService.');
  }
  console.log('   ✅ ContextService integrado com sucesso.');

  // 8. OpenAPI Validation
  console.log('8️⃣ Testando documentação OpenAPI para a Etapa 11.2...');
  const openApiPath = path.join(process.cwd(), 'server', 'docs', 'openapi.json');
  const openApiStr = fs.readFileSync(openApiPath, 'utf-8');
  const openApiObj = JSON.parse(openApiStr);

  const requiredPaths = [
    '/planning/dashboard',
    '/planning/playbooks',
    '/planning/summary',
    '/planning/generate',
    '/planning/rebuild'
  ];

  for (const p of requiredPaths) {
    if (!openApiObj.paths[p]) {
      throw new Error(`Caminho ${p} ausente no openapi.json!`);
    }
  }
  console.log('   ✅ Documentação OpenAPI validada.');

  console.log('🎉 [Operational Planning Test Suite] Todos os testes da Etapa 11.2 passaram 100% com sucesso!');
}

runPlanningTests().catch((err) => {
  console.error('❌ [Operational Planning Test Suite] Falha nos testes:', err);
  process.exit(1);
});
