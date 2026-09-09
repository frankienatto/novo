import { describe, expect, it } from 'vitest';
import { resolveFirebaseWebConfig, type FirebaseWebConfig } from './firebaseWebConfig.ts';

const developmentFallback: FirebaseWebConfig = {
  apiKey: 'development-api-key',
  authDomain: 'development.firebaseapp.com',
  projectId: 'development-project',
  appId: 'development-app-id',
};

describe('firebase web configuration', () => {
  it('uses staging public configuration when explicitly provided', () => {
    const config = resolveFirebaseWebConfig({
      PROD: true,
      VITE_FIREBASE_API_KEY: 'public-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'staging.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'staging-project',
      VITE_FIREBASE_APP_ID: 'staging-app-id',
      VITE_FIRESTORE_DATABASE_ID: '(default)',
    }, developmentFallback);

    expect(config.projectId).toBe('staging-project');
    expect(config.firestoreDatabaseId).toBe('(default)');
  });

  it('fails closed in production instead of using development Firebase configuration', () => {
    expect(() => resolveFirebaseWebConfig({ PROD: true }, developmentFallback)).toThrow('FIREBASE_WEB_CONFIG_REQUIRED');
  });

  it('keeps the fallback limited to non-production development mode', () => {
    expect(resolveFirebaseWebConfig({ DEV: true }, developmentFallback)).toBe(developmentFallback);
  });
});
