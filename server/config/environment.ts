import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).transform(val => Number(val)).default(3000),
  GEMINI_API_KEY: z.string().optional().default(process.env.GEMINI_API_KEY || 'dev_gemini_key_placeholder'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET deve ter no mínimo 8 caracteres').default('synapse_jwt_secret_dev_key_2026_safe'),
  N8N_SECRET: z.string().min(8, 'N8N_SECRET deve ter no mínimo 8 caracteres').default('synapse_n8n_secret_token_dev_2026'),
  ALOHA_API_KEY: z.string().optional().default('aloha_dev_api_key_2026'),
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
  // Fallback para dev
  parsedEnv = envSchema.parse({
    NODE_ENV: 'development'
  });
}

export const env = parsedEnv;
