import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { OrganizationRepository } from './organizationRepository';
import { Organization, Property, SaaSUser, IntegrationConfig } from './saasTypes';

// Shared Firestore in-memory storage for test environment mimicking Firestore Admin SDK
const mockFirestoreStore: Record<string, Record<string, any>> = {
  organizations: {},
  properties: {},
  users: {},
  integrations: {},
};

function createMockFirestore() {
  return {
    collection: (collectionName: string) => {
      if (!mockFirestoreStore[collectionName]) {
        mockFirestoreStore[collectionName] = {};
      }
      const col = mockFirestoreStore[collectionName];

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
        }),
        where: (field: string, op: string, val: any) => ({
          get: async () => {
            const matches = Object.values(col).filter((item: any) => {
              if (op === '==') {
                return item[field] === val;
              }
              return false;
            });
            return {
              empty: matches.length === 0,
              docs: matches.map((data) => ({
                data: () => JSON.parse(JSON.stringify(data)),
              })),
            };
          },
        }),
      };
    },
  };
}

vi.mock('../../config/firebaseAdmin', () => ({
  getAdminFirestore: () => createMockFirestore(),
}));

describe('OrganizationRepository - Firestore Persistence Tests', () => {
  let repo: OrganizationRepository;

  const testOrgId = `test_org_${Date.now()}`;
  const testPropId = `test_prop_${Date.now()}`;
  const testUserId = `test_user_${Date.now()}`;
  const testUserEmail = `test_${Date.now()}@synapse.com`;

  const secondOrgId = `second_org_${Date.now()}`;

  beforeAll(() => {
    repo = new OrganizationRepository();
  });

  afterAll(async () => {
    // Cleanup test records
    await repo.deleteOrganization(testOrgId);
    await repo.deleteOrganization(secondOrgId);
    await repo.deleteProperty(testPropId);
    await repo.deleteUser(testUserId);
  });

  it('1. criar Organization', async () => {
    const org: Organization = {
      organizationId: testOrgId,
      name: 'Test Org Firestore',
      plan: 'pro',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await repo.createOrganization(org);
    expect(created.organizationId).toBe(testOrgId);
    expect(created.name).toBe('Test Org Firestore');
  });

  it('2. recuperar Organization', async () => {
    const retrieved = await repo.getOrganizationById(testOrgId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.organizationId).toBe(testOrgId);
    expect(retrieved?.name).toBe('Test Org Firestore');
  });

  it('3. atualizar Organization', async () => {
    const updated = await repo.updateOrganization({
      organizationId: testOrgId,
      name: 'Test Org Firestore Updated',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(updated.name).toBe('Test Org Firestore Updated');
    expect(updated.plan).toBe('enterprise');

    const retrieved = await repo.getOrganizationById(testOrgId);
    expect(retrieved?.name).toBe('Test Org Firestore Updated');
    expect(retrieved?.plan).toBe('enterprise');
  });

  it('4. deletar Organization', async () => {
    const tempOrgId = `temp_org_${Date.now()}`;
    await repo.createOrganization({
      organizationId: tempOrgId,
      name: 'Temp Org',
      plan: 'starter',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await repo.deleteOrganization(tempOrgId);
    expect(deleted).toBe(true);

    const retrieved = await repo.getOrganizationById(tempOrgId);
    expect(retrieved).toBeNull();
  });

  it('5. criar Property', async () => {
    const prop: Property = {
      propertyId: testPropId,
      organizationId: testOrgId,
      name: 'Beach Villa Test',
      type: 'pousada',
      roomsCount: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await repo.createProperty(prop);
    expect(created.propertyId).toBe(testPropId);
    expect(created.organizationId).toBe(testOrgId);
  });

  it('6. recuperar Property', async () => {
    const retrieved = await repo.getPropertyById(testPropId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.propertyId).toBe(testPropId);
    expect(retrieved?.name).toBe('Beach Villa Test');

    const listByOrg = await repo.getPropertiesByOrganizationId(testOrgId);
    expect(listByOrg.some((p) => p.propertyId === testPropId)).toBe(true);
  });

  it('7. atualizar Property', async () => {
    const updated = await repo.updateProperty({
      propertyId: testPropId,
      organizationId: testOrgId,
      name: 'Beach Villa Test Updated',
      type: 'hotel',
      roomsCount: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(updated.name).toBe('Beach Villa Test Updated');
    expect(updated.roomsCount).toBe(15);

    const retrieved = await repo.getPropertyById(testPropId);
    expect(retrieved?.name).toBe('Beach Villa Test Updated');
  });

  it('8. criar User', async () => {
    const user: SaaSUser = {
      userId: testUserId,
      organizationId: testOrgId,
      propertyIds: [testPropId],
      name: 'User Firestore Test',
      email: testUserEmail,
      role: 'owner',
      permissions: ['manage_org', 'manage_properties'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await repo.createUser(user);
    expect(created.userId).toBe(testUserId);
    expect(created.email).toBe(testUserEmail);
  });

  it('9. recuperar User por UID', async () => {
    const retrieved = await repo.getUserById(testUserId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe(testUserId);
    expect(retrieved?.name).toBe('User Firestore Test');
  });

  it('10. recuperar User por email', async () => {
    const retrieved = await repo.getUserByEmail(testUserEmail);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe(testUserId);
    expect(retrieved?.email).toBe(testUserEmail);
  });

  it('11. atualizar User', async () => {
    const updated = await repo.updateUser({
      userId: testUserId,
      organizationId: testOrgId,
      propertyIds: [testPropId],
      name: 'User Firestore Test Updated',
      email: testUserEmail,
      role: 'admin',
      permissions: ['manage_org', 'manage_properties', 'manage_users'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(updated.name).toBe('User Firestore Test Updated');
    expect(updated.role).toBe('admin');

    const retrieved = await repo.getUserById(testUserId);
    expect(retrieved?.role).toBe('admin');
  });

  it('12. organização inexistente', async () => {
    const retrieved = await repo.getOrganizationById('non_existent_org_99999');
    expect(retrieved).toBeNull();
  });

  it('13. propriedade inexistente', async () => {
    const retrieved = await repo.getPropertyById('non_existent_prop_99999');
    expect(retrieved).toBeNull();
  });

  it('14. usuário inexistente', async () => {
    const retrieved = await repo.getUserById('non_existent_user_99999');
    expect(retrieved).toBeNull();
  });

  it('15. isolamento entre organizações', async () => {
    await repo.createOrganization({
      organizationId: secondOrgId,
      name: 'Second Org',
      plan: 'starter',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const secondPropId = `second_prop_${Date.now()}`;
    await repo.createProperty({
      propertyId: secondPropId,
      organizationId: secondOrgId,
      name: 'Second Org Prop',
      type: 'hotel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const propsOrg1 = await repo.getPropertiesByOrganizationId(testOrgId);
    const propsOrg2 = await repo.getPropertiesByOrganizationId(secondOrgId);

    expect(propsOrg1.every((p) => p.organizationId === testOrgId)).toBe(true);
    expect(propsOrg2.every((p) => p.organizationId === secondOrgId)).toBe(true);
    expect(propsOrg1.some((p) => p.propertyId === secondPropId)).toBe(false);

    await repo.deleteProperty(secondPropId);
  });

  it('16. VERIFICAÇÃO DE PERSISTÊNCIA: persistência após destruir/recriar a instância do repository', async () => {
    // A. Criar uma entidade com a instância atual
    const persistOrgId = `persist_org_${Date.now()}`;
    await repo.saveOrganization({
      organizationId: persistOrgId,
      name: 'Durable Persistence Org',
      plan: 'pro',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // B. Destruir/Criar uma nova instância do repository do zero
    const newRepoInstance = new OrganizationRepository();

    // C. Recuperar a entidade usando a nova instância
    const fetched = await newRepoInstance.getOrganizationById(persistOrgId);

    // D. Confirmar que os dados continuam presentes no Firestore independente da instância de memória
    expect(fetched).not.toBeNull();
    expect(fetched?.organizationId).toBe(persistOrgId);
    expect(fetched?.name).toBe('Durable Persistence Org');

    // Cleanup
    await newRepoInstance.deleteOrganization(persistOrgId);
  });
});
