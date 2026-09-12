import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ authenticated: true }));
const getIdToken = vi.fn();
vi.mock('./firebase.ts', () => ({ auth: { get currentUser() { return state.authenticated ? { getIdToken } : null; } } }));

import { generateSinglePersona, resetAiCapabilitiesForTests } from './geminiService.ts';

describe('Gemini browser boundary', () => {
  afterEach(() => resetAiCapabilitiesForTests());

  it('sends the Firebase bearer token to the protected Gemini endpoint', async () => {
    state.authenticated = true;
    getIdToken.mockResolvedValue('verified-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ gemini: { available: true } }) })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ data: { name: 'Persona' } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateSinglePersona('viagens')).resolves.toEqual({ data: { name: 'Persona' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/capabilities');
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/generateText', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer verified-token' }),
    }));
    vi.unstubAllGlobals();
  });

  it('does not issue a provider request when Gemini is unavailable', async () => {
    state.authenticated = true;
    getIdToken.mockResolvedValue('verified-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ gemini: { available: false } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateSinglePersona('sem provider')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/capabilities');
    vi.unstubAllGlobals();
  });

  it('fails closed before issuing a Gemini request without an authenticated user', async () => {
    state.authenticated = false;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateSinglePersona('sem sessão')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    state.authenticated = true;
  });
});
