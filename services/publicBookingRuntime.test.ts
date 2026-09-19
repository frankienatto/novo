import { describe, expect, it } from 'vitest';
import { resolvePublicBookingPropertyId } from './publicBookingRuntime.ts';

describe('public booking runtime resolution', () => {
  it('uses the deployment public property configuration for the root staging entry point', () => {
    expect(resolvePublicBookingPropertyId({
      search: '',
      configuredPublicPropertyId: 'stg-public-synapse-core',
    })).toBe('stg-public-synapse-core');
  });

  it('allows an explicit public URL to select a public mapping without exposing tenant identifiers', () => {
    expect(resolvePublicBookingPropertyId({
      search: '?page=booking&publicPropertyId=public-property-b',
      configuredPublicPropertyId: 'public-property-a',
    })).toBe('public-property-b');
  });

  it('keeps in-app navigation parameters ahead of URL and deployment defaults', () => {
    expect(resolvePublicBookingPropertyId({
      pageParams: { publicPropertyId: 'public-property-c' },
      search: '?publicPropertyId=public-property-b',
      configuredPublicPropertyId: 'public-property-a',
    })).toBe('public-property-c');
  });

  it('fails closed when no public property mapping has been configured', () => {
    expect(resolvePublicBookingPropertyId({ search: '', configuredPublicPropertyId: '  ' })).toBeUndefined();
  });
});
