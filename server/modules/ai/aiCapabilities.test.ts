import { describe, expect, it } from 'vitest';
import { getAiCapabilities } from './aiCapabilities.ts';

describe('AI public capabilities', () => {
  it('does not expose Gemini configuration when the provider is unavailable', () => {
    expect(getAiCapabilities({} as NodeJS.ProcessEnv)).toEqual({ gemini: { available: false } });
  });

  it('exposes only availability when Gemini is configured', () => {
    expect(getAiCapabilities({ GEMINI_API_KEY: 'test-only-value' } as NodeJS.ProcessEnv)).toEqual({
      gemini: { available: true },
    });
  });
});
