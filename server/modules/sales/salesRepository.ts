import { 
  SalesOpportunity, 
  CreateOpportunityDTO, 
  UpdateOpportunityDTO, 
  AddInteractionDTO, 
  ScheduleFollowUpDTO,
  PipelineStage,
  LeadTemperature
} from './salesTypes.ts';

export class SalesRepository {
  private opportunitiesMap: Map<string, SalesOpportunity> = new Map();

  constructor() {
    this.seedInitialOpportunities();
  }

  private seedInitialOpportunities() {
    const today = new Date();
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().substring(0, 10);
    };

    const initialOpportunities: SalesOpportunity[] = [
      {
        opportunityId: 'opp_101',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Beatriz Vasconcelos',
        leadEmail: 'beatriz.v@empresa.com.br',
        leadPhone: '+55 11 99999-1001',
        stage: 'negotiation',
        temperature: 'hot',
        score: 85,
        source: 'whatsapp',
        estimatedValue: 2400,
        categoryInterest: 'Suíte Master',
        checkInDate: addDays(today, 12),
        checkOutDate: addDays(today, 15),
        guestsCount: { adults: 2, children: 1 },
        ownerName: 'Paula (Vendas)',
        proposalId: 'prop_001',
        nextFollowUp: {
          dueDate: addDays(today, -1), // Atrasado intencionalmente para teste
          time: '14:00',
          priority: 'high',
          ownerName: 'Paula (Vendas)',
          actionDescription: 'Enviar lembrete de validade da proposta via WhatsApp',
          completed: false
        },
        interactions: [
          {
            interactionId: 'int_001',
            type: 'whatsapp',
            summary: 'Cliente solicitou desconto para estadia de 3 noites com criança.',
            authorName: 'Paula (Vendas)',
            createdAt: new Date(today.getTime() - 48 * 3600 * 1000).toISOString()
          },
          {
            interactionId: 'int_002',
            type: 'note',
            summary: 'Proposta comercial de R$ 2.400 gerada com 10% de desconto.',
            authorName: 'Paula (Vendas)',
            createdAt: new Date(today.getTime() - 24 * 3600 * 1000).toISOString()
          }
        ],
        createdAt: new Date(today.getTime() - 72 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 24 * 3600 * 1000).toISOString()
      },
      {
        opportunityId: 'opp_102',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Grupo Evento Corporativo Tech',
        leadEmail: 'eventos@techcorp.com',
        leadPhone: '+55 21 98888-2002',
        stage: 'proposal',
        temperature: 'hot',
        score: 90,
        source: 'google',
        estimatedValue: 12500,
        categoryInterest: 'Bloqueio de 5 Apartamentos',
        checkInDate: addDays(today, 30),
        checkOutDate: addDays(today, 33),
        guestsCount: { adults: 10, children: 0 },
        ownerName: 'Lucas (Comercial)',
        nextFollowUp: {
          dueDate: addDays(today, 1),
          time: '10:00',
          priority: 'urgent',
          ownerName: 'Lucas (Comercial)',
          actionDescription: 'Reunião online para alinhar detalhes de coffee break e faturamento',
          completed: false
        },
        interactions: [
          {
            interactionId: 'int_003',
            type: 'call',
            summary: 'Primeiro contato telefônico. Cotação enviada para 10 executivos.',
            authorName: 'Lucas (Comercial)',
            createdAt: new Date(today.getTime() - 36 * 3600 * 1000).toISOString()
          }
        ],
        createdAt: new Date(today.getTime() - 48 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 36 * 3600 * 1000).toISOString()
      },
      {
        opportunityId: 'opp_103',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Marcelo Faria',
        leadEmail: 'marcelo.faria@gmail.com',
        leadPhone: '+55 31 97777-3003',
        stage: 'won',
        temperature: 'hot',
        score: 100,
        source: 'instagram',
        estimatedValue: 1700,
        categoryInterest: 'Suíte Master com Hidro',
        checkInDate: addDays(today, 5),
        checkOutDate: addDays(today, 7),
        guestsCount: { adults: 2, children: 0 },
        ownerName: 'Juliana (Recepção)',
        proposalId: 'prop_003',
        interactions: [
          {
            interactionId: 'int_004',
            type: 'whatsapp',
            summary: 'Proposta aceita pelo cliente! Reserva sincronizada no Aloha PMS.',
            authorName: 'Juliana (Recepção)',
            createdAt: new Date(today.getTime() - 18 * 3600 * 1000).toISOString()
          }
        ],
        createdAt: new Date(today.getTime() - 96 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 18 * 3600 * 1000).toISOString(),
        convertedAt: new Date(today.getTime() - 18 * 3600 * 1000).toISOString()
      },
      {
        opportunityId: 'opp_104',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Camila Rodrigues',
        leadEmail: 'camila.rodrigues@hotmail.com',
        stage: 'lead',
        temperature: 'warm',
        score: 55,
        source: 'website',
        estimatedValue: 950,
        categoryInterest: 'Apartamento Standard',
        checkInDate: addDays(today, 20),
        checkOutDate: addDays(today, 22),
        guestsCount: { adults: 2, children: 0 },
        ownerName: 'Paula (Vendas)',
        nextFollowUp: {
          dueDate: addDays(today, 0),
          time: '16:00',
          priority: 'medium',
          ownerName: 'Paula (Vendas)',
          actionDescription: 'Entrar em contato para enviar opções de datas com tarifa especial',
          completed: false
        },
        interactions: [
          {
            interactionId: 'int_005',
            type: 'email',
            summary: 'Lead capturado via formulário de contato do site oficial.',
            authorName: 'Sistema (Website)',
            createdAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString()
          }
        ],
        createdAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString()
      },
      {
        opportunityId: 'opp_105',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Gustavo Mendes',
        leadEmail: 'gustavo.mendes@yahoo.com',
        stage: 'lost',
        temperature: 'cold',
        score: 20,
        source: 'booking',
        estimatedValue: 800,
        categoryInterest: 'Apartamento Luxo',
        ownerName: 'Lucas (Comercial)',
        lossReason: 'Optou por hotel concorrente por valor de diária menor.',
        interactions: [
          {
            interactionId: 'int_006',
            type: 'note',
            summary: 'Cliente informou que reservou outro hotel.',
            authorName: 'Lucas (Comercial)',
            createdAt: new Date(today.getTime() - 60 * 3600 * 1000).toISOString()
          }
        ],
        createdAt: new Date(today.getTime() - 120 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 60 * 3600 * 1000).toISOString()
      }
    ];

    for (const opp of initialOpportunities) {
      this.opportunitiesMap.set(opp.opportunityId, opp);
    }
  }

  async listOpportunities(organizationId: string, propertyId: string): Promise<SalesOpportunity[]> {
    return Array.from(this.opportunitiesMap.values()).filter(o => 
      o.organizationId === organizationId && o.propertyId === propertyId
    );
  }

  async getOpportunityById(opportunityId: string, organizationId: string, propertyId: string): Promise<SalesOpportunity | null> {
    const opp = this.opportunitiesMap.get(opportunityId);
    if (!opp || opp.organizationId !== organizationId || opp.propertyId !== propertyId) {
      return null;
    }
    return opp;
  }

  async createOpportunity(organizationId: string, propertyId: string, dto: CreateOpportunityDTO): Promise<SalesOpportunity> {
    const id = `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const stage: PipelineStage = dto.stage || 'lead';
    const temperature: LeadTemperature = dto.temperature || (dto.estimatedValue > 2000 ? 'hot' : 'warm');
    const score = this.calculateLeadScore(temperature, dto.estimatedValue, stage);

    const newOpportunity: SalesOpportunity = {
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
    };

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
      newOpportunity.nextFollowUp = {
        dueDate: dto.nextFollowUp.dueDate,
        time: dto.nextFollowUp.time,
        priority: dto.nextFollowUp.priority || 'medium',
        ownerName: dto.ownerName || 'Equipe de Vendas',
        actionDescription: dto.nextFollowUp.actionDescription,
        completed: false
      };
    }

    this.opportunitiesMap.set(id, newOpportunity);
    return newOpportunity;
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

    this.opportunitiesMap.set(opportunityId, opp);
    return opp;
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

    this.opportunitiesMap.set(opportunityId, opp);
    return opp;
  }

  async scheduleFollowUp(opportunityId: string, organizationId: string, propertyId: string, dto: ScheduleFollowUpDTO): Promise<SalesOpportunity | null> {
    const opp = await this.getOpportunityById(opportunityId, organizationId, propertyId);
    if (!opp) return null;

    const now = new Date().toISOString();
    opp.nextFollowUp = {
      dueDate: dto.dueDate,
      time: dto.time,
      priority: dto.priority || 'medium',
      ownerName: dto.ownerName || opp.ownerName,
      actionDescription: dto.actionDescription,
      completed: false
    };

    opp.updatedAt = now;
    this.opportunitiesMap.set(opportunityId, opp);
    return opp;
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
