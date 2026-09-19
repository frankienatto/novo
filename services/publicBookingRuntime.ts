export interface PublicBookingRuntimeInput {
  pageParams?: unknown;
  search?: string;
  configuredPublicPropertyId?: string;
  hostname?: string;
}

const STAGING_PUBLIC_PROPERTY_ID = 'stg-public-synapse-core';

const isSynapseStagingCloudRunHost = (hostname?: string) =>
  /^synapse-staging-[a-z0-9-]+\.southamerica-east1\.run\.app$/i.test((hostname || '').trim());

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
  hostname,
}: PublicBookingRuntimeInput): string | undefined {
  const paramValue = pageParams && typeof pageParams === 'object'
    ? (pageParams as { publicPropertyId?: unknown }).publicPropertyId
    : undefined;
  const queryValue = new URLSearchParams(search).get('publicPropertyId');
  const stagingFallback = isSynapseStagingCloudRunHost(hostname) ? STAGING_PUBLIC_PROPERTY_ID : undefined;

  for (const candidate of [paramValue, queryValue, configuredPublicPropertyId, stagingFallback]) {
    const normalized = typeof candidate === 'string' ? candidate.trim() : '';
    if (normalized) return normalized;
  }
  return undefined;
}
