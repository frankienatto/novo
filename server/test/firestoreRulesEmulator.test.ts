import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';

const projectId = 'synapse-p01b-rules';
let testEnv: RulesTestEnvironment;
// A validação dinâmica é executada somente quando um Emulator foi configurado
// explicitamente (CI/runner isolado). Nunca deve tentar Firebase de produção.
const describeWithFirestoreEmulator = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;

const adminA = {
  organizationId: 'org_a',
  propertyId: 'prop_a',
  role: 'Admin',
  permissions: ['manage_users'],
  name: 'Admin A'
};

const userA = {
  organizationId: 'org_a',
  propertyId: 'prop_a',
  role: 'Receptionist',
  permissions: ['view_dashboard'],
  name: 'User A'
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'staff', 'admin_a'), adminA);
    await setDoc(doc(db, 'staff', 'user_a'), userA);
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describeWithFirestoreEmulator('Firestore Rules Emulator: staff privilege escalation', () => {
  it('A. rejects unauthenticated staff creation', async () => {
    await assertFails(setDoc(doc(testEnv.unauthenticatedContext().firestore(), 'staff', 'anonymous'), userA));
  });

  it('B/C. rejects a normal user creating a self staff document in any tenant', async () => {
    const db = testEnv.authenticatedContext('user_b').firestore();
    await assertFails(setDoc(doc(db, 'staff', 'user_b'), { ...userA, organizationId: 'org_a' }));
    await assertFails(setDoc(doc(db, 'staff', 'user_b'), { ...userA, organizationId: 'org_b', propertyId: 'prop_b' }));
  });

  it('D. rejects a normal user promoting themselves to admin', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(setDoc(doc(db, 'staff', 'user_a'), { ...userA, role: 'Admin' }));
  });

  it('E/F. rejects role and permission changes by the staff member', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(setDoc(doc(db, 'staff', 'user_a'), { ...userA, role: 'Super Administrador' }));
    await assertFails(setDoc(doc(db, 'staff', 'user_a'), { ...userA, permissions: ['manage_users'] }));
  });

  it('G/H. rejects organization and property changes by the staff member', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertFails(setDoc(doc(db, 'staff', 'user_a'), { ...userA, organizationId: 'org_b' }));
    await assertFails(setDoc(doc(db, 'staff', 'user_a'), { ...userA, propertyId: 'prop_b' }));
  });

  it('I. allows an existing tenant admin to create staff in their own tenant', async () => {
    const db = testEnv.authenticatedContext('admin_a').firestore();
    await assertSucceeds(setDoc(doc(db, 'staff', 'new_user_a'), {
      ...userA,
      organizationId: 'org_a',
      propertyId: 'prop_a'
    }));
  });

  it('J. rejects an admin creating staff in another tenant', async () => {
    const db = testEnv.authenticatedContext('admin_a').firestore();
    await assertFails(setDoc(doc(db, 'staff', 'new_user_b'), {
      ...userA,
      organizationId: 'org_b',
      propertyId: 'prop_b'
    }));
  });

  it('K. allows a staff member to update only their own non-authorisation profile fields', async () => {
    const db = testEnv.authenticatedContext('user_a').firestore();
    await assertSucceeds(setDoc(doc(db, 'staff', 'user_a'), {
      ...userA,
      name: 'Updated User A',
      phone: '+55 11 99999-0000',
      updatedAt: '2026-09-07T00:00:00.000Z'
    }));
  });
});

describeWithFirestoreEmulator('Firestore Rules Emulator: legacy booking financial fields', () => {
  const guestBooking = {
    organizationId: 'org_a', propertyId: 'prop_a', guestId: 'guest_a',
    paymentStatus: 'Pending', balance: 125, totalPrice: 125, amountPaid: 0,
    currency: 'brl', notes: 'Initial note'
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'bookings', 'booking_a'), guestBooking);
    });
  });

  it('rejects a guest creating a legacy booking as paid', async () => {
    const db = testEnv.authenticatedContext('guest_a', { email: 'guest@example.test' }).firestore();
    await assertFails(setDoc(doc(db, 'bookings', 'booking_paid'), {
      ...guestBooking, paymentStatus: 'Paid', paid: true
    }));
  });

  it('rejects a guest creating a booking with client-controlled financial fields', async () => {
    const db = testEnv.authenticatedContext('guest_a', { email: 'guest@example.test' }).firestore();
    await assertFails(setDoc(doc(db, 'bookings', 'booking-client-financial-create'), {
      organizationId: 'org_a', propertyId: 'prop_a', guestId: 'guest_a',
      totalPrice: 1, balance: 0, paymentStatus: 'Pending', amountPaid: 0, currency: 'BRL',
    }));
  });

  it.each([
    ['paymentStatus', 'Paid'], ['balance', 0], ['totalPrice', 1],
    ['amountPaid', 125], ['paid', true], ['currency', 'usd']
  ])('rejects guest mutation of financial field %s', async (field, value) => {
    const db = testEnv.authenticatedContext('guest_a', { email: 'guest@example.test' }).firestore();
    await assertFails(updateDoc(doc(db, 'bookings', 'booking_a'), { [field]: value }));
  });

  it('allows the guest to update a non-financial booking field', async () => {
    const db = testEnv.authenticatedContext('guest_a', { email: 'guest@example.test' }).firestore();
    await assertSucceeds(updateDoc(doc(db, 'bookings', 'booking_a'), { notes: 'Updated note' }));
  });
});

describeWithFirestoreEmulator('Firestore Rules Emulator: public checkout internal records', () => {
  it.each(['checkoutCapabilities', 'publicReservationIdempotency', 'paymentRecords', 'stripeEvents', 'paymentWebhookEvents'])('rejects direct client writes to %s', async (collectionName) => {
    const db = testEnv.authenticatedContext('guest_a', { email: 'guest@example.test' }).firestore();
    await assertFails(setDoc(doc(db, collectionName, 'internal-record'), { reservationId: 'reservation_a', organizationId: 'org_a', propertyId: 'prop_a' }));
  });
});
