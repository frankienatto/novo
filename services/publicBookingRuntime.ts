export interface PublicBookingRuntimeInput {
  pageParams?: unknown;
  search?: string;
  configuredPublicPropertyId?: string;
}

/**
 * Resolves the public, opaque property identifier without ever deriving a
 * tenant or property from browser state. A deployment can configure one
 * public entry point, while an explicit public URL can select another public
 * mapping where the product is hosted for multiple properties.
 */
export function resolvePublicBookingPropertyId({
  pageParams,
  search = '',
  configuredPublicPropertyId,
}: PublicBookingRuntimeInput): string | undefined {
  const paramValue = pageParams && typeof pageParams === 'object'
    ? (pageParams as { publicPropertyId?: unknown }).publicPropertyId
    : undefined;
  const queryValue = new URLSearchParams(search).get('publicPropertyId');
  const candidate = typeof paramValue === 'string' ? paramValue : queryValue || configuredPublicPropertyId;
  const normalized = typeof candidate === 'string' ? candidate.trim() : '';
  return normalized || undefined;
}
