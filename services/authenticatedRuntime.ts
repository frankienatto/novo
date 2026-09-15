import type { DBState, Staff } from '../types';
import { adaptCanonicalSession, type CanonicalSession } from './canonicalPmsRuntime';
import { isProvisionedInternalUser } from './productionRuntimePolicy';

export type CanonicalInternalRuntime = {
  user: Staff;
  state: DBState;
  session: CanonicalSession;
};

/**
 * Restores an authenticated staff runtime exclusively from the server-side
 * SaaS session boundary. Browser Firestore lookups and email matching are not
 * authority for provisioning, tenant selection or RBAC.
 */
export async function restoreCanonicalInternalRuntime(
  getSession: () => Promise<CanonicalSession>,
  loadState: () => Promise<DBState>,
): Promise<CanonicalInternalRuntime> {
  const session = await getSession();
  const user = adaptCanonicalSession(session);
  const state = await loadState();

  if (!isProvisionedInternalUser(state, user)) {
    throw new Error('CANONICAL_INTERNAL_RUNTIME_UNPROVISIONED');
  }

  return { user, state, session };
}
