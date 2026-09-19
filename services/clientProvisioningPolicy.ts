declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean;
      readonly PROD: boolean;
      readonly VITE_PUBLIC_PROPERTY_ID?: string;
    };
  }
}

/**
 * Fixtures locais existem exclusivamente para desenvolvimento/preview.
 * O navegador nunca é uma autoridade de provisionamento do tenant.
 */
export function cloneDevelopmentFixture<T>(fixture: T, allowDevelopmentFixtures: boolean): T {
  if (!allowDevelopmentFixtures) {
    // Production needs the DB shape to remain render-safe while Firestore is
    // empty or still synchronising. This uses fixture keys only, never fixture
    // business data, identifiers, prices, users or properties.
    if (Array.isArray(fixture)) return [] as T;
    if (fixture && typeof fixture === 'object') {
      return Object.fromEntries(
        Object.entries(fixture as Record<string, unknown>).map(([key, value]) => [
          key,
          Array.isArray(value) ? [] : value && typeof value === 'object' ? {} : typeof value === 'string' ? '' : null,
        ]),
      ) as T;
    }
    return fixture;
  }
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
