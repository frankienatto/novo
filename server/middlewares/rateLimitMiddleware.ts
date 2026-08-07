import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config/appConfig.ts';
import { rateLimitConfig, RateLimitRule } from '../config/rateLimitConfig.ts';

interface ClientRecord {
  count: number;
  resetTime: number;
}

const memoryStores: Map<string, Map<string, ClientRecord>> = new Map();

function getStore(bucket: string): Map<string, ClientRecord> {
  if (!memoryStores.has(bucket)) {
    memoryStores.set(bucket, new Map());
  }
  return memoryStores.get(bucket)!;
}

export function createRateLimiter(bucketName: 'ai' | 'rest' | 'webhooks' | 'health' | 'swagger') {
  const rule: RateLimitRule = rateLimitConfig[bucketName] || {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Muitas requisições enviadas.'
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Se Rate Limiting estiver desativado por Feature Flag, ignorar
    if (!appConfig.featureFlags.enableRateLimit) {
      return next();
    }

    const clientIp = String(
      req.headers['x-forwarded-for'] || 
      req.headers['x-real-ip'] || 
      req.socket.remoteAddress || 
      '127.0.0.1'
    ).split(',')[0].trim();

    const now = Date.now();
    const store = getStore(bucketName);
    const client = store.get(clientIp);

    if (!client || now > client.resetTime) {
      store.set(clientIp, {
        count: 1,
        resetTime: now + rule.windowMs
      });
      res.setHeader('X-RateLimit-Limit', rule.max);
      res.setHeader('X-RateLimit-Remaining', rule.max - 1);
      return next();
    }

    if (client.count >= rule.max) {
      const retryAfterSeconds = Math.ceil((client.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', rule.max);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        code: 'RATE_LIMIT_EXCEEDED',
        message: rule.message,
        retryAfterSeconds,
        timestamp: new Date().toISOString()
      });
    }

    client.count += 1;
    res.setHeader('X-RateLimit-Limit', rule.max);
    res.setHeader('X-RateLimit-Remaining', rule.max - client.count);
    return next();
  };
}

export const rateLimiters = {
  ai: createRateLimiter('ai'),
  rest: createRateLimiter('rest'),
  webhooks: createRateLimiter('webhooks'),
  health: createRateLimiter('health'),
  swagger: createRateLimiter('swagger')
};
