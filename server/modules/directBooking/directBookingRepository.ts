import { CommercialProposal, CreateProposalDTO, UpdateProposalDTO } from './directBookingTypes.ts';

export class DirectBookingRepository {
  private proposalsMap: Map<string, CommercialProposal> = new Map();

  constructor() {
    this.seedInitialProposals();
  }

  private seedInitialProposals() {
    const today = new Date();
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().substring(0, 10);
    };

    const initialProposals: CommercialProposal[] = [
      {
        proposalId: 'prop_001',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Carlos Eduardo Silva',
        leadEmail: 'carlos.silva@email.com',
        leadPhone: '+55 11 98888-1111',
        sourceChannel: 'whatsapp',
        categoryName: 'Suíte Deluxe Vista Mar',
        checkInDate: addDays(today, 10),
        checkOutDate: addDays(today, 13),
        numberOfNights: 3,
        guestsCount: { adults: 2, children: 1 },
        originalRateDaily: 550,
        offeredRateDaily: 495,
        totalAmount: 1485,
        discountPercent: 10,
        status: 'sent',
        validUntil: new Date(today.getTime() + 48 * 3600 * 1000).toISOString(),
        notes: 'Solicitou berço para criança de 2 anos. Cliente de primeira viagem.',
        proposalUrl: 'https://synapse.hospitality/p/prop_001',
        createdAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 12 * 3600 * 1000).toISOString(),
        attendantName: 'Juliana (Recepção)'
      },
      {
        proposalId: 'prop_002',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Mariana Fontes',
        leadEmail: 'mariana.fontes@empresa.com.br',
        leadPhone: '+55 21 97777-2222',
        sourceChannel: 'website_chat',
        categoryName: 'Apartamento Luxo',
        checkInDate: addDays(today, 15),
        checkOutDate: addDays(today, 17),
        numberOfNights: 2,
        guestsCount: { adults: 2, children: 0 },
        originalRateDaily: 420,
        offeredRateDaily: 399,
        totalAmount: 798,
        discountPercent: 5,
        status: 'negotiating',
        validUntil: new Date(today.getTime() + 24 * 3600 * 1000).toISOString(),
        notes: 'Pediu desconto para pagamento antecipado via PIX.',
        proposalUrl: 'https://synapse.hospitality/p/prop_002',
        createdAt: new Date(today.getTime() - 36 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 4 * 3600 * 1000).toISOString(),
        attendantName: 'Lucas (Vendas)'
      },
      {
        proposalId: 'prop_003',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Roberto Almeida',
        leadEmail: 'roberto.almeida@gmail.com',
        leadPhone: '+55 31 96666-3333',
        sourceChannel: 'instagram',
        categoryName: 'Suíte Master com Hidro',
        checkInDate: addDays(today, 5),
        checkOutDate: addDays(today, 7),
        numberOfNights: 2,
        guestsCount: { adults: 2, children: 0 },
        originalRateDaily: 850,
        offeredRateDaily: 850,
        totalAmount: 1700,
        discountPercent: 0,
        status: 'accepted',
        validUntil: new Date(today.getTime() - 24 * 3600 * 1000).toISOString(),
        notes: 'Proposta aceita! Reserva sincronizada no Aloha PMS.',
        proposalUrl: 'https://synapse.hospitality/p/prop_003',
        createdAt: new Date(today.getTime() - 72 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 18 * 3600 * 1000).toISOString(),
        convertedAt: new Date(today.getTime() - 18 * 3600 * 1000).toISOString(),
        convertedReservationId: 'res_aloha_88912',
        attendantName: 'Juliana (Recepção)'
      },
      {
        proposalId: 'prop_004',
        organizationId: 'org_dev_default',
        propertyId: 'prop_dev_default',
        leadName: 'Fernanda Lima',
        leadEmail: 'fernanda.lima@hotmail.com',
        sourceChannel: 'phone',
        categoryName: 'Apartamento Standard',
        checkInDate: addDays(today, 3),
        checkOutDate: addDays(today, 5),
        numberOfNights: 2,
        guestsCount: { adults: 1, children: 0 },
        originalRateDaily: 320,
        offeredRateDaily: 320,
        totalAmount: 640,
        discountPercent: 0,
        status: 'expired',
        validUntil: new Date(today.getTime() - 48 * 3600 * 1000).toISOString(),
        notes: 'Cliente não respondeu o WhatsApp de follow-up.',
        proposalUrl: 'https://synapse.hospitality/p/prop_004',
        createdAt: new Date(today.getTime() - 120 * 3600 * 1000).toISOString(),
        updatedAt: new Date(today.getTime() - 48 * 3600 * 1000).toISOString(),
        attendantName: 'Lucas (Vendas)'
      }
    ];

    for (const prop of initialProposals) {
      this.proposalsMap.set(prop.proposalId, prop);
    }
  }

  async listProposals(organizationId: string, propertyId: string): Promise<CommercialProposal[]> {
    return Array.from(this.proposalsMap.values()).filter(p =>
      p.organizationId === organizationId && p.propertyId === propertyId
    );
  }

  async getProposalById(proposalId: string, organizationId: string, propertyId: string): Promise<CommercialProposal | null> {
    const prop = this.proposalsMap.get(proposalId);
    if (!prop || prop.organizationId !== organizationId || prop.propertyId !== propertyId) {
      return null;
    }
    return prop;
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

    const newProposal: CommercialProposal = {
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
    };

    this.proposalsMap.set(id, newProposal);
    return newProposal;
  }

  async updateProposal(proposalId: string, organizationId: string, propertyId: string, dto: UpdateProposalDTO): Promise<CommercialProposal | null> {
    const prop = await this.getProposalById(proposalId, organizationId, propertyId);
    if (!prop) return null;

    const now = new Date().toISOString();
    
    if (dto.status) prop.status = dto.status;
    if (dto.notes) prop.notes = dto.notes;
    if (dto.offeredRateDaily !== undefined) {
      prop.offeredRateDaily = dto.offeredRateDaily;
      prop.totalAmount = Number((prop.offeredRateDaily * prop.numberOfNights).toFixed(2));
    }
    if (dto.discountPercent !== undefined) prop.discountPercent = dto.discountPercent;
    if (dto.validUntil) prop.validUntil = dto.validUntil;

    if (dto.status === 'accepted' && !prop.convertedAt) {
      prop.convertedAt = now;
      if (dto.convertedReservationId) prop.convertedReservationId = dto.convertedReservationId;
    }

    prop.updatedAt = now;
    this.proposalsMap.set(proposalId, prop);
    return prop;
  }
}

export const directBookingRepository = new DirectBookingRepository();
