import { GuestProfile, GuestQueryFilters, GuestStayRecord } from './guestTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

/**
 * Firestore rejects `undefined` at every depth. Keep this explicit at the
 * repository boundary instead of changing global SDK behavior: optional CRM
 * fields are absent from persisted documents, never silently coerced.
 */
export function omitUndefinedFirestoreValues<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.filter(item => item !== undefined).map(item => omitUndefinedFirestoreValues(item)) as T;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, omitUndefinedFirestoreValues(entry)]),
  ) as T;
}

export interface IGuestRepository {
  save(guest: GuestProfile): Promise<GuestProfile>;
  createGuest?(guest: GuestProfile): Promise<GuestProfile>;
  findById(guestId: string): Promise<GuestProfile | null>;
  findGuestById?(organizationId: string, guestId: string): Promise<GuestProfile | null>;
  findByEmailOrDocument(organizationId: string, email: string, documentNumber?: string): Promise<GuestProfile | null>;
  listByOrganization(organizationId: string, filters?: GuestQueryFilters): Promise<GuestProfile[]>;
  addStay(guestId: string, stay: GuestStayRecord): Promise<GuestProfile | null>;
  delete(guestId: string): Promise<boolean>;
  deleteGuest?(organizationId: string, guestId: string): Promise<boolean>;
  updateGuest?(guestId: string, updates: Partial<GuestProfile>): Promise<GuestProfile | null>;
  seedDevData?(): Promise<void>;
}

export class GuestRepository implements IGuestRepository {
  private get db() {
    return getAdminFirestore();
  }

  /**
   * Armazena ou atualiza um perfil de hóspede no Firestore
   */
  async save(guest: GuestProfile): Promise<GuestProfile> {
    if (!guest.guestId) {
      guest.guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    if (!guest.createdAt) {
      guest.createdAt = new Date().toISOString();
    }
    guest.updatedAt = new Date().toISOString();

    // Preserva arrays e objetos aninhados
    const profileToSave: GuestProfile = {
      ...guest,
      tags: guest.tags || [],
      documents: guest.documents || [],
      preferences: guest.preferences || {},
      stayHistory: guest.stayHistory || [],
      totalStaysCount: guest.stayHistory ? guest.stayHistory.length : (guest.totalStaysCount || 0),
      totalSpentAmount: guest.stayHistory 
        ? guest.stayHistory.reduce((sum, s) => sum + (s.totalSpentAmount || 0), 0)
        : (guest.totalSpentAmount || 0)
    };

    const persistedProfile = omitUndefinedFirestoreValues(profileToSave);
    await this.db.collection('guests').doc(guest.guestId).set(persistedProfile, { merge: true });
    return persistedProfile;
  }

  /**
   * Alias de criação para conformidade
   */
  async createGuest(guest: GuestProfile): Promise<GuestProfile> {
    return this.save(guest);
  }

  /**
   * Busca hóspede por ID no Firestore
   */
  async findById(guestId: string): Promise<GuestProfile | null> {
    if (!guestId) return null;

    const docSnap = await this.db.collection('guests').doc(guestId).get();
    if (!docSnap.exists) return null;

    return docSnap.data() as GuestProfile;
  }

  /**
   * Busca hóspede por ID com validação de tenant
   */
  async findGuestById(organizationId: string, guestId: string): Promise<GuestProfile | null> {
    const guest = await this.findById(guestId);
    if (!guest || guest.organizationId !== organizationId) {
      return null;
    }
    return guest;
  }

  /**
   * Busca hóspede por email ou documento dentro da mesma Organização
   */
  async findByEmailOrDocument(organizationId: string, email: string, documentNumber?: string): Promise<GuestProfile | null> {
    if (!organizationId) return null;

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanDoc = documentNumber ? documentNumber.replace(/\D/g, '') : '';

    const snapshot = await this.db.collection('guests')
      .where('organizationId', '==', organizationId)
      .get();

    let foundGuest: GuestProfile | null = null;

    snapshot.forEach(doc => {
      if (foundGuest) return;
      const guest = doc.data() as GuestProfile;

      if (cleanEmail && guest.email && guest.email.toLowerCase() === cleanEmail) {
        foundGuest = guest;
        return;
      }

      if (cleanDoc && guest.documents && guest.documents.length > 0) {
        const hasDoc = guest.documents.some(d => d.number && d.number.replace(/\D/g, '') === cleanDoc);
        if (hasDoc) {
          foundGuest = guest;
          return;
        }
      }
    });

    return foundGuest;
  }

  /**
   * Lista hóspedes de uma Organização com suporte a filtros avançados
   */
  async listByOrganization(organizationId: string, filters?: GuestQueryFilters): Promise<GuestProfile[]> {
    if (!organizationId) return [];

    let query = this.db.collection('guests').where('organizationId', '==', organizationId);

    if (filters?.classification) {
      query = query.where('classification', '==', filters.classification);
    }

    const snapshot = await query.get();
    const results: GuestProfile[] = [];

    snapshot.forEach(doc => {
      const guest = doc.data() as GuestProfile;

      if (filters?.tag && (!guest.tags || !guest.tags.includes(filters.tag))) {
        return;
      }

      if (filters?.minStays !== undefined && (guest.totalStaysCount || 0) < filters.minStays) {
        return;
      }

      if (filters?.propertyId) {
        const hasStayInProperty = guest.stayHistory && guest.stayHistory.some(s => s.propertyId === filters.propertyId);
        if (!hasStayInProperty) return;
      }

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        const matchesName = guest.fullName && guest.fullName.toLowerCase().includes(term);
        const matchesEmail = guest.email && guest.email.toLowerCase().includes(term);
        const matchesPhone = guest.phone && guest.phone.includes(term);
        const matchesDoc = guest.documents && guest.documents.some(d => d.number && d.number.includes(term));

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesDoc) {
          return;
        }
      }

      results.push(guest);
    });

    // Ordenar por última estadia ou data de atualização (mais recente primeiro)
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Adiciona um registro de estadia ao histórico do hóspede e persiste no Firestore
   */
  async addStay(guestId: string, stay: GuestStayRecord): Promise<GuestProfile | null> {
    const guest = await this.findById(guestId);
    if (!guest) return null;

    const history = guest.stayHistory || [];
    history.push(stay);

    const totalStaysCount = history.length;
    const totalSpentAmount = history.reduce((sum, s) => sum + (s.totalSpentAmount || 0), 0);
    const lastStayDate = stay.checkOutDate;
    const updatedAt = new Date().toISOString();

    const updated: GuestProfile = {
      ...guest,
      stayHistory: history,
      totalStaysCount,
      totalSpentAmount,
      lastStayDate,
      updatedAt
    };

    const persistedGuest = omitUndefinedFirestoreValues(updated);
    await this.db.collection('guests').doc(guestId).set(persistedGuest, { merge: true });
    return persistedGuest;
  }

  /**
   * Atualiza dados cadastrais ou preferências com proteção de integridade multi-tenant
   */
  async updateGuest(guestId: string, updates: Partial<GuestProfile>): Promise<GuestProfile | null> {
    const existing = await this.findById(guestId);
    if (!existing) return null;

    if (updates.organizationId && updates.organizationId !== existing.organizationId) {
      throw new Error("Não é permitido alterar o organizationId de um hóspede existente.");
    }
    if (updates.guestId && updates.guestId !== guestId) {
      throw new Error("Não é permitido alterar o guestId de um hóspede existente.");
    }

    const updated: GuestProfile = {
      ...existing,
      ...updates,
      guestId,
      organizationId: existing.organizationId,
      updatedAt: new Date().toISOString()
    };

    const persistedGuest = omitUndefinedFirestoreValues(updated);
    await this.db.collection('guests').doc(guestId).set(persistedGuest, { merge: true });
    return persistedGuest;
  }

  /**
   * Exclui um perfil de hóspede
   */
  async delete(guestId: string): Promise<boolean> {
    if (!guestId) return false;
    const existing = await this.findById(guestId);
    if (!existing) return false;

    await this.db.collection('guests').doc(guestId).delete();
    return true;
  }

  /**
   * Exclui um perfil de hóspede com validação de tenant
   */
  async deleteGuest(organizationId: string, guestId: string): Promise<boolean> {
    const existing = await this.findGuestById(organizationId, guestId);
    if (!existing) return false;

    await this.db.collection('guests').doc(guestId).delete();
    return true;
  }

  /**
   * Seed de desenvolvimento para testes locais
   */
  async seedDevData(): Promise<void> {
    const devOrgId = 'org_dev_default';
    const existing = await this.listByOrganization(devOrgId);
    if (existing.length === 0) {
      const devGuest: GuestProfile = {
        guestId: 'gst_001',
        organizationId: devOrgId,
        fullName: 'Carlos Eduardo Silva',
        email: 'carlos.silva@example.com',
        phone: '+55 11 98765-4321',
        primaryLanguage: 'pt-BR',
        nationality: 'Brasileira',
        classification: 'vip',
        tags: ['frequente', 'solicita-andar-alto'],
        documents: [{ type: 'cpf', number: '123.456.789-00' }],
        preferences: {
          pillowType: 'Plumas',
          floorPreference: 'high',
          quietRoomRequested: true,
          dietaryRestrictions: ['Sem lactose']
        },
        stayHistory: [],
        totalStaysCount: 0,
        totalSpentAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.save(devGuest);
    }
  }
}

export const guestRepository = new GuestRepository();

