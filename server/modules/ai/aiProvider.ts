import { GoogleGenAI } from '@google/genai';

export interface AiGenerationRequest {
  model: string;
  prompt: string;
  systemInstruction: string;
  schema?: unknown;
}

export interface AiGenerationResult {
  text: string;
  provider: 'gemini' | 'deterministic_fake';
}

/** Small provider boundary: production uses Gemini; tests inject a deterministic fake. */
export interface AiProvider {
  generate(request: AiGenerationRequest): Promise<AiGenerationResult>;
}

export class GeminiAiProvider implements AiProvider {
  async generate(request: AiGenerationRequest): Promise<AiGenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('AI_PROVIDER_NOT_CONFIGURED');
    }

    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'synapse-ahos-server' } }
    });
    const response = await client.models.generateContent({
      model: request.model,
      contents: request.prompt,
      config: {
        systemInstruction: request.systemInstruction,
        ...(request.schema ? { responseMimeType: 'application/json', responseSchema: request.schema } : {})
      }
    });
    if (!response.text) throw new Error('AI_PROVIDER_EMPTY_RESPONSE');
    return { text: response.text, provider: 'gemini' };
  }
}

export class DeterministicFakeAiProvider implements AiProvider {
  constructor(private readonly response = JSON.stringify({
    recommendation: 'Resposta determinística de teste.',
    rationale: 'Adapter de teste local; nenhum provider externo foi chamado.',
    proposedActions: [],
    requiresApproval: false,
    confidence: 0.5
  })) {}

  async generate(): Promise<AiGenerationResult> {
    return { text: this.response, provider: 'deterministic_fake' };
  }
}

let testProvider: AiProvider | undefined;

export function setAiProviderForTests(provider?: AiProvider): void {
  testProvider = provider;
}

export function getAiProvider(): AiProvider {
  if (process.env.NODE_ENV === 'test') return testProvider || new DeterministicFakeAiProvider();
  return new GeminiAiProvider();
}
