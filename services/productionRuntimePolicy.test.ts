import { describe, expect, it } from 'vitest';
import { cloneDevelopmentFixture } from './clientProvisioningPolicy.ts';
import {
  canRenderLegacyBooking,
  canRenderLegacyGuestExperience,
  hasProvisionedPublicPresentation,
  isProvisionedGuestUser,
  isProvisionedInternalUser,
} from './productionRuntimePolicy.ts';

const fixtureShape = {
  properties: [{ id: 'fixture-property' }],
  currentPropertyId: 'fixture-property',
  rooms: [{ id: 1 }],
  ratePlans: [{ id: 'standard' }],
  staff: [{ id: 'S00' }],
  guests: [{ id: 'G01' }],
  siteContent: { hero: { title: 'fixture' } },
  themeSettings: { publicSite: { primaryColor: '#000' } },
};

describe('production runtime policy', () => {
  it('keeps an empty production state structurally safe without copying fixture business data', () => {
    const state = cloneDevelopmentFixture(fixtureShape, false) as typeof fixtureShape;
    expect(state.properties).toEqual([]);
    expect(state.rooms).toEqual([]);
    expect(state.ratePlans).toEqual([]);
    expect(state.staff).toEqual([]);
    expect(state.siteContent).toEqual({});
    expect(state.currentPropertyId).toBe('');
  });

  it('rejects empty or unselected public catalog state without throwing', () => {
    const empty = cloneDevelopmentFixture(fixtureShape, false);
    expect(hasProvisionedPublicPresentation(empty as any)).toBe(false);
    expect(canRenderLegacyBooking(empty as any, true)).toBe(false);
    expect(canRenderLegacyBooking({ ...fixtureShape, currentPropertyId: '' } as any, false)).toBe(false);
  });

  it('stays render-safe when asynchronous Firestore hydration replaces fixture-shaped state with empty collections', () => {
    const state = cloneDevelopmentFixture(fixtureShape, false) as any;

    // This mirrors the listener lifecycle: initial structural state followed
    // by zero-document snapshots. No collection becomes undefined.
    state.properties = [];
    state.rooms = [];
    state.ratePlans = [];
    state.packageDeals = [];
    state.addOns = [];
    state.bookingRestrictions = [];

    expect(() => {
      state.properties.find(() => true);
      state.rooms.filter(() => true);
      state.ratePlans.find(() => true);
      state.packageDeals.filter(() => true);
      state.addOns.find(() => true);
      state.bookingRestrictions.some(() => true);
      hasProvisionedPublicPresentation(state);
      canRenderLegacyBooking(state, true);
    }).not.toThrow();
    expect(hasProvisionedPublicPresentation(state)).toBe(false);
    expect(canRenderLegacyBooking(state, true)).toBe(false);
  });

  it('allows configured development data but never enables the legacy booking flow in production', () => {
    expect(hasProvisionedPublicPresentation(fixtureShape as any)).toBe(true);
    expect(canRenderLegacyBooking(fixtureShape as any, false)).toBe(true);
    expect(canRenderLegacyBooking(fixtureShape as any, true)).toBe(false);
  });

  it('keeps legacy guest and pre-arrival browser data out of production', () => {
    expect(canRenderLegacyGuestExperience(true)).toBe(false);
    expect(canRenderLegacyGuestExperience(false)).toBe(true);
  });

  it('rejects stale or unprovisioned tenant sessions', () => {
    expect(isProvisionedInternalUser({ staff: [] } as any, { id: 'S00', role: 'Admin' } as any)).toBe(false);
    expect(isProvisionedGuestUser({ guests: [] } as any, { id: 'G01', fullName: 'Guest' } as any)).toBe(false);
    expect(isProvisionedInternalUser({ staff: [{ id: 'S00' }] } as any, { id: 'S00', role: 'Admin' } as any)).toBe(true);
  });

  it('permits the internal runtime only after the authenticated canonical projection rehydrates staff', () => {
    const user = { id: 'canonical-user', role: 'Super Administrador' } as any;
    const structuralEmptyState = cloneDevelopmentFixture(fixtureShape, false) as any;

    expect(isProvisionedInternalUser(structuralEmptyState, user)).toBe(false);

    const canonicalHydratedState = {
      ...structuralEmptyState,
      staff: [{ id: 'canonical-user', role: 'Super Administrador' }],
    };
    expect(isProvisionedInternalUser(canonicalHydratedState, user)).toBe(true);
  });
});
