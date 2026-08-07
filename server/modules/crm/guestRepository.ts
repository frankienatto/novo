import { GuestProfile, GuestQueryFilters, GuestStayRecord } from './guestTypes.ts';

export class GuestRepository {
  private guestsMap: Map<string, GuestProfile> = new Map(); // key: guestId

  /**
   * Armazena ou atualiza um perfil de hóspede
   */
  async save(guest: GuestProfile): Promise<GuestProfile> {
    this.guestsMap.set(guest.guestId, { ...guest });
    return { ...guest };
  }

  /**
   * Busca hóspede por ID
   */
  async findById(guestId: string): Promise<GuestProfile | null> {
    const guest = this.guestsMap.get(guestId);
    return guest ? { ...guest } : null;
  }

  /**
   * Busca hóspede por email ou documento dentro da mesma Organização
   */
  async findByEmailOrDocument(organizationId: string, email: string, documentNumber?: string): Promise<GuestProfile | null> {
    const cleanEmail = email.trim().toLowerCase();

    for (const guest of this.guestsMap.values()) {
      if (guest.organizationId !== organizationId) continue;

      if (guest.email.toLowerCase() === cleanEmail) {
        return { ...guest };
      }

      if (documentNumber) {
        const hasDoc = guest.documents.some(d => d.number.replace(/\D/g, '') === documentNumber.replace(/\D/g, ''));
        if (hasDoc) {
          return { ...guest };
        }
      }
    }

    return null;
  }

  /**
   * Lista hóspedes de uma Organização com suporte a filtros avançados
   */
  async listByOrganization(organizationId: string, filters?: GuestQueryFilters): Promise<GuestProfile[]> {
    const results: GuestProfile[] = [];

    for (const guest of this.guestsMap.values()) {
      if (guest.organizationId !== organizationId) continue;

      if (filters?.classification && guest.classification !== filters.classification) {
        continue;
      }

      if (filters?.tag && !guest.tags.includes(filters.tag)) {
        continue;
      }

      if (filters?.minStays !== undefined && guest.totalStaysCount < filters.minStays) {
        continue;
      }

      if (filters?.propertyId) {
        const hasStayInProperty = guest.stayHistory.some(s => s.propertyId === filters.propertyId);
        if (!hasStayInProperty) continue;
      }

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        const matchesName = guest.fullName.toLowerCase().includes(term);
        const matchesEmail = guest.email.toLowerCase().includes(term);
        const matchesPhone = guest.phone.includes(term);
        const matchesDoc = guest.documents.some(d => d.number.includes(term));

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesDoc) {
          continue;
        }
      }

      results.push({ ...guest });
    }

    // Ordenar por última estadia ou data de atualização
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Adiciona um registro de estadia ao histórico do hóspede
   */
  async addStay(guestId: string, stay: GuestStayRecord): Promise<GuestProfile | null> {
    const guest = this.guestsMap.get(guestId);
    if (!guest) return null;

    guest.stayHistory.push(stay);
    guest.totalStaysCount = guest.stayHistory.length;
    guest.totalSpentAmount = guest.stayHistory.reduce((sum, s) => sum + s.totalSpentAmount, 0);
    guest.lastStayDate = stay.checkOutDate;
    guest.updatedAt = new Date().toISOString();

    this.guestsMap.set(guestId, guest);
    return { ...guest };
  }

  /**
   * Exclui um perfil de hóspede
   */
  async delete(guestId: string): Promise<boolean> {
    return this.guestsMap.delete(guestId);
  }
}

export const guestRepository = new GuestRepository();
