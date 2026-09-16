import type { DBState } from '../types';

export interface ResolvePublicBookingOptions {
  pathname?: string;
  search?: string;
  pageParams?: Record<string, unknown> | null;
  dbState?: Partial<DBState> | null;
}

const PUBLIC_PROPERTY_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Sanitizes and validates a candidate publicPropertyId string.
 * Strictly alphanumeric with hyphens or underscores, 1 to 128 characters.
 */
export function sanitizePublicPropertyId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || !PUBLIC_PROPERTY_ID_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Extracts publicPropertyId from the URL pathname.
 * Supported patterns:
 * - /booking/:publicPropertyId (e.g. /booking/stg-public-synapse-core)
 * - /p/:publicPropertyId (e.g. /p/stg-public-synapse-core)
 */
export function extractPublicPropertyIdFromPath(pathname?: string): string | undefined {
  if (!pathname) return undefined;
  const normalized = pathname.replace(/\/+$/, '');
  const match = normalized.match(/^\/(?:booking|p)\/([^/?#]+)$/);
  if (match && match[1]) {
    try {
      return sanitizePublicPropertyId(decodeURIComponent(match[1]));
    } catch {
      return sanitizePublicPropertyId(match[1]);
    }
  }
  return undefined;
}

/**
 * Extracts publicPropertyId from URL search query parameters.
 * Supported parameters:
 * - ?publicPropertyId=...
 * - ?propertySlug=...
 * - ?property=...
 */
export function extractPublicPropertyIdFromSearch(search?: string): string | undefined {
  if (!search) return undefined;
  try {
    const params = new URLSearchParams(search);
    const raw = params.get('publicPropertyId') || params.get('propertySlug') || params.get('property');
    return sanitizePublicPropertyId(raw);
  } catch {
    return undefined;
  }
}

/**
 * Resolves the publicPropertyId from the context in order of explicit authority:
 * 1. Explicit pageParams.publicPropertyId
 * 2. URL Path (/booking/:publicPropertyId)
 * 3. URL Query Parameter (?publicPropertyId=...)
 * 4. Active property configuration in dbState (if explicitly declared)
 *
 * Never performs implicit fallbacks, never guesses first property,
 * never returns demo IDs (P01, beach, sanctuary).
 */
export function resolvePublicPropertyId(options: ResolvePublicBookingOptions): string | undefined {
  // 1. Explicit in pageParams
  const fromParams = sanitizePublicPropertyId(options.pageParams?.publicPropertyId);
  if (fromParams) return fromParams;

  // 2. Explicit in URL Path (/booking/:id)
  const fromPath = extractPublicPropertyIdFromPath(options.pathname);
  if (fromPath) return fromPath;

  // 3. Explicit in URL Query (?publicPropertyId=:id)
  const fromSearch = extractPublicPropertyIdFromSearch(options.search);
  if (fromSearch) return fromSearch;

  // 4. From active property in dbState if configured
  if (options.dbState?.properties && options.dbState.currentPropertyId) {
    const active = options.dbState.properties.find(
      (p) => p.id === options.dbState?.currentPropertyId,
    );
    const fromActive = sanitizePublicPropertyId((active as any)?.publicPropertyId);
    if (fromActive) return fromActive;
  }

  // 5. Fail-closed: return undefined
  return undefined;
}

export interface InitialRouteResolution {
  page: 'booking' | 'digitalMenu' | 'login' | 'home';
  params?: Record<string, unknown>;
}

/**
 * Resolves initial SPA route when loading the application.
 * Ensures /booking/:id or ?publicPropertyId=... reliably routes
 * directly to the booking view with the canonical identifier.
 */
export function resolvePublicBookingInitialRoute(
  pathname: string,
  search: string,
  dbState?: Partial<DBState> | null,
): InitialRouteResolution | null {
  const publicPropertyIdFromPath = extractPublicPropertyIdFromPath(pathname);
  const publicPropertyIdFromSearch = extractPublicPropertyIdFromSearch(search);

  const normalizedPath = (pathname || '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams(search || '');
  const pageParam = searchParams.get('page');

  // Case 1: Path is /booking/:id
  if (publicPropertyIdFromPath) {
    return {
      page: 'booking',
      params: { publicPropertyId: publicPropertyIdFromPath },
    };
  }

  // Case 2: Query has publicPropertyId
  if (publicPropertyIdFromSearch) {
    return {
      page: 'booking',
      params: { publicPropertyId: publicPropertyIdFromSearch },
    };
  }

  // Case 3: Path is /booking or query has page=booking (without explicit publicPropertyId)
  if (normalizedPath === '/booking' || pageParam === 'booking') {
    const resolvedId = resolvePublicPropertyId({ pathname, search, dbState });
    return {
      page: 'booking',
      params: resolvedId ? { publicPropertyId: resolvedId } : undefined,
    };
  }

  return null;
}
