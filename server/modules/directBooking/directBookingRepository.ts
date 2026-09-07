import { CommercialProposal, CreateProposalDTO, UpdateProposalDTO } from './directBookingTypes.ts';
import { getAdminFirestore } from '../../config/firebaseAdmin.ts';

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanUndefined(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

export interface IDirectBookingRepository {
  listProposals(organizationId: string, propertyId: string): Promise<CommercialProposal[]>;
  getProposalById(proposalId: string, organizationId: string, propertyId: string): Promise<CommercialProposal | null>;
  createProposal(organizationId: string, propertyId: string, dto: CreateProposalDTO): Promise<CommercialProposal>;
  updateProposal(proposalId: string, organizationId: string, propertyId: string, dto: UpdateProposalDTO): Promise<CommercialProposal | null>;
  saveProposal(proposal: CommercialProposal): Promise<CommercialProposal>;
  deleteProposal(proposalId: string, organizationId: string, propertyId: string): Promise<boolean>;
}

export class DirectBookingRepository implements IDirectBookingRepository {
  private get db() {
    return getAdminFirestore();
  }

  async listProposals(organizationId: string, propertyId: string): Promise<CommercialProposal[]> {
    const snapshot = await this.db
      .collection('commercialProposals')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    const proposals: CommercialProposal[] = [];
    snapshot.forEach(doc => {
      proposals.push(doc.data() as CommercialProposal);
    });

    return proposals;
  }

  async getProposalById(proposalId: string, organizationId: string, propertyId: string): Promise<CommercialProposal | null> {
    const docRef = this.db.collection('commercialProposals').doc(proposalId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as CommercialProposal;
    if (data.organizationId !== organizationId || data.propertyId !== propertyId) {
      return null;
    }

    return data;
  }

  async createProposal(organizationId: string, propertyId: string, dto: CreateProposalDTO): Promise<CommercialProposal> {
    const id = `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    // Calcula número de noites
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const numberOfNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const adults = dto.adults || 1;
    const children = dto.children || 0;
    const discountPercent = dto.discountPercent || 0;
    const offeredRateDaily = dto.offeredRateDaily;
    const originalRateDaily = discountPercent > 0 ? Number((offeredRateDaily / (1 - discountPercent / 100)).toFixed(2)) : offeredRateDaily;
    const totalAmount = Number((offeredRateDaily * numberOfNights).toFixed(2));

    const validDays = dto.validDays || 3; // Padrão 3 dias de validade
    const validUntil = new Date(now.getTime() + validDays * 24 * 3600 * 1000).toISOString();

    const newProposal: CommercialProposal = cleanUndefined({
      proposalId: id,
      organizationId,
      propertyId,
      leadName: dto.leadName,
      leadEmail: dto.leadEmail,
      leadPhone: dto.leadPhone,
      sourceChannel: dto.sourceChannel || 'whatsapp',
      categoryName: dto.categoryName,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      numberOfNights,
      guestsCount: { adults, children },
      originalRateDaily,
      offeredRateDaily,
      totalAmount,
      discountPercent,
      status: 'sent',
      validUntil,
      notes: dto.notes,
      proposalUrl: `https://synapse.hospitality/p/${id}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      attendantName: dto.attendantName || 'Equipe Comercial'
    });

    await this.db.collection('commercialProposals').doc(id).set(newProposal);
    return JSON.parse(JSON.stringify(newProposal));
  }

  async updateProposal(proposalId: string, organizationId: string, propertyId: string, dto: UpdateProposalDTO): Promise<CommercialProposal | null> {
    const prop = await this.getProposalById(proposalId, organizationId, propertyId);
    if (!prop) return null;

    const now = new Date().toISOString();

    if (dto.status) prop.status = dto.status;
    if (dto.notes !== undefined) prop.notes = dto.notes;
    if (dto.offeredRateDaily !== undefined) {
      prop.offeredRateDaily = dto.offeredRateDaily;
      prop.totalAmount = Number((prop.offeredRateDaily * prop.numberOfNights).toFixed(2));
    }
    if (dto.discountPercent !== undefined) prop.discountPercent = dto.discountPercent;
    if (dto.validUntil !== undefined) prop.validUntil = dto.validUntil;

    if (dto.status === 'accepted' && !prop.convertedAt) {
      prop.convertedAt = now;
      if (dto.convertedReservationId) prop.convertedReservationId = dto.convertedReservationId;
    }

    prop.updatedAt = now;
    const cleaned = cleanUndefined(prop);
    await this.db.collection('commercialProposals').doc(proposalId).set(cleaned, { merge: true });
    return JSON.parse(JSON.stringify(cleaned));
  }

  async saveProposal(proposal: CommercialProposal): Promise<CommercialProposal> {
    const docRef = this.db.collection('commercialProposals').doc(proposal.proposalId);
    const existing = await docRef.get();

    if (existing.exists) {
      const data = existing.data() as CommercialProposal;
      if (data.organizationId !== proposal.organizationId || data.propertyId !== proposal.propertyId) {
        throw new Error('Tenant mismatch: Cannot alter organizationId or propertyId of existing proposal.');
      }
    }

    const propToSave: CommercialProposal = cleanUndefined({
      ...proposal,
      updatedAt: proposal.updatedAt || new Date().toISOString(),
      createdAt: proposal.createdAt || new Date().toISOString()
    });

    await docRef.set(propToSave, { merge: true });
    return JSON.parse(JSON.stringify(propToSave));
  }

  async deleteProposal(proposalId: string, organizationId: string, propertyId: string): Promise<boolean> {
    const prop = await this.getProposalById(proposalId, organizationId, propertyId);
    if (!prop) return false;

    await this.db.collection('commercialProposals').doc(proposalId).delete();
    return true;
  }
}

export const directBookingRepository = new DirectBookingRepository();

