import { ROLE_PERMISSIONS, type SaaSUser } from '../saas/saasTypes.ts';

export type StagingIdentityProvisioningConfig = {
  enabled: boolean;
  organizationId?: string;
  testStaffUid?: string;
  testStaffEmail?: string;
  testStaffName?: string;
  testGuestUid?: string;
  testGuestEmail?: string;
  testGuestName?: string;
  testGuestPhone?: string;
};

type FirebaseAccount = { uid: string; email?: string; disabled?: boolean };
type DocumentSnapshot = { exists: boolean; data: () => Record<string, unknown> | undefined };
type DocumentReference = { id: string };
type Transaction = { get: (reference: DocumentReference) => Promise<DocumentSnapshot>; create: (reference: DocumentReference, data: Record<string, unknown>) => void };
type Firestore = { collection: (name: string) => { doc: (id: string) => DocumentReference }; runTransaction: <T>(callback: (transaction: Transaction) => Promise<T>) => Promise<T> };
type FirebaseAuth = { getUser: (uid: string) => Promise<FirebaseAccount> };
type GuestLookup = { guestId: string; organizationId: string; email: string };
type EnsureGuest = (organizationId: string, input: { fullName: string; email: string; phone: string }) => Promise<GuestLookup>;

export type ProvisioningActor = Pick<SaaSUser, 'userId' | 'organizationId' | 'propertyIds' | 'role' | 'permissions'>;
export type ProvisionedIdentity = { status: 'created' | 'already_provisioned'; firebaseUid: string; kind: 'staff' | 'guest'; organizationId: string; propertyId: string; guestId?: string };
export type ProvisionedTestIdentities = { staff: ProvisionedIdentity; guest: ProvisionedIdentity };

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const validUid = (uid: string) => /^[A-Za-z0-9_-]{20,128}$/.test(uid);

/** Explicit, server-only staging identity binding. It never creates Firebase
 * accounts and remains unavailable until its staging configuration is enabled. */
export class StagingIdentityProvisioningService {
  constructor(
    private readonly config: StagingIdentityProvisioningConfig,
    private readonly db: Firestore,
    private readonly auth: FirebaseAuth,
    private readonly findGuestById: (guestId: string) => Promise<GuestLookup | null>,
    private readonly ensureGuest?: EnsureGuest,
  ) {}

  getStatus() {
    const configured = Boolean(
      this.config.testStaffUid && this.config.testStaffEmail && this.config.testStaffName
      && this.config.testGuestUid && this.config.testGuestEmail && this.config.testGuestName && this.config.testGuestPhone,
    );
    return { enabled: this.config.enabled, configured };
  }

  private assertStagingActor(actor: ProvisioningActor) {
    if (!this.config.enabled) throw new Error('STAGING_IDENTITY_PROVISIONING_DISABLED');
    if (!this.config.organizationId || actor.organizationId !== this.config.organizationId) throw new Error('STAGING_IDENTITY_PROVISIONING_TENANT_DENIED');
    if (!actor.propertyIds.length) throw new Error('STAGING_IDENTITY_PROVISIONING_PROPERTY_REQUIRED');
  }

  private async verifyFirebaseAccount(firebaseUid: string, email: string) {
    if (!validUid(firebaseUid)) throw new Error('FIREBASE_UID_INVALID');
    const account = await this.auth.getUser(firebaseUid);
    if (account.uid !== firebaseUid || account.disabled) throw new Error('FIREBASE_ACCOUNT_INVALID');
    if (!account.email || normalizeEmail(account.email) !== normalizeEmail(email)) throw new Error('FIREBASE_EMAIL_MISMATCH');
    return account;
  }

  async provisionStaff(actor: ProvisioningActor, input: { firebaseUid: string; email: string; name?: string; role?: string }): Promise<ProvisionedIdentity> {
    this.assertStagingActor(actor);
    if (input.role !== undefined && input.role !== 'receptionist') throw new Error('STAGING_STAFF_ROLE_NOT_ALLOWED');
    const account = await this.verifyFirebaseAccount(input.firebaseUid, input.email);
    const propertyId = actor.propertyIds[0]!;
    const now = new Date().toISOString();
    const email = normalizeEmail(account.email!);
    const name = input.name?.trim() || email.split('@')[0]!;
    const user: SaaSUser = { userId: account.uid, organizationId: actor.organizationId, propertyIds: [propertyId], name, email, role: 'receptionist', permissions: ROLE_PERMISSIONS.receptionist, status: 'active', createdAt: now, updatedAt: now };
    const staff = { id: account.uid, organizationId: actor.organizationId, propertyId, name, email, role: 'Recepcionista', permissions: ROLE_PERMISSIONS.receptionist, onboardingCompleted: true, createdAt: now, updatedAt: now };
    const audit = { action: 'STAGING_STAFF_IDENTITY_PROVISIONED', actorUserId: actor.userId, firebaseUid: account.uid, organizationId: actor.organizationId, propertyId, createdAt: now };
    return this.db.runTransaction(async transaction => {
      const userRef = this.db.collection('users').doc(account.uid);
      const staffRef = this.db.collection('staff').doc(account.uid);
      const auditRef = this.db.collection('stagingIdentityProvisioningAudits').doc(`staff_${account.uid}`);
      const [existingUser, existingStaff] = await Promise.all([transaction.get(userRef), transaction.get(staffRef)]);
      if (existingUser.exists || existingStaff.exists) {
        const userData = existingUser.data(); const staffData = existingStaff.data();
        const matches = existingUser.exists && existingStaff.exists
          && userData?.organizationId === actor.organizationId && staffData?.organizationId === actor.organizationId
          && userData?.email === email && userData?.role === 'receptionist' && staffData?.propertyId === propertyId;
        if (!matches) throw new Error('STAGING_IDENTITY_CONFLICT');
        return { status: 'already_provisioned', firebaseUid: account.uid, kind: 'staff', organizationId: actor.organizationId, propertyId };
      }
      transaction.create(userRef, user as unknown as Record<string, unknown>);
      transaction.create(staffRef, staff);
      transaction.create(auditRef, audit);
      return { status: 'created', firebaseUid: account.uid, kind: 'staff', organizationId: actor.organizationId, propertyId };
    });
  }

  async provisionGuest(actor: ProvisioningActor, input: { firebaseUid: string; email: string; guestId: string }): Promise<ProvisionedIdentity> {
    this.assertStagingActor(actor);
    const account = await this.verifyFirebaseAccount(input.firebaseUid, input.email);
    const guest = await this.findGuestById(input.guestId);
    if (!guest || guest.organizationId !== actor.organizationId) throw new Error('GUEST_TENANT_DENIED');
    if (normalizeEmail(guest.email) !== normalizeEmail(account.email!)) throw new Error('GUEST_EMAIL_MISMATCH');
    const propertyId = actor.propertyIds[0]!;
    const now = new Date().toISOString();
    return this.db.runTransaction(async transaction => {
      const identityRef = this.db.collection('guestIdentities').doc(account.uid);
      const auditRef = this.db.collection('stagingIdentityProvisioningAudits').doc(`guest_${account.uid}`);
      const existing = await transaction.get(identityRef);
      if (existing.exists) {
        const data = existing.data();
        if (data?.firebaseUid !== account.uid || data?.guestId !== guest.guestId || data?.organizationId !== actor.organizationId) throw new Error('STAGING_IDENTITY_CONFLICT');
        return { status: 'already_provisioned', firebaseUid: account.uid, kind: 'guest', organizationId: actor.organizationId, propertyId, guestId: guest.guestId };
      }
      transaction.create(identityRef, { firebaseUid: account.uid, guestId: guest.guestId, organizationId: actor.organizationId, propertyId, createdAt: now, updatedAt: now });
      transaction.create(auditRef, { action: 'STAGING_GUEST_IDENTITY_PROVISIONED', actorUserId: actor.userId, firebaseUid: account.uid, guestId: guest.guestId, organizationId: actor.organizationId, propertyId, createdAt: now });
      return { status: 'created', firebaseUid: account.uid, kind: 'guest', organizationId: actor.organizationId, propertyId, guestId: guest.guestId };
    });
  }

  /**
   * Controlled convenience operation for the two declared staging accounts.
   * The browser supplies no UID, e-mail, role, tenant or guestId; all input
   * comes from server-only runtime configuration and the canonical CRM service.
   */
  async provisionConfiguredTestIdentities(actor: ProvisioningActor): Promise<ProvisionedTestIdentities> {
    this.assertStagingActor(actor);
    const { testStaffUid, testStaffEmail, testStaffName, testGuestUid, testGuestEmail, testGuestName, testGuestPhone } = this.config;
    if (!testStaffUid || !testStaffEmail || !testStaffName || !testGuestUid || !testGuestEmail || !testGuestName || !testGuestPhone || !this.ensureGuest) {
      throw new Error('STAGING_IDENTITY_PROVISIONING_CONFIGURATION_REQUIRED');
    }
    const staff = await this.provisionStaff(actor, { firebaseUid: testStaffUid, email: testStaffEmail, name: testStaffName });
    const guest = await this.ensureGuest(actor.organizationId, { fullName: testGuestName, email: testGuestEmail, phone: testGuestPhone });
    const guestIdentity = await this.provisionGuest(actor, { firebaseUid: testGuestUid, email: testGuestEmail, guestId: guest.guestId });
    return { staff, guest: guestIdentity };
  }
}
