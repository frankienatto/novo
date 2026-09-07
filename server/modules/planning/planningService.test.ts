import { describe, it, expect, vi } from 'vitest';
import { createMockFirestore } from '../../test/mockFirestore.ts';

const mockDb = createMockFirestore();
vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => mockDb,
  getAdminAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock_uid' }),
  }),
  getFirebaseAdminApp: () => ({}),
}));

import { planningService } from './planningService.ts';
import { AgentRouter } from '../ai/agentRouter.ts';
import { getPrompt } from '../../ai/promptRegistry.ts';
import { contextService } from '../ai/contextService.ts';
import fs from 'fs';
import path from 'path';

describe('PlanningService & Playbook Planning (Unit / Domain)', () => {
  const orgId = 'org_test_112';
  const propId = 'prop_test_112';

  it('1. Deve retornar Dashboard de Planejamento com status read_only_planning', async () => {
    const dashboard = await planningService.getDashboard(orgId, propId);
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.totalPlansCreated).toBe('number');
    expect(dashboard.systemStatus).toBe('read_only_planning');
  });

  it('2. Deve listar playbooks garantindo modo de execução exclusivamente manual', async () => {
    const playbooks = await planningService.getPlaybooks(orgId, propId);
    expect(Array.isArray(playbooks)).toBe(true);
    expect(playbooks.length).toBeGreaterThan(0);
    playbooks.forEach((pb) => {
      expect(pb.executionMode).toBe('manual');
      expect(pb.checklist).toBeDefined();
      expect(pb.checklist.length).toBeGreaterThan(0);
    });
  });

  it('3. Deve gerar playbooks sem efeitos colaterais externos', async () => {
    const generated = await planningService.generate(orgId, propId);
    expect(Array.isArray(generated)).toBe(true);
  });

  it('4. Deve reconstruir sequências de playbooks', async () => {
    const rebuilt = await planningService.rebuild(orgId, propId);
    expect(Array.isArray(rebuilt)).toBe(true);
  });

  it('5. Deve gerar planningSummary estruturado para a IA', async () => {
    const summary = await planningService.getPlanningSummaryForAI(orgId, propId);
    expect(typeof summary.plannedActions).toBe('number');
    expect(typeof summary.topPlaybook).toBe('string');
  });

  it('6. Deve validar AgentRouter e PromptRegistry do planning_agent', () => {
    const router = new AgentRouter();
    const routeResult = router.route('qual o playbook e sequencia de acao para o dia de hoje?');
    expect(routeResult.agentId).toBe('planning_agent');

    const agentPrompt = getPrompt('planning_agent');
    expect(agentPrompt).toBeDefined();
    expect(agentPrompt?.systemInstruction).toContain('Operational Planning & Playbook Specialist');
    expect(agentPrompt?.systemInstruction).toContain('READ-ONLY');
  });

  it('7. Deve integrar planningSummary no OperationalContext', async () => {
    const context = await contextService.buildOperationalContext(orgId, propId, 'user_test', 'session_112');
    expect(context.planningSummary).toBeDefined();
    expect(typeof context.planningSummary?.plannedActions).toBe('number');
  });

  it('8. Deve validar documentação OpenAPI dos endpoints de planejamento', () => {
    const openApiPath = path.join(process.cwd(), 'server', 'docs', 'openapi.json');
    const openApiStr = fs.readFileSync(openApiPath, 'utf-8');
    const openApiObj = JSON.parse(openApiStr);

    const requiredPaths = [
      '/planning/dashboard',
      '/planning/playbooks',
      '/planning/summary',
      '/planning/generate',
      '/planning/rebuild',
    ];

    for (const p of requiredPaths) {
      expect(openApiObj.paths[p]).toBeDefined();
    }
  });
});
