import { env } from './environment.ts';

export const securityConfig = {
  jwtSecret: env.JWT_SECRET,
  n8nSecret: env.N8N_SECRET,
  alohaApiKey: env.ALOHA_API_KEY,
  promptGuard: {
    maxPayloadChars: 15000,
    forbiddenPatterns: [
      /ignore\s+(all\s+)?(previous\s+)?instructions/i,
      /disregard\s+(all\s+)?(prior\s+)?system\s+prompts/i,
      /you\s+are\s+now\s+a\s+DAN/i,
      /forget\s+your\s+role/i,
      /override\s+system\s+prompt/i,
      /reveal\s+system\s+prompt/i,
      /show\s+me\s+your\s+system\s+instruction/i,
      /print\s+system\s+prompt/i,
      /bypass\s+security\s+filter/i,
    ],
    blockedSubstrings: [
      '<system_instruction_override>',
      '[SYSTEM_PROMPT_OVERRIDE]',
      '{{override_system_prompt}}'
    ]
  }
};
