import { beforeEach, describe, expect, it } from 'vitest';
import { StagingIdentityProvisioningService } from './stagingIdentityProvisioningService.ts';

const store = new Map<string, Record<string, unknown>>();
const key = (collection: string, id: string) => `${collection}/${id}`;
const db = {
  collection: (collection: string) => ({ doc: (id: string) => ({ id, collection }) }),
  runTransaction: async <T>(callback: any) => callback({
    get: async (reference: any) => ({ exists: store.has(key(reference.collection, reference.id)), data: () => store.get(key(reference.collection, reference.id)) }),
    create: (reference: any, data: Record<string, unknown>) => store.set(key(reference.collection, reference.id), data),
  }),
};
const firebaseUid = 'firebase_staff_uid_123456';
const guestUid = 'firebase_guest_uid_123456';
const actor = { userId: 'owner-uid', organizationId: 'stg-org', propertyIds: ['stg-property'], role: 'owner' as const, permissions: ['manage_staff_permissions'] as any[] };
const accounts = new Map([[firebaseUid, { uid: firebaseUid, email: 'staff.synapse@gmail.com' }], [guestUid, { uid: guestUid, email: 'hospede.synapse@gmail.com' }]]);

const service = () => new StagingIdentityProvisioningService(
  { enabled: true, organizationId: 'stg-org' }, db as any,
  { getUser: async (uid: string) => { const account = accounts.get(uid); if (!account) throw new Error('missing'); return account; } },
  async (guestId: string) => guestId === 'guest-staging' ? { guestId, organizationId: 'stg-org', email: 'hospede.synapse@gmail.com' } : null,
);

beforeEach(() => store.clear());

describe('staging identity provisioning', () => {
  it('provisions a Firebase UID as a least-privilege receptionist staff identity and is idempotent', async () => {
    const result = await service().provisionStaff(actor, { firebaseUid, email: 'staff.synapse@gmail.com', name: 'Staging Staff' });
    expect(result).toMatchObject({ status: 'created', kind: 'staff', organizationId: 'stg-org', propertyId: 'stg-property' });
    expect(store.get(`users/${firebaseUid}`)).toMatchObject({ userId: firebaseUid, role: 'receptionist', propertyIds: ['stg-property'], status: 'active' });
    expect(store.get(`staff/${firebaseUid}`)).toMatchObject({ id: firebaseUid, role: 'Recepcionista', organizationId: 'stg-org' });
    expect((store.get(`users/${firebaseUid}`)?.permissions as string[])).not.toContain('manage_staff_permissions');
    await expect(service().provisionStaff(actor, { firebaseUid, email: 'staff.synapse@gmail.com' })).resolves.toMatchObject({ status: 'already_provisioned' });
  });

  it('rejects owner/admin role input, Firebase email mismatch and tenant conflicts', async () => {
    await expect(service().provisionStaff(actor, { firebaseUid, email: 'staff.synapse@gmail.com', role: 'owner' })).rejects.toThrow('STAGING_STAFF_ROLE_NOT_ALLOWED');
    await expect(service().provisionStaff(actor, { firebaseUid, email: 'wrong@example.com' })).rejects.toThrow('FIREBASE_EMAIL_MISMATCH');
    await expect(service().provisionStaff({ ...actor, organizationId: 'foreign' }, { firebaseUid, email: 'staff.synapse@gmail.com' })).rejects.toThrow('STAGING_IDENTITY_PROVISIONING_TENANT_DENIED');
  });

  it('binds a guest Firebase UID only to a same-tenant canonical CRM guest and never creates staff', async () => {
    const result = await service().provisionGuest(actor, { firebaseUid: guestUid, email: 'hospede.synapse@gmail.com', guestId: 'guest-staging' });
    expect(result).toMatchObject({ status: 'created', kind: 'guest', guestId: 'guest-staging', propertyId: 'stg-property' });
    expect(store.get(`guestIdentities/${guestUid}`)).toMatchObject({ firebaseUid: guestUid, guestId: 'guest-staging', organizationId: 'stg-org' });
    expect(store.has(`users/${guestUid}`)).toBe(false);
    expect(store.has(`staff/${guestUid}`)).toBe(false);
    await expect(service().provisionGuest(actor, { firebaseUid: guestUid, email: 'hospede.synapse@gmail.com', guestId: 'foreign' })).rejects.toThrow('GUEST_TENANT_DENIED');
  });

  it('remains unavailable unless explicitly enabled for the authenticated staging tenant', async () => {
    const disabled = new StagingIdentityProvisioningService({ enabled: false, organizationId: 'stg-org' }, db as any, { getUser: async () => accounts.get(firebaseUid)! }, async () => null);
    await expect(disabled.provisionStaff(actor, { firebaseUid, email: 'staff.synapse@gmail.com' })).rejects.toThrow('STAGING_IDENTITY_PROVISIONING_DISABLED');
  });
});
