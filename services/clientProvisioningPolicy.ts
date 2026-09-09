declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean;
      readonly PROD: boolean;
    };
  }
}

/**
 * Fixtures locais existem exclusivamente para desenvolvimento/preview.
 * O navegador nunca é uma autoridade de provisionamento do tenant.
 */
export function cloneDevelopmentFixture<T>(fixture: T, allowDevelopmentFixtures: boolean): T {
  if (!allowDevelopmentFixtures) return {} as T;
  return JSON.parse(JSON.stringify(fixture)) as T;
}

export function resolveEmptyCollectionState<T>(
  fixture: T | undefined,
  isSingleton: boolean,
  allowDevelopmentFixtures: boolean,
): T {
  if (allowDevelopmentFixtures && fixture !== undefined) {
    return JSON.parse(JSON.stringify(fixture)) as T;
  }

  return (isSingleton ? {} : []) as T;
}

/** There is intentionally no client-side bootstrap write, in any environment. */
export function mayClientProvisionPrivilegedRecords(): false {
  return false;
}

export function mayUseLegacyDemoLogin(allowDevelopmentFixtures: boolean): boolean {
  return allowDevelopmentFixtures;
}
