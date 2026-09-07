import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SalesRepository } from './salesRepository.ts';
import { SalesService } from './salesService.ts';
import { SalesOpportunity, CreateOpportunityDTO } from './salesTypes.ts';

// In-memory Firestore store para ambiente de teste unitário
const mockFirestoreStore: Record<string, Record<string, any>> = {
  salesOpportunities: {}
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

describe('SalesRepository — Firestore Persistence & Multi-Tenancy', () => {
  let repository: SalesRepository;
  const tenantA = 'org_sales_test_a';
  const propA = 'prop_sales_test_a';
  const tenantB = 'org_sales_test_b';
  const propB = 'prop_sales_test_b';

  beforeEach(() => {
    repository = new SalesRepository();
  });

  // 1. Criação de oportunidade
  it('1. deve criar uma oportunidade de venda com sucesso (createOpportunity)', async () => {
    const dto: CreateOpportunityDTO = {
      leadName: 'Arthur Dent',
      leadEmail: 'arthur.dent@galaxy.com',
      leadPhone: '+55 11 98765-4321',
      stage: 'lead',
      temperature: 'warm',
      source: 'website',
      estimatedValue: 3500,
      categoryInterest: 'Suíte Presidencial',
      ownerName: 'Paula (Vendas)',
      notes: 'Primeiro contato via chat do site',
      nextFollowUp: {
        dueDate: '2026-09-01',
        time: '14:00',
        priority: 'high',
        actionDescription: 'Enviar proposta comercial'
      }
    };

    const created = await repository.createOpportunity(tenantA, propA, dto);

    expect(created).toBeDefined();
    expect(created.opportunityId).toMatch(/^opp_/);
    expect(created.organizationId).toBe(tenantA);
    expect(created.propertyId).toBe(propA);
    expect(created.leadName).toBe('Arthur Dent');
    expect(created.leadEmail).toBe('arthur.dent@galaxy.com');
    expect(created.estimatedValue).toBe(3500);
    expect(created.stage).toBe('lead');
    expect(created.temperature).toBe('warm');
    expect(created.interactions.length).toBe(1);
    expect(created.interactions[0].summary).toBe('Primeiro contato via chat do site');
    expect(created.nextFollowUp?.actionDescription).toBe('Enviar proposta comercial');
  });

  // 2. Recuperação por ID
  it('2. deve recuperar uma oportunidade por ID com sucesso (getOpportunityById)', async () => {
    const created = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Ford Prefect',
      leadEmail: 'ford@guide.com',
      estimatedValue: 1800,
      stage: 'inquiry'
    });

    const found = await repository.getOpportunityById(created.opportunityId, tenantA, propA);
    expect(found).toBeDefined();
    expect(found?.opportunityId).toBe(created.opportunityId);
    expect(found?.leadName).toBe('Ford Prefect');
    expect(found?.estimatedValue).toBe(1800);
  });

  // 3. Atualização de oportunidade
  it('3. deve atualizar dados e estágio de uma oportunidade (updateOpportunity)', async () => {
    const created = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Tricia McMillan',
      leadEmail: 'trillian@earth.com',
      estimatedValue: 4200,
      stage: 'proposal',
      temperature: 'warm'
    });

    const updated = await repository.updateOpportunity(created.opportunityId, tenantA, propA, {
      stage: 'negotiation',
      temperature: 'hot',
      estimatedValue: 4500,
      ownerName: 'Lucas (Comercial)'
    });

    expect(updated).toBeDefined();
    expect(updated?.stage).toBe('negotiation');
    expect(updated?.temperature).toBe('hot');
    expect(updated?.estimatedValue).toBe(4500);
    expect(updated?.ownerName).toBe('Lucas (Comercial)');

    // Verificar se no banco realmente atualizou
    const persisted = await repository.getOpportunityById(created.opportunityId, tenantA, propA);
    expect(persisted?.stage).toBe('negotiation');
    expect(persisted?.temperature).toBe('hot');
  });

  // 4. Exclusão de oportunidade
  it('4. deve excluir uma oportunidade com sucesso (deleteOpportunity)', async () => {
    const created = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Zaphod Beeblebrox',
      leadEmail: 'president@galaxy.gov',
      estimatedValue: 15000
    });

    const deleted = await repository.deleteOpportunity(created.opportunityId, tenantA, propA);
    expect(deleted).toBe(true);

    const check = await repository.getOpportunityById(created.opportunityId, tenantA, propA);
    expect(check).toBeNull();
  });

  // 5. Listagem de oportunidades
  it('5. deve listar todas as oportunidades do tenant (listOpportunities)', async () => {
    const listBefore = await repository.listOpportunities(tenantA, propA);

    await repository.createOpportunity(tenantA, propA, {
      leadName: 'Marvin Android',
      leadEmail: 'marvin@sirius.com',
      estimatedValue: 1200
    });

    const listAfter = await repository.listOpportunities(tenantA, propA);
    expect(listAfter.length).toBe(listBefore.length + 1);
    expect(listAfter.some(o => o.leadName === 'Marvin Android')).toBe(true);
  });

  // 6. Filtros e campos existentes
  it('6. deve preservar campos de categoria, origem e datas de check-in/out', async () => {
    const created = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Slartibartfast',
      leadEmail: 'slarti@magrathea.com',
      estimatedValue: 8000,
      categoryInterest: 'Suíte Fiordes',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-07',
      adults: 2,
      children: 1,
      source: 'instagram'
    });

    const retrieved = await repository.getOpportunityById(created.opportunityId, tenantA, propA);
    expect(retrieved?.categoryInterest).toBe('Suíte Fiordes');
    expect(retrieved?.checkInDate).toBe('2026-10-01');
    expect(retrieved?.checkOutDate).toBe('2026-10-07');
    expect(retrieved?.guestsCount?.adults).toBe(2);
    expect(retrieved?.guestsCount?.children).toBe(1);
    expect(retrieved?.source).toBe('instagram');
  });

  // 7. Ciclo de Estágio do Pipeline (lead -> negotiation -> won)
  it('7. deve gerenciar transição de estágios até o fechamento Ganho (won)', async () => {
    const created = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Eddie Computer',
      leadEmail: 'eddie@heartofgold.com',
      estimatedValue: 5000,
      stage: 'lead'
    });

    expect(created.stage).toBe('lead');
    expect(created.convertedAt).toBeUndefined();

    const won = await repository.updateOpportunity(created.opportunityId, tenantA, propA, {
      stage: 'won',
      proposalId: 'prop_hgold_01'
    });

    expect(won?.stage).toBe('won');
    expect(won?.proposalId).toBe('prop_hgold_01');
    expect(won?.convertedAt).toBeDefined();
    expect(won?.temperature).toBe('hot');
    expect(won?.score).toBe(100);
  });

  // 8. Cálculo de Lead Score e Temperatura
  it('8. deve calcular Lead Score e atualizar temperatura adequadamente', async () => {
    const oppHot = await repository.createOpportunity(tenantA, propA, {
      leadName: 'High Value Lead',
      leadEmail: 'rich@galaxy.com',
      estimatedValue: 6000,
      stage: 'proposal',
      temperature: 'hot'
    });

    expect(oppHot.temperature).toBe('hot');
    expect(oppHot.score).toBeGreaterThanOrEqual(80);

    const lostOpp = await repository.updateOpportunity(oppHot.opportunityId, tenantA, propA, {
      stage: 'lost',
      lossReason: 'Preço elevado'
    });

    expect(lostOpp?.temperature).toBe('cold');
    expect(lostOpp?.lossReason).toBe('Preço elevado');
    expect(lostOpp?.score).toBe(10);
  });

  // 9. Atribuição de Responsável (Owner)
  it('9. deve permitir definir e alterar o responsável comercial pela oportunidade', async () => {
    const opp = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Deep Thought',
      leadEmail: 'deep@thought.org',
      estimatedValue: 42000,
      ownerName: 'Vendedora Alice'
    });

    expect(opp.ownerName).toBe('Vendedora Alice');

    const updated = await repository.updateOpportunity(opp.opportunityId, tenantA, propA, {
      ownerName: 'Vendedor Bob'
    });

    expect(updated?.ownerName).toBe('Vendedor Bob');
  });

  // 10. Valores e gravação via saveOpportunity
  it('10. deve salvar diretamente uma oportunidade completa via saveOpportunity', async () => {
    const opp: SalesOpportunity = {
      opportunityId: `opp_direct_${Date.now()}`,
      organizationId: tenantA,
      propertyId: propA,
      leadName: 'Agrajag',
      leadEmail: 'agrajag@reincarnation.com',
      stage: 'opportunity',
      temperature: 'warm',
      score: 65,
      source: 'booking',
      estimatedValue: 2750,
      ownerName: 'Equipe de Vendas',
      interactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await repository.saveOpportunity(opp);
    expect(saved.opportunityId).toBe(opp.opportunityId);
    expect(saved.estimatedValue).toBe(2750);

    const fetched = await repository.getOpportunityById(opp.opportunityId, tenantA, propA);
    expect(fetched?.leadName).toBe('Agrajag');
    expect(fetched?.estimatedValue).toBe(2750);
  });

  // 11. Multi-Tenant: Tenant A não acessa oportunidade do Tenant B
  it('11. Tenant A não deve acessar oportunidade pertencente ao Tenant B', async () => {
    const oppB = await repository.createOpportunity(tenantB, propB, {
      leadName: 'Secret Lead Tenant B',
      leadEmail: 'secret@tenantb.com',
      estimatedValue: 9900
    });

    // Tenant A tenta consultar oportunidade do Tenant B
    const leakAttempt = await repository.getOpportunityById(oppB.opportunityId, tenantA, propA);
    expect(leakAttempt).toBeNull();
  });

  // 12. Multi-Tenant: Tenant A não lista oportunidades do Tenant B
  it('12. Tenant A não deve listar oportunidades cadastradas no Tenant B', async () => {
    const initialListA = await repository.listOpportunities(tenantA, propA);

    await repository.createOpportunity(tenantB, propB, {
      leadName: 'Exclusive Lead B',
      leadEmail: 'b@exclusive.com',
      estimatedValue: 12000
    });

    const listAAfter = await repository.listOpportunities(tenantA, propA);
    expect(listAAfter.length).toBe(initialListA.length);
    expect(listAAfter.some(o => o.leadName === 'Exclusive Lead B')).toBe(false);
  });

  // 13. Multi-Tenant: Bloqueio de alteração de organizationId
  it('13. deve bloquear tentativa de adulteração de organizationId em oportunidade existente', async () => {
    const original = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Immutability Test Org',
      leadEmail: 'immut@test.com',
      estimatedValue: 3000
    });

    const tampered: SalesOpportunity = {
      ...original,
      organizationId: 'org_attacker_hijack'
    };

    await expect(repository.saveOpportunity(tampered)).rejects.toThrow(
      /Tenant mismatch: Cannot alter organizationId or propertyId/
    );
  });

  // 14. Multi-Tenant: Bloqueio de alteração de propertyId
  it('14. deve bloquear tentativa de adulteração de propertyId em oportunidade existente', async () => {
    const original = await repository.createOpportunity(tenantA, propA, {
      leadName: 'Immutability Test Prop',
      leadEmail: 'immutprop@test.com',
      estimatedValue: 3200
    });

    const tampered: SalesOpportunity = {
      ...original,
      propertyId: 'prop_unauthorized_hijack'
    };

    await expect(repository.saveOpportunity(tampered)).rejects.toThrow(
      /Tenant mismatch: Cannot alter organizationId or propertyId/
    );
  });

  // 15. Entidades Inexistentes
  it('15. deve retornar null/false para IDs e operações com entidades inexistentes', async () => {
    const notFound = await repository.getOpportunityById('opp_non_existent_999', tenantA, propA);
    expect(notFound).toBeNull();

    const deleteNonExistent = await repository.deleteOpportunity('opp_non_existent_999', tenantA, propA);
    expect(deleteNonExistent).toBe(false);

    const updateNonExistent = await repository.updateOpportunity('opp_non_existent_999', tenantA, propA, {
      stage: 'won'
    });
    expect(updateNonExistent).toBeNull();
  });

  // 16. PERSISTÊNCIA REAL APÓS DESTRUIÇÃO E RECRIAÇÃO DA INSTÂNCIA
  it('16. [PERSISTÊNCIA REAL] deve persistir oportunidade no Firestore e recuperá-la após destruição da instância do repositório', async () => {
    // 1. Instanciar repositório inicial
    let repoInstance1: SalesRepository | null = new SalesRepository();

    // 2. Criar oportunidade
    const createdOpp = await repoInstance1.createOpportunity(tenantA, propA, {
      leadName: 'Durable Persistence Lead',
      leadEmail: 'durable@firestore.com',
      leadPhone: '+55 11 91234-5678',
      stage: 'proposal',
      temperature: 'hot',
      estimatedValue: 7800,
      ownerName: 'Vendedora Helena'
    });

    expect(createdOpp).toBeDefined();
    expect(createdOpp.opportunityId).toBeDefined();

    // 3. Destruir referência em memória
    repoInstance1 = null;

    // 4. Criar nova instância do repositório
    const repoInstance2 = new SalesRepository();

    // 5. Recuperar a oportunidade pela nova instância
    const retrieved = await repoInstance2.getOpportunityById(createdOpp.opportunityId, tenantA, propA);

    // 6. Confirmar persistência real
    expect(retrieved).not.toBeNull();
    expect(retrieved?.opportunityId).toBe(createdOpp.opportunityId);
    expect(retrieved?.leadName).toBe('Durable Persistence Lead');
    expect(retrieved?.leadEmail).toBe('durable@firestore.com');
    expect(retrieved?.estimatedValue).toBe(7800);
    expect(retrieved?.stage).toBe('proposal');
    expect(retrieved?.temperature).toBe('hot');
    expect(retrieved?.ownerName).toBe('Vendedora Helena');
  });

  // 17. Regressão com SalesService, Interações e Follow-ups
  it('17. deve integrar perfeitamente com SalesService para registro de interações, follow-ups e dashboard', async () => {
    const service = new SalesService(repository);

    // Criar oportunidade via service
    const opp = await service.createOpportunity(tenantA, propA, {
      leadName: 'VIP Corporate Group',
      leadEmail: 'vip@corp.com',
      estimatedValue: 15000,
      stage: 'negotiation',
      temperature: 'hot',
      ownerName: 'Lucas (Comercial)'
    });

    // Registrar interação
    const withInteraction = await service.addInteraction(opp.opportunityId, tenantA, propA, {
      type: 'whatsapp',
      summary: 'Cliente solicitou faturamento para 30 dias',
      authorName: 'Lucas (Comercial)'
    });

    expect(withInteraction?.interactions.length).toBe(1);
    expect(withInteraction?.interactions[0].type).toBe('whatsapp');
    expect(withInteraction?.interactions[0].summary).toBe('Cliente solicitou faturamento para 30 dias');

    // Agendar follow-up
    const withFollowUp = await service.scheduleFollowUp(opp.opportunityId, tenantA, propA, {
      dueDate: '2026-08-20',
      time: '11:00',
      priority: 'urgent',
      actionDescription: 'Enviar contrato assinado'
    });

    expect(withFollowUp?.nextFollowUp?.actionDescription).toBe('Enviar contrato assinado');
    expect(withFollowUp?.nextFollowUp?.priority).toBe('urgent');

    // Verificar Dashboard do CRM
    const dashboard = await service.getDashboard(tenantA, propA);
    expect(dashboard).toBeDefined();
    expect(dashboard.summary.totalOpportunities).toBeGreaterThanOrEqual(1);
    expect(dashboard.topOpportunities.some(o => o.opportunityId === opp.opportunityId)).toBe(true);
  });
});
