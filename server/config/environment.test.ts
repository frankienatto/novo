import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const cwd = path.resolve(process.cwd());
const secretNames = [
  'JWT_SECRET',
  'N8N_SECRET',
  'ALOHA_API_KEY',
  'GEMINI_API_KEY',
  'SYSTEM_WEBHOOK_PASSWORD',
  'ALOHA_PRO_WEBHOOK_SECRET',
];

function loadEnvironment(nodeEnv: 'development' | 'test' | 'production') {
  const env = { ...process.env, NODE_ENV: nodeEnv } as Record<string, string | undefined>;
  for (const name of secretNames) delete env[name];

  return spawnSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', "await import('./server/config/environment.ts')"],
    { cwd, env, encoding: 'utf8' }
  );
}

describe('environment security', () => {
  it('rejects production startup when required secrets are absent without printing values', () => {
    const result = loadEnvironment('production');
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain('JWT_SECRET');
    expect(output).toContain('N8N_SECRET');
    expect(output).not.toMatch(/synapse_(jwt|n8n)_secret/);
  });

  it('allows test startup with no secret fallback', () => {
    const result = loadEnvironment('test');
    expect(result.status).toBe(0);
  });

  it('allows development startup with no authentication bypass secret', () => {
    const result = loadEnvironment('development');
    expect(result.status).toBe(0);
  });
});
