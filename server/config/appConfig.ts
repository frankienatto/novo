import { env } from './environment.ts';

export const appConfig = {
  name: 'Synapse Hospitality (AHOS)',
  version: '1.0.0',
  environment: env.NODE_ENV,
  port: env.PORT,
  featureFlags: {
    enableSwagger: env.ENABLE_SWAGGER,
    enableCache: env.ENABLE_CACHE,
    enableRateLimit: env.ENABLE_RATE_LIMIT,
    enableMetrics: env.ENABLE_METRICS,
    enableRequestLogging: env.ENABLE_REQUEST_LOGGING,
  },
  defaults: {
    organizationId: 'org_dev_default',
    propertyId: 'prop_dev_default',
    timeZone: 'America/Sao_Paulo',
    locale: 'pt-BR'
  }
};
