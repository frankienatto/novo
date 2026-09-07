import { 
  SalesOpportunity, 
  CreateOpportunityDTO, 
  UpdateOpportunityDTO, 
  AddInteractionDTO, 
  ScheduleFollowUpDTO,
  PipelineStage,
  LeadTemperature
} from './salesTypes.ts';
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

export interface ISalesRepository {
  listOpportunities(organizationId: string, propertyId: string): Promise<SalesOpportunity[]>;
  getOpportunityById(opportunityId: string, organizationId: string, propertyId: string): Promise<SalesOpportunity | null>;
  createOpportunity(organizationId: string, propertyId: string, dto: CreateOpportunityDTO): Promise<SalesOpportunity>;
  updateOpportunity(opportunityId: string, organizationId: string, propertyId: string, dto: UpdateOpportunityDTO): Promise<SalesOpportunity | null>;
  addInteraction(opportunityId: string, organizationId: string, propertyId: string, dto: AddInteractionDTO): Promise<SalesOpportunity | null>;
  scheduleFollowUp(opportunityId: string, organizationId: string, propertyId: string, dto: ScheduleFollowUpDTO): Promise<SalesOpportunity | null>;
  saveOpportunity(opportunity: SalesOpportunity): Promise<SalesOpportunity>;
  deleteOpportunity(opportunityId: string, organizationId: string, propertyId: string): Promise<boolean>;
}

export class SalesRepository implements ISalesRepository {
  private get db() {
    return getAdminFirestore();
  }

  async listOpportunities(organizationId: string, propertyId: string): Promise<SalesOpportunity[]> {
    if (!organizationId || !propertyId) return [];

    const snapshot = await this.db.collection('salesOpportunities')
      .where('organizationId', '==', organizationId)
      .where('propertyId', '==', propertyId)
      .get();

    const opportunities: SalesOpportunity[] = [];
    snapshot.forEach(doc => {
      opportunities.push(doc.data() as SalesOpportunity);
    });

    return opportunities;
  }

  async getOpportunityById(opportunityId: string, organizationId: string, propertyId: string): Promise<SalesOpportunity | null> {
    if (!opportunityId || !organizationId || !propertyId) return null;

    const docSnap = await this.db.collection('salesOpportunities').doc(opportunityId).get();
    if (!docSnap.exists) return null;

    const opp = docSnap.data() as SalesOpportunity;
    if (opp.organizationId !== organizationId || opp.propertyId !== propertyId) {
      return null;
    }

    return JSON.parse(JSON.stringify(opp));
  }

  async saveOpportunity(opportunity: SalesOpportunity): Promise<SalesOpportunity> {
    if (!opportunity.organizationId || !opportunity.propertyId || !opportunity.opportunityId) {
      throw new Error("Invalid SalesOpportunity: organizationId, propertyId and opportunityId are required.");
    }

    // Verificar se o documento já existe para garantir integridade de multi-tenancy
    const docRef = this.db.collection('salesOpportunities').doc(opportunity.opportunityId);
    const existingSnap = await docRef.get();

    if (existingSnap.exists) {
      const existingData = existingSnap.data() as SalesOpportunity;
      if (
        existingData.organizationId !== opportunity.organizationId ||
        existingData.propertyId !== opportunity.propertyId
      ) {
        throw new Error("Tenant mismatch: Cannot alter organizationId or propertyId of an existing opportunity.");
      }
    }

    const oppToSave: SalesOpportunity = cleanUndefined({
      ...opportunity,
      updatedAt: opportunity.updatedAt || new Date().toISOString(),
      createdAt: opportunity.createdAt || new Date().toISOString()
    });

    await docRef.set(oppToSave, { merge: true });
    return JSON.parse(JSON.stringify(oppToSave));
  }

  async createOpportunity(organizationId: string, propertyId: string, dto: CreateOpportunityDTO): Promise<SalesOpportunity> {
    if (!organizationId || !propertyId) {
      throw new Error("organizationId and propertyId are required to create a SalesOpportunity.");
    }

    const id = `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const stage: PipelineStage = dto.stage || 'lead';
    const temperature: LeadTemperature = dto.temperature || (dto.estimatedValue > 2000 ? 'hot' : 'warm');
    const score = this.calculateLeadScore(temperature, dto.estimatedValue, stage);

    const newOpportunity: SalesOpportunity = cleanUndefined({
      opportunityId: id,
      organizationId,
      propertyId,
      leadName: dto.leadName,
      leadEmail: dto.leadEmail,
      leadPhone: dto.leadPhone,
      stage,
      temperature,
      score,
      source: dto.source || 'website',
      estimatedValue: dto.estimatedValue,
      categoryInterest: dto.categoryInterest,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      guestsCount: {
        adults: dto.adults || 1,
        children: dto.children || 0
      },
      ownerName: dto.ownerName || 'Equipe de Vendas',
      interactions: [],
      createdAt: now,
      updatedAt: now
    });

    if (dto.notes) {
      newOpportunity.interactions.push({
        interactionId: `int_${Date.now()}_1`,
        type: 'note',
        summary: dto.notes,
        authorName: dto.ownerName || 'Equipe de Vendas',
        createdAt: now
      });
    }

    if (dto.nextFollowUp) {
      newOpportunity.nextFollowUp = cleanUndefined({
        dueDate: dto.nextFollowUp.dueDate,
        time: dto.nextFollowUp.time,
        priority: dto.nextFollowUp.priority || 'medium',
        ownerName: dto.ownerName || 'Equipe de Vendas',
        actionDescription: dto.nextFollowUp.actionDescription,
        completed: false
      });
    }

    await this.db.collection('salesOpportunities').doc(id).set(newOpportunity);
    return JSON.parse(JSON.stringify(newOpportunity));
  }

  async updateOpportunity(opportunityId: string, organizationId: string, propertyId: string, dto: UpdateOpportunityDTO): Promise<SalesOpportunity | null> {
    const opp = await this.getOpportunityById(opportunityId, organizationId, propertyId);
    if (!opp) return null;

    const now = new Date().toISOString();

    if (dto.stage) {
      opp.stage = dto.stage;
      if (dto.stage === 'won' && !opp.convertedAt) {
        opp.convertedAt = now;
        opp.temperature = 'hot';
        opp.score = 100;
      } else if (dto.stage === 'lost' || dto.stage === 'cancelled') {
        opp.temperature = 'cold';
        opp.score = 10;
      }
    }

    if (dto.temperature) {
      opp.temperature = dto.temperature;
    }

    if (dto.estimatedValue !== undefined) {
      opp.estimatedValue = dto.estimatedValue;
    }

    if (dto.ownerName) {
      opp.ownerName = dto.ownerName;
    }

    if (dto.lossReason) {
      opp.lossReason = dto.lossReason;
    }

    if (dto.proposalId) {
      opp.proposalId = dto.proposalId;
    }

    opp.score = this.calculateLeadScore(opp.temperature, opp.estimatedValue, opp.stage);
    opp.updatedAt = now;

    const cleanedOpp = cleanUndefined(opp);
    await this.db.collection('salesOpportunities').doc(opportunityId).set(cleanedOpp, { merge: true });
    return JSON.parse(JSON.stringify(cleanedOpp));
  }

  async addInteraction(opportunityId: string, organizationId: string, propertyId: string, dto: AddInteractionDTO): Promise<SalesOpportunity | null> {
    const opp = await this.getOpportunityById(opportunityId, organizationId, propertyId);
    if (!opp) return null;

    const now = new Date().toISOString();
    const interaction = {
      interactionId: `int_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      type: dto.type,
      summary: dto.summary,
      authorName: dto.authorName,
      createdAt: now
    };

    opp.interactions.push(interaction);
    opp.updatedAt = now;

    const cleanedOpp = cleanUndefined(opp);
    await this.db.collection('salesOpportunities').doc(opportunityId).set(cleanedOpp, { merge: true });
    return JSON.parse(JSON.stringify(cleanedOpp));
  }

  async scheduleFollowUp(opportunityId: string, organizationId: string, propertyId: string, dto: ScheduleFollowUpDTO): Promise<SalesOpportunity | null> {
    const opp = await this.getOpportunityById(opportunityId, organizationId, propertyId);
    if (!opp) return null;

    const now = new Date().toISOString();
    opp.nextFollowUp = cleanUndefined({
      dueDate: dto.dueDate,
      time: dto.time,
      priority: dto.priority || 'medium',
      ownerName: dto.ownerName || opp.ownerName,
      actionDescription: dto.actionDescription,
      completed: false
    });

    opp.updatedAt = now;
    const cleanedOpp = cleanUndefined(opp);
    await this.db.collection('salesOpportunities').doc(opportunityId).set(cleanedOpp, { merge: true });
    return JSON.parse(JSON.stringify(cleanedOpp));
  }

  async deleteOpportunity(opportunityId: string, organizationId: string, propertyId: string): Promise<boolean> {
    if (!opportunityId || !organizationId || !propertyId) return false;

    const docSnap = await this.db.collection('salesOpportunities').doc(opportunityId).get();
    if (!docSnap.exists) return false;

    const opp = docSnap.data() as SalesOpportunity;
    if (opp.organizationId !== organizationId || opp.propertyId !== propertyId) {
      return false;
    }

    await this.db.collection('salesOpportunities').doc(opportunityId).delete();
    return true;
  }

  private calculateLeadScore(temperature: LeadTemperature, estimatedValue: number, stage: PipelineStage): number {
    let score = 30;
    if (temperature === 'hot') score += 40;
    else if (temperature === 'warm') score += 20;

    if (estimatedValue > 5000) score += 20;
    else if (estimatedValue > 1500) score += 10;

    if (stage === 'proposal' || stage === 'negotiation') score += 10;
    if (stage === 'won') return 100;
    if (stage === 'lost' || stage === 'cancelled') return 10;

    return Math.min(100, Math.max(0, score));
  }
}

export const salesRepository = new SalesRepository();

