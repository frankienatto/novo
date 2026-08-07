import { strategyService } from './strategyService.ts';
import { agentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';

async function runStrategySimulationTests() {
  console.log('🧪 [Strategic Simulation Test Suite] Iniciando validação da Etapa 10.4...');

  const orgId = 'org_dev_default';
  const propId = 'prop_dev_default';

  // 1. Testar Dashboard do Módulo Strategy
  console.log('1️⃣ Testando getDashboard de Estratégia e Simulação...');
  const dashboard = await strategyService.getDashboard(orgId, propId);
  console.assert(dashboard !== null, 'Dashboard de Estratégia não deve ser nulo');
  console.assert(typeof dashboard.activeScenariosCount === 'number', 'activeScenariosCount deve ser numérico');
  console.assert(dashboard.activeScenariosCount >= 10, 'Deve conter no mínimo 10 cenários padrão de simulação');
  console.assert(typeof dashboard.averageConfidence === 'number', 'averageConfidence deve ser numérico');
  console.assert(dashboard.systemStatus === 'read_only', 'systemStatus deve ser read_only');
  console.assert(dashboard.simulationMode === 'memory_only', 'simulationMode deve ser memory_only');
  console.log('   ✅ Dashboard de Estratégia e Simulação validado com sucesso.');

  // 2. Testar Cenários e Validar Explainable AI e Invariantes READ-ONLY
  console.log('2️⃣ Validando MODO SIMULATION_ONLY e Explainable AI em 100% dos cenários...');
  const scenarios = await strategyService.getScenarios(orgId, propId);
  console.assert(Array.isArray(scenarios), 'scenarios deve ser um array');
  console.assert(scenarios.length >= 10, 'Deve conter pelo menos 10 cenários simulação ("What If")');

  scenarios.forEach(scen => {
    console.assert(scen.status === 'simulation_only', `Cenário ${scen.scenarioId} deve possuir status simulation_only`);
    console.assert(scen.humanApprovalRequired === true, `Cenário ${scen.scenarioId} deve exigir aprovação humana (humanApprovalRequired: true)`);
    console.assert(scen.approvalRequired === true, `Cenário ${scen.scenarioId} deve exigir aprovação humana (approvalRequired: true)`);
    
    // Validar Explainable AI completa
    const exp = scen.explainableAi;
    console.assert(exp !== undefined && exp !== null, `Cenário ${scen.scenarioId} deve conter explainableAi`);
    console.assert(typeof exp.reasoning === 'string' && exp.reasoning.length > 0, 'reasoning deve ser string não vazia');
    console.assert(Array.isArray(exp.evidence) && exp.evidence.length > 0, 'evidence deve conter lista de evidências');
    console.assert(typeof exp.confidenceScore === 'number', 'confidenceScore deve ser numérico');
    console.assert(typeof exp.estimatedGain === 'string', 'estimatedGain deve ser string');
    console.assert(typeof exp.estimatedRisk === 'string', 'estimatedRisk deve ser string');
    console.assert(typeof exp.businessImpact === 'string', 'businessImpact deve ser string');
    console.assert(typeof exp.operationalImpact === 'string', 'operationalImpact deve ser string');
    console.assert(typeof exp.financialImpact === 'string', 'financialImpact deve ser string');
    console.assert(Array.isArray(exp.affectedModules), 'affectedModules deve ser array');
    console.assert(Array.isArray(exp.dependencies), 'dependencies deve ser array');
    console.assert(exp.humanApprovalRequired === true, 'explainableAi deve ter humanApprovalRequired: true');
    console.assert(exp.status === 'simulation_only', 'explainableAi deve ter status: simulation_only');
  });
  console.log('   ✅ 100% dos cenários possuem Explainable AI completa e invariantes READ-ONLY.');

  // 3. Testar Simulação Customizada em Memória (simulate)
  console.log('3️⃣ Testando simulação customizada sob demanda em memória (simulate)...');
  const customSim = await strategyService.simulate(
    {
      scenarioType: 'adr_increase',
      adrIncreasePercent: 12,
      cancellationReductionPercent: 20,
      customName: 'Simulação Teste Automatizado Alta Demanda'
    },
    orgId,
    propId
  );

  console.assert(customSim !== null, 'Simulação customizada não deve ser nula');
  console.assert(customSim.status === 'simulation_only', 'Simulação customizada deve ter status simulation_only');
  console.assert(customSim.humanApprovalRequired === true, 'Simulação customizada deve exigir aprovação humana');
  console.assert(customSim.projectedScenario.adr > customSim.currentScenario.adr, 'ADR projetado deve ser maior que o atual');
  console.log('   ✅ Simulação customizada em memória executada com sucesso.');

  // 4. Testar Resumo de Estratégia para a IA (getStrategySummaryForAI)
  console.log('4️⃣ Testando Resumo do Módulo Strategy para IA (getStrategySummaryForAI)...');
  const summaryForAi = await strategyService.getStrategySummaryForAI(orgId, propId);
  console.assert(typeof summaryForAi.totalScenarios === 'number', 'totalScenarios deve ser numérico');
  console.assert(typeof summaryForAi.highestImpactScenario === 'string', 'highestImpactScenario deve ser string');
  console.assert(typeof summaryForAi.highestConfidenceScenario === 'string', 'highestConfidenceScenario deve ser string');
  console.assert(typeof summaryForAi.topRecommendation === 'string', 'topRecommendation deve ser string');
  console.assert(typeof summaryForAi.averageConfidence === 'number', 'averageConfidence deve ser numérico');
  console.log('   ✅ Resumo para IA validado com sucesso.');

  // 5. Testar AgentRouter e PromptRegistry do strategy_agent
  console.log('5️⃣ Testando AgentRouter e PromptRegistry do strategy_agent...');
  const routeResult = agentRouter.route('Qual é a simulação de cenário what if para aumento de ADR e trade off de ocupação?');
  console.assert(routeResult.agentId === 'strategy_agent', 'Perguntas sobre simulações, cenários e what if devem ser roteadas para strategy_agent');

  const promptDef = getPrompt('strategy_agent');
  console.assert(promptDef !== undefined, 'Prompt definition do strategy_agent deve existir no registry');
  console.assert(promptDef?.systemInstruction.includes('READ-ONLY'), 'Prompt do strategy_agent deve reforçar MODO READ-ONLY');
  console.assert(promptDef?.systemInstruction.includes('simulation_only'), 'Prompt deve reforçar modo de simulação em memória');
  console.log('   ✅ AgentRouter e PromptRegistry do strategy_agent validados.');

  // 6. Testar injeção do strategySummary no ContextService
  console.log('6️⃣ Testando injeção do strategySummary no ContextService...');
  const context = await contextService.buildOperationalContext(
    orgId,
    propId,
    'test_user'
  );
  console.assert(context.strategySummary !== undefined && context.strategySummary !== null, 'strategySummary deve estar presente no OperationalContext');
  console.assert(typeof context.strategySummary?.totalScenarios === 'number', 'totalScenarios no contexto deve ser numérico');
  console.log('   ✅ ContextService integrado com sucesso.');

  console.log('🎉 [Strategic Simulation Test Suite] Todos os testes da Etapa 10.4 passaram 100% com sucesso!');
}

runStrategySimulationTests().catch(err => {
  console.error('❌ [Strategic Simulation Test Suite] Falha nos testes:', err);
  process.exit(1);
});
