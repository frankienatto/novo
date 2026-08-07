import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/securityConfig.ts';

export function promptGuardMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const rawBody = JSON.stringify(req.body || {});
    const { maxPayloadChars, forbiddenPatterns, blockedSubstrings } = securityConfig.promptGuard;

    // 1. Limitação de Tamanho de Payload
    if (rawBody.length > maxPayloadChars) {
      return res.status(413).json({
        success: false,
        error: 'PAYLOAD_TOO_LARGE',
        code: 'PROMPT_GUARD_EXCEEDED_SIZE',
        message: `O tamanho da requisição excede o limite máximo permitido de ${maxPayloadChars} caracteres para interação com a IA.`,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Extrair textos do body para inspeção
    const textToInspect: string[] = [];

    const extractStrings = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        textToInspect.push(obj);
      } else if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          // Bloqueio explícito de tentativa de passar systemInstruction no body do cliente
          if (key === 'systemInstruction' || key === 'overrideSystemPrompt' || key === 'system_instruction') {
            textToInspect.push(`OVERRIDE_KEY_ATTEMPT:${key}`);
          }
          extractStrings(obj[key]);
        }
      }
    };

    extractStrings(req.body);

    const fullContent = textToInspect.join(' ');

    // 3. Verificar Substrings Bloqueadas
    for (const sub of blockedSubstrings) {
      if (fullContent.includes(sub)) {
        return res.status(422).json({
          success: false,
          error: 'PROMPT_INJECTION_DETECTED',
          code: 'PROMPT_GUARD_BLOCKED_SUBSTRING',
          message: 'Tentativa indevida de sobrescrever ou alterar instruções do sistema detectada e bloqueada.',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 4. Verificar Padrões Regex de Injection / Jailbreak
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(fullContent)) {
        return res.status(422).json({
          success: false,
          error: 'PROMPT_INJECTION_DETECTED',
          code: 'PROMPT_GUARD_BLOCKED_PATTERN',
          message: 'Comando potencialmente nocivo ou instrução de burlar diretrizes da IA detectada.',
          timestamp: new Date().toISOString()
        });
      }
    }

    return next();
  } catch (err: any) {
    console.error('⚠️ [PromptGuard] Erro ao inspecionar payload:', err?.message || err);
    return next();
  }
}
