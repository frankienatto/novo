import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ReservationRepository } from './reservationRepository';
import { Reservation, CreateReservationDTO, ReservationFilterDTO } from './reservationTypes';
import { ReservationService } from './reservationService';
import { RoomRepository } from './roomRepository';

// In-memory Firestore store for unit test environment
const mockFirestoreStore: Record<string, Record<string, any>> = {
  bookings: {},
  rooms: {},
  roomCategories: {},
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

describe('ReservationRepository - Firestore Persistence Tests', () => {
  let repo: ReservationRepository;
  let roomRepo: RoomRepository;

  const orgA = `org_res_test_a_${Date.now()}`;
  const propA = `prop_res_test_a_${Date.now()}`;

  const orgB = `org_res_test_b_${Date.now()}`;
  const propB = `prop_res_test_b_${Date.now()}`;

  const res1Id = `res_unit_001_${Date.now()}`;
  const res2Id = `res_unit_002_${Date.now()}`;

  beforeAll(async () => {
    repo = new ReservationRepository();
    roomRepo = new RoomRepository();
  });

  afterAll(async () => {
    await repo.deleteReservation?.(orgA, propA, res1Id);
    await repo.deleteReservation?.(orgA, propA, res2Id);
  });

  // 1. Create Reservation
  it('1. create reservation', async () => {
    const res: Reservation = {
      reservationId: res1Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'uh_101',
      categoryId: 'cat_suite_luxo',
      guest: {
        guestId: 'gst_101',
        fullName: 'Mariana Costa',
        email: 'mariana.costa@example.com',
        phone: '+55 21 99888-7766',
        documentId: '987.654.321-99',
        documentType: 'cpf',
      },
      stayPeriod: {
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-05',
        numberOfNights: 4,
      },
      adultsCount: 2,
      childrenCount: 1,
      status: 'confirmed',
      source: 'direct_website',
      paymentStatus: 'paid',
      totalAmount: 1800.0,
      notes: 'Check-in tardio solicitado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.saveReservation(res);
    expect(saved.reservationId).toBe(res1Id);
    expect(saved.guest.fullName).toBe('Mariana Costa');
    expect(saved.totalAmount).toBe(1800.0);
  });

  // 2. Get Reservation
  it('2. get reservation', async () => {
    const fetched = await repo.findReservationById(orgA, propA, res1Id);
    expect(fetched).not.toBeNull();
    expect(fetched?.reservationId).toBe(res1Id);
    expect(fetched?.guest.email).toBe('mariana.costa@example.com');
    expect(fetched?.stayPeriod.numberOfNights).toBe(4);
  });

  // 3. Update Reservation
  it('3. update reservation', async () => {
    const updated = await repo.updateReservation(orgA, propA, res1Id, {
      status: 'checked_in',
      notes: 'Hóspede realizou check-in às 14:00',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('checked_in');
    expect(updated?.notes).toBe('Hóspede realizou check-in às 14:00');

    const check = await repo.findReservationById(orgA, propA, res1Id);
    expect(check?.status).toBe('checked_in');
  });

  // 4. Delete Reservation
  it('4. delete reservation', async () => {
    const tempResId = `res_temp_${Date.now()}`;
    await repo.saveReservation({
      reservationId: tempResId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'uh_999',
      categoryId: 'cat_test',
      guest: { guestId: 'gst_tmp', fullName: 'Temp Guest', email: 'tmp@example.com' },
      stayPeriod: { checkInDate: '2026-10-01', checkOutDate: '2026-10-02', numberOfNights: 1 },
      adultsCount: 1,
      childrenCount: 0,
      status: 'cancelled',
      source: 'phone',
      paymentStatus: 'refunded',
      totalAmount: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.deleteReservation?.(orgA, propA, tempResId);
    expect(deleted).toBe(true);

    const check = await repo.findReservationById(orgA, propA, tempResId);
    expect(check).toBeNull();
  });

  // 5. List Reservations
  it('5. list reservations', async () => {
    await repo.saveReservation({
      reservationId: res2Id,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'uh_102',
      categoryId: 'cat_bangalo_jardim',
      guest: {
        guestId: 'gst_102',
        fullName: 'Roberto Albuquerque',
        email: 'roberto.albuquerque@example.com',
      },
      stayPeriod: {
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-15',
        numberOfNights: 5,
      },
      adultsCount: 2,
      childrenCount: 0,
      status: 'confirmed',
      source: 'ota_generic',
      paymentStatus: 'pending',
      totalAmount: 3100.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const list = await repo.findReservations(orgA, propA);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((r) => r.reservationId === res1Id)).toBe(true);
    expect(list.some((r) => r.reservationId === res2Id)).toBe(true);
  });

  // 6. Busca por Hóspede (nome ou e-mail)
  it('6. busca por hóspede', async () => {
    const searchByName = await repo.findReservations(orgA, propA, {
      guestName: 'Mariana',
    });
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].reservationId).toBe(res1Id);

    const searchByEmail = await repo.findReservations(orgA, propA, {
      guestName: 'roberto.albuquerque',
    });
    expect(searchByEmail.length).toBe(1);
    expect(searchByEmail[0].reservationId).toBe(res2Id);
  });

  // 7. Busca por Propriedade / Filtro por Categoria e UH
  it('7. busca por propriedade e filtros de categoria / unidade', async () => {
    const filterUnit = await repo.findReservations(orgA, propA, { unitId: 'uh_101' });
    expect(filterUnit.every((r) => r.unitId === 'uh_101')).toBe(true);

    const filterCategory = await repo.findReservations(orgA, propA, { categoryId: 'cat_bangalo_jardim' });
    expect(filterCategory.every((r) => r.categoryId === 'cat_bangalo_jardim')).toBe(true);
  });

  // 8. Filtros por Status
  it('8. filtros por status', async () => {
    const checkedInList = await repo.findReservations(orgA, propA, { status: 'checked_in' });
    expect(checkedInList.some((r) => r.reservationId === res1Id)).toBe(true);

    const confirmedList = await repo.findReservations(orgA, propA, { status: 'confirmed' });
    expect(confirmedList.some((r) => r.reservationId === res2Id)).toBe(true);
  });

  // 9. Filtro por Datas / Período
  it('9. filtros por período de estadia', async () => {
    const inRange = await repo.findReservations(orgA, propA, {
      startDate: '2026-09-01',
      endDate: '2026-09-06',
    });
    expect(inRange.some((r) => r.reservationId === res1Id)).toBe(true);

    const outOfRange = await repo.findReservations(orgA, propA, {
      startDate: '2026-12-01',
      endDate: '2026-12-31',
    });
    expect(outOfRange.length).toBe(0);
  });

  // 10. Conflitos de Reservas (findConflictingReservations)
  it('10. detecção de reservas conflitantes (prevenção de overbooking)', async () => {
    // res1 está em uh_101 de 2026-09-01 a 2026-09-05 (status: checked_in)
    // Conflito exato
    const conflicts1 = await repo.findConflictingReservations(
      orgA,
      propA,
      'uh_101',
      '2026-09-02',
      '2026-09-04'
    );
    expect(conflicts1.length).toBe(1);
    expect(conflicts1[0].reservationId).toBe(res1Id);

    // Sem conflito (período posterior)
    const conflicts2 = await repo.findConflictingReservations(
      orgA,
      propA,
      'uh_101',
      '2026-09-05',
      '2026-09-10'
    );
    expect(conflicts2.length).toBe(0);

    // Excluindo a própria reserva da checagem
    const conflictsExcluded = await repo.findConflictingReservations(
      orgA,
      propA,
      'uh_101',
      '2026-09-02',
      '2026-09-04',
      res1Id
    );
    expect(conflictsExcluded.length).toBe(0);
  });

  // 11. Preservação de PaymentSummary e Valores Monetários
  it('11. integridade de valores monetários e status de pagamento', async () => {
    const fetched = await repo.findReservationById(orgA, propA, res1Id);
    expect(fetched?.totalAmount).toBe(1800.0);
    expect(typeof fetched?.totalAmount).toBe('number');
    expect(fetched?.paymentStatus).toBe('paid');
  });

  // 12. Tenant A não acessa Tenant B
  it('12. tenant A não acessa tenant B', async () => {
    const resBId = `res_tenant_b_${Date.now()}`;
    await repo.saveReservation({
      reservationId: resBId,
      organizationId: orgB,
      propertyId: propB,
      unitId: 'uh_201B',
      categoryId: 'cat_b',
      guest: { guestId: 'gst_b', fullName: 'Guest B', email: 'guestb@example.com' },
      stayPeriod: { checkInDate: '2026-09-01', checkOutDate: '2026-09-05', numberOfNights: 4 },
      adultsCount: 2,
      childrenCount: 0,
      status: 'confirmed',
      source: 'direct_website',
      paymentStatus: 'paid',
      totalAmount: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Tenant A consulta ID do Tenant B -> deve retornar null
    const resFromA = await repo.findReservationById(orgA, propA, resBId);
    expect(resFromA).toBeNull();

    // Tenant A lista reservas -> não deve conter a reserva de B
    const listA = await repo.findReservations(orgA, propA);
    expect(listA.some((r) => r.reservationId === resBId)).toBe(false);

    // Cleanup
    await repo.deleteReservation?.(orgB, propB, resBId);
  });

  // 13. Tentativa de alterar organizationId é rejeitada
  it('13. tentativa de alterar organizationId é rejeitada', async () => {
    await expect(
      repo.updateReservation(orgA, propA, res1Id, {
        organizationId: 'malicious_org',
      } as any)
    ).rejects.toThrow();
  });

  // 14. Tentativa de alterar propertyId é rejeitada
  it('14. tentativa de alterar propertyId é rejeitada', async () => {
    await expect(
      repo.updateReservation(orgA, propA, res1Id, {
        propertyId: 'malicious_prop',
      } as any)
    ).rejects.toThrow();
  });

  // 15. Reservation inexistente
  it('15. reservation inexistente', async () => {
    const nonExistent = await repo.findReservationById(orgA, propA, 'res_non_existent_999');
    expect(nonExistent).toBeNull();

    const updateNonExistent = await repo.updateReservation(orgA, propA, 'res_non_existent_999', {
      notes: 'test',
    });
    expect(updateNonExistent).toBeNull();
  });

  // 16. PERSISTÊNCIA REAL: Sobrevive à recriação da instância
  it('16. persistência após recriação da instância', async () => {
    const durableResId = `res_durable_${Date.now()}`;

    // A. Gravar com a instância repo original
    await repo.saveReservation({
      reservationId: durableResId,
      organizationId: orgA,
      propertyId: propA,
      unitId: 'uh_101',
      categoryId: 'cat_suite_luxo',
      guest: {
        guestId: 'gst_dur',
        fullName: 'Durable Guest Test',
        email: 'durable@example.com',
      },
      stayPeriod: {
        checkInDate: '2026-11-01',
        checkOutDate: '2026-11-05',
        numberOfNights: 4,
      },
      adultsCount: 2,
      childrenCount: 0,
      status: 'confirmed',
      source: 'direct_website',
      paymentStatus: 'paid',
      totalAmount: 1600.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // B. Destruir/Criar uma nova instância do ReservationRepository
    const freshRepoInstance = new ReservationRepository();

    // C. Buscar a reserva com a nova instância
    const fetchedDurable = await freshRepoInstance.findReservationById(orgA, propA, durableResId);

    // D. Validar persistência durável
    expect(fetchedDurable).not.toBeNull();
    expect(fetchedDurable?.reservationId).toBe(durableResId);
    expect(fetchedDurable?.guest.fullName).toBe('Durable Guest Test');
    expect(fetchedDurable?.totalAmount).toBe(1600.0);

    // Cleanup
    await freshRepoInstance.deleteReservation?.(orgA, propA, durableResId);
  });

  // 17. Regressão dos consumidores existentes (ReservationService)
  it('17. regressão dos consumidores existentes (ReservationService)', async () => {
    // Configurar quarto e categoria válidos para o teste de criação via ReservationService
    const catId = `cat_res_srv_${Date.now()}`;
    const unitId = `uh_res_srv_${Date.now()}`;

    await roomRepo.saveCategory({
      categoryId: catId,
      organizationId: orgA,
      propertyId: propA,
      name: 'Categoria Suite Service',
      code: 'CSS',
      capacity: { standardAdults: 2, maxAdults: 2, maxChildren: 1, totalCapacity: 3 },
      basePrice: 500,
      beds: [{ type: 'king', count: 1 }],
      amenities: ['Wi-Fi'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await roomRepo.saveUnit({
      unitId,
      organizationId: orgA,
      propertyId: propA,
      categoryId: catId,
      unitNumber: '301S',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const srv = new ReservationService(repo, roomRepo);

    // Criar reserva via ReservationService
    const newRes = await srv.createReservation(orgA, propA, {
      unitId,
      guest: {
        fullName: 'Fernanda Lima',
        email: 'fernanda.lima@example.com',
        phone: '+55 11 91234-5678',
      },
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-14',
      adultsCount: 2,
      childrenCount: 0,
      notes: 'Andar silencioso',
    });

    expect(newRes).not.toBeNull();
    expect(newRes.totalAmount).toBe(2000); // 4 noites * 500
    expect(newRes.guest.fullName).toBe('Fernanda Lima');

    // Consultar pelo ReservationService
    const retrieved = await srv.getReservationById(orgA, propA, newRes.reservationId);
    expect(retrieved.reservationId).toBe(newRes.reservationId);

    // Listar pelo ReservationService
    const list = await srv.listReservations(orgA, propA);
    expect(list.some((r) => r.reservationId === newRes.reservationId)).toBe(true);

    // Testar bloqueio de conflito / overbooking via ReservationService
    await expect(
      srv.createReservation(orgA, propA, {
        unitId,
        guest: {
          fullName: 'Conflitante Hóspede',
          email: 'conflito@example.com',
        },
        checkInDate: '2026-10-12',
        checkOutDate: '2026-10-15',
        adultsCount: 2,
      })
    ).rejects.toThrow(/Overbooking impedido/);

    // Cancelar reserva via ReservationService
    const cancelled = await srv.cancelReservation(orgA, propA, newRes.reservationId, 'Mudança de planos');
    expect(cancelled.status).toBe('cancelled');

    // Cleanup
    await repo.deleteReservation?.(orgA, propA, newRes.reservationId);
    await roomRepo.deleteCategory?.(orgA, propA, catId);
    await roomRepo.deleteUnit?.(orgA, propA, unitId);
  });
});
