import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DirectBookingRepository } from './directBookingRepository.ts';
import { DirectBookingService } from './directBookingService.ts';
import { CommercialProposal, CreateProposalDTO } from './directBookingTypes.ts';

// In-memory Firestore store para ambiente de teste unitário
const mockFirestoreStore: Record<string, Record<string, any>> = {
  commercialProposals: {}
};

function createMockFirestore() {
  return {
    collection: (collectionName: string) => {
      if (!mockFirestoreStore[collectionName]) {
        mockFirestoreStore[collectionName] = {};
      }
      const col = mockFirestoreStore[collectionName];

      const makeQuery = (filters: Array<{ field: string; op: string; val: any }>) => ({
        where: (field: string, op: string, val: any) => {
          return makeQuery([...filters, { field, op, val }]);
        },
        get: async () => {
          const matches = Object.values(col).filter((item: any) => {
            return filters.every((f) => {
              if (f.op === '==') return item[f.field] === f.val;
              return true;
            });
          });
          return {
            empty: matches.length === 0,
            docs: matches.map((data) => ({
              data: () => JSON.parse(JSON.stringify(data)),
            })),
            forEach: (cb: (doc: any) => void) => {
              matches.forEach((data) => cb({ data: () => JSON.parse(JSON.stringify(data)) }));
            },
          };
        },
      });

      return {
        doc: (docId: string) => ({
          get: async () => ({
            exists: !!col[docId],
            data: () => (col[docId] ? JSON.parse(JSON.stringify(col[docId])) : undefined),
          }),
          set: async (data: any, options?: { merge?: boolean }) => {
            if (options?.merge && col[docId]) {
              col[docId] = JSON.parse(JSON.stringify({ ...col[docId], ...data }));
            } else {
              col[docId] = JSON.parse(JSON.stringify({ ...data }));
            }
          },
          delete: async () => {
            delete col[docId];
          }
        }),
        get: async () => ({
          docs: Object.values(col).map((data) => ({
            data: () => JSON.parse(JSON.stringify(data)),
          })),
          forEach: (cb: (doc: any) => void) => {
            Object.values(col).forEach((data) => cb({ data: () => JSON.parse(JSON.stringify(data)) }));
          },
        }),
        where: (field: string, op: string, val: any) => {
          return makeQuery([{ field, op, val }]);
        },
      };
    },
  };
}

vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => createMockFirestore(),
}));

describe('DirectBookingRepository — Firestore Persistence & Multi-Tenancy', () => {
  let repository: DirectBookingRepository;
  const tenantA = 'org_booking_test_a';
  const propA = 'prop_booking_test_a';
  const tenantB = 'org_booking_test_b';
  const propB = 'prop_booking_test_b';

  beforeEach(() => {
    repository = new DirectBookingRepository();
  });

  // 1. Criação de proposta comercial
  it('1. deve criar uma proposta comercial com sucesso (createProposal)', async () => {
    const dto: CreateProposalDTO = {
      leadName: 'Beatriz Vasconcelos',
      leadEmail: 'beatriz.v@gmail.com',
      leadPhone: '+55 11 97654-3210',
      sourceChannel: 'whatsapp',
      categoryName: 'Bangalô Praia Premium',
      checkInDate: '2026-11-10',
      checkOutDate: '2026-11-15',
      adults: 2,
      children: 1,
      offeredRateDaily: 720,
      discountPercent: 10,
      validDays: 4,
      notes: 'Solicitou quarto silencioso e late check-out.',
      attendantName: 'Juliana (Comercial)'
    };

    const created = await repository.createProposal(tenantA, propA, dto);

    expect(created).toBeDefined();
    expect(created.proposalId).toMatch(/^prop_/);
    expect(created.organizationId).toBe(tenantA);
    expect(created.propertyId).toBe(propA);
    expect(created.leadName).toBe('Beatriz Vasconcelos');
    expect(created.leadEmail).toBe('beatriz.v@gmail.com');
    expect(created.numberOfNights).toBe(5);
    expect(created.offeredRateDaily).toBe(720);
    expect(created.totalAmount).toBe(3600); // 720 * 5
    expect(created.status).toBe('sent');
    expect(created.proposalUrl).toContain(created.proposalId);
    expect(created.notes).toBe('Solicitou quarto silencioso e late check-out.');
    expect(created.attendantName).toBe('Juliana (Comercial)');
  });

  // 2. Recuperação de proposta por ID
  it('2. deve recuperar uma proposta por ID com sucesso (getProposalById)', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Leonardo Rossi',
      leadEmail: 'leo.rossi@outlook.com',
      categoryName: 'Suíte Luxo',
      checkInDate: '2026-12-01',
      checkOutDate: '2026-12-04',
      offeredRateDaily: 500
    });

    const fetched = await repository.getProposalById(created.proposalId, tenantA, propA);
    expect(fetched).toBeDefined();
    expect(fetched?.proposalId).toBe(created.proposalId);
    expect(fetched?.leadName).toBe('Leonardo Rossi');
    expect(fetched?.totalAmount).toBe(1500); // 500 * 3 noites
  });

  // 3. Atualização de proposta
  it('3. deve atualizar status e dados da proposta comercial (updateProposal)', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Gabriela Meireles',
      leadEmail: 'gabi.m@uol.com.br',
      categoryName: 'Apartamento Standard',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-12',
      offeredRateDaily: 350
    });

    const updated = await repository.updateProposal(created.proposalId, tenantA, propA, {
      status: 'negotiating',
      offeredRateDaily: 320,
      notes: 'Contraproposta enviada com 320/noite'
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('negotiating');
    expect(updated?.offeredRateDaily).toBe(320);
    expect(updated?.totalAmount).toBe(640); // 320 * 2
    expect(updated?.notes).toBe('Contraproposta enviada com 320/noite');

    const persisted = await repository.getProposalById(created.proposalId, tenantA, propA);
    expect(persisted?.status).toBe('negotiating');
    expect(persisted?.totalAmount).toBe(640);
  });

  // 4. Exclusão de proposta
  it('4. deve excluir uma proposta comercial com sucesso (deleteProposal)', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Marcio Fontes',
      leadEmail: 'marcio@teste.com',
      categoryName: 'Suíte Master',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      offeredRateDaily: 450
    });

    const deleted = await repository.deleteProposal(created.proposalId, tenantA, propA);
    expect(deleted).toBe(true);

    const check = await repository.getProposalById(created.proposalId, tenantA, propA);
    expect(check).toBeNull();
  });

  // 5. Listagem de propostas
  it('5. deve listar todas as propostas do tenant (listProposals)', async () => {
    const initialList = await repository.listProposals(tenantA, propA);

    await repository.createProposal(tenantA, propA, {
      leadName: 'Camila Guimarães',
      leadEmail: 'camila.g@empresa.com',
      categoryName: 'Chalé Romântico',
      checkInDate: '2026-09-20',
      checkOutDate: '2026-09-22',
      offeredRateDaily: 600
    });

    const listAfter = await repository.listProposals(tenantA, propA);
    expect(listAfter.length).toBe(initialList.length + 1);
    expect(listAfter.some(p => p.leadName === 'Camila Guimarães')).toBe(true);
  });

  // 6. Filtros existentes por status (via listProposals/DirectBookingService)
  it('6. deve permitir filtrar propostas pelo status comercial', async () => {
    const service = new DirectBookingService(repository);

    const propDraft = await repository.createProposal(tenantA, propA, {
      leadName: 'Filtro Draft Lead',
      leadEmail: 'draft@test.com',
      categoryName: 'Suíte',
      checkInDate: '2026-10-05',
      checkOutDate: '2026-10-07',
      offeredRateDaily: 400
    });
    await repository.updateProposal(propDraft.proposalId, tenantA, propA, { status: 'draft' });

    const propSent = await repository.createProposal(tenantA, propA, {
      leadName: 'Filtro Sent Lead',
      leadEmail: 'sent@test.com',
      categoryName: 'Suíte',
      checkInDate: '2026-10-05',
      checkOutDate: '2026-10-07',
      offeredRateDaily: 400
    });

    const drafts = await service.listProposals(tenantA, propA, 'draft');
    expect(drafts.some(p => p.proposalId === propDraft.proposalId)).toBe(true);
    expect(drafts.some(p => p.proposalId === propSent.proposalId)).toBe(false);

    const sent = await service.listProposals(tenantA, propA, 'sent');
    expect(sent.some(p => p.proposalId === propSent.proposalId)).toBe(true);
  });

  // 7. Status e Ciclo de Conversão (accepted + convertedReservationId + convertedAt)
  it('7. deve registrar conversão com convertedAt e convertedReservationId ao aceitar proposta', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Renato Siqueira',
      leadEmail: 'renato@siqueira.adv.br',
      categoryName: 'Suíte Presidencial',
      checkInDate: '2026-11-01',
      checkOutDate: '2026-11-05',
      offeredRateDaily: 1100
    });

    expect(created.status).toBe('sent');
    expect(created.convertedAt).toBeUndefined();

    const accepted = await repository.updateProposal(created.proposalId, tenantA, propA, {
      status: 'accepted',
      convertedReservationId: 'res_aloha_99412'
    });

    expect(accepted?.status).toBe('accepted');
    expect(accepted?.convertedAt).toBeDefined();
    expect(accepted?.convertedReservationId).toBe('res_aloha_99412');
  });

  // 8. Precisão de Valores Monetários e Descontos
  it('8. deve calcular e preservar com precisão tarifas, descontos e totalAmount', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Danilo Pacheco',
      leadEmail: 'danilo@pacheco.com',
      categoryName: 'Apartamento Duplo',
      checkInDate: '2026-08-20',
      checkOutDate: '2026-08-23', // 3 noites
      offeredRateDaily: 270,
      discountPercent: 10
    });

    // 270 / (1 - 0.10) = 300 original
    expect(created.offeredRateDaily).toBe(270);
    expect(created.originalRateDaily).toBe(300);
    expect(created.totalAmount).toBe(810); // 270 * 3
    expect(created.discountPercent).toBe(10);
  });

  // 9. Datas e Cálculo de Noites
  it('9. deve calcular corretamente número de noites a partir de checkInDate e checkOutDate', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Larissa Manoela',
      leadEmail: 'larissa@viagem.com',
      categoryName: 'Suíte Jardim',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-17', // 7 noites
      offeredRateDaily: 450,
      validDays: 5
    });

    expect(created.numberOfNights).toBe(7);
    expect(created.totalAmount).toBe(3150); // 450 * 7
    expect(created.validUntil).toBeDefined();
    const validDate = new Date(created.validUntil);
    expect(validDate.getTime()).toBeGreaterThan(Date.now());
  });

  // 10. Preservação de Campos Opcionais
  it('10. deve preservar todos os campos opcionais (telefone, canal, hóspedes, notas, atendente)', async () => {
    const created = await repository.createProposal(tenantA, propA, {
      leadName: 'Vanessa Castro',
      leadEmail: 'vanessa@castro.net',
      leadPhone: '+55 21 99999-8888',
      sourceChannel: 'instagram',
      categoryName: 'Suíte Mar Aberto',
      checkInDate: '2026-09-01',
      checkOutDate: '2026-09-03',
      adults: 3,
      children: 2,
      offeredRateDaily: 890,
      notes: 'Aniversário de casamento',
      attendantName: 'Matheus (Concierge)'
    });

    const retrieved = await repository.getProposalById(created.proposalId, tenantA, propA);
    expect(retrieved?.leadPhone).toBe('+55 21 99999-8888');
    expect(retrieved?.sourceChannel).toBe('instagram');
    expect(retrieved?.guestsCount.adults).toBe(3);
    expect(retrieved?.guestsCount.children).toBe(2);
    expect(retrieved?.notes).toBe('Aniversário de casamento');
    expect(retrieved?.attendantName).toBe('Matheus (Concierge)');
  });

  // 11. Multi-Tenant: Tenant A não acessa proposta do Tenant B
  it('11. Tenant A não deve acessar proposta cadastrada no Tenant B', async () => {
    const propBProposal = await repository.createProposal(tenantB, propB, {
      leadName: 'Hóspede Privado B',
      leadEmail: 'b@secret.com',
      categoryName: 'Suíte B',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      offeredRateDaily: 500
    });

    const leakAttempt = await repository.getProposalById(propBProposal.proposalId, tenantA, propA);
    expect(leakAttempt).toBeNull();
  });

  // 12. Multi-Tenant: Tenant A não lista propostas do Tenant B
  it('12. Tenant A não deve listar propostas cadastradas no Tenant B', async () => {
    const listABefore = await repository.listProposals(tenantA, propA);

    await repository.createProposal(tenantB, propB, {
      leadName: 'Outro Lead B',
      leadEmail: 'outro@tenantb.com',
      categoryName: 'Suíte B2',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-12',
      offeredRateDaily: 750
    });

    const listAAfter = await repository.listProposals(tenantA, propA);
    expect(listAAfter.length).toBe(listABefore.length);
    expect(listAAfter.some(p => p.leadName === 'Outro Lead B')).toBe(false);
  });

  // 13. Multi-Tenant: Bloqueio de adulteração de organizationId
  it('13. deve bloquear tentativa de adulteração de organizationId em proposta existente (saveProposal)', async () => {
    const original = await repository.createProposal(tenantA, propA, {
      leadName: 'Imutabilidade Org Test',
      leadEmail: 'org@test.com',
      categoryName: 'Suíte Standard',
      checkInDate: '2026-09-01',
      checkOutDate: '2026-09-03',
      offeredRateDaily: 300
    });

    const tampered: CommercialProposal = {
      ...original,
      organizationId: 'org_hacker_hijack'
    };

    await expect(repository.saveProposal(tampered)).rejects.toThrow(
      /Tenant mismatch: Cannot alter organizationId or propertyId/
    );
  });

  // 14. Multi-Tenant: Bloqueio de adulteração de propertyId
  it('14. deve bloquear tentativa de adulteração de propertyId em proposta existente (saveProposal)', async () => {
    const original = await repository.createProposal(tenantA, propA, {
      leadName: 'Imutabilidade Prop Test',
      leadEmail: 'prop@test.com',
      categoryName: 'Suíte Standard',
      checkInDate: '2026-09-01',
      checkOutDate: '2026-09-03',
      offeredRateDaily: 300
    });

    const tampered: CommercialProposal = {
      ...original,
      propertyId: 'prop_unauthorized_property'
    };

    await expect(repository.saveProposal(tampered)).rejects.toThrow(
      /Tenant mismatch: Cannot alter organizationId or propertyId/
    );
  });

  // 15. Comportamento para entidades inexistentes
  it('15. deve retornar null/false para IDs e operações com entidades inexistentes', async () => {
    const notFound = await repository.getProposalById('prop_non_existent_404', tenantA, propA);
    expect(notFound).toBeNull();

    const deleteNonExistent = await repository.deleteProposal('prop_non_existent_404', tenantA, propA);
    expect(deleteNonExistent).toBe(false);

    const updateNonExistent = await repository.updateProposal('prop_non_existent_404', tenantA, propA, {
      status: 'accepted'
    });
    expect(updateNonExistent).toBeNull();
  });

  // 16. PERSISTÊNCIA REAL APÓS DESTRUIÇÃO E RECRIAÇÃO DA INSTÂNCIA
  it('16. [PERSISTÊNCIA REAL] deve persistir proposta no Firestore e recuperá-la após destruição da instância do repositório', async () => {
    // 1. Instanciar repositório inicial
    let repoInstance1: DirectBookingRepository | null = new DirectBookingRepository();

    // 2. Criar proposta comercial
    const createdProposal = await repoInstance1.createProposal(tenantA, propA, {
      leadName: 'Durable Persistence Guest',
      leadEmail: 'durable.guest@firestore.org',
      leadPhone: '+55 11 93333-4444',
      sourceChannel: 'website_chat',
      categoryName: 'Bangalô Vista Panorâmica',
      checkInDate: '2026-11-20',
      checkOutDate: '2026-11-25', // 5 noites
      adults: 2,
      children: 1,
      offeredRateDaily: 950,
      discountPercent: 5,
      attendantName: 'Juliana (Recepção)',
      notes: 'Testando sobrevivência e persistência real no Firestore'
    });

    expect(createdProposal).toBeDefined();
    expect(createdProposal.proposalId).toBeDefined();

    // 3. Destruir referência em memória
    repoInstance1 = null;

    // 4. Criar nova instância do repositório
    const repoInstance2 = new DirectBookingRepository();

    // 5. Recuperar a proposta pela nova instância
    const retrieved = await repoInstance2.getProposalById(createdProposal.proposalId, tenantA, propA);

    // 6. Confirmar persistência real
    expect(retrieved).not.toBeNull();
    expect(retrieved?.proposalId).toBe(createdProposal.proposalId);
    expect(retrieved?.leadName).toBe('Durable Persistence Guest');
    expect(retrieved?.leadEmail).toBe('durable.guest@firestore.org');
    expect(retrieved?.leadPhone).toBe('+55 11 93333-4444');
    expect(retrieved?.numberOfNights).toBe(5);
    expect(retrieved?.offeredRateDaily).toBe(950);
    expect(retrieved?.totalAmount).toBe(4750); // 950 * 5
    expect(retrieved?.categoryName).toBe('Bangalô Vista Panorâmica');
    expect(retrieved?.notes).toBe('Testando sobrevivência e persistência real no Firestore');
    expect(retrieved?.attendantName).toBe('Juliana (Recepção)');
  });

  // 17. Regressão com DirectBookingService, Dashboard, Métricas e Resumo para IA
  it('17. deve integrar perfeitamente com DirectBookingService para cálculo de KPIs, Dashboard e Resumo IA', async () => {
    const service = new DirectBookingService(repository);

    // Criar proposta 1 (aberta)
    const p1 = await service.createProposal(tenantA, propA, {
      leadName: 'Lead Funil 1',
      leadEmail: 'funil1@test.com',
      sourceChannel: 'whatsapp',
      categoryName: 'Suíte Deluxe',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-13',
      offeredRateDaily: 500,
      attendantName: 'Lucas (Vendas)'
    });

    // Criar proposta 2 (aceita)
    const p2 = await service.createProposal(tenantA, propA, {
      leadName: 'Lead Funil 2',
      leadEmail: 'funil2@test.com',
      sourceChannel: 'website_chat',
      categoryName: 'Apartamento Luxo',
      checkInDate: '2026-09-15',
      checkOutDate: '2026-09-17',
      offeredRateDaily: 400,
      attendantName: 'Lucas (Vendas)'
    });
    await service.updateProposal(p2.proposalId, tenantA, propA, {
      status: 'accepted',
      convertedReservationId: 'res_sync_001'
    });

    // 1. Dashboard
    const dashboard = await service.getDashboard(tenantA, propA);
    expect(dashboard).toBeDefined();
    expect(dashboard.summary.totalProposals).toBeGreaterThanOrEqual(2);
    expect(dashboard.summary.convertedProposalsCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.summary.totalConvertedRevenue).toBeGreaterThanOrEqual(800); // 400 * 2
    expect(dashboard.recentProposals.some(p => p.proposalId === p1.proposalId)).toBe(true);

    // 2. Métricas
    const metrics = await service.getMetrics(tenantA, propA);
    expect(metrics.conversionByChannel['website_chat']).toBeDefined();
    expect(metrics.conversionByAttendant['Lucas (Vendas)']).toBeDefined();

    // 3. Resumo para IA
    const aiSummary = await service.getDirectBookingSummaryForAI(tenantA, propA);
    expect(aiSummary).toBeDefined();
    expect(aiSummary.convertedProposalsCount).toBeGreaterThanOrEqual(1);
    expect(aiSummary.totalConvertedRevenue).toBeGreaterThanOrEqual(800);
    expect(aiSummary.topLeadSource).toBeDefined();
  });
});
