import type { DBState, Guest, Staff, StaffTask, TaskStatus } from '../types';
import { auth } from './firebase';
import { adaptCanonicalRoomUnit, type CanonicalRoomCategory, type CanonicalRoomUnit, toCanonicalUnitStatus } from '../src/adapters/pmsRoomAdapter';
import { adaptCanonicalReservation, type CanonicalReservation } from '../src/adapters/pmsReservationAdapter';

type ApiEnvelope<T> = { success: boolean; data: T };

export async function canonicalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('AUTHENTICATED_CANONICAL_API_REQUIRED');
  const response = await fetch(path, {
    ...init,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `HTTP_${response.status}`);
  return body as T;
}

export interface CanonicalSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  organizationId: string;
  propertyId: string;
}

type CanonicalCategorySummary = Pick<CanonicalRoomCategory, 'categoryId' | 'name'> & { code?: string; active?: boolean };
type CanonicalCrmGuest = { guestId: string; fullName: string; email: string; phone: string; nationality?: string; preferences?: { generalNotes?: string } };
type CanonicalHousekeepingTask = { taskId: string; unitId: string; reservationId?: string; assignedStaffId?: string; notes?: string; propertyId: string; cleaningStatus: string; inspectionStatus: string; createdAt?: string };

const adaptCanonicalGuest = (guest: CanonicalCrmGuest): Guest => ({
  id: guest.guestId,
  fullName: guest.fullName,
  email: guest.email,
  phone: guest.phone,
  cpf: '',
  nationality: guest.nationality,
  bio: guest.preferences?.generalNotes,
});

const adaptCanonicalHousekeepingTask = (task: CanonicalHousekeepingTask): StaffTask => {
  const status: Record<string, TaskStatus> = {
    assigned: 'A Fazer' as TaskStatus,
    dirty: 'A Fazer' as TaskStatus,
    cleaning: 'Em Andamento' as TaskStatus,
    inspection: 'Aguardando Verificação' as TaskStatus,
    clean: 'Concluído' as TaskStatus,
    available: 'Concluído' as TaskStatus,
    cancelled: 'Concluído' as TaskStatus,
  };
  return {
    id: task.taskId,
    description: task.notes || `Governança da UH ${task.unitId}`,
    status: status[task.cleaningStatus] || ('A Fazer' as TaskStatus),
    assigneeId: task.assignedStaffId,
    roomId: task.unitId,
    bookingId: task.reservationId,
    propertyId: task.propertyId as StaffTask['propertyId'],
    propertyUnitId: task.propertyId as StaffTask['propertyUnitId'],
  };
};

export async function getCanonicalSession(): Promise<CanonicalSession> {
  const result = await canonicalRequest<ApiEnvelope<CanonicalSession>>('/api/saas/session');
  return result.data;
}

export function adaptCanonicalSession(session: CanonicalSession): Staff {
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role === 'owner' || session.role === 'admin' ? 'Super Administrador' : 'Gerente',
    permissions: session.permissions as Staff['permissions'],
    propertyId: session.propertyId as Staff['propertyId'],
  };
}

/** Guest sessions use a distinct server boundary. A guest never needs, nor
 * receives, staff tenant permissions from the browser. */
export async function getCanonicalGuestSession(): Promise<Guest> {
  const result = await canonicalRequest<ApiEnvelope<{ guestId: string; fullName: string; email: string; phone?: string }>>('/api/guest/me');
  return {
    id: result.data.guestId,
    fullName: result.data.fullName,
    email: result.data.email,
    phone: result.data.phone || '',
  } as Guest;
}

/** Returns only server-authoritative PMS data over a structurally safe empty
 * state. It deliberately never mixes local fixture records into production. */
export async function loadCanonicalPmsState(emptyState: DBState, authenticatedSession?: CanonicalSession): Promise<DBState> {
  if (!auth.currentUser) return emptyState;
  // Session/provisioning is authoritative and must not be coupled to optional
  // dashboard projections. A transient PMS/CRM/housekeeping failure must never
  // turn a verified tenant session into an "unprovisioned" browser session.
  const session = authenticatedSession ?? await getCanonicalSession();
  const [categoriesResult, unitsResult, reservationsResult, guestsResult, tasksResult] = await Promise.allSettled([
    canonicalRequest<ApiEnvelope<CanonicalRoomCategory[]>>('/api/pms/categories'),
    canonicalRequest<ApiEnvelope<CanonicalRoomUnit[]>>('/api/pms/units'),
    canonicalRequest<ApiEnvelope<CanonicalReservation[]>>('/api/pms/reservations'),
    canonicalRequest<ApiEnvelope<CanonicalCrmGuest[]>>('/api/crm/guests'),
    canonicalRequest<ApiEnvelope<CanonicalHousekeepingTask[]>>('/api/housekeeping/tasks'),
  ]);
  const dataOrEmpty = <T>(result: PromiseSettledResult<ApiEnvelope<T[]>>): T[] => (
    result.status === 'fulfilled' && Array.isArray(result.value.data) ? result.value.data : []
  );
  const categoriesData = dataOrEmpty(categoriesResult);
  const unitsData = dataOrEmpty(unitsResult);
  const reservationsData = dataOrEmpty(reservationsResult);
  const guestsData = dataOrEmpty(guestsResult);
  const tasksData = dataOrEmpty(tasksResult);
  const categories = new Map(categoriesData.map((category) => [category.categoryId, category]));
  const rooms = unitsData.map((unit) => adaptCanonicalRoomUnit(unit, categories.get(unit.categoryId)));
  const bookings = reservationsData.map(adaptCanonicalReservation);
  return {
    ...emptyState,
    rooms,
    bookings,
    guests: guestsData.map(adaptCanonicalGuest),
    staffTasks: tasksData.map(adaptCanonicalHousekeepingTask),
    staff: [adaptCanonicalSession(session)],
    currentPropertyId: unitsData[0]?.propertyId || session.propertyId,
  };
}

export async function createCanonicalGuest(input: Omit<Guest, 'id'>): Promise<Guest> {
  const result = await canonicalRequest<ApiEnvelope<CanonicalCrmGuest>>('/api/crm/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: input.fullName, email: input.email, phone: input.phone, nationality: input.nationality }),
  });
  return adaptCanonicalGuest(result.data);
}

export async function updateCanonicalGuest(input: Guest): Promise<Guest> {
  const result = await canonicalRequest<ApiEnvelope<CanonicalCrmGuest>>(`/api/crm/guests/${encodeURIComponent(input.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: input.fullName, email: input.email, phone: input.phone, nationality: input.nationality, preferences: input.bio ? { generalNotes: input.bio } : undefined }),
  });
  return adaptCanonicalGuest(result.data);
}

export async function createCanonicalHousekeepingTask(task: Omit<StaffTask, 'id'>): Promise<void> {
  if (typeof task.roomId !== 'string') throw new Error('CANONICAL_UNIT_ID_REQUIRED');
  await canonicalRequest<ApiEnvelope<CanonicalHousekeepingTask>>('/api/housekeeping/tasks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitId: task.roomId, reservationId: task.bookingId, assignedStaffId: task.assigneeId, notes: task.description }),
  });
}

export async function updateCanonicalHousekeepingTask(task: StaffTask): Promise<void> {
  const cleaningStatus = task.status === ('Em Andamento' as TaskStatus) ? 'cleaning'
    : task.status === ('Aguardando Verificação' as TaskStatus) ? 'inspection'
      : task.status === ('Concluído' as TaskStatus) ? 'clean' : 'assigned';
  await canonicalRequest<ApiEnvelope<CanonicalHousekeepingTask>>(`/api/housekeeping/tasks/${encodeURIComponent(task.id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleaningStatus, assignedStaffId: task.assigneeId, notes: task.description }),
  });
}

export async function transitionCanonicalReservation(reservationId: string, action: 'check-in' | 'check-out'): Promise<void> {
  await canonicalRequest<ApiEnvelope<unknown>>(`/api/pms/reservations/${encodeURIComponent(reservationId)}/${action}`, { method: 'PATCH' });
}

export async function updateCanonicalRoomStatus(unitId: string, status: import('../types').RoomStatus) {
  return canonicalRequest<ApiEnvelope<CanonicalRoomUnit>>(`/api/pms/units/${encodeURIComponent(unitId)}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: toCanonicalUnitStatus(status) }),
  });
}

/** The legacy drawer may provide a category display name, never a tenant.
 * Category resolution and the final write remain inside the authenticated PMS
 * boundary for the current organization and property. */
export async function createCanonicalRoom(input: { name: string; type: string }): Promise<CanonicalRoomUnit> {
  const categoryResult = await canonicalRequest<ApiEnvelope<CanonicalCategorySummary[]>>('/api/pms/categories');
  const categories = Array.isArray(categoryResult.data) ? categoryResult.data.filter((category) => category.active !== false) : [];
  const requestedType = input.type.trim().toLocaleLowerCase();
  const category = categories.find((item) => item.name.toLocaleLowerCase() === requestedType || item.code?.toLocaleLowerCase() === requestedType)
    ?? (categories.length === 1 ? categories[0] : undefined);
  if (!category) throw new Error('Selecione uma categoria PMS canônica antes de cadastrar a unidade.');
  const unitNumber = input.name.trim();
  if (!unitNumber) throw new Error('O número ou nome da UH é obrigatório.');
  const result = await canonicalRequest<ApiEnvelope<CanonicalRoomUnit>>('/api/pms/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId: category.categoryId, unitNumber, status: 'clean' }),
  });
  return result.data;
}
