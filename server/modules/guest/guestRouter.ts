import { Router, Request, Response, NextFunction } from 'express';
import { getAdminAuth, getAdminFirestore } from '../../config/firebaseAdmin.ts';
import { crmService } from '../crm/crmService.ts';
import { reservationRepository } from '../pms/reservationRepository.ts';
import type { Reservation } from '../pms/reservationTypes.ts';

type GuestIdentity = { firebaseUid: string; guestId: string; organizationId: string; createdAt: string; updatedAt: string };

declare global {
  namespace Express {
    interface Request { guestIdentity?: GuestIdentity; }
  }
}

const safeReservation = (reservation: Reservation) => ({
  reservationId: reservation.reservationId,
  propertyId: reservation.propertyId,
  unitId: reservation.unitId,
  stayPeriod: reservation.stayPeriod,
  status: reservation.status,
  paymentStatus: reservation.paymentStatus,
  totalAmount: reservation.totalAmount,
  amountPaid: reservation.amountPaid || 0,
  balance: reservation.balance ?? reservation.totalAmount,
  currency: reservation.currency || 'brl',
  preArrival: reservation.preArrival,
});

async function guestAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'GUEST_AUTH_REQUIRED' });
  try {
    const token = await getAdminAuth().verifyIdToken(header.slice(7));
    const identity = await getAdminFirestore().collection('guestIdentities').doc(token.uid).get();
    if (!identity.exists) return res.status(403).json({ error: 'GUEST_IDENTITY_NOT_PROVISIONED' });
    const data = identity.data() as GuestIdentity;
    if (!data?.guestId || !data?.organizationId || data.firebaseUid !== token.uid) return res.status(403).json({ error: 'GUEST_IDENTITY_INVALID' });
    req.guestIdentity = data;
    return next();
  } catch {
    return res.status(401).json({ error: 'GUEST_AUTH_INVALID' });
  }
}

async function ownedReservations(identity: GuestIdentity): Promise<Reservation[]> {
  const snapshot = await getAdminFirestore().collection('bookings').where('organizationId', '==', identity.organizationId).get();
  return snapshot.docs.map((doc) => doc.data() as Reservation).filter((reservation) => reservation.guest?.guestId === identity.guestId);
}

export const guestRouter = Router();
guestRouter.use(guestAuth);

guestRouter.get('/me', async (req, res) => {
  const identity = req.guestIdentity!;
  const guest = await crmService.getGuestById(identity.guestId);
  if (!guest || guest.organizationId !== identity.organizationId) return res.status(404).json({ error: 'GUEST_NOT_FOUND' });
  return res.json({ data: { guestId: guest.guestId, fullName: guest.fullName, email: guest.email, phone: guest.phone, primaryLanguage: guest.primaryLanguage, preferences: guest.preferences } });
});

guestRouter.get('/me/reservations', async (req, res) => {
  const reservations = await ownedReservations(req.guestIdentity!);
  return res.json({ data: reservations.map(safeReservation) });
});

guestRouter.get('/me/portal', async (req, res) => {
  const identity = req.guestIdentity!;
  const guest = await crmService.getGuestById(identity.guestId);
  if (!guest || guest.organizationId !== identity.organizationId) return res.status(404).json({ error: 'GUEST_NOT_FOUND' });
  const reservations = await ownedReservations(identity);
  const active = reservations.find((reservation) => ['pending', 'confirmed', 'checked_in'].includes(reservation.status));
  return res.json({ data: { guest: { guestId: guest.guestId, fullName: guest.fullName, email: guest.email, phone: guest.phone }, activeReservation: active ? safeReservation(active) : null, reservations: reservations.map(safeReservation) } });
});

/** Pre-arrival intentionally accepts only non-financial, non-document metadata.
 * Document bytes and signatures require an isolated storage/upload boundary. */
guestRouter.post('/me/reservations/:reservationId/pre-arrival', async (req, res) => {
  const identity = req.guestIdentity!;
  const reservationId = String(req.params.reservationId);
  const reservations = await ownedReservations(identity);
  const reservation = reservations.find((candidate) => candidate.reservationId === reservationId);
  if (!reservation) return res.status(404).json({ error: 'GUEST_RESERVATION_NOT_FOUND' });
  const arrivalTime = typeof req.body?.arrivalTime === 'string' ? req.body.arrivalTime.slice(0, 16) : undefined;
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 1000) : undefined;
  const updated = await reservationRepository.updateReservation(identity.organizationId, reservation.propertyId, reservationId, {
    preArrival: { submittedAt: new Date().toISOString(), ...(arrivalTime ? { arrivalTime } : {}), ...(notes ? { notes } : {}), documentUploadStatus: 'not_configured' },
  });
  if (!updated) return res.status(404).json({ error: 'GUEST_RESERVATION_NOT_FOUND' });
  return res.status(200).json({ data: safeReservation(updated) });
});
