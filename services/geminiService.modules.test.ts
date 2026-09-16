import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DBState } from '../types';

const state = vi.hoisted(() => ({ authenticated: true }));
const getIdToken = vi.fn();
vi.mock('./firebase.ts', () => ({ auth: { get currentUser() { return state.authenticated ? { getIdToken } : null; } } }));

import {
  calculateBreakevenPoint,
  generatePOSSuggestions,
  generateProjectShoppingList,
  generatePostTextAndHashtags,
  generateManagementReport,
  getAIConciergeResponse,
  callGeminiAgent,
  resetAiCapabilitiesForTests
} from './geminiService.ts';

describe('AI Modules Functional Validation via Authenticated Gemini Pipeline', () => {
  afterEach(() => {
    resetAiCapabilitiesForTests();
    vi.unstubAllGlobals();
  });

  const setupMockAuthenticatedFetch = (responseData: unknown) => {
    state.authenticated = true;
    getIdToken.mockResolvedValue('test-firebase-token-12345');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gemini: { available: true } })
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => responseData
      });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('1. Financeiro: calculateBreakevenPoint envia Bearer token e consome endpoint canônico', async () => {
    const expected = { breakevenOccupancyRate: 45, monthlyRevenueTarget: 35000, analysis: 'Ponto de equilíbrio atingível.' };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const result = await calculateBreakevenPoint(15000, 250, 50);

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/capabilities');
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-firebase-token-12345',
        'Content-Type': 'application/json'
      })
    }));
  });

  it('2. POS/PDV: generatePOSSuggestions envia Bearer token e consome endpoint canônico', async () => {
    const expected = { suggestions: [{ productId: 'prod_1', productName: 'Caipirinha', justification: 'Ótima combinação' }] };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const cart = [{ productId: 'item_1', name: 'Porção de Peixe', unitPrice: 65, quantity: 1 }];
    const products = [{ id: 'prod_1', name: 'Caipirinha', price: 28, category: 'Bar' }] as any;
    const result = await generatePOSSuggestions(null, cart, products, 'Pôr do Sol');

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-firebase-token-12345' })
    }));
  });

  it('3. Estoque/Compras: generateProjectShoppingList envia Bearer token e consome endpoint canônico', async () => {
    const expected = { estimatedTotalCost: 1200, items: [{ name: 'Toalhas Brancas', quantity: 50, maxPrice: 24, supplierURL: 'https://exemplo.com' }] };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const project = { id: 'proj_1', name: 'Renovação do Enxoval' };
    const result = await generateProjectShoppingList(project);

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-firebase-token-12345' })
    }));
  });

  it('4. Marketing: generatePostTextAndHashtags envia Bearer token e consome endpoint canônico', async () => {
    const expected = { text: 'Venha curtir o final de semana!', hashtags: ['#praia', '#sol', '#hotel'] };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const property = { id: 'prop_1', name: 'Forest House Beach' } as any;
    const result = await generatePostTextAndHashtags('Feriado ensolarado', property);

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-firebase-token-12345' })
    }));
  });

  it('5. Executive: generateManagementReport envia Bearer token e consome endpoint canônico', async () => {
    const expected = {
      financialSummary: { totalRevenue: 50000, totalExpenses: 25000, netProfit: 25000, keyInsight: 'Crescimento de 15%' },
      projectStatus: { activeProjects: 2, atRiskProjects: [] },
      teamPerformance: { tasksCompleted: 45, keyInsight: 'Alta produtividade' },
      inventoryAlerts: { lowStockItems: [] },
      strategicRecommendations: [{ priority: 'Alta', recommendation: 'Promover dias úteis' }]
    };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const dbState = {
      bookings: [],
      transactions: [],
      expenses: [],
      rooms: []
    } as unknown as DBState;
    const result = await generateManagementReport(dbState);

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-firebase-token-12345' })
    }));
  });

  it('6. Concierge: getAIConciergeResponse envia Bearer token e consome endpoint canônico', async () => {
    const expected = { response: 'Temos passeios de escuna saindo às 10h da manhã!', suggestions: ['Reservar passeio', 'Ver opções'] };
    const fetchMock = setupMockAuthenticatedFetch(expected);

    const property = { id: 'prop_1', name: 'Forest House Beach' } as any;
    const result = await getAIConciergeResponse([], 'Quais passeios vocês recomendam?', property);

    expect(result).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-firebase-token-12345' })
    }));
  });

  it('7. AI Agents: callGeminiAgent envia Bearer token para /api/gemini/agent-execute', async () => {
    state.authenticated = true;
    getIdToken.mockResolvedValue('test-firebase-token-12345');
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, agentId: 'revenue_agent', data: { recommendation: 'Aumentar tarifa' } })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await callGeminiAgent('revenue_agent', 'Analise a ocupação para o final de semana');

    expect(result).toEqual({ recommendation: 'Aumentar tarifa' });
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/agent-execute', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-firebase-token-12345',
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        agentId: 'revenue_agent',
        prompt: 'Analise a ocupação para o final de semana'
      })
    }));
  });
});
