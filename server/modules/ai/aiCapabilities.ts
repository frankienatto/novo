/** Public, non-sensitive runtime capability projection. This deliberately
 * exposes availability only; provider configuration remains server-side. */
export type AiCapabilities = {
  gemini: { available: boolean };
};

export const getAiCapabilities = (environment: NodeJS.ProcessEnv = process.env): AiCapabilities => ({
  gemini: { available: Boolean(environment.GEMINI_API_KEY) },
});
