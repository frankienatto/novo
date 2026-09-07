import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { RoomRepository } from './roomRepository';
import { RoomCategory, RoomUnit, RoomStatus } from './pmsTypes';
import { PmsService } from './pmsService';

// In-memory Firestore store for unit test environment
const mockFirestoreStore: Record<string, Record<string, any>> = {
  roomCategories: {},
  rooms: {},
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

describe('RoomRepository - Firestore Persistence Tests', () => {
  let repo: RoomRepository;

  const orgA = `org_test_a_${Date.now()}`;
  const propA = `prop_test_a_${Date.now()}`;

  const orgB = `org_test_b_${Date.now()}`;
  const propB = `prop_test_b_${Date.now()}`;

  const cat1Id = `cat_suite_${Date.now()}`;
  const cat2Id = `cat_std_${Date.now()}`;
  const unit1Id = `uh_101_${Date.now()}`;
  const unit2Id = `uh_102_${Date.now()}`;

  beforeAll(() => {
    repo = new RoomRepository();
  });

  afterAll(async () => {
    await repo.deleteCategory?.(orgA, propA, cat1Id);
    await repo.deleteCategory?.(orgA, propA, cat2Id);
    await repo.deleteUnit?.(orgA, propA, unit1Id);
    await repo.deleteUnit?.(orgA, propA, unit2Id);
  });

  // 1. Create RoomCategory
  it('1. create RoomCategory', async () => {
    const cat: RoomCategory = {
      categoryId: cat1Id,
      organizationId: orgA,
      propertyId: propA,
      name: 'Suíte Master Vista Mar',
      code: 'SMVM',
      description: 'Suíte de alto padrão',
      capacity: {
        standardAdults: 2,
        maxAdults: 2,
        maxChildren: 1,
        totalCapacity: 3,
      },
      basePrice: 550,
      beds: [{ type: 'king', count: 1 }],
      amenities: ['Wi-Fi', 'Ar-Condicionado'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.saveCategory(cat);
    expect(saved.categoryId).toBe(cat1Id);
    expect(saved.name).toBe('Suíte Master Vista Mar');
  });

  // 2. Get RoomCategory
  it('2. get RoomCategory', async () => {
    const fetched = await repo.findCategoryById(orgA, propA, cat1Id);
    expect(fetched).not.toBeNull();
    expect(fetched?.categoryId).toBe(cat1Id);
    expect(fetched?.code).toBe('SMVM');

    const fetchedByCode = await repo.findCategoryByCode(orgA, propA, 'SMVM');
    expect(fetchedByCode).not.toBeNull();
    expect(fetchedByCode?.categoryId).toBe(cat1Id);
  });

  // 3. Update RoomCategory
  it('3. update RoomCategory', async () => {
    const updated = await repo.updateCategory(orgA, propA, cat1Id, {
      name: 'Suíte Master Vista Mar Premium',
      basePrice: 600,
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Suíte Master Vista Mar Premium');
    expect(updated?.basePrice).toBe(600);

    const recheck = await repo.findCategoryById(orgA, propA, cat1Id);
    expect(recheck?.name).toBe('Suíte Master Vista Mar Premium');
  });

  // 4. Delete RoomCategory
  it('4. delete RoomCategory', async () => {
    const tempCatId = `cat_temp_${Date.now()}`;
    await repo.saveCategory({
      categoryId: tempCatId,
      organizationId: orgA,
      propertyId: propA,
      name: 'Categoria Temporária',
      code: 'TEMP',
      capacity: { standardAdults: 1, maxAdults: 1, maxChildren: 0, totalCapacity: 1 },
      basePrice: 100,
      beds: [],
      amenities: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.deleteCategory?.(orgA, propA, tempCatId);
    expect(deleted).toBe(true);

    const check = await repo.findCategoryById(orgA, propA, tempCatId);
    expect(check).toBeNull();
  });

  // 5. List RoomCategories
  it('5. list RoomCategories', async () => {
    await repo.saveCategory({
      categoryId: cat2Id,
      organizationId: orgA,
      propertyId: propA,
      name: 'Standard Casal',
      code: 'STDC',
      capacity: { standardAdults: 2, maxAdults: 2, maxChildren: 0, totalCapacity: 2 },
      basePrice: 300,
      beds: [{ type: 'queen', count: 1 }],
      amenities: ['Wi-Fi'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const list = await repo.findCategories(orgA, propA);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((c) => c.categoryId === cat1Id)).toBe(true);
    expect(list.some((c) => c.categoryId === cat2Id)).toBe(true);
  });

  // 6. Create RoomUnit
  it('6. create RoomUnit', async () => {
    const unit: RoomUnit = {
      unitId: unit1Id,
      organizationId: orgA,
      propertyId: propA,
      categoryId: cat1Id,
      unitNumber: '101',
      floor: '1º Andar',
      block: 'Bloco A',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.saveUnit(unit);
    expect(saved.unitId).toBe(unit1Id);
    expect(saved.unitNumber).toBe('101');
  });

  // 7. Get RoomUnit
  it('7. get RoomUnit', async () => {
    const fetched = await repo.findUnitById(orgA, propA, unit1Id);
    expect(fetched).not.toBeNull();
    expect(fetched?.unitId).toBe(unit1Id);
    expect(fetched?.unitNumber).toBe('101');

    const fetchedByNum = await repo.findUnitByNumber(orgA, propA, '101');
    expect(fetchedByNum).not.toBeNull();
    expect(fetchedByNum?.unitId).toBe(unit1Id);
  });

  // 8. Update RoomUnit
  it('8. update RoomUnit', async () => {
    const updated = await repo.updateUnit(orgA, propA, unit1Id, {
      floor: '2º Andar',
      status: 'dirty',
    });

    expect(updated).not.toBeNull();
    expect(updated?.floor).toBe('2º Andar');
    expect(updated?.status).toBe('dirty');

    // Test updateUnitStatus
    const statusUpdated = await repo.updateUnitStatus(orgA, propA, unit1Id, 'inspected');
    expect(statusUpdated?.status).toBe('inspected');
  });

  // 9. Delete RoomUnit
  it('9. delete RoomUnit', async () => {
    const tempUnitId = `uh_temp_${Date.now()}`;
    await repo.saveUnit({
      unitId: tempUnitId,
      organizationId: orgA,
      propertyId: propA,
      categoryId: cat1Id,
      unitNumber: '999',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.deleteUnit?.(orgA, propA, tempUnitId);
    expect(deleted).toBe(true);

    const check = await repo.findUnitById(orgA, propA, tempUnitId);
    expect(check).toBeNull();
  });

  // 10. List RoomUnits
  it('10. list RoomUnits', async () => {
    await repo.saveUnit({
      unitId: unit2Id,
      organizationId: orgA,
      propertyId: propA,
      categoryId: cat2Id,
      unitNumber: '102',
      floor: '1º Andar',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const allUnits = await repo.findUnits(orgA, propA);
    expect(allUnits.length).toBeGreaterThanOrEqual(2);

    const cat1Units = await repo.findUnits(orgA, propA, cat1Id);
    expect(cat1Units.every((u) => u.categoryId === cat1Id)).toBe(true);
  });

  // 11. Tenant A não acessa tenant B
  it('11. tenant A não acessa tenant B', async () => {
    const catBId = `cat_b_${Date.now()}`;
    await repo.saveCategory({
      categoryId: catBId,
      organizationId: orgB,
      propertyId: propB,
      name: 'Categoria Tenant B',
      code: 'CATB',
      capacity: { standardAdults: 2, maxAdults: 2, maxChildren: 0, totalCapacity: 2 },
      basePrice: 400,
      beds: [],
      amenities: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const unitBId = `uh_b_${Date.now()}`;
    await repo.saveUnit({
      unitId: unitBId,
      organizationId: orgB,
      propertyId: propB,
      categoryId: catBId,
      unitNumber: '201B',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Tenant A querying Tenant B entities
    const catFromTenantA = await repo.findCategoryById(orgA, propA, catBId);
    expect(catFromTenantA).toBeNull();

    const unitFromTenantA = await repo.findUnitById(orgA, propA, unitBId);
    expect(unitFromTenantA).toBeNull();

    const listCatA = await repo.findCategories(orgA, propA);
    expect(listCatA.some((c) => c.categoryId === catBId)).toBe(false);

    const listUnitA = await repo.findUnits(orgA, propA);
    expect(listUnitA.some((u) => u.unitId === unitBId)).toBe(false);

    // Cleanup
    await repo.deleteCategory?.(orgB, propB, catBId);
    await repo.deleteUnit?.(orgB, propB, unitBId);
  });

  // 12. Alteração de organizationId é rejeitada
  it('12. alteração de organizationId é rejeitada', async () => {
    await expect(
      repo.updateCategory(orgA, propA, cat1Id, {
        organizationId: 'malicious_org',
      } as any)
    ).rejects.toThrow();

    await expect(
      repo.updateUnit(orgA, propA, unit1Id, {
        organizationId: 'malicious_org',
      } as any)
    ).rejects.toThrow();
  });

  // 13. Alteração de propertyId é rejeitada
  it('13. alteração de propertyId é rejeitada', async () => {
    await expect(
      repo.updateCategory(orgA, propA, cat1Id, {
        propertyId: 'malicious_prop',
      } as any)
    ).rejects.toThrow();

    await expect(
      repo.updateUnit(orgA, propA, unit1Id, {
        propertyId: 'malicious_prop',
      } as any)
    ).rejects.toThrow();
  });

  // 14. Entidade inexistente
  it('14. entidade inexistente', async () => {
    const nonCat = await repo.findCategoryById(orgA, propA, 'cat_non_existent_999');
    expect(nonCat).toBeNull();

    const nonUnit = await repo.findUnitById(orgA, propA, 'uh_non_existent_999');
    expect(nonUnit).toBeNull();

    const updateNonCat = await repo.updateCategory(orgA, propA, 'cat_non_existent_999', { name: 'X' });
    expect(updateNonCat).toBeNull();

    const updateNonUnit = await repo.updateUnit(orgA, propA, 'uh_non_existent_999', { unitNumber: 'X' });
    expect(updateNonUnit).toBeNull();
  });

  // 15. PERSISTÊNCIA REAL: Sobrevive à recriação da instância
  it('15. persistência após recriação da instância', async () => {
    const persistCatId = `cat_persist_${Date.now()}`;
    const persistUnitId = `uh_persist_${Date.now()}`;

    // A. Gravar usando a instância original
    await repo.saveCategory({
      categoryId: persistCatId,
      organizationId: orgA,
      propertyId: propA,
      name: 'Durable Category',
      code: 'DURCAT',
      capacity: { standardAdults: 2, maxAdults: 2, maxChildren: 0, totalCapacity: 2 },
      basePrice: 500,
      beds: [],
      amenities: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await repo.saveUnit({
      unitId: persistUnitId,
      organizationId: orgA,
      propertyId: propA,
      categoryId: persistCatId,
      unitNumber: '555',
      status: 'clean',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // B. Destruir/Criar uma nova instância do repositório
    const freshRepoInstance = new RoomRepository();

    // C. Recuperar os dados com a nova instância
    const fetchedCat = await freshRepoInstance.findCategoryById(orgA, propA, persistCatId);
    const fetchedUnit = await freshRepoInstance.findUnitById(orgA, propA, persistUnitId);

    // D. Validar persistência durável
    expect(fetchedCat).not.toBeNull();
    expect(fetchedCat?.categoryId).toBe(persistCatId);
    expect(fetchedCat?.name).toBe('Durable Category');

    expect(fetchedUnit).not.toBeNull();
    expect(fetchedUnit?.unitId).toBe(persistUnitId);
    expect(fetchedUnit?.unitNumber).toBe('555');

    // Cleanup
    await freshRepoInstance.deleteCategory?.(orgA, propA, persistCatId);
    await freshRepoInstance.deleteUnit?.(orgA, propA, persistUnitId);
  });

  // 16. Regressão dos consumidores do PMS (PmsService)
  it('16. regressão dos consumidores do PMS (PmsService)', async () => {
    const pmsService = new PmsService(repo);

    // List categories via PMS service
    const categories = await pmsService.listCategories(orgA, propA);
    expect(categories.length).toBeGreaterThanOrEqual(1);

    // Get category by ID
    const cat = await pmsService.getCategoryById(orgA, propA, cat1Id);
    expect(cat.name).toContain('Suíte Master');

    // List units via PMS service
    const units = await pmsService.listUnits(orgA, propA);
    expect(units.length).toBeGreaterThanOrEqual(1);

    // Inventory summary
    const summary = await pmsService.getInventorySummary(orgA, propA);
    expect(summary.totalCategories).toBeGreaterThanOrEqual(1);
    expect(summary.totalUnits).toBeGreaterThanOrEqual(1);
  });
});
