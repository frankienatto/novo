import { describe, it, expect } from 'vitest';

describe('FASE 4.4 — Validação E2E das Rotas Reais do Backend', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Rotas Públicas e Health Checks', () => {
    it('GET /health deve responder com HTTP 200 e status ok', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('GET /api/ai deve responder com HTTP 200 e catálogo de 23 agentes', async () => {
      const res = await fetch(`${baseUrl}/api/ai`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.totalAgents).toBe(23);
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.agents.length).toBe(23);
    });

    it('GET /api/ai/health deve responder com HTTP 200', async () => {
      const res = await fetch(`${baseUrl}/api/ai/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('POST /api/gemini/agent-execute sem payload deve retornar HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/gemini/agent-execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Rotas Operacionais Protegidas (Exigência de Auth e Tenant)', () => {
    const protectedRoutes = [
      { path: '/api/pms/categories', module: 'PMS' },
      { path: '/api/crm/guests', module: 'CRM' },
      { path: '/api/housekeeping/tasks', module: 'Housekeeping' },
      { path: '/api/maintenance/tasks', module: 'Maintenance' },
      { path: '/api/revenue/kpis', module: 'Revenue' },
      { path: '/api/direct-booking/promotions', module: 'Direct Booking' },
      { path: '/api/sales/pipeline', module: 'Sales' },
      { path: '/api/marketing/campaigns', module: 'Marketing' },
      { path: '/api/executive/dashboard', module: 'Executive' },
      { path: '/api/executive-copilot/dashboard', module: 'Executive Copilot' },
      { path: '/api/decision/dashboard', module: 'Decision Engine' },
      { path: '/api/strategy/scenarios', module: 'Strategy' },
      { path: '/api/approval/dashboard', module: 'Human Approval' },
      { path: '/api/planning/roadmap', module: 'Planning' },
      { path: '/api/execution/summary', module: 'Execution' }
    ];

    for (const route of protectedRoutes) {
      it(`Acesso sem token a ${route.path} (${route.module}) DEVE retornar HTTP 401 Não Autorizado`, async () => {
        const res = await fetch(`${baseUrl}${route.path}`);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/não autenticado|não fornecido|invalid/i);
      });

      it(`Acesso a ${route.path} com token inválido/forjado DEVE retornar HTTP 401`, async () => {
        const res = await fetch(`${baseUrl}${route.path}`, {
          headers: {
            'Authorization': 'Bearer token_invalido_forjado_hacker',
            'x-organization-id': 'org_maliciosa',
            'x-property-id': 'prop_maliciosa'
          }
        });
        expect(res.status).toBe(401);
      });
    }
  });

  describe('Headers de Segurança e Rastreabilidade', () => {
    it('Toda resposta DEVE conter headers X-Request-ID e X-Correlation-ID', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.headers.get('x-request-id')).toBeTruthy();
      expect(res.headers.get('x-correlation-id')).toBeTruthy();
    });
  });
});
