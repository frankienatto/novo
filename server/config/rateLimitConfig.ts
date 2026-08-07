export interface RateLimitRule {
  windowMs: number;
  max: number;
  message: string;
}

export const rateLimitConfig: Record<string, RateLimitRule> = {
  ai: {
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 req/min
    message: 'Limite de requisições para APIs de Inteligência Artificial atingido. Tente novamente em breve.'
  },
  rest: {
    windowMs: 60 * 1000, // 1 minuto
    max: 200, // 200 req/min
    message: 'Muitas requisições na API REST. Por favor, aguarde alguns instantes.'
  },
  webhooks: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 req/min
    message: 'Limite de requisições de Webhook excedido.'
  },
  health: {
    windowMs: 60 * 1000, // 1 minuto
    max: 120, // 120 req/min
    message: 'Muitas chamadas de verificação de Health Check.'
  },
  swagger: {
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // 60 req/min
    message: 'Limite de acessos à documentação Swagger atingido.'
  }
};
