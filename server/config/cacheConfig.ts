import { env } from './environment.ts';

export const cacheConfig = {
  contextService: {
    ttlSeconds: process.env.CONTEXT_CACHE_TTL ? Number(process.env.CONTEXT_CACHE_TTL) : 5,
    maxSize: 100
  },
  general: {
    ttlSeconds: 60,
    maxSize: 500
  },
  DEFAULT_CONTEXT_CACHE_TTL: process.env.CONTEXT_CACHE_TTL ? Number(process.env.CONTEXT_CACHE_TTL) : 5000, // em milissegundos
  MAX_TIMELINE_PAGE_SIZE: process.env.MAX_TIMELINE_PAGE_SIZE ? Number(process.env.MAX_TIMELINE_PAGE_SIZE) : 50,
  MAX_LOG_PAGE_SIZE: process.env.MAX_LOG_PAGE_SIZE ? Number(process.env.MAX_LOG_PAGE_SIZE) : 100,
  MAX_HISTORY_PAGE_SIZE: process.env.MAX_HISTORY_PAGE_SIZE ? Number(process.env.MAX_HISTORY_PAGE_SIZE) : 100,
  METRICS_ENABLED: env.ENABLE_METRICS ?? true
};
