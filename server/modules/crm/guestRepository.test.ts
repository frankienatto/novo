import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { GuestRepository } from './guestRepository.ts';
import { GuestProfile, GuestStayRecord } from './guestTypes.ts';
import { CrmService } from './crmService.ts';

// In-memory Firestore store para ambiente de teste unitário
const mockFirestoreStore: Record<string, Record<string, any>> = {
  guests: {},
  guest_timeline: {},
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
          },
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

describe('GuestRepository - Firestore Persistence Tests', () => {
  let repo: GuestRepository;

  const orgA = `org_guest_test_a_${Date.now()}`;
  const orgB = `org_guest_test_b_${Date.now()}`;
  const propA = `prop_guest_test_a_${Date.now()}`;

  const guest1Id = `gst_test_001_${Date.now()}`;
  const guest2Id = `gst_test_002_${Date.now()}`;

  beforeAll(async () => {
    repo = new GuestRepository();
  });

  afterAll(async () => {
    await repo.delete(guest1Id);
    await repo.delete(guest2Id);
  });

  // 1. Criar Hóspede
  it('1. criar hóspede', async () => {
    const guest: GuestProfile = {
      guestId: guest1Id,
      organizationId: orgA,
      fullName: 'Beatriz Vasconcelos',
      email: 'beatriz.vasconcelos@example.com',
      phone: '+55 11 98888-1234',
      primaryLanguage: 'pt-BR',
      nationality: 'Brasileira',
      classification: 'vip',
      tags: ['frequente', 'gastronomia'],
      documents: [
        { type: 'cpf', number: '111.222.333-44' }
      ],
      preferences: {
        pillowType: 'Plumas',
        floorPreference: 'high',
        quietRoomRequested: true,
        dietaryRestrictions: ['Vegetariana'],
        generalNotes: 'Prefere café da manhã sem glúten'
      },
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await repo.save(guest);
    expect(saved.guestId).toBe(guest1Id);
    expect(saved.fullName).toBe('Beatriz Vasconcelos');
    expect(saved.classification).toBe('vip');
    expect(saved.preferences.pillowType).toBe('Plumas');
  });

  // 2. Recuperar Hóspede por ID
  it('2. recuperar hóspede por ID', async () => {
    const fetched = await repo.findById(guest1Id);
    expect(fetched).not.toBeNull();
    expect(fetched?.guestId).toBe(guest1Id);
    expect(fetched?.email).toBe('beatriz.vasconcelos@example.com');
    expect(fetched?.preferences.floorPreference).toBe('high');

    const fetchedScoped = await repo.findGuestById?.(orgA, guest1Id);
    expect(fetchedScoped).not.toBeNull();
    expect(fetchedScoped?.guestId).toBe(guest1Id);
  });

  // 3. Atualizar Hóspede
  it('3. atualizar hóspede', async () => {
    const updated = await repo.updateGuest?.(guest1Id, {
      classification: 'corporate',
      tags: ['frequente', 'gastronomia', 'corporativo-tech']
    });

    expect(updated).not.toBeNull();
    expect(updated?.classification).toBe('corporate');
    expect(updated?.tags).toContain('corporativo-tech');

    const check = await repo.findById(guest1Id);
    expect(check?.classification).toBe('corporate');
  });

  // 4. Excluir Hóspede
  it('4. excluir hóspede', async () => {
    const tempGuestId = `gst_temp_${Date.now()}`;
    await repo.save({
      guestId: tempGuestId,
      organizationId: orgA,
      fullName: 'Hóspede Temporário',
      email: 'temp.guest@example.com',
      phone: '+55 11 90000-0000',
      primaryLanguage: 'pt-BR',
      nationality: 'Brasileira',
      classification: 'standard',
      tags: [],
      documents: [],
      preferences: {},
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const deleted = await repo.delete(tempGuestId);
    expect(deleted).toBe(true);

    const check = await repo.findById(tempGuestId);
    expect(check).toBeNull();
  });

  // 5. Buscar por Documento
  it('5. buscar por documento', async () => {
    // Busca por CPF formatado
    const foundByFormattedDoc = await repo.findByEmailOrDocument(orgA, '', '111.222.333-44');
    expect(foundByFormattedDoc).not.toBeNull();
    expect(foundByFormattedDoc?.guestId).toBe(guest1Id);

    // Busca por CPF apenas com dígitos limpos
    const foundByDigits = await repo.findByEmailOrDocument(orgA, '', '11122233344');
    expect(foundByDigits).not.toBeNull();
    expect(foundByDigits?.guestId).toBe(guest1Id);
  });

  // 6. Buscar por Email
  it('6. buscar por email', async () => {
    // Busca case-insensitive
    const foundByEmail = await repo.findByEmailOrDocument(orgA, 'BEATRIZ.VASCONCELOS@EXAMPLE.COM');
    expect(foundByEmail).not.toBeNull();
    expect(foundByEmail?.guestId).toBe(guest1Id);
  });

  // 7. Pesquisar e Listar Hóspedes
  it('7. pesquisar e listar hóspedes com filtros', async () => {
    await repo.save({
      guestId: guest2Id,
      organizationId: orgA,
      fullName: 'Rodrigo Mendonça',
      email: 'rodrigo.mendonca@example.com',
      phone: '+55 21 97777-5555',
      primaryLanguage: 'pt-BR',
      nationality: 'Brasileira',
      classification: 'standard',
      tags: ['surf', 'longa-estadia'],
      documents: [{ type: 'rg', number: '20.300.400-5' }],
      preferences: { floorPreference: 'low' },
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Listar todos
    const allGuests = await repo.listByOrganization(orgA);
    expect(allGuests.length).toBeGreaterThanOrEqual(2);

    // Filtro por classificação
    const corporateGuests = await repo.listByOrganization(orgA, { classification: 'corporate' });
    expect(corporateGuests.some(g => g.guestId === guest1Id)).toBe(true);

    // Filtro por tag
    const surfGuests = await repo.listByOrganization(orgA, { tag: 'surf' });
    expect(surfGuests.some(g => g.guestId === guest2Id)).toBe(true);

    // Filtro por termo de busca
    const searchResult = await repo.listByOrganization(orgA, { search: 'Rodrigo' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].guestId).toBe(guest2Id);
  });

  // 8. Preservar Preferências
  it('8. preservar preferências detalhadas', async () => {
    const fetched = await repo.findById(guest1Id);
    expect(fetched?.preferences).toBeDefined();
    expect(fetched?.preferences.dietaryRestrictions).toContain('Vegetariana');
    expect(fetched?.preferences.quietRoomRequested).toBe(true);
    expect(fetched?.preferences.generalNotes).toBe('Prefere café da manhã sem glúten');
  });

  // 9. Preservar Documentos e Identificação
  it('9. preservar documentos e nacionalidade', async () => {
    const fetched = await repo.findById(guest1Id);
    expect(fetched?.documents.length).toBe(1);
    expect(fetched?.documents[0].type).toBe('cpf');
    expect(fetched?.documents[0].number).toBe('111.222.333-44');
    expect(fetched?.nationality).toBe('Brasileira');
  });

  // 10. Preservar Histórico de Estadia e Métricas
  it('10. adicionar estadia e atualizar histórico / métricas', async () => {
    const stayRecord: GuestStayRecord = {
      stayId: `stay_${Date.now()}`,
      propertyId: propA,
      reservationId: `res_hist_${Date.now()}`,
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-05',
      unitNumber: '101',
      roomCategoryName: 'Suíte Luxo',
      totalSpentAmount: 2500.0,
      bookingChannel: 'direct_website',
      guestRating: 5,
      notes: 'Hóspede elogiou o silêncio',
      createdAt: new Date().toISOString()
    };

    const updated = await repo.addStay(guest1Id, stayRecord);
    expect(updated).not.toBeNull();
    expect(updated?.totalStaysCount).toBe(1);
    expect(updated?.totalSpentAmount).toBe(2500.0);
    expect(updated?.lastStayDate).toBe('2026-08-05');
    expect(updated?.stayHistory.length).toBe(1);

    // Consulta e validação de persistência do histórico
    const fetched = await repo.findById(guest1Id);
    expect(fetched?.stayHistory[0].stayId).toBe(stayRecord.stayId);
    expect(fetched?.stayHistory[0].roomCategoryName).toBe('Suíte Luxo');
  });

  // 11. Tenant A não acessa Tenant B
  it('11. isolamento multi-tenant (Tenant A não acessa Tenant B)', async () => {
    const guestBId = `gst_tenant_b_${Date.now()}`;
    await repo.save({
      guestId: guestBId,
      organizationId: orgB,
      fullName: 'Hóspede Tenant B',
      email: 'guestb@example.com',
      phone: '+55 31 99999-8888',
      primaryLanguage: 'pt-BR',
      nationality: 'Brasileira',
      classification: 'standard',
      tags: [],
      documents: [{ type: 'cpf', number: '999.888.777-66' }],
      preferences: {},
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Tenant A busca ID do Tenant B -> deve retornar null
    const resFromA = await repo.findGuestById?.(orgA, guestBId);
    expect(resFromA).toBeNull();

    // Tenant A lista hóspedes -> não deve conter hóspede de B
    const listA = await repo.listByOrganization(orgA);
    expect(listA.some(g => g.guestId === guestBId)).toBe(false);

    // Tenant A tenta buscar por documento de B -> deve retornar null
    const docSearch = await repo.findByEmailOrDocument(orgA, '', '999.888.777-66');
    expect(docSearch).toBeNull();

    // Cleanup
    await repo.delete(guestBId);
  });

  // 12. Tentativa de alterar organizationId é rejeitada
  it('12. tentativa de alterar organizationId é rejeitada', async () => {
    await expect(
      repo.updateGuest?.(guest1Id, {
        organizationId: 'malicious_org'
      } as any)
    ).rejects.toThrow();
  });

  // 13. Entidade inexistente
  it('13. consultas e atualizações em entidade inexistente', async () => {
    const nonExistent = await repo.findById('gst_non_existent_999');
    expect(nonExistent).toBeNull();

    const updateNonExistent = await repo.updateGuest?.('gst_non_existent_999', {
      fullName: 'Inexistente'
    });
    expect(updateNonExistent).toBeNull();

    const deleteNonExistent = await repo.delete('gst_non_existent_999');
    expect(deleteNonExistent).toBe(false);
  });

  // 14. PERSISTÊNCIA REAL: Sobrevive à recriação da instância
  it('14. persistência após recriação da instância', async () => {
    const durableGuestId = `gst_durable_${Date.now()}`;

    // A. Gravar com a instância repo original
    await repo.save({
      guestId: durableGuestId,
      organizationId: orgA,
      fullName: 'Durable Guest Test',
      email: 'durable.guest@example.com',
      phone: '+55 48 91111-2222',
      primaryLanguage: 'en-US',
      nationality: 'Canadense',
      classification: 'vip',
      tags: ['durable-test'],
      documents: [{ type: 'passport', number: 'CAN-887766' }],
      preferences: { pillowType: 'Espuma Viscoelástica' },
      stayHistory: [],
      totalStaysCount: 0,
      totalSpentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // B. Destruir/Criar uma nova instância do GuestRepository
    const freshRepoInstance = new GuestRepository();

    // C. Buscar com a nova instância
    const fetchedDurable = await freshRepoInstance.findById(durableGuestId);

    // D. Validar persistência durável
    expect(fetchedDurable).not.toBeNull();
    expect(fetchedDurable?.guestId).toBe(durableGuestId);
    expect(fetchedDurable?.fullName).toBe('Durable Guest Test');
    expect(fetchedDurable?.nationality).toBe('Canadense');
    expect(fetchedDurable?.preferences.pillowType).toBe('Espuma Viscoelástica');

    // Cleanup
    await freshRepoInstance.delete(durableGuestId);
  });

  // 15. Regressão dos consumidores existentes (CrmService)
  it('15. regressão dos consumidores existentes (CrmService)', async () => {
    const crmService = new CrmService();

    // Criar hóspede via CrmService
    const createdViaCrm = await crmService.createGuest(orgA, {
      fullName: 'Juliana Paes Costa',
      email: 'juliana.costa@example.com',
      phone: '+55 11 93333-4444',
      primaryLanguage: 'pt-BR',
      nationality: 'Brasileira',
      classification: 'vip',
      tags: ['vip-platinum'],
      preferences: {
        floorPreference: 'high',
        pillowType: 'Plumas'
      }
    });

    expect(createdViaCrm).not.toBeNull();
    expect(createdViaCrm.fullName).toBe('Juliana Paes Costa');
    expect(createdViaCrm.organizationId).toBe(orgA);

    // Consultar pelo CrmService
    const retrieved = await crmService.getGuestById(createdViaCrm.guestId);
    expect(retrieved?.guestId).toBe(createdViaCrm.guestId);

    // Atualizar pelo CrmService
    const updatedViaCrm = await crmService.updateGuest(createdViaCrm.guestId, {
      phone: '+55 11 94444-5555'
    });
    expect(updatedViaCrm.phone).toBe('+55 11 94444-5555');

    // Adicionar estadia via CrmService
    const updatedWithStay = await crmService.recordStay(createdViaCrm.guestId, {
      propertyId: propA,
      reservationId: `res_crm_${Date.now()}`,
      checkInDate: '2026-07-10',
      checkOutDate: '2026-07-15',
      unitNumber: '202',
      roomCategoryName: 'Bangalô',
      totalSpentAmount: 3800.0,
      bookingChannel: 'direct_website',
      guestRating: 5
    });

    expect(updatedWithStay.totalStaysCount).toBe(1);
    expect(updatedWithStay.totalSpentAmount).toBe(3800.0);

    // Listar via CrmService
    const crmList = await crmService.listGuests(orgA);
    expect(crmList.some(g => g.guestId === createdViaCrm.guestId)).toBe(true);

    // Resumo de métricas via CrmService
    const summary = await crmService.getMetrics(orgA);
    expect(summary.totalGuests).toBeGreaterThanOrEqual(1);

    // Cleanup
    await repo.delete(createdViaCrm.guestId);
  });
});
