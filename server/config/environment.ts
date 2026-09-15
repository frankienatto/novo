import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).transform(val => Number(val)).default(3000),
  GEMINI_API_KEY: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(8).optional(),
  N8N_SECRET: z.string().min(8).optional(),
  N8N_ORGANIZATION_ID: z.string().min(1).optional(),
  N8N_PROPERTY_ID: z.string().min(1).optional(),
  ALOHA_API_KEY: z.string().min(1).optional(),
  ALOHA_PRO_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  PICPAY_CLIENT_ID: z.string().min(1).optional(),
  PICPAY_CLIENT_SECRET: z.string().min(1).optional(),
  PICPAY_WEBHOOK_TOKEN: z.string().min(1).optional(),
  PICPAY_PIX_API_BASE_URL: z.string().url().optional(),
  PAYMENTS_PUBLIC_BASE_URL: z.string().url().optional(),
  // Disabled by default. This one-time, server-only staging operation is
  // deliberately separate from normal SaaS onboarding.
  STAGING_BOOTSTRAP_ENABLED: z.string().optional().transform(value => value === 'true'),
  STAGING_BOOTSTRAP_UID: z.string().min(1).optional(),
  // Explicitly opt-in server-only binding for Firebase accounts already
  // created by a staging operator. Disabled in every environment by default.
  STAGING_IDENTITY_PROVISIONING_ENABLED: z.string().optional().transform(value => value === 'true'),
  STAGING_IDENTITY_PROVISIONING_ORGANIZATION_ID: z.string().min(1).optional(),
  // Non-secret, explicit staging test-identity coordinates. They are consumed
  // only by the one-click, RBAC-protected staging provisioning operation.
  STAGING_TEST_STAFF_UID: z.string().min(1).optional(),
  STAGING_TEST_STAFF_EMAIL: z.string().email().optional(),
  STAGING_TEST_STAFF_NAME: z.string().min(1).optional(),
  STAGING_TEST_GUEST_UID: z.string().min(1).optional(),
  STAGING_TEST_GUEST_EMAIL: z.string().email().optional(),
  STAGING_TEST_GUEST_NAME: z.string().min(1).optional(),
  STAGING_TEST_GUEST_PHONE: z.string().min(1).optional(),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().url().optional(),
  BEDS24_API_TOKEN: z.string().min(1).optional(),
  // Feature Flags
  ENABLE_SWAGGER: z.string().default('true').transform(val => val === 'true'),
  ENABLE_CACHE: z.string().default('true').transform(val => val === 'true'),
  ENABLE_RATE_LIMIT: z.string().default('true').transform(val => val === 'true'),
  ENABLE_METRICS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_REQUEST_LOGGING: z.string().default('true').transform(val => val === 'true'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse(process.env);
  if (parsedEnv.NODE_ENV === 'production') {
    // Payment and integration credentials are optional capabilities. A core
    // deployment must never require dummy provider secrets to boot.
    const missing = ['JWT_SECRET']
      .filter((key) => !parsedEnv[key as keyof Pick<EnvConfig, 'JWT_SECRET'>]);
    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }
  }
  console.log('✅ [Environment] Variáveis de ambiente validadas com sucesso. Modo:', parsedEnv.NODE_ENV);
} catch (err: any) {
  if (err instanceof z.ZodError) {
    console.error('❌ [Environment] Erro de validação de variáveis de ambiente:');
    err.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  } else {
    console.error('❌ [Environment] Falha crítica nas variáveis de ambiente:', err);
  }
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  // Development/test may run without optional integrations, but never receive
  // predictable fallback credentials.
  parsedEnv = envSchema.parse({ NODE_ENV: process.env.NODE_ENV || 'development' });
}

export const env = parsedEnv;
