import type { DBState, User } from '../types';

type PartialState = Partial<DBState> | null | undefined;

const array = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];

/**
 * Public pages may only render data that was actually provisioned. This never
 * selects a fallback property and never turns local fixtures into catalog data.
 */
export function hasProvisionedPublicPresentation(state: PartialState): boolean {
  const properties = array(state?.properties);
  const activeProperty = properties.find((property) => property.id === state?.currentPropertyId);
  const content = state?.siteContent;
  const theme = state?.themeSettings;

  return Boolean(activeProperty && content?.hero && theme?.publicSite);
}

/** The legacy browser booking flow is development-only; production uses the canonical server catalog. */
export function canRenderLegacyBooking(state: PartialState, isProduction: boolean): boolean {
  if (isProduction) return false;
  return Boolean(
    hasProvisionedPublicPresentation(state)
    && array(state?.rooms).length > 0
    && array(state?.ratePlans).length > 0,
  );
}

/** A cached/stale client session never grants access when its staff record is absent. */
export function isProvisionedInternalUser(state: PartialState, user: User | null): boolean {
  if (!user || !('role' in user)) return false;
  return array(state?.staff).some((staff) => staff.id === user.id);
}

export function isProvisionedGuestUser(state: PartialState, user: User | null): boolean {
  if (!user || !('fullName' in user)) return false;
  return array(state?.guests).some((guest) => guest.id === user.id);
}
